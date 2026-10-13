-- The gem wallet migrations revoked client access but never granted the
-- Edge Function's service role access to the tables (this project does not
-- grant new public tables to it automatically), so every wallet RPC failed
-- with "permission denied for table gem_wallets". Clients keep read-only
-- access to their own rows through RLS.
grant select, insert, update, delete
  on public.gem_wallets, public.gem_ledger, public.gem_apple_purchases
  to service_role;
