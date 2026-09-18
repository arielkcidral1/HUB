create table if not exists public.hub_clima_pesquisas (
  id uuid primary key default gen_random_uuid(),
  respostas jsonb not null default '{}'::jsonb,
  sugestao text not null default '',
  created_by text not null default 'Publico',
  created_at timestamptz not null default now()
);

create index if not exists hub_clima_pesquisas_created_at_idx
on public.hub_clima_pesquisas (created_at desc);
