-- Funcoes puras (sem dependencia de auth.*/storage.objects) portadas de
-- sql/01_schema_rls.sql e das migrations correspondentes. Toda a logica de
-- autorizacao baseada em auth.uid()/auth.role()/auth.jwt() (hub_is_rh,
-- hub_is_manager, hub_can_access_chat_channel, hub_public_*_allowed etc) NAO
-- e' portada aqui -- ela e' reimplementada em JS na camada de API
-- (ver api/records/[table].js e docs/AUTORIZACAO.md).

create or replace function app_private.hub_reserve_public_rate_limit(
  p_form_type text,
  p_ip_hash text,
  p_window_seconds integer,
  p_max integer,
  p_request_id uuid
)
returns boolean
language plpgsql
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

create or replace function app_private.hub_release_public_rate_limit(p_request_id uuid)
returns void
language sql
set search_path = app_private
as $$
  delete from app_private.hub_public_submission_log
  where request_id = p_request_id;
$$;

create or replace function public.hub_get_action_password_hash(p_action text)
returns text
language sql
stable
set search_path = app_private, pg_temp
as $$
  select password_hash from app_private.hub_action_passwords where action = p_action;
$$;
