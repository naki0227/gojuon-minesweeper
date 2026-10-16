-- 今日の一問 goes online with the Deploy Web workflow at 7:00 Japan time.
-- GitHub starts scheduled runs late, sometimes by hours, so the database
-- (pg_cron, which runs on time) starts the workflow instead, through the
-- GitHub API (workflow_dispatch starts promptly). The workflow's own
-- schedule stays as a fallback; tries after the first one skip quickly.
--
-- Needs a GitHub fine-grained token with only "Actions: Read and write" on
-- naki0227/gojuon-minesweeper, saved in Vault (dashboard) as
-- github_deploy_token. Without it the job does nothing.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create function public.start_daily_web_deploy() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_token text;
begin
  select s.decrypted_secret into v_token
    from vault.decrypted_secrets s where s.name = 'github_deploy_token';
  if v_token is null or v_token = '' then
    return;
  end if;
  perform net.http_post(
    url := 'https://api.github.com/repos/naki0227/gojuon-minesweeper/actions/workflows/deploy-web.yml/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'gojuon-daily-deploy',
      'Content-Type', 'application/json'
    ),
    body := '{"ref": "main", "inputs": {"only_if_missing": "true"}}'::jsonb
  );
end $$;

-- Only pg_cron (running as the database owner) calls it.
revoke execute on function public.start_daily_web_deploy()
  from public, anon, authenticated, service_role;

-- 22:01 and 22:20 UTC (7:01 and 7:20 in Japan); pg_cron runs in UTC.
select cron.schedule('daily-web-deploy', '1 22 * * *',
  'select public.start_daily_web_deploy()');
select cron.schedule('daily-web-deploy-retry', '20 22 * * *',
  'select public.start_daily_web_deploy()');
