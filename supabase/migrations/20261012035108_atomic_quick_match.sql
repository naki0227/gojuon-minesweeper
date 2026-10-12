-- Serialize each language queue and create both halves of a started game in
-- one transaction. Only the authenticated Edge Function's service role calls
-- this; clients have no direct EXECUTE permission.
create function public.quick_match_room(
  p_user_id uuid,
  p_language text,
  p_previous_room_id uuid,
  p_secret_state jsonb,
  p_public_state jsonb,
  p_turn_deadline timestamptz
)
returns public.online_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_own public.online_rooms;
  v_candidate public.online_rooms;
  v_room public.online_rooms;
begin
  if p_user_id is null or p_language is null
    or p_language not in ('ja', 'en', 'any')
    or p_secret_state is null or p_public_state is null
    or p_turn_deadline is null then
    raise exception 'Invalid quick match request';
  end if;

  -- Keep requests by the same user and requests in the same language in a
  -- stable order. The latter prevents two simultaneous newcomers from both
  -- creating a waiting room.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('online-player:' || p_user_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('online-match:' || p_language, 0)
  );

  if p_previous_room_id is not null then
    select * into v_room from public.online_rooms
    where id = p_previous_room_id and kind = 'random'
      and p_user_id = any(players);
    if found and v_room.status in ('playing', 'finished') then
      return v_room;
    end if;
  end if;

  -- An abandoned queue entry is never eligible, even if cleanup has not
  -- physically removed it yet. Active clients renew updated_at every 30s.
  update public.online_rooms
  set status = 'closed', updated_at = pg_catalog.now()
  where kind = 'random' and match_key = p_language
    and status = 'waiting'
    and updated_at < pg_catalog.now() - interval '2 minutes';

  -- A player changing language or entering random matching from a code room
  -- leaves the old queue. Retain only their latest entry for this language.
  select * into v_own from public.online_rooms
  where kind = 'random' and match_key = p_language
    and status = 'waiting' and p_user_id = any(players)
  order by created_at desc limit 1;

  update public.online_rooms
  set status = 'closed', updated_at = pg_catalog.now()
  where status = 'waiting' and p_user_id = any(players)
    and (v_own.id is null or id <> v_own.id);

  select * into v_candidate from public.online_rooms
  where kind = 'random' and match_key = p_language
    and status = 'waiting' and p_user_id <> all(players)
  order by created_at asc limit 1 for update;

  if found then
    if v_own.id is not null then
      update public.online_rooms
      set status = 'closed', updated_at = pg_catalog.now()
      where id = v_own.id;
    end if;

    update public.online_rooms
    set status = 'playing',
        players = array[v_candidate.players[1], p_user_id],
        public_state = p_public_state,
        version = version + 1,
        turn_deadline = p_turn_deadline,
        rematch = array[false, false],
        end_reason = null,
        updated_at = pg_catalog.now()
    where id = v_candidate.id and status = 'waiting'
    returning * into v_room;

    insert into public.online_room_secrets (room_id, state, version)
    values (v_room.id, p_secret_state, v_room.version);
    return v_room;
  end if;

  if v_own.id is not null then
    update public.online_rooms
    set updated_at = pg_catalog.now()
    where id = v_own.id and status = 'waiting'
    returning * into v_room;
    return v_room;
  end if;

  insert into public.online_rooms (kind, match_key, players, filters)
  values (
    'random', p_language, array[p_user_id],
    pg_catalog.jsonb_build_object(
      'language', p_language, 'categories', '[]'::jsonb, 'length', 'any'
    )
  ) returning * into v_room;
  return v_room;
end;
$$;

revoke all on function public.quick_match_room(
  uuid, text, uuid, jsonb, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.quick_match_room(
  uuid, text, uuid, jsonb, jsonb, timestamptz
) to service_role;
