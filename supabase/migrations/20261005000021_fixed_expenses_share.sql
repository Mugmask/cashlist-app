-- Shared fixed expenses (rent with a flatmate): `amount` stays the whole bill, and each
-- payment records only the user's part. Either an even split between share_with people, or
-- the user's exact part (share_part, in the fixed expense's currency); never both.
alter table public.fixed_expenses
  add column share_with integer check (share_with between 2 and 4),
  add column share_part numeric(14, 2) check (share_part > 0),
  add constraint fixed_expenses_share_one_way check (share_with is null or share_part is null);
