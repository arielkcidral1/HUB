// Pagina: DOM, filtros, colaboradores/EPIs do formulario, relatorio, edicao e registro no nucleo (HubModules).

function getSelectedMaloteDestino() {
  const value = document.getElementById("malote-destino-filter")?.value || "";
  return normalizeUnitText(value) === normalizeUnitText("Todos os destinos") ? "" : value;
}

function getMaloteFilterValues() {
  const destino = getSelectedMaloteDestino();
  const status = document.getElementById("malote-status-filter")?.value || "";
  return {
    destino: String(destino || "").trim().toLowerCase(),
    status: ["todos os status", "todos"].includes(normalizeEventType(status)) ? "" : normalizeEventType(status),
    colaborador: String(document.getElementById("malote-filter-colaborador")?.value || "").trim().toLowerCase(),
    codigo: String(document.getElementById("malote-code-search")?.value || "").trim(),
  };
}

function getMaloteCollaboratorSearchText(item = {}) {
  const groups = normalizeMaloteCollaborators(item);
  return groups.map((group) => String(group.colaborador || "").toLowerCase()).join(" ");
}

function getMaloteCodeSearch() {
  return String(document.getElementById("malote-code-search")?.value || "").trim();
}

function getFilteredMalotes() {
  const filters = getMaloteFilterValues();
  const selectedDestino = filters.destino;
  const selectedStatus = filters.status;
  const selectedColaborador = filters.colaborador;
  const search = filters.codigo;
  const searchDigits = search.replace(/\D/g, "");

  return data.malotes.filter((item) => {
    if (selectedDestino && String(item.destino || "").toLowerCase() !== selectedDestino) return false;
    if (selectedStatus && normalizeEventType(item.status) !== selectedStatus) return false;
    if (selectedColaborador && !getMaloteCollaboratorSearchText(item).includes(selectedColaborador)) return false;
    if (!searchDigits) return true;

    const code = String(item.codigoSolicitacao || "");
    const codeDigits = code.replace(/\D/g, "");
    const idDigits = String(item.id || "").replace(/\D/g, "");
    return codeDigits.includes(searchDigits) || idDigits.includes(searchDigits);
  });
}

