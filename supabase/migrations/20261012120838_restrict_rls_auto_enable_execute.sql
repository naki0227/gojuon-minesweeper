-- The ensure_rls event trigger is a trusted PostgreSQL DDL hook.
-- Its SECURITY DEFINER handler must not be exposed as a user-callable RPC.
-- Keep the event trigger and its SECURITY DEFINER behavior intact.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;
