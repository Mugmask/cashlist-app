-- Expenses get a name ("Pizzaluna", "Alquiler") apart from the note, which becomes a free
-- comment. Every note so far was really a name (a merchant, a fixed expense's name,
-- "Compra de 4 productos"), so it moves there. updated_at is left alone: the trigger still
-- bumps synced_at, so every device downloads the moved rows on its next sync.
alter table public.expenses
  add column name text check (name is null or length(trim(name)) > 0);

update public.expenses
set name = note, note = null
where note is not null and name is null;
