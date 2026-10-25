\set ON_ERROR_STOP on
-- 今日の一問 正解率 (supabase/migrations/20261025000000_daily_results.sql).
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
\i supabase/migrations/20261025000000_daily_results.sql
-- Supabase's service_role bypasses RLS; mirror that here.
alter role service_role bypassrls;
set role service_role;

do $$
declare
  stats jsonb;
begin
  stats := public.daily_result_record('2026-10-25', 'dev-a', 'ip-1', true, 4);
  stats := public.daily_result_record('2026-10-25', 'dev-b', 'ip-1', true, 6);
  stats := public.daily_result_record('2026-10-25', 'dev-c', 'ip-2', false, 9);
  -- A device's first result counts; a later one is ignored.
  stats := public.daily_result_record('2026-10-25', 'dev-c', 'ip-2', true, 2);
  if stats <> '{"players": 3, "solved": 2, "avgMoves": 5.0}'::jsonb then
    raise exception 'unexpected stats %', stats;
  end if;
  -- One network adds at most 20 results a day.
  for i in 1..25 loop
    perform public.daily_result_record('2026-10-26', 'spam-' || i, 'ip-9', true, 1);
  end loop;
  if (public.daily_result_stats('2026-10-26')->>'players')::int <> 20 then
    raise exception 'network cap not applied';
  end if;
  -- Hashes older than 30 days are cleared; the totals stay.
  perform public.daily_result_record('2026-11-30', 'dev-z', 'ip-3', true, 3);
  if exists (select 1 from public.daily_results
             where puzzle_date = '2026-10-25' and device_hash is not null) then
    raise exception 'old hashes kept';
  end if;
  if (public.daily_result_stats('2026-10-25')->>'players')::int <> 3 then
    raise exception 'old totals lost';
  end if;
end $$;
reset role;

do $$
begin
  if has_table_privilege('anon', 'public.daily_results', 'SELECT')
     or has_function_privilege('anon', 'public.daily_result_record(date, text, text, boolean, integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.daily_result_stats(date)', 'EXECUTE')
  then raise exception 'daily results reachable without the service role'; end if;
end $$;
