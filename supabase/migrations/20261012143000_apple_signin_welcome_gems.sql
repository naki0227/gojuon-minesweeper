-- A one-time, server-only welcome gift for accounts verified with Sign in with Apple.
-- Apple authentication is checked by the gem-wallet Edge Function before this RPC.
alter table public.gem_ledger drop constraint gem_ledger_reason_check;
alter table public.gem_ledger add constraint gem_ledger_reason_check
  check (reason in ('apple_purchase','safe_hint','revive','apple_signin_bonus'));

-- Wallet row locking and a unique ledger key keep retries/concurrent calls idempotent.
create function public.gem_credit_apple_signin_bonus(p_user_id uuid)
returns integer
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

-- Do not expose the credit operation as an authenticated or anonymous RPC.
revoke all on function public.gem_credit_apple_signin_bonus(uuid)
  from public, anon, authenticated;
grant execute on function public.gem_credit_apple_signin_bonus(uuid)
  to service_role;
