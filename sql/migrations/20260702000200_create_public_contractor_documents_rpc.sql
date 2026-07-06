alter table public.hub_documentos_contratados
add column if not exists origem_html text not null default '';

alter table public.hub_documentos_contratados
drop constraint if exists hub_documentos_contratados_origem_html_check;

alter table public.hub_documentos_contratados
add constraint hub_documentos_contratados_origem_html_check
check (origem_html = '' or origem_html ~ '^documentos-(fredy|besten|achei|trinca)\.html$');

create or replace function public.hub_submit_contractor_documents(payload jsonb)
returns public.hub_documentos_contratados
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa text := trim(coalesce(payload ->> 'empresa', ''));
  v_origem_html text := trim(coalesce(payload ->> 'origemHtml', payload ->> 'origem_html', ''));
  v_access_password text := coalesce(payload ->> 'accessPassword', payload ->> 'access_password', '');
  v_nome text := trim(coalesce(payload ->> 'nome', ''));
  v_telefone text := regexp_replace(coalesce(payload ->> 'telefone', ''), '\D', '', 'g');
  v_cpf text := coalesce(payload ->> 'cpf', '');
  v_documentos jsonb := coalesce(payload -> 'documentos', '[]'::jsonb);
  v_expected_password text;
  v_row public.hub_documentos_contratados;
begin
  v_expected_password := case v_empresa
    when 'Fredy Pneus' then 'fredy5212'
    when 'Besten Pneus' then 'besten5212'
    when 'Achei Pneus' then 'Achei5212'
    when 'Trinca Mkt' then 'trinca5212'
    else null
  end;

  if v_expected_password is null then
    raise exception 'Empresa invalida.';
  end if;

  if v_access_password <> v_expected_password then
    raise exception 'Senha de acesso invalida.';
  end if;

  if v_origem_html !~ '^documentos-(fredy|besten|achei|trinca)\.html$' then
    raise exception 'Origem invalida.';
  end if;

  if length(v_nome) < 3 or length(v_nome) > 160 then
    raise exception 'Nome invalido.';
  end if;

  if v_cpf !~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$' then
    raise exception 'CPF invalido.';
  end if;

  if v_telefone !~ '^\d{10,11}$' then
    raise exception 'Telefone invalido.';
  end if;

  if jsonb_typeof(v_documentos) <> 'array'
    or jsonb_array_length(v_documentos) = 0
    or jsonb_array_length(v_documentos) > 20 then
    raise exception 'Documentos invalidos.';
  end if;

  if exists (
    select 1
    from public.hub_documentos_contratados
    where cpf = v_cpf
  ) then
    raise exception 'CPF ja possui envio de documentos registrado.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_documentos) as doc(value)
    where
      length(trim(coalesce(doc.value ->> 'name', ''))) = 0
      or length(trim(coalesce(doc.value ->> 'name', ''))) > 180
      or coalesce((doc.value ->> 'size')::bigint, 0) <= 0
      or coalesce((doc.value ->> 'size')::bigint, 0) > 10485760
      or length(coalesce(doc.value ->> 'dataUrl', '')) = 0
  ) then
    raise exception 'Documentos invalidos.';
  end if;

  insert into public.hub_documentos_contratados (
    empresa,
    origem_html,
    nome,
    telefone,
    cpf,
    documentos,
    created_by
  )
  values (
    v_empresa,
    v_origem_html,
    v_nome,
    v_telefone,
    v_cpf,
    v_documentos,
    'Publico'
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.hub_submit_contractor_documents(jsonb) from public;
grant execute on function public.hub_submit_contractor_documents(jsonb) to anon, authenticated;
