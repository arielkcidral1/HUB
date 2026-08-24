create schema if not exists app_private;

create or replace function app_private.hub_is_rh()
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.hub_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(coalesce(cargo, '')) = 'rh'
  );
$$;

alter table if exists public.hub_denuncias enable row level security;
alter table if exists public.hub_chat_messages enable row level security;
alter table if exists public.hub_malotes enable row level security;
alter table if exists public.hub_chamados enable row level security;
alter table if exists public.hub_vagas enable row level security;
alter table if exists public.hub_eventos enable row level security;
alter table if exists public.hub_vt_registros enable row level security;
alter table if exists public.hub_documentos_contratados enable row level security;
alter table if exists public.hub_users enable row level security;

drop policy if exists "hub_vagas_public_select_open" on public.hub_vagas;

drop policy if exists "hub_documentos_contratados_rh_all" on public.hub_documentos_contratados;
create policy "hub_documentos_contratados_rh_all"
on public.hub_documentos_contratados
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

drop policy if exists "hub_vt_registros_rh_all" on public.hub_vt_registros;
create policy "hub_vt_registros_rh_all"
on public.hub_vt_registros
for all
to authenticated
using (app_private.hub_is_rh())
with check (app_private.hub_is_rh());

update storage.buckets
set public = false
where id = 'hub-curriculos';

update storage.buckets
set public = false,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4'
    ]
where id = 'hub-chat-files';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hub-contratados-documentos', 'hub-contratados-documentos', false, 10485760, null)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = null;

drop policy if exists "hub_contratados_docs_rh_select" on storage.objects;
create policy "hub_contratados_docs_rh_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hub-contratados-documentos'
  and app_private.hub_is_rh()
);
