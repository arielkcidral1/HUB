# Registro de seguranca do HUB

Este arquivo deve ser atualizado a cada alteracao de seguranca, permissao, RLS, Auth, Storage ou fluxo publico.

## Estado atual

- Login migrado para PostgreSQL Auth.
- RLS ativo nas tabelas `hub_*`.
- Regras por cargo aplicadas no banco:
  - `RH`: acesso interno amplo conforme policies.
  - `Gerente`: chat `geral-gerentes` e DMs proprias.
  - `Caixa`/`Crediarista`: chat `geral-caixa` e DMs proprias.
- Fluxos publicos limitados:
  - `denuncias`: envio via Edge Function `hub-public-submit`.
  - `chamados`: envio via Edge Function `hub-public-submit`.
  - `candidaturas`: envio via Edge Function `hub-public-submit`.
  - `vagas`: leitura publica via Edge Function `hub-public-submit`.
- Bucket `hub-curriculos` privado, com upload publico feito somente via Edge Function.
- Bucket `hub-chat-files` privado, limitado a 10 MB, MIME restrito e acesso por cargo/canal para leitura e upload; update/delete seguem RH-only.
- `.env`, `*.env` e arquivos locais sensiveis estao no `.gitignore`.
- O app nao depende mais de `postgres-config.js`; a configuracao publica padrao fica centralizada em `script.js`.
- Historico antigo do Git foi reescrito para reduzir risco de senhas antigas em commits.
- Coluna legada `hub_users.senha` removida do banco.
- PostgreSQL JS usa SRI nos HTMLs.
- CSP nao usa mais `unsafe-inline`.
- Sem Turnstile configurado, denuncias publicas usam rate limit no servidor; chamados e candidaturas seguem bloqueados.
- Usuarios autenticados nao possuem mais `UPDATE` direto em `hub_users`.
- Dados internos do HUB usam `sessionStorage` e sao apagados no logout; caches legados em `localStorage` tambem sao removidos.

## Pendencias conhecidas

- Preencher `email` em todos os perfis de `hub_users`; atualmente o RLS por cargo depende desse vinculo ou de `app_metadata.cargo`.
- Configurar `TURNSTILE_SECRET_KEY` na Edge Function e `turnstileSiteKey` no front para exigir CAPTCHA tambem nas denuncias publicas.
- Ativar no PostgreSQL Auth a protecao contra senhas vazadas e forcar redefinicao de senha dos usuarios antigos.

## Historico

### 2026-06-21 - Calendario

- O calculo do dia atual do calendario passou a usar a data local, evitando mudancas causadas pela conversao para UTC ao registrar eventos.

### 2026-06-21 - Contingencia para denuncias publicas

- Denuncias voltaram a aceitar envio sem Turnstile configurado, protegidas pelo rate limit do servidor e pelas validacoes de payload existentes.
- Denuncias, chamados e candidaturas usam rate limit no servidor enquanto o Turnstile nao estiver configurado. Candidaturas tambem mantem validacao de arquivo, validacao de dados e bloqueio de duplicidade por CPF/vaga.
- O papel `service_role` recebeu acesso apenas ao schema e funcoes privadas usadas pelos `CHECK` de envios publicos da Edge Function.
- Removido o bloqueio local por tempo de preenchimento; o honeypot e o rate limit no servidor permanecem ativos.
- Formularios publicos usam sempre a Edge Function, inclusive quando abertos durante uma sessao autenticada; isso impede `INSERT` direto bloqueado pelo RLS.
- Rate limit de denuncias passou para 5 envios por 10 minutos; reservas sao removidas se o envio falhar antes de gravar no banco.
- Formularios publicos agora enviam apenas colunas permitidas; a Edge Function tambem normaliza o payload antes do `INSERT`, evitando erros de schema cache como `created_by` em denuncias.
- Funcoes de rate limit mantem `EXECUTE` exclusivamente para `service_role`; `anon` e `authenticated` nao podem chama-las pela API REST.

### 2026-06-21 - Arquivamento interno e vagas demonstrativas

- Funcoes de validacao de denuncias e chamados permitem atualizacao de status somente para RH autenticado; envios publicos continuam obrigados aos estados iniciais.
- Removida a vaga demonstrativa do estado inicial para evitar que apareca antes da sincronizacao com o PostgreSQL.
- Denuncias aceitam mensagem nao vazia de ate 4000 caracteres em HTML, frontend, Edge Function e validacao do banco.

