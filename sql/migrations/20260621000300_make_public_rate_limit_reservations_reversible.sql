alter table app_private.hub_public_submission_log
add column if not exists request_id uuid;

create unique index if not exists hub_public_submission_log_request_id_key
on app_private.hub_public_submission_log (request_id)
where request_id is not null;

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
