-- Cadastra o login de Maria Luisa Mafra (Gerente), unidade Matriz.
-- Senha ja gravada como hash bcrypt (mesmo formato que api/auth.js aceita).
-- Idempotente: nao duplica se ja existir usuario com o mesmo email ou cpf.

insert into public.hub_users (nome, email, cpf, cargo, unidade, password_hash, created_by)
select 'Maria Luisa Mafra', 'maria.luisa@fredypneus.com.br', '08920066922', 'Gerente', 'Matriz',
       '$2a$10$wRQJl8v4uNaeh.yPfHpZRuPpKyLs4QMysTl0u8TVkbYSvas1d/3zO', 'Migration'
where not exists (
  select 1 from public.hub_users
  where lower(coalesce(email, '')) = lower('maria.luisa@fredypneus.com.br')
     or regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = '08920066922'
);
