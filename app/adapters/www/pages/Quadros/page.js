// Pagina: estado do quadro ativo, DOM, menus de contexto, drag and drop, formularios e registro no nucleo (HubModules).

let activeBoardId = "";
let boardContextMenu = null;
let boardCardActionMenu = null;
let draggedBoardCard = null;
let draggedBoardTabId = "";
let suppressBoardCardClick = false;

function createDefaultBoard(nome = "Quadro principal", createdBy = getCurrentUserName(), ownerName = nome) {
  return {
    id: `local-${generateUUID()}`,
    nome,
    ownerName,
    ownerId: currentUserProfile?.id || currentAuthUser?.id || "",
    ownerEmail: currentUserProfile?.email || currentAuthUser?.email || "",
    listas: [
      { id: generateUUID(), titulo: "A fazer", cartoes: [] },
      { id: generateUUID(), titulo: "Em andamento", cartoes: [] },
      { id: generateUUID(), titulo: "Concluido", cartoes: [] },
    ],
    createdBy,
    createdAt: todayLabel(),
  };
}

function ensureBoardsData() {
  if (!Array.isArray(data.quadros)) data.quadros = [];
  data.quadros.forEach((board) => {
    if (!Array.isArray(board.listas)) board.listas = [];
    if (!board.listas.length) board.listas = createDefaultBoard(board.nome || "Quadro").listas;
    board.listas.forEach((list) => {
      if (!Array.isArray(list.cartoes)) list.cartoes = [];
    });
  });
  if (!activeBoardId || !getBoardsForCurrentUser().some((board) => String(board.id) === String(activeBoardId))) {
    activeBoardId = getOrderedBoards()[0]?.id || "";
  }
}

function getVisibleBoards() {
  return getBoardsForCurrentUser();
}

function ensureBoardsDataRaw() {
  if (!Array.isArray(data.quadros)) data.quadros = [];
  data.quadros.forEach((board) => {
    if (!Array.isArray(board.listas)) board.listas = [];
    if (!board.listas.length) board.listas = createDefaultBoard(board.nome || "Quadro").listas;
    board.listas.forEach((list) => {
      if (!Array.isArray(list.cartoes)) list.cartoes = [];
    });
  });
}

function getCurrentBoardOwnerKeys() {
  return new Set([
    currentUserProfile?.id,
    currentAuthUser?.id,
    currentUserProfile?.email,
    currentAuthUser?.email,
    currentUserProfile?.cpf,
    getCurrentUserName(),
    storageService.getLocalItem(`${SESSION_KEY}-user`),
    storageService.getSessionItem(`${SESSION_KEY}-user`),
  ].filter(Boolean).map(normalizeLoginName));
}

function isCurrentUserBoard(board = {}) {
  const ownerKeys = getCurrentBoardOwnerKeys();
  if (!ownerKeys.size) return false;

  const explicitOwnerKeys = [
    board.ownerName,
    board.owner_name,
    board.ownerEmail,
    board.owner_email,
    board.userId,
    board.user_id,
    board.ownerId,
    board.owner_id,
  ].filter(Boolean).map(normalizeLoginName);

  if (explicitOwnerKeys.length) return explicitOwnerKeys.some((key) => ownerKeys.has(key));

  const legacyCreatorKeys = [
    board.createdBy,
    board.created_by,
  ].filter(Boolean).map(normalizeLoginName);
  return legacyCreatorKeys.some((key) => ownerKeys.has(key));
}

function getBoardsForCurrentUser() {
  ensureBoardsDataRaw();
  return (data.quadros || []).filter(isCurrentUserBoard);
}

function getOrderedBoards() {
  ensureBoardsDataRaw();
  const boards = [...getBoardsForCurrentUser()];
  const order = Array.isArray(currentUserSettings.boardOrder) ? currentUserSettings.boardOrder.map(String) : [];
  if (!order.length) {
    return boards.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" }));
  }
  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return boards.sort((a, b) => {
    const aIndex = orderIndex.has(String(a.id)) ? orderIndex.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.has(String(b.id)) ? orderIndex.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" });
  });
}

