create table if not exists public.hub_read_receipts (
  user_id text not null,
  item_type text not null,
  item_id text not null,
  read_at timestamptz not null default now(),
  constraint hub_read_receipts_item_type_check
    check (item_type in ('notification', 'message'))
);

create index if not exists hub_read_receipts_user_idx
  on public.hub_read_receipts (user_id);

create index if not exists hub_read_receipts_item_idx
  on public.hub_read_receipts (user_id, item_type, item_id);
