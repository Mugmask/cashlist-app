-- The user's names for the shopping list's store sections, by section id
-- ({"dairy": "Heladera"}); the app's names for the rest. Null when none was renamed.
alter table public.profiles
  add column aisle_names jsonb check (aisle_names is null or jsonb_typeof(aisle_names) = 'object');
