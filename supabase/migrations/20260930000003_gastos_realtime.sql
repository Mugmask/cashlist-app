-- Avisa a los clientes cuando cambia algo en gastos (respeta RLS)
alter publication supabase_realtime add table public.gastos;
