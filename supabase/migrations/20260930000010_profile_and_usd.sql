-- Expenses in dollars. `amount` stays in pesos: it's what every total adds up, so nothing that
-- sums expenses changes. A dollar expense also keeps what was charged in dollars, the rate used
-- (taken from dolarapi.com when it was loaded) and which dollar that rate was.
alter table public.expenses
  add column currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  add column foreign_amount numeric(14, 2) check (foreign_amount > 0),
  add column exchange_rate numeric(14, 4) check (exchange_rate > 0),
  add column exchange_rate_kind text check (exchange_rate_kind in ('tarjeta', 'blue', 'oficial')),
  add constraint expenses_currency_fields check (
    (currency = 'ARS' and foreign_amount is null and exchange_rate is null and exchange_rate_kind is null)
    or (currency = 'USD' and foreign_amount is not null and exchange_rate is not null and exchange_rate_kind is not null)
  );

-- The user's profile: one row per user, always id 'me'. Monthly income is in pesos.
create table public.profiles (
  id text not null check (id = 'me'),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text check (length(trim(name)) > 0),
  monthly_income numeric(14, 2) check (monthly_income > 0),
  updated_at timestamptz not null,               -- set by the client: decides conflicts
  deleted boolean not null default false,        -- kept for the sync engine; never set today
  synced_at timestamptz not null default now(),  -- set by the server: pull cursor
  primary key (user_id, id)
);

create index profiles_user_synced_idx on public.profiles (user_id, synced_at);

create trigger profiles_set_synced_at
before insert or update on public.profiles
for each row execute function public.set_synced_at();

alter table public.profiles enable row level security;

create policy "profiles: owner only" on public.profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.profiles;
