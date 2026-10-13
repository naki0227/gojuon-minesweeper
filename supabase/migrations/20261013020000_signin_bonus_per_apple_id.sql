-- The 3-gem welcome bonus is once per Apple ID, not once per Supabase
-- account: deleting the account and signing in again with the same Apple ID
-- must not grant it again. Claims are kept by a SHA-256 hash of Apple's
-- stable user identifier (`sub`) and survive account deletion; nothing else
-- about the person is stored.
create table public.gem_signin_bonus_claims (
  apple_sub_hash text primary key,
  claimed_at timestamptz not null default now()
);
alter table public.gem_signin_bonus_claims enable row level security;
revoke all on public.gem_signin_bonus_claims from anon, authenticated;

create function public.gem_apple_sub_hash(p_apple_sub text) returns text
language sql immutable set search_path = ''
as $$
  select pg_catalog.encode(
    pg_catalog.sha256(pg_catalog.convert_to(p_apple_sub, 'UTF8')), 'hex'
  )
$$;

-- Accounts that already got the bonus keep their Apple ID claimed.
do $$
begin
  if pg_catalog.to_regclass('auth.identities') is not null then
    insert into public.gem_signin_bonus_claims (apple_sub_hash)
    select distinct public.gem_apple_sub_hash(i.provider_id)
    from auth.identities i
    join public.gem_ledger l
      on l.user_id = i.user_id and l.reason = 'apple_signin_bonus'
    where i.provider = 'apple'
    on conflict do nothing;
  end if;
end $$;

drop function public.gem_credit_apple_signin_bonus(uuid);

-- Returns the balance. Without an Apple ID (null) nothing is granted.
create function public.gem_credit_apple_signin_bonus(
  p_user_id uuid, p_apple_sub text
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_user_id is null then
    raise exception 'Invalid welcome grant';
  end if;
  insert into public.gem_wallets (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  select balance into v_balance from public.gem_wallets
    where user_id = p_user_id for update;
  if p_apple_sub is null or p_apple_sub = '' then
    return v_balance;
  end if;
  insert into public.gem_signin_bonus_claims (apple_sub_hash)
    values (public.gem_apple_sub_hash(p_apple_sub))
    on conflict (apple_sub_hash) do nothing;
  if not found then
    return v_balance;
  end if;
  insert into public.gem_ledger (user_id, delta, reason, source_key)
    values (p_user_id, 3, 'apple_signin_bonus', 'apple-signin-bonus:' || p_user_id::text)
    on conflict (source_key) do nothing;
  if found then
    update public.gem_wallets
      set balance = balance + 3, updated_at = pg_catalog.now()
      where user_id = p_user_id returning balance into v_balance;
  end if;
  return v_balance;
end;
$$;

revoke all on function public.gem_apple_sub_hash(text)
  from public, anon, authenticated;
grant execute on function public.gem_apple_sub_hash(text) to service_role;
revoke all on function public.gem_credit_apple_signin_bonus(uuid, text)
  from public, anon, authenticated;
grant execute on function public.gem_credit_apple_signin_bonus(uuid, text)
  to service_role;