function saveBoardOrderFromTabs() {
  const ids = Array.from(document.querySelectorAll("#board-tabs [data-board-tab]")).map((tab) => String(tab.dataset.id || "")).filter(Boolean);
  currentUserSettings = normalizeUserSettings({ ...currentUserSettings, boardOrder: ids });
  saveUserSettings(currentUserSettings);
}

function getActiveBoard() {
  ensureBoardsData();
  return getBoardsForCurrentUser().find((board) => String(board.id) === String(activeBoardId)) || getOrderedBoards()[0] || null;
}

function getPriorityClass(value = "") {
  const priority = String(value || "").toLowerCase();
  if (priority === "urgente") return "priority-urgent";
  if (priority === "alta") return "priority-high";
  return "priority-normal";
}

function getBoardCardCount(board) {
  return (board?.listas || []).reduce((total, list) => total + (list.cartoes || []).length, 0);
}

function createBoardList(title = "Nova coluna") {
  return { id: generateUUID(), titulo: title, cartoes: [] };
}

function renderBoards() {
  const tabs = document.getElementById("board-tabs");
  const lanes = document.getElementById("boards-lanes");
  if (!tabs || !lanes) return;
  ensureBoardsData();
  const boards = getOrderedBoards();
  if (!boards.some((board) => String(board.id) === String(activeBoardId))) activeBoardId = boards[0]?.id || "";
  const board = getActiveBoard();

  tabs.innerHTML = boards.map((item) => `
    <button class="board-tab ${String(item.id) === String(activeBoardId) ? "active" : ""}" type="button" draggable="true" data-action="select-board" data-id="${escapeHtml(item.id)}" data-board-tab="true">
      <span>${escapeHtml(item.nome)}</span>
      <small>${getBoardCardCount(item)} cartao(oes)</small>
    </button>
  `).join("");

  if (!board) {
    lanes.innerHTML = '<p class="empty-state">Nenhum quadro encontrado.</p>';
    return;
  }

  const renderedLanes = (board.listas || []).map((list, listIndex) => `
    <section class="board-lane" data-board-list="true" data-list-index="${listIndex}">
      <div class="board-lane-header">
        <h3>${escapeHtml(list.titulo)}</h3>
        <span class="tag">${(list.cartoes || []).length}</span>
      </div>
      <div class="board-card-list">
        ${(list.cartoes || []).map((card, cardIndex) => `
          <article class="board-card ${getPriorityClass(card.prioridade)}" draggable="true" data-board-card="true" data-action="open-board-card-preview" data-list-index="${listIndex}" data-card-index="${cardIndex}">
            <div class="item-topline">
              <p class="item-title">${escapeHtml(card.titulo)}</p>
              <span class="tag">${escapeHtml(card.prioridade || "Normal")}</span>
            </div>
            <p>${escapeHtml(card.descricao || "Sem descricao.")}</p>
          </article>
        `).join("") || '<p class="empty-state">Nenhum cartao nesta lista.</p>'}
      </div>
    </section>
  `).join("");

  lanes.innerHTML = `${renderedLanes}
    <button class="board-add-lane-button" type="button" data-action="add-board-list">
      <span aria-hidden="true">+</span>
      <strong>Adicionar coluna</strong>
    </button>
  `;
}

function resetBoardCardFormIfEditing(listIndex = null, cardIndex = null) {
  const form = document.getElementById("board-card-form");
  if (!form) return;
  const editingList = form.elements.edit_list_index?.value;
  const editingCard = form.elements.edit_card_index?.value;
  const shouldReset = listIndex === null || (
    String(editingList) === String(listIndex) &&
    (cardIndex === null || String(editingCard) === String(cardIndex))
  );
  if (!shouldReset) return;
  form.reset();
  form.elements.edit_list_index.value = "";
  form.elements.edit_card_index.value = "";
  document.getElementById("cancelar-edicao-board-card")?.setAttribute("hidden", "");
  form.querySelector("h3").textContent = "Novo cartao";
}

