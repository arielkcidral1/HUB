delete from public.hub_candidaturas a
using public.hub_candidaturas b
where a.vaga_id = b.vaga_id
  and a.cpf = b.cpf
  and a.created_at < b.created_at;

create unique index if not exists hub_candidaturas_vaga_cpf_unique
on public.hub_candidaturas (vaga_id, cpf);
