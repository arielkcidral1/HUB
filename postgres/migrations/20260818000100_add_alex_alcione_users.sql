insert into public.hub_users (nome, email, cpf, cargo, unidade, password_hash, created_by)
select 'Alexsandro Cardoso dos Santos', 'alex@fredypneus.com.br', '01521750912', 'Diretor', 'Matriz',
       '$2a$10$2eru4Fv1VVn9O0yXjEUYyOZ6/3RCw1OnV4oX7xy.BV1skGKFguJJ2', 'Migration'
where not exists (
  select 1 from public.hub_users
  where lower(coalesce(email, '')) = lower('alex@fredypneus.com.br')
     or regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = '01521750912'
);

insert into public.hub_users (nome, email, cpf, cargo, unidade, password_hash, created_by)
select 'Jose Alcione Bayer', 'alcione@fredypneus.com.br', '79843239920', 'Gerente Administrativo', 'Matriz',
       '$2a$10$NmAjUUyGw7H0HAAhmJdw5.BpnPZN8jmguMkW/kgycF/29BUK87VVq', 'Migration'
where not exists (
  select 1 from public.hub_users
  where lower(coalesce(email, '')) = lower('alcione@fredypneus.com.br')
     or regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = '79843239920'
);
