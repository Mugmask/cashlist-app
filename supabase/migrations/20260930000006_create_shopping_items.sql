-- Shopping list items. An item goes to_buy → in_cart → bought; bought items are kept as
-- history, which powers the "buy again" suggestions.
create table public.shopping_items (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'to_buy' check (status in ('to_buy', 'in_cart', 'bought')),
  bought_at timestamptz,
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so removals sync too
  synced_at timestamptz not null default now()   -- set by the server: pull cursor
);

create index shopping_items_user_synced_idx on public.shopping_items (user_id, synced_at);

-- Same last-write-wins + synced_at trigger as the other synced tables
create trigger shopping_items_set_synced_at
before insert or update on public.shopping_items
for each row execute function public.set_synced_at();

alter table public.shopping_items enable row level security;

create policy "shopping_items: owner only" on public.shopping_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.shopping_items;
