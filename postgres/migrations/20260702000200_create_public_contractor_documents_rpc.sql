create or replace function public.hub_submit_contractor_documents(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa text := trim(coalesce(payload ->> 'empresa', ''));
  v_origem_html text := trim(coalesce(payload ->> 'origemHtml', payload ->> 'origem_html', ''));
  v_nome text := trim(coalesce(payload ->> 'nome', ''));
  v_telefone text := trim(coalesce(payload ->> 'telefone', ''));
  v_cpf text := trim(coalesce(payload ->> 'cpf', ''));
  v_documentos jsonb := coalesce(payload -> 'documentos', '[]'::jsonb);
  v_id uuid;
begin
  if jsonb_typeof(v_documentos) <> 'array' or jsonb_array_length(v_documentos) = 0 or jsonb_array_length(v_documentos) > 20 then
    raise exception 'Documentos invalidos.';
  end if;

  if exists (select 1 from public.hub_documentos_contratados where cpf = v_cpf) then
    raise exception 'CPF ja possui envio de documentos registrado.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_documentos) as doc
    where coalesce((doc ->> 'size')::bigint, 0) <= 0
       or coalesce((doc ->> 'size')::bigint, 0) > 10485760
  ) then
    raise exception 'Cada documento deve ter no maximo 10 MB.';
  end if;

  insert into public.hub_documentos_contratados
    (empresa, origem_html, nome, telefone, cpf, documentos, created_by)
  values
    (v_empresa, v_origem_html, v_nome, v_telefone, v_cpf, v_documentos, 'Publico')
  returning id into v_id;

  return jsonb_build_object('id', v_id);
end;
$$;

grant execute on function public.hub_submit_contractor_documents(jsonb) to anon, authenticated;
