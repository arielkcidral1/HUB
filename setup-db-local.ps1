#!/usr/bin/env pwsh

# Setup do PostgreSQL local com Docker para desenvolvimento

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message)
    Write-Host "➜ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Verificar Docker
Write-Status "Verificando Docker..."
try {
    docker --version | Out-Null
    Write-Success "Docker encontrado"
} catch {
    Write-Error "Docker não encontrado. Instale em https://www.docker.com/products/docker-desktop"
    exit 1
}

# Menu de opções
Write-Host "`n=== Setup PostgreSQL Local ===" -ForegroundColor Yellow
Write-Host "1. Iniciar container PostgreSQL"
Write-Host "2. Parar container"
Write-Host "3. Ver logs do container"
Write-Host "4. Deletar container e dados"
Write-Host "5. Testar conexão"
Write-Host "6. Rodar migrations"
Write-Host "0. Sair"
$choice = Read-Host "`nEscolha uma opção"

switch ($choice) {
    "1" {
        Write-Status "Iniciando PostgreSQL..."

        # Parar se já existe
        try {
            docker stop hub-postgres 2>$null
        } catch {}

        # Remover se existe
        try {
            docker rm hub-postgres 2>$null
        } catch {}

        # Criar novo container
        docker run --name hub-postgres `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=hub_dev `
            -p 5432:5432 `
            -d postgres:15

        Write-Success "PostgreSQL iniciado!"
        Write-Status "Aguardando PostgreSQL ficar pronto..."
        Start-Sleep -Seconds 3

        # Tentar conectar
        $maxRetries = 10
        $retry = 0
        while ($retry -lt $maxRetries) {
            try {
                docker exec hub-postgres pg_isready -U postgres | Out-Null
                Write-Success "PostgreSQL está pronto!"
                break
            } catch {
                $retry++
                if ($retry -lt $maxRetries) {
                    Write-Status "Aguardando... ($retry/$maxRetries)"
                    Start-Sleep -Seconds 2
                }
            }
        }

        # Criar database se não existir
        Write-Status "Verificando database..."
        docker exec hub-postgres psql -U postgres -c "SELECT 1" > $null 2>&1
        Write-Success "Database está acessível!"

        Write-Host "`n📝 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Execute: node .\postgres\run-migration.js (para criar tabelas)"
        Write-Host "2. Start: npm start ou node server.js"
    }

    "2" {
        Write-Status "Parando PostgreSQL..."
        docker stop hub-postgres 2>$null
        Write-Success "PostgreSQL parado"
    }

    "3" {
        Write-Status "Exibindo logs..."
        docker logs -f hub-postgres
    }

    "4" {
        $confirm = Read-Host "Tem certeza? Isso vai deletar todos os dados (s/n)"
        if ($confirm -eq "s") {
            Write-Status "Deletando container..."
            docker stop hub-postgres 2>$null
            docker rm hub-postgres 2>$null
            Write-Success "Container deletado"
        }
    }

    "5" {
        Write-Status "Testando conexão..."
        try {
            docker exec hub-postgres psql -U postgres hub_dev -c "SELECT 1 as success" 2>$null | Select-String "success" | Out-Null
            Write-Success "Conexão bem-sucedida!"
        } catch {
            Write-Error "Falha na conexão"
            Write-Host "Certifique-se que o container está rodando (opção 1)"
        }
    }

    "6" {
        Write-Status "Executando migrations..."
        if (Test-Path ".\postgres\run-migration.js") {
            node .\postgres\run-migration.js
            Write-Success "Migrations completadas!"
        } else {
            Write-Error "Arquivo de migrations não encontrado"
        }
    }

    "0" {
        Write-Host "Saindo..." -ForegroundColor Yellow
    }

    default {
        Write-Error "Opção inválida"
    }
}
