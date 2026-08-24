create table if not exists public.hub_rate_limits (
  id bigserial primary key,
  scope text not null,
  client_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists hub_rate_limits_scope_key_idx
  on public.hub_rate_limits (scope, client_key, created_at);
