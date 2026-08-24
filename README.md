# HUB

Sistema interno de gestao de RH e operacoes (login, chat, chamados, denuncias,
vagas, candidaturas, atestados, malotes, documentos de contratados, etc.),
servido como site estatico + API serverless.

## Stack

- Frontend: HTML/CSS/JS estatico (`index.html`, `script.js`, `style.css`),
  sem framework/bundler.
- Backend: funcoes serverless em `api/` (Vercel), Node.js com `pg` (PostgreSQL
  direto, sem ORM) e `bcryptjs` para hash de senha.
- Banco: Azure PostgreSQL. Scripts de migracao em `postgres/migrations`.
- Deploy: Vercel (`vercel.json` define headers de seguranca).

## Estrutura

```
api/            Endpoints serverless (auth, records, bootstrap, files, ...)
assets/         Imagens, logos e modelos de documento
docs/           Modelos e formularios internos (RH)
imports/        Anotacoes/resumos de importacoes de dados
postgres/       Migrations SQL e Edge Functions legadas
scripts/        Scripts utilitarios (ex.: checagem de hashes de senha)
tests/          Testes de unidade em PowerShell
*.html, *.js    Paginas e scripts do frontend estatico
```

## Configuracao local

1. Copie `.env.example` para `.env` e preencha:
   - `DATABASE_URL`: string de conexao do PostgreSQL.
   - `AUTH_SESSION_SECRET`: segredo usado para assinar o cookie de sessao
     (gere com `openssl rand -hex 32`). Sem essa variavel o backend usa um
     fallback derivado de `DATABASE_URL` — funciona, mas defina um segredo
     dedicado em producao.
2. Instale as dependencias:
   ```
   npm install
   ```
3. Rode o projeto com a CLI da Vercel (`vercel dev`) ou sirva os arquivos
   estaticos com qualquer servidor HTTP, apontando as chamadas `/api/*` para
   as funcoes em `api/`.

## Scripts uteis

- `scripts/check-password-hashes.mjs`: conta quantos usuarios ainda tem senha
  em formato legado (SHA-256/texto puro) em vez de bcrypt. Nao imprime hashes,
  apenas totais.
  ```
  node scripts/check-password-hashes.mjs
  ```
- `tests/run-unit-tests.ps1`: testes de unidade (PowerShell) que validam
  trechos do HTML/JS do frontend.
  ```
  pwsh tests/run-unit-tests.ps1
  ```

## Seguranca

Alteracoes de seguranca, autenticacao e autorizacao sao registradas em
[`SECURITY_CHANGES.md`](SECURITY_CHANGES.md). Consulte esse arquivo antes de
mexer em `api/auth.js`, `api/records.js`, `api/bootstrap.js` ou `api/files.js`.
