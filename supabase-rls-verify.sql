-- HUB RH - verificacao de RLS
-- Rode no Supabase SQL Editor.

-- 1) Todas as tabelas HUB devem estar com RLS ativo.
select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename like 'hub_%'
order by tablename;

-- 2) Policies atuais das tabelas HUB.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename like 'hub_%'
order by tablename, policyname;

-- 3) Policies antigas amplas nao devem existir.
-- Esperado: zero linhas.
select
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
  and tablename like 'hub_%'
  and policyname like '%authenticated_all%'
order by tablename, policyname;

-- 4) Perfis sem email nao conseguem resolver cargo via public.hub_users.
-- Esperado: zero usuarios sem email.
select
  count(*) as total_users,
  count(*) filter (where email is null or btrim(email) = '') as users_without_email,
  count(*) filter (where cargo is null or btrim(cargo) = '') as users_without_cargo
from public.hub_users;

-- 5) Policies anonimas internas perigosas nao devem existir.
-- Esperado: zero linhas.
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'hub_denuncias',
    'hub_chat_messages',
    'hub_malotes',
    'hub_chamados',
    'hub_eventos',
    'hub_candidaturas',
    'hub_users'
  )
  and 'anon' = any(roles)
  and cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL')
order by tablename, policyname;

-- 5.1) Nenhuma tabela HUB deve ter policy anonima direta.
-- Fluxos publicos passam pela Edge Function hub-public-submit.
-- Esperado: zero linhas.
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'hub_%'
  and 'anon' = any(roles)
order by tablename, policyname;

-- 6) Bucket de curriculos deve ser privado, limitado a 5 MB e MIME restrito.
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'hub-curriculos';

-- 7) Policies do bucket de curriculos.
-- Esperado:
-- - nenhuma policy anonima.
-- - authenticated apenas via app_private.hub_is_rh().
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    qual ilike '%hub-curriculos%'
    or with_check ilike '%hub-curriculos%'
  )
order by policyname;

-- 8) Policies extras de vagas nao devem existir.
-- Esperado: zero linhas.
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'hub_vagas'
  and policyname in (
    'Permitir leitura para usuários autenticados',
    'Permitir inserção para o próprio usuário'
  )
order by policyname;

-- 9) Bucket de anexos do chat deve ser privado, limitado a 10 MB e MIME restrito.
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'hub-chat-files';

-- 10) Policies do bucket de anexos do chat.
-- Esperado:
-- - select/insert por RH, avatar ou canal permitido pelo cargo.
-- - update/delete somente RH.
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    qual ilike '%hub-chat-files%'
    or with_check ilike '%hub-chat-files%'
  )
order by policyname;

-- 11) A coluna legada de senha nao deve existir.
-- Esperado: zero linhas.
select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'hub_users'
  and column_name = 'senha';

-- 12) O usuario nao pode atualizar diretamente o proprio perfil.
-- Esperado: zero linhas para hub_users_self_update.
select
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'hub_users'
  and policyname = 'hub_users_self_update';

-- 13) A RPC legada de perfil nao deve existir.
-- Esperado: zero linhas.
select
  routine_schema,
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'hub_update_own_profile';

-- 14) Rate limit usado pela Edge Function publica.
select
  routine_schema,
  routine_name,
  routine_type
from information_schema.routines
where (routine_schema = 'app_private' and routine_name = 'hub_check_public_rate_limit')
   or (routine_schema = 'public' and routine_name = 'hub_check_public_rate_limit')
order by routine_schema, routine_name;

