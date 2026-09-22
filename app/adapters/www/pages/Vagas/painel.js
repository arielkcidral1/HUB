// Pagina (area administrativa): cadastro de vagas, filtros e curriculos recebidos.
// Sem repositorio proprio: mapRow/toPayload/TABELA de "vagas"/"candidaturas" continuam em
// script.js porque tambem sao usados pelo portal publico de vagas (vagas.html/candidatura.html),
// que nao carrega os modulos do HubModules.

function getVagasFilterValues() {
  const unidade = String(document.getElementById("vaga-filter-unidade")?.value || "").trim();
  return {
    unidade: normalizeUnitText(unidade) === normalizeUnitText("Unidade") ? "" : unidade,
    cargo: String(document.getElementById("vaga-filter-cargo")?.value || "").trim(),
    nome: String(document.getElementById("vaga-filter-nome")?.value || "").trim().toLowerCase(),
    cpf: String(document.getElementById("vaga-filter-cpf")?.value || "").replace(/\D/g, ""),
    comCurriculo: Boolean(document.getElementById("vaga-filter-curriculo")?.checked),
  };
}

function populateVagaCargoFilterOptions() {
  const select = document.getElementById("vaga-filter-cargo");
  if (!select) return;
  const currentValue = select.value;
  const cargos = [...new Set((data.vagas || []).map((item) => String(item.cargo || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  select.innerHTML = `<option value="">Cargo</option>` + cargos
    .map((cargo) => `<option value="${escapeHtml(cargo)}">${escapeHtml(cargo)}</option>`)
    .join("");
  if (currentValue && cargos.includes(currentValue)) select.value = currentValue;
}

function vagaTemCandidaturas(vagaId) {
  return (data.candidaturas || []).some((c) => String(c.vaga_id || c.vagaId) === String(vagaId));
}

function getVagaCandidaturas(vagaId, filters = null) {
  const all = (data.candidaturas || []).filter((c) => String(c.vaga_id || c.vagaId) === String(vagaId));
  const activeFilters = filters || getVagasFilterValues();
  if (!activeFilters.nome && !activeFilters.cpf) return all;
  return all.filter((c) => {
    if (activeFilters.nome && !String(c.nome || "").toLowerCase().includes(activeFilters.nome)) return false;
    if (activeFilters.cpf && !normalizeCpf(c.cpf || "").includes(activeFilters.cpf)) return false;
    return true;
  });
}

function filterVagasByCurrentFilters(items = []) {
  const filters = getVagasFilterValues();
  return items.filter((item) => {
    if (filters.unidade && getCanonicalUnit(item.unidade) !== filters.unidade) return false;
    if (filters.cargo && String(item.cargo || "").trim() !== filters.cargo) return false;
    if ((filters.nome || filters.cpf) && !getVagaCandidaturas(item.id, filters).length) return false;
    if (filters.comCurriculo && !vagaTemCandidaturas(item.id)) return false;
    return true;
  });
}

function updateVagasFilterClearButton() {
  const clearButton = document.getElementById("limpar-filtros-vagas");
  if (!clearButton) return;
  const filters = getVagasFilterValues();
  clearButton.hidden = !Boolean(filters.unidade || filters.cargo || filters.nome || filters.cpf || filters.comCurriculo);
}

function clearVagasFilters() {
  ["vaga-filter-unidade", "vaga-filter-cargo", "vaga-filter-nome", "vaga-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  const curriculoCheckbox = document.getElementById("vaga-filter-curriculo");
  if (curriculoCheckbox) curriculoCheckbox.checked = false;
  updateVagasFilterClearButton();
  renderAll();
}

function renderVagasSection() {
  populateVagaCargoFilterOptions();
  updateVagasFilterClearButton();
  const vagasFilters = getVagasFilterValues();
  renderCards("vagas-list", filterVagasByCurrentFilters(data.vagas), (item) => {
    const candidaturas = getVagaCandidaturas(item.id, vagasFilters);
    const totalCandidaturas = (data.candidaturas || []).filter(c => String(c.vaga_id || c.vagaId) === String(item.id)).length;
    let candidaturasHtml = `<p class="empty-candidates">Nenhum curriculo recebido.</p>`;
    if (totalCandidaturas > 0 && !candidaturas.length) {
      candidaturasHtml = `<p class="empty-candidates">Nenhum candidato encontrado para o filtro aplicado.</p>`;
    }

    if (candidaturas.length > 0) {
      candidaturasHtml = candidaturas.map(c => `
        <div class="candidate-row" data-candidatura-context="curriculo" data-id="${escapeHtml(c.id)}" title="Clique com o botao direito para excluir o curriculo">
          <p>
            <strong>${escapeHtml(c.nome)}</strong>
            <span class="candidate-meta-line">
              <span class="meta-line">CPF: ${escapeHtml(formatCpf(c.cpf))}</span><br />
              <span class="meta-line">Telefone: ${escapeHtml(formatPhone(c.telefone) || "Nao informado")}</span><br />
              <span class="meta-line">Recebido em: ${escapeHtml(c.createdAt || "Nao informado")}</span>
          </p>
          <button type="button" class="secondary-link private-file-button" data-private-storage-bucket="hub-curriculos" data-private-storage-path="${escapeHtml(c.curriculo_url)}">Ver Curriculo</button>
        </div>
      `).join("");
    }

    return `
      <article class="item-card public-job-card">
        <div class="item-topline"><p class="item-title">${escapeHtml(item.cargo)}</p><span class="tag">${escapeHtml(item.status)}</span></div>
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(item.unidade) || "Nao informada.")}</p>
        <p>${escapeHtml(item.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(item.requisitos || "Nao informado.")}</p>
        <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}</p>
        <div class="job-actions">
          <button class="secondary-link" type="button" data-action="editar-vaga" data-id="${escapeHtml(item.id)}">Editar</button>
          <button class="danger-button" type="button" data-action="excluir-vaga" data-id="${escapeHtml(item.id)}">Deletar</button>
        </div>
        <div class="candidate-list"><p class="candidate-list-title">Curriculos Recebidos (${candidaturas.length}${candidaturas.length !== totalCandidaturas ? ` de ${totalCandidaturas}` : ""})</p>${candidaturasHtml}</div>
      </article>
    `;
  });
}

function openCandidaturaContextMenu(event, id) {
  document.getElementById("candidatura-context-menu")?.remove();
  const item = (data.candidaturas || []).find((c) => String(c.id) === String(id));
  if (!item) return;

  const menu = document.createElement("div");
  menu.id = "candidatura-context-menu";
  menu.className = "board-context-menu record-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.innerHTML = `<button type="button" class="danger" data-candidatura-menu-action="delete">Excluir currículo</button>`;
  menu.addEventListener("click", (clickEvent) => {
    const actionButton = clickEvent.target.closest("[data-candidatura-menu-action]");
    if (actionButton?.dataset.candidaturaMenuAction !== "delete") return;
    menu.remove();
    excluirCandidatura(id);
  });
  document.body.appendChild(menu);
}

function excluirCandidatura(id) {
  const item = (data.candidaturas || []).find((c) => String(c.id) === String(id));
  if (!item) return;
  showPasswordActionModal({
    title: "Excluir currículo",
    text: `Confirme a senha de autorizacao para excluir o curriculo de "${item.nome || "candidato nao informado"}".`,
    confirmText: "Excluir",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteItem("candidaturas", id);
    },
  });
}

function editarVaga(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("vaga-form");
  if (!vaga || !form) return;

  form.elements.id.value = vaga.id;
  form.elements.cargo.value = vaga.cargo || "";
  setFieldValue(form.elements.unidade, getCanonicalUnit(vaga.unidade) || "");
  form.elements.descricao.value = vaga.descricao || "";
  form.elements.requisitos.value = vaga.requisitos || "";
  form.elements.status.value = vaga.status || "Aberta";
  document.getElementById("cancelar-edicao-vaga")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

async function excluirVaga(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  if (!vaga) return;
  showPasswordActionModal({
    title: "Deletar vaga",
    text: `Confirme a senha de autorizacao para deletar a vaga "${vaga.cargo}".`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteItem("vagas", id);
    },
  });
};

function setupVagasFormScrollGrid() {
  setupFormScrollGrid({
    listId: "vagas-list",
    formId: "vaga-form",
    expandedWorkspaceClass: "vagas-workspace-expanded",
    expandedListClass: "vagas-two-col",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupVagasFormScrollGrid();
});

document.getElementById("vaga-filter-unidade")?.addEventListener("change", renderAll);
document.getElementById("vaga-filter-cargo")?.addEventListener("change", renderAll);
document.getElementById("vaga-filter-nome")?.addEventListener("input", renderAll);
document.getElementById("vaga-filter-cpf")?.addEventListener("input", (event) => {
  event.currentTarget.value = formatCpf(event.currentTarget.value);
  renderAll();
});
document.getElementById("vaga-filter-curriculo")?.addEventListener("change", renderAll);
document.getElementById("limpar-filtros-vagas")?.addEventListener("click", () => {
  clearVagasFilters();
  renderAll();
});

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const payload = {
      cargo: form.get("cargo"),
      unidade: form.get("unidade"),
      descricao: form.get("descricao"),
      requisitos: form.get("requisitos"),
      status: form.get("status"),
    };
    const success = id ? await updateItem("vagas", id, payload) : await addItem("vagas", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      document.getElementById("cancelar-edicao-vaga")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar vaga";
    }
  });
}

document.getElementById("cancelar-edicao-vaga")?.addEventListener("click", () => {
  vagaForm.reset();
  vagaForm.elements.id.value = "";
  document.getElementById("cancelar-edicao-vaga").setAttribute("hidden", "");
  vagaForm.querySelector('button[type="submit"]').textContent = "Salvar vaga";
});
