-- Foto opcional por presente (caminho em /public ou URL).
alter table public.wedding_gifts
  add column if not exists image_src text;

comment on column public.wedding_gifts.image_src is
  'Caminho público (ex. /presentes/jantar.jpg) ou URL da foto do presente.';
