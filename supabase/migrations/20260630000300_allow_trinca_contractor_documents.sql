alter table public.hub_documentos_contratados
drop constraint if exists hub_documentos_contratados_empresa_check;

alter table public.hub_documentos_contratados
add constraint hub_documentos_contratados_empresa_check
check (empresa in ('Fredy Pneus', 'Besten Pneus', 'Achei Pneus', 'Trinca Mkt'));
