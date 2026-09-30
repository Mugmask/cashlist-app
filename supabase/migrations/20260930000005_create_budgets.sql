-- Monthly limit per expense category; it carries over every month until changed.
-- The id is the category id ('groceries', ...), so setting the same category from two
-- devices converges on one row (last write wins) instead of creating duplicates.
create table public.budgets (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so removals sync too
  synced_at timestamptz not null default now(),  -- set by the server: pull cursor
  primary key (user_id, id)
);

create index budgets_user_synced_idx on public.budgets (user_id, synced_at);

-- Same last-write-wins + synced_at trigger as expenses
create trigger budgets_set_synced_at
before insert or update on public.budgets
for each row execute function public.set_synced_at();

alter table public.budgets enable row level security;

create policy "budgets: owner only" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.budgets;
