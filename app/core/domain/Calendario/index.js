// Dominio: feriados de Joinville, aniversarios (planilha + eventos editados), classificacao e
// montagem de cartoes de evento. Le dados globais (data.eventos, data.usuarios) mas sem DOM.

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function dateKeyFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getJoinvilleHolidayMap(year) {
  const easter = getEasterDate(year);
  const goodFriday = addDays(easter, -2);
  const corpusChristi = addDays(easter, 60);
  const holidays = [
    [dateKeyFromParts(year, 1, 1), "Ano-novo"],
    [dateKeyFromParts(year, 3, 9), "Aniversario de Joinville"],
    [dateKeyFromParts(year, goodFriday.getMonth() + 1, goodFriday.getDate()), "Sexta-feira Santa"],
    [dateKeyFromParts(year, 4, 21), "Tiradentes"],
    [dateKeyFromParts(year, 5, 1), "Dia do Trabalhador"],
    [dateKeyFromParts(year, corpusChristi.getMonth() + 1, corpusChristi.getDate()), "Corpus Christi"],
    [dateKeyFromParts(year, 9, 7), "Independencia do Brasil"],
    [dateKeyFromParts(year, 10, 12), "Nossa Senhora Aparecida"],
    [dateKeyFromParts(year, 11, 2), "Finados"],
    [dateKeyFromParts(year, 11, 15), "Proclamacao da Republica"],
    [dateKeyFromParts(year, 11, 20), "Consciencia Negra"],
    [dateKeyFromParts(year, 12, 25), "Natal"],
  ];
  return new Map(holidays);
}

function getHolidayForDate(date) {
  if (!date) return null;
  return getJoinvilleHolidayMap(Number(date.slice(0, 4))).get(date) || null;
}

function getCompanyBirthdayEvents() {
  const birthdays = Array.isArray(window.HUB_COMPANY_BIRTHDAYS) ? window.HUB_COMPANY_BIRTHDAYS : [];
  const visibleYear = visibleCalendarDate instanceof Date ? visibleCalendarDate.getFullYear() : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const years = [...new Set([currentYear, currentYear + 1, visibleYear])].filter((year) => year <= 2026);
  const seenBirthdayNames = new Set();
  const editedBirthdayNames = new Set((data.eventos || [])
    .map((item) => item.systemBirthdaySource || "")
    .filter(Boolean)
    .map((name) => normalizeLoginName(name)));
  return years.flatMap((year) => birthdays.flatMap((item, index) => {
    const birthDate = String(item.nascimento || "");
    const admissionDate = String(item.admissao || "");
    const birthMonthDay = birthDate.slice(5);
    const admissionMonthDay = admissionDate.slice(5);
    const birthEventDate = /^\d{2}-\d{2}$/.test(birthMonthDay) ? `${year}-${birthMonthDay}` : "";
    const companyEventDate = /^\d{2}-\d{2}$/.test(admissionMonthDay) ? `${year}-${admissionMonthDay}` : "";
    const nome = String(item.nome || "").trim();
    const normalizedName = normalizeLoginName(nome);
    const nameKey = `${year}:${normalizedName}`;
    if (!nome || seenBirthdayNames.has(nameKey) || editedBirthdayNames.has(normalizedName)) return [];
    seenBirthdayNames.add(nameKey);
    const usuario = (data.usuarios || []).find((user) => normalizeLoginName(user.nome) === normalizeLoginName(nome));
    const unidade = item.unidade || usuario?.unidade || usuario?.cargoUnidade || "";
    return [
      {
        id: `birthday-${year}-${index}`,
        titulo: "Aniversário",
        data: birthEventDate,
        horario: "",
        responsavel: "",
        tipo: "Aniversário",
        descricao: nome,
        aniversariante: nome,
        unidade,
        createdBy: "Planilha de aniversariantes",
        createdAt: birthEventDate,
        sortAt: birthEventDate,
        systemBirthday: true,
      },
      {
        id: `company-birthday-${year}-${index}`,
        titulo: "Aniversário de empresa",
        data: companyEventDate,
        horario: "",
        responsavel: "",
        tipo: "Aniversário de empresa",
        descricao: nome,
        aniversariante: nome,
        unidade,
        admissao: admissionDate,
        createdBy: "Planilha de aniversariantes",
        createdAt: companyEventDate,
        sortAt: companyEventDate,
        systemBirthday: true,
      },
    ];
  })).filter((item) => item.data && item.aniversariante);
}

function isBirthdayEvent(itemOrType = "") {
  const type = typeof itemOrType === "object" ? itemOrType.tipo : itemOrType;
  return normalizeEventType(type).startsWith("aniversario");
}

