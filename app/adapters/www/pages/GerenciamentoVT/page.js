// Pagina: DOM, filtros, formulario, calculo em tempo real e registro do modulo no nucleo (HubModules).

function updateVtCalculation() {
  const diasUteis = Number(document.getElementById("vt-dias-uteis")?.value || 0);
  const valorPassagem = parseBrazilianCurrency(document.getElementById("vt-valor-passagem")?.value || 0);
  const saldoAtual = Number(document.getElementById("vt-saldo-atual")?.value || 0);
  const total = calculateVtValue(diasUteis, valorPassagem, saldoAtual);
  const result = document.getElementById("vt-valor-necessario");
  const detail = document.getElementById("vt-calculo-detalhe");
  if (result) result.textContent = formatCurrencyBRL(total);
  if (detail) {
    detail.textContent = `${diasUteis || 0} dias - ${formatCurrencyBRL(valorPassagem)} - ${formatCurrencyBRL(saldoAtual)} = ${formatCurrencyBRL(total)}`;
  }
}

function getVtFormValues(formElement) {
  const form = new FormData(formElement);
  const diasUteis = Number(form.get("dias_uteis") || 0);
  const valorPassagem = parseBrazilianCurrency(form.get("valor_passagem") || 0);
  const saldoAtual = Number(form.get("saldo_atual") || 0);
  return {
    colaborador: String(form.get("colaborador") || "").trim(),
    unidade: String(form.get("unidade") || "").trim(),
    mes: String(form.get("mes") || "").trim(),
    diasUteis,
    valorPassagem,
    saldoAtual,
    valorNecessario: calculateVtValue(diasUteis, valorPassagem, saldoAtual),
  };
}

function getFilteredVtRegistros() {
  return filterVtRegistros(data.vtRegistros || [], {
    nameFilter: document.getElementById("vt-filter-nome")?.value || "",
    monthFilter: document.getElementById("vt-filter-mes")?.value || "",
    unitFilter: document.getElementById("vt-filter-unidade")?.value || "",
  });
}

function updateVtFilterClearButton() {
  const clearButton = document.getElementById("limpar-filtros-vt");
  if (!clearButton) return;
  const hasActiveFilter = Boolean(
    String(document.getElementById("vt-filter-nome")?.value || "").trim()
    || document.getElementById("vt-filter-mes")?.value
    || document.getElementById("vt-filter-unidade")?.value
  );
  clearButton.hidden = !hasActiveFilter;
}

