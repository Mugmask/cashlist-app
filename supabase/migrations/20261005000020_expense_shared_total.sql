-- A shared expense paid in full (a dinner for two): `amount` is the user's part, what every
-- total counts, and shared_total the whole bill in pesos, what the card statement charges.
-- Null when it isn't shared.
alter table public.expenses
  add column shared_total numeric(14, 2) check (shared_total > 0);
