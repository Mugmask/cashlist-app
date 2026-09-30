-- Credit card: how each expense (and each fixed expense) is paid. Card spending of a month is
-- paid the next month in one statement (calendar months, a single card).
alter table public.expenses
  add column payment_method text not null default 'cash' check (payment_method in ('cash', 'card'));

alter table public.fixed_expenses
  add column payment_method text not null default 'cash' check (payment_method in ('cash', 'card'));

-- A statement marked as paid. The id is the month of the purchases ("2026-09"): one row per
-- statement, so marking it from two devices converges. Paying it is not an expense: the
-- purchases were already counted when they were made.
create table public.card_statements (
  id text not null check (id ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  paid_at timestamptz not null,
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete: "unmark as paid"
  synced_at timestamptz not null default now(),  -- set by the server: pull cursor
  primary key (user_id, id)
);

create index card_statements_user_synced_idx on public.card_statements (user_id, synced_at);

create trigger card_statements_set_synced_at
before insert or update on public.card_statements
for each row execute function public.set_synced_at();

alter table public.card_statements enable row level security;

create policy "card_statements: owner only" on public.card_statements
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.card_statements;
