-- Indices para reduzir egress/custo das consultas mais frequentes do app.
-- O HUB re-consulta as tabelas a cada poucos segundos (auto-refresh) e sempre
-- filtra/ordena pelas mesmas colunas; sem indice, cada consulta faz sequential
-- scan na tabela inteira e transfere/processa mais dados do que precisa.

-- Chat: toda consulta filtra por canal e ordena por created_at.
create index if not exists idx_hub_chat_messages_canal_created_at
on public.hub_chat_messages (canal, created_at desc);

-- Dashboards filtram por status nessas tabelas.
create index if not exists idx_hub_denuncias_status
on public.hub_denuncias (status);

create index if not exists idx_hub_chamados_status
on public.hub_chamados (status);

create index if not exists idx_hub_vagas_status
on public.hub_vagas (status);

create index if not exists idx_hub_atestados_status
on public.hub_atestados (status);

-- Candidaturas sao buscadas por vaga_id o tempo todo.
create index if not exists idx_hub_candidaturas_vaga_id
on public.hub_candidaturas (vaga_id);

-- Documentos de contratados sao filtrados por empresa (uma pagina por empresa).
create index if not exists idx_hub_documentos_contratados_empresa
on public.hub_documentos_contratados (empresa);

-- Leitura de notificacoes: toda sincronizacao busca por user_id.
create index if not exists idx_hub_read_receipts_user_id
on public.hub_read_receipts (user_id);

-- Todas as tabelas sao ordenadas por created_at desc no carregamento inicial.
create index if not exists idx_hub_malotes_created_at
on public.hub_malotes (created_at desc);

create index if not exists idx_hub_eventos_created_at
on public.hub_eventos (created_at desc);

create index if not exists idx_hub_vt_registros_created_at
on public.hub_vt_registros (created_at desc);
