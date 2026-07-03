alter table public.hub_malotes
  add column if not exists codigo_solicitacao text,
  add column if not exists observacoes text not null default '';

alter table public.hub_malotes
  drop constraint if exists hub_malotes_codigo_solicitacao_format;

alter table public.hub_malotes
  add constraint hub_malotes_codigo_solicitacao_format
  check (codigo_solicitacao is null or codigo_solicitacao ~ '^\\d{4}-\\d$');
