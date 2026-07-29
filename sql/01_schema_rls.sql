-- HUB RH - RLS por cargo
-- Projeto Supabase: nblfwesptlpetbwfmdqf
--
-- Modelo:
-- - anon: apenas fluxos publicos controlados.
-- - RH: acesso total as tabelas internas do HUB.
-- - Gerente: chat em geral-gerentes e DMs proprias.
-- - Caixa/Crediarista: chat em geral-caixa e DMs proprias.
--
-- Observacao: para o cargo funcionar, cada usuario do Auth precisa ter um
-- perfil em public.hub_users com email igual ao email do Auth e cargo definido.

alter table if exists public.hub_denuncias enable row level security;
alter table if exists public.hub_chat_messages enable row level security;
alter table if exists public.hub_malotes enable row level security;
alter table if exists public.hub_chamados enable row level security;
alter table if exists public.hub_vagas enable row level security;
alter table if exists public.hub_eventos enable row level security;
alter table if exists public.hub_vt_registros enable row level security;
alter table if exists public.hub_documentos_contratados enable row level security;
alter table if exists public.hub_candidaturas enable row level security;
alter table if exists public.hub_users enable row level security;

alter table if exists public.hub_users
add column if not exists email text;

alter table if exists public.hub_users
add column if not exists cpf text;

alter table if exists public.hub_documentos_contratados
add column if not exists email text;

alter table if exists public.hub_users
drop column if exists senha;

create unique index if not exists hub_users_email_key
on public.hub_users (lower(email))
where email is not null;

create unique index if not exists hub_users_cpf_key
on public.hub_users (regexp_replace(cpf, '\\D', '', 'g'))
where cpf is not null;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create table if not exists app_private.hub_public_submission_log (
  id bigserial primary key,
  form_type text not null,
  ip_hash text not null,
  request_id uuid,
  created_at timestamptz not null default now()
);

alter table app_private.hub_public_submission_log
add column if not exists request_id uuid;

create index if not exists hub_public_submission_log_recent_idx
on app_private.hub_public_submission_log (form_type, ip_hash, created_at desc);

create unique index if not exists hub_public_submission_log_request_id_key
on app_private.hub_public_submission_log (request_id)
where request_id is not null;

create or replace function app_private.hub_check_public_rate_limit(
  p_form_type text,
  p_ip_hash text,
  p_window_seconds integer,
  p_max integer
)
returns boolean
language plpgsql
security definer
set search_path = app_private
as $$
declare
  recent_count integer;
begin
  delete from app_private.hub_public_submission_log
  where created_at < now() - interval '2 days';

  select count(*) into recent_count
  from app_private.hub_public_submission_log
  where form_type = p_form_type
    and ip_hash = p_ip_hash
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_max then
    return false;
  end if;

  insert into app_private.hub_public_submission_log (form_type, ip_hash)
  values (p_form_type, p_ip_hash);

  return true;
end;
$$;

create or replace function public.hub_check_public_rate_limit(
  p_form_type text,
  p_ip_hash text,
  p_window_seconds integer,
  p_max integer
)
returns boolean
language sql
security definer
set search_path = public, app_private
as $$
  select app_private.hub_check_public_rate_limit(p_form_type, p_ip_hash, p_window_seconds, p_max);
$$;

revoke all on function public.hub_check_public_rate_limit(text, text, integer, integer) from public;
revoke execute on function public.hub_check_public_rate_limit(text, text, integer, integer) from anon;
revoke execute on function public.hub_check_public_rate_limit(text, text, integer, integer) from authenticated;
grant execute on function public.hub_check_public_rate_limit(text, text, integer, integer) to service_role;

