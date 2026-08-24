-- Este arquivo foi reescrito em 2026-08-12 para refletir a tabela que existe de
-- fato no banco. A versao anterior declarava user_id como text, sem chave
-- primaria e sem chave estrangeira, o que nao correspondia a producao e levou a
-- codigo cliente que gravava linhas recusadas silenciosamente pelo banco.
-- Quem escrever aqui precisa saber que user_id e um uuid de hub_users e que
-- (user_id, item_type, item_id) e unico: insercoes repetidas exigem
-- on conflict do nothing.
create table if not exists public.hub_read_receipts (
  user_id uuid not null references public.hub_users (id) on delete cascade,
  item_type text not null,
  item_id text not null,
  read_at timestamptz not null default now(),
  constraint hub_read_receipts_pkey primary key (user_id, item_type, item_id),
  constraint hub_read_receipts_item_type_check
    check (item_type in ('notification', 'message', 'dismissed'))
);
