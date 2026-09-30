-- Shopping list → pantry model: one row per product, cycling
-- in_stock → to_buy → in_cart → in_stock. "bought" history rows become in-stock products.
alter table public.shopping_items drop constraint shopping_items_status_check;

update public.shopping_items set status = 'in_stock' where status = 'bought';

alter table public.shopping_items
  add constraint shopping_items_status_check check (status in ('in_stock', 'to_buy', 'in_cart'));

alter table public.shopping_items rename column bought_at to last_bought_at;

alter table public.shopping_items
  add column times_bought integer not null default 0 check (times_bought >= 0);

update public.shopping_items set times_bought = 1 where last_bought_at is not null;
