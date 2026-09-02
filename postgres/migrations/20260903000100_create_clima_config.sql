create table if not exists public.hub_clima_config (
  id int primary key default 1,
  aberto boolean not null default false,
  aberto_em timestamptz,
  encerrado_em timestamptz,
  constraint hub_clima_config_singleton check (id = 1)
);

insert into public.hub_clima_config (id, aberto)
values (1, false)
on conflict (id) do nothing;
