-- Money that comes in apart from the monthly income in the profile (a transfer back, a sale,
-- a one-off job): it adds to what the month has to spend. Same sync columns as expenses.
create table public.incomes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  received_at timestamptz not null,
  name text check (length(trim(name)) > 0),
  note text,
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so deletions sync too
  synced_at timestamptz not null default now()   -- set by the server: pull cursor
);

create index incomes_user_synced_idx on public.incomes (user_id, synced_at);

create trigger incomes_set_synced_at
before insert or update on public.incomes
for each row execute function public.set_synced_at();

alter table public.incomes enable row level security;

create policy "incomes: owner only" on public.incomes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.incomes;
