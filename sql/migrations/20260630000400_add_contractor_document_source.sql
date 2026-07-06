alter table public.hub_documentos_contratados
add column if not exists origem_html text not null default '';

alter table public.hub_documentos_contratados
drop constraint if exists hub_documentos_contratados_origem_html_check;

alter table public.hub_documentos_contratados
add constraint hub_documentos_contratados_origem_html_check
check (origem_html = '' or origem_html ~ '^documentos-(fredy|besten|achei|trinca)\.html$');
