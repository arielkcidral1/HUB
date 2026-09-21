# Guia Prático: Integração do Módulo Advertências e Suspensões

## 📌 Resumo Executivo

Este guia fornece instruções passo a passo para integrar o módulo de Advertências e Suspensões no arquivo `index.html` principal.

**Tempo estimado**: 10 minutos
**Nível de dificuldade**: Fácil
**Requisitos**: Conhecimento básico de HTML

## 🎯 Objetivos

- ✅ Integrar HTML do módulo
- ✅ Integrar estilos CSS
- ✅ Integrar lógica JavaScript
- ✅ Validar funcionamento
- ✅ Sincronizar com Git

## 📝 Passo 1: Adicionar CSS (5 minutos)

### Localizar
Abra `index.html` e localize a seção `<head>`:

```html
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- ... outras metas ... -->
    <link rel="stylesheet" href="style.css?v=clima-spacing-v29" />
    <link rel="stylesheet" href="message-size-enhancement.css" />
    <link rel="stylesheet" href="vagas-format.css" />
    <link rel="stylesheet" href="vagas-admin-enhance.css" />
</head>
```

### Ação
Após a última linha de `<link rel="stylesheet"...>`, adicione:

```html
    <link rel="stylesheet" href="Modulos/Advertencias-Suspensoes/style.css" />
```

### Resultado
```html
    <link rel="stylesheet" href="vagas-admin-enhance.css" />
    <link rel="stylesheet" href="Modulos/Advertencias-Suspensoes/style.css" />
</head>
```

---

## 📝 Passo 2: Adicionar HTML (3 minutos)

### Localizar
No arquivo `index.html`, localize a seção com as views (por volta da linha 1270):

```html
        <section class="view" id="teste-clima">
          <!-- conteúdo do teste de clima -->
        </section>
        <section class="view" id="gerenciamento-vt">
```

### Ação
Entre o fechamento de `</section>` de teste-clima e a abertura de `<section class="view" id="gerenciamento-vt">`, insira o conteúdo do arquivo `Modulos/Advertencias-Suspensoes/index.html`.

O arquivo já possui uma `<section>` com `id="advertencias-suspensoes"`, então copie todo o conteúdo.

### Resultado
Sua estrutura ficará assim:

```html
        <!-- Final da seção Teste de Clima -->
        </section>

        <!-- ⭐ NOVO: Seção de Advertências e Suspensões -->
        <section class="view" id="advertencias-suspensoes">
          <div class="document-workspace">
            <aside class="panel doc-menu">
              <!-- ... conteúdo do módulo ... -->
            </aside>
            <!-- ... resto do módulo ... -->
          </div>
        </section>
        <!-- ⭐ FIM: Seção de Advertências e Suspensões -->

        <!-- Seção de Gerenciamento VT -->
        <section class="view" id="gerenciamento-vt">
```

---

## 📝 Passo 3: Adicionar JavaScript (2 minutos)

### Localizar
No arquivo `index.html`, localize o fechamento de `</body>`:

```html
    <!-- ... outras scripts ... -->
    <script src="vagas-admin-filters.js"></script>
  </body>
</html>
```

### Ação
Antes do fechamento de `</body>`, adicione:

```html
<script src="Modulos/Advertencias-Suspensoes/script.js"></script>
```

### Resultado
```html
    <script src="vagas-admin-filters.js"></script>
    <script src="Modulos/Advertencias-Suspensoes/script.js"></script>
  </body>
</html>
```

---

## ✅ Validação da Integração

### Verificar no Navegador

1. **Abrir a aplicação** em http://localhost:3000 (ou seu local)

2. **Verificar navegação**: Na barra lateral, procure por "Advertências e Suspensões"
   - Deve estar presente no menu lateral
   - Deve estar clicável

3. **Clicar no item de menu**: Deve abrir a seção corretamente

4. **Verificar componentes**:
   - ✅ Menu de abas (Advertência / Suspensão)
   - ✅ Formulário de cadastro
   - ✅ Campos de entrada
   - ✅ Botão de salvar
   - ✅ Seção de registros salvos
   - ✅ Filtros funcionando

### Testes Funcionais

#### Teste 1: Criar Advertência
```
1. Clicar em "Advertências e Suspensões"
2. Aba "Advertência" já deve estar selecionada
3. Preencher:
   - Nome do funcionário: "João Silva"
   - Data: 21/09/2026
   - Unidade: Selecionar uma
   - Local: (preenchido automaticamente)
   - Motivo: "Falta injustificada"
4. Clicar "Salvar advertência"
5. Verificar se aparece na lista de registros
```

#### Teste 2: Criar Suspensão
```
1. Clicar na aba "Suspensão"
2. Preencher:
   - Nome do funcionário: "Maria Santos"
   - Data: 21/09/2026
   - Unidade: Selecionar uma
   - Dias de suspensão: 3
   - Motivo: "Comportamento inadequado"
3. Clicar "Salvar suspensão"
4. Verificar se aparece na lista
```

#### Teste 3: Filtros
```
1. Na seção "Registros salvos"
2. Digitar um nome no filtro "Nome"
3. Verificar se a lista é filtrada
4. Repetir para outros filtros (Motivo, Mês, Unidade)
```

