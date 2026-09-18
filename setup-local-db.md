# Setup do Banco de Dados Local

## Opção 1: PostgreSQL com Docker (Recomendado)

### Pré-requisitos
- Docker instalado

### Executar PostgreSQL localmente

```bash
# Criar e iniciar container PostgreSQL
docker run --name hub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hub_dev \
  -p 5432:5432 \
  -d postgres:15

# Parar o container
docker stop hub-postgres

# Reiniciar o container
docker start hub-postgres

# Remover o container (apaga dados)
docker rm hub-postgres
```

## Opção 2: PostgreSQL Instalado Localmente

### Windows
1. Baixe PostgreSQL em https://www.postgresql.org/download/windows/
2. Instale com:
   - Usuário padrão: `postgres`
   - Senha: `postgres`
   - Porta: `5432`
   - Database: `hub_dev`

3. Crie a database:
```bash
psql -U postgres -c "CREATE DATABASE hub_dev;"
```

### macOS
```bash
# Com Homebrew
brew install postgresql
brew services start postgresql

# Criar database
psql postgres -c "CREATE DATABASE hub_dev;"
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Criar database
sudo -u postgres createdb hub_dev
```

## Configuração da Aplicação

1. Arquivo `.env.local` já está configurado com:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hub_dev
NODE_ENV=development
```

2. As variáveis de ambiente são carregadas automaticamente em desenvolvimento

3. A aplicação usa este banco quando DATABASE_URL da cloud não está configurada

## Rodar Migrations

Após ter PostgreSQL rodando:

```bash
# Node.js
node postgres/run-migration.js

# Ou PowerShell
node .\postgres\run-migration.js
```

## Testar Conexão

```bash
# Bash/PowerShell
psql postgresql://postgres:postgres@localhost:5432/hub_dev -c "SELECT 1;"

# Deve retornar: ?column?
#       1
```

## Troubleshooting

### "ECONNREFUSED: Connection refused"
- PostgreSQL não está rodando
- Verifique a porta (padrão: 5432)
- Verifique credenciais em `.env.local`

### "database "hub_dev" does not exist"
- Execute: `psql -U postgres -c "CREATE DATABASE hub_dev;"`

### Permissões negadas
- Verifique usuário/senha em DATABASE_URL
- Para Docker: senha é `postgres`
- Para instalação local: verifique durante setup

## Dados de Teste

Após criar o banco, execute:
```bash
node postgres/run-migration.js
```

Isso cria todas as tabelas necessárias.
