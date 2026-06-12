alter table public.hub_denuncias enable row level security;

drop policy if exists "hub_denuncias_public_update" on public.hub_denuncias;

create policy "hub_denuncias_public_update"
on public.hub_denuncias
for update
to anon, authenticated
using (true)
with check (true);

grant update on public.hub_denuncias to anon, authenticated;
