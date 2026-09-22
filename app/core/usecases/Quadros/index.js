// Casos de uso: salvar quadro no PostgreSQL (upsert manual) e executar as acoes de contexto (quadro, coluna, cartao).

async function persistBoard(board = getActiveBoard()) {
  if (!board) return false;
  board.ownerName = board.ownerName || getCurrentUserName();
  board.ownerId = board.ownerId || currentUserProfile?.id || currentAuthUser?.id || "";
  board.ownerEmail = board.ownerEmail || currentUserProfile?.email || currentAuthUser?.email || "";
  saveLocalData();
  if (!postgresClient) {
    renderBoards();
    return true;
  }
  try {
    const payload = toDbPayload("quadros", { ...board, updatedBy: getCurrentUserName() });
    const isLocal = String(board.id || "").startsWith("local-");
    if (isLocal) delete payload.id;
    const query = isLocal
      ? postgresClient.from(TABLES.quadros).insert(payload)
      : postgresClient.from(TABLES.quadros).update(payload).eq("id", board.id);
    const { data: saved, error } = await query.select("*").single();
    if (error) throw error;
    const mapped = mapRows("quadros", [saved])[0];
    const index = data.quadros.findIndex((item) => String(item.id) === String(board.id));
    if (index >= 0) data.quadros[index] = mapped;
    activeBoardId = mapped.id;
    saveLocalData();
    renderBoards();
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao salvar quadro:", error);
    setSyncStatus("Erro ao salvar quadro", false);
    showModal("Erro ao Salvar", error?.message || "Nao foi possivel salvar o quadro.", "error");
    renderBoards();
    return false;
  }
}

async function handleBoardContextAction(event, type, payload) {
  const action = event.target.closest("[data-board-menu-action]")?.dataset.boardMenuAction;
  if (!action) return;
  closeBoardContextMenu();
  closeBoardCardActionMenu();
  const board = getActiveBoard();
  if (!board) return;

  if (type === "board") {
    if (action === "rename-board") {
      const name = prompt("Novo nome do quadro", board.nome || "");
      if (name && name.trim()) {
        board.nome = name.trim();
        await persistBoard(board);
      }
    } else if (action === "duplicate-board") {
      const duplicate = JSON.parse(JSON.stringify(board));
      duplicate.id = `local-${generateUUID()}`;
      duplicate.nome = `${board.nome || "Quadro"} copia`;
      data.quadros.splice(data.quadros.findIndex((item) => String(item.id) === String(board.id)) + 1, 0, duplicate);
      activeBoardId = duplicate.id;
      await persistBoard(duplicate);
    } else if (action === "delete-board") {
      if (!confirm(`Apagar "${board.nome}"?`)) return;
      const id = board.id;
      data.quadros = data.quadros.filter((item) => String(item.id) !== String(id));
      activeBoardId = getOrderedBoards()[0]?.id || "";
      saveLocalData();
      renderBoards();
      if (postgresClient && !String(id).startsWith("local-")) await deleteItem("quadros", id);
    }
    return;
  }

  if (type === "list") {
    const list = board.listas?.[payload.listIndex];
    if (!list) return;
    if (action === "duplicate-list") {
      const duplicate = JSON.parse(JSON.stringify(list));
      duplicate.id = generateUUID();
      duplicate.titulo = `${list.titulo || "Coluna"} copia`;
      duplicate.cartoes = (duplicate.cartoes || []).map((card) => ({ ...card, id: generateUUID() }));
      board.listas.splice(payload.listIndex + 1, 0, duplicate);
      await persistBoard(board);
    } else if (action === "rename-list") {
      const name = prompt("Novo nome da coluna", list.titulo || "");
      if (name && name.trim()) {
        list.titulo = name.trim();
        await persistBoard(board);
      }
    } else if (action === "delete-list") {
      if ((board.listas || []).length <= 1) {
        showModal("Coluna obrigatoria", "E preciso manter pelo menos uma coluna no quadro.", "info");
        return;
      }
      showConfirmActionModal({
        title: "Excluir coluna",
        text: `Excluir "${list.titulo || "esta coluna"}"? Os cartoes desta coluna tambem serao removidos.`,
        confirmText: "Excluir coluna",
        danger: true,
        onConfirm: async () => {
          resetBoardCardFormIfEditing(payload.listIndex, null);
          board.listas.splice(payload.listIndex, 1);
          await persistBoard(board);
        },
      });
    }
    return;
  }

  const list = board.listas?.[payload.listIndex];
  const card = list?.cartoes?.[payload.cardIndex];
  if (!list || !card) return;
  if (action === "edit-card") {
    const form = document.getElementById("board-card-form");
    if (!form) return;
    form.elements.edit_list_index.value = String(payload.listIndex);
    form.elements.edit_card_index.value = String(payload.cardIndex);
    form.elements.titulo.value = card.titulo || "";
    form.elements.descricao.value = card.descricao || "";
    form.elements.prioridade.value = card.prioridade || "Normal";
    document.getElementById("cancelar-edicao-board-card")?.removeAttribute("hidden");
    form.querySelector("h3").textContent = "Editar cartao";
  } else if (action === "duplicate-card") {
    list.cartoes.splice(payload.cardIndex + 1, 0, { ...card, id: generateUUID(), titulo: `${card.titulo || "Cartao"} copia`, createdAt: todayLabel(), createdBy: getCurrentUserName() });
    resetBoardCardFormIfEditing(payload.listIndex, payload.cardIndex);
    await persistBoard(board);
  } else if (action === "delete-card") {
    list.cartoes.splice(payload.cardIndex, 1);
    resetBoardCardFormIfEditing(payload.listIndex, payload.cardIndex);
    await persistBoard(board);
  }
}
