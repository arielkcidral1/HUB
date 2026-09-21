// Pagina: DOM, filtros, abas, formulario e registro do modulo no nucleo (HubModules).

function getActiveDisciplinaryTab() {
  return document.querySelector("[data-disciplinary-doc].active")?.dataset.disciplinaryDoc || "";
}

function getFilteredDisciplinaryRecords() {
  const tipoFilter = getActiveDisciplinaryTab();
  const nameFilter = String(document.getElementById("disciplinary-filter-name")?.value || "").trim().toLowerCase();
  const observationsFilter = String(document.getElementById("disciplinary-filter-observations")?.value || "").trim().toLowerCase();
  const monthFilter = document.getElementById("disciplinary-filter-date")?.value || "";
  const unitFilter = document.getElementById("disciplinary-filter-unit")?.value || "";

  return (data.disciplinaryRecords || []).filter((item) => {
    if (String(item.tipo || "advertencia").toLowerCase() !== tipoFilter) return false;
    if (nameFilter && !String(item.colaborador || "").toLowerCase().includes(nameFilter)) return false;
    if (observationsFilter && !String(item.motivo || "").toLowerCase().includes(observationsFilter)) return false;
    if (monthFilter && String(item.dataMedida || "").slice(5, 7) !== monthFilter) return false;
    if (unitFilter && item.unidade !== unitFilter) return false;
    return true;
  });
}

function updateDisciplinaryFilterClearButton() {
  const clearButton = document.getElementById("clear-disciplinary-filters");
  if (!clearButton) return;
  clearButton.hidden = !Boolean(
    String(document.getElementById("disciplinary-filter-name")?.value || "").trim()
    || String(document.getElementById("disciplinary-filter-observations")?.value || "").trim()
    || document.getElementById("disciplinary-filter-date")?.value
    || document.getElementById("disciplinary-filter-unit")?.value
  );
}

function renderDisciplinaryRecords() {
  updateDisciplinaryFilterClearButton();
  const records = getFilteredDisciplinaryRecords();
  const emptyState = document.getElementById("disciplinary-empty-state");
  const registrosPanel = document.getElementById("disciplinary-registros-panel");
  const hasActiveTab = Boolean(getActiveDisciplinaryTab());
  if (emptyState) emptyState.hidden = hasActiveTab;

  if (registrosPanel) registrosPanel.hidden = !hasActiveTab || !records.length;

  renderCards("disciplinary-records", records, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.colaborador || "Funcionario nao informado")}</p>
        <span class="tag">${escapeHtml(getDisciplinaryTypeLabel(item.tipo))}</span>
      </div>
      <p><strong>Unidade:</strong> ${escapeHtml(item.unidade || "Nao informada")}</p>
      <p><strong>Data:</strong> ${escapeHtml(formatEventDate(item.dataMedida || ""))}</p>
      <p><strong>Local:</strong> ${escapeHtml(item.local || "Nao informado")}</p>
      ${String(item.tipo || "").toLowerCase() === "suspensao" ? `<p><strong>Dias de suspensao:</strong> ${escapeHtml(item.diasSuspensao || "Nao informado")}</p>` : ""}
      <p><strong>Motivo:</strong> ${escapeHtml(item.motivo || "Nao informado")}</p>
      <p class="item-meta">${escapeHtml(item.createdAt || "")} | Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}</p>
      <div class="job-actions">
        <button class="secondary-link" type="button" data-action="gerar-documento-disciplinary" data-id="${escapeHtml(item.id)}">Gerar documento</button>
        ${item.arquivoUrl ? `<button type="button" class="secondary-link private-file-button" data-private-storage-bucket="hub-medidas-disciplinares" data-private-storage-path="${escapeHtml(item.arquivoUrl)}" data-private-storage-name="${escapeHtml(item.arquivoNome || "anexo")}">Ver anexo</button>` : ""}
        <button class="secondary-link" type="button" data-action="editar-disciplinary" data-id="${escapeHtml(item.id)}">Editar</button>
        <button class="danger-button" type="button" data-action="excluir-disciplinary" data-id="${escapeHtml(item.id)}">Deletar</button>
      </div>
    </article>
  `);
}

function showDisciplinaryReportMenu() {
  document.getElementById("custom-modal")?.remove();
  const filteredCount = getFilteredDisciplinaryRecords().length;
  const totalCount = (data.disciplinaryRecords || []).length;
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card vt-report-modal">
      <div class="modal-header info">Relatorio disciplinar</div>
      <div class="modal-body">
        <p>Escolha quais registros deseja exportar em .xlsx.</p>
        <div class="vt-report-options">
          <button class="report-chip" type="button" data-action="gerar-relatorio-disciplinary" data-scope="filtered"><span>Registros filtrados</span><small>${escapeHtml(String(filteredCount))} registro(s)</small></button>
          <button class="report-chip" type="button" data-action="gerar-relatorio-disciplinary" data-scope="all"><span>Todos os registros</span><small>${escapeHtml(String(totalCount))} registro(s) cadastrados</small></button>
        </div>
      </div>
      <div class="modal-footer"><button class="secondary-link" type="button" data-action="close-modal">Cancelar</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function deselectActiveDisciplinaryTab() {
  document.querySelectorAll("[data-disciplinary-doc]").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".disciplinary-view").forEach((view) => view.classList.remove("active"));
  renderDisciplinaryRecords();
}

function activateDisciplinaryTab(type) {
  document.querySelectorAll("[data-disciplinary-doc]").forEach((tab) => tab.classList.toggle("active", tab.dataset.disciplinaryDoc === type));
  document.querySelectorAll(".disciplinary-view").forEach((view) => {
    view.classList.toggle("active", view.id === `disciplinary-${type}`);
  });
  renderDisciplinaryRecords();
}

document.querySelectorAll("[data-disciplinary-doc]").forEach((button) => {
  button.addEventListener("click", () => activateDisciplinaryTab(button.dataset.disciplinaryDoc));
});

function updateDisciplinaryFileLabel(input, overrideName) {
  const field = input?.closest("[data-disciplinary-anexo-field]");
  const label = field?.querySelector(".disciplinary-file-name");
  if (!label) return;
  const file = input.files?.[0];
  label.textContent = file?.name || overrideName || label.dataset.emptyLabel || "Nenhum arquivo escolhido";
}

document.querySelectorAll("[data-disciplinary-form]").forEach((formElement) => {
  const unitField = formElement.elements.unidade;
  const localField = formElement.elements.local;
  unitField?.addEventListener("change", () => {
    const city = getUnitCity(unitField.value);

    if (localField) localField.value = city;
  });

  formElement.querySelectorAll(".disciplinary-file-input").forEach((input) => {
    input.addEventListener("change", () => updateDisciplinaryFileLabel(input));
  });

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(formElement);
    const tipo = formElement.dataset.disciplinaryForm || "advertencia";
    const diasSuspensao = String(form.get("dias_suspensao") || "").trim();
    if (tipo === "suspensao" && (!diasSuspensao || Number(diasSuspensao) < 1)) {
      showModal("Dias obrigatorios", "Informe a quantidade de dias de suspensao.", "error");
      return;
    }
    const file = form.get("anexo");
    const fileError = validateDisciplinaryAttachment(file);
    if (fileError) {
      showModal("Anexo invalido", fileError, "error");
      return;
    }
    let anexo = null;
    if (file && file.name) {
      try {
        anexo = await uploadDisciplinaryAttachment(file);
      } catch (error) {
        showModal("Erro no anexo", error?.message || "Nao foi possivel enviar o anexo.", "error");
        return;
      }
    }
    const id = String(form.get("id") || "").trim();
    if (id && !anexo) {
      const existing = (data.disciplinaryRecords || []).find((item) => String(item.id) === id);
      if (existing?.arquivoUrl) {
        anexo = { name: existing.arquivoNome || "", size: existing.arquivoTamanho || 0, type: existing.arquivoTipo || "", url: existing.arquivoUrl };
      }
    }
    const values = {
      tipo,
      colaborador: String(form.get("colaborador") || "").trim(),
      dataMedida: String(form.get("data_medida") || ""),
      unidade: String(form.get("unidade") || ""),
      local: String(form.get("local") || "").trim(),
      motivo: String(form.get("motivo") || "").trim(),
      diasSuspensao: tipo === "suspensao" ? diasSuspensao : "",
      anexo,
    };
    const success = id
      ? await updateItem("disciplinaryRecords", id, { ...values, updatedBy: getCurrentUserName() })
      : await addItem("disciplinaryRecords", { ...values, createdBy: getCurrentUserName() });
    if (success) {
      resetDisciplinaryForm(formElement);
      if (typeof populateUnitSelects === "function") populateUnitSelects();
      showModal(id ? "Registro atualizado" : "Registro salvo", `${getDisciplinaryTypeLabel(tipo)} ${id ? "atualizada" : "salva"} com sucesso.`, "info");
    }
  });

  formElement.querySelector("[data-disciplinary-cancel-edit]")?.addEventListener("click", () => resetDisciplinaryForm(formElement));
});

document.getElementById("disciplinary-filter-name")?.addEventListener("input", renderDisciplinaryRecords);

document.getElementById("disciplinary-filter-observations")?.addEventListener("input", renderDisciplinaryRecords);

document.getElementById("disciplinary-filter-date")?.addEventListener("change", renderDisciplinaryRecords);

document.getElementById("disciplinary-filter-unit")?.addEventListener("change", renderDisciplinaryRecords);

document.getElementById("abrir-relatorio-disciplinary")?.addEventListener("click", showDisciplinaryReportMenu);

document.getElementById("clear-disciplinary-filters")?.addEventListener("click", () => {
  const nameFilter = document.getElementById("disciplinary-filter-name");
  const observationsFilter = document.getElementById("disciplinary-filter-observations");
  const dateFilter = document.getElementById("disciplinary-filter-date");
  const unitFilter = document.getElementById("disciplinary-filter-unit");
  if (nameFilter) nameFilter.value = "";
  if (observationsFilter) observationsFilter.value = "";
  if (dateFilter) dateFilter.value = "";
  if (unitFilter) unitFilter.value = "";
  renderDisciplinaryRecords();
});

function resetDisciplinaryForm(formElement) {
  if (!formElement) return;
  const tipo = formElement.dataset.disciplinaryForm;
  formElement.reset();
  if (formElement.elements.id) formElement.elements.id.value = "";
  formElement.querySelector("[data-disciplinary-cancel-edit]")?.setAttribute("hidden", "");
  formElement.querySelector("[data-disciplinary-anexo-field]")?.setAttribute("hidden", "");
  const anexoInput = formElement.querySelector(".disciplinary-file-input");
  if (anexoInput) updateDisciplinaryFileLabel(anexoInput);
  const submitButton = formElement.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = tipo === "suspensao" ? "Salvar suspensao" : "Salvar advertencia";
}

function editarDisciplinaryRecord(id) {
  const registro = (data.disciplinaryRecords || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showPasswordActionModal({
    title: "Editar registro",
    text: `Informe a senha para editar a medida de "${registro.colaborador || "funcionario nao informado"}".`,
    confirmText: "Editar",
    validatePassword: async (password) => password.trim() === "1001",
    onConfirm: () => {
      const tipo = String(registro.tipo || "").toLowerCase() === "suspensao" ? "suspensao" : "advertencia";
      activateDisciplinaryTab(tipo);
      const formElement = document.querySelector(`[data-disciplinary-form="${tipo}"]`);
      if (!formElement) return;
      formElement.elements.id.value = registro.id;
      formElement.elements.colaborador.value = registro.colaborador || "";
      formElement.elements.data_medida.value = registro.dataMedida || "";
      setFieldValue(formElement.elements.unidade, registro.unidade || "");
      formElement.elements.local.value = registro.local || "";
      formElement.elements.motivo.value = registro.motivo || "";
      if (tipo === "suspensao" && formElement.elements.dias_suspensao) {
        formElement.elements.dias_suspensao.value = registro.diasSuspensao || "";
      }
      formElement.querySelector("[data-disciplinary-cancel-edit]")?.removeAttribute("hidden");
      formElement.querySelector("[data-disciplinary-anexo-field]")?.removeAttribute("hidden");
      const anexoInput = formElement.querySelector(".disciplinary-file-input");
      if (anexoInput) {
        anexoInput.value = "";
        updateDisciplinaryFileLabel(anexoInput, registro.arquivoNome);
      }
      const submitButton = formElement.querySelector('button[type="submit"]');
      if (submitButton) submitButton.textContent = "Salvar alteracoes";
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });
}

HubModules.register({
  ...disciplinaryRepository,
  view: "advertencias-suspensoes",
  silent: true,
  render: renderDisciplinaryRecords,
  onEscape: () => {
    if (document.getElementById("advertencias-suspensoes")?.classList.contains("active") && getActiveDisciplinaryTab()) {
      deselectActiveDisciplinaryTab();
    }
  },
  actions: {
    "editar-disciplinary": (id) => editarDisciplinaryRecord(id),
    "excluir-disciplinary": (id) => excluirDisciplinaryRecord(id),
    "gerar-documento-disciplinary": (id) => gerarDocumentoDisciplinary(id),
    "gerar-relatorio-disciplinary": (id, target) => gerarRelatorioDisciplinary(target.dataset.scope),
  },
});
