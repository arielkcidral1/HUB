alter table if exists public.hub_advertencias_suspensoes
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_tamanho bigint,
  add column if not exists arquivo_tipo text,
  add column if not exists arquivo_url text;
