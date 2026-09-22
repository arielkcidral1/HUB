function toValidDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  if (!value) return "Hoje";
  const parsed = toValidDate(value);
  if (!parsed) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value) {
  if (!value) return "Hoje";
  const parsed = toValidDate(value);
  if (!parsed) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getChatMessageDate(value) {
  if (!value) return "";
  if (value === "Hoje") return todayLabel();

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return formatDate(new Date(Number(year), Number(month) - 1, Number(day)).toISOString());
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return formatDate(parsed.toISOString());

  return "";
}

function getChatMessageTimeLabel(value) {
  if (!value) return "";
  const match = String(value).match(/(\d{2}:\d{2})/);
  if (match) return match[1];
  return value === "Hoje" ? "" : String(value);
}

function getChatMessageTime(value) {
  if (!value || value === "Hoje") return 0;

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  return 0;
}

function compareChatMessagesOldestFirst(a, b) {
  const timeDiff = getChatMessageTime(a.sortAt || a.createdAt) - getChatMessageTime(b.sortAt || b.createdAt);
  if (timeDiff !== 0) return timeDiff;

  const orderDiff = Number(a._clientOrder || 0) - Number(b._clientOrder || 0);
  if (orderDiff !== 0) return orderDiff;

  const idA = Number(a.id);
  const idB = Number(b.id);
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;
  return 0;
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const DATE_MASK_MAX_YEAR = 2026;

function formatMaskedDate(value) {
  const raw = String(value || "");
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const normalized = isoMatch ? `${isoMatch[3]}${isoMatch[2]}${isoMatch[1]}` : raw;
  const digits = normalized.replace(/\D/g, "").slice(0, 8);
  const formatDay = (v) => {
    if (!v) return "";
    if (v.length < 2) return v;
    return String(Math.min(Math.max(Number(v), 1), 31)).padStart(2, "0");
  };
  const formatMonth = (v) => {
    if (!v) return "";
    if (v.length < 2) return v;
    return String(Math.min(Math.max(Number(v), 1), 12)).padStart(2, "0");
  };
  const formatYear = (v) => {
    if (!v) return "";
    if (v.length < 4) return v;
    return String(Math.min(Number(v), DATE_MASK_MAX_YEAR)).padStart(4, "0");
  };
  const day   = formatDay(digits.slice(0, 2));
  const month = formatMonth(digits.slice(2, 4));
  const year  = formatYear(digits.slice(4, 8));
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

const formatDocumentDate = formatMaskedDate;
const formatEventoDate   = formatMaskedDate;

function applyDateMask(input) {
  if (input.dataset.dateMaskApplied === "true") return;
  input.type = "text";
  input.inputMode = "numeric";
  input.maxLength = 10;
  input.placeholder = "dd/mm/aaaa";
  input.dataset.dateMask = "true";
  input.dataset.docDate = "true";
  input.dataset.dateMaskApplied = "true";
  input.value = formatMaskedDate(input.value);
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isTodayLabel(value) {
  return value === todayLabel() || value === "Hoje";
}

function isTodayDateTimeLabel(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (isTodayLabel(text)) return true;
  const [datePart] = text.split(/[,\s]+/);
  return isTodayLabel(datePart);
}

function formatEpiItems(items) {
  return items
    .filter((item) => item.nome && item.quantidade)
    .map((item) => item.tipo === "cracha"
      ? `Crachá - ${item.nome} (Função: ${item.funcao || "Nao informado"}, CPF: ${item.cpf || "Nao informado"})`
      : `${item.nome} (${item.quantidade}${item.tamanho ? `, ${item.tamanho}` : ""})`)
    .join(", ");
}

function getItemTypeOptions(type) {
  return ITEM_TYPE_OPTIONS[type]?.options || EPI_OPTIONS;
}

function guessItemType(nome) {
  if (UNIFORM_OPTIONS.includes(nome)) return "uniforme";
  return "epi";
}

function renderItemTypeOptions(selectedType = "epi") {
  return Object.entries(ITEM_TYPE_OPTIONS)
    .map(([value, config]) => `<option value="${escapeHtml(value)}" ${value === selectedType ? "selected" : ""}>${escapeHtml(config.label)}</option>`)
    .join("");
}

function renderItemNameOptions(type = "epi", selectedName = "") {
  const baseOptions = getItemTypeOptions(type);
  const optionValues = selectedName && !baseOptions.includes(selectedName) ? [selectedName, ...baseOptions] : baseOptions;
  return '<option value="">Selecione</option>' + optionValues
    .map((item) => `<option value="${escapeHtml(item)}" ${item === selectedName ? "selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");
}

function renderItemSizeOptions(type = "epi", selectedSize = "", itemName = "") {
  const isShoe = /sapat/i.test(itemName);
  const sizeValues = isShoe
    ? ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"]
    : type === "uniforme"
    ? ["PP", "P", "M", "G", "GG", "XG", "EXG", "EXGG", "EXGGG", "EXGGGG"]
    : ["Nao se aplica", "PP", "P", "M", "G", "GG", "XG", "EXG", "EXGG", "EXGGG", "EXGGGG"];
  const size = sizeValues.includes(selectedSize) ? selectedSize : sizeValues[0];
  return sizeValues
    .map((item) => `<option value="${escapeHtml(item)}" ${item === size ? "selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");
}

function renderEpiRowFields(tipo = "epi", values = {}) {
  const { nome = "", quantidade = "", tamanho = "Nao se aplica", funcao = "", cpf = "" } = values;
  if (tipo === "cracha") {
    return `
      <label>Nome
        <input name="epi_nome[]" type="text" minlength="3" maxlength="120" placeholder="Nome completo" value="${escapeHtml(nome)}" required />
      </label>
      <label>Função
        <input name="cracha_funcao[]" type="text" maxlength="120" placeholder="Função" value="${escapeHtml(funcao)}" required />
      </label>
      <label>CPF
        <input name="cracha_cpf[]" type="text" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" value="${escapeHtml(cpf)}" required />
      </label>
    `;
  }
  return `
    <label>Nome
      <select name="epi_nome[]" data-item-select data-epi-select required>${renderItemNameOptions(tipo, nome)}</select>
    </label>
    <label>Quantidade
      <input name="epi_quantidade[]" type="number" min="1" step="1" placeholder="1" value="${escapeHtml(quantidade)}" required />
    </label>
    <label>Tamanho
      <select name="epi_tamanho[]" required>${renderItemSizeOptions(tipo, tamanho, nome)}</select>
    </label>
  `;
}

function readEpiItems(formElement) {
  return [...formElement.querySelectorAll(".epi-row")]
    .map((row) => {
      const tipo = row.querySelector('[name="epi_tipo[]"]')?.value || guessItemType(row.querySelector('[name="epi_nome[]"]')?.value.trim() || "");
      if (tipo === "cracha") {
        return {
          tipo,
          nome: row.querySelector('[name="epi_nome[]"]')?.value.trim() || "",
          funcao: row.querySelector('[name="cracha_funcao[]"]')?.value.trim() || "",
          cpf: row.querySelector('[name="cracha_cpf[]"]')?.value.trim() || "",
          quantidade: "1",
          tamanho: "",
        };
      }
      return {
        tipo,
        nome: row.querySelector('[name="epi_nome[]"]')?.value.trim() || "",
        quantidade: row.querySelector('[name="epi_quantidade[]"]')?.value.trim() || "",
        tamanho: row.querySelector('[name="epi_tamanho[]"]')?.value.trim() || "",
      };
    })
    .filter((item) => item.nome && item.quantidade);
}

function hasFullName(value) {
  return /\S+\s+\S+/.test(String(value || "").trim());
}

function readChamadoCollaborators(formElement) {
  return [...formElement.querySelectorAll("[data-chamado-collaborator]")]
    .map((block) => {
      const colaborador = block.querySelector('[name="chamado_colaborador[]"]')?.value.trim() || "";
      const itens = readEpiItems(block);
      return { colaborador, itens };
    })
    .filter((group) => group.colaborador && group.itens.length);
}

function flattenCollaboratorItems(groups) {
  return (groups || []).flatMap((group) =>
    (group.itens || []).map((item) => ({
      ...item,
      nome: `${group.colaborador} - ${item.nome}`,
    }))
  );
}

function createEpiRow(nome = "", quantidade = "") {
  const tipo = guessItemType(nome);
  return `
    <div class="epi-row">
      <label>Tipo
        <select name="epi_tipo[]" data-item-type-select required>${renderItemTypeOptions(tipo)}</select>
      </label>
      <label>Nome
        <select name="epi_nome[]" data-item-select required>${renderItemNameOptions(tipo, nome)}</select>
      </label>
      <label>Quantidade
        <input name="epi_quantidade[]" type="number" min="1" step="1" placeholder="1" value="${escapeHtml(quantidade)}" required />
      </label>
      <button class="danger-button remove-epi" type="button" aria-label="Remover EPI">Remover</button>
    </div>
  `;
}

function createMaloteItemRow(item = {}) {
  return createChamadoEpiRow(item.nome || "", item.quantidade || "", item.tamanho || "Nao se aplica", item.tipo || "", item.funcao || "", item.cpf || "");
}

function createChamadoCollaboratorBlock(group = {}) {
  const itens = group.itens?.length ? group.itens : [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }];
  return `
    <div class="malote-collaborator" data-chamado-collaborator>
      <div class="item-topline">
        <label>Colaborador que irá receber
          <input name="chamado_colaborador[]" type="text" minlength="3" maxlength="120" pattern="\\S+\\s+\\S+.*" placeholder="Nome e sobrenome" autocomplete="off" value="${escapeHtml(group.colaborador || "")}" required />
        </label>
        <button class="danger-button remove-chamado-collaborator" type="button" aria-label="Remover colaborador">Remover colaborador</button>
      </div>
      <div class="malote-collaborator-items" data-chamado-collaborator-items>
        ${itens.map((item) => createMaloteItemRow(item)).join("")}
      </div>
      <button class="secondary-link add-chamado-item" type="button">Adicionar item para este colaborador</button>
    </div>
  `;
}

function createChamadoEpiRow(nome = "", quantidade = "", tamanho = "Nao se aplica", tipoOverride = "", funcao = "", cpf = "") {
  const tipo = tipoOverride || guessItemType(nome);

  return `
    <div class="epi-row">
      <label>Tipo
        <select name="epi_tipo[]" data-item-type-select required>${renderItemTypeOptions(tipo)}</select>
      </label>
      <span class="epi-row-fields" data-epi-row-fields>${renderEpiRowFields(tipo, { nome, quantidade, tamanho, funcao, cpf })}</span>
      <button class="danger-button remove-epi" type="button" aria-label="Remover item">Remover</button>
    </div>
  `;
}

function populateEpiSelects() {
  document.querySelectorAll("[data-item-select], [data-epi-select]").forEach((select) => {
    const currentValue = select.value;
    const row = select.closest(".epi-row");
    const type = row?.querySelector('[name="epi_tipo[]"]')?.value || guessItemType(currentValue);
    select.innerHTML = renderItemNameOptions(type, currentValue);
    if (currentValue) select.value = currentValue;
  });
}

function resetEpiRows(items = [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  list.innerHTML = items.length
    ? items.map((item) => createChamadoEpiRow(item.nome, item.quantidade, item.tamanho || "Nao se aplica")).join("")
    : createChamadoEpiRow();
}

function resetChamadoCollaborators(groups = [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  const safeGroups = groups.length ? groups : [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }];
  list.innerHTML = safeGroups.map((group) => createChamadoCollaboratorBlock(group)).join("");
}

function parseEpiItems(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  const items = [];
  const pattern = /([^,(]+?)\s*\(([^)]*)\)\s*,?/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const details = String(match[2] || "").split(",").map((item) => item.trim());
    items.push({
      nome: String(match[1] || "").trim(),
      quantidade: details[0] || "1",
      tamanho: details[1] || "Nao se aplica",
    });
  }

  if (items.length) return items.filter((item) => item.nome);

  return text
    .split(/\n|;/)
    .map((part) => ({
      nome: part.trim(),
      quantidade: "1",
      tamanho: "Nao se aplica",
    }))
    .filter((item) => item.nome);
}

function todayLabel() {
  return formatDate(`${getLocalDateKey()}T00:00:00`);
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatEventDate(value) {
  if (!value) return "Sem data";
  const parsed = toValidDate(`${value}T00:00:00`);
  if (!parsed) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function formatEventTime(value) {
  if (!value) return "00:00";
  const text = String(value);
  const match = text.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : text;
}

function formatWeekday(value) {
  if (!value) return "";
  const parsed = toValidDate(`${value}T00:00:00`);
  if (!parsed) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(parsed);
}

