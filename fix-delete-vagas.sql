alter table public.hub_vagas enable row level security;
alter table public.hub_candidaturas enable row level security;

alter table public.hub_vagas add column if not exists descricao text not null default '';
alter table public.hub_vagas add column if not exists requisitos text not null default '';
alter table public.hub_candidaturas add column if not exists telefone text not null default '';

alter table public.hub_candidaturas
  drop constraint if exists hub_candidaturas_vaga_id_fkey;

alter table public.hub_candidaturas
  add constraint hub_candidaturas_vaga_id_fkey
  foreign key (vaga_id) references public.hub_vagas(id) on delete cascade;

drop policy if exists "hub_vagas_public_read" on public.hub_vagas;
drop policy if exists "hub_vagas_public_insert" on public.hub_vagas;
drop policy if exists "hub_vagas_public_update" on public.hub_vagas;
drop policy if exists "hub_vagas_public_delete" on public.hub_vagas;

create policy "hub_vagas_public_read"
on public.hub_vagas
for select
to anon, authenticated
using (true);

create policy "hub_vagas_public_insert"
on public.hub_vagas
for insert
to anon, authenticated
with check (true);

create policy "hub_vagas_public_update"
on public.hub_vagas
for update
to anon, authenticated
using (true)
with check (true);

create policy "hub_vagas_public_delete"
on public.hub_vagas
for delete
to anon, authenticated
using (true);

drop policy if exists "hub_candidaturas_public_read" on public.hub_candidaturas;
drop policy if exists "hub_candidaturas_public_insert" on public.hub_candidaturas;
drop policy if exists "hub_candidaturas_public_delete" on public.hub_candidaturas;

create policy "hub_candidaturas_public_read"
on public.hub_candidaturas
for select
to anon, authenticated
using (true);

create policy "hub_candidaturas_public_insert"
on public.hub_candidaturas
for insert
to anon, authenticated
with check (true);

create policy "hub_candidaturas_public_delete"
on public.hub_candidaturas
for delete
to anon, authenticated
using (true);

grant select, insert, update, delete on public.hub_vagas to anon, authenticated;
grant select, insert, delete on public.hub_candidaturas to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
