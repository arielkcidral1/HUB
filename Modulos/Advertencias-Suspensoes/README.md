# Módulo de Advertências e Suspensões

## Descrição
Este módulo gerencia as medidas disciplinares de colaboradores, incluindo advertências e suspensões. Permite registro, edição, exclusão e geração de documentos dessas medidas.

## Estrutura de Arquivos
- `index.html` - Seção HTML do módulo
- `style.css` - Estilos específicos do módulo
- `script.js` - Lógica e funcionalidades do módulo
- `README.md` - Esta documentação

## Funcionalidades

### 1. Cadastro de Advertências
- Registro de nome do funcionário
- Data da advertência
- Unidade e local
- Motivo detalhado
- Anexação de arquivos (opcional)

### 2. Cadastro de Suspensões
- Registro de nome do funcionário
- Data da suspensão
- Unidade e local
- Número de dias de suspensão
- Motivo detalhado
- Anexação de arquivos (opcional)

### 3. Gerenciamento de Registros
- Listagem de registros salvos
- Filtros por nome, motivo, mês e unidade
- Edição de registros existentes
- Exclusão de registros
- Geração de documentos

### 4. Relatórios
- Exportação em formato XLSX
- Opção de filtrados ou todos os registros
- Inclui informações completas das medidas

## Dados Armazenados

### Tabela: `hub_advertencias_suspensoes`
- `id` - ID único
- `tipo` - "advertencia" ou "suspensao"
- `colaborador` - Nome do funcionário
- `data_medida` - Data da medida
- `unidade` - Unidade do colaborador
- `local` - Localidade
- `motivo` - Descrição do motivo
- `dias_suspensao` - Dias de suspensão (apenas para suspensões)
- `arquivo_nome` - Nome do arquivo anexado
- `arquivo_url` - URL do arquivo no storage
- `created_by` - Quem criou o registro
- `created_at` - Data de criação
- `updated_by` - Quem atualizou
- `updated_at` - Data de atualização

## Como Integrar

### 1. Importar o HTML
Adicione ao `index.html` principal:
```html
<!-- Módulo de Advertências e Suspensões -->
<section class="view" id="advertencias-suspensoes">
  <!-- conteúdo do Modulos/Advertencias-Suspensoes/index.html -->
</section>
```

### 2. Importar o CSS
Adicione ao `<head>` do `index.html`:
```html
<link rel="stylesheet" href="Modulos/Advertencias-Suspensoes/style.css" />
```

### 3. Importar o JavaScript
Adicione antes do fechamento de `</body>`:
```html
<script src="Modulos/Advertencias-Suspensoes/script.js"></script>
```

### 4. Funções Globais Necessárias
O módulo depende das seguintes funções globais (do script.js principal):
- `data.disciplinaryRecords` - Array de registros
- `escapeHtml()` - Escapar HTML
- `showModal()` - Mostrar modal
- `showPasswordActionModal()` - Modal com validação de senha
- `addItem()` - Adicionar item ao banco
- `updateItem()` - Atualizar item
- `deleteItem()` - Deletar item
- `renderCards()` - Renderizar lista de cards
- `exportToXlsx()` - Exportar para Excel
- `getCurrentUserName()` - Obter nome do usuário atual
- `getSystemFallbackAuthor()` - Autor padrão do sistema
- `getCityFromUnit()` - Obter cidade da unidade
- `verifyAuthorizationPassword()` - Verificar senha
- `populateUnitSelects()` - Popular selects de unidades

## Eventos e Actions
O módulo utiliza `data-action` para os seguintes eventos:
- `gerar-documento-disciplinary` - Gerar documento da medida
- `editar-disciplinary` - Editar registro
- `excluir-disciplinary` - Deletar registro
- `gerar-relatorio-disciplinary` - Gerar relatório em Excel

## Filtros
- **Nome**: Filtro por nome do funcionário
- **Motivo**: Filtro por motivo da medida
- **Mês**: Filtro por mês da medida
- **Unidade**: Filtro por unidade

## Próximas Melhorias
- [ ] Integração com sistema de permissões mais granular
- [ ] Notificações automáticas
- [ ] Templates de documentos customizados por unidade
- [ ] Histórico de alterações
- [ ] Dashboard com estatísticas

## Notas
- Todos os registros são sincronizados com o PostgreSQL
- Arquivos anexados são armazenados no bucket privado `hub-medidas-disciplinares`
- A exclusão de registros requer validação de senha
- Documentos são gerados a partir de templates DOCX
