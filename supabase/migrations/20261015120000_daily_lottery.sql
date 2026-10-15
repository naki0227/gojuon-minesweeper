-- 今日の一問 プレゼント: Apple offer codes for 10 gems, for people who
-- solve the day's puzzle on minesweeper.enludus.com/daily/.
--
-- A correct answer (checked by the daily-lottery Edge Function) gets a
-- 受け取り番号 (ticket), one per device per puzzle. While the release
-- campaign lasts, the first solvers get a code right away (once per device
-- or IP). After that, the day's tickets are drawn after the answer is
-- revealed at 7:00 the next morning; winners see their code by opening the
-- page with their ticket within claim_days.
--
-- Codes come from App Store Connect and are imported by hand into
-- lottery_codes (dashboard, CSV with a `code` header). Nobody but the
-- Edge Function (service role) can read or change any of this.

create table public.lottery_settings (
  id boolean primary key default true check (id),
  instant_remaining integer not null default 100 check (instant_remaining >= 0),
  daily_winners integer not null default 20 check (daily_winners >= 0),
  claim_days integer not null default 3 check (claim_days > 0),
  per_ip_daily integer not null default 10 check (per_ip_daily > 0)
);
insert into public.lottery_settings default values;

-- device_hash and ip_hash are HMACs made by the Edge Function; they are
-- cleared after 30 days (lottery_draw_due).
create table public.lottery_entries (
  id bigint generated always as identity primary key,
  ticket text not null unique check (ticket ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  puzzle_date date not null,
  device_hash text,
  ip_hash text,
  instant boolean not null default false,
  won boolean, -- null until drawn
  claim_by timestamptz,
  claimed_at timestamptz, -- when the code was first shown
  created_at timestamptz not null default now(),
  unique (puzzle_date, device_hash)
);
create index lottery_entries_ip on public.lottery_entries (puzzle_date, ip_hash);
create index lottery_entries_instant on public.lottery_entries (device_hash)
  where instant;
create index lottery_entries_instant_ip on public.lottery_entries (ip_hash)
  where instant;

create table public.lottery_codes (
  code text primary key check (code ~ '^[A-Z0-9]{6,64}$'),
  entry_id bigint unique references public.lottery_entries(id),
  added_at timestamptz not null default now()
);

create table public.lottery_draws (
  puzzle_date date primary key,
  winners integer not null,
  drawn_at timestamptz not null default now()
);

alter table public.lottery_settings enable row level security;
alter table public.lottery_entries enable row level security;
alter table public.lottery_codes enable row level security;
alter table public.lottery_draws enable row level security;
revoke all on public.lottery_settings, public.lottery_entries,
  public.lottery_codes, public.lottery_draws from anon, authenticated;
grant select, insert, update, delete on public.lottery_settings,
  public.lottery_entries, public.lottery_codes, public.lottery_draws
  to service_role;

-- The next unused code, locked for the caller's transaction.
create function public.lottery_take_code() returns text
language sql security invoker set search_path = ''
as $$
  select c.code from public.lottery_codes c
  where c.entry_id is null
  order by c.added_at, c.code
  limit 1
  for update skip locked;
$$;

-- Enters a correct answer. Returns {ticket, won, code}: won is true with
-- the code for a release-campaign winner, null while waiting for the draw.
-- Entering again from the same device returns the first entry.
create function public.lottery_enter(
  p_date date, p_ticket text, p_device_hash text, p_ip_hash text
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_settings public.lottery_settings;
  v_entry public.lottery_entries;
  v_code text;
begin
  if p_date is null or p_ticket is null or p_device_hash is null
     or p_ip_hash is null then
    raise exception 'Invalid entry';
  end if;
  -- One row lock serializes entries, so the IP and campaign counts hold.
  select * into v_settings from public.lottery_settings for update;
  select * into v_entry from public.lottery_entries e
    where e.puzzle_date = p_date and e.device_hash = p_device_hash;
  if found then
    return jsonb_build_object(
      'ticket', v_entry.ticket, 'won', v_entry.won,
      'code', (select c.code from public.lottery_codes c
               where c.entry_id = v_entry.id and v_entry.claimed_at is not null));
  end if;
  if (select count(*) from public.lottery_entries e
      where e.puzzle_date = p_date and e.ip_hash = p_ip_hash)
     >= v_settings.per_ip_daily then
    raise exception 'Too many entries';
  end if;
  insert into public.lottery_entries (ticket, puzzle_date, device_hash, ip_hash)
    values (p_ticket, p_date, p_device_hash, p_ip_hash)
    returning * into v_entry;

  if v_settings.instant_remaining > 0 and not exists (
    select 1 from public.lottery_entries e
    where e.instant and (e.device_hash = p_device_hash or e.ip_hash = p_ip_hash)
  ) then
    v_code := public.lottery_take_code();
    if v_code is not null then
      update public.lottery_codes c set entry_id = v_entry.id
        where c.code = v_code;
      update public.lottery_entries e
        set instant = true, won = true, claimed_at = now()
        where e.id = v_entry.id;
      update public.lottery_settings
        set instant_remaining = instant_remaining - 1;
      return jsonb_build_object('ticket', v_entry.ticket, 'won', true,
        'code', v_code);
    end if;
  end if;
  return jsonb_build_object('ticket', v_entry.ticket, 'won', null, 'code', null);
end $$;

-- Draws one day's tickets, once. Codes whose winners did not come for them
-- in time go back into the pool first.
create function public.lottery_draw(p_date date) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_settings public.lottery_settings;
  v_entry_id bigint;
  v_code text;
  v_winners integer := 0;
begin
  insert into public.lottery_draws (puzzle_date, winners) values (p_date, 0)
    on conflict (puzzle_date) do nothing;
  if found then
    select * into v_settings from public.lottery_settings;
    update public.lottery_codes c set entry_id = null
      from public.lottery_entries e
      where c.entry_id = e.id and e.claimed_at is null and e.claim_by < now();
    for v_entry_id in
      select e.id from public.lottery_entries e
      where e.puzzle_date = p_date and e.won is null
      order by random()
      limit v_settings.daily_winners
    loop
      v_code := public.lottery_take_code();
      exit when v_code is null;
      update public.lottery_codes c set entry_id = v_entry_id
        where c.code = v_code;
      update public.lottery_entries e
        set won = true,
            claim_by = now() + make_interval(days => v_settings.claim_days)
        where e.id = v_entry_id;
      v_winners := v_winners + 1;
    end loop;
    update public.lottery_draws d set winners = v_winners
      where d.puzzle_date = p_date;
  end if;
  -- Everyone else lost, including an entry that committed just after the
  -- draw.
  update public.lottery_entries e set won = false
    where e.puzzle_date = p_date and e.won is null;
end $$;

-- Draws every past day still waiting, and forgets device and IP hashes
-- after 30 days.
create function public.lottery_draw_due(p_today date) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_date date;
begin
  for v_date in
    select distinct e.puzzle_date from public.lottery_entries e
    where e.puzzle_date < p_today and e.won is null
    order by 1
  loop
    perform public.lottery_draw(v_date);
  end loop;
  update public.lottery_entries e set device_hash = null, ip_hash = null
    where e.puzzle_date < p_today - 30 and e.device_hash is not null;
end $$;

-- Results for up to 30 tickets: pending (not drawn yet), won (with the
-- code; showing it starts counting as collected), expired, lost, or left
-- out when the ticket is unknown.
create function public.lottery_status(p_today date, p_tickets text[])
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_today is null or p_tickets is null
     or coalesce(array_length(p_tickets, 1), 0) > 30 then
    raise exception 'Invalid tickets';
  end if;
  perform public.lottery_draw_due(p_today);
  update public.lottery_entries e set claimed_at = now()
    from public.lottery_codes c
    where c.entry_id = e.id and e.ticket = any(p_tickets)
      and e.claimed_at is null and e.claim_by >= now();
  select coalesce(jsonb_agg(jsonb_build_object(
      'ticket', e.ticket,
      'date', e.puzzle_date,
      'status', case
        when c.code is not null and e.claimed_at is not null then 'won'
        when e.won then 'expired'
        when not e.won then 'lost'
        else 'pending' end,
      'code', case when e.claimed_at is not null then c.code end
    ) order by e.puzzle_date desc), '[]'::jsonb)
    into v_result
    from public.lottery_entries e
    left join public.lottery_codes c on c.entry_id = e.id
    where e.ticket = any(p_tickets);
  return v_result;
end $$;

revoke execute on function public.lottery_take_code(),
  public.lottery_enter(date, text, text, text),
  public.lottery_draw(date),
  public.lottery_draw_due(date),
  public.lottery_status(date, text[])
  from public, anon, authenticated;
grant execute on function public.lottery_take_code(),
  public.lottery_enter(date, text, text, text),
  public.lottery_draw(date),
  public.lottery_draw_due(date),
  public.lottery_status(date, text[])
  to service_role;
