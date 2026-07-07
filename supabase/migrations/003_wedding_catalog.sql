-- Convidados e administradores do site de aniversário.
-- Depois de criar um utilizador em Authentication > Users, autorize-o:
--   insert into public.app_admins (user_id) values ('<uuid do auth.users>');

create table if not exists public.wedding_invited_guests (
  id text primary key,
  name text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create index if not exists wedding_invited_guests_sort_idx on public.wedding_invited_guests (sort_order, id);

alter table public.wedding_invited_guests enable row level security;
alter table public.app_admins enable row level security;

create policy "anon read wedding invited guests" on public.wedding_invited_guests for select to anon using (true);
create policy "authenticated read wedding invited guests" on public.wedding_invited_guests for select to authenticated using (true);

create policy "admin read own row" on public.app_admins for select to authenticated using (user_id = auth.uid());

create policy "admin insert wedding invited guests" on public.wedding_invited_guests for insert to authenticated with check (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

create policy "admin update wedding invited guests" on public.wedding_invited_guests for update to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

create policy "admin delete wedding invited guests" on public.wedding_invited_guests for delete to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

insert into public.wedding_invited_guests (id, name, sort_order)
values
  ('maria-silva', 'Maria Silva', 10),
  ('joao-santos', 'João Santos', 20),
  ('familia-oliveira', 'Família Oliveira', 30)
on conflict (id) do nothing;
