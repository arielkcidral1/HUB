// Pagina: abas de tipo de documento, filtros, listagem, mascaras de campo e formularios genericos
// (um por tipo, todos com data-doc-form) e registro do modulo no nucleo (HubModules).

function formatTimeRange(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const formatHour = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Number(value), 23)).padStart(2, "0");
  };
  const formatMinute = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Number(value), 59)).padStart(2, "0");
  };
  const firstHour = formatHour(digits.slice(0, 2));
  const firstMinute = formatMinute(digits.slice(2, 4));
  const secondHour = formatHour(digits.slice(4, 6));
  const secondMinute = formatMinute(digits.slice(6, 8));

  if (digits.length <= 2) return firstHour;
  if (digits.length <= 4) return `${firstHour}:${firstMinute}`;
  if (digits.length <= 6) return `${firstHour}:${firstMinute} às ${secondHour}`;
  return `${firstHour}:${firstMinute} às ${secondHour}:${secondMinute}`;
}

function formatCurrencyBR(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatAbsencePeriod(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const formatDay = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Math.max(Number(value), 1), 31)).padStart(2, "0");
  };
  const formatMonth = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Math.max(Number(value), 1), 12)).padStart(2, "0");
  };
  const firstDay = formatDay(digits.slice(0, 2));
  const firstMonth = formatMonth(digits.slice(2, 4));
  const secondDay = formatDay(digits.slice(4, 6));
  const secondMonth = formatMonth(digits.slice(6, 8));

  if (digits.length <= 2) return firstDay;
  if (digits.length <= 4) return `${firstDay}/${firstMonth}`;
  if (digits.length <= 6) return `${firstDay}/${firstMonth} a ${secondDay}`;
  return `${firstDay}/${firstMonth} a ${secondDay}/${secondMonth}`;
}

function formatRg(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}

function normalizeDocumentDateInputs(root = document) {

  root.querySelectorAll('[data-doc-form] input[type="date"], #evento-form input[type="date"]').forEach(applyDateMask);

  root.querySelectorAll('[data-date-mask="true"]').forEach((input) => {
    input.value = formatMaskedDate(input.value);
  });
}

function getActiveDocumentTab() {
  return document.querySelector("#documentos .doc-tab.active")?.dataset.doc || "";
}

function getDocumentFilterValues() {
  return {
    nome: String(document.getElementById("document-filter-name")?.value || "").trim().toLowerCase(),
    tipo: getActiveDocumentTab(),
    cpf: String(document.getElementById("document-filter-cpf")?.value || "").replace(/\D/g, ""),
  };
}

function updateDocumentFilterClearButton() {
  const clearButton = document.getElementById("clear-document-filters");
  if (!clearButton) return;
  const filters = getDocumentFilterValues();
  clearButton.hidden = !Boolean(filters.nome || filters.cpf);
}

function getDocumentRecordCpf(item = {}) {
  return String(item.formData?.cpf || "").replace(/\D/g, "");
}

function getCurrentDocumentAccessNames() {
  const user = getCurrentUserRecord?.() || {};
  return [
    getCurrentUserName?.(),
    currentUserProfile?.nome,
    currentAuthUser?.user_metadata?.nome,
    currentAuthUser?.user_metadata?.name,
    currentAuthUser?.email,
    user.nome,
    user.email,
  ]
    .map((value) => normalizeLoginName(value))
    .filter(Boolean);
}

function hasFullDocumentAccess() {
  return isRhUser() || hasFredericoLevelAccess();
}

function canCurrentUserAccessDocumentRecord(item = {}) {
  if (hasFullDocumentAccess()) return true;
  if (!isManagerUser()) return true;
  const author = normalizeLoginName(item.createdBy || item.ownerName || item.autor || "");
  return Boolean(author && getCurrentDocumentAccessNames().includes(author));
}

function filterDocumentRecords(items = []) {
  const filters = getDocumentFilterValues();
  return items.filter((item) => {
    if (!canCurrentUserAccessDocumentRecord(item)) return false;

    if (filters.nome) {
      const collaboratorName = String(item.formData?.colaborador || item.summary || "").toLowerCase();
      if (!collaboratorName.includes(filters.nome)) return false;
    }

    if (item.type !== filters.tipo) return false;

    if (filters.cpf) {
      const cpf = getDocumentRecordCpf(item);
      if (!cpf.includes(filters.cpf)) return false;
    }

    return true;
  });
}

