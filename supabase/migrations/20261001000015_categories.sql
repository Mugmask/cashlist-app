-- Categories each user makes, besides the built-in ones (which live in the app's code).
-- Expenses keep pointing at a category by id: a built-in key or one of these uuids.
-- Same sync columns as the other tables.
create table public.categories (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  icon text not null,
  color smallint not null check (color between 1 and 8), -- index into the app's palette
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so deletions sync too
  synced_at timestamptz not null default now()   -- set by the server: pull cursor
);

create index categories_user_synced_idx on public.categories (user_id, synced_at);

create trigger categories_set_synced_at
before insert or update on public.categories
for each row execute function public.set_synced_at();

alter table public.categories enable row level security;

create policy "categories: owner only" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.categories;
