-- Every online game transition writes the hidden state and the public room
-- in one transaction, under the room's row lock and version check:
--
-- * online_commit_game: a move, timeout, or forfeit. A timeout also checks
--   the current deadline in the database, so a deadline read before the
--   opponent's move can't end the new turn.
-- * online_start_game: the second player joins a waiting code room.
-- * online_request_rematch: sets one rematch flag without losing the
--   other's, and starts the next game when both flags are set.
--
-- Each returns null when the room moved on (another request won the race);
-- the Edge Function then reports a conflict or returns the latest room.
-- Only the Edge Function's service role may call them.

create function public.online_commit_game(
  p_room_id uuid,
  p_expected_version integer,
  p_secret_state jsonb,
  p_public_state jsonb,
  p_status text,
  p_turn_deadline timestamptz,
  p_end_reason text,
  p_require_expired_deadline boolean
)
returns public.online_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.online_rooms;
begin
  if p_room_id is null or p_expected_version is null
    or p_secret_state is null or p_public_state is null
    or p_status is null or p_status not in ('playing', 'finished', 'closed')
    or p_require_expired_deadline is null then
    raise exception 'Invalid online commit request';
  end if;

  select * into v_room from public.online_rooms
  where id = p_room_id
  for update;

  if not found or v_room.status <> 'playing'
    or v_room.version <> p_expected_version then
    return null;
  end if;
  if p_require_expired_deadline and (
    v_room.turn_deadline is null or v_room.turn_deadline > pg_catalog.now()
  ) then
    return null;
  end if;

  update public.online_room_secrets
  set state = p_secret_state,
      version = p_expected_version + 1,
      updated_at = pg_catalog.now()
  where room_id = p_room_id and version = p_expected_version;
  if not found then
    raise exception 'Online room % hidden state is out of sync', p_room_id;
  end if;

  update public.online_rooms
  set public_state = p_public_state,
      version = p_expected_version + 1,
      status = p_status,
      turn_deadline = p_turn_deadline,
      end_reason = p_end_reason,
      updated_at = pg_catalog.now()
  where id = p_room_id
  returning * into v_room;
  return v_room;
end;
$$;

-- Shared by joining and rematching. The caller holds the room's row lock.
create function public.online_begin_game(
  p_room_id uuid,
  p_players uuid[],
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
  v_room public.online_rooms;
begin
  update public.online_rooms
  set players = p_players,
      status = 'playing',
      public_state = p_public_state,
      version = version + 1,
      turn_deadline = p_turn_deadline,
      rematch = array[false, false],
      end_reason = null,
      updated_at = pg_catalog.now()
  where id = p_room_id
  returning * into v_room;

  insert into public.online_room_secrets (room_id, state, version, updated_at)
  values (p_room_id, p_secret_state, v_room.version, pg_catalog.now())
  on conflict (room_id) do update
  set state = excluded.state,
      version = excluded.version,
      updated_at = excluded.updated_at;
  return v_room;
end;
$$;

create function public.online_start_game(
  p_room_id uuid,
  p_user_id uuid,
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
  v_room public.online_rooms;
begin
  if p_room_id is null or p_user_id is null or p_secret_state is null
    or p_public_state is null or p_turn_deadline is null then
    raise exception 'Invalid online start request';
  end if;

  select * into v_room from public.online_rooms
  where id = p_room_id
  for update;

  if not found or v_room.status <> 'waiting'
    or cardinality(v_room.players) <> 1
    or p_user_id = any(v_room.players) then
    return null;
  end if;

  return public.online_begin_game(
    p_room_id,
    array[v_room.players[1], p_user_id],
    p_secret_state,
    p_public_state,
    p_turn_deadline
  );
end;
$$;

create function public.online_request_rematch(
  p_room_id uuid,
  p_user_id uuid,
  p_expected_version integer,
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
  v_room public.online_rooms;
  v_seat integer;
  v_flags boolean[];
begin
  if p_room_id is null or p_user_id is null or p_expected_version is null
    or p_secret_state is null or p_public_state is null
    or p_turn_deadline is null then
    raise exception 'Invalid online rematch request';
  end if;

  select * into v_room from public.online_rooms
  where id = p_room_id
  for update;

  -- The prepared next game avoids the finished game's question, so it is
  -- only valid for that exact version.
  if not found or v_room.status <> 'finished'
    or v_room.version <> p_expected_version
    or cardinality(v_room.players) <> 2 then
    return null;
  end if;
  v_seat := pg_catalog.array_position(v_room.players, p_user_id);
  if v_seat is null then
    return null;
  end if;

  v_flags := array[
    coalesce(v_room.rematch[1], false),
    coalesce(v_room.rematch[2], false)
  ];
  v_flags[v_seat] := true;

  if not (v_flags[1] and v_flags[2]) then
    update public.online_rooms
    set rematch = v_flags, updated_at = pg_catalog.now()
    where id = p_room_id
    returning * into v_room;
    return v_room;
  end if;

  -- Both agreed: swap seats so the other player moves first.
  return public.online_begin_game(
    p_room_id,
    array[v_room.players[2], v_room.players[1]],
    p_secret_state,
    p_public_state,
    p_turn_deadline
  );
end;
$$;

revoke all on function public.online_commit_game(
  uuid, integer, jsonb, jsonb, text, timestamptz, text, boolean
) from public, anon, authenticated;
revoke all on function public.online_begin_game(
  uuid, uuid[], jsonb, jsonb, timestamptz
) from public, anon, authenticated;
revoke all on function public.online_start_game(
  uuid, uuid, jsonb, jsonb, timestamptz
) from public, anon, authenticated;
revoke all on function public.online_request_rematch(
  uuid, uuid, integer, jsonb, jsonb, timestamptz
) from public, anon, authenticated;

grant execute on function public.online_commit_game(
  uuid, integer, jsonb, jsonb, text, timestamptz, text, boolean
) to service_role;
grant execute on function public.online_begin_game(
  uuid, uuid[], jsonb, jsonb, timestamptz
) to service_role;
grant execute on function public.online_start_game(
  uuid, uuid, jsonb, jsonb, timestamptz
) to service_role;
grant execute on function public.online_request_rematch(
  uuid, uuid, integer, jsonb, jsonb, timestamptz
) to service_role;
