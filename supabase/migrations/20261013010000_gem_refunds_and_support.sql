-- Refunds, support grants and account deletion for the gem wallet.
--
-- Refund policy: a refunded or revoked 10-gem purchase takes back up to 10
-- gems from the current balance and stops at zero. Gems already spent are
-- written off; the balance never goes negative.
--
-- Support policy: when a crash spent gems without giving the hint or
-- revive, support traces the ledger and grants the gems back by hand with
-- gem_support_grant, once per ticket.

alter table public.gem_ledger drop constraint gem_ledger_reason_check;
alter table public.gem_ledger add constraint gem_ledger_reason_check
  check (reason in (
    'apple_purchase', 'safe_hint', 'revive', 'apple_signin_bonus',
    'apple_refund', 'support_grant'
  ));

alter table public.gem_apple_purchases
  add column revoked_at timestamptz,
  -- Gems actually taken back (0..10); the rest was already spent.
  add column clawed_back integer check (clawed_back between 0 and 10);

-- Idempotent: a repeated notification for the same transaction changes
-- nothing. Returns the gems taken back by this call (0 on repeats).
create function public.gem_revoke_apple_purchase(
  p_transaction_id text, p_revoked_at timestamptz
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_purchase public.gem_apple_purchases;
  v_take integer := 0;
begin
  if p_transaction_id is null or p_revoked_at is null then
    raise exception 'Invalid Apple revocation';
  end if;
  select * into v_purchase from public.gem_apple_purchases
    where transaction_id = p_transaction_id for update;
  if not found or v_purchase.revoked_at is not null then
    return 0;
  end if;

  -- The account may have been deleted; keep the record either way.
  if v_purchase.user_id is not null then
    select least(10, balance) into v_take from public.gem_wallets
      where user_id = v_purchase.user_id for update;
    v_take := coalesce(v_take, 0);
    if v_take > 0 then
      insert into public.gem_ledger (user_id, delta, reason, source_key)
        values (v_purchase.user_id, -v_take, 'apple_refund',
          'apple-refund:' || p_transaction_id);
      update public.gem_wallets
        set balance = balance - v_take, updated_at = pg_catalog.now()
        where user_id = v_purchase.user_id;
    end if;
  end if;

  update public.gem_apple_purchases
    set revoked_at = p_revoked_at, clawed_back = v_take
    where transaction_id = p_transaction_id;
  return v_take;
end;
$$;

-- Manual compensation. `p_ticket` (e.g. the support mail date + number) makes
-- a repeated run a no-op. Returns the balance after the grant.
create function public.gem_support_grant(
  p_user_id uuid, p_amount integer, p_ticket text
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_user_id is null or p_amount is null or p_amount not between 1 and 30
     or p_ticket is null or p_ticket !~ '^[A-Za-z0-9:_-]{3,80}$' then
    raise exception 'Invalid support grant';
  end if;
  insert into public.gem_wallets (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  select balance into v_balance from public.gem_wallets
    where user_id = p_user_id for update;
  insert into public.gem_ledger (user_id, delta, reason, source_key)
    values (p_user_id, p_amount, 'support_grant', 'support:' || p_ticket)
    on conflict (source_key) do nothing;
  if found then
    update public.gem_wallets
      set balance = balance + p_amount, updated_at = pg_catalog.now()
      where user_id = p_user_id returning balance into v_balance;
  end if;
  return v_balance;
end;
$$;

revoke all on function public.gem_revoke_apple_purchase(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.gem_revoke_apple_purchase(text, timestamptz)
  to service_role;
revoke all on function public.gem_support_grant(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.gem_support_grant(uuid, integer, text)
  to service_role;