#### Teste 4: Relatório
```
1. Clicar em "Relatório"
2. Escolher entre "Registros filtrados" ou "Todos"
3. Verificar se um arquivo .xlsx é baixado
```

### Console (F12)

Procure por mensagens de erro:

```javascript
// ✅ Correto - sem erros no console
console.log(data.disciplinaryRecords) // Deve mostrar array

// ❌ Erro - função não encontrada
renderDisciplinaryRecords() // Error: function not defined
```

---

## 🔍 Checklist de Integração

- [ ] CSS adicionado no `<head>`
- [ ] HTML adicionado na seção de views
- [ ] JavaScript adicionado antes de `</body>`
- [ ] Menu lateral mostra "Advertências e Suspensões"
- [ ] Seção abre ao clicar no menu
- [ ] Abas funcionam (Advertência / Suspensão)
- [ ] Formulário permite entrada de dados
- [ ] Botão "Salvar" funciona
- [ ] Registros aparecem na lista
- [ ] Filtros funcionam
- [ ] Relatório pode ser gerado

---

## 🐛 Solução de Problemas

### Problema 1: "Advertências e Suspensões" não aparece no menu

**Causa**: A `<section>` com `id="advertencias-suspensoes"` não foi adicionada.

**Solução**: 
- Verifique se adicionou todo o HTML do módulo
- Verifique o atributo `id="advertencias-suspensoes"`
- Recarregue a página

### Problema 2: Formulário não salva dados

**Causa**: Script não foi carregado ou funções globais faltam.

**Solução**:
- Verifique se o `<script src="Modulos/...script.js">` está presente
- Abra o console (F12) e procure por erros
- Verifique se `data.disciplinaryRecords` existe

### Problema 3: Estilos quebrados/desalinhados

**Causa**: CSS não foi carregado ou há conflitos.

**Solução**:
- Verifique se o `<link rel="stylesheet" href="Modulos/...style.css">` está presente
- Abra DevTools (F12) → Network e procure pelo arquivo CSS
- Procure por erros 404

### Problema 4: Console mostra "function not defined"

**Causa**: Funções globais necessárias não existem.

**Solução**:
- Verifique se `script.js` principal foi carregado
- Verifique se a função existe no `script.js` global
- Consulte `DEPENDÊNCIAS` em `config.json`

---

## 📊 Verificação de Dados

### Dados Esperados no Navegador

Após criar alguns registros, abra o console (F12) e execute:

```javascript
// Ver todos os registros
console.table(data.disciplinaryRecords)

// Ver count
console.log(data.disciplinaryRecords.length)

// Ver último registro
console.log(data.disciplinaryRecords[data.disciplinaryRecords.length - 1])
```

**Resultado esperado:**
```
[
  {
    id: "uuid-1",
    tipo: "advertencia",
    colaborador: "João Silva",
    data_medida: "2026-09-21",
    unidade: "Fredy Pneus",
    local: "Caxias",
    motivo: "Falta injustificada",
    createdAt: "2026-09-21T...",
    createdBy: "admin"
  },
  // ... mais registros
]
```

---

## 🔐 Segurança

### Validações Implementadas

✅ **Entrada de dados**
- Campos obrigatórios marcados com `required`
- Validação de tipo (date, number, text)
- Máximo de caracteres em textarea

✅ **Segurança**
- HTML escapado com `escapeHtml()`
- Exclusão requer validação de senha
- Edição requer confirmação

✅ **Arquivo**
- Máximo 10MB
- Tipos permitidos: imagem, PDF, Word
- Validação MIME type

---

## 🚀 Próximas Etapas

Após integração bem-sucedida:

1. **Testes Completos**
   - [ ] Testar em diferentes navegadores
   - [ ] Testar responsividade (mobile)
   - [ ] Testar offline/online

2. **Customização**
   - [ ] Ajustar templates de documentos
   - [ ] Personalizar mensagens
   - [ ] Adicionar novos campos conforme necessário

3. **Documentação**
   - [ ] Treinar usuários
   - [ ] Criar guias de uso
   - [ ] Documentar workflows

4. **Monitoramento**
   - [ ] Monitorar performance
   - [ ] Verificar sincronização
   - [ ] Coletar feedback

---

## 📞 Suporte

Se tiver problemas:

1. Consulte `Modulos/Advertencias-Suspensoes/README.md`
2. Verifique `GUIA-MODULOS.md`
3. Procure em `config.json` por dependências
4. Abra o console (F12) para erros
5. Verifique Network tab para falhas de carregamento

---

## ✨ Dicas Extras

### Performance
- Os scripts do módulo são carregados apenas quando necessário
- Use DevTools → Performance para medir

### Customização
- Modifique `Modulos/Advertencias-Suspensoes/style.css` para cores/espaçamento
- Adapte campos em `index.html` conforme necessário
- Estenda funções em `script.js` para novos comportamentos

### Manutenção
- Mantenha versionamento no `config.json`
- Documente mudanças no `README.md`
- Teste antes de fazer merge para `master`

---

**Versão**: 1.0
**Data**: 21 de setembro de 2026
**Status**: ✅ Pronto para Integração
