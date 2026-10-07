-- Online play: rooms both players can read, and the hidden game state only
-- the `online-game` Edge Function (service role) can touch. Clients never
-- write to these tables directly; every change goes through the function.

create table public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('code', 'random')),
  -- Normalized 合言葉 for kind = 'code'.
  code text,
  -- Language queue for kind = 'random' ('ja', 'en' or 'any').
  match_key text,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'closed')),
  -- Seat order: players[1] is Player 1 (moves first).
  players uuid[] not null,
  filters jsonb not null,
  public_state jsonb,
  version integer not null default 0,
  turn_deadline timestamptz,
  rematch boolean[] not null default array[false, false],
  end_reason text check (end_reason in ('answer', 'draw', 'timeout', 'forfeit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'code' or code is not null),
  check (kind <> 'random' or match_key is not null),
  check (cardinality(players) between 1 and 2)
);

-- Only one room may wait on a given 合言葉 at a time; once it starts, the
-- same word can be used again by someone else.
create unique index online_rooms_waiting_code
  on public.online_rooms (code)
  where status = 'waiting' and kind = 'code';

create index online_rooms_waiting_random
  on public.online_rooms (match_key, created_at)
  where status = 'waiting' and kind = 'random';

create index online_rooms_players on public.online_rooms using gin (players);

create table public.online_room_secrets (
  room_id uuid primary key references public.online_rooms (id) on delete cascade,
  -- Engine state including the question id. Never exposed to clients.
  state jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.online_rooms enable row level security;
alter table public.online_room_secrets enable row level security;

-- Players can read their own rooms (also what Realtime checks before it
-- delivers a change). There are no insert/update/delete policies.
create policy "Players read their rooms"
  on public.online_rooms
  for select
  to authenticated
  using ((select auth.uid()) = any (players));

-- No policy at all on online_room_secrets: only the service role reads it.
revoke all on public.online_room_secrets from anon, authenticated;
revoke insert, update, delete on public.online_rooms from anon, authenticated;

alter publication supabase_realtime add table public.online_rooms;
