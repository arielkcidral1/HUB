alter table public.hub_malotes
add column if not exists created_by text default 'Sistema';

alter table public.hub_malotes
add column if not exists updated_by text;

grant select, insert, update, delete on public.hub_malotes to anon, authenticated;

drop policy if exists "hub_malotes_public_update" on public.hub_malotes;

create policy "hub_malotes_public_update"
on public.hub_malotes
for update
to anon, authenticated
using (true)
with check (true);
