create extension if not exists pgcrypto;

create table if not exists public.hub_quadros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  listas jsonb not null default '[]'::jsonb,
  owner_name text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now()
);

alter table public.hub_quadros
  add column if not exists owner_name text;

create index if not exists idx_hub_quadros_created_at
on public.hub_quadros (created_at desc);

create index if not exists idx_hub_quadros_owner_name
on public.hub_quadros (lower(owner_name));
