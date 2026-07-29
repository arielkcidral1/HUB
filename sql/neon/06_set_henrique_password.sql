alter table public.hub_users
  add column if not exists password_hash text;

update public.hub_users
set password_hash = '$2b$12$dONGDJ3kQbJHRIgmTtjtEOic1iDpQtv9vZj/KWz8jdzcKZZDnVS2m'
where lower(btrim(nome)) = 'henrique';
