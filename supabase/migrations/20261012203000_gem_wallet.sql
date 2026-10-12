-- Consumable gem economy. All writes are server-side; clients can read only their wallet.
create table public.gem_wallets (
  user_id uuid primary key references auth.users (id) on delete restrict,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.gem_purchases (
  transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete restrict,
  product_id text not null,
  environment text not null check (environment in ('Production','Sandbox','Xcode')),
  purchase_date_ms bigint not null,
  created_at timestamptz not null default now()
);

create table public.gem_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason text not null,
  reference_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reference_key)
);

create index gem_ledger_user_created_idx on public.gem_ledger (user_id, created_at desc);

alter table public.gem_wallets enable row level security;
alter table public.gem_purchases enable row level security;
alter table public.gem_ledger enable row level security;

create policy "Users see own gem wallet"
  on public.gem_wallets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users see own gem history"
  on public.gem_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.gem_wallets, public.gem_purchases, public.gem_ledger from anon, authenticated;
grant select on public.gem_wallets, public.gem_ledger to authenticated;

-- Only the trusted Edge Function's service_role can call these routines.
-- SECURITY DEFINER is necessary for one-transaction purchase/spend updates.
create function public.credit_verified_gem_purchase(
  p_user_id uuid, p_transaction_id text, p_product_id text,
  p_environment text, p_purchase_date_ms bigint
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  claimed boolean;
  existing_owner uuid;
  new_balance integer;
begin
  if p_user_id is null or p_product_id <> 'com.naki0227.gojuonminesweeper.gems10'
    or p_transaction_id !~ '^[0-9]{6,30}$'
    or p_environment not in ('Production','Sandbox','Xcode')
    or p_purchase_date_ms < 1000000000000
  then
    raise exception 'Invalid Apple purchase claim';
  end if;

  insert into public.gem_purchases
    (transaction_id, user_id, product_id, environment, purchase_date_ms)
  values
    (p_transaction_id, p_user_id, p_product_id, p_environment, p_purchase_date_ms)
  on conflict (transaction_id) do nothing;
  claimed := found;

  if not claimed then
    select user_id into existing_owner from public.gem_purchases
      where transaction_id = p_transaction_id;
    if existing_owner is distinct from p_user_id then
      raise exception 'Apple transaction belongs to another account';
    end if;
    select balance into new_balance from public.gem_wallets where user_id = p_user_id;
    return coalesce(new_balance, 0);
  end if;

  insert into public.gem_wallets (user_id, balance)
  values (p_user_id, 10)
  on conflict (user_id) do update
    set balance = public.gem_wallets.balance + 10, updated_at = now()
  returning balance into new_balance;

  insert into public.gem_ledger (user_id, delta, reason, reference_key)
  values (p_user_id, 10, 'apple_purchase', 'apple:' || p_transaction_id);
  return new_balance;
end;
$$;

create function public.spend_gems(
  p_user_id uuid, p_amount integer, p_reason text, p_action_id text
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  current_balance integer;
  prior_delta integer;
  prior_reason text;
begin
  if p_user_id is null or
     not ((p_reason = 'hint' and p_amount = 1) or
          (p_reason = 'revive' and p_amount = 3)) or
     p_action_id !~ '^[a-zA-Z0-9:_-]{8,120}$'
  then
    raise exception 'Invalid gem spend';
  end if;

  insert into public.gem_wallets (user_id, balance)
    values (p_user_id, 0) on conflict (user_id) do nothing;
  select balance into current_balance from public.gem_wallets
    where user_id = p_user_id for update;

  select delta, reason into prior_delta, prior_reason from public.gem_ledger
    where user_id = p_user_id and reference_key = 'spend:' || p_action_id;

  if found then
    if prior_delta <> -p_amount or prior_reason <> p_reason then
      raise exception 'Idempotency key reused for a different action';
    end if;
    return current_balance;
  end if;

  if current_balance < p_amount then
    raise exception 'Not enough gems';
  end if;
  update public.gem_wallets
    set balance = balance - p_amount, updated_at = now()
    where user_id = p_user_id
    returning balance into current_balance;

  insert into public.gem_ledger (user_id, delta, reason, reference_key)
    values (p_user_id, -p_amount, p_reason, 'spend:' || p_action_id);
  return current_balance;
end;
$$;

revoke all on function public.credit_verified_gem_purchase(uuid,text,text,text,bigint) from public, anon, authenticated;
revoke all on function public.spend_gems(uuid,integer,text,text) from public, anon, authenticated;
grant execute on function public.credit_verified_gem_purchase(uuid,text,text,text,bigint) to service_role;
grant execute on function public.spend_gems(uuid,integer,text,text) to service_role;
