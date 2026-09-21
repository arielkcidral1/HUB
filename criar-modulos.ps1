# Script para criar módulos do sistema HUB
# Execução: .\criar-modulos.ps1

$modulosDir = "C:\Users\ariel\Documents\Codigos\HUB\Modulos"

$modulos = @(
    @{
        id = "denuncias"
        nome = "Denúncias Recebidas"
        descricao = "Gerenciamento de denúncias anônimas recebidas"
        tabela = "hub_denuncias"
        dataKey = "denuncias"
    },
    @{
        id = "feedbacks"
        nome = "Feedbacks Diretoria"
        descricao = "Mensagens de feedback para a diretoria"
        tabela = "hub_feedbacks"
        dataKey = "feedbacks"
    },
    @{
        id = "comunicacao"
        nome = "Comunicação"
        descricao = "Chat e comunicação entre equipes"
        tabela = "hub_chat_mensagens"
        dataKey = "chatMensagens"
    },
    @{
        id = "malotes"
        nome = "Malotes de EPI"
        descricao = "Gerenciamento de malotes de EPIs"
        tabela = "hub_malotes"
        dataKey = "malotes"
    },
    @{
        id = "chamados"
        nome = "Chamados"
        descricao = "Gerenciamento de chamados de EPI"
        tabela = "hub_chamados"
        dataKey = "chamados"
    },
    @{
        id = "quadros"
        nome = "Quadros"
        descricao = "Sistema de kanban para tarefas"
        tabela = "hub_quadros"
        dataKey = "quadros"
    },
    @{
        id = "vagas"
        nome = "Vagas e Projetos"
        descricao = "Gerenciamento de vagas e candidatos"
        tabela = "hub_vagas"
        dataKey = "vagas"
    },
    @{
        id = "calendario"
        nome = "Calendário"
        descricao = "Agenda de eventos e atividades"
        tabela = "hub_eventos"
        dataKey = "eventos"
    },
    @{
        id = "documentos"
        nome = "Documentos de Uso Geral"
        descricao = "Formulários e documentos padrão"
        tabela = "hub_documentos"
        dataKey = "documentos"
    },
    @{
        id = "documentos-contratados"
        nome = "Documentos de Contratados"
        descricao = "Documentos de empresas contratadas"
        tabela = "hub_documentos_contratados"
        dataKey = "documentosContratados"
    },
    @{
        id = "teste-clima"
        nome = "Teste de Clima"
        descricao = "Pesquisa de clima organizacional"
        tabela = "hub_clima_pesquisas"
        dataKey = "climaPesquisas"
    },
    @{
        id = "gerenciamento-vt"
        nome = "Gerenciamento VT"
        descricao = "Cálculo e gerenciamento de vale transporte"
        tabela = "hub_vt_registros"
        dataKey = "vtRegistros"
    },
    @{
        id = "equipe"
        nome = "Equipe"
        descricao = "Gerenciamento de usuários"
        tabela = "hub_users"
        dataKey = "usuarios"
    },
    @{
        id = "conta"
        nome = "Configurações"
        descricao = "Configurações de conta do usuário"
        tabela = "N/A"
        dataKey = "N/A"
    }
)

Write-Host "🚀 Iniciando criação de $($modulos.Count) módulos..." -ForegroundColor Green
Write-Host ""

