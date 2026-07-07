drop table if exists public.hub_feedback;

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
