-- Recipes: something cooked often and what it takes. Ingredients are shopping products with
-- a count, kept as a JSON array of { name, quantity } (they're always read and written with
-- the recipe). Same sync columns as the other tables.
create table public.recipes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  ingredients jsonb not null default '[]' check (jsonb_typeof(ingredients) = 'array'),
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so deletions sync too
  synced_at timestamptz not null default now()   -- set by the server: pull cursor
);

create index recipes_user_synced_idx on public.recipes (user_id, synced_at);

create trigger recipes_set_synced_at
before insert or update on public.recipes
for each row execute function public.set_synced_at();

alter table public.recipes enable row level security;

create policy "recipes: owner only" on public.recipes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.recipes;