foreach ($modulo in $modulos) {
    $moduloPath = Join-Path $modulosDir $modulo.id

    # Criar pasta
    if (-not (Test-Path $moduloPath)) {
        New-Item -ItemType Directory -Path $moduloPath -Force | Out-Null
        Write-Host "✓ Pasta criada: Modulos\$($modulo.id)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Pasta já existe: Modulos\$($modulo.id)" -ForegroundColor Yellow
    }

    # Criar config.json
    $configPath = Join-Path $moduloPath "config.json"
    if (-not (Test-Path $configPath)) {
        $config = @{
            id = $modulo.id
            name = $modulo.nome
            version = "1.0.0"
            description = $modulo.descricao
            author = "HUB RH"
            created = Get-Date -Format "yyyy-MM-dd"
            files = @{
                html = "index.html"
                css = "style.css"
                js = "script.js"
            }
            database = @{
                table = $modulo.tabela
                dataKey = $modulo.dataKey
            }
            navigation = @{
                view = $modulo.id
                label = $modulo.nome
            }
        } | ConvertTo-Json -Depth 10

        Set-Content -Path $configPath -Value $config -Encoding UTF8
        Write-Host "  → config.json criado" -ForegroundColor Cyan
    }

    # Criar README.md
    $readmePath = Join-Path $moduloPath "README.md"
    if (-not (Test-Path $readmePath)) {
        $readme = @"
# $($modulo.nome)

## Descrição
$($modulo.descricao)

## Estrutura de Arquivos
- \`index.html\` - Seção HTML do módulo
- \`style.css\` - Estilos específicos do módulo
- \`script.js\` - Lógica e funcionalidades do módulo
- \`README.md\` - Esta documentação
- \`config.json\` - Configuração do módulo

## Dados
**Tabela**: \`$($modulo.tabela)\`
**Chave de dados**: \`$($modulo.dataKey)\`

## Status
🟢 Módulo criado e pronto para integração

---
**Versão**: 1.0
**Data**: $(Get-Date -Format 'dd/MM/yyyy')
"@
        Set-Content -Path $readmePath -Value $readme -Encoding UTF8
        Write-Host "  → README.md criado" -ForegroundColor Cyan
    }

    # Criar placeholder HTML
    $htmlPath = Join-Path $moduloPath "index.html"
    if (-not (Test-Path $htmlPath)) {
        $html = @"
<!-- $($modulo.nome) -->
<section class="view" id="$($modulo.id)">
  <div class="panel">
    <div class="panel-header">
      <h2>$($modulo.nome)</h2>
      <p class="item-meta">$($modulo.descricao)</p>
    </div>
  </div>
  <!-- Conteúdo específico do módulo -->
  <div class="placeholder-content" style="padding: 20px; text-align: center; color: var(--color-text-secondary);">
    <p>Módulo em desenvolvimento</p>
  </div>
</section>
"@
        Set-Content -Path $htmlPath -Value $html -Encoding UTF8
        Write-Host "  → index.html criado (placeholder)" -ForegroundColor Cyan
    }

    # Criar placeholder CSS
    $cssPath = Join-Path $moduloPath "style.css"
    if (-not (Test-Path $cssPath)) {
        $css = @"
/* $($modulo.nome) - Estilos do Módulo */

#$($modulo.id) {
  /* Estilos específicos do módulo */
}

.placeholder-content {
  padding: 20px;
  text-align: center;
}
"@
        Set-Content -Path $cssPath -Value $css -Encoding UTF8
        Write-Host "  → style.css criado (placeholder)" -ForegroundColor Cyan
    }

    # Criar placeholder JS
    $jsPath = Join-Path $moduloPath "script.js"
    if (-not (Test-Path $jsPath)) {
        $js = @"
// $($modulo.nome) - Lógica do Módulo

console.log('Módulo $($modulo.id) carregado');

// Adicione as funções específicas deste módulo aqui
"@
        Set-Content -Path $jsPath -Value $js -Encoding UTF8
        Write-Host "  → script.js criado (placeholder)" -ForegroundColor Cyan
    }

    Write-Host ""
}

Write-Host "✅ Todos os $($modulos.Count) módulos foram criados!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Extrair conteúdo HTML do index.html para cada arquivo index.html"
Write-Host "2. Extrair estilos CSS específicos para cada arquivo style.css"
Write-Host "3. Extrair lógica JS para cada arquivo script.js"
Write-Host "4. Integrar módulos no index.html principal"
Write-Host "5. Fazer commit das mudanças"
