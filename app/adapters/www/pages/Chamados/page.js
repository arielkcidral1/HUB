// Pagina (area administrativa): filtros, listagem, reabertura, arquivamento e exclusao de chamados de EPI.
// Sem repositorio proprio: mapRow/toPayload/TABELA de "chamados", o formulario de abertura e os
// helpers de colaborador/EPI continuam em script.js porque tambem sao usados pela pagina publica
// de chamados (chamados.html), que nao carrega os modulos do HubModules.

let showArchivedChamados = false;

function formatChamadoFilterCode(value = "") {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 5);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

function getChamadoSearchCode(item = {}) {
  return String(item.codigoSolicitacao || item.id || "").toLowerCase();
}

function getChamadoCollaboratorSearchText(item = {}) {
  const collaboratorGroups = Array.isArray(item.colaboradores) ? item.colaboradores : [];
  const groupNames = collaboratorGroups.map((group) => group.colaborador || "").join(" ");
  return [groupNames, item.epis || "", item.solicitante || ""].join(" ").toLowerCase();
}

function getChamadoCreatedMonth(item = {}) {
  const value = String(item.createdAt || "");
  const numericMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (numericMatch) return VT_MONTH_NAMES[Number(numericMatch[2]) - 1] || "";
  return VT_MONTH_NAMES.find((month) => value.toLowerCase().includes(month.toLowerCase())) || "";
}

function getChamadosFilterValues() {
  return {
    destino: String(document.getElementById("chamado-filter-destino")?.value || "").trim(),
    colaborador: String(document.getElementById("chamado-filter-colaborador")?.value || "").trim().toLowerCase(),
    codigo: String(document.getElementById("chamado-filter-codigo")?.value || "").trim().toLowerCase(),
    mes: document.getElementById("chamado-filter-mes")?.value || "",
  };
}

function filterChamadosByCurrentFilters(items = []) {
  const filters = getChamadosFilterValues();
  return items.filter((item) => {
    if (filters.destino && String(item.unidade || "") !== filters.destino) return false;
    if (filters.colaborador && !getChamadoCollaboratorSearchText(item).includes(filters.colaborador)) return false;
    if (filters.codigo && !getChamadoSearchCode(item).includes(filters.codigo)) return false;
    if (filters.mes && getChamadoCreatedMonth(item) !== filters.mes) return false;
    return true;
  });
}

function updateChamadosFilterClearButton() {
  const clearButton = document.getElementById("limpar-filtros-chamados");
  if (!clearButton) return;
  const filters = getChamadosFilterValues();
  clearButton.hidden = !Boolean(filters.destino || filters.colaborador || filters.codigo || filters.mes);
}

function renderChamadosSection() {
  const chamadosAbertos = filterChamadosByCurrentFilters((data.chamados || []).filter((item) => item.status !== "Arquivado"));
  const chamadosArquivados = filterChamadosByCurrentFilters((data.chamados || []).filter((item) => item.status === "Arquivado"));
  const hasChamadosArquivados = (data.chamados || []).some((item) => item.status === "Arquivado");
  if (!hasChamadosArquivados && showArchivedChamados) showArchivedChamados = false;
  const primaryChamadosTitle = document.getElementById("chamados-primary-title");
  const toggleArchivedChamadosButton = document.getElementById("toggle-archived-chamados");
  updateChamadosFilterClearButton();

  if (primaryChamadosTitle) primaryChamadosTitle.textContent = showArchivedChamados ? "Arquivados" : "Abertos";
  if (toggleArchivedChamadosButton) {
    toggleArchivedChamadosButton.textContent = showArchivedChamados ? "Ocultar arquivados" : "Mostrar arquivados";
    toggleArchivedChamadosButton.disabled = false;
    toggleArchivedChamadosButton.hidden = !hasChamadosArquivados;
  }
  const excluirArquivadosChamadosButton = document.getElementById("excluir-arquivados-chamados");
  if (excluirArquivadosChamadosButton) excluirArquivadosChamadosButton.hidden = !showArchivedChamados;

  const chamadoCard = (item, archived = false) => `
    <article class="item-card"
             data-record-context="chamado"
             data-id="${escapeHtml(item.id)}">
      <div class="item-topline">
        <p class="item-title">
          ${escapeHtml(item.unidade)}
        </p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p><strong>Solicitante:</strong> ${escapeHtml(item.solicitante)}</p>
      ${item.setor ? `<p><strong>Setor:</strong> ${escapeHtml(item.setor)}</p>` : ""}
      <p><strong>Código da Solicitação:</strong> ${escapeHtml(item.codigoSolicitacao || item.id || "Nao informado")}</p>
      <p><strong>EPIs:</strong> ${escapeHtml(item.epis)}</p>
      ${item.observacoes ? `<p><strong>Observacoes:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
      ${archived ? `<div class="job-actions section-top"><button class="secondary-link" type="button" data-action="reabrir-chamado" data-id="${escapeHtml(item.id)}">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedChamados) {
    const primaryTarget = document.getElementById("chamados-list");
    if (!chamadosArquivados.length && primaryTarget) {
      primaryTarget.innerHTML = '<p class="empty-state">Sem chamados arquivados</p>';
    } else {
      renderCards("chamados-list", chamadosArquivados, (item) => chamadoCard(item, true));
    }
  } else {
    renderCards("chamados-list", chamadosAbertos, (item) => chamadoCard(item, false));
  }
}

function reabrirChamado(id) {
  showConfirmActionModal({
    title: "Reabrir chamado",
    text: "Deseja mover este chamado de volta para a lista de chamados abertos?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await updateItem("chamados", id, { status: "Aberto" });
      if (success) showModal("Chamado reaberto", "O chamado voltou para a lista de abertos.", "info");
    },
  });
}

async function arquivarChamadoPorContexto(id) {
  if (!id) return;
  const chamado = data.chamados.find((item) => String(item.id) === String(id));
  if (!chamado) return;
  chamado.status = "Arquivado";
  saveLocalData();
  renderAll();
  syncRecordStatusSilently("chamados", id, "Arquivado");
  showModal("Chamado arquivado", "O chamado foi movido para Arquivados.", "info");
}

function excluirChamadosArquivados() {
  excluirRegistrosArquivadosPermanentemente("chamados", TABLES.chamados, "chamados");
}

document.getElementById("chamado-filter-destino")?.addEventListener("change", renderChamadosSection);
document.getElementById("chamado-filter-colaborador")?.addEventListener("input", renderChamadosSection);
document.getElementById("chamado-filter-codigo")?.addEventListener("input", (event) => {
  event.currentTarget.value = formatChamadoFilterCode(event.currentTarget.value);
  renderChamadosSection();
});
document.getElementById("chamado-filter-mes")?.addEventListener("change", renderChamadosSection);
document.getElementById("limpar-filtros-chamados")?.addEventListener("click", () => {
  ["chamado-filter-destino", "chamado-filter-colaborador", "chamado-filter-codigo", "chamado-filter-mes"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderChamadosSection();
});

document.getElementById("toggle-archived-chamados")?.addEventListener("click", () => {
  showArchivedChamados = !showArchivedChamados;
  renderAll();
});

document.getElementById("excluir-arquivados-chamados")?.addEventListener("click", () => {
  excluirChamadosArquivados();
});
