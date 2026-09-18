# Setup Completo do HUB

## 1️⃣ Instalar Node.js (Pré-requisito)

### Windows
1. Baixe em https://nodejs.org/en/download
2. Instale a versão **LTS** (recomendado)
3. Aceite todas as opções padrão
4. Reinicie o terminal/PowerShell

**Verificar instalação:**
```powershell
node --version  # deve mostrar v18.x ou superior
npm --version   # deve mostrar 9.x ou superior
```

### macOS
```bash
# Com Homebrew
brew install node

# Verificar
node --version
npm --version
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install nodejs npm

# Verificar
node --version
npm --version
```

## 2️⃣ PostgreSQL Local (Docker)

### Opção Recomendada: Docker

```powershell
# Windows PowerShell
.\setup-db-local.ps1
# Escolha opção 1
```

```bash
# macOS/Linux
docker run --name hub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hub_dev \
  -p 5432:5432 \
  -d postgres:15
```

Verificar:
```bash
psql postgresql://postgres:postgres@localhost:5432/hub_dev -c "SELECT 1;"
```

## 3️⃣ Instalar Dependências do Projeto

```bash
npm install
```

Isso instala:
- `pg` - Driver PostgreSQL
- `bcryptjs` - Hash de senhas
- Todas as dependências listadas em `package.json`

## 4️⃣ Criar Tabelas no Banco

```bash
node ./postgres/run-migration.js
```

Isso executa todas as migrations e cria as tabelas necessárias.

## 5️⃣ Rodar a Aplicação

### Opção A: Com Vercel CLI (Recomendado para Desenvolvimento)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Rodar em desenvolvimento
vercel dev
```

Isso inicia:
- Servidor em `http://localhost:3000`
- APIs serverless rodando localmente
- Conectado ao PostgreSQL local

### Opção B: Rodar com Http Server Simples

```bash
# Instalar http-server
npm install -g http-server

# Rodar
http-server .
```

Acessa em `http://localhost:8080`

**Nota:** APIs não funcionarão sem Vercel CLI. Use a Opção A para desenvolvimento completo.

## ✅ Checklist de Setup

- [ ] Node.js instalado (`node --version`)
- [ ] npm funciona (`npm --version`)
- [ ] PostgreSQL rodando (`docker ps | grep hub-postgres`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco criado (`node ./postgres/run-migration.js`)
- [ ] Ambiente configurado (`.env.local` criado)
- [ ] Vercel CLI instalado (`vercel --version`)
- [ ] Aplicação rodando (`vercel dev`)

## 🔧 Troubleshooting

### "node: command not found"
- Node.js não está instalado
- Reinstale de https://nodejs.org
- Reinicie o terminal após instalar

### "ECONNREFUSED PostgreSQL"
- PostgreSQL não está rodando
- Execute: `docker start hub-postgres`
- Ou use Option A do Docker acima

### "PORT 3000 already in use"
```bash
# Matar processo na porta 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Migrations falharam
- Verifique credenciais em `.env.local`
- Verifique se PostgreSQL está rodando
- Execute manualmente: `node ./postgres/run-migration.js`

## 📂 Estrutura do Projeto

```
├── api/                    # APIs serverless
│   ├── auth.js            # Autenticação
│   ├── bootstrap.js       # Dados iniciais
│   ├── records.js         # CRUD de dados
│   └── ...
├── postgres/              # Migrations e seeds
│   ├── migrations/        # SQL das tabelas
│   └── run-migration.js   # Executa migrations
├── index.html             # Página principal
├── script.js              # Lógica do frontend
├── vercel.json            # Configuração Vercel
└── .env.local             # Variáveis de ambiente (local)
```

## 🚀 Próximos Passos

Após setup completo:

1. Abra http://localhost:3000
2. Faça login com um usuário do banco
3. Explore as funcionalidades
4. Veja logs em `vercel dev` output

## 📖 Documentação

- **LOCAL-DEV.md** - Guia rápido
- **setup-local-db.md** - Banco de dados em detalhes
- **SECURITY_CHANGES.md** - Correções de segurança recentes
