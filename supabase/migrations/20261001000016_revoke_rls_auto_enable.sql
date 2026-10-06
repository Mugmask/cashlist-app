-- rls_auto_enable() backs Supabase's ensure_rls event trigger (RLS on every new public table).
-- Postgres runs it on DDL by itself; nobody needs to call it through the API, so the API roles
-- don't get to execute it (the security advisor flags it otherwise).
-- It only exists where that project setting is on (the hosted project, not a local or CI
-- database built from these migrations), so it's skipped when missing.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
