alter table public.hub_chamados enable row level security;

drop policy if exists "hub_chamados_public_update" on public.hub_chamados;

create policy "hub_chamados_public_update"
on public.hub_chamados
for update
to anon, authenticated
using (true)
with check (true);

grant update on public.hub_chamados to anon, authenticated;
