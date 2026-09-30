-- Spanish schema → English schema. Renames keep the data, RLS policy, trigger,
-- index and Realtime publication attached to the table.
alter table public.gastos rename to expenses;

alter table public.expenses rename column monto to amount;
alter table public.expenses rename column categoria to category;
alter table public.expenses rename column fecha to spent_at;
alter table public.expenses rename column nota to note;

alter table public.expenses rename constraint gastos_pkey to expenses_pkey;
alter table public.expenses rename constraint gastos_monto_check to expenses_amount_check;
alter table public.expenses rename constraint gastos_user_id_fkey to expenses_user_id_fkey;
alter index public.gastos_user_synced_idx rename to expenses_user_synced_idx;
alter trigger gastos_set_synced_at on public.expenses rename to expenses_set_synced_at;
alter policy "gastos: solo el dueño" on public.expenses rename to "expenses: owner only";

-- Categories are stored as ids; the Spanish label lives only in the UI.
-- updated_at is left untouched so this doesn't win over pending local edits;
-- the trigger bumps synced_at, so every device pulls the new values.
update public.expenses
set category = case category
  when 'Súper' then 'groceries'
  when 'Delivery' then 'delivery'
  when 'Alquiler' then 'rent'
  when 'Servicios' then 'utilities'
  when 'Transporte' then 'transport'
  when 'Salidas' then 'going_out'
  when 'Salud' then 'health'
  else 'other'
end;
