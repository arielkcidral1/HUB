# SQL do projeto HUB

Pasta com uma copia consolidada de todo o SQL necessario para o projeto funcionar,
para facilitar consulta e execucao manual no SQL Editor do Supabase.

**Importante:** esta pasta e so uma copia de referencia. As migrations oficiais,
usadas pelo Supabase CLI (`supabase db push`), continuam em `supabase/migrations/`.
Nao apague nem edite os arquivos de la a partir daqui — edite aqui e depois
replique la (ou peca para eu fazer isso), senao os dois ficam dessincronizados.

## Estrutura

- `00_create_tables.sql` — cria (com `if not exists`, seguro de rodar em cima de
  um banco que ja tem as tabelas) todas as tabelas usadas pelo app: hub_users,
  hub_denuncias, hub_chat_messages, hub_malotes, hub_chamados, hub_vagas,
  hub_candidaturas, hub_eventos, hub_atestados, hub_vt_registros,
  hub_documentos_contratados, hub_read_receipts, hub_unit_test_runs. Tambem liga
  RLS em todas elas.

  **Aviso:** boa parte dessas tabelas foi criada manualmente no painel do
  Supabase, nunca existiu um `create table` versionado no repositorio. Os tipos
  e constraints aqui foram reconstruidos a partir do uso no codigo (script.js) e
  das migrations existentes — nao e um dump exato do banco de producao (nao
  tenho acesso direto ao banco neste ambiente). Confira contra o painel do
  Supabase antes de usar como unica fonte de verdade para restaurar o banco.

- `01_schema_rls.sql` — schema/politicas de RLS por cargo (RH, Gerente,
  Caixa/Crediarista) das tabelas principais do HUB.
- `02_verify_rls.sql` — consultas de verificacao/diagnostico das politicas de RLS.
- `03_limpar_chats.sql` — script destrutivo para apagar o historico de mensagens
  do chat interno. So rodar manualmente quando tiver certeza.
- `migrations/` — copia de todas as migrations incrementais (mesmo conteudo de
  `supabase/migrations/`), na ordem cronologica pelo nome do arquivo. Inclui as
  duas mais novas:
  - `20260707000000_add_hub_atestados_rls_policies.sql` — a tabela hub_atestados
    recebe envios publicos (via `atestados.html`) mas nunca teve suas policies de
    RLS registradas em SQL; esta migration documenta/garante essas policies.
  - `20260707000100_add_egress_optimization_indexes.sql` — indices nas colunas
    mais filtradas/ordenadas (canal, status, created_at, vaga_id, user_id) para
    reduzir sequential scans nas consultas que o app repete a cada poucos
    segundos.

## Ordem de execucao (projeto Supabase novo, do zero)

1. Rodar `00_create_tables.sql`.
2. Rodar `01_schema_rls.sql`.
3. Rodar cada arquivo de `migrations/` em ordem (pelo prefixo de data no nome) —
   isso aplica as demais alteracoes incrementais, incluindo os indices de egress.
4. Rodar `02_verify_rls.sql` para conferir que as politicas foram aplicadas.

## Sobre otimizacao de egress

O indice do chat (`idx_hub_chat_messages_canal_created_at`) e os demais criados
em `20260707000100_add_egress_optimization_indexes.sql` atacam o lado do banco
(consultas mais rapidas, menos dados varridos). Mas o maior gerador de egress
deste app hoje e do lado do cliente, nao do banco: o HUB busca a tabela inteira
de cada colecao a cada 5 segundos (`refreshTimer` em `script.js`), mesmo com
Realtime ja ativo em paralelo. Isso multiplica o trafego de saida por sessao
aberta. Reduzir/eliminar esse polling redundante (confiar mais no Realtime, ou
aumentar bastante o intervalo) e uma mudanca no codigo do app, nao em SQL — se
quiser, posso implementar isso separadamente.
