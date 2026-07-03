create table if not exists app_private.hub_action_passwords (
  action text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

revoke all on app_private.hub_action_passwords from public, anon, authenticated;
grant select on app_private.hub_action_passwords to service_role;

create or replace function public.hub_get_action_password_hash(p_action text)
returns text
language sql
stable
security definer
set search_path = app_private, pg_temp
as $$
  select password_hash from app_private.hub_action_passwords where action = p_action;
$$;

revoke all on function public.hub_get_action_password_hash(text) from public, anon, authenticated;
grant execute on function public.hub_get_action_password_hash(text) to service_role;
