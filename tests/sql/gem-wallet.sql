\set ON_ERROR_STOP on
-- Minimal Supabase Auth emulation in the CI PostgreSQL service.
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

\i supabase/migrations/20261012203000_gem_wallet.sql

insert into auth.users (id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  gems integer;
begin
  -- One credited transaction; duplicates cannot mint extra gems.
  gems := public.credit_verified_gem_purchase(uid,'20000001000001',
    'com.naki0227.gojuonminesweeper.gems10','Sandbox',1760000000000);
  if gems <> 10 then raise exception 'first purchase should give ten'; end if;
  gems := public.credit_verified_gem_purchase(uid,'20000001000001',
    'com.naki0227.gojuonminesweeper.gems10','Sandbox',1760000000000);
  if gems <> 10 then raise exception 'duplicate receipt credited twice'; end if;
  begin
    perform public.credit_verified_gem_purchase(other,'20000001000001',
      'com.naki0227.gojuonminesweeper.gems10','Sandbox',1760000000000);
    raise exception 'transaction was stolen by another account';
  exception when others then
    if sqlerrm = 'transaction was stolen by another account' then raise; end if;
  end;

  gems := public.spend_gems(uid, 3, 'revive', 'run_abc:revive:3');
  if gems <> 7 then raise exception 'revive debit wrong'; end if;
  gems := public.spend_gems(uid, 3, 'revive', 'run_abc:revive:3');
  if gems <> 7 then raise exception 'duplicate revival charged twice'; end if;
  gems := public.spend_gems(uid, 1, 'hint', 'run_abc:hint:0');
  if gems <> 6 then raise exception 'hint debit wrong'; end if;
  begin
    perform public.spend_gems(uid, 3, 'revive', 'run_abc:hint:0');
    raise exception 'idempotency key used for different reason';
  exception when others then
    if sqlerrm = 'idempotency key used for different reason' then raise; end if;
  end;
  begin
    perform public.spend_gems(uid, 3, 'revive', 'run_abc:revive:4');
    perform public.spend_gems(uid, 3, 'revive', 'run_abc:revive:5');
    perform public.spend_gems(uid, 1, 'hint', 'run_abc:hint:1');
    raise exception 'negative wallet balance accepted';
  exception when others then
    if sqlerrm = 'negative wallet balance accepted' then raise; end if;
  end;
  select balance into gems from public.gem_wallets where user_id = uid;
  if gems < 0 then raise exception 'negative balance'; end if;
  if (select count(*) from public.gem_purchases) <> 1 then
    raise exception 'purchase ledger duplicate';
  end if;
  if has_function_privilege('authenticated',
       'public.spend_gems(uuid,integer,text,text)', 'EXECUTE')
     or has_function_privilege('anon',
       'public.credit_verified_gem_purchase(uuid,text,text,text,bigint)', 'EXECUTE')
  then raise exception 'user has privileged wallet RPC access'; end if;
  if has_table_privilege('authenticated','public.gem_wallets','INSERT')
     or has_table_privilege('authenticated','public.gem_ledger','UPDATE')
  then raise exception 'client has balance write access'; end if;
end $$;
