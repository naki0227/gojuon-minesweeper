-- 今日の一問 正解率: how many app players solved the day's puzzle or gave
-- up, and in how many moves. The app reports its result once per device
-- through the daily-lottery Edge Function, which shows the totals back.
--
-- device_hash and ip_hash are HMACs made by the Edge Function, used only
-- to count each device once and to cap one network; they are cleared after
-- 30 days. Nobody but the Edge Function (service role) can read or change
-- any of this.

create table public.daily_results (
  id bigint generated always as identity primary key,
  puzzle_date date not null,
  device_hash text,
  ip_hash text,
  solved boolean not null,
  moves smallint not null check (moves between 0 and 200),
  created_at timestamptz not null default now(),
  unique (puzzle_date, device_hash)
);
create index daily_results_ip on public.daily_results (puzzle_date, ip_hash);

alter table public.daily_results enable row level security;
revoke all on public.daily_results from anon, authenticated;
grant select, insert, update, delete on public.daily_results to service_role;

create function public.daily_result_stats(p_date date) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'players', count(*),
    'solved', count(*) filter (where r.solved),
    'avgMoves', round(avg(r.moves) filter (where r.solved), 1)
  )
  from public.daily_results r
  where r.puzzle_date = p_date;
$$;

-- The first result of a device counts; a network adds at most 20 a day.
create function public.daily_result_record(
  p_date date, p_device_hash text, p_ip_hash text, p_solved boolean,
  p_moves integer
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
begin
  if (select count(*) from public.daily_results r
      where r.puzzle_date = p_date and r.ip_hash = p_ip_hash) < 20 then
    insert into public.daily_results
      (puzzle_date, device_hash, ip_hash, solved, moves)
    values (p_date, p_device_hash, p_ip_hash, p_solved, p_moves)
    on conflict (puzzle_date, device_hash) do nothing;
  end if;
  update public.daily_results r set device_hash = null, ip_hash = null
    where r.puzzle_date < p_date - 30 and r.device_hash is not null;
  return public.daily_result_stats(p_date);
end $$;

revoke execute on function public.daily_result_stats(date),
  public.daily_result_record(date, text, text, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.daily_result_stats(date),
  public.daily_result_record(date, text, text, boolean, integer)
  to service_role;
