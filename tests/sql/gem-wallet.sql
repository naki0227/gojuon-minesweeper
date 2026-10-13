\set ON_ERROR_STOP on
-- Minimal Supabase Auth emulation for the CI PostgreSQL service.
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
\i supabase/migrations/20261012115142_gem_wallet.sql
\i supabase/migrations/20261012143000_apple_signin_welcome_gems.sql
insert into auth.users (id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  request_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  gems integer;
begin
  gems := public.gem_credit_apple_purchase(uid,'20000001000001',
    'com.naki0227.gojuonminesweeper.gems10','Sandbox','2026-10-12T00:00:00Z');
  if gems <> 10 then raise exception 'first purchase should credit ten'; end if;
  gems := public.gem_credit_apple_purchase(uid,'20000001000001',
    'com.naki0227.gojuonminesweeper.gems10','Sandbox','2026-10-12T00:00:00Z');
  if gems <> 10 then raise exception 'duplicate purchase credited twice'; end if;
  begin
    perform public.gem_credit_apple_purchase(other,'20000001000001',
      'com.naki0227.gojuonminesweeper.gems10','Sandbox','2026-10-12T00:00:00Z');
    raise exception 'transaction stolen by another account';
  exception when others then
    if sqlerrm = 'transaction stolen by another account' then raise; end if;
  end;
  gems := public.gem_spend(uid, request_id, 'revive');
  if gems <> 7 then raise exception 'revive debit wrong'; end if;
  gems := public.gem_spend(uid, request_id, 'revive');
  if gems <> 7 then raise exception 'duplicate spend charged twice'; end if;
  gems := public.gem_spend(uid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'safe_hint');
  if gems <> 6 then raise exception 'hint debit wrong'; end if;
  begin
    perform public.gem_spend(uid, request_id, 'safe_hint');
    raise exception 'conflicting idempotency accepted';
  exception when others then
    if sqlerrm = 'conflicting idempotency accepted' then raise; end if;
  end;
  begin
    perform public.gem_spend(uid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'revive');
    perform public.gem_spend(uid, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'revive');
    perform public.gem_spend(uid, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'safe_hint');
    raise exception 'negative wallet balance accepted';
  exception when others then
    if sqlerrm = 'negative wallet balance accepted' then raise; end if;
  end;
  select balance into gems from public.gem_wallets where user_id = uid;
  if gems <> 6 then raise exception 'failed spend did not roll back'; end if;
  if (select count(*) from public.gem_apple_purchases) <> 1 then
    raise exception 'duplicate purchase record'; end if;
  if has_function_privilege('authenticated',
       'public.gem_spend(uuid,uuid,text)', 'EXECUTE')
     or has_function_privilege('anon',
       'public.gem_credit_apple_purchase(uuid,text,text,text,timestamptz)', 'EXECUTE')
  then raise exception 'users can execute wallet write RPC'; end if;
  if has_table_privilege('authenticated','public.gem_wallets','INSERT')
     or has_table_privilege('authenticated','public.gem_ledger','UPDATE')
  then raise exception 'client has direct wallet write access'; end if;
end $$;

-- Welcome credit remains exactly three per Apple account even after spend.
do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  gems integer;
begin
  gems := public.gem_credit_apple_signin_bonus(uid);
  if gems <> 9 then raise exception 'first welcome bonus should add three'; end if;
  gems := public.gem_credit_apple_signin_bonus(uid);
  if gems <> 9 then raise exception 'repeated Apple sign-in added extra gems'; end if;
  gems := public.gem_spend(uid, 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'revive');
  if gems <> 6 then raise exception 'bonus gems are not spendable'; end if;
  gems := public.gem_credit_apple_signin_bonus(uid);
  if gems <> 6 then raise exception 'welcome gift was reissued after spending'; end if;
  gems := public.gem_credit_apple_signin_bonus(other);
  if gems <> 3 then raise exception 'second account must get its own bonus'; end if;
  if (select count(*) from public.gem_ledger
      where user_id = uid and reason = 'apple_signin_bonus') <> 1 then
    raise exception 'duplicate welcome ledger rows';
  end if;
  if has_function_privilege('authenticated',
      'public.gem_credit_apple_signin_bonus(uuid)', 'EXECUTE')
    or has_function_privilege('anon',
      'public.gem_credit_apple_signin_bonus(uuid)', 'EXECUTE') then
    raise exception 'client can grant free welcome gems';
  end if;
end $$;

-- Refunds take back up to 10 gems and stop at zero; support grants are
-- once per ticket.
\i supabase/migrations/20261013010000_gem_refunds_and_support.sql
do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  taken integer;
  gems integer;
begin
  update public.gem_wallets set balance = 4 where user_id = uid;
  taken := public.gem_revoke_apple_purchase('20000001000001', now());
  if taken <> 4 then raise exception 'refund should take the 4 left, took %', taken; end if;
  select balance into gems from public.gem_wallets where user_id = uid;
  if gems <> 0 then raise exception 'refund left balance %', gems; end if;
  taken := public.gem_revoke_apple_purchase('20000001000001', now());
  if taken <> 0 then raise exception 'repeated refund took more'; end if;
  if (select clawed_back from public.gem_apple_purchases
      where transaction_id = '20000001000001') <> 4 then
    raise exception 'refund amount not recorded'; end if;
  if public.gem_revoke_apple_purchase('99999999999999', now()) <> 0 then
    raise exception 'unknown transaction refunded'; end if;

  gems := public.gem_credit_apple_purchase(uid,'20000001000002',
    'com.naki0227.gojuonminesweeper.gems10','Sandbox','2026-10-12T00:00:00Z');
  gems := public.gem_support_grant(uid, 3, 'ticket-001');
  taken := public.gem_revoke_apple_purchase('20000001000002', now());
  if taken <> 10 then raise exception 'full refund should take 10'; end if;
  select balance into gems from public.gem_wallets where user_id = uid;
  if gems <> 3 then raise exception 'balance after full refund %', gems; end if;
  gems := public.gem_support_grant(uid, 3, 'ticket-001');
  if gems <> 3 then raise exception 'support ticket granted twice'; end if;
  begin
    perform public.gem_support_grant(uid, 500, 'ticket-002');
    raise exception 'oversized grant accepted';
  exception when others then
    if sqlerrm = 'oversized grant accepted' then raise; end if;
  end;
  if has_function_privilege('authenticated',
       'public.gem_support_grant(uuid,integer,text)', 'EXECUTE')
     or has_function_privilege('authenticated',
       'public.gem_revoke_apple_purchase(text,timestamptz)', 'EXECUTE')
  then raise exception 'users can call refund/support RPC'; end if;

  -- Deleting the account removes the wallet but keeps purchase records.
  delete from auth.users where id = uid;
  if exists (select 1 from public.gem_wallets where user_id = uid) then
    raise exception 'wallet survived account deletion'; end if;
  if (select count(*) from public.gem_apple_purchases where user_id is null) <> 2 then
    raise exception 'purchase records lost on account deletion'; end if;
end $$;
