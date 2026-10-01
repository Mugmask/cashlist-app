-- Card purchases in installments: how many (2 or more; null is a single payment). `amount`
-- stays the total and counts in the month it was bought; each statement charges one.
alter table public.expenses
  add column installments integer check (installments between 2 and 48),
  add constraint expenses_installments_card_only check (installments is null or payment_method = 'card');
