-- Credit cards and their statement cycles, and which card a card purchase went on.
-- No foreign keys between them: each table syncs on its own, so an expense can reach the
-- server before the card it names (and a deleted card is a soft delete anyway).

create table public.cards (
  id uuid not null primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null constraint cards_name_check check (length(trim(name)) > 0),
  updated_at timestamptz not null,
  deleted boolean not null default false,
  synced_at timestamptz not null default now()
);

-- One statement period: purchases after the previous closing, up to closes_on, paid on due_on
create table public.card_cycles (
  id uuid not null primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null,
  closes_on date not null,
  due_on date not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  constraint card_cycles_due_after_closing check (due_on >= closes_on)
);

alter table public.expenses add column card_id uuid;

create index cards_user_synced_idx on public.cards using btree (user_id, synced_at);
create index card_cycles_user_synced_idx on public.card_cycles using btree (user_id, synced_at);

create trigger cards_set_synced_at before insert or update on public.cards
  for each row execute function public.set_synced_at();
create trigger card_cycles_set_synced_at before insert or update on public.card_cycles
  for each row execute function public.set_synced_at();

alter table public.cards enable row level security;
alter table public.card_cycles enable row level security;

create policy "cards: owner only" on public.cards to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "card_cycles: owner only" on public.card_cycles to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table only public.cards;
alter publication supabase_realtime add table only public.card_cycles;

grant all on table public.cards to anon, authenticated, service_role;
grant all on table public.card_cycles to anon, authenticated, service_role;