function isCompanyBirthdayEvent(item = {}) {
  return normalizeEventType(item.tipo) === "aniversario de empresa";
}

function getEventDisplayTitle(item = {}) {
  if (isCompanyBirthdayEvent(item)) return "Aniversário de empresa";
  if (isBirthdayEvent(item)) return "Aniversário";
  return item.titulo || "Evento";
}

function getCurrentEventAccessNames() {
  const user = getCurrentUserRecord?.() || {};
  return [
    getCurrentUserName?.(),
    currentUserProfile?.nome,
    currentAuthUser?.user_metadata?.nome,
    currentAuthUser?.user_metadata?.name,
    currentAuthUser?.email,
    user.nome,
    user.email,
  ]
    .map((value) => normalizeLoginName(value))
    .filter(Boolean);
}

function canCurrentUserAccessEventRecord(item = {}) {
  if (isRhUser() || isCeoUser() || hasFredericoLevelAccess()) return true;
  if (!isManagerUser()) return true;
  if (isBirthdayEvent(item)) return true;
  const author = normalizeLoginName(item.createdBy || "");
  return Boolean(author && getCurrentEventAccessNames().includes(author));
}

function getAllEvents() {
  return [...(data.eventos || []), ...getCompanyBirthdayEvents()]
    .filter((item) => !isCompanyBirthdayEvent(item) && !String(item.id || "").startsWith("company-birthday-"))
    .filter((item) => canCurrentUserAccessEventRecord(item));
}

function findCalendarEventById(id) {
  return getAllEvents().find((item) => String(item.id) === String(id));
}

function getSortedEvents() {
  return getAllEvents()
    .slice()
    .sort((a, b) => {
      const dateCompare = String(a.data || "").localeCompare(String(b.data || ""));
      if (dateCompare) return dateCompare;
      const aBirthday = isBirthdayEvent(a);
      const bBirthday = isBirthdayEvent(b);
      if (aBirthday !== bBirthday) return aBirthday ? 1 : -1;
      return String(a.horario || "00:00").localeCompare(String(b.horario || "00:00"));
    });
}

function getEventTypeClass(item = {}) {
  const type = normalizeEventType(item.tipo);
  if (type.startsWith("aniversario")) return "event-type-birthday";
  if (type === "entrevista") return "event-type-interview";
  return "";
}

function getEventTagClass(item = {}) {
  const typeClass = getEventTypeClass(item);
  return typeClass ? `event-tag ${typeClass}` : "";
}

function getEventIcon(item = {}) {
  if (isCompanyBirthdayEvent(item)) return { icon: "AE", className: "event-icon-company", label: "Aniversário de empresa" };
  if (isBirthdayEvent(item)) return { icon: "AN", className: "event-icon-birthday", label: "Aniversário" };
  if (normalizeEventType(item.tipo) === "entrevista") return { icon: "EN", className: "event-icon-interview", label: "Entrevista" };
  return { icon: "EV", className: "event-icon-default", label: "Evento" };
}

function dayHasEventType(events = [], type) {
  return events.some((item) => type === "aniversario" ? isBirthdayEvent(item) : normalizeEventType(item.tipo) === type);
}

function dayHasNonBirthdayEvent(events = []) {
  return events.some((item) => !isBirthdayEvent(item));
}

function getEventScheduleMeta(item = {}) {
  if (isBirthdayEvent(item)) return "Dia inteiro";
  return `${formatEventTime(item.horario)} | Responsavel: ${item.responsavel || "Nao informado"}`;
}

function getBirthdayPerson(item = {}) {
  return String(item.aniversariante || item.descricao || "").trim();
}

function getBirthdayUnit(item = {}) {
  const directUnit = String(item.unidade || "").trim();
  if (directUnit) return getCanonicalUnit(directUnit);
  const name = getBirthdayPerson(item);
  const usuario = (data.usuarios || []).find((user) => normalizeLoginName(user.nome) === normalizeLoginName(name));
  return getCanonicalUnit(usuario?.unidade || usuario?.cargoUnidade || "");
}

function renderEventTitle(item = {}) {
  const isBirthday = isBirthdayEvent(item);
  const title = isBirthday ? getEventDisplayTitle(item) : item.titulo;
  return `<p class="item-title">${escapeHtml(title || "Evento")}</p>`;
}

function renderEventDescription(item = {}, className = "") {
  if (isBirthdayEvent(item)) {
    const aniversariante = getBirthdayPerson(item);
    const unidade = getBirthdayUnit(item);
    const lines = [
      aniversariante ? `${isCompanyBirthdayEvent(item) ? "Colaborador" : "Aniversariante"}: ${escapeHtml(aniversariante)}` : "",
      unidade ? `Unidade: ${escapeHtml(unidade)}` : "",
    ].filter(Boolean);
    return lines.length ? `<p${className ? ` class="${className}"` : ""}>${lines.join("<br>")}</p>` : "";
  }
  const description = String(item.descricao || "").trim();
  const text = description || "Sem observacoes adicionais.";
  const classAttribute = className ? ` class="${className}"` : "";
  return `<p${classAttribute}>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function getEventSummary(item = {}) {
  if (isBirthdayEvent(item)) {
    const person = getBirthdayPerson(item);
    const unit = getBirthdayUnit(item);
    return [person, unit].filter(Boolean).join(" | ") || formatEventDate(item.data);
  }
  const description = String(item.descricao || "").trim().replace(/\s+/g, " ");
  return description || getEventScheduleMeta(item);
}

function renderCalendarEventCard(item = {}, tagName = "article", extraClass = "") {
  const summary = getEventSummary(item);
  const escapedId = escapeHtml(item.id);
  const eventIcon = getEventIcon(item);
  return `
    <${tagName} class="calendar-event-block ${extraClass} ${getEventTypeClass(item)}" data-event-card="true" data-action="visualizar-evento" data-id="${escapedId}" role="button" tabindex="0">
      <div class="item-topline">
        <div class="calendar-event-heading">
          <span class="event-icon ${eventIcon.className}" aria-label="${escapeHtml(eventIcon.label)}">${escapeHtml(eventIcon.icon)}</span>
          ${renderEventTitle(item)}
        </div>
      </div>
      <p class="calendar-event-date">${escapeHtml(formatEventDate(item.data))}</p>
      <p class="calendar-event-summary">${escapeHtml(summary)}</p>
    </${tagName}>
  `;
}

function getEventListMeta(item = {}) {
  if (isBirthdayEvent(item)) return `Data: ${formatEventDate(item.data)}`;
  return `${formatEventDate(item.data)} | ${getEventScheduleMeta(item)}`;
}

function getCurrentWeekDates() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return getLocalDateKey(date);
  });
}

function getUpcomingEvents() {
  const today = getLocalDateKey();
  const weekDates = getCurrentWeekDates();
  const maxDateKey = weekDates[weekDates.length - 1];
  return getSortedEvents().filter((item) => !isArchivedRecord(item) && !isBirthdayEvent(item) && item.data && item.data >= today && item.data <= maxDateKey);
}

function getCompactAgendaItems(events = []) {
  const items = [];
  const birthdayGroups = new Map();

  events.forEach((item) => {
    if (!isBirthdayEvent(item)) {
      items.push({ kind: "event", event: item, dateTime: item.sortAt || item.data || "", priority: 0 });
      return;
    }

    const key = item.data || "";
    if (!birthdayGroups.has(key)) birthdayGroups.set(key, []);
    birthdayGroups.get(key).push(item);
  });

  birthdayGroups.forEach((birthdays, date) => {
    items.push({ kind: "birthdays", events: birthdays, date, dateTime: date, priority: 1 });
  });

  return items.sort((a, b) => {
    const dateCompare = String(a.dateTime || "").localeCompare(String(b.dateTime || ""));
    if (dateCompare) return dateCompare;
    return (a.priority || 0) - (b.priority || 0);
  });
}

function renderCompactAgendaItem(item) {
  if (item.kind !== "birthdays") {
    const event = item.event || {};
    return renderCalendarEventCard(event, "li", "calendar-event-dashboard-block");
  }

  const birthdays = item.events || [];
  const title = birthdays.length === 1 ? getEventDisplayTitle(birthdays[0]) : `${birthdays.length} aniversários`;
  return `
    <li class="calendar-event-block calendar-event-dashboard-block event-type-birthday compact-birthday-group">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(title)}</p>
        <span class="calendar-event-date">${escapeHtml(formatEventDate(item.date))}</span>
      </div>
      <div class="birthday-chip-list">
        ${birthdays.map((birthday) => `<button type="button" data-action="visualizar-evento" data-id="${escapeHtml(birthday.id)}">${escapeHtml(getBirthdayPerson(birthday))}</button>`).join("")}
      </div>
    </li>
  `;
}

function renderEventAudit(item) {
  return `
    <span>Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}</span>
    ${item.updatedBy ? `<span>Editado por ${escapeHtml(item.updatedBy)}</span>` : ""}
  `;
}

function isEventInMonth(item, baseDate = new Date()) {
  if (!item.data) return false;
  const eventDate = new Date(`${item.data}T00:00:00`);
  return eventDate.getFullYear() === baseDate.getFullYear() && eventDate.getMonth() === baseDate.getMonth();
}

function isEventInCurrentMonth(item) {
  return isEventInMonth(item);
}
