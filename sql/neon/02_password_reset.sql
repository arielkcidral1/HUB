alter table public.hub_users
  add column if not exists password_reset_token text,
  add column if not exists password_reset_expires_at timestamptz;

create unique index if not exists hub_users_password_reset_token_key
on public.hub_users (password_reset_token)
where password_reset_token is not null;
