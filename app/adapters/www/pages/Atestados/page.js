// Pagina: atestados (formulario publico de envio + area administrativa: filtros, status, exclusao).
// ponytail: carrega DEPOIS de script.js (ao contrario dos demais modulos) porque decora renderAll,
// que so existe depois que script.js executa.

(function setupAtestadosModule() {
  const ATESTADOS_TABLE = "hub_atestados";
  const ATESTADOS_LOCAL_KEY = "hub-atestados-local-v1";
  const ATESTADO_ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  const ATESTADO_ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"]);

  function getAtestadosBucket() {
    return typeof ATESTADOS_BUCKET !== "undefined" ? ATESTADOS_BUCKET : "hub-atestados";
  }

  function getAtestadoMaxSize() {
    return typeof ATESTADO_MAX_SIZE_BYTES !== "undefined" ? ATESTADO_MAX_SIZE_BYTES : 3 * 1024 * 1024;
  }

  function getFileExtension(fileName = "") {
    const parts = String(fileName || "").split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  function validateAtestadoFile(file) {
    if (!file || !file.name) return "Anexe o atestado antes de enviar.";
    if (file.size > getAtestadoMaxSize()) return "O arquivo deve ter no máximo 3 MB.";

    const extension = getFileExtension(file.name);
    const mime = String(file.type || "").toLowerCase();
    if (!ATESTADO_ALLOWED_EXTENSIONS.has(extension) && !ATESTADO_ALLOWED_MIME_TYPES.has(mime)) {
      return "Formato inválido. Envie PDF, imagem, DOC ou DOCX.";
    }
    return "";
  }

  function safeStorageFileName(fileName = "atestado") {
    return String(fileName || "atestado")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9_.-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "atestado";
  }

  function getAtestadoFilterValues() {
    return {
      nome: String(document.getElementById("atestado-filter-nome")?.value || "").trim().toLowerCase(),
      cpf: normalizeCpf(document.getElementById("atestado-filter-cpf")?.value || ""),
      unidade: String(document.getElementById("atestado-filter-unidade")?.value || "").trim(),
    };
  }

  function filterAtestados(items = []) {
    const filters = getAtestadoFilterValues();
    return [...items]
      .filter((item) => {
        const nome = String(item.nome || "").toLowerCase();
        const cpf = normalizeCpf(item.cpf || "");
        const unidade = String(item.unidade || "").trim();
        if (filters.nome && !nome.includes(filters.nome)) return false;
        if (filters.cpf && !cpf.includes(filters.cpf)) return false;
        if (filters.unidade && unidade !== filters.unidade) return false;
        return true;
      })
      .sort((a, b) => getDashboardRecordSortValue(b) - getDashboardRecordSortValue(a));
  }

  function getLocalAtestados() {
    return storageService.getLocalItem(ATESTADOS_LOCAL_KEY, []).map(mapAtestadoRow);
  }

  function saveLocalAtestados(items = []) {
    storageService.setLocalItem(ATESTADOS_LOCAL_KEY, items.map(mapAtestadoRow));
  }

  async function fetchAtestadosFromPostgreSQL() {
    if (!postgresClient) return getLocalAtestados();
    try {
      const { data: rows, error } = await postgresClient
        .from(ATESTADOS_TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (rows || []).map(mapAtestadoRow);
      data.atestados = mapped;
      saveLocalDataDebounced?.();
      return mapped;
    } catch (error) {
      console.warn("Não foi possível carregar atestados do PostgreSQL; usando cache local.", error);
      return data.atestados?.length ? data.atestados : getLocalAtestados();
    }
  }

  function updateAtestadoClearButton() {
    const clearButton = document.getElementById("clear-atestado-filters");
    if (!clearButton) return;
    const filters = getAtestadoFilterValues();
    clearButton.hidden = !(filters.nome || filters.cpf || filters.unidade);
  }

  function renderAtestadoCards(items = []) {
    const target = document.getElementById("atestados-list");
    if (!target) return;
    const filtered = filterAtestados(items);
    updateAtestadoClearButton();

    if (!filtered.length) {
      target.innerHTML = '<p class="empty-state">Nenhum atestado encontrado.</p>';
      return;
    }

    target.innerHTML = filtered.map((item) => {
      const status = item.status || "Recebido";
      const fileName = item.arquivoNome || "Atestado";
      const fileMeta = [fileName, formatFileSize(item.arquivoTamanho)].filter(Boolean).join(" - ");
      return `
        <article class="item-card atestado-card">
          <div class="item-topline">
            <p class="item-title">${escapeHtml(item.nome || "Colaborador não informado")}</p>
            <span class="tag">${escapeHtml(status)}</span>
          </div>
          <p><strong>CPF:</strong> ${escapeHtml(formatCpf(item.cpf || ""))}</p>
          <p><strong>Telefone:</strong> ${escapeHtml(formatPhone(item.telefone || "") || item.telefone || "Não informado")}</p>
          <p><strong>Unidade:</strong> ${escapeHtml(item.unidade || "Não informada")}</p>
          <p class="item-meta">Recebido em ${escapeHtml(item.createdAt || "Não informado")} | ${escapeHtml(fileMeta || "Arquivo anexado")}</p>
          <div class="job-actions section-top atestado-actions">
            <div class="atestado-action-buttons">
              ${item.arquivoUrl ? `<button type="button" class="secondary-link private-file-button atestado-action-button" data-private-storage-bucket="${escapeHtml(getAtestadosBucket())}" data-private-storage-path="${escapeHtml(item.arquivoUrl)}">Ver atestado</button>` : ""}
              <button type="button" class="danger-button atestado-action-button" data-delete-atestado-id="${escapeHtml(item.id)}" data-delete-atestado-path="${escapeHtml(item.arquivoUrl || "")}">Apagar atestado</button>
            </div>
            <label class="compact-status-label">Status
              <select data-atestado-status-id="${escapeHtml(item.id)}">
                ${["Recebido", "Em análise", "Lançado", "Recusado"].map((option) => `<option${option === status ? " selected" : ""}>${option}</option>`).join("")}
              </select>
            </label>
          </div>
        </article>
      `;
    }).join("");
  }

  async function renderAtestadosSection() {
    if (!document.getElementById("atestados-list")) return;
    const items = await fetchAtestadosFromPostgreSQL();
    renderAtestadoCards(items);
    try { renderDashboard?.(); } catch (_) {}
    try { window.notificationTracker?.loadNotifications?.(); } catch (_) {}
  }

  async function deleteAtestado(id, filePath = "") {
    if (!id) return;
    const item = (data.atestados || []).find((record) => String(record.id) === String(id));
    const label = item?.nome ? ` de ${item.nome}` : "";
    if (!confirm(`Tem certeza que deseja apagar o atestado${label}? Essa ação não poderá ser desfeita.`)) return;

    const applyLocalDelete = () => {
      data.atestados = (data.atestados || []).filter((record) => String(record.id) !== String(id));
      saveLocalAtestados(data.atestados || []);
      renderAtestadoCards(data.atestados || []);
      try { renderDashboard?.(); } catch (_) {}
      try { window.notificationTracker?.loadNotifications?.(); } catch (_) {}
    };

    if (postgresClient) {
      try {
        const pathToRemove = filePath || item?.arquivoUrl || "";
        if (pathToRemove) {
          const { error: storageError } = await postgresClient.storage
            .from(getAtestadosBucket())
            .remove([pathToRemove]);
          if (storageError) console.warn("Não foi possível remover o arquivo do storage:", storageError);
        }

        const { error } = await postgresClient
          .from(ATESTADOS_TABLE)
          .delete()
          .eq("id", id);
        if (error) throw error;

        applyLocalDelete();
        showModal?.("Atestado apagado", "O atestado foi removido com sucesso.", "success");
        return;
      } catch (error) {
        console.error("Erro ao apagar atestado:", error);
        showModal?.("Erro", "Não foi possível apagar o atestado. Verifique a permissão DELETE da tabela hub_atestados e do bucket hub-atestados.", "error");
        return;
      }
    }

    applyLocalDelete();
    showModal?.("Atestado apagado localmente", "Sem PostgreSQL ativo, a exclusão foi feita apenas neste navegador.", "info");
  }

  async function updateAtestadoStatus(id, status) {
    if (!id || !status) return;
    const applyLocal = () => {
      data.atestados = (data.atestados || []).map((item) => String(item.id) === String(id) ? { ...item, status } : item);
      saveLocalAtestados(data.atestados || []);
      renderAtestadoCards(data.atestados || []);
    };

    if (postgresClient) {
      try {
        const { error } = await postgresClient.from(ATESTADOS_TABLE).update({ status }).eq("id", id);
        if (error) throw error;
        applyLocal();
        showModal?.("Status atualizado", "O status do atestado foi atualizado com sucesso.", "success");
        return;
      } catch (error) {
        console.error("Erro ao atualizar status do atestado:", error);
        showModal?.("Erro", "Não foi possível atualizar o status no PostgreSQL. Verifique a permissão UPDATE da tabela hub_atestados.", "error");
        return;
      }
    }

    applyLocal();
    showModal?.("Status atualizado localmente", "Sem PostgreSQL ativo, a alteração ficou salva apenas neste navegador.", "info");
  }

  async function uploadPublicAtestado({ nome, cpf, telefone, unidade, file }) {
    if (!postgresClient) throw new Error("PostgreSQL indisponível. Verifique a configuração pública do HUB.");

    const cpfDigits = normalizeCpf(cpf);
    const safeName = safeStorageFileName(file.name || "atestado.pdf");
    const path = `atestados/${cpfDigits || "sem-cpf"}/${Date.now()}-${generateUUID()}-${safeName}`;

    const { error: uploadError } = await postgresClient.storage
      .from(getAtestadosBucket())
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;

    const payload = {
      nome,
      cpf: cpfDigits,
      telefone,
      unidade,
      arquivo_nome: file.name || "Atestado",
      arquivo_tamanho: file.size || 0,
      arquivo_tipo: file.type || "application/octet-stream",
      arquivo_url: path,
      status: "Recebido",
      created_by: "Publico",
    };

    const { error: insertError } = await postgresClient
      .from(ATESTADOS_TABLE)
      .insert(payload);
    if (insertError) throw insertError;

    return mapAtestadoRow({
      id: generateUUID(),
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  function setupPublicAtestadoForm() {
    const form = document.getElementById("atestado-form");
    if (!form || form.dataset.atestadoReady === "true") return;
    form.dataset.atestadoReady = "true";
    ensurePublicCaptchaNotice?.(form);

    document.getElementById("atestado-cpf")?.addEventListener("input", (event) => {
      event.currentTarget.value = formatCpf(event.currentTarget.value);
    });
    document.getElementById("atestado-telefone")?.addEventListener("input", (event) => {
      event.currentTarget.value = formatPhone(event.currentTarget.value);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const publicFormError = validatePublicFormSubmission?.(formElement);
      if (publicFormError) {
        showModal?.("Envio bloqueado", publicFormError, "error");
        return;
      }

      const formData = new FormData(formElement);
      const nome = String(formData.get("nome") || "").trim();
      const cpf = String(formData.get("cpf") || "").trim();
      const telefone = String(formData.get("telefone") || "").trim();
      const unidade = String(formData.get("unidade") || "").trim();
      const file = formData.get("atestado");

      if (!/\S+\s+\S+/.test(nome)) {
        showModal?.("Nome obrigatório", "Informe nome e sobrenome do colaborador.", "error");
        return;
      }
      if (!isValidCpf(cpf)) {
        showModal?.("CPF inválido", "Informe um CPF válido no formato 000.000.000-00.", "error");
        return;
      }
      if (!telefone || normalizeCpf(telefone).length < 10) {
        showModal?.("Telefone obrigatório", "Informe um telefone válido para contato.", "error");
        return;
      }
      if (!unidade) {
        showModal?.("Unidade obrigatória", "Selecione a unidade do colaborador.", "error");
        return;
      }
      const fileError = validateAtestadoFile(file);
      if (fileError) {
        showModal?.("Arquivo inválido", fileError, "error");
        return;
      }

      const submitButton = formElement.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || "Enviar atestado";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      try {
        await uploadPublicAtestado({ nome, cpf, telefone, unidade, file });
        formElement.reset();
        showModal?.("Atestado enviado", "Seu atestado foi enviado com sucesso para o RH.", "success");
      } catch (error) {
        console.error("Erro ao enviar atestado:", error);
        showModal?.("Erro no envio", error.message || "Não foi possível enviar o atestado. Verifique sua conexão e tente novamente.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  function setupAtestadosInternalView() {
    if (!document.getElementById("atestados-list")) return;
    ["atestado-filter-nome", "atestado-filter-cpf", "atestado-filter-unidade"].forEach((id) => {
      const field = document.getElementById(id);
      if (!field || field.dataset.atestadoFilterReady === "true") return;
      field.dataset.atestadoFilterReady = "true";
      const eventName = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(eventName, () => renderAtestadoCards(data.atestados || []));
    });

    document.getElementById("atestado-filter-cpf")?.addEventListener("input", (event) => {
      event.currentTarget.value = formatCpf(event.currentTarget.value);
    });

    document.getElementById("clear-atestado-filters")?.addEventListener("click", () => {
      ["atestado-filter-nome", "atestado-filter-cpf", "atestado-filter-unidade"].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
      });
      renderAtestadoCards(data.atestados || []);
    });

    if (!document.documentElement.dataset.atestadoDeleteReady) {
      document.documentElement.dataset.atestadoDeleteReady = "true";
      document.addEventListener("click", (event) => {
        const deleteButton = event.target.closest?.("[data-delete-atestado-id]");
        if (!deleteButton) return;
        event.preventDefault();
        deleteAtestado(deleteButton.dataset.deleteAtestadoId, deleteButton.dataset.deleteAtestadoPath || "");
      });
    }

    document.addEventListener("change", (event) => {
      const select = event.target.closest?.("[data-atestado-status-id]");
      if (!select) return;
      updateAtestadoStatus(select.dataset.atestadoStatusId, select.value);
    });
  }

  try {
    const originalRenderAll = renderAll;
    renderAll = function patchedRenderAllForAtestados() {
      originalRenderAll?.();
      renderAtestadosSection();
    };
  } catch (_) {}

  document.addEventListener("DOMContentLoaded", () => {
    setupPublicAtestadoForm();
    setupAtestadosInternalView();
  });

  setupPublicAtestadoForm();
  setupAtestadosInternalView();
})();
