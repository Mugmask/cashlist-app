-- An exact color the user picked for a category, over the palette. `color` (the palette
-- index) stays, as the fallback: older versions of the app and anything that needs an index.
alter table public.categories
  add column custom_color text check (custom_color ~ '^#[0-9a-fA-F]{6}$');
