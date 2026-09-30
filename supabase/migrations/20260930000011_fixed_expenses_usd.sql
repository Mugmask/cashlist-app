-- Fixed expenses charged in dollars (Netflix, Spotify...): then `amount` is in dollars, and each
-- payment is recorded as a dollar expense converted at that day's rate.
alter table public.fixed_expenses
  add column currency text not null default 'ARS' check (currency in ('ARS', 'USD'));
