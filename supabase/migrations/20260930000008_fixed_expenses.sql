-- Fixed expenses: charged every month (rent, internet...). Paying one records a regular
-- expense linked to it, for a given month.
create table public.fixed_expenses (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null,
  amount numeric(14, 2) not null check (amount > 0), -- suggested next time; follows the last payment
  due_day integer check (due_day between 1 and 31),
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- soft delete, so removals sync too
  synced_at timestamptz not null default now()   -- set by the server: pull cursor
);

create index fixed_expenses_user_synced_idx on public.fixed_expenses (user_id, synced_at);

create trigger fixed_expenses_set_synced_at
before insert or update on public.fixed_expenses
for each row execute function public.set_synced_at();

alter table public.fixed_expenses enable row level security;

create policy "fixed_expenses: owner only" on public.fixed_expenses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.fixed_expenses;

-- The payment link on expenses. No foreign key on purpose: tables sync independently, so a
-- payment may reach the server before its fixed expense does.
alter table public.expenses
  add column fixed_expense_id uuid,
  add column fixed_period text check (fixed_period ~ '^\d{4}-(0[1-9]|1[0-2])$');
