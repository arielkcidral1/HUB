-- Advertencias e suspensoes eram salvas so no localStorage/sessionStorage do
-- navegador (nunca chegavam ao Postgres), entao cada RH via apenas os
-- registros feitos na propria maquina. Esta tabela passa a guardar os
-- registros como as demais colecoes do HUB.
create table if not exists public.hub_advertencias_suspensoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'advertencia',
  colaborador text not null,
  data_medida text,
  unidade text,
  local text,
  motivo text,
  created_by text,
  created_at timestamptz not null default now(),
  constraint hub_advertencias_suspensoes_tipo_check check (tipo in ('advertencia', 'suspensao'))
);

alter table if exists public.hub_advertencias_suspensoes enable row level security;

drop policy if exists "hub_advertencias_suspensoes_rh_all" on public.hub_advertencias_suspensoes;
create policy "hub_advertencias_suspensoes_rh_all"
on public.hub_advertencias_suspensoes
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());