function openBoardCardPreview(listIndex, cardIndex) {
  const card = getActiveBoard()?.listas?.[listIndex]?.cartoes?.[cardIndex];
  if (!card) return;
  showModal(card.titulo || "Cartao", card.descricao || "Sem descricao.", "info");
}

function closeBoardContextMenu() {
  boardContextMenu = null;
  document.getElementById("board-context-menu")?.remove();
  document.getElementById("board-list-context-menu")?.remove();
}

function closeBoardCardActionMenu() {
  boardCardActionMenu = null;
  document.getElementById("board-card-action-menu")?.remove();
}

function placeFloatingMenu(menu, x, y) {
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  const left = Math.min(x, window.innerWidth - rect.width - 10);
  const top = Math.min(y, window.innerHeight - rect.height - 10);
  menu.style.left = `${Math.max(10, left)}px`;
  menu.style.top = `${Math.max(10, top)}px`;
}

function renderBoardContextMenu() {
  document.getElementById("board-context-menu")?.remove();
  if (!boardContextMenu) return;
  const menu = document.createElement("div");
  menu.id = "board-context-menu";
  menu.className = "board-context-menu";
  menu.innerHTML = `
    <button type="button" data-board-menu-action="rename-board">Renomear</button>
    <button type="button" data-board-menu-action="duplicate-board">Duplicar</button>
    <button class="danger" type="button" data-board-menu-action="delete-board">Apagar</button>
  `;
  menu.addEventListener("click", (clickEvent) => handleBoardContextAction(clickEvent, "board", { id: boardContextMenu.id }));
  placeFloatingMenu(menu, boardContextMenu.x, boardContextMenu.y);
}

function renderBoardCardActionMenu() {
  document.getElementById("board-card-action-menu")?.remove();
  if (!boardCardActionMenu) return;
  const menu = document.createElement("div");
  menu.id = "board-card-action-menu";
  menu.className = "board-context-menu";
  menu.innerHTML = `
    <button type="button" data-board-menu-action="edit-card">Editar</button>
    <button type="button" data-board-menu-action="duplicate-card">Duplicar</button>
    <button class="danger" type="button" data-board-menu-action="delete-card">Excluir</button>
  `;
  menu.addEventListener("click", (clickEvent) => handleBoardContextAction(clickEvent, "card", {
    listIndex: boardCardActionMenu.listIndex,
    cardIndex: boardCardActionMenu.cardIndex,
  }));
  placeFloatingMenu(menu, boardCardActionMenu.x, boardCardActionMenu.y);
}

function renderBoardListContextMenu() {
  document.getElementById("board-list-context-menu")?.remove();
  if (!boardContextMenu || boardContextMenu.type !== "list") return;
  const menu = document.createElement("div");
  menu.id = "board-list-context-menu";
  menu.className = "board-context-menu";
  menu.innerHTML = `
    <button type="button" data-board-menu-action="duplicate-list">Duplicar</button>
    <button type="button" data-board-menu-action="rename-list">Renomear</button>
    <button class="danger" type="button" data-board-menu-action="delete-list">Excluir</button>
  `;
  menu.addEventListener("click", (clickEvent) => handleBoardContextAction(clickEvent, "list", { listIndex: boardContextMenu.listIndex }));
  placeFloatingMenu(menu, boardContextMenu.x, boardContextMenu.y);
}

document.getElementById("board-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const nome = String(new FormData(form).get("nome") || "").trim();
  if (!nome) return;
  const board = createDefaultBoard(nome, getCurrentUserName(), getCurrentUserName());
  data.quadros = [board, ...(data.quadros || [])];
  activeBoardId = board.id;
  form.reset();
  saveLocalData();
  renderBoards();
  await persistBoard(board);
});

