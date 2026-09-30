create table public.gastos (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  monto numeric(14, 2) not null check (monto > 0),
  categoria text not null,
  fecha timestamptz not null,
  nota text,
  updated_at timestamptz not null,               -- lo pone el cliente: define quién gana en un conflicto
  deleted boolean not null default false,        -- borrado lógico, para que se sincronice
  synced_at timestamptz not null default now()   -- lo pone el server: cursor para bajar cambios
);

create index gastos_user_synced_idx on public.gastos (user_id, synced_at);

create function public.set_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := now();
  return new;
end;
$$;

create trigger gastos_set_synced_at
before insert or update on public.gastos
for each row execute function public.set_synced_at();

alter table public.gastos enable row level security;

create policy "gastos: solo el dueño" on public.gastos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
