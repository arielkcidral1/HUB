-- A tabela hub_atestados ja existe em producao e recebe envios publicos
-- (atestados.html insere direto via client anon), mas nunca teve suas
-- policies de RLS registradas em uma migration. Este arquivo documenta e
-- garante essas policies de forma idempotente.

alter table public.hub_atestados enable row level security;

create or replace function app_private.hub_public_atestado_allowed(
  nome text,
  cpf text,
  telefone text,
  unidade text,
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
      coalesce(status, 'Recebido') = 'Recebido'
      and coalesce(created_by, 'Publico') = 'Publico'
      and length(btrim(coalesce(nome, ''))) between 3 and 160
      and length(regexp_replace(coalesce(cpf, ''), '\D', '', 'g')) = 11
    )
    or (
      (select auth.role()) = 'authenticated'
      and app_private.hub_is_rh()
    );
$$;

grant select, insert, update, delete on public.hub_atestados to authenticated;
grant insert on public.hub_atestados to anon;

drop policy if exists "hub_atestados_rh_all" on public.hub_atestados;
drop policy if exists "hub_atestados_public_insert" on public.hub_atestados;

create policy "hub_atestados_rh_all"
on public.hub_atestados
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_atestados_public_insert"
on public.hub_atestados
for insert
to anon
with check (
  app_private.hub_public_atestado_allowed(nome, cpf, telefone, unidade, status, created_by)
);
