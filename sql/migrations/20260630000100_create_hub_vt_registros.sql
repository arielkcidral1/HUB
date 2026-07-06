create table if not exists public.hub_vt_registros (
  id uuid primary key default gen_random_uuid(),
  colaborador text not null check (char_length(trim(colaborador)) between 3 and 120),
  unidade text not null check (char_length(trim(unidade)) between 2 and 120),
  mes text not null check (mes in ('Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro')),
  dias_uteis integer not null check (dias_uteis >= 0),
  valor_passagem numeric(10,2) not null check (valor_passagem >= 0),
  saldo_atual numeric(10,2) not null check (saldo_atual >= 0),
  valor_necessario numeric(10,2) not null check (valor_necessario >= 0),
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.hub_vt_registros enable row level security;

grant select, insert, update, delete on public.hub_vt_registros to authenticated;
grant select, insert, update, delete on public.hub_vt_registros to service_role;

drop policy if exists "hub_vt_registros_rh_all" on public.hub_vt_registros;

create policy "hub_vt_registros_rh_all"
on public.hub_vt_registros
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());
