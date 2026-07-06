-- ATENCAO: script destrutivo. Apaga o historico de mensagens do chat interno.
-- Rode manualmente no SQL Editor do Supabase somente quando tiver certeza.
--
-- O que este script faz:
-- 1. Remove todas as mensagens de todos os canais (hub_chat_messages).
-- 2. Remove os registros de "lido" (hub_read_receipts) associados a mensagens,
--    ja que os ids de mensagem deixam de existir.
--
-- O que este script NAO faz:
-- - Nao apaga os arquivos anexados (audio, imagem, video, documento) do bucket
--   de storage "hub-chat-files". Esses arquivos ficam orfaos no storage e
--   precisam ser removidos separadamente (via painel do Supabase Storage ou API),
--   caso deseje liberar espaco.

delete from public.hub_read_receipts
where item_type = 'message';

delete from public.hub_chat_messages;
