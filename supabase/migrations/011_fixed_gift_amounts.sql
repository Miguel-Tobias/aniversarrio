-- Valores fixos de presente (sem fotos)
insert into public.wedding_gifts (id, title, description, price, sort_order, image_src)
values
  ('presente-50', 'R$ 50,00', '', 50, 10, null),
  ('presente-100', 'R$ 100,00', '', 100, 20, null),
  ('presente-150', 'R$ 150,00', '', 150, 30, null),
  ('presente-200', 'R$ 200,00', '', 200, 40, null)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  sort_order = excluded.sort_order,
  image_src = null,
  updated_at = now();
