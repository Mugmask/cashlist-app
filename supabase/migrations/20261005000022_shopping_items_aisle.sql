-- The store section a product goes in (produce, dairy...), when the user picked one; the app
-- guesses it from the name when it's null.
alter table public.shopping_items
  add column aisle text check (aisle ~ '^[a-z]+$');
