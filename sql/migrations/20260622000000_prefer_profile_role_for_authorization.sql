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