function renderDocumentRecords() {
  const target = document.getElementById("document-records");
  if (!target) return;

  const records = filterDocumentRecords(data.documentos || []);
  const emptyState = document.getElementById("documentos-empty-state");
  const registrosPanel = document.getElementById("documentos-registros-panel");
  const hasActiveTab = Boolean(getActiveDocumentTab());
  if (emptyState) emptyState.hidden = hasActiveTab;

  if (registrosPanel) registrosPanel.hidden = !hasActiveTab || !records.length;

  if (!records.length) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = records
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(documentLabels[item.type] || item.type)}</p>
          <div>
            <button type="button" class="tag tag-button teal-tag-button" data-action="baixar-documento-rh" data-id="${item.id}">Gerar documento</button>
            <button type="button" class="tag tag-button teal-tag-button" data-action="editar-documento" data-id="${item.id}">Editar</button>
            <button type="button" class="tag alert tag-button" data-action="excluir-documento" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <p class="item-meta">${escapeHtml(item.updatedAt || item.createdAt)}</p>
        <p class="item-meta">Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}</p>
      </article>
    `)
    .join("");
}

function getAccessibleDocumentRecord(id) {
  const doc = (data.documentos || []).find((item) => String(item.id) === String(id));
  if (!doc || !canCurrentUserAccessDocumentRecord(doc)) return null;
  return doc;
}

function cancelActiveDocumentEditing() {
  if (!window.editingDocId) return;
  window.editingDocId = null;
  document.querySelectorAll("[data-doc-form]").forEach(form => {
    form.reset();
    const btn = form.querySelector("button[type='submit']");
    if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
  });
}

function deselectActiveDocumentTab() {
  document.querySelectorAll("#documentos .doc-tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll("#documentos .doc-view").forEach((view) => view.classList.remove("active"));
  cancelActiveDocumentEditing();
  renderDocumentRecords();
  updateDocumentFilterClearButton();
}

document.querySelectorAll("#documentos .doc-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#documentos .doc-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll("#documentos .doc-view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`doc-${button.dataset.doc}`)?.classList.add("active");

    if (button.dataset.doc) {
      renderDocumentRecords();
      updateDocumentFilterClearButton();
    }

    cancelActiveDocumentEditing();
  });
});

document.querySelectorAll("[data-doc-form]").forEach((formElement) => {
  normalizeDocumentDateInputs(formElement);

  formElement.addEventListener("input", (event) => {
    if (event.target.name === "cpf") {
      event.target.value = formatCpf(event.target.value);
    }
    if (event.target.name === "rg") {
      event.target.value = formatRg(event.target.value);
    }
    if (["telefone", "celular"].includes(event.target.name)) {
      event.target.value = formatPhone(event.target.value);
    }
    if (["salario", "salario_atual", "salario_proposto", "faixa_salarial"].includes(event.target.name)) {
      event.target.value = formatCurrencyBR(event.target.value);
    }
    if (event.target.name === "data_ausencia") {
      event.target.value = formatAbsencePeriod(event.target.value);
    }
    if (event.target.dataset.dateMask === "true" || event.target.dataset.docDate === "true") {
      const pos = event.target.selectionStart;
      const prev = event.target.value;
      const next = formatMaskedDate(prev);
      event.target.value = next;
      const diff = next.length - prev.length;
      if (diff !== 0) event.target.setSelectionRange(pos + diff, pos + diff);
    }
    if (["horario_trabalho", "horario_atraso"].includes(event.target.name)) {
      event.target.value = formatTimeRange(event.target.value);
    }
  });

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    normalizeDocumentDateInputs(event.currentTarget);
    const form = new FormData(event.currentTarget);
    const entries = [...form.entries()].filter(([, value]) => String(value || "").trim());
    const collaborator = form.get("colaborador") || form.get("cargo") || "Registro sem colaborador";
    const details = entries
      .filter(([key]) => key !== "colaborador")
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    let success;

    if (window.editingDocId) {
      success = await updateItem("documentos", window.editingDocId, {
        summary: String(collaborator),
        details: details || "Registro salvo",
        formData: Object.fromEntries(entries),
        updatedBy: getCurrentUserName(),
      });
      if (success) {
        window.editingDocId = null;
        const btn = event.currentTarget.querySelector("button[type='submit']");
        if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
      }
    } else {
      success = await addItem("documentos", {
        type: event.currentTarget.dataset.docForm,
        summary: String(collaborator),
        details: details || "Registro salvo",
        formData: Object.fromEntries(entries),
        createdBy: getCurrentUserName(),
      });
    }

    if (success) event.currentTarget.reset();
  });
});

document.getElementById("document-filter-name")?.addEventListener("input", () => {
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});
document.getElementById("document-filter-cpf")?.addEventListener("input", (event) => {
  const field = event.currentTarget;
  field.value = String(field.value || "").replace(/\D/g, "").slice(0, 11);
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});
document.getElementById("clear-document-filters")?.addEventListener("click", () => {
  ["document-filter-name", "document-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});

HubModules.register({
  ...documentosRHRepository,
  view: "documentos",
  render: renderDocumentRecords,
  onEscape: () => {
    if (document.getElementById("documentos")?.classList.contains("active") && getActiveDocumentTab()) {
      deselectActiveDocumentTab();
    }
  },
  actions: {
    "editar-documento": (id) => editarDocumento(id),
    "excluir-documento": (id) => excluirDocumento(id),
    "baixar-documento-rh": (id) => baixarDocumentoRH(id),
  },
});