function renderVtRegistros() {
  updateVtFilterClearButton();
  renderCards("vt-registros-list", getFilteredVtRegistros(), (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.colaborador || "Colaborador não informado")}</p>
        <span class="tag">${escapeHtml(formatCurrencyBRL(item.valorNecessario))}</span>
      </div>
      <p><strong>Unidade:</strong> ${escapeHtml(item.unidade || "Não informada")}</p>
      <p><strong>Màs:</strong> ${escapeHtml(formatVtMonth(item.mes))}</p>
      <p><strong>Dias úteis:</strong> ${escapeHtml(String(item.diasUteis || 0))}</p>
      <p><strong>Valor da passagem:</strong> ${escapeHtml(formatCurrencyBRL(item.valorPassagem))}</p>
      <p><strong>Saldo atual:</strong> ${escapeHtml(formatCurrencyBRL(item.saldoAtual))}</p>
      <p><strong>Valor registrado:</strong> ${escapeHtml(formatCurrencyBRL(item.valorNecessario))}</p>
      <p class="item-meta">${escapeHtml(item.createdAt || todayLabel())} | Registrado por ${escapeHtml(item.createdBy || getCurrentUserName())}</p>
      <div class="job-actions section-top">
        <button class="secondary-link" type="button" data-action="editar-vt" data-id="${escapeHtml(item.id)}">Editar</button>
        <button class="danger-button" type="button" data-action="excluir-vt" data-id="${escapeHtml(item.id)}">Apagar registro</button>
      </div>
    </article>
  `);
}

function getVtReportFilterLabel(useFilters = true) {
  if (!useFilters) return "Todos os registros";
  const parts = [];
  const nameFilter = String(document.getElementById("vt-filter-nome")?.value || "").trim();
  const monthFilter = document.getElementById("vt-filter-mes")?.value || "";
  const unitFilter = document.getElementById("vt-filter-unidade")?.value || "";
  if (nameFilter) parts.push(`Nome: ${nameFilter}`);
  if (monthFilter) parts.push(`Màs: ${monthFilter}`);
  if (unitFilter) parts.push(`Unidade: ${unitFilter}`);
  return parts.length ? parts.join(" | ") : "Sem filtros ativos";
}

function showVtReportMenu() {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();
  const filteredCount = getFilteredVtRegistros().length;
  const totalCount = (data.vtRegistros || []).length;
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card vt-report-modal">
      <div class="modal-header info">Relatório de VT</div>
      <div class="modal-body">
        <p>Escolha quais registros deseja exportar em .xlsx.</p>
        <div class="vt-report-options">
          <button class="report-chip" type="button" data-action="gerar-relatorio-vt" data-scope="filtered">
            <span>Registros filtrados</span>
            <small>${escapeHtml(String(filteredCount))} registro(s) - ${escapeHtml(getVtReportFilterLabel(true))}</small>
          </button>
          <button class="report-chip" type="button" data-action="gerar-relatorio-vt" data-scope="all">
            <span>Todos os registros</span>
            <small>${escapeHtml(String(totalCount))} registro(s) cadastrados</small>
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function resetVtForm() {
  const form = document.getElementById("vt-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  document.getElementById("cancelar-edicao-vt")?.setAttribute("hidden", "");
  form.querySelector('button[type="submit"]').textContent = "Registrar cálculo VT";
  updateVtCalculation();
}

function editarVtRegistro(id) {
  const registro = (data.vtRegistros || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("vt-form");
  if (!registro || !form) return;

  form.elements.id.value = registro.id;
  form.elements.colaborador.value = registro.colaborador || "";
  setFieldValue(form.elements.unidade, registro.unidade || "");
  setFieldValue(form.elements.mes, formatVtMonth(registro.mes) === "Não informado" ? "" : formatVtMonth(registro.mes));
  form.elements.dias_uteis.value = registro.diasUteis || "";
  form.elements.valor_passagem.value = formatCurrencyInput(String(Math.round(Number(registro.valorPassagem || 0) * 100)));
  form.elements.saldo_atual.value = registro.saldoAtual ?? "";
  document.getElementById("cancelar-edicao-vt")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alterações";
  updateVtCalculation();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

const vtForm = document.getElementById("vt-form");
if (vtForm) {
  vtForm.elements.valor_passagem?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCurrencyInput(event.currentTarget.value);
  });
  vtForm.addEventListener("input", updateVtCalculation);
  vtForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const id = form.get("id");
    const values = getVtFormValues(formElement);
    if (!hasFullName(values.colaborador)) {
      showModal("Colaborador obrigatório", "Informe nome e sobrenome do colaborador para registrar o cálculo de VT.", "error");
      return;
    }
    if (!values.unidade) {
      showModal("Unidade obrigatória", "Informe a unidade do trabalhador para registrar o cálculo de VT.", "error");
      return;
    }
    if (!VT_MONTH_NAMES.includes(values.mes)) {
      showModal("Màs obrigatório", "Informe o màs de referência para registrar o cálculo de VT.", "error");
      return;
    }
    const success = id
      ? await updateItem("vtRegistros", id, { ...values, updatedBy: getCurrentUserName() })
      : await addItem("vtRegistros", { ...values, createdBy: getCurrentUserName() });
    if (success) {
      resetVtForm();
      showModal(id ? "VT atualizado" : "VT registrado", id ? "O registro de vale-transporte foi atualizado com sucesso." : "O cálculo de vale-transporte foi registrado com sucesso.", "info");
    }
  });
  document.getElementById("cancelar-edicao-vt")?.addEventListener("click", resetVtForm);
  updateVtCalculation();
}

document.getElementById("vt-filter-nome")?.addEventListener("input", renderVtRegistros);
document.getElementById("vt-filter-mes")?.addEventListener("change", renderVtRegistros);
document.getElementById("vt-filter-unidade")?.addEventListener("change", renderVtRegistros);
document.getElementById("abrir-relatorio-vt")?.addEventListener("click", showVtReportMenu);
document.getElementById("limpar-filtros-vt")?.addEventListener("click", () => {
  const nameFilter = document.getElementById("vt-filter-nome");
  const monthFilter = document.getElementById("vt-filter-mes");
  const unitFilter = document.getElementById("vt-filter-unidade");
  if (nameFilter) nameFilter.value = "";
  if (monthFilter) monthFilter.value = "";
  if (unitFilter) unitFilter.value = "";
  renderVtRegistros();
});

HubModules.register({
  ...vtRegistrosRepository,
  view: "gerenciamento-vt",
  silent: true,
  render: renderVtRegistros,
  actions: {
    "editar-vt": (id) => editarVtRegistro(id),
    "excluir-vt": (id) => excluirVtRegistro(id),
    "gerar-relatorio-vt": (id, target) => gerarRelatorioVt(target.dataset.scope),
  },
});
