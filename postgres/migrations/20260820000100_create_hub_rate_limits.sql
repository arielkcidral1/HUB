-- Registro de tentativas dos endpoints publicos (formularios do site e
-- login), usado para limitar envios/tentativas por IP dentro de uma janela
-- de tempo. A tabela e criada automaticamente pela API na primeira chamada
-- (api/rate-limit.js); este arquivo existe so como referencia de schema.
create table if not exists public.hub_rate_limits (
  id bigserial primary key,
  scope text not null,
  client_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists hub_rate_limits_scope_key_idx
  on public.hub_rate_limits (scope, client_key, created_at);
