-- Run against an empty local PostgreSQL 17 database with:
-- psql -X -v ON_ERROR_STOP=1 -f tests/sql/quick-match.sql
begin;

create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  'select null::uuid';
create publication supabase_realtime;

\ir ../../supabase/migrations/20261007000000_online_play.sql
\ir ../../supabase/migrations/20261012035108_atomic_quick_match.sql

do $$
declare
  a uuid := '00000000-0000-0000-0000-000000000001';
  b uuid := '00000000-0000-0000-0000-000000000002';
  c uuid := '00000000-0000-0000-0000-000000000003';
  first_room public.online_rooms;
  matched public.online_rooms;
  another public.online_rooms;
begin
  if has_function_privilege(
    'authenticated',
    'public.quick_match_room(uuid,text,uuid,jsonb,jsonb,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated clients can call quick_match_room';
  end if;
  if has_function_privilege(
    'anon',
    'public.quick_match_room(uuid,text,uuid,jsonb,jsonb,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'Anonymous clients can call quick_match_room';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.quick_match_room(uuid,text,uuid,jsonb,jsonb,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'Edge Function service role cannot call quick_match_room';
  end if;

  first_room := public.quick_match_room(
    a, 'ja', null, '{"questionId":"q1"}', '{"prompt":"q1"}', now() + interval '90 seconds'
  );
  if first_room.status <> 'waiting' or first_room.players <> array[a] then
    raise exception 'First player was not queued';
  end if;

  -- A retry by the same player renews the one existing queue entry.
  another := public.quick_match_room(
    a, 'ja', first_room.id, '{}', '{}', now() + interval '90 seconds'
  );
  if another.id <> first_room.id then
    raise exception 'Retry created a duplicate room';
  end if;

  matched := public.quick_match_room(
    b, 'ja', null, '{"questionId":"q2"}', '{"prompt":"q2"}', now() + interval '90 seconds'
  );
  if matched.id <> first_room.id or matched.status <> 'playing'
    or matched.players <> array[a, b] then
    raise exception 'Newcomer did not claim the waiting room';
  end if;
  if not exists (
    select 1 from public.online_room_secrets
    where room_id = matched.id and version = matched.version
      and state ->> 'questionId' = 'q2'
  ) then
    raise exception 'Started game secret was not written';
  end if;

  -- Retrying a completed POST returns its game without another queue entry.
  another := public.quick_match_room(
    a, 'ja', first_room.id, '{}', '{}', now() + interval '90 seconds'
  );
  if another.id <> matched.id or another.status <> 'playing' then
    raise exception 'Previous match could not be recovered';
  end if;

  insert into public.online_rooms (kind, match_key, players, filters, updated_at)
  values ('random', 'en', array[c], '{}', now() - interval '3 minutes');
  another := public.quick_match_room(
    b, 'en', null, '{}', '{}', now() + interval '90 seconds'
  );
  if another.status <> 'waiting' or another.players <> array[b] then
    raise exception 'Expired room was matched';
  end if;
  if not exists (
    select 1 from public.online_rooms
    where kind = 'random' and match_key = 'en'
      and players = array[c] and status = 'closed'
  ) then
    raise exception 'Expired room was not closed';
  end if;

  -- A failed secret write must roll back the public room transition too.
  insert into public.online_room_secrets (room_id, state)
  values (another.id, '{}');
  begin
    perform public.quick_match_room(
      c, 'en', null, '{}', '{}', now() + interval '90 seconds'
    );
    raise exception 'Expected duplicate secret failure';
  exception when unique_violation then
    null;
  end;
  if (select status from public.online_rooms where id = another.id)
    <> 'waiting' then
    raise exception 'Failed secret write partially started the room';
  end if;
end;
$$;

rollback;
