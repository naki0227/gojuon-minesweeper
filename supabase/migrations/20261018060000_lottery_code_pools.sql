-- Apple lets each customer redeem one code per offer, so one offer cannot
-- serve both the release campaign and the daily draws. The codes now come
-- in two pools, one per offer:
--   instant: the release-campaign offer (the 500 codes added so far)
--   daily:   a separate offer for the daily draws (new uploads default here)
-- A device whose daily win was already shown is left out of later draws,
-- since its Apple Account has probably used that offer.
alter table public.lottery_codes
  add column pool text not null default 'daily'
    check (pool in ('instant', 'daily'));
update public.lottery_codes set pool = 'instant' where true;

drop function public.lottery_take_code();
-- The next unused code of a pool, locked for the caller's transaction.
create function public.lottery_take_code(p_pool text) returns text
language sql security invoker set search_path = ''
as $$
  select c.code from public.lottery_codes c
  where c.entry_id is null and c.pool = p_pool
  order by c.added_at, c.code
  limit 1
  for update skip locked;
$$;
revoke execute on function public.lottery_take_code(text)
  from public, anon, authenticated;
grant execute on function public.lottery_take_code(text) to service_role;

create or replace function public.lottery_enter(
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
    v_code := public.lottery_take_code('instant');
    if v_code is not null then
      update public.lottery_codes c set entry_id = v_entry.id
        where c.code = v_code;
      update public.lottery_entries e
        set instant = true, won = true, claimed_at = now()
        where e.id = v_entry.id;
      update public.lottery_settings
        set instant_remaining = instant_remaining - 1
        where id;
      return jsonb_build_object('ticket', v_entry.ticket, 'won', true,
        'code', v_code);
    end if;
  end if;
  return jsonb_build_object('ticket', v_entry.ticket, 'won', null, 'code', null);
end $$;

-- Draws one day's tickets, once, from the daily pool. Codes whose winners
-- did not come for them in time go back into the pool first.
create or replace function public.lottery_draw(p_date date) returns void
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
        and not exists (
          select 1 from public.lottery_entries w
          where w.device_hash = e.device_hash and not w.instant
            and w.won and w.claimed_at is not null)
      order by random()
      limit v_settings.daily_winners
    loop
      v_code := public.lottery_take_code('daily');
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
