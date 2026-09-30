-- Si llega una versión más vieja que la guardada (ej. un dispositivo que estuvo offline),
-- se descarta el update en vez de pisar la más nueva.
create or replace function public.set_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.synced_at := now();
  return new;
end;
$$;
