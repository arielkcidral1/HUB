create table if not exists public.hub_read_receipts (
  user_id uuid not null references public.hub_users (id) on delete cascade,
  item_type text not null,
  item_id text not null,
  read_at timestamptz not null default now(),
  constraint hub_read_receipts_pkey primary key (user_id, item_type, item_id),
  constraint hub_read_receipts_item_type_check
    check (item_type in ('notification', 'message', 'dismissed'))
);
