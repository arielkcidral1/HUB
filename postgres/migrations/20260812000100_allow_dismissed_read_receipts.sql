alter table public.hub_read_receipts
  drop constraint if exists hub_read_receipts_item_type_check;

alter table public.hub_read_receipts
  add constraint hub_read_receipts_item_type_check
    check (item_type in ('notification', 'message', 'dismissed'));
