-- lottery_enter failed for every entry that won a release-campaign code:
-- the Supabase API rejects an UPDATE without a WHERE clause
-- ("UPDATE requires a WHERE clause"), and the one-row settings update had
-- none. The whole entry rolled back, so the app showed an error and no
-- code was used up. Same function, with the settings row named.
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
    v_code := public.lottery_take_code();
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
