-- Gem currency is authoritative on the server. Never trust client-side grants.
create table public.gem_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table public.gem_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('apple_purchase','safe_hint','revive')),
  source_key text not null unique,
  created_at timestamptz not null default now()
);
create index gem_ledger_user_recent on public.gem_ledger (user_id, id desc);
-- Keep consumed transaction IDs even after account deletion to prevent reuse.
create table public.gem_apple_purchases (
  transaction_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null,
  environment text not null check (environment in ('Production','Sandbox')),
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.gem_wallets enable row level security;
alter table public.gem_ledger enable row level security;
alter table public.gem_apple_purchases enable row level security;
create policy gem_wallet_owner_read on public.gem_wallets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy gem_ledger_owner_read on public.gem_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.gem_wallets, public.gem_ledger, public.gem_apple_purchases
  from anon, authenticated;
grant select on public.gem_wallets, public.gem_ledger to authenticated;

-- Only the trusted Edge Function (service role) may call these invoker RPCs.
-- Call this only after Apple's API confirms the purchase and appAccountToken.
create function public.gem_credit_apple_purchase(
  p_user_id uuid, p_transaction_id text, p_product_id text,
  p_environment text, p_purchased_at timestamptz
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_existing_user uuid;
  v_balance integer;
begin
  if p_user_id is null or p_transaction_id is null
     or p_transaction_id !~ '^[0-9]{10,40}$'
     or p_product_id <> 'com.naki0227.gojuonminesweeper.gems10'
     or p_environment not in ('Production','Sandbox')
     or p_purchased_at is null then
    raise exception 'Invalid Apple purchase';
  end if;
  insert into public.gem_wallets (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  perform 1 from public.gem_wallets where user_id = p_user_id for update;
  insert into public.gem_apple_purchases
    (transaction_id, user_id, product_id, environment, purchased_at)
  values (p_transaction_id, p_user_id, p_product_id, p_environment, p_purchased_at)
  on conflict (transaction_id) do nothing;
  if found then
    insert into public.gem_ledger (user_id, delta, reason, source_key)
      values (p_user_id, 10, 'apple_purchase', 'apple:' || p_transaction_id);
    update public.gem_wallets
      set balance = balance + 10, updated_at = pg_catalog.now()
      where user_id = p_user_id returning balance into v_balance;
    return v_balance;
  end if;
  select user_id into v_existing_user from public.gem_apple_purchases
    where transaction_id = p_transaction_id;
  if v_existing_user is distinct from p_user_id then
    raise exception 'Apple transaction already assigned';
  end if;
  select balance into v_balance from public.gem_wallets where user_id = p_user_id;
  return v_balance;
end;
$$;

-- Row lock serializes concurrent spend attempts; request ID makes retries safe.
create function public.gem_spend(
  p_user_id uuid, p_request_id uuid, p_reason text
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_cost integer;
  v_key text;
  v_balance integer;
  v_existing_reason text;
begin
  if p_user_id is null or p_request_id is null
     or p_reason not in ('safe_hint','revive') then
    raise exception 'Invalid gem spend';
  end if;
  v_cost := case p_reason when 'safe_hint' then 1 else 3 end;
  v_key := 'spend:' || p_user_id::text || ':' || p_request_id::text;
  insert into public.gem_wallets (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  select balance into v_balance from public.gem_wallets
    where user_id = p_user_id for update;
  select reason into v_existing_reason from public.gem_ledger
    where source_key = v_key;
  if found then
    if v_existing_reason <> p_reason then
      raise exception 'Conflicting idempotency key';
    end if;
    return v_balance;
  end if;
  if v_balance < v_cost then
    raise exception 'Insufficient gems';
  end if;
  insert into public.gem_ledger (user_id, delta, reason, source_key)
    values (p_user_id, -v_cost, p_reason, v_key);
  update public.gem_wallets
    set balance = balance - v_cost, updated_at = pg_catalog.now()
    where user_id = p_user_id returning balance into v_balance;
  return v_balance;
end;
$$;
revoke all on function public.gem_credit_apple_purchase(uuid,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.gem_credit_apple_purchase(uuid,text,text,text,timestamptz)
  to service_role;
revoke all on function public.gem_spend(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.gem_spend(uuid,uuid,text) to service_role;
