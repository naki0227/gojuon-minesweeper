-- Run against an empty local PostgreSQL 17 database with:
-- psql -X -v ON_ERROR_STOP=1 -f tests/sql/online-commits.sql
begin;

create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  'select null::uuid';
create publication supabase_realtime;

\ir ../../supabase/migrations/20261007000000_online_play.sql
\ir ../../supabase/migrations/20261013000000_atomic_online_commits.sql

do $$
declare
  a uuid := '00000000-0000-0000-0000-000000000001';
  b uuid := '00000000-0000-0000-0000-000000000002';
  c uuid := '00000000-0000-0000-0000-000000000003';
  fn text;
  rid uuid;
  r public.online_rooms;
  later timestamptz := now() + interval '90 seconds';
begin
  foreach fn in array array[
    'public.online_commit_game(uuid,integer,jsonb,jsonb,text,timestamptz,text,boolean)',
    'public.online_begin_game(uuid,uuid[],jsonb,jsonb,timestamptz)',
    'public.online_start_game(uuid,uuid,jsonb,jsonb,timestamptz)',
    'public.online_request_rematch(uuid,uuid,integer,jsonb,jsonb,timestamptz)'
  ] loop
    if has_function_privilege('authenticated', fn, 'EXECUTE')
      or has_function_privilege('anon', fn, 'EXECUTE') then
      raise exception 'Clients can call %', fn;
    end if;
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise exception 'Service role cannot call %', fn;
    end if;
  end loop;

  insert into public.online_rooms (kind, code, players, filters)
  values ('code', 'test', array[a], '{}')
  returning id into rid;

  -- Joining starts both halves of the game together; a second joiner loses.
  r := public.online_start_game(rid, b, '{"g":1}', '{"p":1}', later);
  if r.status <> 'playing' or r.players <> array[a, b] or r.version <> 1 then
    raise exception 'Join did not start the game: %', r;
  end if;
  if (select version from public.online_room_secrets where room_id = r.id)
    <> 1 then
    raise exception 'Hidden state version differs from the room';
  end if;
  r := public.online_start_game(rid, c, '{}', '{}', later);
  if r.id is not null then
    raise exception 'A third player took a started room';
  end if;

  -- A move commits both rows; a stale version writes nothing.
  r := public.online_commit_game(
    rid, 1, '{"g":2}', '{"p":2}', 'playing', later, null, false
  );
  if r.version <> 2 or r.public_state <> '{"p":2}' then
    raise exception 'Move was not committed: %', r;
  end if;
  r := public.online_commit_game(
    rid, 1, '{"g":"stale"}', '{"p":"stale"}', 'playing', later, null, false
  );
  if r.id is not null
    or (select state from public.online_room_secrets where room_id = rid
        limit 1) <> '{"g":2}' then
    raise exception 'Stale move overwrote the game';
  end if;

  -- A timeout claim needs the current deadline to have passed.
  r := public.online_commit_game(
    rid, 2, '{"g":"timeout"}', '{}', 'finished', null, 'timeout', true
  );
  if r.id is not null then
    raise exception 'Timeout accepted before the deadline';
  end if;
  update public.online_rooms
  set turn_deadline = now() - interval '1 second' where id = rid;

  -- If the hidden row is out of step, neither row changes.
  update public.online_room_secrets set version = 9 where room_id = rid;
  begin
    perform public.online_commit_game(
      rid, 2, '{}', '{"p":"half"}', 'playing', later, null, false
    );
    raise exception 'Expected out-of-sync failure';
  exception when raise_exception then
    if sqlerrm not like '%out of sync%' then
      raise;
    end if;
  end;
  if (select public_state from public.online_rooms where id = rid)
    <> '{"p":2}' then
    raise exception 'Public state changed without the hidden state';
  end if;
  update public.online_room_secrets set version = 2 where room_id = rid;

  r := public.online_commit_game(
    rid, 2, '{"g":"timeout"}', '{"p":"end"}', 'finished', null,
    'timeout', true
  );
  if r.status <> 'finished' or r.end_reason <> 'timeout'
    or r.turn_deadline is not null or r.version <> 3 then
    raise exception 'Timeout was not committed: %', r;
  end if;

  -- Both rematch flags survive, whoever asks first; the second request
  -- starts the next game with seats swapped.
  r := public.online_request_rematch(rid, b, 3, '{"g":"next"}', '{}', later);
  if r.status <> 'finished' or r.rematch <> array[false, true]
    or r.version <> 3 then
    raise exception 'First rematch flag was not stored: %', r;
  end if;
  r := public.online_request_rematch(rid, c, 3, '{}', '{}', later);
  if r.id is not null then
    raise exception 'A non-player asked for a rematch';
  end if;
  r := public.online_request_rematch(
    rid, a, 3, '{"g":"next"}', '{"p":"next"}', later
  );
  if r.status <> 'playing' or r.players <> array[b, a]
    or r.rematch <> array[false, false] or r.version <> 4
    or r.end_reason is not null then
    raise exception 'Rematch did not start: %', r;
  end if;
  if (select state from public.online_room_secrets where room_id = rid
      limit 1) <> '{"g":"next"}' then
    raise exception 'Rematch did not store the next game';
  end if;

  -- A late rematch request for the old game changes nothing.
  r := public.online_request_rematch(rid, a, 3, '{}', '{}', later);
  if r.id is not null then
    raise exception 'Stale rematch request was applied';
  end if;

  -- Forfeit closes the room.
  r := public.online_commit_game(
    rid, 4, '{}', '{}', 'closed', null, 'forfeit', false
  );
  if r.status <> 'closed' or r.end_reason <> 'forfeit' then
    raise exception 'Forfeit did not close the room: %', r;
  end if;
end;
$$;

rollback;