create or replace function app_private.hub_reserve_public_rate_limit(
  p_form_type text,
  p_ip_hash text,
  p_window_seconds integer,
  p_max integer,
  p_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = app_private
as $$
declare
  recent_count integer;
begin
  delete from app_private.hub_public_submission_log
  where created_at < now() - interval '2 days';

  select count(*) into recent_count
  from app_private.hub_public_submission_log
  where form_type = p_form_type
    and ip_hash = p_ip_hash
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_max then
    return false;
  end if;

  insert into app_private.hub_public_submission_log (form_type, ip_hash, request_id)
  values (p_form_type, p_ip_hash, p_request_id);

  return true;
end;
$$;

create or replace function public.hub_reserve_public_rate_limit(
  p_form_type text,
  p_ip_hash text,
  p_window_seconds integer,
  p_max integer,
  p_request_id uuid
)
returns boolean
language sql
security definer
set search_path = public, app_private
as $$
  select app_private.hub_reserve_public_rate_limit(
    p_form_type,
    p_ip_hash,
    p_window_seconds,
    p_max,
    p_request_id
  );
$$;

create or replace function app_private.hub_release_public_rate_limit(p_request_id uuid)
returns void
language sql
security definer
set search_path = app_private
as $$
  delete from app_private.hub_public_submission_log
  where request_id = p_request_id;
$$;

create or replace function public.hub_release_public_rate_limit(p_request_id uuid)
returns void
language sql
security definer
set search_path = public, app_private
as $$
  select app_private.hub_release_public_rate_limit(p_request_id);
$$;

revoke all on function public.hub_reserve_public_rate_limit(text, text, integer, integer, uuid) from public;
revoke all on function public.hub_release_public_rate_limit(uuid) from public;
revoke all on function public.hub_reserve_public_rate_limit(text, text, integer, integer, uuid) from anon, authenticated;
revoke all on function public.hub_release_public_rate_limit(uuid) from anon, authenticated;
grant execute on function public.hub_reserve_public_rate_limit(text, text, integer, integer, uuid) to service_role;
grant execute on function public.hub_release_public_rate_limit(uuid) to service_role;

create or replace function app_private.hub_normalize(value text)
returns text
language sql
stable
set search_path = app_private, pg_temp
as $$
  select lower(regexp_replace(coalesce(value, ''), '[^a-zA-Z0-9]+', '-', 'g'));
$$;

create or replace function app_private.hub_current_user_email()
returns text
language sql
stable
set search_path = app_private, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function app_private.hub_current_user_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.nome
      from public.hub_users u
      where lower(u.email) = app_private.hub_current_user_email()
      limit 1
    ),
    auth.jwt() ->> 'email',
    ''
  );
$$;

create or replace function app_private.hub_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(
    (
      select u.cargo
      from public.hub_users u
      where lower(u.email) = app_private.hub_current_user_email()
      limit 1
    ),
    auth.jwt() -> 'app_metadata' ->> 'cargo',
    ''
  ));
$$;

create or replace function app_private.hub_is_rh()
returns boolean
language sql
stable
set search_path = app_private, public, pg_temp
as $$
  select app_private.hub_current_user_role() = 'rh';
$$;

create or replace function app_private.hub_is_manager()
returns boolean
language sql
stable
set search_path = app_private, public, pg_temp
as $$
  select app_private.hub_current_user_role() in ('gerente', 'manager');
$$;

create or replace function app_private.hub_is_cashier()
returns boolean
language sql
stable
set search_path = app_private, public, pg_temp
as $$
  select app_private.hub_current_user_role() in ('caixa', 'crediarista');
$$;

create or replace function app_private.hub_can_access_chat_channel(channel_id text)
returns boolean
language sql
stable
set search_path = app_private, public, pg_temp
as $$
  select
    app_private.hub_is_rh()
    or (
      app_private.hub_is_manager()
      and (
        channel_id = 'geral-gerentes'
        or (
          channel_id like 'dm:%'
          and channel_id like ('%' || app_private.hub_normalize(app_private.hub_current_user_name()) || '%')
        )
      )
    )
    or (
      app_private.hub_is_cashier()
      and (
        channel_id = 'geral-caixa'
        or (
          channel_id like 'dm:%'
          and channel_id like ('%' || app_private.hub_normalize(app_private.hub_current_user_name()) || '%')
        )
      )
    );
$$;

grant execute on all functions in schema app_private to authenticated;
grant usage on schema app_private to service_role;
grant execute on all functions in schema app_private to service_role;

-- Public submissions keep their narrow shape. RH may subsequently update
-- their status, including moving records to Arquivada.
create or replace function app_private.hub_public_denuncia_allowed(
  identificacao text,
  categoria text,
  descricao text,
  status text
)
returns boolean
language sql
stable
set search_path = app_private, pg_temp
as $$
  select
    (
      coalesce(identificacao, 'Anonimo') = 'Anonimo'
      and coalesce(categoria, 'Denuncia anonima') = 'Denuncia anonima'
      and coalesce(status, 'Aberta') = 'Aberta'
      and length(btrim(coalesce(descricao, ''))) between 1 and 4000
    )
    or (
      (select auth.role()) = 'authenticated'
      and app_private.hub_is_rh()
    );
$$;