### 2026-06-21 - Correcao do upload de foto de perfil

- Corrigida a policy de `INSERT` em `hub-chat-files`: a validacao de MIME e tamanho fica no bucket, pois os metadados podem ainda nao estar disponiveis durante a checagem de RLS do Storage.
- Upload de avatar continua restrito a usuarios autenticados em `avatars/*`.
- Frontend passou a aceitar somente JPG, PNG ou WEBP de ate 5 MB antes de iniciar o upload.
- O tipo MIME agora e enviado explicitamente ao Storage.
- O estado de perfil em memoria e sincronizado apos a atualizacao, para exibir a nova foto imediatamente.
- Fotos privadas agora tambem sao exibidas em Equipe e Comunicacao RH por URLs assinadas efemeras em memoria.
- Canais individuais da Comunicacao RH exibem a foto privada do participante correspondente, sem itens fixos na lista.

### 2026-06-20 - Correcao de escalada de cargo e Storage

- Removida a policy `hub_users_self_update`, que permitia alterar todos os campos do proprio perfil.
- Criada a RPC `public.hub_update_own_profile`, limitada a `nome` e `foto_perfil` do usuario autenticado.
- Frontend atualizado para usar a RPC; `cargo`, `email` e campos administrativos nao sao enviados na atualizacao de conta.
- Removida do SQL de baseline a policy `hub_curriculos_anon_insert`.
- Confirmado no banco: curriculos continuam privados, com acesso somente RH e sem `INSERT` anonimo.
- Validacao de nova senha no frontend elevada para 12 caracteres.

### 2026-06-20 - Protecao de cache no navegador

- Dados internos, documentos locais, equipe e estado de leitura deixaram de usar `localStorage`.
- Esses dados agora vivem apenas durante a sessao do navegador.
- Logout, expiracao de sessao e acesso anonimo removem tambem qualquer cache legado persistente.

### 2026-06-20 - Perfil por Edge Function autenticada

- A RPC publica `hub_update_own_profile` foi removida.
- Atualizacao de perfil agora passa pela Edge Function `hub-account-update`, com JWT obrigatorio.
- A funcao valida a sessao no PostgreSQL Auth e permite somente `nome` e `foto_perfil` do proprio usuario.
- Teste sem token confirmou bloqueio com `401`.

### 2026-06-20 - Validacao de Edge Functions

- `hub-public-submit` valida identificador de vaga positivo e seguro.
- Curriculos PDF, DOC e DOCX passam a ter assinatura de arquivo verificada antes do upload.
- Falhas ao gravar candidatura removem o curriculo enviado para evitar arquivos orfaos.
- CORS das Edge Functions responde somente a origens permitidas.

### 2026-06-20 - Suporte Deno no editor

- Adicionado `postgres/functions/deno.json` para tipagem das Edge Functions.
- Adicionada configuracao VS Code para habilitar Deno somente em `postgres/functions`.

### 2026-06-20 - Login por CPF

- `hub_users` recebeu coluna `cpf` com indice unico normalizado.
- Criada a Edge Function `hub-password-login`, que valida CPF e senha sem expor o e-mail associado.
- Login por CPF possui rate limit e respostas genericas para evitar enumeracao de usuarios.
- Campos de CPF do login e do cadastro aplicam a mascara `000.000.000-00` durante a digitacao.

### 2026-06-19 - Correcao do checklist de vulnerabilidades

- Edge Function `hub-public-submit` implantada na versao 7 com Turnstile obrigatorio para todo POST publico.
- FormulÃ¡rios publicos passam a coletar token Turnstile quando `turnstileSiteKey` estiver configurada.
- POST publico sem CAPTCHA testado e bloqueado com `503` enquanto `TURNSTILE_SECRET_KEY` nao estiver configurada.
- GET publico de vagas segue funcionando pela Edge Function.
- `hub-curriculos` confirmado privado, sem policy anon e com upload publico somente via service role da Edge Function.
- `hub-chat-files` atualizado para leitura/upload por cargo/canal e update/delete RH-only.
- Upload de anexos de chat passou a gravar em `chat/<canal>/...` para permitir RLS por canal no Storage.
- Coluna legada `hub_users.senha` removida do banco e do baseline SQL.
- Role da UI deixou de usar `sessionStorage/localStorage` como fonte de permissao; agora vem do usuario Auth/perfil carregado.
- SRI adicionado ao CDN do PostgreSQL JS em todos os HTMLs.
- `unsafe-inline` removido de `script-src` e `style-src`.
- Wrapper publico `public.hub_check_public_rate_limit` ficou executavel apenas por `service_role`.
- Funcoes auxiliares em `app_private` receberam `search_path` fixo.