document.getElementById("board-card-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const board = getActiveBoard();
  if (!board) return;
  const form = event.currentTarget;
  const values = new FormData(form);
  const editListIndex = values.get("edit_list_index") === "" ? -1 : Number(values.get("edit_list_index"));
  const editCardIndex = values.get("edit_card_index") === "" ? -1 : Number(values.get("edit_card_index"));
  const isEditing = editListIndex >= 0 && editCardIndex >= 0 && board.listas?.[editListIndex]?.cartoes?.[editCardIndex];
  const list = isEditing ? board.listas[editListIndex] : board.listas?.[0];
  if (!list) return;
  const card = {
    id: isEditing ? list.cartoes[editCardIndex].id : generateUUID(),
    titulo: String(values.get("titulo") || "").trim(),
    descricao: String(values.get("descricao") || "").trim(),
    prioridade: String(values.get("prioridade") || "Normal"),
    createdAt: isEditing ? list.cartoes[editCardIndex].createdAt : todayLabel(),
    createdBy: isEditing ? list.cartoes[editCardIndex].createdBy : getCurrentUserName(),
    updatedAt: isEditing ? todayLabel() : "",
    updatedBy: isEditing ? getCurrentUserName() : "",
  };
  if (!card.titulo) return;
  if (isEditing) list.cartoes[editCardIndex] = card;
  else list.cartoes.push(card);
  resetBoardCardFormIfEditing();
  await persistBoard(board);
});

document.getElementById("cancelar-edicao-board-card")?.addEventListener("click", () => resetBoardCardFormIfEditing());

document.addEventListener("click", (event) => {
  if (!event.target.closest("#board-context-menu") && !event.target.closest("#board-list-context-menu") && !event.target.closest("[data-board-tab]") && !event.target.closest("[data-board-list]")) closeBoardContextMenu();
  if (!event.target.closest("#board-card-action-menu") && !event.target.closest("[data-board-card]")) closeBoardCardActionMenu();
  const addListButton = event.target.closest("[data-action='add-board-list']");
  if (addListButton) {
    const board = getActiveBoard();
    if (!board) return;
    board.listas = [...(board.listas || []), createBoardList()];
    resetBoardCardFormIfEditing();
    persistBoard(board);
    return;
  }
  const boardButton = event.target.closest("[data-action='select-board']");
  if (boardButton) {
    closeBoardContextMenu();
    closeBoardCardActionMenu();
    activeBoardId = boardButton.dataset.id || "";
    resetBoardCardFormIfEditing();
    renderBoards();
    return;
  }
  const card = event.target.closest("[data-board-card]");
  if (card && !suppressBoardCardClick) openBoardCardPreview(Number(card.dataset.listIndex), Number(card.dataset.cardIndex));
});

document.addEventListener("contextmenu", (event) => {
  const tab = event.target.closest("[data-board-tab]");
  if (tab) {
    event.preventDefault();
    closeBoardCardActionMenu();
    activeBoardId = tab.dataset.id || activeBoardId;
    renderBoards();
    boardContextMenu = { id: tab.dataset.id, x: event.clientX, y: event.clientY + 6 };
    renderBoardContextMenu();
    return;
  }
  const card = event.target.closest("[data-board-card]");
  if (card) {
    event.preventDefault();
    closeBoardContextMenu();
    boardCardActionMenu = {
      listIndex: Number(card.dataset.listIndex),
      cardIndex: Number(card.dataset.cardIndex),
      x: event.clientX,
      y: event.clientY + 6,
    };
    renderBoardCardActionMenu();
    return;
  }
  const lane = event.target.closest("[data-board-list]");
  if (lane) {
    event.preventDefault();
    closeBoardCardActionMenu();
    boardContextMenu = {
      type: "list",
      listIndex: Number(lane.dataset.listIndex),
      x: event.clientX,
      y: event.clientY + 6,
    };
    renderBoardListContextMenu();
    return;
  }
  closeBoardContextMenu();
  closeBoardCardActionMenu();
});