create or replace function app_private.hub_public_chamado_allowed(
  solicitante text,
  unidade text,
  epis text,
  observacoes text,
  status text,
  created_by text
)
returns boolean
language sql
stable
set search_path = app_private, pg_temp
as $$
  select
    (
      coalesce(status, 'Aberto') = 'Aberto'
      and coalesce(created_by, 'Publico') = 'Publico'
      and length(btrim(coalesce(solicitante, ''))) between 3 and 120
      and length(btrim(coalesce(unidade, ''))) between 2 and 120
      and length(btrim(coalesce(epis, ''))) between 3 and 1500
      and length(coalesce(observacoes, '')) <= 1000
    )
    or (
      (select auth.role()) = 'authenticated'
      and app_private.hub_is_rh()
    );
$$;

-- Atualizacao de perfil e feita pela Edge Function autenticada hub-account-update.
drop function if exists public.hub_update_own_profile(text, text);

drop policy if exists "hub_denuncias_authenticated_all" on public.hub_denuncias;
drop policy if exists "hub_chat_messages_authenticated_all" on public.hub_chat_messages;
drop policy if exists "hub_malotes_authenticated_all" on public.hub_malotes;
drop policy if exists "hub_chamados_authenticated_all" on public.hub_chamados;
drop policy if exists "hub_vagas_authenticated_all" on public.hub_vagas;
drop policy if exists "Permitir leitura para usuários autenticados" on public.hub_vagas;
drop policy if exists "Permitir inserção para o próprio usuário" on public.hub_vagas;
drop policy if exists "hub_eventos_authenticated_all" on public.hub_eventos;
drop policy if exists "hub_vt_registros_authenticated_all" on public.hub_vt_registros;
drop policy if exists "hub_documentos_contratados_authenticated_all" on public.hub_documentos_contratados;
drop policy if exists "hub_candidaturas_authenticated_all" on public.hub_candidaturas;
drop policy if exists "hub_users_authenticated_all" on public.hub_users;

drop policy if exists "hub_denuncias_rh_all" on public.hub_denuncias;
drop policy if exists "hub_chat_messages_role_select" on public.hub_chat_messages;
drop policy if exists "hub_chat_messages_role_insert" on public.hub_chat_messages;
drop policy if exists "hub_chat_messages_rh_update" on public.hub_chat_messages;
drop policy if exists "hub_chat_messages_rh_delete" on public.hub_chat_messages;
drop policy if exists "hub_malotes_rh_all" on public.hub_malotes;
drop policy if exists "hub_chamados_rh_all" on public.hub_chamados;
drop policy if exists "hub_vagas_rh_all" on public.hub_vagas;
drop policy if exists "hub_eventos_rh_all" on public.hub_eventos;
drop policy if exists "hub_vt_registros_rh_all" on public.hub_vt_registros;
drop policy if exists "hub_documentos_contratados_rh_all" on public.hub_documentos_contratados;
drop policy if exists "hub_candidaturas_rh_all" on public.hub_candidaturas;
drop policy if exists "hub_users_authenticated_select" on public.hub_users;
drop policy if exists "hub_users_rh_write" on public.hub_users;
drop policy if exists "hub_users_self_update" on public.hub_users;

create policy "hub_denuncias_rh_all"
on public.hub_denuncias
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_chat_messages_role_select"
on public.hub_chat_messages
for select
to authenticated
using (app_private.hub_can_access_chat_channel(canal));

create policy "hub_chat_messages_role_insert"
on public.hub_chat_messages
for insert
to authenticated
with check (app_private.hub_can_access_chat_channel(canal));

create policy "hub_chat_messages_rh_update"
on public.hub_chat_messages
for update
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_chat_messages_rh_delete"
on public.hub_chat_messages
for delete
to authenticated
using (app_private.hub_is_rh());

create policy "hub_malotes_rh_all"
on public.hub_malotes
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_chamados_rh_all"
on public.hub_chamados
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_vagas_rh_all"
on public.hub_vagas
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_eventos_rh_all"
on public.hub_eventos
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_vt_registros_rh_all"
on public.hub_vt_registros
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_documentos_contratados_rh_all"
on public.hub_documentos_contratados
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_candidaturas_rh_all"
on public.hub_candidaturas
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

create policy "hub_users_authenticated_select"
on public.hub_users
for select
to authenticated
using (
  app_private.hub_is_rh()
  or lower(email) = app_private.hub_current_user_email()
);

create policy "hub_users_rh_write"
on public.hub_users
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

