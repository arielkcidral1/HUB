# Guia de Módulos do HUB RH

## 📋 Visão Geral

O projeto HUB foi reestruturado para suportar uma arquitetura modular. Cada seção do sistema (como Advertências e Suspensões) pode agora ser mantida como um módulo independente com seus próprios arquivos HTML, CSS e JavaScript.

## 🗂️ Estrutura de Diretórios

```
HUB/
├── index.html              (arquivo principal - contém shell da app)
├── style.css              (estilos globais)
├── script.js              (lógica global)
├── Modulos/               (pasta para todos os módulos)
│   ├── Advertencias-Suspensoes/
│   │   ├── index.html     (seção HTML do módulo)
│   │   ├── style.css      (estilos específicos)
│   │   ├── script.js      (lógica específica)
│   │   ├── config.json    (configuração do módulo)
│   │   └── README.md      (documentação)
│   ├── [ProximoModulo]/
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script.js
│   │   ├── config.json
│   │   └── README.md
└── [...]
```

## 📦 Módulos Disponíveis

### 1. Advertências e Suspensões
- **Pasta**: `Modulos/Advertencias-Suspensoes/`
- **View ID**: `advertencias-suspensoes`
- **Funcionalidades**:
  - Registro de advertências
  - Registro de suspensões
  - Geração de documentos
  - Relatórios em Excel
  - Anexação de arquivos

**Documentação**: Ver `Modulos/Advertencias-Suspensoes/README.md`

## 🚀 Como Integrar um Módulo

### Opção 1: Integração Manual

#### Passo 1: Adicionar HTML ao index.html
No arquivo `index.html` principal, localize a seção `<main class="main-content">` e adicione:

```html
<!-- Importar seção do módulo -->
<div id="modulo-advertencias-suspensoes">
  <!-- Incluir conteúdo de Modulos/Advertencias-Suspensoes/index.html -->
</div>
```

#### Passo 2: Adicionar CSS
No `<head>` do `index.html`, adicione o link para o CSS do módulo:

```html
<link rel="stylesheet" href="Modulos/Advertencias-Suspensoes/style.css" />
```

#### Passo 3: Adicionar JavaScript
Antes do fechamento de `</body>`, adicione:

```html
<script src="Modulos/Advertencias-Suspensoes/script.js"></script>
```

### Opção 2: Integração Automática (futura)
Quando um loader automático for implementado, os módulos serão carregados dinamicamente através do arquivo `config.json`.

## 📝 Estrutura de um Módulo

### config.json
Arquivo de configuração que descreve:
- Metadados do módulo (nome, versão, autor)
- Arquivos que compõem o módulo
- Tabela de banco de dados associada
- Chave de dados no objeto global
- Permissões de acesso
- Dependências de funções globais
- Filtros disponíveis

### index.html
- Contém apenas a `<section>` do módulo
- Usa IDs únicos (ex: `id="advertencias-suspensoes"`)
- Referencia assets com caminhos relativos
- Não inclui `<!doctype>`, `<html>`, `<head>`, `<body>`

### style.css
- Estilos específicos do módulo
- Pode usar variáveis CSS globais (`:root`)
- Evita estilos globais que afetem outros módulos
- Prefixo recomendado: nome do módulo em classes

### script.js
- Lógica específica do módulo
- Funções nomeadas com prefixo do módulo (ex: `functionNameDisciplinary()`)
- Dependências globais documentadas em `config.json`
- Escuta eventos `data-action` específicos

## 🔗 Dependências Comuns

Os módulos dependem das seguintes funções e objetos globais:

### Objetos
- `data.moduleName` - Array de registros do módulo
- `window` - Escopo global

### Funções Essenciais
- `escapeHtml(text)` - Escapar conteúdo HTML
- `showModal(title, message, type)` - Mostrar modal
- `showPasswordActionModal(config)` - Modal com validação de senha
- `addItem(collection, values)` - Adicionar item ao banco
- `updateItem(collection, id, values)` - Atualizar item
- `deleteItem(collection, id)` - Deletar item
- `renderCards(elementId, data, template)` - Renderizar lista de cards
- `exportToXlsx(data, filename)` - Exportar para Excel
- `getCurrentUserName()` - Obter nome do usuário atual
- `getSystemFallbackAuthor()` - Autor padrão
- `getCityFromUnit(unitId)` - Obter cidade da unidade
- `verifyAuthorizationPassword(password)` - Verificar senha
- `populateUnitSelects()` - Popular selects de unidades

## 🎯 Boas Práticas

### Nomenclatura
- **Classes CSS**: Use prefixo do módulo (ex: `.disciplinary-*`)
- **Funções JS**: Use sufixo do módulo (ex: `functionNameDisciplinary()`)
- **IDs HTML**: Use prefixo único (ex: `id="disciplinary-*"`)
- **Data attributes**: Use prefixo único (ex: `data-disciplinary-*`)

### Performance
- Carregue scripts do módulo apenas quando necessário
- Use event delegation para listeners
- Minifique CSS e JS em produção

### Segurança
- Sempre escapar HTML com `escapeHtml()`
- Validar dados antes de salvar
- Usar modais de confirmação para ações críticas
- Exigir validação de senha para deletar

### Manutenção
- Mantenha documentação atualizada no README
- Liste todas as dependências externas
- Documente filtros e eventos disponíveis
- Use comentários para lógica complexa

## 📊 Dados Sincronizados

Todos os módulos sincronizam dados com PostgreSQL:
- Local: IndexedDB (para offline)
- Servidor: PostgreSQL (fonte de verdade)
- Sincronização automática quando online

## 🔄 Próximas Seções para Modularizar

- [ ] Denúncias Recebidas
- [ ] Feedbacks Diretoria
- [ ] Comunicação (Chat)
- [ ] Malotes de EPI
- [ ] Chamados
- [ ] Quadros
- [ ] Vagas e Projetos
- [ ] Calendário
- [ ] Documentos de Uso Geral
- [ ] Documentos de Contratados
- [ ] Teste de Clima
- [ ] Gerenciamento VT

## 🛠️ Desenvolvimento Futuro

### Sistema de Loader Automático
Implementar um sistema que:
1. Leia todos os `config.json` na pasta `Modulos/`
2. Carregue dinâmicamente HTML, CSS e JS
3. Registre dependências automaticamente
4. Valide permissões de acesso

### Sistema de Hooks
Permitir que módulos se conectem a:
- Eventos de sincronização
- Notificações do sistema
- Filters de dados

### UI Generator
Gerar formulários automaticamente a partir do `config.json`:
- Campos de entrada
- Validações
- Filtros

## 📧 Suporte

Para questões sobre a estrutura modular:
1. Verifique o README do módulo específico
2. Consulte o `config.json` para dependências
3. Veja exemplos em módulos existentes

---

**Última atualização**: 21 de setembro de 2026
**Versão**: 1.0
