// Pagina (area administrativa): leitura, reabertura, arquivamento e exclusao de feedbacks.
// Sem repositorio proprio: mapRow/toPayload/TABELA de "feedbacks" continuam em script.js porque
// tambem sao usados pela pagina publica de feedbacks (feedbacks.html), que nao carrega os modulos do HubModules.

let showArchivedFeedbacks = false;

function renderFeedbacksSection() {
  const naoLidosTarget = document.getElementById("feedbacks-nao-lidos");
  if (!naoLidosTarget) return;

  const excluirArquivadosFeedbacksButton = document.getElementById("excluir-arquivados-feedbacks");

  const toggleButton = document.getElementById("toggle-archived-feedbacks");

  if (!hasFredericoLevelAccess()) {
    naoLidosTarget.innerHTML = '<p class="empty-state">Acesso restrito.</p>';
    const lidosTarget = document.getElementById("feedbacks-lidos");
    if (lidosTarget) lidosTarget.innerHTML = "";
    if (excluirArquivadosFeedbacksButton) excluirArquivadosFeedbacksButton.hidden = true;
    if (toggleButton) toggleButton.hidden = true;
    return;
  }

  const feedbacks = [...(data.feedbacks || [])].sort((a, b) => String(b.sortAt || "").localeCompare(String(a.sortAt || "")));
  const naoLidos = feedbacks.filter((item) => (item.status || "Novo") === "Novo");
  const lidos = feedbacks.filter((item) => item.status === "Lido");
  const arquivados = feedbacks.filter((item) => isArchivedRecord(item));
  if (!arquivados.length && showArchivedFeedbacks) showArchivedFeedbacks = false;

  const primaryTitle = document.getElementById("feedbacks-primary-title");
  if (primaryTitle) primaryTitle.textContent = showArchivedFeedbacks ? "Arquivados" : "Não Lidos";
  if (toggleButton) {
    toggleButton.textContent = showArchivedFeedbacks ? "Ocultar arquivados" : "Mostrar arquivados";
    toggleButton.hidden = !arquivados.length;
  }
  if (excluirArquivadosFeedbacksButton) excluirArquivadosFeedbacksButton.hidden = !showArchivedFeedbacks;

  const cardTemplate = (item, archived = false) => `
    <article class="item-card clickable"
             data-record-context="feedback"
             data-action="ler-feedback"
             data-id="${escapeHtml(item.id)}">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.tipo || "Feedback")}</p>
        <span class="tag">${escapeHtml(item.status || "Novo")}</span>
      </div>
      <p><strong>Identificacao:</strong> ${escapeHtml(item.autorNome || "Nao informado")}</p>
      <p>${escapeHtml(item.mensagem || "")}</p>
      <p class="item-meta">${escapeHtml(item.createdAt || "Hoje")}</p>
      ${archived ? `<div class="job-actions section-top"><button class="secondary-link" type="button" data-action="reabrir-feedback" data-id="${escapeHtml(item.id)}">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedFeedbacks) {
    if (!arquivados.length) {
      naoLidosTarget.innerHTML = '<p class="empty-state">Sem feedbacks arquivados</p>';
    } else {
      renderCards("feedbacks-nao-lidos", arquivados, (item) => cardTemplate(item, true));
    }
  } else {
    renderCards("feedbacks-nao-lidos", naoLidos, (item) => cardTemplate(item, false));
  }
  renderCards("feedbacks-lidos", lidos, (item) => cardTemplate(item, false));
}

async function lerFeedback(id) {
  const feedback = (data.feedbacks || []).find((item) => String(item.id) === String(id));
  if (!feedback) return;

  showModal(
    "Visualização do Feedback",
    `Tipo: ${feedback.tipo || "Feedback"}\nIdentificação: ${feedback.autorNome || "Não informado"}\nRecebido em: ${feedback.createdAt || "Hoje"}\n\nMensagem:\n"${feedback.mensagem || ""}"`,
    "info"
  );

  if ((feedback.status || "Novo") === "Novo") {
    const success = await updateItem("feedbacks", id, { status: "Lido" });
    if (!success) {
      showModal("Aviso de Permissão", "O feedback não pode ser atualizado. Você precisa rodar o script SQL de UPDATE no painel do PostgreSQL para consertar as permissões.", "error");
    }
  }
}

function reabrirFeedback(id) {
  showConfirmActionModal({
    title: "Reabrir feedback",
    text: "Deseja mover este feedback de volta para a lista de Lidos?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await updateItem("feedbacks", id, { status: "Lido" });
      if (success) showModal("Feedback reaberto", "O feedback voltou para a lista de Lidos.", "info");
    },
  });
}

async function arquivarFeedbackPorContexto(id) {
  if (!id) return;
  const feedback = (data.feedbacks || []).find((item) => String(item.id) === String(id));
  if (!feedback) return;
  feedback.status = "Arquivado";
  saveLocalData();
  renderAll();
  syncRecordStatusSilently("feedbacks", id, "Arquivado");
  showModal("Feedback arquivado", "O feedback foi movido para Arquivados.", "info");
}

function excluirFeedbacksArquivados() {
  excluirRegistrosArquivadosPermanentemente("feedbacks", TABLES.feedbacks, "feedbacks");
}

document.getElementById("toggle-archived-feedbacks")?.addEventListener("click", () => {
  showArchivedFeedbacks = !showArchivedFeedbacks;
  renderAll();
});

document.getElementById("excluir-arquivados-feedbacks")?.addEventListener("click", () => {
  excluirFeedbacksArquivados();
});
