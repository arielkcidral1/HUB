alter table public.hub_users
add column if not exists cargo text not null default '';

update public.hub_users
set cargo = 'RH'
where lower(nome) in ('ariel', 'andrei', 'patricia', 'dani', 'vanessa')
  and nullif(trim(cargo), '') is null;

grant select, insert, update, delete on public.hub_users to anon, authenticated;
