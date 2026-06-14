alter table public.hub_users
add column if not exists foto_perfil text;

grant select, insert, update, delete on public.hub_users to anon, authenticated;