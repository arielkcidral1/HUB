-- Cadastra o login de Andre Barbosa (Analista de Sistemas), unidade GCS JLLE.
-- Senha gravada em sha256 (formato legado aceito por api/auth.js); e migrada
-- automaticamente para bcrypt no primeiro login bem-sucedido.
-- Idempotente: nao duplica se ja existir usuario com o mesmo email ou cpf.

insert into public.hub_users (nome, email, cpf, cargo, unidade, password_hash, created_by)
select 'André Barbosa', 'andre.barbosa@fredypneus.com.br', '10475110960', 'Analista de Sistemas', '12- GCS JLLE',
       'b0c469314a95678715b613de99ccb5a3c7930f5804002664b3a48252680238ea', 'Migration'
where not exists (
  select 1 from public.hub_users
  where lower(coalesce(email, '')) = lower('andre.barbosa@fredypneus.com.br')
     or regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = '10475110960'
);
