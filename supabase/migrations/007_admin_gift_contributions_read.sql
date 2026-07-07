-- Log de pagamentos no painel admin (leitura de gift_contributions).
drop policy if exists "admin read gift contributions" on public.gift_contributions;
create policy "admin read gift contributions" on public.gift_contributions
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
  );
