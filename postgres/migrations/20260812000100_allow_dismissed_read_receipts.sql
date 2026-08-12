-- Apagar uma notificacao passa a valer para a conta em qualquer maquina.
-- O recibo reaproveita hub_read_receipts com um terceiro tipo, 'dismissed'.
-- Aplicada em producao (fredyrh) em 2026-08-12.
alter table public.hub_read_receipts
  drop constraint if exists hub_read_receipts_item_type_check;

alter table public.hub_read_receipts
  add constraint hub_read_receipts_item_type_check
    check (item_type in ('notification', 'message', 'dismissed'));