### 2026-06-20 - Tipagem da Edge Function publica

- `hub-public-submit` valida o tipo de envio antes de indexar rate limits e tabelas.
- Mapas de rate limit e tabela foram tipados para impedir valores `undefined` no TypeScript.
- Resposta do Turnstile recebeu tipo explicito.

### 2026-06-19 - Configuracao PostgreSQL sem arquivo externo

- Removida a necessidade de carregar `postgres-config.js` nos HTMLs.
- Configuracao publica padrao do PostgreSQL centralizada em `script.js`.
- `getHubPostgreSQLConfig()` ainda permite override via `window.HUB_POSTGRES`, caso algum ambiente injete configuracao propria.
- `postgres-config.example.js` foi removido por nao ser mais necessario.

### 2026-06-19 - Edge Function anti-spam e hardening de frontend

- Criada e implantada a Edge Function `hub-public-submit`.
- Removido `INSERT` anonimo direto em `hub_denuncias`, `hub_chamados` e `hub_candidaturas`.
- Removido `SELECT` anonimo direto em `hub_vagas`; vagas publicas agora passam pela Edge Function.
- Removido `INSERT` anonimo direto no bucket `hub-curriculos`; upload de curriculo agora passa pela Edge Function.
- Criada tabela privada `app_private.hub_public_submission_log` para rate limit por IP com hash.
- Criadas funcoes `app_private.hub_check_public_rate_limit` e wrapper `public.hub_check_public_rate_limit`.
- Front passou a enviar fluxos publicos pela Edge Function.
- Adicionada CSP nas paginas HTML.
- PostgreSQL JS fixado em `@postgres/postgres-js@2.108.2`.
- Leitura de `hub_users` limitada a RH ou ao proprio usuario.
- Edge Function testada com envio valido de denuncia e limpeza do registro de teste.

### 2026-06-19 - Hardening final de RLS/Storage

- Removidas policies extras inseguras de `hub_vagas`.
- `hub_vagas` ficou limitada a:
  - RH autenticado com acesso total.
  - anonimo com `SELECT` somente de vagas abertas.
- `hub-chat-files` passou a ser privado, limitado e RH-only.
- Honeypot dos formularios publicos foi escondido por CSS.
- `script.js` passou a bloquear formulario publico preenchido rapido demais ou com honeypot preenchido.
- Denuncia publica passou a exigir mensagem entre 20 e 4000 caracteres.
- Arquivos atualizados:
  - `script.js`
  - `style.css`
  - `postgres-rls-hub.sql`
  - `postgres-rls-verify.sql`
- Commit: `eef44e5 fix remaining security hardening gaps`

### 2026-06-18 - Upload publico de curriculo

- `hub-curriculos` ficou privado.
- Upload anonimo restrito a `candidaturas/<uuid>/<arquivo>.pdf|doc|docx`.
- Limite de arquivo: 5 MB.
- MIME types permitidos: PDF, DOC e DOCX.
- Leitura/alteracao de curriculos restrita a RH.
- Front valida extensao, MIME, tamanho e arquivo vazio antes do upload.
- Commit: `a2f46d1 harden public resume uploads`

### 2026-06-18 - Limpeza de historico Git

- Branches `main` e `master` foram reescritas para reduzir exposicao de senhas antigas em commits.
- Commit base limpo: `c37a584 clean repository history`

### 2026-06-18 - RLS por cargo

- Criadas funcoes privadas em `app_private` para resolver cargo e permissao.
- Policies amplas `authenticated_all` removidas das tabelas internas.
- Acesso interno passou a depender de cargo.
- Criados scripts locais:
  - `postgres-rls-hub.sql`
  - `postgres-rls-verify.sql`

