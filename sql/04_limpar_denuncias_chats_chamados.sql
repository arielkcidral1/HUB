-- ATENCAO: script destrutivo. Remove dados operacionais solicitados.
--
-- O que este script apaga:
-- 1. Denuncias com status "Arquivada".
-- 2. Todas as mensagens do chat interno.
-- 3. Todos os chamados.
-- 4. Recibos de leitura relacionados a mensagens, chamados e denuncias arquivadas.
--
-- O que este script NAO apaga:
-- - Denuncias abertas/urgentes/lidas.
-- - Arquivos anexados em storage/blob referenciados por mensagens antigas.

begin;

select
  'antes' as etapa,
  (select count(*)::int from public.hub_denuncias where lower(status) = 'arquivada') as denuncias_arquivadas,
  (select count(*)::int from public.hub_chat_messages) as mensagens_chat,
  (select count(*)::int from public.hub_chamados) as chamados,
  (
    select count(*)::int
    from public.hub_read_receipts r
    where r.item_type = 'message'
      or (
        r.item_type = 'notification'
        and (
          r.item_id = 'mensagens-rh'
          or exists (
            select 1
            from public.hub_denuncias d
            where lower(d.status) = 'arquivada'
              and r.item_id = 'denuncia-' || d.id::text
          )
          or exists (
            select 1
            from public.hub_chamados c
            where r.item_id = 'chamado-' || c.id::text
          )
        )
      )
  ) as leituras_relacionadas;

with deleted_denuncias as (
  delete from public.hub_denuncias
  where lower(status) = 'arquivada'
  returning id
),
deleted_chamados as (
  delete from public.hub_chamados
  returning id
),
deleted_chat_messages as (
  delete from public.hub_chat_messages
  returning id
),
deleted_read_receipts as (
  delete from public.hub_read_receipts r
  where r.item_type = 'message'
    or (
      r.item_type = 'notification'
      and (
        r.item_id = 'mensagens-rh'
        or r.item_id in (
          select 'denuncia-' || id::text from deleted_denuncias
          union
          select 'chamado-' || id::text from deleted_chamados
        )
      )
    )
  returning item_type, item_id
)
select
  'apagados' as etapa,
  (select count(*)::int from deleted_denuncias) as denuncias_arquivadas,
  (select count(*)::int from deleted_chat_messages) as mensagens_chat,
  (select count(*)::int from deleted_chamados) as chamados,
  (select count(*)::int from deleted_read_receipts) as leituras_relacionadas;

select
  'depois' as etapa,
  (select count(*)::int from public.hub_denuncias where lower(status) = 'arquivada') as denuncias_arquivadas,
  (select count(*)::int from public.hub_chat_messages) as mensagens_chat,
  (select count(*)::int from public.hub_chamados) as chamados,
  (
    select count(*)::int
    from public.hub_read_receipts r
    where r.item_type = 'message'
      or r.item_id = 'mensagens-rh'
      or r.item_id like 'chamado-%'
  ) as leituras_relacionadas;

commit;
