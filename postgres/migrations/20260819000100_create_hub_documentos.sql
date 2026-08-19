-- Documentos RH eram salvos so no localStorage/sessionStorage do navegador
-- (nunca chegavam ao Postgres), entao um documento gerado numa maquina nao
-- aparecia em outra, mesmo para contas com cargo RH. Esta tabela passa a
-- guardar os registros como as demais colecoes do HUB.
create table if not exists public.hub_documentos (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  summary text,
  details text,
  form_data jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz
);
