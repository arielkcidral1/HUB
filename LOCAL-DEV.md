# Desenvolvimento Local

Este projeto suporta desenvolvimento tanto com banco de dados **cloud (Azure)** quanto **local (PostgreSQL)**.

## Início Rápido com Docker

### 1. Instalar Docker
Baixe em https://www.docker.com/products/docker-desktop

### 2. Iniciar PostgreSQL Local
```bash
# Windows (PowerShell)
.\setup-db-local.ps1
# Escolha opção 1

# macOS/Linux (Bash)
docker run --name hub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hub_dev \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Criar Tabelas
```bash
node ./postgres/run-migration.js
```

### 4. Rodar Aplicação
```bash
npm start
# ou
node server.js
```

## Como Funciona

- **`.env.local`** já está configurado para localhost
- A aplicação detecta automaticamente se DATABASE_URL está configurada
- Se não estiver (desenvolvimento), usa `postgresql://postgres:postgres@localhost:5432/hub_dev`
- Sem necessidade de alterar código

## Modo Cloud

Para usar o banco de dados da Azure em produção/testing:

### 1. Criar arquivo `.env`
```bash
cp .env.example .env
# Editar com credenciais reais do Azure
```

### 2. Rodar com banco cloud
```bash
NODE_ENV=production npm start
```

## Troubleshooting

### PostgreSQL não conecta
```bash
# Verificar se está rodando
docker ps | grep hub-postgres

# Ver logs
docker logs hub-postgres

# Testar conexão
psql postgresql://postgres:postgres@localhost:5432/hub_dev -c "SELECT 1;"
```

### Migrations falharam
- Verifique se PostgreSQL está rodando
- Verifique credenciais em `.env.local`
- Tente parar e reiniciar o container

### Porta 5432 já em uso
```bash
# Listar containers
docker ps -a

# Parar conflitantes
docker stop <container_id>
```

## Arquivos de Configuração

| Arquivo | Propósito | Controle |
|---------|-----------|----------|
| `.env.local` | Banco local em dev | ✓ Commited, não editar |
| `.env` | Banco cloud | ✗ .gitignore, crie localmente |
| `.env.example` | Template | ✓ Referência |

## Variáveis de Ambiente

```bash
# Automático em desenvolvimento
NODE_ENV=development

# Customizar banco
DATABASE_URL=postgresql://user:pass@host:port/db

# Segredo de sessão (gere um novo em produção)
AUTH_SESSION_SECRET=...
```

## Scripts Úteis

| Script | Função |
|--------|--------|
| `setup-db-local.ps1` | Menu interativo PostgreSQL (Windows) |
| `postgres/run-migration.js` | Cria tabelas do zero |

Mais detalhes em **`setup-local-db.md`**