function renderMaloteReport() {
  const target = document.getElementById("malote-report");
  if (!target) return;

  const selectedDestino = getSelectedMaloteDestino();
  const search = getMaloteCodeSearch();
  const source = getFilteredMalotes();
  const byDestino = data.malotes.reduce((acc, item) => {
    const key = item.destino || "Sem destino";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topDestino = Object.entries(byDestino).sort((a, b) => b[1] - a[1])[0];
  const separacao = source.filter((item) => item.status === "Separação").length;
  const entrega = source.filter((item) => item.status === "Entrega").length;

  target.innerHTML = `
    <article class="report-chip">
      <span>${selectedDestino || search ? "Resultado filtrado" : "Total geral"}</span>
      <strong>${source.length}</strong>
      <small>${escapeHtml([selectedDestino, search ? `Código: ${search}` : ""].filter(Boolean).join(" | ") || "Todos os destinos")}</small>
    </article>
    <article class="report-chip">
      <span>Em separacao</span>
      <strong>${separacao}</strong>
      <small>Malotes pendentes</small>
    </article>
    <article class="report-chip">
      <span>Em entrega</span>
      <strong>${entrega}</strong>
      <small>Malotes em entrega</small>
    </article>
    <article class="report-chip">
      <span>Destino com mais malotes</span>
      <strong>${topDestino ? topDestino[1] : 0}</strong>
      <small>${escapeHtml(topDestino ? topDestino[0] : "Sem dados")}</small>
    </article>
  `;
}

function readMaloteCollaborators(formElement) {
  return [...formElement.querySelectorAll("[data-malote-collaborator]")]
    .map((block) => {
      const colaborador = block.querySelector('[name="malote_colaborador[]"]')?.value.trim() || "";
      const itens = readEpiItems(block);
      return { colaborador, itens };
    })
    .filter((group) => group.colaborador && group.itens.length);
}

function createMaloteCollaboratorBlock(group = {}) {
  const itens = group.itens?.length ? group.itens : [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }];
  return `
    <div class="malote-collaborator" data-malote-collaborator>
      <div class="item-topline">
        <label>Colaborador que irá receber
          <input name="malote_colaborador[]" type="text" minlength="3" maxlength="120" pattern="\\S+\\s+\\S+.*" placeholder="Nome e sobrenome" autocomplete="off" value="${escapeHtml(group.colaborador || "")}" required />
        </label>
        <button class="danger-button remove-malote-collaborator" type="button" aria-label="Remover colaborador">Remover colaborador</button>
      </div>
      <div class="malote-collaborator-items" data-malote-collaborator-items>
        ${itens.map((item) => createMaloteItemRow(item)).join("")}
      </div>
      <button class="secondary-link add-malote-item" type="button">Adicionar item para este colaborador</button>
    </div>
  `;
}

function normalizeMaloteCollaborators(malote = {}) {
  if (Array.isArray(malote.colaboradores) && malote.colaboradores.length) {
    return malote.colaboradores
      .map((group) => ({
        colaborador: String(group.colaborador || "").trim(),
        itens: Array.isArray(group.itens) ? group.itens.filter((item) => item?.nome) : [],
      }))
      .filter((group) => group.colaborador && group.itens.length);
  }

  const legacyItems = parseEpiItems(malote.epis);
  if (!legacyItems.length) return [];
  return [{ colaborador: malote.colaborador || "Nao informado", itens: legacyItems }];
}

function resetMaloteCollaborators(groups = [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  const safeGroups = groups.length ? groups : [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }];
  list.innerHTML = safeGroups.map((group) => createMaloteCollaboratorBlock(group)).join("");
}

function renderMaloteEpisDetails(epis) {
  const items = parseEpiItems(epis);
  if (!items.length) return `<p><strong>EPI:</strong> ${escapeHtml(epis || "Nao informado")}</p>`;

  return items
    .map((item) => `
      <div class="malote-epi-detail">
        <p><strong>EPI:</strong> ${escapeHtml(item.nome || "Nao informado")}</p>
        <p><strong>Tamanho do EPI:</strong> ${escapeHtml(item.tamanho || "Nao se aplica")}</p>
        <p><strong>Quantidade:</strong> ${escapeHtml(item.quantidade || "1")}</p>
      </div>
    `)
    .join("");
}

function renderMaloteCollaboratorsDetails(malote = {}) {
  const groups = normalizeMaloteCollaborators(malote);
  if (!groups.length) return renderMaloteEpisDetails(malote.epis);

  return groups
    .map((group) => `
      <div class="malote-collaborator-detail">
        <p><strong>Colaborador:</strong> ${escapeHtml(group.colaborador || "Nao informado")}</p>
        <ul>
          ${group.itens.map((item) => `
            <li>
              ${escapeHtml(item.nome || "Nao informado")}
              - Tamanho: ${escapeHtml(item.tamanho || "Nao se aplica")}
              - Quantidade: ${escapeHtml(item.quantidade || "1")}
            </li>
          `).join("")}
        </ul>
      </div>
    `)
    .join("");
}

function renderMaloteCardContent(item, options = {}) {
  const { showAudit = true, showActions = true } = options;
  return `
    <div class="item-topline"><p class="item-title">Malote de EPI</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
    <p><strong>Destino:</strong> ${escapeHtml(item.destino || "Nao informado")}</p>
      <p><strong>Origem:</strong> ${escapeHtml(item.origem || "Nao informada")}</p>
      <p><strong>Código da Solicitação:</strong> ${escapeHtml(item.codigoSolicitacao || "Nao informado")}</p>
    ${renderMaloteCollaboratorsDetails(item)}
    ${item.observacoes ? `<p><strong>Observações:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
    ${showAudit ? `<p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}</p>` : ""}
    ${showActions ? `
      <div class="job-actions">
        <button class="secondary-link" type="button" data-action="editar-malote" data-id="${escapeHtml(item.id)}">Editar</button>
        <button class="secondary-link" type="button" data-action="baixar-documento-malote" data-id="${escapeHtml(item.id)}">Baixar documento</button>
        <button class="danger-button" type="button" data-action="excluir-malote" data-id="${escapeHtml(item.id)}">Deletar</button>
      </div>
    ` : ""}
  `;
}

function renderMalotes() {
  safeRenderSection("malote-report", renderMaloteReport);
  safeRenderSection("malotes", () => {
    renderCards("malotes-list", getFilteredMalotes(), (item) => `
      <article class="item-card">
        ${renderMaloteCardContent(item)}
      </article>
    `);
  });
}

function editarMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("malote-form");
  if (!malote || !form) return;

  setFieldValue(form.elements.id, malote.id);
  setFieldValue(form.elements.destino, malote.destino || "");
  setFieldValue(form.elements.origem, malote.origem || "");
  setFieldValue(form.elements.codigo_solicitacao, malote.codigoSolicitacao || "");
  setFieldValue(form.elements.observacoes, malote.observacoes || "");
  setFieldValue(form.elements.status, malote.status || "Separação");
  resetMaloteCollaborators(normalizeMaloteCollaborators(malote));
  document.getElementById("cancelar-edicao-malote")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("malote-destino-filter")?.addEventListener("change", () => {
  renderAll();
});

document.getElementById("malote-status-filter")?.addEventListener("change", () => {
  renderAll();
});

document.getElementById("malote-filter-colaborador")?.addEventListener("input", renderAll);

document.getElementById("malote-code-search")?.addEventListener("input", () => {
  const field = document.getElementById("malote-code-search");
  if (field) field.value = formatRequestCode(field.value);
  renderAll();
});

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  document.getElementById("adicionar-colaborador-malote")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("afterbegin", createMaloteCollaboratorBlock());
    populateEpiSelects();
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const addItemButton = event.target.closest(".add-malote-item");
    if (addItemButton) {
      const block = addItemButton.closest("[data-malote-collaborator]");
      const itemsList = block?.querySelector("[data-malote-collaborator-items]");
      if (!itemsList) return;
      itemsList.insertAdjacentHTML("afterbegin", createMaloteItemRow());
      populateEpiSelects();
      return;
    }

    const removeCollaboratorButton = event.target.closest(".remove-malote-collaborator");
    if (removeCollaboratorButton) {
      const blocks = document.querySelectorAll("#epi-list [data-malote-collaborator]");
      if (blocks.length <= 1) return;
      removeCollaboratorButton.closest("[data-malote-collaborator]")?.remove();
      return;
    }

    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const block = button.closest("[data-malote-collaborator]");
    const rows = block?.querySelectorAll(".epi-row") || [];
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const typeSelect = event.target.closest("[data-item-type-select]");
    if (!typeSelect) return;
    const row = typeSelect.closest(".epi-row");
    const fieldsContainer = row?.querySelector("[data-epi-row-fields]");
    if (fieldsContainer) fieldsContainer.innerHTML = renderEpiRowFields(typeSelect.value, {});
  });

  document.getElementById("epi-list")?.addEventListener("input", (event) => {
    const cpfInput = event.target.closest('[name="cracha_cpf[]"]');
    if (!cpfInput) return;
    cpfInput.value = formatCpf(cpfInput.value);
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const nameSelect = event.target.closest('[name="epi_nome[]"]');
    if (!nameSelect) return;
    const row = nameSelect.closest(".epi-row");
    const type = row?.querySelector('[name="epi_tipo[]"]')?.value || "epi";
    const sizeSelect = row?.querySelector('[name="epi_tamanho[]"]');
    if (sizeSelect) sizeSelect.innerHTML = renderItemSizeOptions(type, sizeSelect.value, nameSelect.value);
  });

  maloteForm.elements.codigo_solicitacao?.addEventListener("input", (event) => {
    event.currentTarget.value = formatRequestCode(event.currentTarget.value);
  });

  maloteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const codigoSolicitacao = String(form.get("codigo_solicitacao") || "").replace(/\D/g, "");
    if (!/^\d{5}$/.test(codigoSolicitacao)) {
      showModal("Código inválido", "Informe o Código da Solicitação no formato 0000-0.", "error");
      return;
    }
    const colaboradores = readMaloteCollaborators(formElement);
    if (!colaboradores.length || colaboradores.some((group) => !hasFullName(group.colaborador))) {
      showModal("Colaborador e EPIs obrigatorios", "Informe nome e sobrenome do colaborador e adicione pelo menos um EPI ou uniforme para ele.", "error");
      return;
    }
    const epiItems = colaboradores.flatMap((group) => group.itens);

    const payload = {
      destino: form.get("destino"),
      origem: form.get("origem"),
      codigoSolicitacao: `${codigoSolicitacao.slice(0, 4)}-${codigoSolicitacao.slice(4)}`,
      observacoes: String(form.get("observacoes") || "").trim(),
      colaboradores,
      epis: formatEpiItems(epiItems),
      status: form.get("status"),
      createdBy: getCurrentUserName(),
    };
    const success = id ? await updateItem("malotes", id, { ...payload, updatedBy: getCurrentUserName() }) : await addItem("malotes", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      resetMaloteCollaborators();
      document.getElementById("cancelar-edicao-malote")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar malote";
    }
  });
}

document.getElementById("cancelar-edicao-malote")?.addEventListener("click", () => {
  maloteForm.reset();
  maloteForm.elements.id.value = "";
  resetMaloteCollaborators();
  document.getElementById("cancelar-edicao-malote").setAttribute("hidden", "");
  maloteForm.querySelector('button[type="submit"]').textContent = "Salvar malote";
});

function setupMalotesFormScrollGrid() {
  setupFormScrollGrid({
    listId: "malotes-list",
    formId: "malote-form",
    expandedWorkspaceClass: "malotes-workspace-expanded",
    expandedListClass: "malotes-two-col",
  });
}

document.addEventListener("DOMContentLoaded", setupMalotesFormScrollGrid);

HubModules.register({
  ...malotesRepository,
  view: "malotes",
  silent: true,
  render: renderMalotes,
  actions: {
    "editar-malote": (id) => editarMalote(id),
    "baixar-documento-malote": (id) => baixarDocumentoMalote(id),
    "excluir-malote": (id) => excluirMalote(id),
  },
});
