-- Permite ao admin apagar confirmações de presença (ex.: limpar dados de teste).
drop policy if exists "admin delete rsvp responses" on public.rsvp_responses;
create policy "admin delete rsvp responses" on public.rsvp_responses
  for delete to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );
