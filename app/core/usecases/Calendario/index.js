// Casos de uso: visualizar, editar, excluir e abrir o menu de contexto de um evento; ver os eventos do dia.

function visualizarEvento(id) {
  const item = getAllEvents().find((eventItem) => String(eventItem.id) === String(id));
  if (!item) return;

  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  const eventIcon = getEventIcon(item);
  overlay.innerHTML = `
    <div class="modal-card calendar-event-modal">
      <div class="modal-header info calendar-event-modal-title">
        <span class="event-icon ${eventIcon.className}" aria-label="${escapeHtml(eventIcon.label)}">${escapeHtml(eventIcon.icon)}</span>
        ${escapeHtml(getEventDisplayTitle(item))}
      </div>
      <div class="modal-body">
        <div class="calendar-event-modal-meta">
          <span class="tag ${getEventTagClass(item)}">${escapeHtml(item.tipo)}</span>
          <span>${escapeHtml(formatEventDate(item.data))}</span>
          <span>${escapeHtml(getEventScheduleMeta(item))}</span>
        </div>
        ${renderEventDescription(item, "calendar-event-modal-description")}
        <p class="item-meta event-audit-line">${renderEventAudit(item)}</p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="close-modal">Fechar</button>
      </div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function showDayEventsModal(date) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const dayEvents = getSortedEvents().filter((item) => item.data === date);
  const dayNumber = String(new Date(`${date}T00:00:00`).getDate()).padStart(2, "0");
  const holiday = getHolidayForDate(date);
  const title = `Agenda de ${formatEventDate(date)}`;
  const holidayContent = holiday ? `<p class="day-holiday-note"><strong>Feriado:</strong> ${escapeHtml(holiday)}</p>` : "";
  const eventContent = dayEvents.length
    ? dayEvents
      .map((item) => `
          <article class="day-event-card ${getEventTypeClass(item)}" data-event-card="true" data-id="${escapeHtml(item.id)}">
            <div class="item-topline">
              ${renderEventTitle(item)}
              <span class="tag ${getEventTagClass(item)}">${escapeHtml(item.tipo)}</span>
            </div>
            ${renderEventDescription(item, "day-event-description")}
            <p class="item-meta">${escapeHtml(getEventListMeta(item))}</p>
            <p class="item-meta event-audit-line">${renderEventAudit(item)}</p>
          </article>
        `)
        .join("")
    : `<p class="empty-state day-empty-state">Nenhum evento dia (${escapeHtml(dayNumber)})</p>`;
  const content = `${holidayContent}${eventContent}`;

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card day-events-modal">
      <div class="modal-header info">${escapeHtml(title)}</div>
      <div class="modal-body day-events-body">${content}</div>
      <div class="modal-footer">
        <button class="primary-button" type="button" data-action="close-modal">Fechar</button>
      </div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  overlay.querySelector("[data-modal-close]").focus();
}

function editarEvento(id) {
  const evento = findCalendarEventById(id);
  const form = document.getElementById("evento-form");
  if (!evento || !form) return;

  activateView("calendario");
  form.elements.id.value = evento.systemBirthday ? "" : evento.id;
  form.dataset.editEventId = String(evento.id || "");
  form.elements.titulo.value = evento.titulo || "";

  form.elements.data.value = formatEventoDate(evento.data || "");
  form.elements.horario.value = evento.horario || "";
  form.elements.responsavel.value = evento.responsavel || "";
  form.elements.tipo.value = evento.tipo || "Evento";
  form.elements.descricao.value = evento.descricao || "";
  if (form.elements.aniversariante) {
    form.elements.aniversariante.value = isBirthdayEvent(evento) ? getBirthdayPerson(evento) : "";
  }
  if (form.elements.unidade_aniversariante) {
    setFieldValue(form.elements.unidade_aniversariante, isBirthdayEvent(evento) ? getBirthdayUnit(evento) : "");
  }
  form.elements.tipo?.dispatchEvent(new Event("change"));
  document.getElementById("cancelar-edicao-evento")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.querySelector("input, select, textarea")?.focus({ preventScroll: true });
}

async function excluirEvento(id) {
  const evento = findCalendarEventById(id);
  if (!evento) return;

  showConfirmActionModal({
    title: "Deletar evento",
    text: `Tem certeza que deseja deletar o evento "${evento.titulo}"?`,
    confirmText: "Deletar",
    danger: true,
    onConfirm: async () => {
      await deleteItem("eventos", id);
    },
  });
}

function openEventContextMenu(event, id) {
  document.getElementById("event-context-menu")?.remove();
  const item = findCalendarEventById(id);
  if (!item) return;
  const canDelete = !item.systemBirthday;
  const menu = document.createElement("div");
  menu.id = "event-context-menu";
  menu.className = "board-context-menu event-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.innerHTML = `
    <button type="button" data-event-menu-action="edit">Editar evento</button>
    ${canDelete ? '<button type="button" class="danger" data-event-menu-action="delete">Deletar evento</button>' : ""}
  `;
  menu.addEventListener("click", (clickEvent) => {
    const actionButton = clickEvent.target.closest("[data-event-menu-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.eventMenuAction;
    menu.remove();
    if (action === "edit") editarEvento(id);
    if (action === "delete") excluirEvento(id);
  });
  document.body.appendChild(menu);
}
