-- Cole TUDO isto no Supabase → SQL Editor → Run (uma vez).
-- Depois: Authentication → Users → criar usuário admin
--         insert into public.app_admins (user_id) values ('uuid-do-usuario');

-- === 002: confirmações ===
create table if not exists public.rsvp_responses (
  id uuid primary key default gen_random_uuid (),
  full_name text not null,
  email text,
  phone text,
  attending text not null check (attending in ('yes', 'no', 'maybe')),
  guest_count int not null default 1 check (guest_count >= 0 and guest_count <= 20),
  dietary_notes text,
  message text,
  created_at timestamptz not null default now ()
);

create index if not exists rsvp_responses_created_at_idx on public.rsvp_responses (created_at desc);
alter table public.rsvp_responses enable row level security;

-- === 003: convidados e admins ===
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

drop policy if exists "anon read wedding invited guests" on public.wedding_invited_guests;
create policy "anon read wedding invited guests" on public.wedding_invited_guests for select to anon using (true);

drop policy if exists "authenticated read wedding invited guests" on public.wedding_invited_guests;
create policy "authenticated read wedding invited guests" on public.wedding_invited_guests for select to authenticated using (true);

drop policy if exists "admin read own row" on public.app_admins;
create policy "admin read own row" on public.app_admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "admin insert wedding invited guests" on public.wedding_invited_guests;
create policy "admin insert wedding invited guests" on public.wedding_invited_guests for insert to authenticated with check (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

drop policy if exists "admin update wedding invited guests" on public.wedding_invited_guests;
create policy "admin update wedding invited guests" on public.wedding_invited_guests for update to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

drop policy if exists "admin delete wedding invited guests" on public.wedding_invited_guests;
create policy "admin delete wedding invited guests" on public.wedding_invited_guests for delete to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

-- === 006: políticas RSVP ===
drop policy if exists "anon insert rsvp responses" on public.rsvp_responses;
create policy "anon insert rsvp responses" on public.rsvp_responses for insert to anon with check (true);

drop policy if exists "authenticated insert rsvp responses" on public.rsvp_responses;
create policy "authenticated insert rsvp responses" on public.rsvp_responses for insert to authenticated with check (true);

drop policy if exists "admin read rsvp responses" on public.rsvp_responses;
create policy "admin read rsvp responses" on public.rsvp_responses for select to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

-- === 008: uma resposta por convidado ===
alter table public.rsvp_responses
  add column if not exists guest_id text references public.wedding_invited_guests (id) on delete set null;

alter table public.rsvp_responses
  add column if not exists updated_at timestamptz not null default now ();

create unique index if not exists rsvp_responses_guest_id_uidx
  on public.rsvp_responses (guest_id)
  where guest_id is not null;

drop policy if exists "anon read rsvp responses" on public.rsvp_responses;
create policy "anon read rsvp responses" on public.rsvp_responses for select to anon using (guest_id is not null);

drop policy if exists "authenticated read rsvp responses" on public.rsvp_responses;
create policy "authenticated read rsvp responses" on public.rsvp_responses for select to authenticated using (guest_id is not null);

drop policy if exists "anon update rsvp responses" on public.rsvp_responses;
create policy "anon update rsvp responses" on public.rsvp_responses for update to anon using (guest_id is not null) with check (guest_id is not null);

drop policy if exists "authenticated update rsvp responses" on public.rsvp_responses;
create policy "authenticated update rsvp responses" on public.rsvp_responses for update to authenticated using (guest_id is not null) with check (guest_id is not null);

-- === 009: admin apaga confirmações ===
drop policy if exists "admin delete rsvp responses" on public.rsvp_responses;
create policy "admin delete rsvp responses" on public.rsvp_responses for delete to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

-- === Convidados do aniversário ===
delete from public.wedding_invited_guests;

insert into public.wedding_invited_guests (id, name, sort_order)
values
  ('stefany', 'Stefany', 10),
  ('ana-beatriz', 'Ana Beatriz', 20),
  ('laryssa', 'Laryssa', 30),
  ('yuri', 'Yuri', 40),
  ('ana-clara', 'Ana Clara', 50),
  ('ana-laura', 'Ana Laura', 60),
  ('fabricio', 'Fabrício', 70),
  ('lucas', 'Lucas', 80),
  ('cristian', 'Cristian', 90),
  ('namorada-do-cristian', 'Namorada do Cristian', 100),
  ('caio', 'Caio', 110),
  ('hellen', 'Hellen', 120),
  ('pedro', 'Pedro', 130),
  ('sarah', 'Sarah', 140),
  ('fernanda-e-henrique', 'Fernanda e o Henrique', 150);
