-- Schema HUB para Neon (Postgres puro, sem Supabase Auth/Storage/RLS).
-- Portado a partir de sql/00_create_tables.sql, removendo:
--   - "enable row level security" e toda policy (autorizacao agora e' feita
--     na camada de API, ver sql/neon/01_functions.sql e api/*.js)
--   - referencia a auth.users (hub_read_receipts.user_id agora referencia
--     hub_users.id diretamente, ja que auth.users deixa de existir)
-- Seguro de rodar em um banco novo do zero (Neon). Idempotente (if not exists).

create extension if not exists pgcrypto;

-- ── Usuarios do time (RH, gerentes, caixa) ────────────────────────────────────
create table if not exists public.hub_users (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  cpf text,
  cargo text not null default '',
  foto_perfil text,
  password_hash text,
  created_by text default 'Sistema',
  created_at timestamptz not null default now()
);

create unique index if not exists hub_users_email_key
on public.hub_users (lower(email))
where email is not null;

create unique index if not exists hub_users_cpf_key
on public.hub_users (regexp_replace(cpf, '\D', '', 'g'))
where cpf is not null;

-- ── Sessoes de auth (refresh tokens, substitui auth.sessions do Supabase) ─────
create table if not exists public.hub_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.hub_users(id) on delete cascade,
  refresh_token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists hub_sessions_user_id_idx on public.hub_sessions (user_id);

-- ── Denuncias (canal RH) ───────────────────────────────────────────────────────
create table if not exists public.hub_denuncias (
  id uuid primary key default gen_random_uuid(),
  identificacao text not null default 'Anonimo',
  categoria text not null default 'Denuncia anonima',
  descricao text not null check (char_length(btrim(descricao)) between 1 and 4000),
  status text not null default 'Aberta',
  created_by text not null default 'Sistema',
  created_at timestamptz not null default now()
);

-- ── Mensagens do chat interno ─────────────────────────────────────────────────
create table if not exists public.hub_chat_messages (
  id uuid primary key default gen_random_uuid(),
  autor text not null,
  mensagem text not null default '',
  canal text not null,
  arquivo_nome text,
  arquivo_tamanho bigint,
  arquivo_tipo text,
  arquivo_url text,
  created_by text,
  created_at timestamptz not null default now()
);

-- ── Malotes de EPI ─────────────────────────────────────────────────────────────
create table if not exists public.hub_malotes (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  origem text not null default '',
  epis text not null,
  colaboradores jsonb not null default '[]'::jsonb,
  codigo_solicitacao text,
  observacoes text not null default '',
  status text not null default 'Entrega',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now()
);

alter table public.hub_malotes
  drop constraint if exists hub_malotes_codigo_solicitacao_format;
alter table public.hub_malotes
  add constraint hub_malotes_codigo_solicitacao_format
  check (codigo_solicitacao is null or codigo_solicitacao ~ '^\d{4}-\d$');

-- ── Chamados (solicitacoes de EPI avulsas) ─────────────────────────────────────
create table if not exists public.hub_chamados (
  id uuid primary key default gen_random_uuid(),
  solicitante text not null check (char_length(btrim(solicitante)) between 3 and 120),
  unidade text not null check (char_length(btrim(unidade)) between 2 and 120),
  setor text default '',
  epis text not null check (char_length(btrim(epis)) between 3 and 1500),
  codigo_solicitacao text,
  observacoes text not null default '' check (char_length(observacoes) <= 1000),
  status text not null default 'Aberto',
  created_by text not null default 'Publico',
  created_at timestamptz not null default now()
);

-- ── Vagas ──────────────────────────────────────────────────────────────────────
-- Quadros kanban do RH
create table if not exists public.hub_quadros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  listas jsonb not null default '[]'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hub_quadros_created_at
on public.hub_quadros (created_at desc);

create table if not exists public.hub_vagas (
  id uuid primary key default gen_random_uuid(),
  cargo text not null,
  unidade text,
  descricao text not null default '',
  requisitos text not null default '',
  status text not null default 'Aberta',
  created_by text,
  created_at timestamptz not null default now()
);

-- ── Candidaturas (curriculos recebidos para vagas) ────────────────────────────
create table if not exists public.hub_candidaturas (
  id uuid primary key default gen_random_uuid(),
  vaga_id uuid references public.hub_vagas(id) on delete cascade,
  nome text not null,
  telefone text default '',
  cpf text not null,
  curriculo_url text,
  created_by text,
  created_at timestamptz not null default now()
);

-- ── Eventos (agenda do RH) ─────────────────────────────────────────────────────
create table if not exists public.hub_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null,
  horario text,
  responsavel text,
  tipo text not null default 'Evento',
  descricao text default '',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now()
);

-- ── Atestados medicos ──────────────────────────────────────────────────────────
create table if not exists public.hub_atestados (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  telefone text default '',
  unidade text default '',
  arquivo_nome text not null default 'Atestado',
  arquivo_tamanho bigint not null default 0,
  arquivo_tipo text not null default 'application/octet-stream',
  arquivo_url text not null default '',
  status text not null default 'Recebido',
  created_by text not null default 'Publico',
  created_at timestamptz not null default now()
);

-- ── Registros de VT (vale-transporte) ─────────────────────────────────────────
create table if not exists public.hub_vt_registros (
  id uuid primary key default gen_random_uuid(),
  colaborador text not null check (char_length(trim(colaborador)) between 3 and 120),
  unidade text not null check (char_length(trim(unidade)) between 2 and 120),
  mes text not null check (mes in ('Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro')),
  dias_uteis integer not null check (dias_uteis >= 0),
  valor_passagem numeric(10,2) not null check (valor_passagem >= 0),
  saldo_atual numeric(10,2) not null check (saldo_atual >= 0),
  valor_necessario numeric(10,2) not null check (valor_necessario >= 0),
  created_by text,
  created_at timestamptz not null default now()
);

-- ── Documentos de contratados ──────────────────────────────────────────────────
create table if not exists public.hub_documentos_contratados (
  id bigint generated by default as identity primary key,
  empresa text not null check (empresa in ('Fredy Pneus', 'Besten Pneus', 'Achei Pneus', 'Trinca Mkt')),
  origem_html text not null default '' check (origem_html = '' or origem_html ~ '^documentos-(fredy|besten|achei|trinca)\.html$'),
  nome text not null check (char_length(nome) between 3 and 160),
  cpf text not null check (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'),
  telefone text not null check (regexp_replace(telefone, '\D', '', 'g') ~ '^\d{10,11}$'),
  documentos jsonb not null default '[]'::jsonb,
  created_by text not null default 'Publico',
  created_at timestamptz not null default now()
);

-- ── Leitura de notificacoes/mensagens por conta (cross-device) ────────────────
create table if not exists public.hub_read_receipts (
  user_id uuid not null references public.hub_users(id) on delete cascade,
  item_type text not null check (item_type in ('message', 'notification')),
  item_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

-- ── Status de testes automatizados (usado pelos testes do repositorio) ───────
create table if not exists public.hub_unit_test_runs (
  id bigint generated by default as identity primary key,
  test_suite text not null,
  status text not null check (status in ('passed', 'failed')),
  total_checks integer not null default 0,
  passed_checks integer not null default 0,
  failed_checks integer not null default 0,
  output text,
  commit_sha text,
  created_at timestamptz not null default now()
);

-- ── Feedback (modulo "Feedbacks/Reclamacoes/Sugestoes", FEEDBACK_TABLE em script.js) ─
create table if not exists public.hub_feedbacks (
  id uuid primary key default gen_random_uuid(),
  tipo text,
  mensagem text not null,
  autor_nome text,
  autor_email text,
  status text not null default 'Novo',
  created_by text,
  created_at timestamptz not null default now()
);

-- ── app_private: rate limit e senhas de acao (portado de sql/01_schema_rls.sql) ──
create schema if not exists app_private;

create table if not exists app_private.hub_public_submission_log (
  id bigserial primary key,
  form_type text not null,
  ip_hash text not null,
  request_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists hub_public_submission_log_recent_idx
on app_private.hub_public_submission_log (form_type, ip_hash, created_at desc);

create unique index if not exists hub_public_submission_log_request_id_key
on app_private.hub_public_submission_log (request_id)
where request_id is not null;

create table if not exists app_private.hub_action_passwords (
  action text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);
