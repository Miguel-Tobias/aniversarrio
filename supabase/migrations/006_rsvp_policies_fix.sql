-- Corrige políticas RSVP: convidados conseguem inserir; admin lê no painel.
-- (Se 002/005 não foram aplicados por completo, isto repõe o comportamento esperado.)

-- Garantir tabela (idempotente com 002).
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

drop policy if exists "anon insert rsvp responses" on public.rsvp_responses;
create policy "anon insert rsvp responses" on public.rsvp_responses
  for insert to anon
  with check (true);

-- Quem testa o RSVP com sessão admin aberta no mesmo browser usa role authenticated.
drop policy if exists "authenticated insert rsvp responses" on public.rsvp_responses;
create policy "authenticated insert rsvp responses" on public.rsvp_responses
  for insert to authenticated
  with check (true);

drop policy if exists "admin read rsvp responses" on public.rsvp_responses;
create policy "admin read rsvp responses" on public.rsvp_responses
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );
