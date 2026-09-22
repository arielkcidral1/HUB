// Pagina: calendario mensal, agenda compacta do dashboard, formulario de evento e navegacao de mes.

function eventoDateToIso(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

let dashboardCalendarViewMode = "week";
let visibleCalendarDate = new Date();

function renderDashboardCalendar(upcomingEvents = getUpcomingEvents()) {
  const strip = document.getElementById("dashboard-calendar-strip");
  const list = document.getElementById("dashboard-events-list");
  const title = document.getElementById("dashboard-calendar-title");
  const toggleButton = document.getElementById("toggle-dashboard-calendar-view");
  if (!strip || !list) return;

  const today = new Date();
  const currentMonth = visibleCalendarDate.getMonth();
  const currentYear = visibleCalendarDate.getFullYear();
  const weekDates = getCurrentWeekDates();
  const leadingDays = new Date(currentYear, currentMonth, 1).getDay();
  const monthDates = Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, index) => {
    const date = new Date(currentYear, currentMonth, index + 1);
    return getLocalDateKey(date);
  });
  const visibleDates = dashboardCalendarViewMode === "week" ? weekDates : monthDates;
  const visibleEvents =
    dashboardCalendarViewMode === "week"
      ? getSortedEvents().filter((item) => visibleDates.includes(item.data))
      : getSortedEvents().filter((item) => isEventInMonth(item, visibleCalendarDate));

  if (title) {
    const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(visibleCalendarDate);
    title.textContent = dashboardCalendarViewMode === "week" ? "Agenda da semana" : `Agenda do mes - ${monthLabel}`;
  }
  if (toggleButton) toggleButton.textContent = dashboardCalendarViewMode === "week" ? "Ver agenda do mes" : "Ver agenda da semana";
  strip.classList.toggle("calendar-strip-month", dashboardCalendarViewMode === "month");

  const todayKey = getLocalDateKey(today);
  const monthHeader = dashboardCalendarViewMode === "month"
    ? '<span class="calendar-strip-weekday">Dom</span><span class="calendar-strip-weekday">Seg</span><span class="calendar-strip-weekday">Ter</span><span class="calendar-strip-weekday">Qua</span><span class="calendar-strip-weekday">Qui</span><span class="calendar-strip-weekday">Sex</span><span class="calendar-strip-weekday">Sab</span>'
    : "";
  const leadingCells = dashboardCalendarViewMode === "month"
    ? Array.from({ length: leadingDays }, () => '<div class="calendar-day muted"></div>').join("")
    : "";
  strip.innerHTML = monthHeader + leadingCells + visibleDates
    .map((date) => {
      const dayEvents = getSortedEvents().filter((item) => item.data === date);
      const holiday = getHolidayForDate(date);
      const isToday = date === todayKey;
      const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
      const hasBirthday = dayHasEventType(dayEvents, "aniversario");
      const hasMainEvent = dayHasNonBirthdayEvent(dayEvents);
      const hasInterview = dayHasEventType(dayEvents, "entrevista");
      return `
        <button class="calendar-day ${isWeekend ? "is-weekend" : ""} ${isToday ? "today" : ""} ${dayEvents.length ? "has-event" : ""} ${holiday ? "is-holiday" : ""} ${hasBirthday && !hasMainEvent ? "has-birthday" : ""} ${hasInterview ? "has-interview" : ""}" type="button" data-date="${escapeHtml(date)}" aria-label="Ver eventos de ${escapeHtml(formatEventDate(date))}">
          <span class="calendar-weekday-label">${escapeHtml(formatWeekday(date))}</span>
          <strong>${escapeHtml(new Date(`${date}T00:00:00`).getDate())}</strong>
          ${isToday ? `<span class="calendar-today-label">Hoje</span>` : ""}
          ${holiday ? `<span class="calendar-holiday-label" title="${escapeHtml(holiday)}">Feriado</span>` : ""}
          ${dayEvents.slice(0, 2).map((item) => `<span class="calendar-event-preview ${getEventTypeClass(item)}" data-event-card="true" data-id="${escapeHtml(item.id)}">${escapeHtml(item.titulo)}</span>`).join("")}
        </button>
      `;
    })
    .join("");

  if (!visibleEvents.length) {
    list.innerHTML = '<li><p class="empty-state">Nenhum evento proximo registrado.</p></li>';
    return;
  }

  list.innerHTML = getCompactAgendaItems(visibleEvents)
    .slice(0, dashboardCalendarViewMode === "week" ? 5 : 8)
    .map(renderCompactAgendaItem)
    .join("");
}

function renderCalendar() {
  const month = document.getElementById("calendar-month");
  if (!month) return;

  const today = new Date();
  const year = visibleCalendarDate.getFullYear();
  const monthIndex = visibleCalendarDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const title = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(visibleCalendarDate);
  const cells = [];
  const todayKey = getLocalDateKey(today);

  for (let index = 0; index < leadingDays; index += 1) {
    cells.push('<div class="calendar-cell muted"></div>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getSortedEvents().filter((item) => item.data === date);
    const holiday = getHolidayForDate(date);
    const isToday = date === todayKey;
    const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
    const hasBirthday = dayHasEventType(dayEvents, "aniversario");
    const hasMainEvent = dayHasNonBirthdayEvent(dayEvents);
    const hasInterview = dayHasEventType(dayEvents, "entrevista");
    cells.push(`
      <button class="calendar-cell ${isWeekend ? "is-weekend" : ""} ${isToday ? "today" : ""} ${dayEvents.length ? "has-event" : ""} ${holiday ? "is-holiday" : ""} ${hasBirthday && !hasMainEvent ? "has-birthday" : ""} ${hasInterview ? "has-interview" : ""}" type="button" data-date="${escapeHtml(date)}" aria-label="Ver eventos de ${escapeHtml(formatEventDate(date))}">
        <strong>${day}</strong>
        ${isToday ? `<span class="calendar-today-label">Hoje</span>` : ""}
        ${holiday ? `<span class="calendar-holiday-label" title="${escapeHtml(holiday)}">Feriado</span>` : ""}
        ${dayEvents.slice(0, 2).map((item) => `<span class="${getEventTypeClass(item)}" data-event-card="true" data-id="${escapeHtml(item.id)}">${escapeHtml(item.titulo)}</span>`).join("")}
      </button>
    `);
  }

  const visibleEvents = getSortedEvents().filter((item) => isEventInMonth(item, visibleCalendarDate));

  month.innerHTML = `
    <div class="calendar-title">${escapeHtml(title)}</div>
    <div class="calendar-weekdays">
      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span>
    </div>
    <div class="calendar-grid">${cells.join("")}</div>
  `;

  renderCards("eventos-list", visibleEvents, (item) => renderCalendarEventCard(item, "article", "calendar-event-manage-block"));
}

const eventoForm = document.getElementById("evento-form");
if (eventoForm) {
  const updateEventoFormByType = () => {
    const isBirthday = isBirthdayEvent(eventoForm.elements.tipo?.value);
    eventoForm.querySelectorAll("[data-event-title-field], [data-event-required-field], [data-event-optional-field]").forEach((field) => {
      field.hidden = isBirthday;
      field.querySelectorAll("input, textarea, select").forEach((input) => {
        if (input.name === "titulo" || input.name === "horario" || input.name === "responsavel") input.required = !isBirthday;
        if (isBirthday) {
          input.value = "";
          input.setCustomValidity?.("");
        }
      });
    });
    eventoForm.querySelectorAll("[data-event-birthday-field]").forEach((field) => {
      field.hidden = !isBirthday;
      field.querySelectorAll("input, select").forEach((input) => {
        input.required = isBirthday;
        if (!isBirthday) {
          input.value = "";
          input.setCustomValidity?.("");
        }
      });
    });
  };

  const eventoDataInput = eventoForm.elements.data;
  if (eventoDataInput) {
    eventoDataInput.value = formatEventoDate(eventoDataInput.value);
    eventoDataInput.addEventListener("input", (event) => {
      const input = event.target;
      const pos = input.selectionStart;
      const prev = input.value;
      const next = formatEventoDate(prev);
      input.value = next;

      const diff = next.length - prev.length;
      if (diff !== 0) input.setSelectionRange(pos + diff, pos + diff);
      input.setCustomValidity("");
    });
  }

  eventoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const id = form.get("id") || formElement.dataset.editEventId || "";

    const dataDisplay = String(form.get("data") || "");
    const dataIso = eventoDateToIso(dataDisplay);
    if (!dataIso) {
      eventoDataInput?.setCustomValidity("Informe a data no formato dd/mm/aaaa.");
      eventoDataInput?.reportValidity();
      return;
    }
    const year = Number(dataIso.split("-")[0]);
    if (year > 2026) {
      eventoDataInput?.setCustomValidity("O ano não pode ser superior a 2026.");
      eventoDataInput?.reportValidity();
      return;
    }
    eventoDataInput?.setCustomValidity("");

    const isBirthday = isBirthdayEvent(form.get("tipo"));
    const aniversariante = String(form.get("aniversariante") || "").trim();
    const unidadeAniversariante = String(form.get("unidade_aniversariante") || "").trim();
    const editingEvent = id ? findCalendarEventById(id) : null;
    const payload = {
      titulo: isBirthday ? getEventDisplayTitle({ tipo: form.get("tipo") }) : form.get("titulo"),
      data: dataIso,
      horario: isBirthday ? "" : form.get("horario"),
      responsavel: isBirthday ? "" : form.get("responsavel"),
      tipo: isBirthday ? getEventDisplayTitle({ tipo: form.get("tipo") }) : form.get("tipo"),
      descricao: isBirthday ? aniversariante : form.get("descricao"),
      unidade: isBirthday ? unidadeAniversariante : "",
      createdBy: editingEvent?.createdBy || getCurrentUserName(),
    };
    if (editingEvent?.systemBirthdaySource || editingEvent?.systemBirthday) {
      payload.systemBirthdaySource = editingEvent.systemBirthdaySource || getBirthdayPerson(editingEvent);
    }
    const editableId = editingEvent?.systemBirthday ? "" : id;
    const success = editableId ? await updateItem("eventos", editableId, { ...payload, updatedBy: getCurrentUserName() }) : await addItem("eventos", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      delete formElement.dataset.editEventId;
      document.getElementById("cancelar-edicao-evento")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Registrar evento";
      updateEventoFormByType();
    }
  });

  eventoForm.elements.tipo?.addEventListener("change", updateEventoFormByType);
  updateEventoFormByType();
}

document.getElementById("cancelar-edicao-evento")?.addEventListener("click", () => {
  if (!eventoForm) return;
  eventoForm.reset();
  eventoForm.elements.id.value = "";
  delete eventoForm.dataset.editEventId;
  document.getElementById("cancelar-edicao-evento").setAttribute("hidden", "");
  eventoForm.querySelector('button[type="submit"]').textContent = "Registrar evento";
  eventoForm.elements.tipo?.dispatchEvent(new Event("change"));
});

document.getElementById("toggle-dashboard-calendar-view")?.addEventListener("click", () => {
  dashboardCalendarViewMode = dashboardCalendarViewMode === "week" ? "month" : "week";
  renderDashboardCalendar();
});

document.getElementById("previous-calendar-month")?.addEventListener("click", () => {
  visibleCalendarDate = new Date(visibleCalendarDate.getFullYear(), visibleCalendarDate.getMonth() - 1, 1);
  renderCalendar();
  renderDashboardCalendar();
});

document.getElementById("next-calendar-month")?.addEventListener("click", () => {
  visibleCalendarDate = new Date(visibleCalendarDate.getFullYear(), visibleCalendarDate.getMonth() + 1, 1);
  renderCalendar();
  renderDashboardCalendar();
});

document.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-date]");
  if (!dayButton) return;
  showDayEventsModal(dayButton.dataset.date);
});

HubModules.register({
  ...calendarioRepository,
  view: "calendario",
  silent: true,
  render: renderCalendar,
});
