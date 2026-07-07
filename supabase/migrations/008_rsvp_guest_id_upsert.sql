-- Uma resposta por convidado (guest_id): permite alterar Sim/Não sem duplicar linhas.
alter table public.rsvp_responses
  add column if not exists guest_id text references public.wedding_invited_guests (id) on delete set null;

alter table public.rsvp_responses
  add column if not exists updated_at timestamptz not null default now ();

-- Associa respostas antigas (só por nome) ao convidado correspondente (fica a mais recente).
with latest as (
  select distinct on (g.id)
    r.id as response_id,
    g.id as guest_id
  from public.rsvp_responses r
  join public.wedding_invited_guests g
    on lower(trim(r.full_name)) = lower(trim(g.name))
  where r.guest_id is null
  order by g.id, r.created_at desc
)
update public.rsvp_responses r
set
  guest_id = latest.guest_id,
  updated_at = coalesce(r.updated_at, r.created_at)
from latest
where r.id = latest.response_id;

create unique index if not exists rsvp_responses_guest_id_uidx
  on public.rsvp_responses (guest_id)
  where guest_id is not null;

drop policy if exists "anon read rsvp responses" on public.rsvp_responses;
create policy "anon read rsvp responses" on public.rsvp_responses
  for select to anon
  using (guest_id is not null);

drop policy if exists "authenticated read rsvp responses" on public.rsvp_responses;
create policy "authenticated read rsvp responses" on public.rsvp_responses
  for select to authenticated
  using (guest_id is not null);

drop policy if exists "anon update rsvp responses" on public.rsvp_responses;
create policy "anon update rsvp responses" on public.rsvp_responses
  for update to anon
  using (guest_id is not null)
  with check (guest_id is not null);

drop policy if exists "authenticated update rsvp responses" on public.rsvp_responses;
create policy "authenticated update rsvp responses" on public.rsvp_responses
  for update to authenticated
  using (guest_id is not null)
  with check (guest_id is not null);
