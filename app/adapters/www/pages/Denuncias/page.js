// Pagina (area administrativa): leitura, reabertura, arquivamento e exclusao de denuncias.
// Sem repositorio proprio: mapRow/toPayload/TABELA de "denuncias" continuam em script.js porque
// tambem sao usados pela pagina publica de denuncia (denuncia.html), que nao carrega os modulos do HubModules.

let showArchivedDenuncias = false;

function renderDenunciasSection() {
  const naoLidas = data.denuncias.filter(item => item.status === "Aberta" || item.status === "Urgente");
  const lidas = data.denuncias.filter(item => item.status === "Lida");
  const arquivadas = data.denuncias.filter(item => item.status === "Arquivada");
  if (!arquivadas.length && showArchivedDenuncias) showArchivedDenuncias = false;
  const primaryDenunciasTitle = document.getElementById("denuncias-primary-title");
  const toggleArchivedDenunciasButton = document.getElementById("toggle-archived-denuncias");

  if (primaryDenunciasTitle) primaryDenunciasTitle.textContent = showArchivedDenuncias ? "Arquivadas" : "Não Lidas";
  if (toggleArchivedDenunciasButton) {
    toggleArchivedDenunciasButton.textContent = showArchivedDenuncias ? "Ocultar arquivadas" : "Mostrar arquivadas";
    toggleArchivedDenunciasButton.disabled = false;
    toggleArchivedDenunciasButton.hidden = !arquivadas.length;
  }
  const excluirArquivadasDenunciasButton = document.getElementById("excluir-arquivadas-denuncias");
  if (excluirArquivadasDenunciasButton) excluirArquivadasDenunciasButton.hidden = !showArchivedDenuncias;

  const cardTemplate = (item, archived = false) => `
    <article class="item-card clickable"
             data-record-context="denuncia"
             data-action="ler-denuncia"
             data-id="${escapeHtml(item.id)}">
      <div class="item-topline">
        <p class="item-title">Denúncia anônima</p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.descricao.substring(0, 80))}${item.descricao.length > 80 ? '...' : ''}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
      ${archived ? `<div class="job-actions section-top"><button class="secondary-link" type="button" data-action="reabrir-denuncia" data-id="${escapeHtml(item.id)}">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedDenuncias) {
    const primaryTarget = document.getElementById("denuncias-nao-lidas");
    if (!arquivadas.length && primaryTarget) {
      primaryTarget.innerHTML = '<p class="empty-state">Sem denúncias arquivadas</p>';
    } else {
      renderCards("denuncias-nao-lidas", arquivadas, (item) => cardTemplate(item, true));
    }
  } else {
    renderCards("denuncias-nao-lidas", naoLidas, (item) => cardTemplate(item, false));
  }
  renderCards("denuncias-lidas", lidas, (item) => cardTemplate(item, false));
}

async function lerDenuncia(id) {
  const denuncia = data.denuncias.find(item => String(item.id) === String(id));
  if (!denuncia) return;

  showModal(
    "Visualizacao da Denuncia",
    `Categoria: ${denuncia.categoria}\nRecebida em: ${denuncia.createdAt}\nStatus Atual: ${denuncia.status}\n\nRelato:\n"${denuncia.descricao}"`,
    "info"
  );

  if (denuncia.status === "Aberta") {
    if (!postgresClient) {
      denuncia.status = "Lida";
      saveLocalData();
      renderAll();
    } else {
      try {
        const { data: updated, error } = await postgresClient
          .from(TABLES.denuncias)
          .update({ status: "Lida" })
          .eq("id", id)
          .select()
          .single();

        if (error || !updated) throw error || new Error("Nenhuma linha alterada.");

        denuncia.status = "Lida";
        saveLocalData();
        renderAll();
      } catch (err) {
        console.error("Erro ao atualizar status da denúncia no PostgreSQL:", err);
        showModal("Aviso de Permissão", "A denúncia não pode ser atualizada. Você precisa rodar o script SQL de UPDATE no painel do PostgreSQL para consertar as permissões.", "error");
      }
    }
  }
}

async function atualizarStatusDenuncia(id, status) {
  const denuncia = data.denuncias.find((item) => String(item.id) === String(id));
  if (!denuncia) return false;

  denuncia.status = status;
  saveLocalData();
  renderAll();

  if (!postgresClient) {
    return true;
  }

  try {
    const { data: updated, error } = await postgresClient
      .from(TABLES.denuncias)
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) throw error || new Error("Nenhuma linha alterada.");

    mergeRealtimeRow("denuncias", updated, "UPDATE");
    renderRealtimeUpdate("denuncias");
    return true;
  } catch (err) {
    console.error("Erro ao atualizar status da denúncia no PostgreSQL:", err);
    setSyncStatus("Sincronizacao pendente", false);
    return true;
  }
}

function reabrirDenuncia(id) {
  showConfirmActionModal({
    title: "Reabrir denúncia",
    text: "Deseja mover esta denúncia de volta para a lista de Lidas?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await atualizarStatusDenuncia(id, "Lida");
      if (success) {
        showModal("Denúncia reaberta", "A denúncia voltou para a lista de Lidas.", "info");
      }
    },
  });
}

async function arquivarDenunciaPorContexto(id) {
  if (!id) return;
  const success = await atualizarStatusDenuncia(id, "Arquivada");
  if (success) showModal("Denúncia arquivada", "A denúncia foi movida para Arquivadas.", "info");
}

function excluirDenunciasArquivadas() {
  excluirRegistrosArquivadosPermanentemente("denuncias", TABLES.denuncias, "denuncias");
}

document.getElementById("toggle-archived-denuncias")?.addEventListener("click", () => {
  showArchivedDenuncias = !showArchivedDenuncias;
  renderAll();
});

document.getElementById("excluir-arquivadas-denuncias")?.addEventListener("click", () => {
  excluirDenunciasArquivadas();
});
