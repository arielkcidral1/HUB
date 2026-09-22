# Regras do Codex

- Apos concluir cada prompt que altere o repositorio, sincronizar o trabalho com Git.
- Antes de commitar, revisar `git status` e executar as verificacoes relevantes quando houver.
- Usar a sequencia: `git pull --rebase`, `git commit` e `git push`.
- Se houver conflito ou mudanca local do usuario, preservar o trabalho existente e pedir orientacao somente quando nao houver uma resolucao segura.

# Arquitetura (estilo hexagonal, inspirada no Elo)

Fluxo: `pages -> usecases -> dominio`, com `repositories` fazendo a ponte com o banco. Dependencias apontam para dentro.

```
app/
  adapters/
    www/pages/<Modulo>/   page.html, page.js (DOM e registro no nucleo), style.css
    www/utils/            registry.js (HubModules) e loader.js (injeta page.html)
    repositories/<Modulo>/ mapeamento linha<->objeto, payload, compatibilidade de colunas, upload
  core/
    domain/<Modulo>/      regras de negocio puras (sem DOM, sem banco)
    usecases/<Modulo>/    fluxos: gerar documento, relatorio, validar, excluir
```

- Modulos migrados: `AdvertenciasSuspensoes`. Os demais ainda vivem em `index.html`, `script.js` e `style.css` na raiz.
- Sao scripts classicos (sem `import`), carregados em `index.html` antes de `script.js`, na ordem: domain, repositories, usecases, page.
- O modulo se liga ao nucleo com `HubModules.register({ collection, table, view, mapRow, toPayload, render, actions, ... })` no fim de `page.js`; o nucleo nao deve conter `if (collection === "<modulo>")`.
- `api/` continua na raiz porque a Vercel so reconhece funcoes nessa pasta.
- Novo modulo: criar as 4 pastas acima, uma tag do loader no ponto da secao em `index.html`, um `<link>` de CSS e os `<script>` das camadas.
