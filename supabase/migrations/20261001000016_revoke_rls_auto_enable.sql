-- rls_auto_enable() backs Supabase's ensure_rls event trigger (RLS on every new public table).
-- Postgres runs it on DDL by itself; nobody needs to call it through the API, so the API roles
-- don't get to execute it (the security advisor flags it otherwise).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