document.addEventListener("dragstart", (event) => {
  const tab = event.target.closest("[data-board-tab]");
  if (tab) {
    draggedBoardTabId = String(tab.dataset.id || "");
    tab.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedBoardTabId);
    return;
  }
  const card = event.target.closest("[data-board-card]");
  if (!card) return;
  closeBoardCardActionMenu();
  suppressBoardCardClick = false;
  draggedBoardCard = { listIndex: Number(card.dataset.listIndex), cardIndex: Number(card.dataset.cardIndex) };
  card.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `${draggedBoardCard.listIndex}:${draggedBoardCard.cardIndex}`);
});

document.addEventListener("dragend", (event) => {
  const endedCardDrag = Boolean(event.target.closest("[data-board-card]"));
  event.target.closest("[data-board-tab]")?.classList.remove("dragging");
  event.target.closest("[data-board-card]")?.classList.remove("dragging");
  document.querySelectorAll(".board-tab.drag-over, .board-lane.drag-over").forEach((item) => item.classList.remove("drag-over"));
  draggedBoardTabId = "";
  draggedBoardCard = null;
  if (endedCardDrag) {
    suppressBoardCardClick = true;
    setTimeout(() => { suppressBoardCardClick = false; }, 80);
  }
});

document.addEventListener("dragover", (event) => {
  const tab = event.target.closest("[data-board-tab]");
  if (tab && draggedBoardTabId && String(tab.dataset.id || "") !== draggedBoardTabId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    tab.classList.add("drag-over");
    return;
  }
  const lane = event.target.closest(".board-lane");
  if (!lane || !draggedBoardCard) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  lane.classList.add("drag-over");
});

document.addEventListener("dragleave", (event) => {
  const tab = event.target.closest("[data-board-tab]");
  if (tab && !tab.contains(event.relatedTarget)) tab.classList.remove("drag-over");
  const lane = event.target.closest(".board-lane");
  if (lane && !lane.contains(event.relatedTarget)) lane.classList.remove("drag-over");
});

document.addEventListener("drop", async (event) => {
  const tab = event.target.closest("[data-board-tab]");
  if (tab && draggedBoardTabId) {
    event.preventDefault();
    tab.classList.remove("drag-over");
    const source = document.querySelector(`#board-tabs [data-board-tab][data-id="${CSS.escape(draggedBoardTabId)}"]`);
    const tabs = document.getElementById("board-tabs");
    if (source && tabs && source !== tab) {
      const rect = tab.getBoundingClientRect();
      tabs.insertBefore(source, event.clientX > rect.left + rect.width / 2 ? tab.nextSibling : tab);
      saveBoardOrderFromTabs();
    }
    draggedBoardTabId = "";
    return;
  }
  const lane = event.target.closest(".board-lane");
  if (!lane || !draggedBoardCard) return;
  event.preventDefault();
  lane.classList.remove("drag-over");
  const board = getActiveBoard();
  const fromList = board?.listas?.[draggedBoardCard.listIndex];
  const toList = board?.listas?.[Number(lane.dataset.listIndex)];
  const card = fromList?.cartoes?.[draggedBoardCard.cardIndex];
  if (!board || !fromList || !toList || !card || fromList === toList) return;
  resetBoardCardFormIfEditing(draggedBoardCard.listIndex, draggedBoardCard.cardIndex);
  fromList.cartoes.splice(draggedBoardCard.cardIndex, 1);
  toList.cartoes.push(card);
  await persistBoard(board);
});

HubModules.register({
  ...quadrosRepository,
  view: "quadros",
  silent: true,
  render: renderBoards,
});
