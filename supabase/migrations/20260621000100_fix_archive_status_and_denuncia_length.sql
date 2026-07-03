-- Allow RH to archive internal records while keeping public submissions constrained.
create or replace function app_private.hub_public_denuncia_allowed(
  identificacao text,
  categoria text,
  descricao text,
  status text
)
returns boolean
language sql
stable
set search_path = app_private, pg_temp
as $$
  select
    (
      coalesce(identificacao, 'Anonimo') = 'Anonimo'
      and coalesce(categoria, 'Denuncia anonima') = 'Denuncia anonima'
      and coalesce(status, 'Aberta') = 'Aberta'
      and length(btrim(coalesce(descricao, ''))) between 1 and 4000
    )
    or (
      (select auth.role()) = 'authenticated'
      and app_private.hub_is_rh()
    );
$$;

create or replace function app_private.hub_public_chamado_allowed(
  solicitante text,
  unidade text,
  epis text,
  observacoes text,
  status text,
  created_by text
)
returns boolean
language sql
stable
set search_path = app_private, pg_temp
as $$
  select
    (
      coalesce(status, 'Aberto') = 'Aberto'
      and coalesce(created_by, 'Publico') = 'Publico'
      and length(btrim(coalesce(solicitante, ''))) between 3 and 120
      and length(btrim(coalesce(unidade, ''))) between 2 and 120
      and length(btrim(coalesce(epis, ''))) between 3 and 1500
      and length(coalesce(observacoes, '')) <= 1000
    )
    or (
      (select auth.role()) = 'authenticated'
      and app_private.hub_is_rh()
    );
$$;

grant usage on schema app_private to service_role;
grant execute on all functions in schema app_private to service_role;