-- Policies publicas esperadas.
-- Fluxos publicos passam pela Edge Function hub-public-submit, com validacao
-- e rate limit. Por isso nao ha acesso anonimo direto nas tabelas hub_*.
drop policy if exists "hub_denuncias_public_insert" on public.hub_denuncias;
drop policy if exists "hub_chamados_public_insert" on public.hub_chamados;
drop policy if exists "hub_candidaturas_public_insert" on public.hub_candidaturas;
drop policy if exists "hub_vagas_public_select_open" on public.hub_vagas;

-- Storage: curriculos privados. Upload publico passa pela Edge Function.
update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
where id = 'hub-curriculos';

drop policy if exists "hub_curriculos_anon_insert" on storage.objects;
drop policy if exists "hub_curriculos_authenticated_select" on storage.objects;
drop policy if exists "hub_curriculos_authenticated_insert" on storage.objects;
drop policy if exists "hub_curriculos_authenticated_update" on storage.objects;
drop policy if exists "hub_curriculos_authenticated_delete" on storage.objects;
drop policy if exists "hub_curriculos_rh_select" on storage.objects;
drop policy if exists "hub_curriculos_rh_insert" on storage.objects;
drop policy if exists "hub_curriculos_rh_update" on storage.objects;
drop policy if exists "hub_curriculos_rh_delete" on storage.objects;

create policy "hub_curriculos_rh_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hub-curriculos'
  and app_private.hub_is_rh()
);

create policy "hub_curriculos_rh_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'hub-curriculos'
  and app_private.hub_is_rh()
);

create policy "hub_curriculos_rh_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'hub-curriculos'
  and app_private.hub_is_rh()
)
with check (
  bucket_id = 'hub-curriculos'
  and app_private.hub_is_rh()
);

create policy "hub_curriculos_rh_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'hub-curriculos'
  and app_private.hub_is_rh()
);

-- Storage: documentos de contratados privados. Upload publico passa pela Edge Function.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-contratados-documentos',
  'hub-contratados-documentos',
  false,
  10485760,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hub_contratados_docs_rh_select" on storage.objects;
drop policy if exists "hub_contratados_docs_rh_insert" on storage.objects;
drop policy if exists "hub_contratados_docs_rh_update" on storage.objects;
drop policy if exists "hub_contratados_docs_rh_delete" on storage.objects;

create policy "hub_contratados_docs_rh_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
);

create policy "hub_contratados_docs_rh_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
);

create policy "hub_contratados_docs_rh_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
)
with check (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
);

create policy "hub_contratados_docs_rh_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
);

-- Storage: anexos do chat privados e restritos ao RH.
update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
where id = 'hub-chat-files';

drop policy if exists "hub_chat_files_authenticated_select" on storage.objects;
drop policy if exists "hub_chat_files_authenticated_insert" on storage.objects;
drop policy if exists "hub_chat_files_authenticated_update" on storage.objects;
drop policy if exists "hub_chat_files_authenticated_delete" on storage.objects;
drop policy if exists "hub_chat_files_rh_select" on storage.objects;
drop policy if exists "hub_chat_files_rh_insert" on storage.objects;
drop policy if exists "hub_chat_files_rh_update" on storage.objects;
drop policy if exists "hub_chat_files_rh_delete" on storage.objects;
drop policy if exists "hub_chat_files_role_select" on storage.objects;
drop policy if exists "hub_chat_files_role_insert" on storage.objects;
drop policy if exists "hub_chat_files_role_update" on storage.objects;
drop policy if exists "hub_chat_files_role_delete" on storage.objects;

create policy "hub_chat_files_role_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hub-chat-files'
  and (
    app_private.hub_is_rh()
    or name like 'avatars/%'
    or (
      name like 'chat/%'
      and app_private.hub_can_access_chat_channel(split_part(name, '/', 2))
    )
  )
);

create policy "hub_chat_files_role_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'hub-chat-files'
  and (
    app_private.hub_is_rh()
    or name like 'avatars/%'
    or (
      name like 'chat/%'
      and app_private.hub_can_access_chat_channel(split_part(name, '/', 2))
    )
  )
);

create policy "hub_chat_files_role_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'hub-chat-files'
  and app_private.hub_is_rh()
)
with check (
  bucket_id = 'hub-chat-files'
  and app_private.hub_is_rh()
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 10485760
  and lower(coalesce(metadata ->> 'mimetype', '')) in (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
);

create policy "hub_chat_files_role_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'hub-chat-files'
  and app_private.hub_is_rh()
);
