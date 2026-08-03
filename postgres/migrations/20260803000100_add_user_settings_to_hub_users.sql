alter table if exists public.hub_users
add column if not exists configuracoes jsonb not null default '{}'::jsonb;
