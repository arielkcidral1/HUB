// Pagina (area administrativa): listagem, filtros e exclusao de documentos de contratados.
// Sem repositorio proprio: mapRow/toPayload/TABELA de "documentosContratados" e os helpers de
// upload/pendencia local continuam em script.js porque tambem sao usados pelas paginas publicas
// de documentos (documentos-fredy/besten/achei/trinca.html), que nao carregam os modulos do HubModules.

function getContractorSourceLabel(origemHtml = "", empresa = "") {
  const source = inferContractorDocumentSource(origemHtml, empresa).toLowerCase();
  if (source.includes("fredy")) return "Fredy";
  if (source.includes("besten")) return "Besten";
  if (source.includes("achei")) return "Achei";
  if (source.includes("trinca")) return "Trinca";
  const normalizedCompany = String(empresa || "").trim().split(/\s+/)[0];
  return normalizedCompany || "";
}

function formatContractorDocumentList(documentos = []) {
  if (!documentos.length) return '<p class="empty-state">Nenhum arquivo vinculado.</p>';
  return documentos.map((doc, index) => {
    const name = escapeHtml(doc.name || `Documento ${index + 1}`);
    if (doc.dataUrl) {
      return `
        <button
          class="secondary-link contractor-file-button"
          type="button"
          data-download-url="${escapeHtml(doc.dataUrl)}"
          data-download-name="${name}"
        >
          ${name}
        </button>
      `;
    }
    return `
      <button
        class="secondary-link private-file-button contractor-file-button"
        type="button"
        data-private-storage-bucket="${CONTRACTOR_DOCUMENTS_BUCKET}"
        data-private-storage-path="${escapeHtml(doc.path || "")}"
        data-private-storage-name="${name}"
      >
        ${name}
      </button>
    `;
  }).join("");
}

function getContratadoFilterValues() {
  return {
    nome: String(document.getElementById("contratado-filter-nome")?.value || "").trim().toLowerCase(),
    telefone: String(document.getElementById("contratado-filter-telefone")?.value || "").replace(/\D/g, ""),
    cpf: String(document.getElementById("contratado-filter-cpf")?.value || "").replace(/\D/g, ""),
  };
}

function updateContratadoFilterClearButton() {
  const clearButton = document.getElementById("clear-contratado-filters");
  if (!clearButton) return;
  const filters = getContratadoFilterValues();
  clearButton.hidden = !Boolean(filters.nome || filters.telefone || filters.cpf);
}

function filterContratadoRecords(items = []) {
  const filters = getContratadoFilterValues();
  return items.filter((item) => {
    if (filters.nome && !String(item.nome || "").toLowerCase().includes(filters.nome)) return false;
    if (filters.telefone && !String(item.telefone || "").replace(/\D/g, "").includes(filters.telefone)) return false;
    if (filters.cpf && !String(item.cpf || "").replace(/\D/g, "").includes(filters.cpf)) return false;
    return true;
  });
}

function renderDocumentosContratados() {
  const syncedItems = (data.documentosContratados || []).filter((item) => !String(item.id || "").startsWith("local-") && !item.pendingSync);
  const filteredItems = filterContratadoRecords(syncedItems);
  updateContratadoFilterClearButton();
  renderCards("documentos-contratados-list", filteredItems, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.nome || "Contratado não informado")}</p>
        <span class="tag">${escapeHtml(item.empresa || "Empresa não informada")}</span>
        ${item.pendingSync ? '<span class="tag alert">Pendente</span>' : ""}
      </div>
      <p><strong>CPF:</strong> ${escapeHtml(formatCpf(item.cpf || ""))}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(formatPhone(item.telefone || "") || "Não informado")}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(item.email || "Não informado")}</p>
      <p><strong>Origem:</strong> ${escapeHtml(getContractorSourceLabel(item.origemHtml, item.empresa) || "Não informada")}</p>
      <p class="item-meta">${escapeHtml(item.createdAt || todayLabel())}</p>
      <div class="contractor-file-list">
        ${formatContractorDocumentList(item.documentos || [])}
      </div>
      <div class="job-actions section-top">
        <button class="danger-button" type="button" data-action="excluir-documento-contratado" data-id="${escapeHtml(item.id)}">Excluir</button>
      </div>
    </article>
  `);
}

async function excluirDocumentoContratado(id) {
  const registro = (data.documentosContratados || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showPasswordActionModal({
    title: "Excluir documentos do contratado",
    text: `Confirme a senha de exclusao para apagar os documentos de "${registro.nome || "contratado não informado"}".`,
    confirmText: "Excluir",
    danger: true,
    validatePassword: async (password) => password.trim() === "1001",
    onConfirm: async () => {
      const isLocalRecord = String(id).startsWith("local-") || registro.pendingSync;
      if (isLocalRecord) {
        removePendingContractorDocument(id);
        data.documentosContratados = (data.documentosContratados || []).filter((item) => String(item.id) !== String(id));
        saveLocalData();
        renderDocumentosContratados();
        showModal("Documentos excluídos", "Os documentos do contratado foram removidos.", "info");
        return;
      }

      const deleted = await deleteItem("documentosContratados", id);
      if (deleted) {
        removePendingContractorDocument(id);
        showModal("Documentos excluídos", "Os documentos do contratado foram apagados com sucesso.", "info");
      }
    },
  });
}

document.getElementById("contratado-filter-nome")?.addEventListener("input", () => {
  renderDocumentosContratados();
});
document.getElementById("contratado-filter-telefone")?.addEventListener("input", (event) => {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/\D/g, "");
  renderDocumentosContratados();
});
document.getElementById("contratado-filter-cpf")?.addEventListener("input", (event) => {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/\D/g, "").slice(0, 11);
  renderDocumentosContratados();
});
document.getElementById("clear-contratado-filters")?.addEventListener("click", () => {
  ["contratado-filter-nome", "contratado-filter-telefone", "contratado-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderDocumentosContratados();
});
