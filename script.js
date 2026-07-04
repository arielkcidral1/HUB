﻿const STORAGE_KEY = "hub-rh-data";
const DOCUMENT_RECORDS_KEY = "hub-document-records";
const CONTRACTOR_PENDING_DOCUMENTS_KEY = "hub-contractor-pending-documents";
const SESSION_KEY = "hub-rh-session";
const PUBLIC_CLIENT_ID_KEY = "hub-public-client-id";
const TEAM_USERS_KEY = "hub-team-users";
const TEAM_CREDENTIALS_KEY = "hub-team-credentials";
const READ_RH_MESSAGES_KEY = "hub-rh-read-message-ids";
const SENSITIVE_CLIENT_CACHE_KEYS = [
  STORAGE_KEY,
  DOCUMENT_RECORDS_KEY,
  TEAM_USERS_KEY,
  TEAM_CREDENTIALS_KEY,
  READ_RH_MESSAGES_KEY,
];
const RH_CHANNEL = "rh";
const USERS_TABLE = "hub_users";
const GENERAL_CHANNEL = "geral";
const MANAGER_GENERAL_CHANNEL = "geral-gerentes";
const CASHIER_GENERAL_CHANNEL = "geral-caixa";
const CHAT_POLL_PREFIX = "__HUB_POLL__:";
const RESUME_BUCKET = "hub-curriculos";
const RESUME_PUBLIC_PREFIX = "candidaturas";
const CONTRACTOR_DOCUMENTS_BUCKET = "hub-contratados-documentos";
const CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const RESUME_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const CHAT_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const CHAT_FILE_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const CHAT_FILE_MIME_ALIASES = new Map([
  ["audio/x-wav", "audio/wav"],
  ["audio/wave", "audio/wav"],
  ["audio/x-m4a", "audio/mp4"],
  ["audio/mp4", "audio/mp4"],
]);
const CHAT_FILE_EXTENSION_MIME_TYPES = new Map([
  ["mp3", "audio/mpeg"],
  ["wav", "audio/wav"],
  ["ogg", "audio/ogg"],
  ["webm", "audio/webm"],
  ["m4a", "audio/mp4"],
  ["mp4", "video/mp4"],
  ["mov", "video/quicktime"],
]);
const CHAT_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍",
  "🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣",
  "🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌",
  "😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯",
  "🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳",
  "🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩",
  "😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻",
  "👽","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","👋","🤚","🖐️","✋",
  "🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈",
  "👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐",
  "🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👂","🦻","👃","🧠",
  "🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","❤️","🧡","💛","💚","💙","💜",
  "🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
  "👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅",
  "🙆","💁","🙋","🧏","🙇","🤦","🤷","👮","🕵️","💂","👷","🫅","🤴","👸","👳",
  "👲","🧕","🤵","👰","🤰","🤱","👼","🎅","🤶","🦸","🦹","🧙","🧚","🧛","🧜",
  "🧝","🧞","🧟","💆","💇","🚶","🧍","🧎","🏃","💃","🕺","🧖","🧗","🤺","🏇",
  "⛷️","🏂","🏌️","🏄","🚣","🏊","⛹️","🏋️","🚴","🚵","🐶","🐱","🐭","🐹","🐰",
  "🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊",
  "🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄",
  "🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂",
  "🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳",
  "🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒",
  "🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🐓",
  "🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁",
  "🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀",
  "🎍","🪴","🎋","🍃","🍂","🍁","🍄","🐚","🪨","🌾","💐","🌷","🌹","🥀","🌺",
  "🌸","🌼","🌻","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️",
  "⛄","🌬️","💨","🌪️","🌈","☂️","☔","⚡","🔥","💧","🌊","🌙","⭐","🌟","✨",
  "☄️","🌌","🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑",
  "🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒",
  "🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇",
  "🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔",
  "🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚",
  "🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭",
  "🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","☕","🫖","🍵","🧃","🥤",
  "🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽️",
  "🥣","🥡","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🎱","🪀","🏓","🏸","🏒",
  "🏑","🥍","🏏","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷",
  "⛸️","🥌","🎿","🤼","🤸","🤾","🧘","🤽","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️",
  "🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺",
  "🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩","🚗","🚕","🚙","🚌","🚎",
  "🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🛺","🚲","🛴","🚨",
  "🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂",
  "🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵",
  "🚤","🛥️","🛳️","⛴️","🚢","⚓","🪝","⛽","🚧","🚦","🚥","🗺️","🗿","🗽","🗼",
  "🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻",
  "🏕️","⛺","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨",
  "🏪","🏫","🏩","💒","🏛️","⛪","🕌","🕍","🛕","🕋","⌚","📱","💻","⌨️","🖥️",
  "🖨️","🖱️","🖲️","🕹️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📞","☎️",
  "📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡",
  "🔋","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰",
  "💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤",
  "🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️",
  "🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬","🕳️","🩹","🩺","💊","💉","🩸","🧬",
  "🦠","🧫","🧪","🌡️","🧹","🪠","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪥",
  "🪒","🧽","🪣","🧴","🛎️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🛌","🧸","🪆","🖼️",
  "🪞","🪟","🛍️","🛒","🎁","🎈","🎏","🎀","🪄","🪅","🎊","🎉","🎎","🏮","🎐",
  "🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷️","🪧","📪","📫","📬","📭",
  "📮","📯","📜","📃","📄","📑","📊","📈","📉","🗒️","🗓️","📆","📅","🗑️","📇",
  "🗃️","🗳️","🗄️","📋","📁","📂","🗂️","🗞️","📰","📓","📔","📒","📕","📗","📘",
  "📙","📚","📖","🔖","🧷","🔗","📎","🖇️","📐","📏","🧮","📌","📍","✂️","🖊️",
  "🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓","💬","💭","🗯️",
  "💤","👣","🌀","🔔","🔕","📢","📣","🎵","🎶","➕","➖","➗","✖️","🟰","♾️",
  "‼️","⁉️","❓","❔","❕","❗","〰️","💱","💲","🔱","📛","🔰","⭕","✅","☑️",
  "✔️","❌","❎","➰","➿","〽️","✳️","✴️","❇️","©️","®️","™️","#️⃣","*️⃣","0️⃣",
  "1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","🔤","🔡","🔠","🆗",
  "🆕","🆓","🆒","🆙","🆖","🈁","🈂️","🈚","🈯","🈲","🈳","🈴","🈵","🈶","🈷️",
  "🉐","🉑","㊗️","㊙️","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪","🟥","🟧",
  "🟨","🟩","🟦","🟪","🟫","⬛","⬜","◼️","◻️","◾","◽","▪️","▫️","🔶","🔷",
  "🔸","🔹","🔺","🔻","💠","🔘","🔳","🔲","🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️",
  "🏴‍☠️","🇧🇷","🇺🇸","🇵🇹","🇪🇸","🇦🇷","🇮🇹","🇫🇷","🇩🇪","🇬🇧","🇯🇵","🇨🇳","🇨🇦","🇲🇽","🇨🇴",
  "🇨🇱",
];
const USER_SETTINGS_STORAGE_KEY = "hub-user-settings-v1";
const USER_SETTINGS_DEFAULTS = Object.freeze({
  hidePresence: false,
  blurChatPreviews: false,
  localPrivacyMode: false,
  compactMode: false,
  messageSize: "normal",
  showEmojiButton: true,
  enterToSend: true,
  notificationSound: false,
  desktopNotifications: false,
  dashboardNotificationBadges: true,
  keyboardShortcuts: true,
});
const DEFAULT_HUB_SUPABASE = {
  url: "https://nblfwesptlpetbwfmdqf.supabase.co",
  anonKey: "sb_publishable_zHawhaceNuAtRyTn3MRbmw_g_LFUGov",
  chatFilesBucket: "hub-chat-files",
  turnstileSiteKey: "",
};
const TABLES = {
  denuncias: "hub_denuncias",
  comunicados: "hub_chat_messages",
  malotes: "hub_malotes",
  chamados: "hub_chamados",
  vagas: "hub_vagas",
  eventos: "hub_eventos",
  vtRegistros: "hub_vt_registros",
  documentosContratados: "hub_documentos_contratados",
  candidaturas: "hub_candidaturas",
  usuarios: USERS_TABLE,
};
let publicVagaCargoFilter = "";
let publicVagaUnidadeFilter = "";
let chatAudioRecorder = null;
let chatAudioChunks = [];
let chatAudioStream = null;
let chatAudioStartedAt = 0;
let chatAudioTimer = null;
let chatAttachmentPreviewUrl = "";
let chatAttachmentPreviewUrls = [];
let chatSelectedFiles = [];
let chatAttachmentPreviewIndex = 0;

function getHubSupabaseConfig() {
  return {
    ...DEFAULT_HUB_SUPABASE,
    ...(window.HUB_SUPABASE || {}),
  };
}

const storageService = {
  removeLocalItem(key) {
    localStorage.removeItem(key);
  },
  getLocalItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erro ao ler do localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  },
  setLocalItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getSessionItem(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erro ao ler do sessionStorage (key: ${key}):`, error);
      return defaultValue;
    }
  },
  setSessionItem(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  removeSessionItem(key) {
    sessionStorage.removeItem(key);
  },
};

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const defaultData = {
  denuncias: [
    {
      id: generateUUID(),
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: "Relato anonimo recebido para avaliacao inicial do RH.",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  comunicados: [
    {
      id: generateUUID(),
      autor: "Marina Souza",
      mensagem: "Revisar pendencias de benefícios, vagas e entregas de EPI.",
      canal: GENERAL_CHANNEL,
      arquivo: null,
      createdAt: "Hoje",
    },
  ],
  malotes: [
    {
      id: generateUUID(),
      destino: "Unidade Norte",
      origem: "Almoxarifado Central",
      epis: "Luvas nitrilicas (10), oculos de protecao (5), protetor auricular (20)",
      status: "Entrega",
      createdAt: "Hoje",
    },
  ],
  chamados: [],
  vagas: [],
  eventos: [
    {
      id: generateUUID(),
      titulo: "Reuniao semanal do RH",
      data: getLocalDateKey(),
      horario: "09:00",
      responsavel: "Equipe RH",
      tipo: "Reuniao",
      descricao: "Alinhamento de prioridades da semana.",
      createdBy: "Sistema",
      createdAt: "Hoje",
    },
  ],
  vtRegistros: [],
  documentosContratados: [],
  candidaturas: [],
  usuarios: [],
};

let data = loadLocalData();
let supabaseClient = null;
let realtimeChannel = null;
let activeChatChannel = "";
let refreshTimer = null;
let refreshInProgress = false;
let documentRecords = loadDocumentRecords();
let readRhMessageIds = loadReadRhMessageIds();
let currentAuthUser = null;
let currentUserProfile = null;
const privateAvatarUrlCache = new Map();
const privateAvatarUrlRequests = new Map();
const chatMediaSignedUrlCache = new Map();
const TRANSPARENT_IMAGE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
let chamadosSelectionMode = false;
let showArchivedChamados = false;
let denunciasSelectionMode = false;
let showArchivedDenuncias = false;
let dashboardCalendarViewMode = "week";
let visibleCalendarDate = new Date();
let dashboardNotificationOffset = 0;
let visibleDashboardActivityItems = [];
let currentUserSettings = loadUserSettings();
let lastUnreadNotificationCount = 0;
let chatMessageFilterQuery = "";
let chatMessageFilterVisible = false;
window.editingDocId = null;

const documentLabels = {
  admissao: "Checklist de Admissao",
  ausencia: "Entrevista ausencia",
  desligamento: "Entrevista de Desligamento",
  beneficios: "Adesao plano saude e odonto",
  "feedback-operacional": "Feedback operacional",
  "feedback-fredy": "Feedback Fredy Pneus",
  ferias: "Solicitacao de Ferias",
  "movimentacao-pessoal": "MP - Movimentacao Pessoal",
  "requisicao-pessoal": "RP - Requisicao Pessoal",
  "solicitacao-desligamento": "SD - Solicitacao de Desligamento",
};

const UNIT_OPTIONS = [
  "1- MTZ",
  "2- SBS",
  "3- ITJ 1",
  "4- PLÇ",
  "5- GUA",
  "7- DPA JC",
  "9- DPA IRI",
  "10- JPL",
  "11- BC",
  "12- GCS GPO",
  "12- GCS JLLE",
  "13- JRG 1",
  "14- BRQ",
  "15- FLN",
  "17- FAC",
  "19- RNG 1",
  "20- BNU 1",
  "21- JRG 2",
  "22- TRINCA",
  "23- ITJ 2",
  "26- BNU 2",
  "28- ARA",
];

// Normaliza texto para comparação: remove acentos, caixa e espaços extras.
function normalizeUnitText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Vagas antigas podem ter sido gravadas com texto livre (ex: "JRG", "JGR").
// Aqui mapeamos esses valores legados para a opção oficial correspondente.
const UNIT_ALIASES = {
  jrg: "13- JRG 1",
  jgr: "13- JRG 1",
};

// Retorna o valor oficial da unidade (UNIT_OPTIONS) a partir de um valor
// gravado, mesmo que tenha sido salvo com grafia diferente ou sem o prefixo.
function getCanonicalUnit(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  const normalized = normalizeUnitText(raw);
  const exactMatch = UNIT_OPTIONS.find((option) => normalizeUnitText(option) === normalized);
  if (exactMatch) return exactMatch;
  if (UNIT_ALIASES[normalized]) return UNIT_ALIASES[normalized];
  return raw;
}

const EPI_OPTIONS = [
  "Luva PU",
  "Luva Pigmentada",
  "Luva de Raspa",
  "Luva nitrilica",
  "Oculos Transparente",
  "Oculos Verde",
  "Mascara com Filtro",
  "Respirador PFF2",
  "Protetor Auricular",
  "Protetor Auricular tipo concha",
  "Avental de Raspa",
  "Sapatão",
  "Luva de Vaqueta",
  "Creme de Proteção",
];

const UNIFORM_OPTIONS = [
  "Camiseta Operacional Fredy - Pneus",
  "Camiseta Chefe de Pátio - Fredy Pneus",
  "Moletom Operacional - Fredy Pneus",
  "Camisa Social Azul - Fredy Pneus",
  "Camisa Social Branca Fredy - Pneus",
  "Calça Operacional Fredy - Pneus",
  "Camiseta Operacional - GCS",
  "Camiseta Cinza Claro - GCS",
  "Camisa Polo - GCS",
  "Calça Operacional - GCS",
  "Bermuda Operacional - GCS",
  "Camiseta Operacional - JPL",
  "Camisa Polo - JPL",
  "Moletom Operacional - JPL",
  "Calça Operacional - JPL",
  "Camiseta - FAC",
];

const ITEM_TYPE_OPTIONS = {
  epi: {
    label: "EPIs",
    options: EPI_OPTIONS,
  },
  uniforme: {
    label: "Uniforme",
    options: UNIFORM_OPTIONS,
  },
};

function isLoginMatch(value, expected) {
  return String(value || "").trim() === String(expected || "").trim();
}

function normalizeLoginName(value) {
  return String(value || "").trim().toLowerCase();
}

function getLoginDisplayName(value) {
  const normalized = normalizeLoginName(value);
  return findLocalTeamUser(value)?.nome || String(value || "").trim();
}

function loadTeamUsersStore() {
  return storageService.getSessionItem(TEAM_USERS_KEY, []);
}

function saveTeamUsersStore(users) {
  storageService.setSessionItem(TEAM_USERS_KEY, users || []);
}

function loadTeamCredentialsStore() {
  return [];
}

function saveTeamCredentialsStore(users) {
  storageService.removeLocalItem(TEAM_CREDENTIALS_KEY);
  storageService.removeSessionItem(TEAM_CREDENTIALS_KEY);
}

function clearLegacyTeamCredentials() {
  storageService.removeLocalItem(TEAM_CREDENTIALS_KEY);
}

function sanitizeUserRecord(user = {}) {
  const { senha, ...safeUser } = user;
  return safeUser;
}

function syncTeamCredentials(users) {
  saveTeamCredentialsStore([]);
}

function readStoredUsersFromHubData() {
  const parsed = storageService.getSessionItem(STORAGE_KEY, {});
  return parsed.usuarios || [];
}

function getStoredLoginUsers() {
  return mergeUsersByName(
    loadTeamCredentialsStore(),
    mergeUsersByName(loadTeamUsersStore(), readStoredUsersFromHubData())
  );
}

function persistTeamCredential(nome, senha) {
  saveTeamCredentialsStore([]);
}

function getAllLocalUsers() {
  return mergeUsersByName(getStoredLoginUsers(), data?.usuarios || []);
}

function findLocalTeamUser(value) {
  const normalized = normalizeLoginName(value);
  return getAllLocalUsers().find((user) =>
    normalizeLoginName(user.nome) === normalized ||
    normalizeLoginName(user.email) === normalized
  );
}

function getCurrentUserRecord() {
  return currentUserProfile ||
    findLocalTeamUser(currentAuthUser?.email || storageService.getSessionItem(`${SESSION_KEY}-email`)) ||
    findLocalTeamUser(getCurrentUserName());
}

function formatRoleLabel(role) {
  const normalized = normalizeLoginName(role).replace(/\s+/g, "");
  if (normalized === "caixa/crediarista" || normalized === "caixa/credista") return "Caixa";
  return role;
}

function getUserRoleLabel(value) {
  const normalized = normalizeLoginName(value);
  const role = (data.usuarios || []).find((user) => normalizeLoginName(user.nome) === normalized)?.cargo || findLocalTeamUser(value)?.cargo || "";
  return role ? ` (${formatRoleLabel(role)})` : "";
}

function repairTeamCredentialsStore() {
  syncTeamCredentials(mergeUsersByName(loadTeamUsersStore(), data?.usuarios || []));
}

function getDirectChannel(userA, userB) {
  const users = [normalizeLoginName(userA), normalizeLoginName(userB)].sort();
  return `dm:${users[0]}:${users[1]}`;
}

function isDirectChannel(channelId) {
  return String(channelId || "").startsWith("dm:");
}

function getDirectChannelUsers(channelId) {
  if (!isDirectChannel(channelId)) return [];
  return String(channelId).slice(3).split(":").filter(Boolean);
}

function isValidDirectChannel(channelId) {
  const users = getDirectChannelUsers(channelId);
  return users.length === 2 && users[0] !== users[1];
}

function isCurrentUserInChannel(channelId) {
  if (channelId === GENERAL_CHANNEL) return !isManagerUser() && !isCashierUser();
  if (channelId === MANAGER_GENERAL_CHANNEL) return !isCashierUser();
  if (channelId === CASHIER_GENERAL_CHANNEL) return !isManagerUser();
  return isValidDirectChannel(channelId) && getDirectChannelUsers(channelId).includes(normalizeLoginName(getCurrentUserName()));
}

function isGeneralChatChannel(channelId) {
  return [GENERAL_CHANNEL, MANAGER_GENERAL_CHANNEL, CASHIER_GENERAL_CHANNEL].includes(channelId);
}

function getTeamUsers() {
  return (data.usuarios || [])
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
}

function getChatChannels() {
  const currentUser = getCurrentUserName();
  const directChannels = getTeamUsers().filter((user) => normalizeLoginName(user.nome) !== normalizeLoginName(currentUser)).map((user) => ({
      id: getDirectChannel(currentUser, user.nome),
      label: `${user.nome}${getUserRoleLabel(user.nome)}`,
      subtitle: `Conversa individual com ${user.nome}`,
      targetUser: user.nome,
      avatarPath: user.foto_perfil || ""
    }));

  let channels = isCashierUser()
    ? [
        { id: CASHIER_GENERAL_CHANNEL, label: "RH + Caixa", subtitle: "Comunicação geral entre caixas/crediaristas e equipe de RH", isGroup: true },
        ...directChannels,
      ]
    : isManagerUser()
    ? [
        { id: MANAGER_GENERAL_CHANNEL, label: "RH + Gerentes", subtitle: "Comunicação geral entre gerentes e equipe de RH", isGroup: true },
        ...directChannels,
      ]
    : [
        { id: GENERAL_CHANNEL, label: "Chat geral RH", subtitle: "Mensagens compartilhadas apenas pela equipe de RH", isGroup: true },
        { id: MANAGER_GENERAL_CHANNEL, label: "RH + Gerentes", subtitle: "Comunicação geral entre gerentes e equipe de RH", isGroup: true },
        { id: CASHIER_GENERAL_CHANNEL, label: "RH + Caixa", subtitle: "Comunicação geral entre caixas/crediaristas e equipe de RH", isGroup: true },
        ...directChannels,
      ];

  channels.sort((a, b) => {
    const msgA = data.comunicados.find(m => normalizeChatChannel(m.canal) === a.id);
    const msgB = data.comunicados.find(m => normalizeChatChannel(m.canal) === b.id);
    if (!msgA && !msgB) return 0;
    if (msgA && !msgB) return -1;
    if (!msgA && msgB) return 1;
    return data.comunicados.indexOf(msgA) - data.comunicados.indexOf(msgB);
  });

  return channels;
}

function getActiveChatChannel() {
  const channels = getChatChannels();
  return channels.find((channel) => channel.id === activeChatChannel) || null;
}

function getAllowedChatChannelIds() {
  return getChatChannels().map((channel) => channel.id);
}

function normalizeChatChannel(canal) {
  if (!canal || canal === GENERAL_CHANNEL) return GENERAL_CHANNEL;
  if (canal === MANAGER_GENERAL_CHANNEL) return MANAGER_GENERAL_CHANNEL;
  if (canal === CASHIER_GENERAL_CHANNEL) return CASHIER_GENERAL_CHANNEL;
  if (isDirectChannel(canal)) return canal;
  if (canal === RH_CHANNEL) return getDirectChannel(getCurrentUserName(), "Ariel");
  if (String(canal).startsWith("usuario:")) {
    return getDirectChannel(getCurrentUserName(), String(canal).slice("usuario:".length));
  }
  return canal;
}

function canAccessChatChannel(canal) {
  const channel = normalizeChatChannel(canal);
  return (
    (channel === GENERAL_CHANNEL && !isManagerUser() && !isCashierUser()) ||
    (channel === MANAGER_GENERAL_CHANNEL && !isCashierUser()) ||
    (channel === CASHIER_GENERAL_CHANNEL && !isManagerUser()) ||
    (isValidDirectChannel(channel) && isCurrentUserInChannel(channel))
  );
}

function isAllowedLoginName(value) {
  return Boolean(findLocalTeamUser(value));
}

function debugLocalLoginNames() {
  return getAllLocalUsers().map((user) => normalizeLoginName(user.nome)).join(", ");
}

function isAuthenticated() {
  return storageService.getSessionItem(SESSION_KEY) === "active";
}

function getCurrentUserName() {
  if (!isAuthenticated() && isPublicPage()) return "Publico";
  return storageService.getSessionItem(`${SESSION_KEY}-user`) || "Voce";
}

/**
 * [ALERTA DE SEGURANÇA] A verificação de permissão real DEVE ser feita no backend
 * com Row Level Security (RLS) do Supabase. Estas funções são apenas para controle de UI.
 * A 'role' é lida do token JWT para maior segurança no frontend, mas a RLS é indispensável.
 */
const AuthHelper = {
  _getClaim(claim) {
    return currentAuthUser?.app_metadata?.[claim] || "";
  },
  getRole() {
    return this._getClaim("cargo") || currentUserProfile?.cargo || "";
  },
  isManager() {
    return normalizeLoginName(this.getRole()) === "gerente";
  },
  isCashier() {
    const role = normalizeLoginName(this.getRole()).replace(/\s+/g, "");
    return role === "caixa/crediarista" || role === "caixa/credista";
  },
};

function getSystemFallbackAuthor() {
  return isAuthenticated() ? getCurrentUserName() : "Sistema";
}

function getCurrentUserRole() {
  return AuthHelper.getRole();
}

/**
 * Controle de UI baseado no usuario autenticado carregado do Supabase.
 * A verificacao de permissao real continua sendo feita no backend por RLS.
 */
function isManagerUser() {
  return AuthHelper.isManager();
}

/**
 * Controle de UI baseado no usuario autenticado carregado do Supabase.
 * A verificacao de permissao real continua sendo feita no backend por RLS.
 */
function isCashierUser() {
  return AuthHelper.isCashier();
}

function refreshCurrentUserRoleFromData() {
  if (!isAuthenticated() || !currentUserProfile) return;
  const user = findLocalTeamUser(currentAuthUser?.email || getCurrentUserName());
  if (user?.cargo) currentUserProfile = { ...currentUserProfile, cargo: user.cargo };
}

function getAuthUserDisplayName(authUser) {
  return (
    authUser?.user_metadata?.nome ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split("@")[0] ||
    "Usuario"
  );
}

function setAuthenticatedUser(authUser, profile = null) {
  currentAuthUser = authUser || null;
  currentUserProfile = profile || null;
  const displayName = profile?.nome || getAuthUserDisplayName(authUser);
  storageService.setSessionItem(SESSION_KEY, "active");
  storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(displayName));
  reloadUserSettingsForCurrentUser();
}

function clearSensitiveClientCache() {
  SENSITIVE_CLIENT_CACHE_KEYS.forEach((key) => {
    storageService.removeLocalItem(key);
    storageService.removeSessionItem(key);
  });
}

function clearAuthenticatedUser() {
  currentAuthUser = null;
  currentUserProfile = null;
  storageService.removeSessionItem(SESSION_KEY);
  storageService.removeSessionItem(`${SESSION_KEY}-user`);
  storageService.removeSessionItem(`${SESSION_KEY}-role`);
  storageService.removeSessionItem(`${SESSION_KEY}-email`);
  clearSensitiveClientCache();
  currentUserSettings = normalizeUserSettings();
  applyUserSettings();
}

async function getCurrentAuthUser() {
  const client = supabaseClient || getSupabaseClient();
  if (!client?.auth) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

async function getAuthSession() {
  const client = supabaseClient || getSupabaseClient();
  if (!client?.auth) return null;
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return data?.session || null;
}

async function loadUserProfile(authUser) {
  if (!authUser || !supabaseClient) return null;
  const email = normalizeLoginName(authUser.email);
  const displayName = normalizeLoginName(getAuthUserDisplayName(authUser));

  try {
    let query = supabaseClient.from(USERS_TABLE).select("id, nome, email, cpf, cargo, foto_perfil, created_by, created_at");
    const { data: profiles, error } = await query.or(`email.ilike.${email},nome.ilike.${displayName}`).limit(1);

    if (error && isMissingColumn(error, "email")) {
      const fallback = await supabaseClient
        .from(USERS_TABLE)
        .select("id, nome, cargo, foto_perfil, created_by, created_at")
        .ilike("nome", displayName)
        .limit(1);
      if (fallback.error) throw fallback.error;
      const profile = mapRows("usuarios", fallback.data || [])[0] || null;
      if (profile) {
        const profileWithEmail = { ...profile, email: authUser.email || "" };
        upsertLocalUser({ ...profileWithEmail, syncStatus: "active" });
        return profileWithEmail;
      }
      return {
        id: authUser.id,
        nome: getAuthUserDisplayName(authUser),
        email: authUser.email || "",
        cargo: authUser.app_metadata?.cargo || "",
        foto_perfil: "",
        syncStatus: "auth",
        createdAt: todayLabel(),
      };
    }

    if (error) throw error;
    const profile = mapRows("usuarios", profiles || [])[0] || null;
    if (profile) {
      upsertLocalUser({ ...profile, email: profile.email || authUser.email, syncStatus: "active" });
      return profile;
    }
    return {
      id: authUser.id,
      nome: getAuthUserDisplayName(authUser),
      email: authUser.email || "",
      cargo: authUser.app_metadata?.cargo || "",
      foto_perfil: "",
      syncStatus: "auth",
      createdAt: todayLabel(),
    };
  } catch (error) {
    console.error("Erro ao carregar perfil do usuario:", error);
    return findLocalTeamUser(authUser.email) || findLocalTeamUser(getAuthUserDisplayName(authUser)) || {
      id: authUser.id,
      nome: getAuthUserDisplayName(authUser),
      email: authUser.email || "",
      cargo: authUser.app_metadata?.cargo || "",
      foto_perfil: "",
      syncStatus: "auth",
      createdAt: todayLabel(),
    };
  }
}

async function restoreAuthenticatedSession() {
  const session = await getAuthSession();
  if (!session?.user) {
    clearAuthenticatedUser();
    return false;
  }
  const profile = await loadUserProfile(session.user);
  setAuthenticatedUser(session.user, profile);
  return true;
}

async function validateLogin(identifier, password) {
  const client = supabaseClient || getSupabaseClient();
  const normalizedIdentifier = String(identifier || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (!client?.auth) {
    const errorMsg = document.getElementById("login-error");
    if (errorMsg) errorMsg.textContent = "Erro de conexão com o Supabase.";
    return false;
  }

  let authData;
  let error;
  if (isValidCpf(normalizedIdentifier) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
    const config = getHubSupabaseConfig();
    const response = await fetch(`${config.url}/functions/v1/hub-password-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": config.anonKey, "x-hub-client-id": getPublicClientId() },
      body: JSON.stringify({
        cpf: isValidCpf(normalizedIdentifier) ? normalizeCpf(normalizedIdentifier) : "",
        email: normalizedIdentifier.includes("@") ? normalizedIdentifier.toLowerCase() : "",
        password: normalizedPassword,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = document.getElementById("login-error");
      if (response.status === 429 && errorMsg) errorMsg.textContent = result.error || "Muitas tentativas. Tente novamente mais tarde.";
      return false;
    }
    const session = result.session;
    const setSession = await client.auth.setSession({ access_token: session?.access_token || "", refresh_token: session?.refresh_token || "" });
    authData = setSession.data;
    error = setSession.error;
  } else {
    const result = await client.auth.signInWithPassword({ email: normalizedIdentifier, password: normalizedPassword });
    authData = result.data;
    error = result.error;
  }

  if (error || !authData?.user) {
    console.error("Erro no login Supabase Auth:", error);
    return false;
  }

  const profile = await loadUserProfile(authData.user);
  setAuthenticatedUser(authData.user, profile);
  return true;
}

async function verifyCurrentPassword(password) {
  if (!password) return false;

  // Verifica a senha via endpoint REST sem substituir a sessao ativa.
  // signInWithPassword sobrescreve o token em memoria e pode causar
  // redirecionamentos antes do onConfirm ser chamado.
  const authUser = await getCurrentAuthUser();
  const email = authUser?.email || "";
  if (!email) return false;

  const config = getHubSupabaseConfig();
  try {
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.anonKey,
      },
      body: JSON.stringify({ email, password: String(password).trim() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function isPublicPage() {
  return Boolean(
    document.querySelector("[data-public-denuncia]") ||
    document.querySelector("[data-public-vagas]") ||
    document.querySelector("[data-public-contratados]")
  );
}

function isPublicSubmissionFormPage() {
  return Boolean(
    document.querySelector("[data-public-denuncia]") ||
    document.querySelector("[data-public-vagas]") ||
    document.querySelector("[data-public-chamados]") ||
    document.querySelector("[data-public-contratados]")
  );
}

function isPublicJobsPage() {
  return Boolean(document.querySelector("[data-public-vagas]"));
}

function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

function getLoginRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  const allowedTargets = new Set(["index.html", "denuncia.html", "chamados.html", "vagas.html", "candidatura.html"]);
  if (!next) return "index.html";
  if (/^https?:\/\//i.test(next)) return "index.html";
  const target = next.startsWith("/") ? next.slice(1) : next;
  const page = target.split("?")[0];
  return allowedTargets.has(page) ? target : "index.html";
}

async function logout() {
  if (supabaseClient?.auth) await supabaseClient.auth.signOut();
  clearAuthenticatedUser();
  window.location.href = "login.html";
}

async function setupLogin() {
  const loginForm = document.getElementById("login-form");
  const settingsLogoutButton = document.getElementById("settings-logout-button");
  clearLegacyTeamCredentials();
  supabaseClient = supabaseClient || getSupabaseClient();
  const hasAuthSession = await restoreAuthenticatedSession();

  // Redirecionamentos Inteligentes
  if (hasAuthSession) {
    if (isLoginPage()) {
      window.location.replace(getLoginRedirectTarget());
      return false;
    }
  } else {
    if (!isLoginPage() && !isPublicPage()) {
      const next = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search || ""}`;
      window.location.href = `login.html?next=${encodeURIComponent(next)}`;
      return false;
    }
  }

  loginForm?.querySelector('[name="identificador"]')?.addEventListener("input", (event) => {
    const input = event.currentTarget;
    const value = String(input.value || "");
    if (/^[\d.\-\s]*$/.test(value)) input.value = formatCpf(value);
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const identifier = form.get("identificador") || form.get("email") || form.get("nome");
      const loginOk = await validateLogin(identifier, form.get("senha"));
  
      if (!loginOk) {
        const errorEl = document.getElementById("login-error");
        if (errorEl && !errorEl.textContent.trim()) {
          errorEl.textContent = "E-mail ou senha incorretos.";
        }
        return;
      }
  
      window.location.replace(getLoginRedirectTarget());
    });
  }

  settingsLogoutButton?.addEventListener("click", logout);

  return hasAuthSession || isPublicPage();
}

function getSupabaseClient() {
  const config = getHubSupabaseConfig();
  const hasConfig =
    config &&
    config.url &&
    config.anonKey &&
    !config.url.includes("COLE_AQUI") &&
    !config.anonKey.includes("COLE_AQUI") &&
    window.supabase;

  if (!hasConfig) return null;
  return window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function setSyncStatus(text, isOnline = false) {
  const target = document.getElementById("sync-status");
  if (!target) return;
  target.textContent = text;
  document.querySelector(".status-dot")?.classList.toggle("offline", !isOnline);
}

function loadLocalData() {
  const parsed = storageService.getSessionItem(STORAGE_KEY);
  if (!parsed) return defaultData;

  parsed.comunicados = (parsed.comunicados || []).map((item) => ({
    id: item.id || generateUUID(),
    autor: item.autor || "Equipe RH",
    mensagem: item.mensagem || item.titulo || "",
    canal: normalizeChatChannel(item.canal),
    arquivo: item.arquivo || null,
    createdAt: item.createdAt || "Hoje",
  }));
  return {
    denuncias: parsed.denuncias || [],
    comunicados: parsed.comunicados || [],
    malotes: parsed.malotes || [],
    chamados: parsed.chamados || [],
    vagas: parsed.vagas || [],
    eventos: parsed.eventos || [],
    vtRegistros: parsed.vtRegistros || [],
    documentosContratados: (parsed.documentosContratados || [])
      .filter((item) => !String(item.id || "").startsWith("local-") && !item.pendingSync)
      .map(mapContractorDocumentRow),
    candidaturas: parsed.candidaturas || [],
    usuarios: mergeUsersByName(parsed.usuarios || defaultData.usuarios, loadTeamUsersStore()).map(sanitizeUserRecord),
  };
}

function loadDocumentRecords() {
  return storageService.getSessionItem(DOCUMENT_RECORDS_KEY, []);
}

function disableSensitiveFieldAutofill() {
  document.querySelectorAll('input[type="password"], input[type="email"], input[name="cpf"], input[name="identificador"]').forEach((input) => {
    input.autocomplete = "off";
    input.dataset.lpignore = "true";
    input.dataset["1pIgnore"] = "true";
  });
}

function getPublicClientId() {
  let clientId = sessionStorage.getItem(PUBLIC_CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    sessionStorage.setItem(PUBLIC_CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

function saveDocumentRecords() {
  storageService.setSessionItem(DOCUMENT_RECORDS_KEY, documentRecords);
}

function saveLocalData() {
  if (data?.usuarios) {
    data.usuarios = data.usuarios.map(sanitizeUserRecord);
    saveTeamUsersStore(data.usuarios);
    syncTeamCredentials(data.usuarios);
  }
  storageService.setSessionItem(STORAGE_KEY, data);
}
let _saveLocalDataTimer = null;
function saveLocalDataDebounced() {
  if (_saveLocalDataTimer) clearTimeout(_saveLocalDataTimer);
  _saveLocalDataTimer = setTimeout(() => { saveLocalData(); }, 300);
}


function ensureRequiredTeamUsers() {
  if (!data.usuarios) data.usuarios = [];
}

function mergeUsersByName(currentUsers = [], incomingUsers = []) {
  const merged = new Map();

  [...currentUsers, ...incomingUsers].forEach((user) => {
    if (!user?.nome) return;
    const key = normalizeLoginName(user.nome);
    const existing = merged.get(key);
    merged.set(key, {
      ...(existing || {}),
      ...sanitizeUserRecord(user),
      id: user.id || existing?.id || generateUUID(),
      createdAt: user.createdAt || existing?.createdAt || todayLabel(),
    });
  });

  return [...merged.values()];
}

function loadReadRhMessageIds() {
  return new Set(storageService.getSessionItem(READ_RH_MESSAGES_KEY, []).map(String));
}

function saveReadRhMessageIds() {
  storageService.setSessionItem(READ_RH_MESSAGES_KEY, [...readRhMessageIds]);
}

function getUnreadRhMessages() {
  const currentUser = getCurrentUserName();
  return data.comunicados.filter(
    (item) => canAccessChatChannel(normalizeChatChannel(item.canal)) && item.autor !== currentUser && !readRhMessageIds.has(String(item.id))
  );
}

function markRhMessagesRead() {
  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;
  unread.forEach((item) => readRhMessageIds.add(String(item.id)));
  saveReadRhMessageIds();
}

function checkAndMarkChatAsRead() {
  const communicationView = document.getElementById("comunicacao");
  if (!communicationView?.classList.contains("active") || !canAccessChatChannel(activeChatChannel)) return;
  
  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;
  
  markRhMessagesRead();
  renderDashboard();
  renderChatChannels();
}

function renderCurrentUser() {
  const target = document.getElementById("current-user");
  const avatar = document.getElementById("current-user-avatar");
  if (!target && !avatar) return;

  const user = getCurrentUserRecord();
  if (target) target.textContent = getCurrentUserName();
  if (avatar) {
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatar.src = user.foto_perfil;
      avatar.style.display = "block";
    } else if (user?.foto_perfil && supabaseClient) {
      createPrivateStorageUrl(getHubSupabaseConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => {
          avatar.src = signedUrl;
          avatar.style.display = "block";
        })
        .catch(() => {
          avatar.src = "";
          avatar.style.display = "none";
        });
    } else {
      avatar.src = "";
      avatar.style.display = "none";
    }
  }
}

function populateUnitSelects() {
  document.querySelectorAll("[data-unit-select]").forEach((select) => {
    const currentValue = select.value;
    const placeholder = select.dataset.unitPlaceholder || "Selecione uma unidade";
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + UNIT_OPTIONS
      .map((unit) => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`)
      .join("");

    if (currentValue) {
      const hasCurrent = [...select.options].some((option) => option.value === currentValue);
      if (!hasCurrent) {
        select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(currentValue)}">${escapeHtml(currentValue)}</option>`);
      }
      select.value = currentValue;
    }
  });
}

function setFieldValue(field, value) {
  if (!field) return;
  if (field.tagName === "SELECT" && value && ![...field.options].some((option) => option.value === value)) {
    field.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
  }
  field.value = value || "";
}

function getSelectedMaloteDestino() {
  return document.getElementById("malote-destino-filter")?.value || "";
}

function getMaloteFilterValues() {
  return {
    destino: String(document.getElementById("malote-destino-filter")?.value || "").trim().toLowerCase(),
    colaborador: String(document.getElementById("malote-filter-colaborador")?.value || "").trim().toLowerCase(),
    codigo: String(document.getElementById("malote-code-search")?.value || "").trim(),
  };
}

function getMaloteCollaboratorSearchText(item = {}) {
  const groups = normalizeMaloteCollaborators(item);
  return groups.map((group) => String(group.colaborador || "").toLowerCase()).join(" ");
}

function formatRequestCode(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 5);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

function getMaloteCodeSearch() {
  return String(document.getElementById("malote-code-search")?.value || "").trim();
}

function getFilteredMalotes() {
  const filters = getMaloteFilterValues();
  const selectedDestino = filters.destino;
  const selectedColaborador = filters.colaborador;
  const search = filters.codigo;
  const searchDigits = search.replace(/\D/g, "");

  return data.malotes.filter((item) => {
    if (selectedDestino && String(item.destino || "").toLowerCase() !== selectedDestino) return false;
    if (selectedColaborador && !getMaloteCollaboratorSearchText(item).includes(selectedColaborador)) return false;
    if (!searchDigits) return true;

    const code = String(item.codigoSolicitacao || "");
    const codeDigits = code.replace(/\D/g, "");
    const idDigits = String(item.id || "").replace(/\D/g, "");
    return codeDigits.includes(searchDigits) || idDigits.includes(searchDigits);
  });
}

function renderMaloteReport() {
  const target = document.getElementById("malote-report");
  if (!target) return;

  const selectedDestino = getSelectedMaloteDestino();
  const search = getMaloteCodeSearch();
  const source = getFilteredMalotes();
  const byDestino = data.malotes.reduce((acc, item) => {
    const key = item.destino || "Sem destino";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topDestino = Object.entries(byDestino).sort((a, b) => b[1] - a[1])[0];
  const separacao = source.filter((item) => item.status === "Separação").length;
  const entrega = source.filter((item) => item.status === "Entrega").length;

  target.innerHTML = `
    <article class="report-chip">
      <span>${selectedDestino || search ? "Resultado filtrado" : "Total geral"}</span>
      <strong>${source.length}</strong>
      <small>${escapeHtml([selectedDestino, search ? `Código: ${search}` : ""].filter(Boolean).join(" | ") || "Todos os destinos")}</small>
    </article>
    <article class="report-chip">
      <span>Em separacao</span>
      <strong>${separacao}</strong>
      <small>Malotes pendentes</small>
    </article>
    <article class="report-chip">
      <span>Em entrega</span>
      <strong>${entrega}</strong>
      <small>Malotes em entrega</small>
    </article>
    <article class="report-chip">
      <span>Destino com mais malotes</span>
      <strong>${topDestino ? topDestino[1] : 0}</strong>
      <small>${escapeHtml(topDestino ? topDestino[0] : "Sem dados")}</small>
    </article>
  `;
}

function formatDate(value) {
  if (!value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getChatMessageDate(value) {
  if (!value) return "";
  if (value === "Hoje") return todayLabel();

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return formatDate(parsed.toISOString());

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return "";

  const [, day, month, year] = match;
  return formatDate(new Date(Number(year), Number(month) - 1, Number(day)).toISOString());
}

function getChatMessageTimeLabel(value) {
  if (!value) return "";
  const match = String(value).match(/(\d{2}:\d{2})/);
  if (match) return match[1];
  return value === "Hoje" ? "" : String(value);
}

function getChatMessageTime(value) {
  if (!value || value === "Hoje") return 0;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);
  if (!match) return 0;

  const [, day, month, year, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function compareChatMessagesOldestFirst(a, b) {
  const timeDiff = getChatMessageTime(a.createdAt) - getChatMessageTime(b.createdAt);
  if (timeDiff !== 0) return timeDiff;

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

function formatCurrencyBR(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatAbsencePeriod(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const formatDay = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Math.max(Number(value), 1), 31)).padStart(2, "0");
  };
  const formatMonth = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Math.max(Number(value), 1), 12)).padStart(2, "0");
  };
  const firstDay = formatDay(digits.slice(0, 2));
  const firstMonth = formatMonth(digits.slice(2, 4));
  const secondDay = formatDay(digits.slice(4, 6));
  const secondMonth = formatMonth(digits.slice(6, 8));

  if (digits.length <= 2) return firstDay;
  if (digits.length <= 4) return `${firstDay}/${firstMonth}`;
  if (digits.length <= 6) return `${firstDay}/${firstMonth} a ${secondDay}`;
  return `${firstDay}/${firstMonth} a ${secondDay}/${secondMonth}`;
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

// aliases para compatibilidade com chamadas existentes
const formatDocumentDate = formatMaskedDate;
const formatEventoDate   = formatMaskedDate;

function eventoDateToIso(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function applyDateMask(input) {
  if (input.dataset.dateMaskApplied === "true") return;
  input.type = "text";
  input.inputMode = "numeric";
  input.maxLength = 10;
  input.placeholder = "dd/mm/aaaa";
  input.dataset.dateMask = "true";
  input.dataset.docDate = "true"; // mantém compatibilidade
  input.dataset.dateMaskApplied = "true";
  input.value = formatMaskedDate(input.value);
}

function normalizeDocumentDateInputs(root = document) {
  // cobre doc-forms e o campo de data do evento-form
  root.querySelectorAll('[data-doc-form] input[type="date"], #evento-form input[type="date"]').forEach(applyDateMask);
  // reinicializa campos que já foram convertidos mas podem ter recebido valor ISO novo
  root.querySelectorAll('[data-date-mask="true"]').forEach((input) => {
    input.value = formatMaskedDate(input.value);
  });
}

function formatTimeRange(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const formatHour = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Number(value), 23)).padStart(2, "0");
  };
  const formatMinute = (value) => {
    if (!value) return "";
    if (value.length < 2) return value;
    return String(Math.min(Number(value), 59)).padStart(2, "0");
  };
  const firstHour = formatHour(digits.slice(0, 2));
  const firstMinute = formatMinute(digits.slice(2, 4));
  const secondHour = formatHour(digits.slice(4, 6));
  const secondMinute = formatMinute(digits.slice(6, 8));

  if (digits.length <= 2) return firstHour;
  if (digits.length <= 4) return `${firstHour}:${firstMinute}`;
  if (digits.length <= 6) return `${firstHour}:${firstMinute} às ${secondHour}`;
  return `${firstHour}:${firstMinute} às ${secondHour}:${secondMinute}`;
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatRg(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}

function isTodayLabel(value) {
  return value === todayLabel() || value === "Hoje";
}

function formatEpiItems(items) {
  return items
    .filter((item) => item.nome && item.quantidade)
    .map((item) => `${item.nome} (${item.quantidade}${item.tamanho ? `, ${item.tamanho}` : ""})`)
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

function readEpiItems(formElement) {
  return [...formElement.querySelectorAll(".epi-row")]
    .map((row) => ({
      tipo: row.querySelector('[name="epi_tipo[]"]')?.value || guessItemType(row.querySelector('[name="epi_nome[]"]')?.value.trim() || ""),
      nome: row.querySelector('[name="epi_nome[]"]')?.value.trim() || "",
      quantidade: row.querySelector('[name="epi_quantidade[]"]')?.value.trim() || "",
      tamanho: row.querySelector('[name="epi_tamanho[]"]')?.value.trim() || "",
    }))
    .filter((item) => item.nome && item.quantidade);
}

function hasFullName(value) {
  return /\S+\s+\S+/.test(String(value || "").trim());
}

function readMaloteCollaborators(formElement) {
  return [...formElement.querySelectorAll("[data-malote-collaborator]")]
    .map((block) => {
      const colaborador = block.querySelector('[name="malote_colaborador[]"]')?.value.trim() || "";
      const itens = readEpiItems(block);
      return { colaborador, itens };
    })
    .filter((group) => group.colaborador && group.itens.length);
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
  return createChamadoEpiRow(item.nome || "", item.quantidade || "", item.tamanho || "Nao se aplica");
}

function createMaloteCollaboratorBlock(group = {}) {
  const itens = group.itens?.length ? group.itens : [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }];
  return `
    <div class="malote-collaborator" data-malote-collaborator>
      <div class="item-topline">
        <label>Colaborador que irá receber
          <input name="malote_colaborador[]" type="text" minlength="3" maxlength="120" pattern="\\S+\\s+\\S+.*" placeholder="Nome e sobrenome" autocomplete="off" value="${escapeHtml(group.colaborador || "")}" required />
        </label>
        <button class="danger-button remove-malote-collaborator" type="button" aria-label="Remover colaborador">Remover colaborador</button>
      </div>
      <div class="malote-collaborator-items" data-malote-collaborator-items>
        ${itens.map((item) => createMaloteItemRow(item)).join("")}
      </div>
      <button class="secondary-link add-malote-item" type="button">Adicionar item para este colaborador</button>
    </div>
  `;
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

function createChamadoEpiRow(nome = "", quantidade = "", tamanho = "Nao se aplica") {
  const tipo = guessItemType(nome);

  return `
    <div class="epi-row">
      <label>Tipo
        <select name="epi_tipo[]" data-item-type-select required>${renderItemTypeOptions(tipo)}</select>
      </label>
      <label>Nome
        <select name="epi_nome[]" data-item-select data-epi-select required>${renderItemNameOptions(tipo, nome)}</select>
      </label>
      <label>Quantidade
        <input name="epi_quantidade[]" type="number" min="1" step="1" placeholder="1" value="${escapeHtml(quantidade)}" required />
      </label>
      <label>Tamanho
        <select name="epi_tamanho[]" required>${renderItemSizeOptions(tipo, tamanho, nome)}</select>
      </label>
      <button class="danger-button remove-epi" type="button" aria-label="Remover EPI">Remover</button>
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

function normalizeMaloteCollaborators(malote = {}) {
  if (Array.isArray(malote.colaboradores) && malote.colaboradores.length) {
    return malote.colaboradores
      .map((group) => ({
        colaborador: String(group.colaborador || "").trim(),
        itens: Array.isArray(group.itens) ? group.itens.filter((item) => item?.nome) : [],
      }))
      .filter((group) => group.colaborador && group.itens.length);
  }

  const legacyItems = parseEpiItems(malote.epis);
  if (!legacyItems.length) return [];
  return [{ colaborador: malote.colaborador || "Nao informado", itens: legacyItems }];
}

function resetMaloteCollaborators(groups = [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  const safeGroups = groups.length ? groups : [{ colaborador: "", itens: [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }] }];
  list.innerHTML = safeGroups.map((group) => createMaloteCollaboratorBlock(group)).join("");
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

function renderMaloteEpisDetails(epis) {
  const items = parseEpiItems(epis);
  if (!items.length) return `<p><strong>EPI:</strong> ${escapeHtml(epis || "Nao informado")}</p>`;

  return items
    .map((item) => `
      <div class="malote-epi-detail">
        <p><strong>EPI:</strong> ${escapeHtml(item.nome || "Nao informado")}</p>
        <p><strong>Tamanho do EPI:</strong> ${escapeHtml(item.tamanho || "Nao se aplica")}</p>
        <p><strong>Quantidade:</strong> ${escapeHtml(item.quantidade || "1")}</p>
      </div>
    `)
    .join("");
}

function renderMaloteCollaboratorsDetails(malote = {}) {
  const groups = normalizeMaloteCollaborators(malote);
  if (!groups.length) return renderMaloteEpisDetails(malote.epis);

  return groups
    .map((group) => `
      <div class="malote-collaborator-detail">
        <p><strong>Colaborador:</strong> ${escapeHtml(group.colaborador || "Nao informado")}</p>
        <ul>
          ${group.itens.map((item) => `
            <li>
              ${escapeHtml(item.nome || "Nao informado")}
              — Tamanho: ${escapeHtml(item.tamanho || "Nao se aplica")}
              — Quantidade: ${escapeHtml(item.quantidade || "1")}
            </li>
          `).join("")}
        </ul>
      </div>
    `)
    .join("");
}

function renderMaloteCardContent(item, options = {}) {
  const { showAudit = true, showActions = true } = options;
  return `
    <div class="item-topline"><p class="item-title">Malote de EPI</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
    <p><strong>Destino:</strong> ${escapeHtml(item.destino || "Nao informado")}</p>
      <p><strong>Origem:</strong> ${escapeHtml(item.origem || "Nao informada")}</p>
      <p><strong>Código da Solicitação:</strong> ${escapeHtml(item.codigoSolicitacao || "Nao informado")}</p>
    ${renderMaloteCollaboratorsDetails(item)}
    ${item.observacoes ? `<p><strong>Observações:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
    ${showAudit ? `<p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}</p>` : ""}
    ${showActions ? `
      <div class="job-actions">
        <button class="secondary-link" type="button" data-action="editar-malote" data-id="${escapeHtml(item.id)}">Editar</button>
        <button class="secondary-link" type="button" data-action="baixar-documento-malote" data-id="${escapeHtml(item.id)}">Baixar documento</button>
        <button class="danger-button" type="button" data-action="excluir-malote" data-id="${escapeHtml(item.id)}">Deletar</button>
      </div>
    ` : ""}
  `;
}

function todayLabel() {
  return formatDate(`${getLocalDateKey()}T00:00:00`);
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatEventDate(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatEventTime(value) {
  if (!value) return "00:00";
  const text = String(value);
  const match = text.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : text;
}

function formatWeekday(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(`${value}T00:00:00`));
}

function dateKeyFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

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

function getSortedEvents() {
  return (data.eventos || [])
    .slice()
    .sort((a, b) => `${a.data || ""}T${a.horario || "00:00"}`.localeCompare(`${b.data || ""}T${b.horario || "00:00"}`));
}

function getUpcomingEvents() {
  const today = getLocalDateKey();
  return getSortedEvents().filter((item) => !isArchivedRecord(item) && (!item.data || item.data >= today));
}

function renderEventAudit(item) {
  return `
    <span>Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}</span>
    ${item.updatedBy ? `<span>Editado por ${escapeHtml(item.updatedBy)}</span>` : ""}
  `;
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

function isEventInMonth(item, baseDate = new Date()) {
  if (!item.data) return false;
  const eventDate = new Date(`${item.data}T00:00:00`);
  return eventDate.getFullYear() === baseDate.getFullYear() && eventDate.getMonth() === baseDate.getMonth();
}

function isEventInCurrentMonth(item) {
  return isEventInMonth(item);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badgeClass(value) {
  return ["Urgente", "Alta", "Aberta"].includes(value) ? "tag alert" : "tag";
}

function showModal(title, text, type = "info") {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${type}">
        ${escapeHtml(title)}
      </div>
      <div class="modal-body">${escapeHtml(text)}</div>
      <div class="modal-footer">
        <button class="primary-button" data-action="close-modal">Entendi</button>
      </div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

function showPasswordActionModal({ title, text, confirmText = "Confirmar", danger = false, onConfirm, validatePassword = verifyCurrentPassword }) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${danger ? "error" : "info"}">${escapeHtml(title)}</div>
      <div class="modal-body">
        <p>${escapeHtml(text)}</p>
        <label class="modal-password-label">Senha de autorizacao
          <input id="modal-action-password" type="password" autocomplete="current-password" placeholder="Digite a senha" />
        </label>
        <p class="form-feedback error" id="modal-action-error" hidden>Senha incorreta.</p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-action="modal-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", close);
  overlay.querySelector('[data-action="modal-confirm"]').addEventListener("click", async () => {
    const password = overlay.querySelector("#modal-action-password").value;
    const error = overlay.querySelector("#modal-action-error");
    const isPasswordValid = await validatePassword(password);
    if (!isPasswordValid) {
      error.hidden = false;
      return;
    }

    await onConfirm(password);
    close();
  });

  overlay.querySelector("#modal-action-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      overlay.querySelector('[data-action="modal-confirm"]').click();
    }
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#modal-action-password").focus();
}

function showConfirmActionModal({ title, text, confirmText = "Confirmar", danger = false, onConfirm }) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${danger ? "error" : "info"}">${escapeHtml(title)}</div>
      <div class="modal-body"><p>${escapeHtml(text)}</p></div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-action="modal-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", close);
  overlay.querySelector('[data-action="modal-confirm"]').addEventListener("click", async () => {
    await onConfirm();
    close();
  });

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="modal-confirm"]').focus();
}

function showPublicVagaFiltersModal() {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card public-filter-modal">
      <div class="modal-header info">Filtrar vagas</div>
      <div class="modal-body public-filter-modal-body">
        <button class="secondary-link public-filter-option" type="button" data-action="open-cargo-filter">Filtrar por Cargo</button>
        <button class="secondary-link public-filter-option" type="button" data-action="open-unidade-filter">Filtrar por Unidade</button>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="clear-vaga-filters">Limpar</button>
        <button class="primary-button" type="button" data-action="close-modal">Fechar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('[data-action="clear-vaga-filters"]')?.addEventListener("click", () => {
    publicVagaCargoFilter = "";
    publicVagaUnidadeFilter = "";
    renderPublicVagas();
    close();
  });
  overlay.querySelector('[data-action="open-cargo-filter"]')?.addEventListener("click", () => {
    close();
    showPublicVagaSingleFilterModal("cargo");
  });
  overlay.querySelector('[data-action="open-unidade-filter"]')?.addEventListener("click", () => {
    close();
    showPublicVagaSingleFilterModal("unidade");
  });
  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", close);

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="open-cargo-filter"]')?.focus();
}

function showPublicVagaSingleFilterModal(type) {
  const isCargo = type === "cargo";
  const title = isCargo ? "Filtrar por Cargo" : "Filtrar por Unidade";
  const label = isCargo ? "Cargo" : "Unidade destinada";
  const inputId = isCargo ? "modal-vaga-cargo-filter" : "modal-vaga-unidade-filter";
  const currentValue = isCargo ? publicVagaCargoFilter : publicVagaUnidadeFilter;

  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card public-filter-modal">
      <div class="modal-header info">${escapeHtml(title)}</div>
      <div class="modal-body public-filter-modal-body">
        <label>${escapeHtml(label)}
          <input id="${inputId}" type="search" placeholder="Digite para filtrar" autocomplete="off" value="${escapeHtml(currentValue)}" />
        </label>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="back-vaga-filters">Voltar</button>
        <button class="primary-button" type="button" data-action="apply-vaga-filter">Filtrar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const apply = () => {
    const value = overlay.querySelector(`#${inputId}`)?.value.trim() || "";
    if (isCargo) publicVagaCargoFilter = value;
    else publicVagaUnidadeFilter = value;
    renderPublicVagas();
    close();
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('[data-action="back-vaga-filters"]')?.addEventListener("click", close);
  overlay.querySelector('[data-action="apply-vaga-filter"]')?.addEventListener("click", apply);
  overlay.querySelector(`#${inputId}`)?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply();
    }
  });

  document.body.appendChild(overlay);
  overlay.querySelector(`#${inputId}`)?.focus();
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
          <article class="day-event-card">
            <div class="item-topline">
              <p class="item-title">${escapeHtml(item.titulo)}</p>
              <span class="tag">${escapeHtml(item.tipo)}</span>
            </div>
            <p class="day-event-description">${escapeHtml(item.descricao || "Sem observacoes adicionais.").replace(/\n/g, "<br>")}</p>
            <p class="item-meta">${escapeHtml(formatEventTime(item.horario))} | Responsavel: ${escapeHtml(item.responsavel)}</p>
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

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function getStoragePath(value, bucket) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (!isHttpUrl(rawValue)) return rawValue;

  try {
    const url = new URL(rawValue);
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const signedMarker = `/storage/v1/object/sign/${bucket}/`;
    const marker = url.pathname.includes(publicMarker) ? publicMarker : signedMarker;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return rawValue;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return rawValue;
  }
}

async function createPrivateStorageUrl(bucket, value) {
  if (!supabaseClient) throw new Error("Supabase indisponivel.");
  if (isHttpUrl(value)) {
    const path = getStoragePath(value, bucket);
    if (path && path !== value) value = path;
  }

  const path = getStoragePath(value, bucket);
  const { data: signedData, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 5);
  if (error) throw error;
  return signedData.signedUrl;
}

function replacePrivateAvatarPlaceholders(path, signedUrl) {
  document.querySelectorAll("[data-private-avatar-path]").forEach((placeholder) => {
    if (placeholder.dataset.privateAvatarPath !== path) return;

    const image = document.createElement("img");
    image.className = "chat-avatar";
    image.src = signedUrl;
    image.alt = placeholder.dataset.privateAvatarAlt || "Avatar";
    placeholder.replaceWith(image);
  });
}

function requestPrivateAvatarUrl(path) {
  if (!path || isHttpUrl(path) || privateAvatarUrlCache.has(path) || privateAvatarUrlRequests.has(path)) return;

  const bucket = getHubSupabaseConfig().chatFilesBucket || "hub-chat-files";
  const request = createPrivateStorageUrl(bucket, path)
    .then((signedUrl) => {
      privateAvatarUrlCache.set(path, signedUrl);
      replacePrivateAvatarPlaceholders(path, signedUrl);
    })
    .catch((error) => console.warn("Nao foi possivel carregar avatar privado:", error))
    .finally(() => privateAvatarUrlRequests.delete(path));

  privateAvatarUrlRequests.set(path, request);
}

async function openPrivateStorageFile(bucket, value) {
  try {
    const signedUrl = await createPrivateStorageUrl(bucket, value);
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Erro ao abrir arquivo privado:", error);
    showModal("Arquivo privado", "Nao foi possivel abrir o arquivo. Verifique se voce esta logado e tem permissao.", "error");
  }
}

function openChatImageModal(bucket, path, name) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay chat-image-modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card chat-image-modal-card">
      <div class="modal-header info">
        ${escapeHtml(name)}
      </div>
      <div class="modal-body chat-image-modal-body">
        <img class="chat-image-modal-img" alt="${escapeHtml(name)}" />
      </div>
      <div class="modal-footer">
        <button class="secondary-link" data-action="close-modal">Fechar</button>
        <button class="primary-button" data-action="download-chat-image" data-chat-image-bucket="${escapeHtml(bucket)}" data-chat-image-path="${escapeHtml(path)}" data-chat-image-name="${escapeHtml(name)}">Baixar imagem</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);

  const image = overlay.querySelector(".chat-image-modal-img");
  if (!image) return;

  createPrivateStorageUrl(bucket, path)
    .then((signedUrl) => {
      image.src = signedUrl;
    })
    .catch((error) => {
      console.error("Nao foi possivel carregar imagem do chat:", error);
      image.alt = "Nao foi possivel carregar a imagem.";
    });
}

async function downloadPrivateStorageFile(bucket, value, filename = "documento") {
  try {
    const signedUrl = await createPrivateStorageUrl(bucket, value);
    await downloadUrlAsBlob(signedUrl, filename || "documento");
  } catch (error) {
    console.error("Erro ao baixar arquivo privado:", error);
    showModal("Arquivo privado", "Nao foi possivel baixar o arquivo. Verifique se voce esta logado e tem permissao.", "error");
  }
}

async function downloadUrlAsBlob(url, filename = "documento") {
  if (String(url || "").startsWith("data:")) {
    downloadBlob(dataUrlToBlob(url), filename);
    return;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar o arquivo: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadBlob(blob, filename);
}

function parseChatMessage(row) {
  const text = row.mensagem || "";
  const match = text.match(/^\[hub-channel:([^\]]+)\]\s*/);
  return {
      canal: normalizeChatChannel(match ? match[1] : row.canal),
    mensagem: match ? text.slice(match[0].length) : text,
  };
}

function parseChatPollMessage(value) {
  const text = String(value || "");
  if (!text.startsWith(CHAT_POLL_PREFIX)) return null;

  try {
    const poll = JSON.parse(text.slice(CHAT_POLL_PREFIX.length));
    const question = String(poll.question || "").trim();
    const options = Array.isArray(poll.options)
      ? poll.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 8)
      : [];
    if (!question || options.length < 2) return null;

    return {
      question,
      options,
      votes: poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {},
      createdBy: String(poll.createdBy || ""),
      createdAt: String(poll.createdAt || ""),
    };
  } catch (error) {
    console.warn("Enquete do chat invalida:", error);
    return null;
  }
}

function serializeChatPoll(poll) {
  const question = String(poll.question || "").trim().slice(0, 180);
  const options = (Array.isArray(poll.options) ? poll.options : [])
    .map((option) => String(option || "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 8);
  const votes = poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {};

  return `${CHAT_POLL_PREFIX}${JSON.stringify({
    question,
    options,
    votes,
    createdBy: poll.createdBy || getCurrentUserName(),
    createdAt: poll.createdAt || new Date().toISOString(),
  })}`;
}

function renderChatPoll(item, poll) {
  const votes = poll.votes || {};
  const voter = normalizeLoginName(getCurrentUserName());
  const selectedIndex = Number.isInteger(Number(votes[voter])) ? Number(votes[voter]) : -1;
  const totals = poll.options.map((_, index) =>
    Object.values(votes).filter((value) => Number(value) === index).length
  );
  const totalVotes = totals.reduce((sum, value) => sum + value, 0);

  const options = poll.options.map((option, index) => {
    const count = totals[index] || 0;
    const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
    const selected = selectedIndex === index;
    return `
      <button class="chat-poll-option${selected ? " is-selected" : ""}" type="button" data-action="vote-chat-poll" data-id="${escapeHtml(item.id)}" data-option="${index}">
        <span class="chat-poll-option-top">
          <span>${escapeHtml(option)}</span>
          <strong>${percent}%</strong>
        </span>
        <span class="chat-poll-bar" aria-hidden="true"><span style="width: ${percent}%"></span></span>
        <span class="item-meta">${count} voto${count === 1 ? "" : "s"}${selected ? " • seu voto" : ""}</span>
      </button>
    `;
  }).join("");

  return `
    <div class="chat-poll-card">
      <span class="tag">Enquete</span>
      <h4>${escapeHtml(poll.question)}</h4>
      <div class="chat-poll-options">${options}</div>
      <p class="item-meta">${totalVotes} voto${totalVotes === 1 ? "" : "s"} no total</p>
    </div>
  `;
}

function mapRows(collection, rows) {
  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status || "Aberta", // Garante o mapeamento do status
      createdBy: row.created_by || "Sistema",
      createdAt: formatDateTime(row.created_at),
    }));
  }

  if (collection === "comunicados") {
    return rows.map((row) => {
      const parsed = parseChatMessage(row);
      return {
        id: row.id,
        autor: row.autor,
        mensagem: parsed.mensagem,
        canal: parsed.canal,
        createdBy: row.created_by || row.autor,
        arquivo: row.arquivo_nome
          ? {
              name: row.arquivo_nome,
              size: row.arquivo_tamanho,
              type: row.arquivo_tipo,
              url: row.arquivo_url,
            }
          : null,
        createdAt: formatDateTime(row.created_at),
      };
    });
  }

if (collection === "malotes") {
  return rows.map((row) => ({
    id: row.id,
    destino: row.destino,
    origem: row.origem || "",
    epis: row.epis,
    colaboradores: Array.isArray(row.colaboradores) ? row.colaboradores : [],
    codigoSolicitacao: row.codigo_solicitacao || "",
    observacoes: row.observacoes || "",
    status: row.status,
    createdBy: row.created_by || getSystemFallbackAuthor(),
    updatedBy: row.updated_by || "",
    createdAt: formatDate(row.created_at),
  }));
}

  if (collection === "chamados") {
    return rows.map((row) => ({
      id: row.id,
      solicitante: row.solicitante,
      unidade: row.unidade,
      setor: row.setor || "",
      epis: row.epis,
      codigoSolicitacao: row.codigo_solicitacao || "",
      observacoes: row.observacoes || "",
      status: row.status || "Aberto",
      createdAt: formatDateTime(row.created_at),
    }));
  }

  if (collection === "candidaturas") {
    return rows.map((row) => ({
      id: row.id,
      vaga_id: row.vaga_id,
      nome: row.nome,
      telefone: row.telefone || "",
      cpf: row.cpf,
      curriculo_url: row.curriculo_url,
      createdBy: row.created_by || row.nome,
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "eventos") {
    return rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      data: row.data,
      horario: row.horario,
      responsavel: row.responsavel,
      tipo: row.tipo || "Evento",
      descricao: row.descricao || "",
      createdBy: row.created_by || getSystemFallbackAuthor(),
      updatedBy: row.updated_by || "",
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "vtRegistros") {
    return rows.map((row) => ({
      id: row.id,
      colaborador: row.colaborador || "",
      unidade: row.unidade || "",
      mes: row.mes || "",
      diasUteis: row.dias_uteis || 0,
      valorPassagem: Number(row.valor_passagem) || 0,
      saldoAtual: Number(row.saldo_atual) || 0,
      valorNecessario: Number(row.valor_necessario) || 0,
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "documentosContratados") {
    return rows.map(mapContractorDocumentRow);
  }

  if (collection === "usuarios") {
    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email || "",
      cpf: row.cpf || "",
      cargo: row.cargo || "",
      foto_perfil: row.foto_perfil || "",
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
    }));
  }

  return rows.map((row) => {
    const legacyDetails = parseLegacyJobDetails(row.projeto);
    return {
      id: row.id,
      cargo: row.cargo,
      unidade: row.unidade || "",
      projeto: "",
      descricao: row.descricao || legacyDetails.descricao,
      requisitos: row.requisitos || legacyDetails.requisitos,
      status: row.status,
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
    };
  });
}

function inferContractorDocumentSource(origemHtml = "", empresa = "") {
  const source = String(origemHtml || "").trim();
  if (source) return source;
  const normalizedCompany = String(empresa || "").toLowerCase();
  if (normalizedCompany.includes("fredy")) return "documentos-fredy.html";
  if (normalizedCompany.includes("besten")) return "documentos-besten.html";
  if (normalizedCompany.includes("achei")) return "documentos-achei.html";
  if (normalizedCompany.includes("trinca")) return "documentos-trinca.html";
  return "";
}

function parseContractorDocumentsValue(value) {
  const normalizeDoc = (doc = {}) => ({
    name: doc.name || doc.nome || doc.filename || doc.fileName || "documento",
    size: doc.size || doc.tamanho || 0,
    type: doc.type || doc.mime || doc.mimeType || doc.contentType || "application/octet-stream",
    dataUrl: doc.dataUrl || doc.data_url || doc.url || "",
    path: doc.path || doc.storagePath || doc.storage_path || "",
  });
  if (Array.isArray(value)) return value.map(normalizeDoc);
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(normalizeDoc) : parsed ? [normalizeDoc(parsed)] : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object") return [normalizeDoc(value)];
  return [];
}

function mapContractorDocumentRow(row = {}) {
  return {
    id: row.id,
    empresa: row.empresa || "",
    origemHtml: inferContractorDocumentSource(row.origem_html || row.origemHtml, row.empresa),
    nome: row.nome || "",
    cpf: row.cpf || "",
    telefone: row.telefone || "",
    documentos: parseContractorDocumentsValue(row.documentos),
    createdBy: row.created_by || row.createdBy || "Publico",
    createdAt: formatDateTime(row.created_at || row.createdAt),
    pendingSync: Boolean(row.pendingSync),
  };
}

function getContractorSourceLabel(origemHtml = "", empresa = "") {
  const source = inferContractorDocumentSource(origemHtml, empresa).toLowerCase();
  if (source.includes("fredy")) return "Fredy";
  if (source.includes("besten")) return "Besten";
  if (source.includes("achei")) return "Achei";
  if (source.includes("trinca")) return "Trinca";
  const normalizedCompany = String(empresa || "").trim().split(/\s+/)[0];
  return normalizedCompany || "";
}

function getContractorDocumentIdentity(item = {}) {
  return [
    normalizeCpf(item.cpf || ""),
    String(item.nome || "").trim().toLowerCase(),
    String(item.empresa || "").trim().toLowerCase(),
    String(item.origemHtml || "").trim().toLowerCase(),
    String(item.createdAt || "").trim().toLowerCase(),
  ].join("|");
}

function mergeContractorDocuments(localItems = [], remoteItems = []) {
  const merged = [];
  const seen = new Set();
  [...localItems, ...remoteItems].forEach((item) => {
    const normalized = {
      ...item,
      origemHtml: inferContractorDocumentSource(item.origemHtml, item.empresa),
      documentos: Array.isArray(item.documentos) ? item.documentos : [],
    };
    const key = String(normalized.id || "").startsWith("local-")
      ? getContractorDocumentIdentity(normalized)
      : String(normalized.id || getContractorDocumentIdentity(normalized));
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  });
  return merged;
}

function loadPendingContractorDocuments() {
  return storageService.getLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, []);
}

function savePendingContractorDocuments(items = []) {
  storageService.setLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, items);
}

function addPendingContractorDocument(item) {
  const pending = mergeContractorDocuments([item], loadPendingContractorDocuments());
  savePendingContractorDocuments(pending);
  return pending;
}

function removePendingContractorDocument(id) {
  const remaining = loadPendingContractorDocuments().filter((item) => String(item.id) !== String(id));
  savePendingContractorDocuments(remaining);
  return remaining;
}

function mergeRealtimeRow(collection, row, action = "INSERT") {
  if (action === "DELETE") {
    if (collection === "usuarios") {
      removeLocalUser(row.id);
      return;
    }
    const current = data[collection] || [];
    data[collection] = current.filter((item) => String(item.id) !== String(row.id));
    return;
  }

  const mapped = mapRows(collection, [row])[0];
  const current = data[collection] || [];

  const index = current.findIndex((item) => String(item.id) === String(mapped.id) || (collection === "usuarios" && normalizeLoginName(item.nome) === normalizeLoginName(mapped.nome)));
  if (index >= 0) {
    data[collection] = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...mapped } : item));
  } else {
    data[collection] = [mapped, ...current];
  }
}

function renderRealtimeUpdate(collection) {
  saveLocalDataDebounced();

  if (collection === "comunicados") {
    renderDashboard();
    renderChatChannels();
    renderChat();
    return;
  }

  if (collection === "usuarios") {
    ensureRequiredTeamUsers();
    renderDashboard();
    renderTeamUsers();
    renderChatChannels();
    renderChat();
    return;
  }

  if (collection === "chamados") {
    renderDashboard();
    renderChamadosSection();
    return;
  }

  if (collection === "malotes") {
    renderDashboard();
    renderMalotesSection();
    return;
  }

  if (collection === "denuncias") {
    renderDashboard();
    renderDenunciasSection();
    return;
  }

  renderAll();
}

function closeMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  document.querySelector(".mobile-menu-backdrop")?.remove();
  shell?.classList.remove("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "false");
}

function openMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  if (!shell || shell.classList.contains("mobile-menu-open")) return;
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "mobile-menu-backdrop";
  backdrop.setAttribute("aria-label", "Fechar menu");
  backdrop.addEventListener("click", closeMobileMenu);
  document.body.appendChild(backdrop);
  shell.classList.add("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "true");
}

function toggleMobileMenu() {
  const shell = document.getElementById("app-shell");
  if (shell?.classList.contains("mobile-menu-open")) closeMobileMenu();
  else openMobileMenu();
}

function toDbPayload(collection, values) {
  if (collection === "comunicados") {
    return {
      autor: values.autor,
      canal: normalizeChatChannel(values.canal),
      mensagem: values.mensagem || "",
      created_by: values.createdBy || values.autor || getCurrentUserName(),
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
  }

  if (collection === "usuarios") {
    return {
      nome: values.nome,
      email: values.email || null,
      cpf: normalizeCpf(values.cpf) || null,
      cargo: values.cargo || "",
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "vagas") {
    return {
      cargo: values.cargo,
      unidade: values.unidade || "",
      projeto: JSON.stringify({
        descricao: values.descricao || "",
        requisitos: values.requisitos || "",
      }),
      descricao: values.descricao || "",
      requisitos: values.requisitos || "",
      status: values.status || "Aberta",
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

 if (collection === "malotes") {
  return {
    destino: values.destino,
    origem: values.origem || "",
    epis: values.epis,
    colaboradores: values.colaboradores || [],
    codigo_solicitacao: values.codigoSolicitacao || "",
    observacoes: values.observacoes || "",
    status: values.status || "Separação",
    created_by: values.createdBy || getCurrentUserName(),
    updated_by: values.updatedBy || null,
  };
}

  if (collection === "chamados") {
    const payload = {};
    if ("solicitante" in values) payload.solicitante = values.solicitante;
    if ("unidade" in values) payload.unidade = values.unidade;
    if ("setor" in values) payload.setor = values.setor || "";
    if ("epis" in values) payload.epis = values.epis;
    if ("observacoes" in values) payload.observacoes = values.observacoes || "";
    payload.status = values.status || "Aberto";
    payload.created_by = values.createdBy || getCurrentUserName();
    return payload;
  }

  if (collection === "eventos") {
    return {
      titulo: values.titulo,
      data: values.data,
      horario: values.horario,
      responsavel: values.responsavel,
      tipo: values.tipo || "Evento",
      descricao: values.descricao || "",
      created_by: values.createdBy || getCurrentUserName(),
      updated_by: values.updatedBy || null,
    };
  }

  if (collection === "vtRegistros") {
    return {
      colaborador: values.colaborador,
      unidade: values.unidade,
      mes: values.mes,
      dias_uteis: values.diasUteis,
      valor_passagem: values.valorPassagem,
      saldo_atual: values.saldoAtual,
      valor_necessario: values.valorNecessario,
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "documentosContratados") {
    return {
      empresa: values.empresa,
      origem_html: values.origemHtml || "",
      nome: values.nome,
      cpf: values.cpf,
      telefone: values.telefone || "",
      documentos: values.documentos || [],
      created_by: values.createdBy || "Publico",
    };
  }

  const { createdBy, ...payload } = values;
  return {
    ...payload,
    created_by: createdBy || getCurrentUserName(),
  };
}

function withoutCreatedBy(payload) {
  const { created_by, ...rest } = payload;
  return rest;
}

function withoutUpdatedBy(payload) {
  const { updated_by, ...rest } = payload;
  return rest;
}

function isMissingCreatedByColumn(error) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes("created_by");
}

function isMissingColumn(error, columnName) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes(columnName);
}

function parseLegacyJobDetails(projeto) {
  try {
    const parsed = JSON.parse(projeto || "{}");
    return {
      descricao: parsed.descricao || "",
      requisitos: parsed.requisitos || "",
    };
  } catch {
    return {
      descricao: "",
      requisitos: "",
    };
  }
}

function withoutOptionalJobColumns(payload) {
  const { descricao, requisitos, unidade, created_by, ...rest } = payload;
  return rest;
}

function withoutOptionalApplicationColumns(payload) {
  const { telefone, created_by, ...rest } = payload;
  return rest;
}

async function loadFromSupabase(options = {}) {
  const { setupLive = true } = options;

  if (!supabaseClient) {
    setSyncStatus("Modo local", false);
    renderAll();
    return;
  }

  try {
    const { data: userRows, error: usersError } = await supabaseClient
      .from(USERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (usersError) throw usersError;

    const mappedUsers = mapRows("usuarios", userRows || []);
    const dbNames = mappedUsers.map((user) => normalizeLoginName(user.nome));
    data.usuarios = (data.usuarios || []).filter((localUser) => {
      const normalizedName = normalizeLoginName(localUser.nome);
      if (dbNames.includes(normalizedName)) return true;
      if (localUser.syncStatus === "local") {
        supabaseClient.from(USERS_TABLE).insert({
          nome: localUser.nome,
          email: localUser.email || null,
          created_by: "Auto-Sync",
        }).then();
        return true;
      }
      return false;
    });
    data.usuarios = mergeUsersByName(data.usuarios, mappedUsers);

    const requests = await Promise.allSettled(
      Object.entries(TABLES)
        .filter(([collection]) => collection !== "usuarios")
        .map(async ([collection, table]) => {
        let query = supabaseClient.from(table).select("*").order("created_at", { ascending: false });
        if (collection === "comunicados") {
          query = query.in("canal", getAllowedChatChannelIds());
        }

        const { data: rows, error } = await query;
        if (error) throw error;
        return [collection, mapRows(collection, rows || [])];
      })
    );

    requests.forEach((result) => {
      if (result.status === "fulfilled") {
        const [collection, rows] = result.value;

        data[collection] = rows;
      } else {
        console.error("Erro ao carregar colecao do Supabase:", result.reason);
      }
    });
    ensureRequiredTeamUsers();
    saveLocalData();
    if (setupLive) {
      setupRealtime();
      setupAutoRefresh();
    }
    const hasFailures = requests.some((result) => result.status === "rejected");
    setSyncStatus(hasFailures ? "Supabase parcial" : "Supabase EIXO online", !hasFailures);
    renderAll();
  } catch (error) {
    console.error("Erro ao carregar Supabase:", error);
    setSyncStatus("Supabase pendente", false);
    renderAll();
  }
}

async function refreshFromSupabase() {
  if (!supabaseClient || refreshInProgress) return;

  refreshInProgress = true;
  try {
    await loadFromSupabase({ setupLive: false });
  } finally {
    refreshInProgress = false;
  }
}

function setupAutoRefresh() {
  if (refreshTimer) return;

  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshFromSupabase();
    }
  }, 5000);
}

function setupRealtime() {
  if (!supabaseClient || realtimeChannel) return;

  realtimeChannel = supabaseClient.channel("hub-realtime-updates");

  Object.entries(TABLES).forEach(([collection, table]) => {
    realtimeChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row) return;
        if (collection === "comunicados" && !canAccessChatChannel(row.canal)) return;

        mergeRealtimeRow(collection, row, payload.eventType);
        renderRealtimeUpdate(collection);
      }
    );
  });

  realtimeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.info("HUB realtime conectado");
      setSyncStatus("Tempo real online", true);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      console.warn("HUB realtime desconectado:", status);
      setSyncStatus("Reconectando...", false);
      // Remove canal atual e agenda reconexão
      try { realtimeChannel.unsubscribe(); } catch (_) {}
      realtimeChannel = null;
      setTimeout(() => {
        if (!realtimeChannel && supabaseClient) {
          console.info("HUB realtime tentando reconectar...");
          setupRealtime();
          refreshFromSupabase();
        }
      }, 3000);
    }
  });
}

async function uploadChatFile(file) {
  if (!supabaseClient || !file || !file.name) return null;

  const bucket = getHubSupabaseConfig().chatFilesBucket || "hub-chat-files";
  const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "-");
  const channel = normalizeChatChannel(activeChatChannel || GENERAL_CHANNEL);
  const path = `chat/${channel}/${Date.now()}-${generateUUID()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, { contentType: getChatFileMimeType(file), upsert: false });
  if (error) throw error;

  return path;
}

function getChatFileMimeType(fileOrAttachment) {
  const rawType = String(fileOrAttachment?.type || "").toLowerCase().trim();
  const baseType = rawType.split(";")[0].trim();
  if (baseType) return CHAT_FILE_MIME_ALIASES.get(baseType) || baseType;
  const extension = String(fileOrAttachment?.name || "").split(".").pop()?.toLowerCase() || "";
  return CHAT_FILE_EXTENSION_MIME_TYPES.get(extension) || "";
}

function isChatImageFile(fileOrAttachment) {
  return getChatFileMimeType(fileOrAttachment).startsWith("image/");
}

function isChatAudioFile(fileOrAttachment) {
  return getChatFileMimeType(fileOrAttachment).startsWith("audio/");
}

function validateChatFile(file) {
  if (!file || !file.name) return null;

  const mimeType = getChatFileMimeType(file);
  if (!CHAT_FILE_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas imagens, videos, audios, PDF, Word ou Excel.";
  }

  if (file.size <= 0) {
    return "O arquivo enviado parece estar vazio.";
  }

  if (file.size > CHAT_FILE_MAX_SIZE_BYTES) {
    return "O arquivo do chat deve ter no maximo 10 MB.";
  }

  return null;
}

function syncChatFileInput() {
  const input = document.getElementById("chat-file");
  if (!input) return;
  const transfer = new DataTransfer();
  chatSelectedFiles.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function getChatDefaultFileAccept() {
  return "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.m4a,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function closeChatAttachMenu() {
  const menu = document.getElementById("chat-attach-menu");
  const button = document.getElementById("chat-attach-menu-button");
  if (menu) menu.hidden = true;
  button?.setAttribute("aria-expanded", "false");
}

function closeChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  const button = document.getElementById("chat-emoji-button");
  if (menu) menu.hidden = true;
  button?.setAttribute("aria-expanded", "false");
}

function toggleChatAttachMenu() {
  const menu = document.getElementById("chat-attach-menu");
  const button = document.getElementById("chat-attach-menu-button");
  if (!menu || !button || button.disabled) return;
  const nextOpen = menu.hidden;
  menu.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
  if (nextOpen) closeChatEmojiMenu();
}

function renderChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  if (!menu || menu.dataset.ready === "true") return;
  menu.innerHTML = CHAT_EMOJIS.map((emoji) => `
    <button type="button" class="chat-emoji-option" data-action="insert-chat-emoji" data-emoji="${escapeHtml(emoji)}" aria-label="Inserir ${escapeHtml(emoji)}">${escapeHtml(emoji)}</button>
  `).join("");
  menu.dataset.ready = "true";
}

function toggleChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  const button = document.getElementById("chat-emoji-button");
  if (!menu || !button || button.disabled) return;
  renderChatEmojiMenu();
  const nextOpen = menu.hidden;
  menu.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
  if (nextOpen) closeChatAttachMenu();
}

function insertChatEmoji(emoji) {
  const input = document.querySelector('#chat-form textarea[name="mensagem"]');
  if (!input || input.disabled) return;
  const value = input.value || "";
  const start = Number.isInteger(input.selectionStart) ? input.selectionStart : value.length;
  const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
  input.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const cursor = start + String(emoji).length;
  input.focus();
  input.setSelectionRange(cursor, cursor);
}

function openChatFilePicker({ accept = getChatDefaultFileAccept(), capture = "" } = {}) {
  const input = document.getElementById("chat-file");
  if (!input) return;
  input.accept = accept;
  if (capture) input.setAttribute("capture", capture);
  else input.removeAttribute("capture");
  input.click();
}

function handleChatAttachOption(type) {
  closeChatAttachMenu();
  if (!activeChatChannel || !canAccessChatChannel(activeChatChannel)) {
    showModal("Selecione um chat", "Escolha um canal de comunicação antes de adicionar anexos.", "error");
    return;
  }

  switch (type) {
    case "document":
      openChatFilePicker({ accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.pdf,.doc,.docx,.xls,.xlsx" });
      break;
    case "media":
      openChatFilePicker({ accept: "image/png,image/jpeg,image/webp,image/gif,video/*" });
      break;
    case "poll":
      showChatPollModal();
      break;
    default:
      openChatFilePicker();
      break;
  }
}

function setChatSelectedFile(file) {
  if (!file) return;
  chatSelectedFiles = [file];
  chatAttachmentPreviewIndex = 0;
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function addChatSelectedFiles(files) {
  const nextFiles = Array.from(files || []).filter((file) => file && file.name);
  if (!nextFiles.length) return;
  chatSelectedFiles = [...chatSelectedFiles, ...nextFiles];
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function removeChatSelectedFile(index) {
  const removedIndex = Number(index);
  chatSelectedFiles = chatSelectedFiles.filter((_, fileIndex) => fileIndex !== removedIndex);
  if (chatAttachmentPreviewIndex >= chatSelectedFiles.length) chatAttachmentPreviewIndex = Math.max(0, chatSelectedFiles.length - 1);
  else if (removedIndex < chatAttachmentPreviewIndex) chatAttachmentPreviewIndex -= 1;
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function previewChatSelectedFile(index) {
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= chatSelectedFiles.length) return;
  chatAttachmentPreviewIndex = nextIndex;
  renderChatAttachmentPreview(chatSelectedFiles);
}

function getChatFileExtension(file) {
  const name = String(file?.name || "");
  const extension = name.includes(".") ? name.split(".").pop() : "";
  return (extension || getChatFileMimeType(file).split("/").pop() || "arquivo").toUpperCase();
}

function clearChatSelectedFile() {
  chatSelectedFiles = [];
  chatAttachmentPreviewIndex = 0;
  syncChatFileInput();
  renderChatAttachmentPreview([]);
}

function revokeChatAttachmentPreviewUrls() {
  chatAttachmentPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  chatAttachmentPreviewUrls = [];
  if (chatAttachmentPreviewUrl) {
    URL.revokeObjectURL(chatAttachmentPreviewUrl);
    chatAttachmentPreviewUrl = "";
  }
}

function renderChatAttachmentPreview(files) {
  const preview = document.getElementById("chat-attachment-preview");
  if (!preview) return;

  revokeChatAttachmentPreviewUrls();

  const selectedFiles = Array.isArray(files) ? files.filter((file) => file && file.name) : files && files.name ? [files] : [];
  if (!selectedFiles.length) {
    preview.hidden = true;
    preview.innerHTML = "";
    return;
  }

  chatAttachmentPreviewIndex = Math.min(Math.max(chatAttachmentPreviewIndex, 0), selectedFiles.length - 1);
  const file = selectedFiles[chatAttachmentPreviewIndex];
  const mimeType = getChatFileMimeType(file);
  const extension = getChatFileExtension(file);
  const size = formatFileSize(file.size);
  const fileName = escapeHtml(file.name);
  const meta = `${escapeHtml(size)} - ${escapeHtml(extension)}`;
  chatAttachmentPreviewUrl = URL.createObjectURL(file);
  chatAttachmentPreviewUrls.push(chatAttachmentPreviewUrl);

  let body = "";
  let activeChip = "";
  if (mimeType.startsWith("image/")) {
    body = `<img class="chat-preview-image" src="${chatAttachmentPreviewUrl}" alt="Previa de ${fileName}">`;
    activeChip = `<img class="chat-preview-chip-image" src="${chatAttachmentPreviewUrl}" alt="" aria-hidden="true">`;
  } else if (mimeType.startsWith("audio/")) {
    body = `
      <div class="chat-preview-audio-card">
        <button type="button" class="chat-preview-audio-trash" data-action="clear-chat-file" title="Remover audio" aria-label="Remover audio">🗑</button>
        <audio class="chat-preview-audio-player" controls src="${chatAttachmentPreviewUrl}"></audio>
      </div>`;
    activeChip = `<span class="chat-preview-chip-icon" aria-hidden="true">AUD</span>`;
  } else {
    body = `
      <div class="chat-preview-unavailable">
        <div class="chat-preview-file-icon" aria-hidden="true">▦</div>
        <strong>Prévia indisponível</strong>
        <span>${meta}</span>
      </div>`;
    activeChip = `<span class="chat-preview-chip-icon" aria-hidden="true">${escapeHtml(extension.slice(0, 3))}</span>`;
  }

  const chips = selectedFiles.map((item, index) => {
    const itemType = getChatFileMimeType(item);
    const itemExtension = escapeHtml(getChatFileExtension(item).slice(0, 3));
    let chipContent = `<span class="chat-preview-chip-icon" aria-hidden="true">${itemType.startsWith("audio/") ? "AUD" : itemExtension}</span>`;
    if (index === chatAttachmentPreviewIndex) chipContent = activeChip;
    else if (itemType.startsWith("image/")) {
      const itemUrl = URL.createObjectURL(item);
      chatAttachmentPreviewUrls.push(itemUrl);
      chipContent = `<img class="chat-preview-chip-image" src="${itemUrl}" alt="" aria-hidden="true">`;
    }

    return `
      <span class="chat-preview-chip-wrap">
        <button type="button" class="chat-preview-chip ${index === chatAttachmentPreviewIndex ? "is-active" : ""}" data-action="preview-chat-file" data-index="${index}" title="Visualizar ${escapeHtml(item.name)}" aria-label="Visualizar ${escapeHtml(item.name)}">
          ${chipContent}
        </button>
        <button type="button" class="chat-preview-chip-remove" data-action="remove-chat-file" data-index="${index}" title="Remover ${escapeHtml(item.name)}" aria-label="Remover ${escapeHtml(item.name)}">×</button>
      </span>`;
  }).join("");

  preview.innerHTML = `
    <button type="button" class="chat-preview-close" data-action="clear-chat-file" title="Remover anexo" aria-label="Remover anexo">×</button>
    <div class="chat-preview-title">${fileName}${selectedFiles.length > 1 ? ` + ${selectedFiles.length - 1} arquivo(s)` : ""}</div>
    <div class="chat-preview-body">${body}</div>
    <div class="chat-preview-strip" aria-label="Anexo selecionado">
      ${chips}
      <label class="chat-preview-add" for="chat-file" title="Trocar anexo" aria-label="Trocar anexo">+</label>
    </div>
  `;
  preview.hidden = false;
}

function resetAudioRecordButton() {
  const button = document.getElementById("record-audio-button");
  if (!button) return;
  button.title = "Gravar áudio";
  button.setAttribute("aria-label", "Gravar áudio");
  button.classList.remove("is-recording");
  button.classList.remove("is-processing");
  stopChatAudioTimer();
  updateChatAudioDuration(0);
  button.disabled = false;
}

function formatAudioDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateChatAudioDuration(totalSeconds) {
  const duration = document.getElementById("recording-duration");
  if (duration) duration.textContent = formatAudioDuration(totalSeconds);
}

function startChatAudioTimer() {
  stopChatAudioTimer();
  chatAudioStartedAt = Date.now();
  updateChatAudioDuration(0);
  chatAudioTimer = window.setInterval(() => {
    updateChatAudioDuration((Date.now() - chatAudioStartedAt) / 1000);
  }, 250);
}

function stopChatAudioTimer() {
  if (chatAudioTimer) {
    window.clearInterval(chatAudioTimer);
    chatAudioTimer = null;
  }
  chatAudioStartedAt = 0;
}

function stopChatAudioStream() {
  if (!chatAudioStream) return;
  chatAudioStream.getTracks().forEach((track) => track.stop());
  chatAudioStream = null;
}

function getSupportedChatAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function getChatAudioFileExtension(mimeType = "") {
  const normalizedType = getChatFileMimeType({ type: mimeType });
  if (normalizedType === "audio/mp4") return "m4a";
  if (normalizedType === "audio/ogg") return "ogg";
  if (normalizedType === "audio/wav") return "wav";
  if (normalizedType === "audio/mpeg") return "mp3";
  return "webm";
}

async function toggleChatAudioRecording() {
  const button = document.getElementById("record-audio-button");
  if (!button) return;

  if (chatAudioRecorder?.state === "recording") {
    chatAudioRecorder.stop();
    button.title = "Processando áudio";
    button.setAttribute("aria-label", "Processando áudio");
    button.classList.remove("is-recording");
    button.classList.add("is-processing");
    button.disabled = true;
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showModal("Gravação indisponível", "Seu navegador não suporta gravação de áudio neste canal.", "error");
    return;
  }

  try {
    chatAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedChatAudioMimeType();
    chatAudioChunks = [];
    chatAudioRecorder = new MediaRecorder(chatAudioStream, mimeType ? { mimeType } : undefined);
    chatAudioRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) chatAudioChunks.push(event.data);
    });
    chatAudioRecorder.addEventListener("stop", () => {
      const recordedMimeType = chatAudioRecorder?.mimeType || mimeType || "audio/webm";
      const type = getChatFileMimeType({ type: recordedMimeType, name: `audio.${getChatAudioFileExtension(recordedMimeType)}` }) || "audio/webm";
      const extension = getChatAudioFileExtension(type);
      const blob = new Blob(chatAudioChunks, { type });
      chatAudioRecorder = null;
      chatAudioChunks = [];
      stopChatAudioStream();
      resetAudioRecordButton();
      if (!blob.size) {
        showModal("Áudio vazio", "A gravação não capturou áudio.", "error");
        return;
      }
      const file = new File([blob], `audio-chat-${Date.now()}.${extension}`, { type });
      const error = validateChatFile(file);
      if (error) {
        showModal("Anexo inválido", error, "error");
        return;
      }
      setChatSelectedFile(file);
    });
    chatAudioRecorder.start();
    startChatAudioTimer();
    button.title = "Parar gravação";
    button.setAttribute("aria-label", "Parar gravação");
    button.classList.add("is-recording");
    button.classList.remove("is-processing");
  } catch (error) {
    console.error("Erro ao gravar audio:", error);
    stopChatAudioStream();
    resetAudioRecordButton();
    const errorName = String(error?.name || "");
    const message = errorName === "NotAllowedError" || errorName === "SecurityError"
      ? "Não foi possível acessar o microfone. Verifique se a permissão do navegador está liberada para este site."
      : "Não foi possível iniciar a gravação de áudio. Verifique se há um microfone conectado e tente novamente.";
    showModal("Microfone indisponível", message, "error");
  }
}

function validateResumeFile(file) {
  if (!file || !file.name) {
    return "Anexe um curriculo em PDF, DOC ou DOCX.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = String(file.type || "").toLowerCase();

  if (!RESUME_ALLOWED_EXTENSIONS.has(extension) || !RESUME_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas arquivos PDF, DOC ou DOCX.";
  }

  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return "O curriculo deve ter no maximo 5 MB.";
  }

  if (file.size <= 0) {
    return "O arquivo enviado parece estar vazio.";
  }

  return null;
}

function validateContractorDocumentFile(file) {
  if (!file || !file.name) return "Anexe pelo menos um documento.";
  if (file.size <= 0) return "Um dos arquivos enviados parece estar vazio.";
  if (file.size > CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES) return "Cada documento deve ter no máximo 10 MB.";
  return null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo anexado."));
    reader.readAsDataURL(file);
  });
}

function createContractorDocumentField(required = false) {
  return `
    <div class="contractor-document-field">
      <label>${required ? "Documentos" : "Documento adicional"}
        <input name="documentos" type="file" multiple ${required ? "required" : ""} />
      </label>
      ${required ? "" : '<button class="secondary-link contractor-remove-document-button" type="button" data-action="remover-documento-contratado">Remover</button>'}
    </div>
  `;
}

function resetContractorDocumentFields(container) {
  if (!container) return;
  container.innerHTML = createContractorDocumentField(true);
}

async function buildContractorDocumentPayload(documentos) {
  const files = Array.from(documentos || []);
  const embeddedDocuments = [];
  for (const file of files) {
    embeddedDocuments.push({
      name: String(file.name || "documento"),
      size: Number(file.size || 0),
      type: String(file.type || "application/octet-stream"),
      dataUrl: await readFileAsDataUrl(file),
    });
  }
  return embeddedDocuments;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function validatePublicFormSubmission(formElement) {
  const honeypot = String(formElement?.elements?.website?.value || "").trim();

  if (honeypot) {
    return "Nao foi possivel validar o envio. Recarregue a pagina e tente novamente.";
  }

  return null;
}

function getPublicChallengeToken(formElement) {
  return String(
    formElement?.querySelector('[name="cf-turnstile-response"]')?.value ||
    formElement?.elements?.turnstileToken?.value ||
    ""
  ).trim();
}

function loadTurnstileScript() {
  if (document.querySelector('script[data-turnstile-loader]')) return;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  script.dataset.turnstileLoader = "true";
  document.head.appendChild(script);
}

function ensurePublicCaptchaNotice(formElement) {
  const config = getHubSupabaseConfig();
  if (!formElement || !config.turnstileSiteKey || formElement.querySelector(".cf-turnstile")) return;

  loadTurnstileScript();
  const target = document.createElement("div");
  target.className = "cf-turnstile";
  target.dataset.sitekey = config.turnstileSiteKey;
  formElement.querySelector('button[type="submit"]')?.before(target);
}

async function submitPublicRecord(collection, payload, turnstileToken = "") {
  const config = getHubSupabaseConfig();
  if (!config.url || !config.anonKey) throw new Error("Supabase publico indisponivel.");

  const response = await fetch(`${config.url}/functions/v1/hub-public-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": config.anonKey,
      "Authorization": `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({
      type: collection,
      payload,
      turnstileToken,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return result.data;
}

async function submitPublicApplicationWithFile({ vaga_id, nome, telefone, cpf, curriculo, turnstileToken }) {
  const config = getHubSupabaseConfig();
  if (!config.url || !config.anonKey) throw new Error("Supabase publico indisponivel.");

  const body = new FormData();
  body.append("type", "candidaturas");
  body.append("vaga_id", String(vaga_id || ""));
  body.append("nome", String(nome || ""));
  body.append("telefone", String(telefone || ""));
  body.append("cpf", String(cpf || ""));
  body.append("curriculo", curriculo);
  body.append("turnstileToken", String(turnstileToken || ""));

  const response = await fetch(`${config.url}/functions/v1/hub-public-submit`, {
    method: "POST",
    headers: {
      "apikey": config.anonKey,
      "Authorization": `Bearer ${config.anonKey}`,
    },
    body,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return result.data;
}

async function submitPublicContractorDocuments({ empresa, origemHtml, nome, telefone, cpf, documentos, accessPassword, turnstileToken }) {
  const config = getHubSupabaseConfig();
  if (!config.url || !config.anonKey) throw new Error("Supabase publico indisponivel.");
  const embeddedDocuments = await buildContractorDocumentPayload(documentos);

  const buildBody = (submissionType) => {
    const body = new FormData();
    body.append("type", submissionType);
    body.append("submissionType", submissionType);
    body.append("tipo", submissionType);
    body.append("empresa", String(empresa || ""));
    body.append("origemHtml", String(origemHtml || ""));
    body.append("nome", String(nome || ""));
    body.append("telefone", String(telefone || ""));
    body.append("cpf", String(cpf || ""));
    body.append("accessPassword", String(accessPassword || ""));
    Array.from(documentos || []).forEach((file) => body.append("documentos", file));
    body.append("turnstileToken", String(turnstileToken || ""));
    return body;
  };

  const attempts = [
    {
      url: `${config.url}/rest/v1/rpc/hub_submit_contractor_documents`,
      rpc: true,
      body: {
        payload: {
          empresa: String(empresa || ""),
          origemHtml: String(origemHtml || ""),
          accessPassword: String(accessPassword || ""),
          nome: String(nome || ""),
          telefone: String(telefone || ""),
          cpf: String(cpf || ""),
          documentos: embeddedDocuments,
        },
      },
    },
    { url: "/api/contractor-documents", type: "documentosContratados", localApi: true },
    { url: `${config.url}/functions/v1/hub-public-submit?type=documentosContratados`, type: "documentosContratados" },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const response = await fetch(attempt.url, {
      method: "POST",
      headers: attempt.localApi ? {} : attempt.rpc ? {
        "Content-Type": "application/json",
        "apikey": config.anonKey,
        "Authorization": `Bearer ${config.anonKey}`,
      } : {
        "apikey": config.anonKey,
        "Authorization": `Bearer ${config.anonKey}`,
      },
      body: attempt.rpc ? JSON.stringify(attempt.body) : buildBody(attempt.type),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      const savedRecord = mapContractorDocumentRow(result.data || {});
      if (savedRecord.id) {
        data.documentosContratados = mergeContractorDocuments([savedRecord], data.documentosContratados || []);
        saveLocalData();
      }
      return result.data;
    }

    lastError = new Error(result.error || "Envio publico bloqueado.");
    lastError.code = result.code;
    lastError.status = response.status;
    const canTryNext = /tipo invalido|not found|not_found|funcao sem supabase_service_role_key|function not found|schema cache|row-level security/i.test(lastError.message)
      || [400, 401, 404, 405, 500].includes(response.status);
    if (!canTryNext) throw lastError;
  }

  throw new Error(lastError?.message || "Nao foi possivel salvar os documentos no Supabase. O envio nao foi registrado para o RH.");
}

function isPublicInsertOnlyCollection(collection) {
  return isPublicSubmissionFormPage() && ["denuncias", "chamados", "candidaturas", "documentosContratados"].includes(collection);
}

function toPublicSubmissionPayload(collection, values) {
  if (collection === "denuncias") {
    return {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: String(values.descricao || "").trim(),
      status: "Aberta",
    };
  }

  if (collection === "chamados") {
    return {
      solicitante: String(values.solicitante || "").trim(),
      unidade: String(values.unidade || "").trim(),
      setor: String(values.setor || "").trim(),
      epis: String(values.epis || "").trim(),
      observacoes: String(values.observacoes || "").trim(),
      status: "Aberto",
      created_by: "Publico",
    };
  }

  return toDbPayload(collection, values);
}

function appendLocalInsertedItem(collection, values) {
  data[collection].unshift({
    id: generateUUID(),
    createdAt: todayLabel(),
    createdBy: values.createdBy || getCurrentUserName(),
    ...values,
  });
}

async function addItem(collection, values) {
  if (!supabaseClient) {
    appendLocalInsertedItem(collection, values);
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const isPublicInsert = isPublicInsertOnlyCollection(collection);
    const { _turnstileToken, ...cleanValues } = values;
    const payload = isPublicInsert
      ? toPublicSubmissionPayload(collection, cleanValues)
      : toDbPayload(collection, values);

    if (isPublicInsert) {
      const inserted = await submitPublicRecord(collection, payload, _turnstileToken);
      data[collection].unshift(inserted ? mapRows(collection, [inserted])[0] : {
        id: generateUUID(),
        createdAt: todayLabel(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      if (!isPublicPage()) {
        saveLocalData();
        renderAll();
      }
      return true;
    }

    const { data: inserted, error } = await supabaseClient
      .from(TABLES[collection])
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: insertedWithoutAuthor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutCreatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutAuthor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase sem autoria", false);
        renderAll();
        return true;
      }

      if (collection === "malotes" && isMissingColumn(error, "updated_by")) {
        const { data: insertedWithoutEditor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutUpdatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutEditor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: insertedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutOptionalJobColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A vaga foi salva em modo compatibilidade. Rode o supabase-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      if (collection === "candidaturas" && isMissingColumn(error, "telefone")) {
        const { data: insertedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutOptionalApplicationColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          telefone: values.telefone || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A candidatura foi salva, mas rode o supabase-schema.sql atualizado para gravar telefone no banco.", "info");
        return true;
      }

      throw error;
    }

    data[collection].unshift(mapRows(collection, [inserted])[0]);
    saveLocalData();
    setSyncStatus("Supabase EIXO online", true);
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao salvar no Supabase:", error);
    if (collection === "eventos") {
      data[collection].unshift({
        id: generateUUID(),
        createdAt: todayLabel(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      saveLocalData();
      setSyncStatus("Evento salvo localmente", false);
      renderAll();
      showModal("Evento salvo localmente", "Rode o SQL do calendario no Supabase para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no Supabase", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows = error?.code === "PGRST116";
    const message = isPublicInsertOnlyCollection(collection)
      ? (error?.message || "Nao foi possivel enviar o formulario publico.")
      : collection === "chamados"
        ? "Nao foi possivel abrir o chamado. Rode o arquivo fix-chamados-supabase.sql no Supabase para criar a tabela hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para salvar a vaga. Verifique se seu usuario tem cargo 'RH' na tabela hub_users e se o e-mail do perfil coincide com o e-mail do login. Rode o hub-vagas-fix.sql para corrigir."
          : collection === "vagas"
            ? `Nao foi possivel salvar a vaga. ${error?.message || "Confira se as colunas descricao, requisitos e created_by existem em hub_vagas (rode hub-vagas-fix.sql)."}`
            : "Nao foi possivel salvar no Supabase. Confira se as tabelas hub_* existem no projeto EIXO.";
    showModal("Erro ao Salvar", message, "error");
    return false;
  }
}

/**
 * [ALERTA DE SEGURANÇA - IDOR] Esta função recebe um 'id' diretamente do cliente.
 * Sem uma política de Row Level Security (RLS) no Supabase, um usuário autenticado
 * poderia, teoricamente, alterar este 'id' para modificar ou deletar um registro
 * que não lhe pertence.
 * SOLUÇÃO: Implemente políticas de RLS na tabela correspondente no Supabase para garantir que um usuário só possa operar nos registros que ele tem permissão (ex: que ele mesmo criou).
 */
async function updateItem(collection, id, values) {
  if (!id) return false;

  if (!supabaseClient) {
    data[collection] = (data[collection] || []).map((item) =>
      String(item.id) === String(id) ? { ...item, ...values } : item
    );
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const payload = toDbPayload(collection, values);
    if (collection === "malotes") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
    if (collection === "eventos") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
    if (collection === "chamados") {
      delete payload.created_by;
    }
    if (collection === "vagas") {
      delete payload.created_by;
    }
    const { data: updated, error } = await supabaseClient
      .from(TABLES[collection])
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: updatedWithoutAuthor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutCreatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, updatedWithoutAuthor, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase sem autoria", false);
        return true;
      }

      if ((collection === "malotes" || collection === "eventos") && isMissingColumn(error, "updated_by")) {
        const { data: updatedWithoutEditor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutUpdatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedWithoutEditor,
          updated_by: values.updatedBy || getCurrentUserName(),
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase precisa migracao", false);
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: updatedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutOptionalJobColumns(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedLegacy,
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase precisa migracao", false);
        showModal("Banco precisa atualizar", "A vaga foi atualizada em modo compatibilidade. Rode o supabase-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      throw error;
    }

    mergeRealtimeRow(collection, updated, "UPDATE");
    renderRealtimeUpdate(collection);
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar no Supabase:", error);
    if (collection === "eventos") {
      data[collection] = (data[collection] || []).map((item) =>
        String(item.id) === String(id)
          ? { ...item, ...values, createdBy: item.createdBy || values.createdBy || getCurrentUserName(), updatedBy: values.updatedBy || getCurrentUserName() }
          : item
      );
      saveLocalData();
      setSyncStatus("Evento atualizado localmente", false);
      renderAll();
      showModal("Evento atualizado localmente", "Rode o SQL do calendario no Supabase para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no Supabase", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows   = error?.code === "PGRST116";
    const message =
      collection === "chamados"
        ? "O Supabase bloqueou o arquivamento do chamado. Rode o arquivo fix-arquivar-chamados-supabase.sql no Supabase para liberar UPDATE em hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para editar a vaga. Verifique se seu usuario tem cargo 'RH' em hub_users com o mesmo e-mail do login."
          : collection === "vagas"
            ? `Nao foi possivel editar a vaga. ${error?.message || "Confira as colunas de hub_vagas (rode hub-vagas-fix.sql)."}`
            : "Nao foi possivel atualizar o registro no Supabase.";
    showModal("Erro ao Atualizar", message, "error");
    return false;
  }
}

/**
 * [ALERTA DE SEGURANÇA - IDOR] Esta função recebe um 'id' diretamente do cliente para exclusão.
 * Sem uma política de Row Level Security (RLS) no Supabase, um usuário autenticado
 * poderia, teoricamente, alterar este 'id' para deletar um registro
 * que não lhe pertence.
 * SOLUÇÃO: Implemente políticas de RLS na tabela correspondente no Supabase para garantir que um usuário só possa deletar os registros que ele tem permissão.
 */
async function deleteItem(collection, id) {
  if (!id) return false;

  if (!supabaseClient) {
    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    if (collection === "vagas") {
      const { error: candidaturaError } = await supabaseClient.from(TABLES.candidaturas).delete().eq("vaga_id", id);
      if (candidaturaError) throw candidaturaError;
    }

    const { data: deletedRows, error } = await supabaseClient.from(TABLES[collection]).delete().eq("id", id).select("id");
    if (error) throw error;

    if (!deletedRows?.length) {
      setSyncStatus("Delete pendente no Supabase", false);
      showModal("Permissao de Delete", "O Supabase nao confirmou a exclusao da vaga. Rode o supabase-schema.sql atualizado para liberar DELETE em hub_vagas.", "error");
      await refreshFromSupabase();
      return false;
    }

    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao deletar no Supabase:", error);
    if (collection === "eventos") {
      data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
      saveLocalData();
      renderAll();
      setSyncStatus("Evento deletado localmente", false);
      showModal("Evento deletado localmente", "Rode o SQL do calendario no Supabase para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no Supabase", false);
    showModal("Erro ao Deletar", "Nao foi possivel deletar o registro no Supabase.", "error");
    return false;
  }
}

function upsertLocalUser(values) {
  const normalizedName = normalizeLoginName(values.nome);
  const existingIndex = values.id ? data.usuarios.findIndex((user) => String(user.id) === String(values.id)) : data.usuarios.findIndex((user) => normalizeLoginName(user.nome) === normalizedName);
  const user = {
    id: values.id || (existingIndex >= 0 ? data.usuarios[existingIndex].id : generateUUID()),
    nome: getLoginDisplayName(values.nome) || values.nome,
    email: values.email || data.usuarios[existingIndex]?.email || "",
    cargo: values.cargo || data.usuarios[existingIndex]?.cargo || "",
    foto_perfil: values.foto_perfil || data.usuarios[existingIndex]?.foto_perfil || "",
    createdBy: values.createdBy || getCurrentUserName(),
    syncStatus: values.syncStatus || data.usuarios[existingIndex]?.syncStatus || "active",
    createdAt: existingIndex >= 0 ? data.usuarios[existingIndex].createdAt : todayLabel(),
  };

  if (existingIndex >= 0) {
    data.usuarios[existingIndex] = user;
  } else {
    data.usuarios.unshift(user);
  }

  const users = mergeUsersByName(loadTeamUsersStore(), data.usuarios);
  saveTeamUsersStore(users);
  syncTeamCredentials(users);
  saveLocalData();
  renderAll();
}

async function saveTeamUser(values) {
  const nome = String(values.nome || "").trim();
  const email = String(values.email || "").trim();
  const cpf = normalizeCpf(values.cpf);
  const cargo = String(values.cargo || "").trim();
  if (!nome || !email) return false;
  if (!isValidCpf(cpf)) {
    showModal("CPF invalido", "Informe um CPF valido para liberar o login por CPF.", "error");
    return false;
  }
  if (!cargo) {
    showModal("Cargo obrigatorio", "Selecione um cargo para cadastrar o usuario.", "error");
    return false;
  }

  if (!supabaseClient) {
    upsertLocalUser({ nome, email, cargo, syncStatus: "active" });
    return true;
  }

  try {
    const { data: existingRows, error: findError } = await supabaseClient
      .from(USERS_TABLE)
      .select("id, nome, email, cpf")
      .or(`email.ilike.${email},cpf.eq.${cpf}`)
      .limit(1);

    let existing = null;
    if (findError && isMissingColumn(findError, "email")) {
      const fallback = await supabaseClient
        .from(USERS_TABLE)
        .select("id, nome")
        .ilike("nome", nome)
        .limit(1);
      if (fallback.error) throw fallback.error;
      existing = fallback.data?.[0] || null;
    } else if (findError) {
      throw findError;
    } else {
      existing = existingRows?.[0] || null;
    }

    let query = existing
      ? supabaseClient.from(USERS_TABLE).update({ nome, email, cpf, cargo, created_by: getCurrentUserName() }).eq("id", existing.id)
      : supabaseClient.from(USERS_TABLE).insert({ nome, email, cpf, cargo, created_by: getCurrentUserName() });

    let result = await query.select("*");

    if (result.error && isMissingCreatedByColumn(result.error)) {
      query = existing
      ? supabaseClient.from(USERS_TABLE).update({ nome, email, cpf, cargo }).eq("id", existing.id)
      : supabaseClient.from(USERS_TABLE).insert({ nome, email, cpf, cargo });
      result = await query.select("*");
    }

    if (result.error && isMissingColumn(result.error, "email")) {
      query = existing
        ? supabaseClient.from(USERS_TABLE).update({ nome, cargo, created_by: getCurrentUserName() }).eq("id", existing.id)
        : supabaseClient.from(USERS_TABLE).insert({ nome, cargo, created_by: getCurrentUserName() });
      result = await query.select("*");
    }

    if (result.error) throw result.error;
    const savedRows = result.data;

    const saved = mapRows("usuarios", savedRows || [])[0] || { nome, email, cargo, createdAt: todayLabel() };
    upsertLocalUser({ ...saved, email: saved.email || email, cpf: saved.cpf || cpf, cargo: saved.cargo || cargo, syncStatus: "active" });
    setSyncStatus("Supabase EIXO online", true);
    showModal("Perfil salvo", "Crie ou atualize o usuário correspondente no Supabase Auth para liberar o login.", "info");
    return true;
  } catch (error) {
    console.error("Erro ao salvar usuario no Supabase:", error);
    upsertLocalUser({ nome, email, cargo, syncStatus: "local" });
    setSyncStatus("Usuario salvo local", false);
    showModal("Aviso de Banco de Dados", "O perfil foi salvo localmente. Crie o usuario no Supabase Auth e confira a tabela hub_users.", "error");
    return true;
  }
}

async function loadPublicData() {
  if (!isPublicJobsPage()) return;

  try {
    const config = getHubSupabaseConfig();
    if (!config.url || !config.anonKey) throw new Error("Supabase publico indisponivel.");

    const response = await fetch(`${config.url}/functions/v1/hub-public-submit?type=vagas`, {
      headers: {
        "apikey": config.anonKey,
        "Authorization": `Bearer ${config.anonKey}`,
      },
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nao foi possivel carregar vagas publicas.");

    const rows = result.data || [];
    data.vagas = mapRows("vagas", rows || []);
    renderPublicVagas();
  } catch (error) {
    console.error("Erro ao carregar vagas publicas:", error);
    renderPublicVagas();
  }
}

async function updateCurrentAccount(currentPassword, newName, newPassword, newFotoUrl) {
  const user = getCurrentUserRecord();
  if (!user) {
    showModal("Conta nao encontrada", "Nao foi possivel localizar sua conta nesta sessao.", "error");
    return false;
  }

  const updatedUser = {
    ...user,
    nome: newName || user.nome,
    foto_perfil: newFotoUrl || user.foto_perfil,
    cargo: user.cargo || getCurrentUserRole(),
    syncStatus: user.syncStatus || "active",
  };

  if (newPassword && supabaseClient?.auth) {
    if (currentPassword) {
      const isPasswordValid = await verifyCurrentPassword(currentPassword);
      if (!isPasswordValid) {
        showModal("Senha incorreta", "A senha atual informada nao confere.", "error");
        return false;
      }
    }
    const { error: authError } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (authError) {
      console.error("Erro ao atualizar senha no Supabase Auth:", authError);
      showModal("Erro", "Nao foi possivel atualizar a senha no Supabase Auth.", "error");
      return false;
    }
  }

  if (!supabaseClient) {
    upsertLocalUser(updatedUser);
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    return true;
  }

  try {
    const session = await getAuthSession();
    if (!session?.access_token) throw new Error("Sessao expirada.");

    const config = getHubSupabaseConfig();
    const response = await fetch(`${config.url}/functions/v1/hub-account-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.anonKey,
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        nome: updatedUser.nome,
        foto_perfil: newFotoUrl || null,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nao foi possivel atualizar o perfil.");

    const saved = mapRows("usuarios", result.data ? [result.data] : [])[0] || updatedUser;
    const persistedUser = { ...updatedUser, ...saved };
    upsertLocalUser(persistedUser);

    // Rendering prioritizes this in-memory profile over the local user list.
    // Keep it in sync so a newly uploaded avatar is shown immediately.
    currentUserProfile = { ...(currentUserProfile || {}), ...persistedUser };
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    upsertLocalUser({ ...updatedUser, syncStatus: "local" });
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("Conta atualizada local", false);
    showModal("Atualizacao local", "Os dados foram alterados localmente. Rode os SQLs atualizados no Supabase se o banco bloquear as colunas.", "info");
    return true;
  }
}

function removeLocalUser(id) {
  const removedUser = data.usuarios.find((user) => String(user.id) === String(id));
  const keepUser = (user) => String(user.id) !== String(id) && normalizeLoginName(user.nome) !== normalizeLoginName(removedUser?.nome);
  data.usuarios = data.usuarios.filter(keepUser);
  const users = loadTeamUsersStore().filter(keepUser);
  const credentials = loadTeamCredentialsStore().filter(keepUser);
  saveTeamUsersStore(users);
  saveTeamCredentialsStore(credentials);

  if (removedUser && normalizeLoginName(removedUser.nome) === normalizeLoginName(getCurrentUserName())) {
    clearAuthenticatedUser();
    window.location.href = "login.html";
    return;
  }

  saveLocalData();
  renderAll();
}

async function deleteTeamUser(id) {
  if (!id) return false;

  const localUser = data.usuarios.find((u) => String(u.id) === String(id));

  if (!supabaseClient || !localUser) {
    removeLocalUser(id);
    return true;
  }

  try {
    const { error } = await supabaseClient
      .from(USERS_TABLE)
      .delete()
      .eq("id", localUser.id);

    if (error) throw error;

    removeLocalUser(id);
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao excluir usuario no Supabase:", error);
    removeLocalUser(id);
    setSyncStatus("Usuario removido local", false);
    return true;
  }
}

function renderCards(targetId, items, template) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!items.length) {
    target.innerHTML = '<p class="empty-state">Nenhum registro cadastrado ainda.</p>';
    return;
  }

  target.innerHTML = items.map(template).join("");
}

function activateView(viewId) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  document.querySelectorAll(".user-chip").forEach((chip) => chip.classList.toggle("active", viewId === "conta"));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  if (viewId === "documentos-contratados") {
    refreshFromSupabase();
  }
}

function closeUserMenuDropdown() {
  const menu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-menu-dropdown");
  const trigger = document.getElementById("user-menu-trigger");
  if (!menu || !dropdown) return;
  menu.classList.remove("open");
  dropdown.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
}

function openUserMenuDropdown() {
  const menu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-menu-dropdown");
  const trigger = document.getElementById("user-menu-trigger");
  if (!menu || !dropdown) return;
  updateUserMenuHeader();
  menu.classList.add("open");
  dropdown.hidden = false;
  trigger?.setAttribute("aria-expanded", "true");
}

function toggleUserMenuDropdown() {
  const dropdown = document.getElementById("user-menu-dropdown");
  if (!dropdown) return;
  if (dropdown.hidden) {
    openUserMenuDropdown();
  } else {
    closeUserMenuDropdown();
  }
}

function updateUserMenuHeader() {
  const nameEl = document.getElementById("user-menu-name");
  const roleEl = document.getElementById("user-menu-role");
  const avatarEl = document.getElementById("user-menu-avatar");
  const user = getCurrentUserRecord?.();
  if (nameEl) nameEl.textContent = getCurrentUserName?.() || "Usuario";
  if (roleEl) roleEl.textContent = user?.cargo || getCurrentUserRole?.() || "Colaborador HUB";
  if (avatarEl) {
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatarEl.src = user.foto_perfil;
    } else if (user?.foto_perfil && supabaseClient) {
      createPrivateStorageUrl(getHubSupabaseConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => { avatarEl.src = signedUrl; })
        .catch(() => {});
    }
  }
}

function setupUserMenuDropdown() {
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  if (!trigger || !dropdown) return;
  if (trigger.dataset.menuReady === "true") return;
  trigger.dataset.menuReady = "true";

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenuDropdown();
  });

  dropdown.querySelectorAll(".user-menu-item[data-view]").forEach((item) => {
    item.addEventListener("click", () => {
      const panelId = item.dataset.settingsTarget || "settings-account-panel";
      showSettingsPanel(panelId);
      renderAccountSettings();
      closeUserMenuDropdown();
    });
  });

  document.getElementById("user-menu-logout")?.addEventListener("click", () => {
    closeUserMenuDropdown();
    logout();
  });

  document.addEventListener("click", (event) => {
    const menu = document.getElementById("user-menu");
    if (menu && !menu.contains(event.target)) closeUserMenuDropdown();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUserMenuDropdown();
  });
}

document.addEventListener("DOMContentLoaded", setupUserMenuDropdown);
if (document.readyState === "complete" || document.readyState === "interactive") {
  setupUserMenuDropdown();
}

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function parseBrazilianCurrency(value) {
  const normalized = String(value || "").replace(/[^\d,]/g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function formatCurrencyInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const reais = String(Number(padded.slice(0, -2)));
  const centavos = padded.slice(-2);
  return `${reais},${centavos}`;
}

function calculateVtValue(diasUteis, valorPassagem, saldoAtual) {
  return Math.max(0, (Number(diasUteis) || 0) * (Number(valorPassagem) || 0) - (Number(saldoAtual) || 0));
}

const VT_MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatVtMonth(value) {
  if (VT_MONTH_NAMES.includes(String(value || ""))) return String(value);
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return "Não informado";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}

function updateVtCalculation() {
  const diasUteis = Number(document.getElementById("vt-dias-uteis")?.value || 0);
  const valorPassagem = parseBrazilianCurrency(document.getElementById("vt-valor-passagem")?.value || 0);
  const saldoAtual = Number(document.getElementById("vt-saldo-atual")?.value || 0);
  const total = calculateVtValue(diasUteis, valorPassagem, saldoAtual);
  const result = document.getElementById("vt-valor-necessario");
  const detail = document.getElementById("vt-calculo-detalhe");
  if (result) result.textContent = formatCurrencyBRL(total);
  if (detail) {
    detail.textContent = `${diasUteis || 0} dias × ${formatCurrencyBRL(valorPassagem)} - ${formatCurrencyBRL(saldoAtual)} = ${formatCurrencyBRL(total)}`;
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
  const nameFilter = String(document.getElementById("vt-filter-nome")?.value || "").trim().toLowerCase();
  const monthFilter = document.getElementById("vt-filter-mes")?.value || "";
  const unitFilter = document.getElementById("vt-filter-unidade")?.value || "";

  return (data.vtRegistros || []).filter((item) => {
    const itemName = String(item.colaborador || "").toLowerCase();
    const itemMonth = formatVtMonth(item.mes);
    if (nameFilter && !itemName.includes(nameFilter)) return false;
    if (monthFilter && itemMonth !== monthFilter) return false;
    if (unitFilter && item.unidade !== unitFilter) return false;
    return true;
  });
}

function getVtReportFilterLabel(useFilters = true) {
  if (!useFilters) return "Todos os registros";
  const parts = [];
  const nameFilter = String(document.getElementById("vt-filter-nome")?.value || "").trim();
  const monthFilter = document.getElementById("vt-filter-mes")?.value || "";
  const unitFilter = document.getElementById("vt-filter-unidade")?.value || "";
  if (nameFilter) parts.push(`Nome: ${nameFilter}`);
  if (monthFilter) parts.push(`Mês: ${monthFilter}`);
  if (unitFilter) parts.push(`Unidade: ${unitFilter}`);
  return parts.length ? parts.join(" | ") : "Sem filtros ativos";
}

function formatVtReportDateTime(value = new Date()) {
  if (value instanceof Date) {
    return value.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return String(value || "")
    .replace(/(\d{1,2}:\d{2}):\d{2}/, "$1")
    .replace(/,\s*/g, " ")
    .trim();
}

function getVtReportRows(useFilters = true) {
  const registros = useFilters ? getFilteredVtRegistros() : (data.vtRegistros || []);
  return registros.map((item) => ({
    colaborador: item.colaborador || "Colaborador não informado",
    unidade: item.unidade || "Não informada",
    mes: formatVtMonth(item.mes),
    diasUteis: Number(item.diasUteis) || 0,
    valorPassagem: Number(item.valorPassagem) || 0,
    saldoAtual: Number(item.saldoAtual) || 0,
    valorNecessario: Number(item.valorNecessario) || 0,
    registradoEm: formatVtReportDateTime(item.createdAt || todayLabel()),
  }));
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
            <small>${escapeHtml(String(filteredCount))} registro(s) · ${escapeHtml(getVtReportFilterLabel(true))}</small>
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

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index) {
  let name = "";
  let current = index;
  while (current >= 0) {
    name = String.fromCharCode((current % 26) + 65) + name;
    current = Math.floor(current / 26) - 1;
  }
  return name;
}

function worksheetCellXml(value, rowIndex, colIndex, styleId = 0) {
  const ref = `${columnName(colIndex)}${rowIndex}`;
  const styleAttribute = styleId ? ` s="${styleId}"` : "";
  if (typeof value === "number") return `<c r="${ref}"${styleAttribute}><v>${Number.isFinite(value) ? value : 0}</v></c>`;
  return `<c r="${ref}"${styleAttribute} t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function worksheetRowXml(values, rowIndex, styleId = 0) {
  return `<row r="${rowIndex}">${values.map((value, colIndex) => worksheetCellXml(value, rowIndex, colIndex, styleId)).join("")}</row>`;
}

function buildVtReportWorksheet(rows) {
  const headers = ["Colaborador", "Unidade", "Mês", "Dias úteis", "Valor da passagem", "Saldo atual", "Valor necessário", "Registrado em"];
  const sheetRows = [
    worksheetRowXml(["Relatório de Vale Transporte"], 1, 2),
    worksheetRowXml([`Gerado em ${formatVtReportDateTime(new Date())}`], 2, 2),
    worksheetRowXml(headers, 5, 1),
    ...rows.map((item, index) => worksheetRowXml([
      item.colaborador,
      item.unidade,
      item.mes,
      item.diasUteis,
      item.valorPassagem,
      item.saldoAtual,
      item.valorNecessario,
      item.registradoEm,
    ], index + 6)),
  ];
  const lastRow = rows.length + 5;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:H${lastRow}"/>
  <cols>
    <col min="1" max="1" width="30" customWidth="1"/>
    <col min="2" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="12" customWidth="1"/>
    <col min="5" max="7" width="18" customWidth="1"/>
    <col min="8" max="8" width="22" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows.join("")}</sheetData>
  <mergeCells count="2"><mergeCell ref="A1:H1"/><mergeCell ref="A2:H2"/></mergeCells>
</worksheet>`;
}

function makeCrc32Table() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC32_TABLE = makeCrc32Table();

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function appendBytes(target, bytes) {
  bytes.forEach((byte) => target.push(byte));
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const output = [];
  const central = [];
  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const offset = output.length;
    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, crc);
    writeUint32(output, contentBytes.length);
    writeUint32(output, contentBytes.length);
    writeUint16(output, nameBytes.length);
    writeUint16(output, 0);
    appendBytes(output, nameBytes);
    appendBytes(output, contentBytes);

    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, crc);
    writeUint32(central, contentBytes.length);
    writeUint32(central, contentBytes.length);
    writeUint16(central, nameBytes.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    appendBytes(central, nameBytes);
  });
  const centralOffset = output.length;
  appendBytes(output, central);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, central.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);
  return new Blob([new Uint8Array(output)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function createVtReportXlsxBlob(rows) {
  const worksheet = buildVtReportWorksheet(rows);
  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Registros VT" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2F7D6D"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}

function gerarRelatorioVt(scope = "filtered") {
  const useFilters = scope !== "all";
  const rows = getVtReportRows(useFilters);
  if (!rows.length) {
    showModal("Relatório vazio", "Não há registros de VT para gerar o relatório.", "error");
    return;
  }
  const blob = createVtReportXlsxBlob(rows);
  downloadBlob(blob, safeDownloadName(`relatorio-vt-${useFilters ? "filtrado" : "todos"}`, "xlsx"));
  document.getElementById("custom-modal")?.remove();
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
      <p><strong>Mês:</strong> ${escapeHtml(formatVtMonth(item.mes))}</p>
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

function formatContractorDocumentList(documentos = []) {
  if (!documentos.length) return '<p class="empty-state">Nenhum arquivo vinculado.</p>';
  return documentos.map((doc, index) => {
    const name = escapeHtml(doc.name || `Documento ${index + 1}`);
    if (doc.dataUrl) {
      return `
        <button
          class="secondary-link contractor-file-button"
          type="button"
          data-download-url="${escapeHtml(doc.dataUrl)}"
          data-download-name="${name}"
        >
          ${name}
        </button>
      `;
    }
    return `
      <button
        class="secondary-link private-file-button contractor-file-button"
        type="button"
        data-private-storage-bucket="${CONTRACTOR_DOCUMENTS_BUCKET}"
        data-private-storage-path="${escapeHtml(doc.path || "")}"
        data-private-storage-name="${name}"
      >
        ${name}
      </button>
    `;
  }).join("");
}

function getContratadoFilterValues() {
  return {
    nome: String(document.getElementById("contratado-filter-nome")?.value || "").trim().toLowerCase(),
    telefone: String(document.getElementById("contratado-filter-telefone")?.value || "").replace(/\D/g, ""),
    cpf: String(document.getElementById("contratado-filter-cpf")?.value || "").replace(/\D/g, ""),
  };
}

function updateContratadoFilterClearButton() {
  const clearButton = document.getElementById("clear-contratado-filters");
  if (!clearButton) return;
  const filters = getContratadoFilterValues();
  clearButton.hidden = !Boolean(filters.nome || filters.telefone || filters.cpf);
}

function filterContratadoRecords(items = []) {
  const filters = getContratadoFilterValues();
  return items.filter((item) => {
    if (filters.nome && !String(item.nome || "").toLowerCase().includes(filters.nome)) return false;
    if (filters.telefone && !String(item.telefone || "").replace(/\D/g, "").includes(filters.telefone)) return false;
    if (filters.cpf && !String(item.cpf || "").replace(/\D/g, "").includes(filters.cpf)) return false;
    return true;
  });
}

function renderDocumentosContratados() {
  const syncedItems = (data.documentosContratados || []).filter((item) => !String(item.id || "").startsWith("local-") && !item.pendingSync);
  const filteredItems = filterContratadoRecords(syncedItems);
  updateContratadoFilterClearButton();
  renderCards("documentos-contratados-list", filteredItems, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.nome || "Contratado não informado")}</p>
        <span class="tag">${escapeHtml(item.empresa || "Empresa não informada")}</span>
        ${item.pendingSync ? '<span class="tag alert">Pendente</span>' : ""}
      </div>
      <p><strong>CPF:</strong> ${escapeHtml(formatCpf(item.cpf || ""))}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(formatPhone(item.telefone || "") || "Não informado")}</p>
      <p><strong>Origem:</strong> ${escapeHtml(getContractorSourceLabel(item.origemHtml, item.empresa) || "Não informada")}</p>
      <p class="item-meta">${escapeHtml(item.createdAt || todayLabel())} | Enviado por ${escapeHtml(item.nome || "Contratado não informado")}</p>
      <div class="contractor-file-list">
        ${formatContractorDocumentList(item.documentos || [])}
      </div>
      <div class="job-actions section-top">
        <button class="danger-button" type="button" data-action="excluir-documento-contratado" data-id="${escapeHtml(item.id)}">Excluir</button>
      </div>
    </article>
  `);
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

/**
 * [ALERTA DE SEGURANÇA] Esta função controla a visibilidade dos elementos da UI
 * com base na role do usuário armazenada no sessionStorage. Um usuário mal-intencionado
 * pode facilmente alterar essa role no console do navegador para obter acesso visual
 * a seções restritas.
 * A segurança real da aplicação NÃO PODE depender desta função. Ela deve ser garantida
 * por políticas de Row Level Security (RLS) no Supabase, que filtram os dados no servidor.
 */
function applyRoleAccess() {
  if (!isAuthenticated() || isPublicPage() || !document.querySelector(".nav-list")) return;
  refreshCurrentUserRoleFromData();

  const chamadosUrls = new Set(["chamados.html", "https://hub-opal-nine.vercel.app/chamados.html"]);
  const denunciaUrls = new Set(["denuncia.html", "https://hub-opal-nine.vercel.app/denuncia.html"]);
  const allowedViews = isCashierUser()
    ? new Set(["comunicacao", "conta"])
    : isManagerUser()
    ? new Set(["comunicacao", "documentos", "conta"])
    : new Set(["dashboard", "denuncias", "comunicacao", "malotes", "chamados", "vagas", "calendario", "documentos", "documentos-contratados", "gerenciamento-vt", "equipe", "conta"]);
  const allowedExternalUrls = isCashierUser()
    ? new Set([...chamadosUrls, ...denunciaUrls])
    : isManagerUser()
    ? new Set([...chamadosUrls, ...denunciaUrls])
    : new Set();

  document.querySelectorAll(".nav-item").forEach((button) => {
    const allowed = button.dataset.externalUrl
      ? allowedExternalUrls.has(button.dataset.externalUrl)
      : allowedViews.has(button.dataset.view);
    button.hidden = !allowed;
    button.disabled = !allowed;
    button.style.display = allowed ? "" : "none";
  });

  document.querySelectorAll(".view").forEach((view) => {
    if (!allowedViews.has(view.id)) view.classList.remove("active");
  });

  const activeView = document.querySelector(".view.active");
  if (!activeView || !allowedViews.has(activeView.id)) {
    activateView(isCashierUser() ? "comunicacao" : isManagerUser() ? "documentos" : "dashboard");
  }
}

function isArchivedRecord(item) {
  return ["arquivado", "arquivada"].includes(String(item?.status || "").trim().toLowerCase());
}

function isSystemAuditAuthor(value) {
  return String(value || "").trim().toLowerCase() === "sistema";
}

function getDashboardSystemUpdateMeta(item = {}) {
  if (isSystemAuditAuthor(item.updatedBy)) return "Atualização do sistema";
  if (isSystemAuditAuthor(item.createdBy)) return "Registro do sistema";
  return "";
}

function renderDashboard() {
  if (!document.getElementById("metric-denuncias")) return;

  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status === "Aberta" || item.status === "Urgente").length;
  const unreadRhMessages = getUnreadRhMessages();
  notifyUnreadRhMessages(unreadRhMessages.length);
  if (document.getElementById("metric-comunicados")) {
    document.getElementById("metric-comunicados").textContent = unreadRhMessages.length;
  }
  if (document.getElementById("metric-malotes")) {
    document.getElementById("metric-malotes").textContent = data.malotes.filter((item) => !isArchivedRecord(item) && isTodayLabel(item.createdAt)).length;
  }
  if (document.getElementById("metric-vagas")) {
    document.getElementById("metric-vagas").textContent = data.vagas.filter((item) => !isArchivedRecord(item) && item.status !== "Fechada").length;
  }
  const upcomingEvents = getUpcomingEvents();
  if (document.getElementById("metric-eventos")) {
    document.getElementById("metric-eventos").textContent = upcomingEvents.length;
  }
  if (document.getElementById("metric-documentos")) {
    document.getElementById("metric-documentos").textContent = documentRecords.filter((item) => !isArchivedRecord(item)).length;
  }

  // Group messages by author
  const messagesByAuthor = {};
  unreadRhMessages.forEach((item) => {
    const author = item.autor || "Equipe";
    if (!messagesByAuthor[author]) {
      messagesByAuthor[author] = [];
    }
    messagesByAuthor[author].push(item);
  });

  // Convert grouped messages to dashboard items
  const groupedMessages = Object.entries(messagesByAuthor).map(([author, messages]) => {
    // Sort messages by date (most recent first)
    const sortedMessages = [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    return {
      kind: "notificacao",
      title: `Mensagem · ${author}`,
      text: messages.length === 1 
        ? messages[0].mensagem || "Nova notificação recebida."
        : `${messages.length} mensagens de ${author}`,
      details: sortedMessages
        .map((msg) => msg.mensagem || "Nova notificação recebida.")
        .join("\n\n"),
      detailsHeader: `Autor: ${author}\nTotal de mensagens: ${messages.length}`,
      tag: "Nova",
      date: sortedMessages[0].createdAt,
      messageCount: messages.length,
    };
  });

  const dashboardItems = [
    ...groupedMessages,
    ...data.denuncias
      .filter(item => item.status === "Aberta" || item.status === "Urgente")
      .map((item) => ({
        kind: "denuncia",
        title: "Denúncia anônima",
        text: item.descricao || "Nova denúncia recebida.",
        details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Status: ${item.status || "Aberta"}\nRecebida em: ${item.createdAt || "Não informado"}\n\n${item.descricao || "Sem descrição."}`,
        tag: item.status,
        date: item.createdAt,
        systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
        meta: getDashboardSystemUpdateMeta(item),
      })),
    ...data.chamados
      .filter((item) => item.status === "Aberto")
      .map((item) => {
        const items = parseEpiItems(item.epis);
        const itemDetails = items.length
          ? items.map((epi) => `${epi.nome}${epi.tamanho ? ` · Tam. ${epi.tamanho}` : ""} · Qtd. ${epi.quantidade}`).join("\n")
          : item.epis || "Não informados";
        return {
          kind: "chamado",
          title: `Chamado · ${item.unidade}`,
          text: item.epis || "Itens não informados.",
          details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Solicitante: ${item.solicitante || "Não informado"}\nUnidade: ${item.unidade || "Não informada"}\nSetor: ${item.setor || "Não informado"}\nItens solicitados:\n${itemDetails}\nObservações: ${item.observacoes || "Nenhuma"}\nData: ${item.createdAt || "Não informada"}`,
          tag: item.status,
          date: item.createdAt,
          systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
          meta: getDashboardSystemUpdateMeta(item),
        };
      }),
    ...data.malotes
      .filter((item) => !isArchivedRecord(item))
      .map((item) => {
        const items = parseEpiItems(item.epis);
        const itemDetails = items.length
          ? items.map((epi) => `${epi.nome}${epi.tamanho ? ` · Tam. ${epi.tamanho}` : ""} · Qtd. ${epi.quantidade}`).join("\n")
          : item.epis || "Não informados";
        return {
          kind: "malote",
          title: `Malote · ${item.destino}`,
          text: item.codigoSolicitacao ? `Solicitação ${item.codigoSolicitacao}` : item.epis || "Malote registrado.",
          details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Código da Solicitação: ${item.codigoSolicitacao || "Não informado"}\nOrigem: ${item.origem || "Não informada"}\nDestino: ${item.destino || "Não informado"}\nItens do malote:\n${itemDetails}\nObservações: ${item.observacoes || "Nenhuma"}\nStatus: ${item.status || "Não informado"}\nData: ${item.createdAt || "Não informada"}`,
          tag: item.status,
          date: item.createdAt,
          systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
          meta: getDashboardSystemUpdateMeta(item),
        };
      }),
    ...data.vagas
      .filter((item) => !isArchivedRecord(item))
      .map((item) => ({
        kind: "vaga",
        title: `Vaga · ${item.cargo}`,
        text: item.descricao || "Vaga atualizada.",
        details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Status: ${item.status || "Não informado"}\n\n${item.descricao || "Sem descrição."}\n\nRequisitos: ${item.requisitos || "Não informados"}`,
        tag: item.status,
        date: item.createdAt,
        systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
        meta: getDashboardSystemUpdateMeta(item),
      })),
    ...documentRecords
      .filter((item) => !isArchivedRecord(item))
      .map((item) => ({
        kind: "documento",
        title: `Documento · ${documentLabels[item.type] || item.type}`,
        text: item.summary || "Documento registrado.",
        details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Tipo: ${documentLabels[item.type] || item.type}\nData: ${item.createdAt || "Não informada"}\n\n${item.summary || "Documento registrado."}`,
        tag: "Registro",
        date: item.createdAt,
        systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
        meta: getDashboardSystemUpdateMeta(item),
      }))
  ];

  const dashboardPageSize = 3;
  if (dashboardNotificationOffset >= dashboardItems.length) dashboardNotificationOffset = 0;
  const visibleDashboardItems = dashboardItems.slice(dashboardNotificationOffset, dashboardNotificationOffset + dashboardPageSize);
  visibleDashboardActivityItems = visibleDashboardItems;
  const previousDashboardButton = document.getElementById("dashboard-notifications-prev");
  const nextDashboardButton = document.getElementById("dashboard-notifications-next");
  if (previousDashboardButton) previousDashboardButton.hidden = dashboardNotificationOffset === 0;
  if (nextDashboardButton) {
    nextDashboardButton.hidden = dashboardNotificationOffset + dashboardPageSize >= dashboardItems.length;
    nextDashboardButton.textContent = "Ver próximas";
  }

  const dashboardTarget = document.getElementById("dashboard-list");
  if (dashboardTarget) {
    if (!currentUserSettings.dashboardNotificationBadges) {
      visibleDashboardActivityItems = [];
      dashboardTarget.innerHTML = '<p class="empty-state">Novidades ocultas pelas suas configurações.</p>';
      if (previousDashboardButton) previousDashboardButton.hidden = true;
      if (nextDashboardButton) nextDashboardButton.hidden = true;
      renderDashboardCalendar(upcomingEvents);
      return;
    }
    if (visibleDashboardItems.length === 0) {
      dashboardTarget.innerHTML = '<p class="empty-state">Nenhuma pendência para acompanhar no momento.</p>';
    } else {
      dashboardTarget.innerHTML = visibleDashboardItems
        .map((item, index) => `<li class="dashboard-activity dashboard-activity-${escapeHtml(item.kind)}${item.systemUpdate ? " system-update" : ""}" data-action="open-dashboard-activity" data-index="${index}" tabindex="0" role="button"><span class="dashboard-activity-mark" aria-hidden="true"></span><div class="dashboard-activity-content"><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${item.systemUpdate ? "tag" : badgeClass(item.tag)}">${escapeHtml(item.systemUpdate ? "Sistema" : item.tag)}</span></div><p>${escapeHtml(String(item.text).slice(0, 96))}${String(item.text).length > 96 ? "…" : ""}</p><p class="item-meta meta-sm">${escapeHtml([item.date, item.meta].filter(Boolean).join(" | "))}</p></div></li>`)
        .join("");
    }
  }

  renderDashboardCalendar(upcomingEvents);
}

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
    ? "<span class=\"calendar-strip-weekday\">Dom</span><span class=\"calendar-strip-weekday\">Seg</span><span class=\"calendar-strip-weekday\">Ter</span><span class=\"calendar-strip-weekday\">Qua</span><span class=\"calendar-strip-weekday\">Qui</span><span class=\"calendar-strip-weekday\">Sex</span><span class=\"calendar-strip-weekday\">Sab</span>"
    : "";
  const leadingCells = dashboardCalendarViewMode === "month"
    ? Array.from({ length: leadingDays }, () => '<div class="calendar-day muted"></div>').join("")
    : "";
  strip.innerHTML = monthHeader + leadingCells + visibleDates
    .map((date) => {
      const dayEvents = (data.eventos || []).filter((item) => item.data === date);
      const holiday = getHolidayForDate(date);
      const isToday = date === todayKey;
      const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
      return `
        <button class="calendar-day ${isWeekend ? "is-weekend" : ""} ${isToday ? "today" : ""} ${dayEvents.length ? "has-event" : ""} ${holiday ? "is-holiday" : ""}" type="button" data-date="${escapeHtml(date)}" aria-label="Ver eventos de ${escapeHtml(formatEventDate(date))}">
          <span class="calendar-weekday-label">${escapeHtml(formatWeekday(date))}</span>
          <strong>${escapeHtml(new Date(`${date}T00:00:00`).getDate())}</strong>
          ${isToday ? `<span class="calendar-today-label">Hoje</span>` : ""}
          ${holiday ? `<span class="calendar-holiday-label" title="${escapeHtml(holiday)}">Feriado</span>` : ""}
          ${dayEvents.slice(0, 2).map((item) => `<span class="calendar-event-preview">${escapeHtml(item.titulo)}</span>`).join("")}
        </button>
      `;
    })
    .join("");

  if (!visibleEvents.length) {
    list.innerHTML = '<li><p class="empty-state">Nenhum evento proximo registrado.</p></li>';
    return;
  }

  list.innerHTML = visibleEvents
    .slice(0, dashboardCalendarViewMode === "week" ? 4 : 6)
    .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.titulo)}</p><span class="tag">${escapeHtml(item.tipo)}</span></div><p>${escapeHtml(formatEventDate(item.data))} as ${escapeHtml(formatEventTime(item.horario))} | ${escapeHtml(item.responsavel)}</p></li>`)
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
    const dayEvents = (data.eventos || []).filter((item) => item.data === date);
    const holiday = getHolidayForDate(date);
    const isToday = date === todayKey;
    const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
    cells.push(`
      <button class="calendar-cell ${isWeekend ? "is-weekend" : ""} ${isToday ? "today" : ""} ${dayEvents.length ? "has-event" : ""} ${holiday ? "is-holiday" : ""}" type="button" data-date="${escapeHtml(date)}" aria-label="Ver eventos de ${escapeHtml(formatEventDate(date))}">
        <strong>${day}</strong>
        ${isToday ? `<span class="calendar-today-label">Hoje</span>` : ""}
        ${holiday ? `<span class="calendar-holiday-label" title="${escapeHtml(holiday)}">Feriado</span>` : ""}
        ${dayEvents.slice(0, 2).map((item) => `<span>${escapeHtml(item.titulo)}</span>`).join("")}
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

  renderCards("eventos-list", visibleEvents, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.titulo)}</p><span class="tag">${escapeHtml(item.tipo)}</span></div>
      <p>${escapeHtml(item.descricao || "Sem observacoes adicionais.")}</p>
      <p class="item-meta">${escapeHtml(formatEventDate(item.data))} as ${escapeHtml(formatEventTime(item.horario))} | Responsavel: ${escapeHtml(item.responsavel)}</p>
      <p class="item-meta event-audit-line">${renderEventAudit(item)}</p>
      <div class="job-actions">
        <button class="secondary-link" type="button" data-action="editar-evento" data-id="${escapeHtml(item.id)}">Editar</button>
        <button class="danger-button" type="button" data-action="excluir-evento" data-id="${escapeHtml(item.id)}">Deletar</button>
      </div>
    </article>
  `);
}

// Lógica de abertura de denúncia para leitura e transição de estado automática
async function lerDenuncia(id) {
  const denuncia = data.denuncias.find(item => String(item.id) === String(id));
  if (!denuncia) return;

  // Mostra o relato em formato de modal customizado
  showModal(
    "Visualização da Denúncia",
    `Categoria: ${denuncia.categoria}\nRecebida em: ${denuncia.createdAt}\nStatus Atual: ${denuncia.status}\n\nRelato:\n"${denuncia.descricao}"`,
    "info"
  );

  // Se a denúncia ainda constar como Não lida ("Aberta"), movemos para "Lida"
  if (denuncia.status === "Aberta") {
    if (!supabaseClient) {
      denuncia.status = "Lida";
      saveLocalData();
      renderAll();
    } else {
      try {
        const { data: updated, error } = await supabaseClient
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
        console.error("Erro ao atualizar status da denúncia no Supabase:", err);
        showModal("Aviso de Permissão", "A denúncia não pôde ser atualizada. Você precisa rodar o script SQL de UPDATE no painel do Supabase para consertar as permissões.", "error");
      }
    }
  }
}

async function atualizarStatusDenuncia(id, status) {
  const denuncia = data.denuncias.find((item) => String(item.id) === String(id));
  if (!denuncia) return false;

  if (!supabaseClient) {
    denuncia.status = status;
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const { data: updated, error } = await supabaseClient
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
    console.error("Erro ao atualizar status da denúncia no Supabase:", err);
    showModal("Aviso de Permissão", "A denúncia não pôde ser atualizada. Rode o supabase-schema.sql atualizado para liberar UPDATE em hub_denuncias.", "error");
    return false;
  }
}

function renderPublicVagas() {
  const selectedInput = document.getElementById("vaga-id");
  const selectedPanel = document.getElementById("selected-public-job");
  const list = document.getElementById("public-vagas-list");
  if (!selectedInput && !selectedPanel && !list) return;

  const cargoFilter = normalizeUnitText(publicVagaCargoFilter);
  const unidadeFilter = normalizeUnitText(publicVagaUnidadeFilter);
  const openVagas = data.vagas
    .filter(v => v.status === "Aberta")
    .filter(v => !cargoFilter || normalizeUnitText(v.cargo).includes(cargoFilter))
    .filter(v => !unidadeFilter || normalizeUnitText(getCanonicalUnit(v.unidade)).includes(unidadeFilter));
  const selectedVaga = new URLSearchParams(window.location.search).get("vaga");

  if (!openVagas.length) {
    if (list) list.innerHTML = '<p class="empty-state">Nenhuma vaga aberta no momento.</p>';
    if (selectedInput) selectedInput.value = "";
    if (selectedPanel) {
      selectedPanel.innerHTML = '<p class="empty-state">Nenhuma vaga aberta no momento.</p>';
    }
    return;
  }

  if (list) {
    list.innerHTML = openVagas.map(v => `
      <article class="item-card public-job-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(v.cargo)}</p>
          <span class="tag">${escapeHtml(v.status)}</span>
        </div>
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(v.unidade) || "Nao informada.")}</p>
        <p>${escapeHtml(v.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(v.requisitos || "Nao informado.")}</p>
        <a class="primary-button button-link" href="candidatura.html?vaga=${encodeURIComponent(v.id)}">Candidatar-se</a>
      </article>
    `).join("");
  }

  if (selectedInput || selectedPanel) {
    const job = openVagas.find((item) => String(item.id) === String(selectedVaga));
    if (!job) {
      if (selectedInput) selectedInput.value = "";
      if (selectedPanel) {
        selectedPanel.innerHTML = '<p class="empty-state">Vaga nao encontrada ou fechada. Volte para a lista e escolha uma vaga aberta.</p>';
      }
      return;
    }

    if (selectedInput) selectedInput.value = job.id;
    if (selectedPanel) {
      selectedPanel.innerHTML = `
        <div class="item-topline">
          <p class="item-title">${escapeHtml(job.cargo)}</p>
          <span class="tag">${escapeHtml(job.status)}</span>
        </div>
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(job.unidade) || "Nao informada.")}</p>
        <p>${escapeHtml(job.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(job.requisitos || "Nao informado.")}</p>
      `;
    }
  }
}

function renderTeamUsers() {
  const users = getTeamUsers();

  renderCards("usuarios-list", users, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <div class="inline-flex">
          ${getAuthorAvatar(item.nome)}
          <p class="item-title flush-bottom">${escapeHtml(item.nome)}</p>
        </div>
        <div>
          <span class="tag">Ativo</span>
          <button type="button" class="tag alert tag-button" data-action="excluir-usuario" data-id="${item.id}">Deletar</button>
        </div>
      </div>
      <p class="item-meta section-top">E-mail: ${escapeHtml(item.email || "Cadastre no Supabase Auth")}</p>
      <p class="item-meta">Cargo: ${escapeHtml(item.cargo || "Sem cargo definido")}</p>
      <p class="item-meta compact-top">Cadastro: ${escapeHtml(item.createdAt || "Hoje")}</p>
    </article>
  `);
}

function renderAccountSettings() {
  const nameInput = document.getElementById("conta-nome");
  const newNameInput = document.getElementById("novo-nome");
  const roleInput = document.getElementById("conta-cargo");
  const avatarPreview = document.getElementById("conta-avatar-preview");
  const settingsAvatar = document.getElementById("settings-user-avatar");
  const settingsName = document.getElementById("settings-user-name");
  const settingsRole = document.getElementById("settings-user-role");
  if (!nameInput && !roleInput && !newNameInput && !settingsName) return;

  const user = getCurrentUserRecord();
  const currentName = getCurrentUserName();
  const currentRole = user?.cargo || getCurrentUserRole() || "Sem cargo definido";
  if (nameInput) nameInput.value = currentName;
  if (newNameInput) newNameInput.value = currentName;
  if (roleInput) roleInput.value = currentRole;
  if (settingsName) settingsName.textContent = currentName;
  if (settingsRole) settingsRole.textContent = currentRole;
  document.getElementById("user-menu-role")?.classList.toggle("hidden", currentUserSettings.hidePresence);
  if (settingsRole) settingsRole.hidden = currentUserSettings.hidePresence;

  if (avatarPreview) {
    avatarPreview.style.display = "block";
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatarPreview.src = user.foto_perfil;
      if (settingsAvatar) settingsAvatar.src = user.foto_perfil;
    } else if (user?.foto_perfil && supabaseClient) {
      createPrivateStorageUrl(getHubSupabaseConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => {
          avatarPreview.src = signedUrl;
          if (settingsAvatar) settingsAvatar.src = signedUrl;
        })
        .catch(() => {
          avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2392a7a2'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
          if (settingsAvatar) settingsAvatar.src = avatarPreview.src;
        });
    } else {
      avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2392a7a2'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
      if (settingsAvatar) settingsAvatar.src = avatarPreview.src;
    }
  }
}

function showSettingsPanel(panelId) {
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.settingsPanel === panelId);
  });
  document.querySelectorAll("[data-settings-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTarget === panelId);
  });
}

function normalizeSettingsText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterSettingsItems(query) {
  const normalizedQuery = normalizeSettingsText(query);
  document.querySelectorAll("[data-settings-target]").forEach((button) => {
    const haystack = normalizeSettingsText(`${button.textContent || ""} ${button.dataset.settingsKeywords || ""}`);
    button.hidden = Boolean(normalizedQuery) && !haystack.includes(normalizedQuery);
  });
}

function getUserSettingsStorageKey() {
  const userKey = currentAuthUser?.id || currentUserProfile?.email || currentUserProfile?.cpf || "local";
  return `${USER_SETTINGS_STORAGE_KEY}:${userKey}`;
}

function migrateUserSettingsToCurrentKey(settings) {
  const currentKey = getUserSettingsStorageKey();
  if (currentKey.endsWith(":local")) return;
  try {
    if (!localStorage.getItem(currentKey)) {
      localStorage.setItem(currentKey, JSON.stringify(normalizeUserSettings(settings)));
    }
  } catch {
    // Mantem o fallback global se o navegador bloquear escrita na chave por usuario.
  }
}

function normalizeUserSettings(settings = {}) {
  const normalized = { ...USER_SETTINGS_DEFAULTS, ...settings };
  if (!["normal", "small", "large"].includes(normalized.messageSize)) normalized.messageSize = "normal";
  Object.keys(USER_SETTINGS_DEFAULTS).forEach((key) => {
    if (typeof USER_SETTINGS_DEFAULTS[key] === "boolean") normalized[key] = Boolean(normalized[key]);
  });
  return normalized;
}

function loadUserSettings() {
  try {
    const saved = localStorage.getItem(getUserSettingsStorageKey()) || localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    const settings = normalizeUserSettings(saved ? JSON.parse(saved) : {});
    migrateUserSettingsToCurrentKey(settings);
    return settings;
  } catch {
    return normalizeUserSettings();
  }
}

function saveUserSettings(settings = currentUserSettings) {
  currentUserSettings = normalizeUserSettings(settings);
  try {
    localStorage.setItem(getUserSettingsStorageKey(), JSON.stringify(currentUserSettings));
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(currentUserSettings));
  } catch {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(currentUserSettings));
  }
}

function reloadUserSettingsForCurrentUser() {
  currentUserSettings = loadUserSettings();
  applyUserSettings();
  renderAccountSettings();
}

function syncUserSettingsControls() {
  document.querySelectorAll("[data-user-setting]").forEach((field) => {
    const key = field.dataset.userSetting;
    if (!(key in currentUserSettings)) return;
    if (field.type === "checkbox") {
      field.checked = Boolean(currentUserSettings[key]);
    } else {
      field.value = currentUserSettings[key];
    }
  });
}

function applyUserSettings() {
  currentUserSettings = normalizeUserSettings(currentUserSettings);
  document.body?.classList.toggle("user-setting-compact", currentUserSettings.compactMode);
  document.body?.classList.toggle("user-setting-message-small", currentUserSettings.messageSize === "small");
  document.body?.classList.toggle("user-setting-message-large", currentUserSettings.messageSize === "large");
  document.body?.classList.toggle("user-setting-blur-previews", currentUserSettings.blurChatPreviews);
  document.body?.classList.toggle("user-setting-hide-presence", currentUserSettings.hidePresence);
  document.body?.classList.toggle("user-setting-local-privacy", currentUserSettings.localPrivacyMode);

  const emojiWrap = document.querySelector(".chat-emoji-menu-wrap");
  if (emojiWrap) {
    emojiWrap.hidden = !currentUserSettings.showEmojiButton;
    if (!currentUserSettings.showEmojiButton) closeChatEmojiMenu();
  }

  const dashboardTarget = document.getElementById("dashboard-list");
  const previousDashboardButton = document.getElementById("dashboard-notifications-prev");
  const nextDashboardButton = document.getElementById("dashboard-notifications-next");
  if (!currentUserSettings.dashboardNotificationBadges) {
    visibleDashboardActivityItems = [];
    if (dashboardTarget) dashboardTarget.innerHTML = '<p class="empty-state">Novidades ocultas pelas suas configurações.</p>';
    if (previousDashboardButton) previousDashboardButton.hidden = true;
    if (nextDashboardButton) nextDashboardButton.hidden = true;
  }

  syncUserSettingsControls();
}

function updateUserSetting(key, rawValue) {
  if (!(key in USER_SETTINGS_DEFAULTS)) return;
  const value = typeof USER_SETTINGS_DEFAULTS[key] === "boolean" ? Boolean(rawValue) : rawValue;
  const nextSettings = normalizeUserSettings({ ...currentUserSettings, [key]: value });
  saveUserSettings(nextSettings);
  applyUserSettings();
  renderAccountSettings();
  if (key === "dashboardNotificationBadges") renderDashboard();
  if (key === "desktopNotifications" && nextSettings.desktopNotifications) requestDesktopNotificationPermission();
}

function requestDesktopNotificationPermission() {
  if (!("Notification" in window)) {
    showModal("Notificações indisponíveis", "Este navegador não suporta notificações do sistema.", "error");
    currentUserSettings.desktopNotifications = false;
    saveUserSettings();
    syncUserSettingsControls();
    return;
  }
  if (Notification.permission === "granted") return;
  Notification.requestPermission().then((permission) => {
    if (permission !== "granted") {
      currentUserSettings.desktopNotifications = false;
      saveUserSettings();
      syncUserSettingsControls();
      showModal("Permissão negada", "As notificações do navegador não foram liberadas.", "error");
    }
  });
}

function playUserNotificationSound() {
  if (!currentUserSettings.notificationSound) return;
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Sem som quando o navegador bloquear autoplay/audio context.
  }
}

function notifyUnreadRhMessages(count) {
  if (count <= lastUnreadNotificationCount) {
    lastUnreadNotificationCount = count;
    return;
  }
  playUserNotificationSound();
  if (currentUserSettings.desktopNotifications && "Notification" in window && Notification.permission === "granted") {
    new Notification("Comunicação RH", { body: `${count - lastUnreadNotificationCount} nova(s) mensagem(ns) não lida(s).` });
  }
  lastUnreadNotificationCount = count;
}

function getChatMessageFilterText(item = {}) {
  const attachment = item.arquivo && typeof item.arquivo === "object" ? item.arquivo : null;
  return normalizeSettingsText([
    item.autor,
    item.mensagem,
    item.createdAt,
    attachment?.name,
    attachment?.type,
    attachment?.mimeType,
  ].filter(Boolean).join(" "));
}

function syncChatMessageFilterVisibility() {
  const wrap = document.getElementById("chat-message-filter-wrap");
  const input = document.getElementById("chat-message-filter");
  const shouldShow = Boolean(chatMessageFilterVisible && activeChatChannel);
  if (wrap) wrap.hidden = !shouldShow;
  if (input) {
    input.disabled = !activeChatChannel;
    if (!shouldShow && input.value) input.value = "";
  }
}

function clearChatMessageFilter() {
  chatMessageFilterQuery = "";
  chatMessageFilterVisible = false;
  syncChatMessageFilterVisibility();
}

function focusChatMessageFilter() {
  activateView("comunicacao");
  if (!activeChatChannel) {
    renderChat();
    return;
  }
  chatMessageFilterVisible = true;
  syncChatMessageFilterVisibility();
  const filterInput = document.getElementById("chat-message-filter");
  if (filterInput) {
    filterInput.focus();
    filterInput.select();
  }
}

function resetChatComposerState() {
  const chatForm = document.getElementById("chat-form");
  const messageInput = chatForm?.querySelector('textarea[name="mensagem"]');
  if (messageInput) messageInput.value = "";
  clearChatSelectedFile();
}

function closeActiveChat() {
  if (!activeChatChannel) return false;
  activeChatChannel = "";
  clearChatMessageFilter();
  resetChatComposerState();
  closeChatAttachMenu();
  closeChatEmojiMenu();
  renderChatChannels();
  renderChat();
  return true;
}

function wrapChatSelection(prefix, suffix = prefix) {
  const input = document.querySelector('#chat-form textarea[name="mensagem"]');
  if (!input || input.disabled) return false;
  const value = input.value || "";
  const start = Number.isInteger(input.selectionStart) ? input.selectionStart : value.length;
  const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
  const selected = value.slice(start, end);
  input.value = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + selected.length;
  input.focus();
  input.setSelectionRange(cursorStart, cursorEnd || cursorStart);
  return true;
}

function applyChatEditingShortcut(key) {
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey === "b") return wrapChatSelection("**");
  if (normalizedKey === "i") return wrapChatSelection("_");
  if (normalizedKey === "u") return wrapChatSelection("<u>", "</u>");
  return false;
}

function renderFormattedChatText(message = "") {
  let html = escapeHtml(message);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
  return html.replace(/\n/g, "<br>");
}

function handleSettingsKeyboardShortcut(event) {
  if (event.defaultPrevented || event.isComposing) return;
  const target = event.target;
  const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  if (event.key === "Escape") {
    closeChatAttachMenu();
    closeChatEmojiMenu();
    closeUserMenuDropdown();
    if (document.getElementById("comunicacao")?.classList.contains("active") && closeActiveChat()) {
      event.preventDefault();
    }
    return;
  }
  if (!currentUserSettings.keyboardShortcuts) return;
  if (!event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusChatMessageFilter();
    return;
  }
  if (["b", "i", "u"].includes(event.key.toLowerCase()) && target?.matches?.('#chat-form textarea[name="mensagem"]')) {
    event.preventDefault();
    applyChatEditingShortcut(event.key);
    return;
  }
  if (/^[0-9]$/.test(event.key) && !isTyping) {
    const visibleNavButtons = [...document.querySelectorAll(".nav-item[data-view]")].filter((button) => !button.hidden);
    const shortcutIndex = event.key === "0" ? 9 : Number(event.key) - 1;
    const button = visibleNavButtons[shortcutIndex];
    if (button) {
      event.preventDefault();
      activateView(button.dataset.view);
      closeMobileMenu();
    }
  }
}

function renderChatChannels() {
  const target = document.getElementById("chat-channel-list");
  if (!target) return;

  const channels = getChatChannels();
  if (activeChatChannel && (!channels.some((channel) => channel.id === activeChatChannel) || !canAccessChatChannel(activeChatChannel))) {
    activeChatChannel = "";
  }

  if (!channels.length) {
    target.innerHTML = '<p class="empty-state">Nenhum canal interno disponivel.</p>';
    return;
  }

  target.innerHTML = channels
    .map((channel) => {
      const unreadCount = getUnreadRhMessages().filter(item => normalizeChatChannel(item.canal) === channel.id).length;
      const badge = unreadCount > 0 ? `<span class="chat-badge">${unreadCount}</span>` : "";
      
      let avatarHtml = "";
      if (channel.isGroup) {
        avatarHtml = `<div class="chat-avatar-fallback"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>`;
      } else if (channel.targetUser) {
        avatarHtml = getAuthorAvatar(channel.targetUser, channel.avatarPath);
      }

      return `
        <button class="channel-item ${channel.id === activeChatChannel ? "active" : ""}" data-chat-channel="${escapeHtml(channel.id)}" type="button">
          <div class="inline-flex-sm clip-text">
            ${avatarHtml}
            <span class="clip-text">${escapeHtml(channel.label)}</span>
          </div>
          ${badge}
        </button>
      `;
    })
    .join("");
}


function formatChamadoFilterCode(value = "") {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 5);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

function getChamadoSearchCode(item = {}) {
  return String(item.codigoSolicitacao || item.id || "").toLowerCase();
}

function getChamadoCollaboratorSearchText(item = {}) {
  const collaboratorGroups = Array.isArray(item.colaboradores) ? item.colaboradores : [];
  const groupNames = collaboratorGroups.map((group) => group.colaborador || "").join(" ");
  return [groupNames, item.epis || "", item.solicitante || ""].join(" ").toLowerCase();
}

function getChamadoCreatedMonth(item = {}) {
  const value = String(item.createdAt || "");
  const numericMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (numericMatch) return VT_MONTH_NAMES[Number(numericMatch[2]) - 1] || "";
  return VT_MONTH_NAMES.find((month) => value.toLowerCase().includes(month.toLowerCase())) || "";
}

function getChamadosFilterValues() {
  return {
    destino: String(document.getElementById("chamado-filter-destino")?.value || "").trim(),
    colaborador: String(document.getElementById("chamado-filter-colaborador")?.value || "").trim().toLowerCase(),
    codigo: String(document.getElementById("chamado-filter-codigo")?.value || "").trim().toLowerCase(),
    mes: document.getElementById("chamado-filter-mes")?.value || "",
  };
}

function filterChamadosByCurrentFilters(items = []) {
  const filters = getChamadosFilterValues();
  return items.filter((item) => {
    if (filters.destino && String(item.unidade || "") !== filters.destino) return false;
    if (filters.colaborador && !getChamadoCollaboratorSearchText(item).includes(filters.colaborador)) return false;
    if (filters.codigo && !getChamadoSearchCode(item).includes(filters.codigo)) return false;
    if (filters.mes && getChamadoCreatedMonth(item) !== filters.mes) return false;
    return true;
  });
}

function getVagasFilterValues() {
  return {
    unidade: String(document.getElementById("vaga-filter-unidade")?.value || "").trim(),
    nome: String(document.getElementById("vaga-filter-nome")?.value || "").trim().toLowerCase(),
    cpf: String(document.getElementById("vaga-filter-cpf")?.value || "").replace(/\D/g, ""),
  };
}

function getVagaCandidaturas(vagaId, filters = null) {
  const all = (data.candidaturas || []).filter((c) => String(c.vaga_id) === String(vagaId));
  const activeFilters = filters || getVagasFilterValues();
  if (!activeFilters.nome && !activeFilters.cpf) return all;
  return all.filter((c) => {
    if (activeFilters.nome && !String(c.nome || "").toLowerCase().includes(activeFilters.nome)) return false;
    if (activeFilters.cpf && !normalizeCpf(c.cpf || "").includes(activeFilters.cpf)) return false;
    return true;
  });
}

function filterVagasByCurrentFilters(items = []) {
  const filters = getVagasFilterValues();
  return items.filter((item) => {
    if (filters.unidade && getCanonicalUnit(item.unidade) !== filters.unidade) return false;
    if ((filters.nome || filters.cpf) && !getVagaCandidaturas(item.id, filters).length) return false;
    return true;
  });
}

function updateVagasFilterClearButton() {
  const clearButton = document.getElementById("limpar-filtros-vagas");
  if (!clearButton) return;
  const filters = getVagasFilterValues();
  clearButton.hidden = !Boolean(filters.unidade || filters.nome || filters.cpf);
}

function updateChamadosFilterClearButton() {
  const clearButton = document.getElementById("limpar-filtros-chamados");
  if (!clearButton) return;
  const filters = getChamadosFilterValues();
  clearButton.hidden = !Boolean(filters.destino || filters.colaborador || filters.codigo || filters.mes);
}

function renderChamadosSection() {
  const chamadosAbertos = filterChamadosByCurrentFilters((data.chamados || []).filter((item) => item.status !== "Arquivado"));
  const chamadosArquivados = filterChamadosByCurrentFilters((data.chamados || []).filter((item) => item.status === "Arquivado"));
  const selectChamadosButton = document.getElementById("select-chamados");
  const primaryChamadosTitle = document.getElementById("chamados-primary-title");
  const toggleArchivedChamadosButton = document.getElementById("toggle-archived-chamados");
  const exitChamadosSelectionButton = document.getElementById("exit-chamados-selection");
  const openChamadosPublicLink = document.getElementById("open-chamados-public");
  updateChamadosFilterClearButton();

  if (chamadosSelectionMode) showArchivedChamados = false;

  if (selectChamadosButton) {
    selectChamadosButton.disabled = !chamadosAbertos.length && !chamadosArquivados.length;
    selectChamadosButton.textContent = chamadosSelectionMode ? "Arquivar selecionados" : "Selecionar chamados";
    selectChamadosButton.className = chamadosSelectionMode ? "danger-button" : "secondary-link";
  }
  if (primaryChamadosTitle) primaryChamadosTitle.textContent = showArchivedChamados ? "Arquivados" : "Abertos";
  if (toggleArchivedChamadosButton) {
    toggleArchivedChamadosButton.textContent = showArchivedChamados ? "Ocultar arquivados" : "Mostrar arquivados";
    toggleArchivedChamadosButton.disabled = false;
    toggleArchivedChamadosButton.hidden = chamadosSelectionMode;
    toggleArchivedChamadosButton.style.display = chamadosSelectionMode ? "none" : "";
  }
  if (exitChamadosSelectionButton) {
    exitChamadosSelectionButton.hidden = !chamadosSelectionMode;
    exitChamadosSelectionButton.style.display = chamadosSelectionMode ? "" : "none";
  }
  if (openChamadosPublicLink) openChamadosPublicLink.hidden = chamadosSelectionMode;

  const chamadoCard = (item, archived = false) => `
    <article class="item-card ${chamadosSelectionMode && !archived ? "selectable-card clickable" : ""}"
             ${chamadosSelectionMode && !archived ? `data-action="toggle-chamado-selection" data-id="${escapeHtml(item.id)}"` : ""}>
      <div class="item-topline">
        <p class="item-title">
          ${!archived && chamadosSelectionMode ? `<input class="chamado-select" type="checkbox" value="${escapeHtml(item.id)}"
                                                         aria-label="Selecionar chamado de ${escapeHtml(item.solicitante)}" data-action="no-op" />` : ""}
          ${escapeHtml(item.unidade)}
        </p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p><strong>Solicitante:</strong> ${escapeHtml(item.solicitante)}</p>
      ${item.setor ? `<p><strong>Setor:</strong> ${escapeHtml(item.setor)}</p>` : ""}
      <p><strong>Código da Solicitação:</strong> ${escapeHtml(item.codigoSolicitacao || item.id || "Nao informado")}</p>
      <p><strong>EPIs:</strong> ${escapeHtml(item.epis)}</p>
      ${item.observacoes ? `<p><strong>Observacoes:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
      ${archived ? `<div class="job-actions section-top"><button class="secondary-link" type="button" data-action="reabrir-chamado" data-id="${escapeHtml(item.id)}">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedChamados) {
    const primaryTarget = document.getElementById("chamados-list");
    if (!chamadosArquivados.length && primaryTarget) {
      primaryTarget.innerHTML = '<p class="empty-state">Sem chamados arquivados</p>';
    } else {
      renderCards("chamados-list", chamadosArquivados, (item) => chamadoCard(item, true));
    }
  } else {
    renderCards("chamados-list", chamadosAbertos, (item) => chamadoCard(item, false));
  }
}

function renderMalotesSection() {
  renderAll();
}

function renderDenunciasSection() {
  const naoLidas = data.denuncias.filter(item => item.status === "Aberta" || item.status === "Urgente");
  const lidas = data.denuncias.filter(item => item.status === "Lida");
  const arquivadas = data.denuncias.filter(item => item.status === "Arquivada");
  const selectDenunciasButton = document.getElementById("select-denuncias");
  const primaryDenunciasTitle = document.getElementById("denuncias-primary-title");
  const toggleArchivedDenunciasButton = document.getElementById("toggle-archived-denuncias");
  const exitSelectionButton = document.getElementById("exit-denuncias-selection");
  const openDenunciaPublicLink = document.getElementById("open-denuncia-public");
  if (denunciasSelectionMode) showArchivedDenuncias = false;

  if (selectDenunciasButton) {
    selectDenunciasButton.disabled = !naoLidas.length && !lidas.length;
    selectDenunciasButton.textContent = denunciasSelectionMode ? "Arquivar selecionadas" : "Selecionar denúncias";
    selectDenunciasButton.className = denunciasSelectionMode ? "danger-button" : "secondary-link";
  }
  if (primaryDenunciasTitle) primaryDenunciasTitle.textContent = showArchivedDenuncias ? "Arquivadas" : "Não Lidas";
  if (toggleArchivedDenunciasButton) {
    toggleArchivedDenunciasButton.textContent = showArchivedDenuncias ? "Ocultar arquivadas" : "Mostrar arquivadas";
    toggleArchivedDenunciasButton.disabled = false;
    toggleArchivedDenunciasButton.hidden = denunciasSelectionMode;
    toggleArchivedDenunciasButton.style.display = denunciasSelectionMode ? "none" : "";
  }
  if (exitSelectionButton) {
    exitSelectionButton.hidden = !denunciasSelectionMode;
    exitSelectionButton.style.display = denunciasSelectionMode ? "" : "none";
  }
  if (openDenunciaPublicLink) openDenunciaPublicLink.hidden = denunciasSelectionMode;

  const cardTemplate = (item, archived = false) => `
    <article class="item-card clickable ${denunciasSelectionMode && !archived ? "selectable-card" : ""}"
             data-action="${denunciasSelectionMode && !archived ? 'toggle-denuncia-selection' : 'ler-denuncia'}"
             data-id="${escapeHtml(item.id)}">
      <div class="item-topline">
        <p class="item-title">
          ${!archived && denunciasSelectionMode ? `<input class="denuncia-select" type="checkbox" value="${escapeHtml(item.id)}" aria-label="Selecionar denúncia de ${escapeHtml(item.createdAt)}" data-action="no-op" />` : ""}
          Denuncia anonima
        </p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.descricao.substring(0, 80))}${item.descricao.length > 80 ? '...' : ''}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}</p>
      ${archived ? `<div class="job-actions section-top"><button class="secondary-link" type="button" data-action="reabrir-denuncia" data-id="${escapeHtml(item.id)}">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedDenuncias) {
    const primaryTarget = document.getElementById("denuncias-nao-lidas");
    if (!arquivadas.length && primaryTarget) {
      primaryTarget.innerHTML = '<p class="empty-state">Sem denuncias arquivadas</p>';
    } else {
      renderCards("denuncias-nao-lidas", arquivadas, (item) => cardTemplate(item, true));
    }
  } else {
    renderCards("denuncias-nao-lidas", naoLidas, (item) => cardTemplate(item, false));
  }
  renderCards("denuncias-lidas", lidas, (item) => cardTemplate(item, false));
}

function renderAll() {
  renderCurrentUser();
  applyRoleAccess();
  renderAccountSettings();
  renderDashboard();
  renderPublicVagas();

  renderDenunciasSection();

  renderChatChannels();
  renderChat();

  renderMaloteReport();
  renderCards("malotes-list", getFilteredMalotes(), (item) => `
    <article class="item-card">
      ${renderMaloteCardContent(item)}
    </article>
  `);

  renderVtRegistros();
  renderDocumentosContratados();

  renderChamadosSection();

  updateVagasFilterClearButton();
  const vagasFilters = getVagasFilterValues();
  renderCards("vagas-list", filterVagasByCurrentFilters(data.vagas), (item) => {
    const candidaturas = getVagaCandidaturas(item.id, vagasFilters);
    const totalCandidaturas = (data.candidaturas || []).filter(c => String(c.vaga_id) === String(item.id)).length;
    let candidaturasHtml = `<p class="empty-candidates">Nenhum currículo recebido.</p>`;
    if (totalCandidaturas > 0 && !candidaturas.length) {
      candidaturasHtml = `<p class="empty-candidates">Nenhum candidato encontrado para o filtro aplicado.</p>`;
    }

    if (candidaturas.length > 0) {
      candidaturasHtml = candidaturas.map(c => `
        <div class="candidate-row">
          <p>
            ${escapeHtml(c.nome)}<br />
            <span class="meta-line">CPF: ${escapeHtml(formatCpf(c.cpf))}</span><br />
            <span class="meta-line">Telefone: ${escapeHtml(formatPhone(c.telefone) || "Nao informado")}</span>
          </p>
          <button type="button" class="secondary-link private-file-button" data-private-storage-bucket="hub-curriculos" data-private-storage-path="${escapeHtml(c.curriculo_url)}">Ver Currículo</button>
        </div>
      `).join("");
    }

    return `
      <article class="item-card public-job-card">
        <div class="item-topline"><p class="item-title">${escapeHtml(item.cargo)}</p><span class="tag">${escapeHtml(item.status)}</span></div>
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(item.unidade) || "Nao informada.")}</p>
        <p>${escapeHtml(item.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(item.requisitos || "Nao informado.")}</p>
        <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}</p>
        <div class="job-actions">
          <button class="secondary-link" type="button" data-action="editar-vaga" data-id="${escapeHtml(item.id)}">Editar</button>
          <button class="danger-button" type="button" data-action="excluir-vaga" data-id="${escapeHtml(item.id)}">Deletar</button>
        </div>
        <div class="candidate-list"><p class="candidate-list-title">Currículos Recebidos (${candidaturas.length}${candidaturas.length !== totalCandidaturas ? ` de ${totalCandidaturas}` : ""})</p>${candidaturasHtml}</div>
      </article>
    `;
  });

  renderCalendar();
  renderDocumentRecords();
  renderTeamUsers();
}

function getAuthorAvatar(authorName, knownAvatarPath = "") {
  const normalizedAuthor = normalizeLoginName(authorName);
  const user = (data.usuarios || []).find((u) => normalizeLoginName(u.nome) === normalizedAuthor)
    || ([normalizeLoginName(getCurrentUserName()), normalizeLoginName(currentUserProfile?.nome)].includes(normalizedAuthor)
      ? currentUserProfile
      : null);
  const avatarPath = knownAvatarPath || user?.foto_perfil || "";
  if (avatarPath && isHttpUrl(avatarPath)) {
    return `<img src="${escapeHtml(avatarPath)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
  }
  if (avatarPath) {
    const signedUrl = privateAvatarUrlCache.get(avatarPath);
    if (signedUrl) {
      return `<img src="${escapeHtml(signedUrl)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
    }

    requestPrivateAvatarUrl(avatarPath);
    const initial = String(authorName || "?").charAt(0).toUpperCase();
    return `<div class="chat-avatar-fallback" data-private-avatar-path="${escapeHtml(avatarPath)}" data-private-avatar-alt="${escapeHtml(authorName)}">${initial}</div>`;
  }
  const initial = String(authorName || "?").charAt(0).toUpperCase();
  return `<div class="chat-avatar-fallback">${initial}</div>`;
}

function openDashboardActivity(index) {
  const item = visibleDashboardActivityItems[Number(index)];
  if (!item) return;
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const details = String(item.details || item.text || "Sem detalhes disponíveis.")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const detailMarkup = [];
  for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
    const detail = details[detailIndex];
    if (/^Itens (do malote|solicitados):$/i.test(detail)) {
      const itemLines = [];
      while (details[detailIndex + 1] && !/^(Observações|Status|Data):/i.test(details[detailIndex + 1])) {
        detailIndex += 1;
        itemLines.push(details[detailIndex]);
      }
      detailMarkup.push(`<li class="dashboard-detail-section"><strong>${escapeHtml(detail)}</strong><ul>${itemLines.map((itemLine) => `<li>${escapeHtml(itemLine)}</li>`).join("")}</ul></li>`);
      continue;
    }
    detailMarkup.push(`<li>${escapeHtml(detail)}</li>`);
  }
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">${escapeHtml(item.title)}</div>
      <div class="modal-body"><ul class="dashboard-detail-list">${detailMarkup.join("")}</ul></div>
      <div class="modal-footer"><button class="primary-button" data-action="close-modal">Entendi</button></div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

document.getElementById("dashboard-notifications-next")?.addEventListener("click", () => {
  dashboardNotificationOffset += 3;
  renderDashboard();
});

document.getElementById("dashboard-notifications-prev")?.addEventListener("click", () => {
  dashboardNotificationOffset = Math.max(0, dashboardNotificationOffset - 3);
  renderDashboard();
});

function getDocumentFilterValues() {
  return {
    nome: String(document.getElementById("document-filter-name")?.value || "").trim().toLowerCase(),
    tipo: String(document.getElementById("document-filter-type")?.value || "").trim(),
    cpf: String(document.getElementById("document-filter-cpf")?.value || "").replace(/\D/g, ""),
  };
}

function updateDocumentFilterClearButton() {
  const clearButton = document.getElementById("clear-document-filters");
  if (!clearButton) return;
  const filters = getDocumentFilterValues();
  clearButton.hidden = !Boolean(filters.nome || filters.tipo || filters.cpf);
}

function getDocumentRecordCpf(item = {}) {
  return String(item.formData?.cpf || "").replace(/\D/g, "");
}

function filterDocumentRecords(items = []) {
  const filters = getDocumentFilterValues();
  return items.filter((item) => {
    if (filters.nome) {
      const collaboratorName = String(item.formData?.colaborador || item.summary || "").toLowerCase();
      if (!collaboratorName.includes(filters.nome)) return false;
    }

    if (filters.tipo && item.type !== filters.tipo) return false;

    if (filters.cpf) {
      const cpf = getDocumentRecordCpf(item);
      if (!cpf.includes(filters.cpf)) return false;
    }

    return true;
  });
}

function renderDocumentRecords() {
  const target = document.getElementById("document-records");
  if (!target) return;

  const records = filterDocumentRecords(documentRecords);

  if (!records.length) {
    target.innerHTML = '<p class="empty-state">Nenhum registro salvo ainda.</p>';
    return;
  }

  target.innerHTML = records
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(documentLabels[item.type] || item.type)}</p>
          <div>
            <span class="tag">${escapeHtml(item.createdAt)}</span>
            <button type="button" class="tag tag-button teal-tag-button" data-action="baixar-documento-rh" data-id="${item.id}">Gerar documento</button>
            <button type="button" class="tag tag-button teal-tag-button" data-action="editar-documento" data-id="${item.id}">Editar</button>
            <button type="button" class="tag alert tag-button" data-action="excluir-documento" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <p class="item-meta">${escapeHtml(item.details)}</p>
        <p class="item-meta">Registrado por ${escapeHtml(item.createdBy || getSystemFallbackAuthor())}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}${item.updatedAt ? ` em ${escapeHtml(item.updatedAt)}` : ""}</p>
      </article>
    `)
    .join("");
}

function renderChat() {
  const target = document.getElementById("chat-feed");
  if (!target) return;
  const currentUser = getCurrentUserName();
  const activeChannel = getActiveChatChannel();

  const title = document.getElementById("chat-title");
  const subtitle = document.getElementById("chat-subtitle");
  const messageInput = document.querySelector('#chat-form textarea[name="mensagem"]');
  const sendButton = document.querySelector("#chat-form .send-button");
  const fileButton = document.getElementById("chat-attach-menu-button");
  const fileInput = document.getElementById("chat-file");
  const emojiButton = document.getElementById("chat-emoji-button");
  const recordButton = document.getElementById("record-audio-button");
  const pollButton = document.getElementById("create-poll-button");
  const filterInput = document.getElementById("chat-message-filter");
  const pollMenuOption = document.querySelector('[data-attach-type="poll"]');
  if (!activeChannel) {
    clearChatMessageFilter();
    if (title) title.textContent = "Comunicação interna";
    if (subtitle) subtitle.textContent = "Selecione um canal para abrir a conversa";
    if (messageInput) {
      messageInput.placeholder = "Escolha um chat ao lado para enviar mensagens";
      messageInput.disabled = true;
    }
    if (sendButton) sendButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    if (emojiButton) emojiButton.disabled = true;
    if (recordButton) recordButton.disabled = true;
    if (filterInput) filterInput.disabled = true;
    if (pollButton) {
      pollButton.hidden = true;
      pollButton.disabled = true;
    }
    if (pollMenuOption) pollMenuOption.hidden = true;
    if (fileButton) {
      fileButton.disabled = true;
      fileButton.classList.add("disabled");
    }
    closeChatAttachMenu();
    closeChatEmojiMenu();
    target.innerHTML = '<p class="empty-state">Selecione um canal de comunicação para visualizar as mensagens.</p>';
    return;
  }

  if (title) title.textContent = activeChannel.label;
  if (subtitle) subtitle.textContent = activeChannel.subtitle;
  if (messageInput) {
    messageInput.placeholder = isGeneralChatChannel(activeChannel.id) ? `Escreva em ${activeChannel.label}` : `Mensagem para ${activeChannel.label}`;
    messageInput.disabled = false;
  }
  if (sendButton) sendButton.disabled = false;
  if (fileInput) fileInput.disabled = false;
  if (emojiButton) emojiButton.disabled = false;
  if (recordButton) recordButton.disabled = false;
  if (filterInput) filterInput.disabled = false;
  syncChatMessageFilterVisibility();
  if (pollButton) {
    const canCreatePoll = isGeneralChatChannel(activeChannel.id);
    pollButton.hidden = true;
    pollButton.disabled = !canCreatePoll;
    if (pollMenuOption) pollMenuOption.hidden = !canCreatePoll;
  }
  if (fileButton) {
    fileButton.disabled = false;
    fileButton.classList.remove("disabled");
  }


  const normalizedFilter = normalizeSettingsText(chatMessageFilterQuery);
  const messages = data.comunicados.filter((item) => {
    const channel = normalizeChatChannel(item.canal);
    if (channel !== activeChatChannel) return false;
    if (!canAccessChatChannel(channel)) return false;
    return !normalizedFilter || getChatMessageFilterText(item).includes(normalizedFilter);
  }).sort(compareChatMessagesOldestFirst);

  if (!messages.length) {
    target.innerHTML = normalizedFilter
      ? '<p class="empty-state">Nenhuma mensagem encontrada para este filtro.</p>'
      : '<p class="empty-state">Nenhuma mensagem neste chat ainda.</p>';
    return;
  }

  let previousDate = "";
  const chatHtml = messages.map((item) => {
    const attachment = renderChatAttachment(item.arquivo);
    const poll = parseChatPollMessage(item.mensagem);
    const messageBody = poll
      ? renderChatPoll(item, poll)
      : item.mensagem
        ? `<p>${renderFormattedChatText(item.mensagem)}</p>`
        : "";
    const messageDate = getChatMessageDate(item.createdAt);
    const messageTime = getChatMessageTimeLabel(item.createdAt);

    const separator = messageDate && messageDate !== previousDate
      ? `<div class="chat-date-separator">${escapeHtml(messageDate)}</div>`
      : "";

    previousDate = messageDate || previousDate;

    return `${separator}
      <article class="chat-message ${item.autor === currentUser ? "own" : ""}">
        <div class="chat-message-header">
          ${getAuthorAvatar(item.autor)}
          <div class="chat-author">
            <span>${escapeHtml(item.autor)}</span>
            <time>${escapeHtml(messageTime)}</time>
          </div>
        </div>
        ${messageBody}
        ${attachment}
      </article>
    `;
  }).join("");

  target.innerHTML = chatHtml;

  target.scrollTop = target.scrollHeight;
  hydrateChatMediaPreviews();

  checkAndMarkChatAsRead();
}

function renderChatAttachment(attachment) {
  if (!attachment) return "";

  const bucket = escapeHtml(getHubSupabaseConfig().chatFilesBucket || "hub-chat-files");
  const path = escapeHtml(attachment.url || "");
  const name = escapeHtml(attachment.name || "Arquivo");
  const size = escapeHtml(formatFileSize(attachment.size));
  const chip = `<button class="attachment-chip" type="button" data-private-storage-bucket="${bucket}" data-private-storage-path="${path}">Arquivo: ${name} ${size}</button>`;

  if (!attachment.url) return chip;

  if (isChatImageFile(attachment)) {
    const cacheKey = `${bucket}:${path}`;
    const src = chatMediaSignedUrlCache.has(cacheKey) ? chatMediaSignedUrlCache.get(cacheKey) : TRANSPARENT_IMAGE_PLACEHOLDER;
    return `
      <div class="chat-attachment chat-image-attachment">
        <img
          class="chat-image-preview"
          src="${src}"
          loading="lazy"
          data-action="open-chat-image"
          data-chat-image-bucket="${bucket}"
          data-chat-image-path="${path}"
          data-chat-image-name="${name}"
          alt="${name}"
          data-chat-image-preview
        />
      </div>
    `;
  }

  if (isChatAudioFile(attachment)) {
    return `
      <div class="chat-attachment chat-audio-attachment">
        <audio class="chat-audio-preview" controls preload="metadata" data-chat-audio-preview data-chat-audio-bucket="${bucket}" data-chat-audio-path="${path}"></audio>
        ${chip}
      </div>
    `;
  }

  return chip;
}

function createChatPollOptionField(index, required = false) {
  const canRemove = index > 2;
  return `
    <div class="chat-poll-option-editor" data-chat-poll-option>
      <label>Opção ${index}
        <input name="opcao" type="text" maxlength="80" placeholder="${required ? (index === 1 ? "Primeira opção" : "Segunda opção") : "Opcional"}" ${required ? "required" : ""} />
      </label>
      ${canRemove ? `<button class="secondary-link chat-poll-remove-option" type="button" data-action="remove-chat-poll-option" aria-label="Excluir opção ${index}">Excluir</button>` : ""}
    </div>
  `;
}

function refreshChatPollOptionFields(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  list.querySelectorAll("[data-chat-poll-option]").forEach((field, index) => {
    const optionNumber = index + 1;
    const label = field.querySelector("label");
    const input = field.querySelector('input[name="opcao"]');
    const removeButton = field.querySelector('[data-action="remove-chat-poll-option"]');
    if (label) label.firstChild.textContent = `Opção ${optionNumber}`;
    if (input) {
      input.required = optionNumber <= 2;
      if (optionNumber === 1) input.placeholder = "Primeira opção";
      else if (optionNumber === 2) input.placeholder = "Segunda opção";
      else input.placeholder = "Opcional";
    }
    if (removeButton) {
      removeButton.hidden = optionNumber <= 2;
      removeButton.setAttribute("aria-label", `Excluir opção ${optionNumber}`);
    }
  });
}

function addChatPollOptionField(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  const currentTotal = list.querySelectorAll('input[name="opcao"]').length;
  if (currentTotal >= 8) {
    showModal("Limite de opções", "A enquete pode ter no máximo 8 opções.", "info");
    return;
  }
  list.insertAdjacentHTML("beforeend", createChatPollOptionField(currentTotal + 1));
  refreshChatPollOptionFields(formElement);
  list.querySelector('[data-chat-poll-option]:last-child input')?.focus();
}

function removeChatPollOptionField(button) {
  const formElement = button?.closest("#chat-poll-form");
  const list = formElement?.querySelector("#chat-poll-options");
  const fields = list?.querySelectorAll("[data-chat-poll-option]") || [];
  if (fields.length <= 2) {
    showModal("Mínimo de opções", "A enquete precisa ter pelo menos 2 opções.", "info");
    return;
  }
  button.closest("[data-chat-poll-option]")?.remove();
  refreshChatPollOptionFields(formElement);
}

function showChatPollModal() {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id)) {
    showModal("Enquete indisponivel", "As enquetes podem ser criadas somente nos chats de grupo.", "error");
    return;
  }

  document.getElementById("custom-modal")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">Criar enquete</div>
      <form class="modal-body chat-poll-form" id="chat-poll-form">
        <label>Pergunta
          <input name="pergunta" type="text" maxlength="180" placeholder="Ex: Qual melhor dia para reunião?" required />
        </label>
        <div class="chat-poll-options-editor" id="chat-poll-options">
          ${createChatPollOptionField(1, true)}
          ${createChatPollOptionField(2, true)}
        </div>
        <button class="secondary-link chat-poll-add-option" type="button" data-action="add-chat-poll-option">Adicionar opção</button>
      </form>
      <div class="modal-footer">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="primary-button" type="submit" form="chat-poll-form">Criar enquete</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#chat-poll-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const created = await criarEnqueteChat(event.currentTarget);
    if (created) overlay.remove();
  });
  overlay.querySelector('[data-action="add-chat-poll-option"]')?.addEventListener("click", () => {
    addChatPollOptionField(overlay.querySelector("#chat-poll-form"));
  });
  overlay.querySelector("#chat-poll-options")?.addEventListener("click", (event) => {
    const removeButton = event.target.closest('[data-action="remove-chat-poll-option"]');
    if (removeButton) removeChatPollOptionField(removeButton);
  });

  document.body.appendChild(overlay);
  overlay.querySelector('input[name="pergunta"]')?.focus();
}

async function criarEnqueteChat(formElement) {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id) || !canAccessChatChannel(activeChannel.id)) {
    showModal("Acao nao permitida", "Voce so pode criar enquetes nos grupos que participa.", "error");
    return false;
  }

  const form = new FormData(formElement);
  const question = String(form.get("pergunta") || "").trim();
  const options = form.getAll("opcao").map((value) => String(value || "").trim()).filter(Boolean);
  const uniqueOptions = [...new Set(options.map((option) => option.toLocaleLowerCase("pt-BR")))];

  if (!question) {
    showModal("Pergunta obrigatoria", "Informe a pergunta da enquete.", "error");
    return false;
  }
  if (options.length < 2 || uniqueOptions.length < 2) {
    showModal("Opcoes obrigatorias", "Informe pelo menos duas opcoes diferentes para a enquete.", "error");
    return false;
  }

  return addItem("comunicados", {
    autor: getCurrentUserName(),
    canal: activeChannel.id,
    mensagem: serializeChatPoll({ question, options, votes: {}, createdBy: getCurrentUserName() }),
    arquivo: null,
  });
}

async function votarEnqueteChat(messageId, optionIndex) {
  const message = (data.comunicados || []).find((item) => String(item.id) === String(messageId));
  const poll = parseChatPollMessage(message?.mensagem);
  const activeChannel = normalizeChatChannel(message?.canal);
  const selectedIndex = Number(optionIndex);

  if (!message || !poll || !Number.isInteger(selectedIndex) || !poll.options[selectedIndex]) return;
  if (!isGeneralChatChannel(activeChannel) || !canAccessChatChannel(activeChannel)) {
    showModal("Acao nao permitida", "Voce nao possui acesso a esta enquete.", "error");
    return;
  }

  const voter = normalizeLoginName(getCurrentUserName());
  poll.votes = poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {};
  poll.votes[voter] = selectedIndex;
  const nextMessage = serializeChatPoll(poll);
  const previousMessage = message.mensagem;

  message.mensagem = nextMessage;
  renderChat();

  const success = await updateItem("comunicados", message.id, {
    autor: message.autor,
    canal: activeChannel,
    mensagem: nextMessage,
    arquivo: message.arquivo || null,
    createdBy: message.createdBy || message.autor,
  });

  if (!success) {
    message.mensagem = previousMessage;
    renderChat();
  }
}

function hydrateChatMediaPreviews() {
  document.querySelectorAll("[data-chat-image-preview], [data-chat-audio-preview]").forEach((media) => {
    const path = media.dataset.chatImagePath || media.dataset.chatAudioPath || media.dataset.privateStoragePath || "";
    const bucket = media.dataset.chatImageBucket || media.dataset.chatAudioBucket || media.dataset.privateStorageBucket || getHubSupabaseConfig().chatFilesBucket || "hub-chat-files";
    if (!path || media.dataset.previewLoaded === "true") return;

    const cacheKey = `${bucket}:${path}`;
    if (chatMediaSignedUrlCache.has(cacheKey)) {
      media.src = chatMediaSignedUrlCache.get(cacheKey);
      media.dataset.previewLoaded = "true";
      return;
    }

    createPrivateStorageUrl(bucket, path)
      .then((signedUrl) => {
        chatMediaSignedUrlCache.set(cacheKey, signedUrl);
        media.src = signedUrl;
        media.dataset.previewLoaded = "true";
      })
      .catch((error) => {
        console.warn("Nao foi possivel carregar previa do anexo:", error);
        media.removeAttribute("src");
        delete media.dataset.previewLoaded;
      });
  });
}

document.querySelectorAll(".nav-item, [data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.externalUrl) {
      closeMobileMenu();
      window.location.href = button.dataset.externalUrl;
      return;
    }
    if (isCashierUser() && !["comunicacao", "conta"].includes(button.dataset.view)) {
      activateView("comunicacao");
      closeMobileMenu();
      return;
    }
    if (isManagerUser() && !["comunicacao", "documentos", "conta"].includes(button.dataset.view)) {
      activateView("documentos");
      closeMobileMenu();
      return;
    }
    activateView(button.dataset.view);
    closeMobileMenu();
    checkAndMarkChatAsRead();
  });
});

document.getElementById("mobile-menu-toggle")?.addEventListener("click", toggleMobileMenu);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeMobileMenu();
});

document.getElementById("chat-channel-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-channel]");
  if (!button) return;

  activeChatChannel = button.dataset.chatChannel || GENERAL_CHANNEL;
  clearChatMessageFilter();
  renderChatChannels();
  renderChat();
});

document.getElementById("chat-message-filter")?.addEventListener("input", (event) => {
  chatMessageFilterQuery = event.currentTarget.value || "";
  renderChat();
});

document.getElementById("chat-message-filter-close")?.addEventListener("click", (event) => {
  event.preventDefault();
  clearChatMessageFilter();
});

document.getElementById("malote-destino-filter")?.addEventListener("change", () => {
  renderAll();
});

document.getElementById("malote-filter-colaborador")?.addEventListener("input", renderAll);

document.getElementById("malote-code-search")?.addEventListener("input", () => {
  const field = document.getElementById("malote-code-search");
  if (field) field.value = formatRequestCode(field.value);
  renderAll();
});

document.getElementById("chamado-filter-destino")?.addEventListener("change", renderChamadosSection);
document.getElementById("chamado-filter-colaborador")?.addEventListener("input", renderChamadosSection);
document.getElementById("chamado-filter-codigo")?.addEventListener("input", (event) => {
  event.currentTarget.value = formatChamadoFilterCode(event.currentTarget.value);
  renderChamadosSection();
});
document.getElementById("chamado-filter-mes")?.addEventListener("change", renderChamadosSection);
document.getElementById("limpar-filtros-chamados")?.addEventListener("click", () => {
  ["chamado-filter-destino", "chamado-filter-colaborador", "chamado-filter-codigo", "chamado-filter-mes"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderChamadosSection();
});

document.getElementById("vaga-filter-unidade")?.addEventListener("change", renderAll);
document.getElementById("vaga-filter-nome")?.addEventListener("input", renderAll);
document.getElementById("vaga-filter-cpf")?.addEventListener("input", (event) => {
  event.currentTarget.value = formatCpf(event.currentTarget.value);
  renderAll();
});
document.getElementById("limpar-filtros-vagas")?.addEventListener("click", () => {
  ["vaga-filter-unidade", "vaga-filter-nome", "vaga-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderAll();
});

document.getElementById("document-filter-name")?.addEventListener("input", () => {
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});
document.getElementById("document-filter-type")?.addEventListener("change", () => {
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});
document.getElementById("document-filter-cpf")?.addEventListener("input", (event) => {
  const field = event.currentTarget;
  field.value = String(field.value || "").replace(/\D/g, "").slice(0, 11);
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});
document.getElementById("clear-document-filters")?.addEventListener("click", () => {
  ["document-filter-name", "document-filter-type", "document-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderDocumentRecords();
  updateDocumentFilterClearButton();
});

document.getElementById("contratado-filter-nome")?.addEventListener("input", () => {
  renderDocumentosContratados();
});
document.getElementById("contratado-filter-telefone")?.addEventListener("input", (event) => {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/\D/g, "");
  renderDocumentosContratados();
});
document.getElementById("contratado-filter-cpf")?.addEventListener("input", (event) => {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/\D/g, "").slice(0, 11);
  renderDocumentosContratados();
});
document.getElementById("clear-contratado-filters")?.addEventListener("click", () => {
  ["contratado-filter-nome", "contratado-filter-telefone", "contratado-filter-cpf"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  renderDocumentosContratados();
});

document.getElementById("open-vaga-filters")?.addEventListener("click", () => {
  showPublicVagaFiltersModal();
});

document.getElementById("select-chamados")?.addEventListener("click", () => {
  if (!chamadosSelectionMode) {
    chamadosSelectionMode = true;
    showArchivedChamados = false;
    renderAll();
    return;
  }

  const selectedIds = Array.from(document.querySelectorAll("#chamados-list .chamado-select:checked"))
    .map((input) => input.value)
    .filter(Boolean);

  if (!selectedIds.length) {
    showModal("Nenhum chamado selecionado", "Selecione pelo menos um chamado para arquivar.", "error");
    return;
  }

  showConfirmActionModal({
    title: "Arquivar chamados",
    text: `Deseja arquivar ${selectedIds.length} chamado(s) selecionado(s)?`,
    confirmText: "Arquivar",
    onConfirm: async () => {
      const results = await Promise.all(selectedIds.map((id) => updateItem("chamados", id, { status: "Arquivado" })));
      if (results.every(Boolean)) {
        chamadosSelectionMode = false;
        renderAll();
        showModal("Chamados arquivados", "Os chamados selecionados foram movidos para Arquivados.", "info");
      }
    },
  });
});

document.getElementById("exit-chamados-selection")?.addEventListener("click", () => {
  chamadosSelectionMode = false;
  renderAll();
});

document.getElementById("toggle-archived-chamados")?.addEventListener("click", () => {
  showArchivedChamados = !showArchivedChamados;
  renderAll();
});

document.getElementById("select-denuncias")?.addEventListener("click", () => {
  if (!denunciasSelectionMode) {
    denunciasSelectionMode = true;
    showArchivedDenuncias = false;
    renderAll();
    return;
  }

  const selectedIds = Array.from(document.querySelectorAll(".denuncia-select:checked"))
    .map((input) => input.value)
    .filter(Boolean);

  if (!selectedIds.length) {
    showModal("Nenhuma denúncia selecionada", "Selecione pelo menos uma denúncia para arquivar.", "error");
    return;
  }

  showConfirmActionModal({
    title: "Arquivar denúncias",
    text: `Deseja arquivar ${selectedIds.length} denúncia(s) selecionada(s)?`,
    confirmText: "Arquivar",
    onConfirm: async () => {
      const results = await Promise.all(selectedIds.map((id) => atualizarStatusDenuncia(id, "Arquivada")));
      if (results.every(Boolean)) {
        denunciasSelectionMode = false;
        renderAll();
        showModal("Denúncias arquivadas", "As denúncias selecionadas foram movidas para Arquivadas.", "info");
      }
    },
  });
});

document.getElementById("exit-denuncias-selection")?.addEventListener("click", () => {
  denunciasSelectionMode = false;
  renderAll();
});

document.getElementById("toggle-archived-denuncias")?.addEventListener("click", () => {
  showArchivedDenuncias = !showArchivedDenuncias;
  renderAll();
});

document.querySelectorAll(".doc-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".doc-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".doc-view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`doc-${button.dataset.doc}`)?.classList.add("active");

    // Cancela a edição se o usuário trocar de aba de documento
    if (window.editingDocId) {
      window.editingDocId = null;
      document.querySelectorAll("[data-doc-form]").forEach(form => {
        form.reset();
        const btn = form.querySelector("button[type='submit']");
        if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
      });
    }
  });
});

document.querySelectorAll("[data-doc-form]").forEach((formElement) => {
  normalizeDocumentDateInputs(formElement);

  formElement.addEventListener("input", (event) => {
    if (event.target.name === "cpf") {
      event.target.value = formatCpf(event.target.value);
    }
    if (event.target.name === "rg") {
      event.target.value = formatRg(event.target.value);
    }
    if (["telefone", "celular"].includes(event.target.name)) {
      event.target.value = formatPhone(event.target.value);
    }
    if (["salario", "salario_atual", "salario_proposto", "faixa_salarial"].includes(event.target.name)) {
      event.target.value = formatCurrencyBR(event.target.value);
    }
    if (event.target.name === "data_ausencia") {
      event.target.value = formatAbsencePeriod(event.target.value);
    }
    if (event.target.dataset.dateMask === "true" || event.target.dataset.docDate === "true") {
      const pos = event.target.selectionStart;
      const prev = event.target.value;
      const next = formatMaskedDate(prev);
      event.target.value = next;
      const diff = next.length - prev.length;
      if (diff !== 0) event.target.setSelectionRange(pos + diff, pos + diff);
    }
    if (["horario_trabalho", "horario_atraso"].includes(event.target.name)) {
      event.target.value = formatTimeRange(event.target.value);
    }
  });

  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    normalizeDocumentDateInputs(event.currentTarget);
    const form = new FormData(event.currentTarget);
    const entries = [...form.entries()].filter(([, value]) => String(value || "").trim());
    const collaborator = form.get("colaborador") || form.get("cargo") || "Registro sem colaborador";
    const details = entries
      .filter(([key]) => key !== "colaborador")
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    let savedDocId;

    if (window.editingDocId) {
      savedDocId = window.editingDocId;
      // Atualiza o documento existente
      const index = documentRecords.findIndex(d => d.id === window.editingDocId);
      if (index > -1) {
        documentRecords[index] = {
          ...documentRecords[index],
          summary: String(collaborator),
          details: details || "Registro salvo",
          formData: Object.fromEntries(entries),
          updatedBy: getCurrentUserName(),
          updatedAt: todayLabel(),
        };
      }
      window.editingDocId = null;
      const btn = event.currentTarget.querySelector("button[type='submit']");
      if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    } else {
      savedDocId = generateUUID();
      // Cria um novo documento
      documentRecords.unshift({
        id: savedDocId,
        type: event.currentTarget.dataset.docForm,
        summary: String(collaborator),
        details: details || "Registro salvo",
        formData: Object.fromEntries(entries),
        createdBy: getCurrentUserName(),
        createdAt: todayLabel(),
      });
    }

    saveDocumentRecords();
    renderDocumentRecords();

    event.currentTarget.reset();
  });
});

const denunciaForm = document.getElementById("denuncia-form");
if (denunciaForm) {
  ensurePublicCaptchaNotice(denunciaForm);

  denunciaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const message = String(form.get("mensagem") || form.get("descricao") || "").trim();
    if (message.length < 1 || message.length > 4000) {
      showModal("Mensagem invalida", "Descreva a situacao com ate 4000 caracteres.", "error");
      return;
    }

    const success = await addItem("denuncias", {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: message,
      status: "Aberta",
      _turnstileToken: turnstileToken,
    });

    if (success) {
      formElement.reset();
      const feedback = document.getElementById("denuncia-feedback");
      if (feedback) {
        feedback.textContent = "Denuncia enviada com sucesso. Obrigado pelo relato.";
      }
      showModal("Denúncia enviada", "Seu relato foi enviado com sucesso e será analisado pela equipe responsável.", "info");
    }
  });
}

const chatFile = document.getElementById("chat-file");
if (chatFile) {
  chatFile.addEventListener("change", (event) => {
    const files = Array.from(event.currentTarget.files || []).filter((file) => file && file.name);
    if (files.length) {
      const fileError = files.map(validateChatFile).find(Boolean);
      if (fileError) {
        event.currentTarget.value = "";
        clearChatSelectedFile();
        showModal("Anexo invalido", fileError, "error");
        return;
      }
      addChatSelectedFiles(files);
    } else {
      clearChatSelectedFile();
    }
  });
}

document.getElementById("record-audio-button")?.addEventListener("click", () => {
  toggleChatAudioRecording();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".chat-attach-menu-wrap")) closeChatAttachMenu();
  if (!event.target.closest(".chat-emoji-menu-wrap")) closeChatEmojiMenu();
});

const chatForm = document.getElementById("chat-form");
if (chatForm) {
  const chatMessageInput = chatForm.querySelector('textarea[name="mensagem"]');
  chatMessageInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    if (!currentUserSettings.enterToSend && !event.ctrlKey) return;
    event.preventDefault();
    chatForm.requestSubmit();
  });

  // Garante que Enter em qualquer elemento do formulário (ex: após anexar arquivo) também envia
  chatForm.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    if (!currentUserSettings.enterToSend && !event.ctrlKey) return;
    if (event.target === chatMessageInput) return; // já tratado acima
    if (event.target.tagName === "BUTTON") return; // deixa botões funcionarem normalmente
    event.preventDefault();
    chatForm.requestSubmit();
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeChatChannel || !canAccessChatChannel(activeChatChannel)) {
      showModal("Acao nao permitida", "Voce nao possui acesso a este canal.", "error");
      return;
    }
    if (isDirectChannel(activeChatChannel) && !isCurrentUserInChannel(activeChatChannel)) {
      showModal("Acao nao permitida", "Voce nao participa deste chat individual.", "error");
      return;
    }

    const formElement = event.target;
    const form = new FormData(formElement);
    const files = chatSelectedFiles.length
      ? [...chatSelectedFiles]
      : form.getAll("arquivo").filter((file) => file && file.name);
    const message = String(form.get("mensagem") || "").trim();

    if (!message && !files.length) return;
    const fileError = files.map(validateChatFile).find(Boolean);
    if (fileError) {
      showModal("Anexo invalido", fileError, "error");
      return;
    }

    // ── OTIMISMO: mostra a mensagem imediatamente ──────────────────────────
    const pendingMessages = files.length
      ? files.map((file, index) => {
        const attachmentType = getChatFileMimeType(file);
        return {
          id: "pending-" + generateUUID(),
          autor: getCurrentUserName(),
          canal: activeChatChannel,
          mensagem: index === 0 ? message : "",
          arquivo: { name: file.name, size: file.size, type: attachmentType, url: null },
          createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          _pending: true,
        };
      })
      : [{
        id: "pending-" + generateUUID(),
        autor: getCurrentUserName(),
        canal: activeChatChannel,
        mensagem: message,
        arquivo: null,
        createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        _pending: true,
      }];
    const pendingIds = new Set(pendingMessages.map((item) => item.id));
    data.comunicados = [...pendingMessages, ...(data.comunicados || [])];
    renderChat();
    // Limpa o formulário imediatamente
    formElement.reset();
    clearChatSelectedFile();

    // ── UPLOAD de arquivos em background ──────────────────────────────────
    const uploadedFiles = [];
    try {
      for (const file of files) {
        const attachmentType = getChatFileMimeType(file);
        const fileUrl = await uploadChatFile(file);
        uploadedFiles.push({ name: file.name, size: file.size, type: attachmentType, url: fileUrl });
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      // Remove mensagens otimistas em caso de falha
      data.comunicados = (data.comunicados || []).filter((m) => !pendingIds.has(m.id));
      renderChat();
      setSyncStatus("Erro no anexo", false);
      showModal("Erro no Anexo", "Nao foi possivel enviar um dos arquivos. Confira o bucket hub-chat-files no Supabase.", "error");
      return;
    }

    // ── PERSISTÊNCIA: remove otimistas e deixa o realtime confirmar ───────
    data.comunicados = (data.comunicados || []).filter((m) => !pendingIds.has(m.id));

    const payloads = uploadedFiles.length
      ? uploadedFiles.map((arquivo, index) => ({
        autor: getCurrentUserName(),
        canal: activeChatChannel,
        mensagem: index === 0 ? message : "",
        arquivo,
      }))
      : [{
        autor: getCurrentUserName(),
        canal: activeChatChannel,
        mensagem: message,
        arquivo: null,
      }];

    const results = [];
    for (const payload of payloads) {
      results.push(await addItem("comunicados", payload));
    }

    if (results.some((success) => !success)) {
      // Restaura o campo se o envio falhar
      renderChat();
    }
  });
}

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  document.getElementById("adicionar-colaborador-malote")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("afterbegin", createMaloteCollaboratorBlock());
    populateEpiSelects();
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const addItemButton = event.target.closest(".add-malote-item");
    if (addItemButton) {
      const block = addItemButton.closest("[data-malote-collaborator]");
      const itemsList = block?.querySelector("[data-malote-collaborator-items]");
      if (!itemsList) return;
      itemsList.insertAdjacentHTML("afterbegin", createMaloteItemRow());
      populateEpiSelects();
      return;
    }

    const removeCollaboratorButton = event.target.closest(".remove-malote-collaborator");
    if (removeCollaboratorButton) {
      const blocks = document.querySelectorAll("#epi-list [data-malote-collaborator]");
      if (blocks.length <= 1) return;
      removeCollaboratorButton.closest("[data-malote-collaborator]")?.remove();
      return;
    }

    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const block = button.closest("[data-malote-collaborator]");
    const rows = block?.querySelectorAll(".epi-row") || [];
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const typeSelect = event.target.closest("[data-item-type-select]");
    if (!typeSelect) return;
    const row = typeSelect.closest(".epi-row");
    const nameSelect = row?.querySelector("[data-item-select], [data-epi-select]");
    const sizeSelect = row?.querySelector('[name="epi_tamanho[]"]');
    if (nameSelect) nameSelect.innerHTML = renderItemNameOptions(typeSelect.value, "");
    if (sizeSelect) sizeSelect.innerHTML = renderItemSizeOptions(typeSelect.value, sizeSelect.value, nameSelect?.value || "");
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const nameSelect = event.target.closest('[name="epi_nome[]"]');
    if (!nameSelect) return;
    const row = nameSelect.closest(".epi-row");
    const type = row?.querySelector('[name="epi_tipo[]"]')?.value || "epi";
    const sizeSelect = row?.querySelector('[name="epi_tamanho[]"]');
    if (sizeSelect) sizeSelect.innerHTML = renderItemSizeOptions(type, sizeSelect.value, nameSelect.value);
  });

  maloteForm.elements.codigo_solicitacao?.addEventListener("input", (event) => {
    event.currentTarget.value = formatRequestCode(event.currentTarget.value);
  });

  maloteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const codigoSolicitacao = String(form.get("codigo_solicitacao") || "").replace(/\D/g, "");
    if (!/^\d{5}$/.test(codigoSolicitacao)) {
      showModal("Código inválido", "Informe o Código da Solicitação no formato 0000-0.", "error");
      return;
    }
    const colaboradores = readMaloteCollaborators(formElement);
    if (!colaboradores.length || colaboradores.some((group) => !hasFullName(group.colaborador))) {
      showModal("Colaborador e EPIs obrigatorios", "Informe nome e sobrenome do colaborador e adicione pelo menos um EPI ou uniforme para ele.", "error");
      return;
    }
    const epiItems = colaboradores.flatMap((group) => group.itens);

    const payload = {
      destino: form.get("destino"),
      origem: form.get("origem"),
      codigoSolicitacao: `${codigoSolicitacao.slice(0, 4)}-${codigoSolicitacao.slice(4)}`,
      observacoes: String(form.get("observacoes") || "").trim(),
      colaboradores,
      epis: formatEpiItems(epiItems),
      status: form.get("status"),
      createdBy: getCurrentUserName(),
    };
    const success = id ? await updateItem("malotes", id, { ...payload, updatedBy: getCurrentUserName() }) : await addItem("malotes", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      resetMaloteCollaborators();
      document.getElementById("cancelar-edicao-malote")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar malote";
    }
  });
}

document.getElementById("cancelar-edicao-malote")?.addEventListener("click", () => {
  maloteForm.reset();
  maloteForm.elements.id.value = "";
  resetMaloteCollaborators();
  document.getElementById("cancelar-edicao-malote").setAttribute("hidden", "");
  maloteForm.querySelector('button[type="submit"]').textContent = "Salvar malote";
});

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const payload = {
      cargo: form.get("cargo"),
      unidade: form.get("unidade"),
      projeto: "",
      descricao: form.get("descricao"),
      requisitos: form.get("requisitos"),
      status: form.get("status"),
    };
    const success = id ? await updateItem("vagas", id, payload) : await addItem("vagas", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      document.getElementById("cancelar-edicao-vaga")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar vaga";
    }
  });
}

document.getElementById("cancelar-edicao-vaga")?.addEventListener("click", () => {
  vagaForm.reset();
  vagaForm.elements.id.value = "";
  document.getElementById("cancelar-edicao-vaga").setAttribute("hidden", "");
  vagaForm.querySelector('button[type="submit"]').textContent = "Salvar vaga";
});

const eventoForm = document.getElementById("evento-form");
if (eventoForm) {
  // inicializa o campo de data com máscara (caso tenha valor default)
  const eventoDataInput = eventoForm.elements.data;
  if (eventoDataInput) {
    eventoDataInput.value = formatEventoDate(eventoDataInput.value);
    eventoDataInput.addEventListener("input", (event) => {
      const input = event.target;
      const pos = input.selectionStart;
      const prev = input.value;
      const next = formatEventoDate(prev);
      input.value = next;
      // reposiciona cursor de forma inteligente
      const diff = next.length - prev.length;
      if (diff !== 0) input.setSelectionRange(pos + diff, pos + diff);
      input.setCustomValidity("");
    });
  }

  eventoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const id = form.get("id");

    // converte dd/mm/aaaa → yyyy-mm-dd para salvar
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

    const payload = {
      titulo: form.get("titulo"),
      data: dataIso,
      horario: form.get("horario"),
      responsavel: form.get("responsavel"),
      tipo: form.get("tipo"),
      descricao: form.get("descricao"),
      createdBy: getCurrentUserName(),
    };
    const success = id ? await updateItem("eventos", id, { ...payload, updatedBy: getCurrentUserName() }) : await addItem("eventos", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      document.getElementById("cancelar-edicao-evento")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Registrar evento";
    }
  });
}

document.getElementById("cancelar-edicao-evento")?.addEventListener("click", () => {
  if (!eventoForm) return;
  eventoForm.reset();
  eventoForm.elements.id.value = "";
  document.getElementById("cancelar-edicao-evento").setAttribute("hidden", "");
  eventoForm.querySelector('button[type="submit"]').textContent = "Registrar evento";
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
  const downloadUrlButton = event.target.closest("[data-download-url]");
  if (downloadUrlButton) {
    event.preventDefault();
    downloadUrlAsBlob(downloadUrlButton.dataset.downloadUrl, downloadUrlButton.dataset.downloadName || "documento")
      .catch((error) => {
        console.error("Erro ao baixar arquivo:", error);
        showModal("Download", "Nao foi possivel baixar o arquivo. Tente novamente ou contate o administrador.", "error");
      });
    return;
  }

  const privateFileButton = event.target.closest("[data-private-storage-path]");
  if (privateFileButton) {
    event.preventDefault();
    downloadPrivateStorageFile(
      privateFileButton.dataset.privateStorageBucket,
      privateFileButton.dataset.privateStoragePath,
      privateFileButton.dataset.privateStorageName || "documento",
    );
    return;
  }

  const dayButton = event.target.closest("[data-date]");
  if (!dayButton) return;
  showDayEventsModal(dayButton.dataset.date);
});

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
      showModal("Mês obrigatório", "Informe o mês de referência para registrar o cálculo de VT.", "error");
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

const usuarioForm = document.getElementById("usuario-form");
if (usuarioForm) {
  usuarioForm.querySelector('[name="cpf"]')?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  usuarioForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const success = await saveTeamUser({
      nome: form.get("nome"),
      email: form.get("email"),
      cpf: form.get("cpf"),
      cargo: form.get("cargo"),
    });

    if (success) {
      formElement.reset();
    }
  });
}

const fotoPerfilInput = document.getElementById("foto-perfil-input");
if (fotoPerfilInput) {
  fotoPerfilInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById("conta-avatar-preview");
    const filenameLabel = document.getElementById("foto-perfil-filename");
    if (file) {
      if (filenameLabel) filenameLabel.textContent = file.name;
      if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    } else {
      if (filenameLabel) filenameLabel.textContent = "Nenhuma foto selecionada";
    }
  });
}

function showResetPasswordModal() {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">Redefinir senha</div>
      <div class="modal-body">
        <label class="modal-password-label flush-top">Senha atual
          <input id="modal-current-pwd" type="password" placeholder="Digite sua senha atual" autocomplete="current-password" />
        </label>
        <label class="modal-password-label">Nova senha
          <input id="modal-new-pwd" type="password" placeholder="Digite a nova senha" autocomplete="new-password" />
        </label>
        <label class="modal-password-label">Confirmar nova senha
          <input id="modal-confirm-pwd" type="password" placeholder="Confirme a nova senha" autocomplete="new-password" />
        </label>
        <p class="form-feedback error modal-error-spacing" id="modal-action-error" hidden></p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-modal-cancel>Cancelar</button>
        <button class="primary-button" type="button" data-modal-confirm>Salvar senha</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);
  overlay.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    const currentPwd = overlay.querySelector("#modal-current-pwd").value.trim();
    const newPwd = overlay.querySelector("#modal-new-pwd").value.trim();
    const confirmPwd = overlay.querySelector("#modal-confirm-pwd").value.trim();
    const errorEl = overlay.querySelector("#modal-action-error");

    if (!currentPwd) {
      errorEl.textContent = "A senha atual é obrigatória.";
      errorEl.hidden = false;
      return;
    }
    if (!newPwd || newPwd.length < 12) {
      errorEl.textContent = "Use uma nova senha com pelo menos 12 caracteres.";
      errorEl.hidden = false;
      return;
    }
    if (newPwd !== confirmPwd) {
      errorEl.textContent = "A confirmação da nova senha não confere.";
      errorEl.hidden = false;
      return;
    }

    if (newPwd === currentPwd) {
      errorEl.textContent = "A nova senha não pode ser igual à senha atual.";
      errorEl.hidden = false;
      return;
    }

    const isPasswordValid = await verifyCurrentPassword(currentPwd);
    if (!isPasswordValid) {
      errorEl.textContent = "A senha atual informada não confere.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    const success = await updateCurrentAccount(currentPwd, null, newPwd, null);
    if (success) {
      close();
      showModal("Senha atualizada", "Sua senha foi redefinida com sucesso.", "info");
    }
  });

  overlay.querySelectorAll("input").forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        overlay.querySelector("[data-modal-confirm]").click();
      }
    });
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#modal-current-pwd").focus();
}

const btnRedefinirSenha = document.getElementById("btn-redefinir-senha");
if (btnRedefinirSenha) {
  btnRedefinirSenha.addEventListener("click", () => {
    showResetPasswordModal();
  });
}

document.querySelectorAll("[data-settings-target]").forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsTarget));
});

document.getElementById("settings-search-input")?.addEventListener("input", (event) => {
  filterSettingsItems(event.currentTarget.value);
});

document.querySelectorAll("[data-user-setting]").forEach((field) => {
  field.addEventListener("change", (event) => {
    const input = event.currentTarget;
    updateUserSetting(input.dataset.userSetting, input.type === "checkbox" ? input.checked : input.value);
  });
});

document.addEventListener("keydown", handleSettingsKeyboardShortcut);

// Function to initialize account settings form
function initializeAccountSettingsForm() {
  currentUserSettings = loadUserSettings();
  applyUserSettings();
  renderAccountSettings();
  
  // Handle file input changes
  const fotoInput = document.getElementById("foto-perfil-input");
  if (fotoInput) {
    fotoInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const filenameLabel = document.getElementById("foto-perfil-filename");
      if (file && filenameLabel) {
        filenameLabel.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      } else if (filenameLabel) {
        filenameLabel.textContent = "Nenhuma foto selecionada";
      }
    });
  }
}

// Function to validate account update
function validateAccountUpdate(newName, fotoFile) {
  const errors = [];
  
  if (newName && newName.length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres.");
  }
  
  if (newName && newName.length > 100) {
    errors.push("Nome nao pode ter mais de 100 caracteres.");
  }
  
  if (fotoFile && fotoFile.name) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(fotoFile.type)) {
      errors.push("Use uma imagem em formato JPG, PNG ou WEBP.");
    }
    
    const maxSizeMB = 5;
    if (fotoFile.size > maxSizeMB * 1024 * 1024) {
      errors.push(`Imagem nao pode exceder ${maxSizeMB} MB.`);
    }
    
    if (fotoFile.size < 1) {
      errors.push("Arquivo de imagem invalido.");
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Function to set form loading state
function setAccountFormLoading(isLoading) {
  const submitBtn = document.querySelector("#conta-form .primary-button");
  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.style.opacity = isLoading ? "0.6" : "1";
    submitBtn.textContent = isLoading ? "Atualizando..." : "Atualizar conta";
  }
}

const contaForm = document.getElementById("conta-form");
if (contaForm) {
  contaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newName = String(form.get("novo_nome") || "").trim();
    const fotoFile = form.get("foto_perfil");

    // Validate form
    const validation = validateAccountUpdate(newName, fotoFile);
    if (!validation.isValid) {
      showModal("Erro de validacao", validation.errors.join("\n"), "error");
      return;
    }

    // Show loading state
    setAccountFormLoading(true);

    let fotoUrl = null;
    if (fotoFile && fotoFile.name && supabaseClient) {
      try {
        const safeName = fotoFile.name.replace(/[^a-z0-9_.-]/gi, "-");
        const path = `avatars/${Date.now()}-${generateUUID()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage
          .from(getHubSupabaseConfig().chatFilesBucket || "hub-chat-files")
          .upload(path, fotoFile, { contentType: fotoFile.type, upsert: false });
        if (uploadError) throw uploadError;

        fotoUrl = path;
      } catch (e) {
        console.error("Erro ao enviar foto", e);
        setAccountFormLoading(false);
        showModal("Erro", e.message || "Nao foi possivel enviar a foto de perfil.", "error");
        return;
      }
    }

    const success = await updateCurrentAccount("", newName || null, "", fotoUrl);
    setAccountFormLoading(false);
    
    if (success) {
      formElement.reset();
      const filenameLabel = document.getElementById("foto-perfil-filename");
      if (filenameLabel) filenameLabel.textContent = "Nenhuma foto selecionada";
      renderAccountSettings();
      renderCurrentUser();
      showModal("Conta atualizada", "Seus dados foram atualizados com sucesso.", "success");
    }
  });
}

// Initialize account settings when section is visible
document.querySelectorAll("[data-settings-target]").forEach((button) => {
  if (button.dataset.settingsTarget === "settings-account-panel") {
    button.addEventListener("click", () => {
      setTimeout(initializeAccountSettingsForm, 100);
    });
  }
});

// Initialize on page load
initializeAccountSettingsForm();

const candidaturaForm = document.getElementById("candidatura-form");
if (candidaturaForm) {
  ensurePublicCaptchaNotice(candidaturaForm);

  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  document.getElementById("cpf-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  candidaturaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const vaga_id = form.get("vaga_id");
    const nome = form.get("nome");
    const telefone = form.get("telefone");
    const cpf = form.get("cpf");
    const curriculo = form.get("curriculo");

    if (!vaga_id || !nome || !telefone || !cpf || !curriculo || !curriculo.name) {
      showModal("Vaga obrigatoria", "Abra a candidatura pelo botao Candidatar-se de uma vaga aberta.", "error");
      return;
    }

    const resumeError = validateResumeFile(curriculo);
    if (resumeError) {
      showModal("Curriculo invalido", resumeError, "error");
      return;
    }

    const existing = (data.candidaturas || []).find(c => String(c.vaga_id) === String(vaga_id) && c.cpf === cpf);
    if (existing) {
      showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      return;
    }

    try {
      const inserted = await submitPublicApplicationWithFile({ vaga_id, nome, telefone, cpf, curriculo, turnstileToken });
      data.candidaturas.unshift(mapRows("candidaturas", [inserted])[0]);
      formElement.reset();
      document.getElementById("vaga-id").value = vaga_id;
      showModal("Sucesso", "Seu currículo foi enviado com sucesso!", "info");
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      } else {
        showModal("Erro", error.message || "Não foi possível enviar o currículo. Verifique sua conexão e tente novamente.", "error");
      }
    }
  });
}

const contratadoDocForm = document.getElementById("contratado-doc-form");
if (contratadoDocForm) {
  ensurePublicCaptchaNotice(contratadoDocForm);
  const contractorLayout = document.querySelector("[data-public-contratados]");
  const contractorPasswordForm = document.getElementById("contractor-password-form");
  const contractorDocumentsFields = document.getElementById("contractor-documents-fields");
  const addContractorDocumentButton = document.getElementById("adicionar-documento-contratado");
  let contractorAccessPassword = "";

  addContractorDocumentButton?.addEventListener("click", () => {
    contractorDocumentsFields?.insertAdjacentHTML("beforeend", createContractorDocumentField(false));
  });

  contractorDocumentsFields?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='remover-documento-contratado']");
    if (!button) return;
    const fields = contractorDocumentsFields.querySelectorAll(".contractor-document-field");
    if (fields.length <= 1) return;
    button.closest(".contractor-document-field")?.remove();
  });

  contractorPasswordForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("senha_acesso") || "");
    const expectedPassword = String(contractorLayout?.dataset.contractorPassword || "");
    if (password !== expectedPassword) {
      showModal("Senha incorreta", "A senha informada não libera esta página.", "error");
      return;
    }
    contractorAccessPassword = password;
    contractorPasswordForm.hidden = true;
    contratadoDocForm.hidden = false;
  });

  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  document.getElementById("cpf-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  contratadoDocForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }

    const form = new FormData(formElement);
    const empresa = String(form.get("empresa") || formElement.dataset.company || "").trim();
    const origemHtml = String(form.get("origem_html") || contractorLayout?.dataset.contractorSource || window.location.pathname.split("/").pop() || "").trim();
    const nome = String(form.get("nome") || "").trim();
    const telefone = String(form.get("telefone") || "").trim();
    const cpf = String(form.get("cpf") || "").trim();
    const documentos = form.getAll("documentos").filter((file) => file && file.name);
    const turnstileToken = getPublicChallengeToken(formElement);

    if (!empresa || !nome || !telefone || !cpf || !documentos.length) {
      showModal("Dados obrigatórios", "Preencha todos os dados e anexe pelo menos um documento.", "error");
      return;
    }

    if (!isValidCpf(cpf)) {
      showModal("CPF inválido", "Informe um CPF válido no formato 000.000.000-00.", "error");
      return;
    }

    const fileError = documentos.map(validateContractorDocumentFile).find(Boolean);
    if (fileError) {
      showModal("Documento inválido", fileError, "error");
      return;
    }

    try {
      await submitPublicContractorDocuments({ empresa, origemHtml, nome, telefone, cpf, documentos, accessPassword: contractorAccessPassword, turnstileToken });
      formElement.reset();
      resetContractorDocumentFields(contractorDocumentsFields);
      showModal("Documentos enviados", "Os documentos foram enviados com sucesso para o RH.", "info");
    } catch (error) {
      console.error(error);
      const message = /duplicate key|23505|CPF ja possui envio|CPF já possui envio/i.test(error.message || "")
        ? "Este CPF já possui um envio de documentos registrado."
        : error.message || "Não foi possível enviar os documentos. Tente novamente.";
      showModal("Erro", message, "error");
    }
  });
}

const chamadoForm = document.getElementById("chamado-form");
if (chamadoForm) {
  ensurePublicCaptchaNotice(chamadoForm);

  document.getElementById("adicionar-colaborador-chamado")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("afterbegin", createChamadoCollaboratorBlock());
    populateEpiSelects();
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const addItemButton = event.target.closest(".add-chamado-item");
    if (addItemButton) {
      const block = addItemButton.closest("[data-chamado-collaborator]");
      const itemsList = block?.querySelector("[data-chamado-collaborator-items]");
      if (!itemsList) return;
      itemsList.insertAdjacentHTML("afterbegin", createMaloteItemRow());
      populateEpiSelects();
      return;
    }

    const removeCollaboratorButton = event.target.closest(".remove-chamado-collaborator");
    if (removeCollaboratorButton) {
      const blocks = document.querySelectorAll("#epi-list [data-chamado-collaborator]");
      if (blocks.length <= 1) return;
      removeCollaboratorButton.closest("[data-chamado-collaborator]")?.remove();
      return;
    }

    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const block = button.closest("[data-chamado-collaborator]");
    const rows = block?.querySelectorAll(".epi-row") || [];
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const typeSelect = event.target.closest("[data-item-type-select]");
    if (!typeSelect) return;
    const row = typeSelect.closest(".epi-row");
    const nameSelect = row?.querySelector("[data-item-select], [data-epi-select]");
    const sizeSelect = row?.querySelector('[name="epi_tamanho[]"]');
    if (nameSelect) nameSelect.innerHTML = renderItemNameOptions(typeSelect.value, "");
    if (sizeSelect) sizeSelect.innerHTML = renderItemSizeOptions(typeSelect.value, sizeSelect.value);
  });

  chamadoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const colaboradores = readChamadoCollaborators(formElement);
    if (!colaboradores.length || colaboradores.some((group) => !hasFullName(group.colaborador))) {
      showModal("Colaborador e EPIs obrigatorios", "Informe nome e sobrenome do colaborador e adicione pelo menos um EPI ou uniforme para ele.", "error");
      return;
    }
    const epiItems = flattenCollaboratorItems(colaboradores);

    const success = await addItem("chamados", {
  solicitante: form.get("solicitante"),
      unidade: form.get("unidade"),
      epis: formatEpiItems(epiItems),
      observacoes: form.get("observacoes"),
      status: "Aberto",
      createdBy: "Publico",
      _turnstileToken: turnstileToken,
    });

    if (success) {
      formElement.reset();
      resetChamadoCollaborators();
      populateUnitSelects();
      populateEpiSelects();
      showModal("Chamado aberto", "Sua solicitacao de EPI foi registrada com sucesso.", "info");
    }
  });
}

function prefillChamadoRequester() {
  const input = document.querySelector('#chamado-form [name="solicitante"]');
  if (!input) return;
  input.value = currentUserProfile?.nome || getCurrentUserName() || "";
  input.readOnly = true;
  input.classList.add("readonly-field");
}

function initializeAppData() {
  populateUnitSelects();
  populateEpiSelects();
  supabaseClient = getSupabaseClient();
  if (isPublicPage()) {
    loadPublicData();
    return;
  }
  applyRoleAccess();
  prefillChamadoRequester();
  renderAccountSettings();
  loadFromSupabase({ setupLive: true });
}

disableSensitiveFieldAutofill();

setupLogin().then((canInitialize) => {
  if (canInitialize) initializeAppData();
});

function reabrirChamado(id) {
  showConfirmActionModal({
    title: "Reabrir chamado",
    text: "Deseja mover este chamado de volta para a lista de chamados abertos?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await updateItem("chamados", id, { status: "Aberto" });
      if (success) showModal("Chamado reaberto", "O chamado voltou para a lista de abertos.", "info");
    },
  });
};

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
};

function editarDocumento(id) {
  const doc = documentRecords.find(d => d.id === id);
  if (!doc) return;

  window.editingDocId = id;

  document.querySelectorAll(".doc-tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".doc-view").forEach((view) => view.classList.remove("active"));
  
  const tabButton = document.querySelector(`.doc-tab[data-doc="${doc.type}"]`);
  if (tabButton) tabButton.classList.add("active");
  
  const viewElement = document.getElementById(`doc-${doc.type}`);
  if (viewElement) viewElement.classList.add("active");

  const form = document.querySelector(`form[data-doc-form="${doc.type}"]`);
  if (form && doc.formData) {
    Object.entries(doc.formData).forEach(([key, value]) => {
      if (form.elements[key]) setFieldValue(form.elements[key], value);
    });
    normalizeDocumentDateInputs(form);
    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.textContent = "Salvar alterações";
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function excluirDocumento(id) {
  const doc = documentRecords.find(d => d.id === id);
  if (!doc) return;
  showPasswordActionModal({
    title: "Excluir registro",
    text: `Confirme a senha de autorizacao para excluir o registro "${documentLabels[doc.type] || doc.type}" de ${doc.summary || "colaborador nao informado"}.`,
    confirmText: "Excluir",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: () => {
      documentRecords = documentRecords.filter(d => d.id !== id);
      saveDocumentRecords();
      renderDocumentRecords();
    },
  });
};

async function excluirUsuario(id) {
  const user = (data.usuarios || []).find((item) => String(item.id) === String(id));
  if (!user) return;

  showPasswordActionModal({
    title: "Deletar conta",
    text: `Confirme a senha de autorizacao para deletar ${user.nome} da equipe.`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteTeamUser(id);
    },
  });
};

function editarVaga(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("vaga-form");
  if (!vaga || !form) return;

  form.elements.id.value = vaga.id;
  form.elements.cargo.value = vaga.cargo || "";
  setFieldValue(form.elements.unidade, getCanonicalUnit(vaga.unidade) || "");
  form.elements.descricao.value = vaga.descricao || "";
  form.elements.requisitos.value = vaga.requisitos || "";
  form.elements.status.value = vaga.status || "Aberta";
  document.getElementById("cancelar-edicao-vaga")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

async function excluirVaga(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  if (!vaga) return;
  showPasswordActionModal({
    title: "Deletar vaga",
    text: `Confirme a senha de autorizacao para deletar a vaga "${vaga.cargo}".`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteItem("vagas", id);
    },
  });
};

function editarEvento(id) {
  const evento = (data.eventos || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("evento-form");
  if (!evento || !form) return;

  form.elements.id.value = evento.id;
  form.elements.titulo.value = evento.titulo || "";
  // converte ISO yyyy-mm-dd para dd/mm/aaaa na máscara
  form.elements.data.value = formatEventoDate(evento.data || "");
  form.elements.horario.value = evento.horario || "";
  form.elements.responsavel.value = evento.responsavel || "";
  form.elements.tipo.value = evento.tipo || "Evento";
  form.elements.descricao.value = evento.descricao || "";
  document.getElementById("cancelar-edicao-evento")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

async function excluirEvento(id) {
  const evento = (data.eventos || []).find((item) => String(item.id) === String(id));
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
};

async function excluirVtRegistro(id) {
  const registro = (data.vtRegistros || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showConfirmActionModal({
    title: "Apagar registro de VT",
    text: `Tem certeza que deseja apagar o registro de VT de "${registro.colaborador || "colaborador não informado"}"?`,
    confirmText: "Apagar",
    danger: true,
    onConfirm: async () => {
      const deleted = await deleteItem("vtRegistros", id);
      if (deleted) {
        showModal("Registro apagado", "O registro de vale-transporte foi apagado com sucesso.", "info");
      }
    },
  });
};

async function excluirDocumentoContratado(id) {
  const registro = (data.documentosContratados || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showPasswordActionModal({
    title: "Excluir documentos do contratado",
    text: `Confirme a senha de exclusao para apagar os documentos de "${registro.nome || "contratado não informado"}".`,
    confirmText: "Excluir",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      const isLocalRecord = String(id).startsWith("local-") || registro.pendingSync;
      if (isLocalRecord) {
        removePendingContractorDocument(id);
        data.documentosContratados = (data.documentosContratados || []).filter((item) => String(item.id) !== String(id));
        saveLocalData();
        renderDocumentosContratados();
        showModal("Documentos excluídos", "Os documentos do contratado foram removidos.", "info");
        return;
      }

      const deleted = await deleteItem("documentosContratados", id);
      if (deleted) {
        removePendingContractorDocument(id);
        showModal("Documentos excluídos", "Os documentos do contratado foram apagados com sucesso.", "info");
      }
    },
  });
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
};

function editarMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("malote-form");
  if (!malote || !form) return;

  setFieldValue(form.elements.id, malote.id);
  setFieldValue(form.elements.destino, malote.destino || "");
  setFieldValue(form.elements.origem, malote.origem || "");
  setFieldValue(form.elements.codigo_solicitacao, malote.codigoSolicitacao || "");
  setFieldValue(form.elements.observacoes, malote.observacoes || "");
  setFieldValue(form.elements.status, malote.status || "Separação");
  resetMaloteCollaborators(normalizeMaloteCollaborators(malote));
  document.getElementById("cancelar-edicao-malote")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

function baixarDocumentoMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;

  const collaboratorGroups = normalizeMaloteCollaborators(malote);
  const documentItems = collaboratorGroups.length
    ? collaboratorGroups.flatMap((group) => group.itens.map((item) => ({ ...item, colaborador: group.colaborador })))
    : parseEpiItems(malote.epis).map((item) => ({ ...item, colaborador: "Nao informado" }));
  const epiRows = (documentItems.length ? documentItems : [{ nome: malote.epis || "Nao informado", tamanho: "Nao se aplica", quantidade: "1", colaborador: "Nao informado" }])
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.colaborador || "Nao informado")}</td>
        <td>${escapeHtml(item.nome || "Nao informado")}</td>
        <td>${escapeHtml(item.tamanho || "Nao se aplica")}</td>
        <td>${escapeHtml(item.quantidade || "1")}</td>
      </tr>
    `)
    .join("");

  const conteudo = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; }
          .doc { border: 1px solid #111827; padding: 10px; }
          .top-note { border: 1px solid #9ca3af; padding: 6px; font-size: 9px; text-transform: uppercase; margin-bottom: 8px; }
          .header { display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header > div { display: table-cell; border: 1px solid #111827; padding: 8px; vertical-align: middle; }
          .brand { width: 58%; }
          .brand h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
          .brand p { margin: 4px 0 0; font-size: 10px; }
          .number { width: 22%; text-align: center; }
          .number strong { display: block; font-size: 18px; margin-top: 4px; }
          .status { width: 20%; text-align: center; }
          .section-title { background: #e5e7eb; border: 1px solid #111827; padding: 5px; font-weight: bold; text-transform: uppercase; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #111827; padding: 6px; vertical-align: top; }
          th { background: #f3f4f6; text-transform: uppercase; font-size: 9px; }
          .field-label { display: block; font-size: 8px; color: #374151; text-transform: uppercase; margin-bottom: 4px; }
          .field-value { font-size: 12px; font-weight: bold; min-height: 16px; }
          .muted { color: #6b7280; font-weight: normal; }
          .signature { height: 72px; }
          .table-col-item { width: 8%; }
          .table-col-epi-size { width: 22%; }
          .table-col-quantity { width: 16%; }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="top-note">Recebemos os materiais constantes neste documento de malote de EPI.</div>
          <div class="header">
            <div class="brand">
              <h1>HUB RH</h1>
              <p>Controle interno de malotes de EPI</p>
              <p class="muted">Documento gerado automaticamente pelo sistema</p>
            </div>
            <div class="number">
              <span class="field-label">Nº do malote</span>
              <strong>${escapeHtml(String(malote.codigoSolicitacao || malote.id || ""))}</strong>
            </div>
            <div class="status">
              <span class="field-label">Status</span>
              <div class="field-value">${escapeHtml(malote.status || "")}</div>
            </div>
          </div>

          <div class="section-title">Dados do malote</div>
          <table>
            <tr>
              <td>
                <span class="field-label">Destino</span>
                <div class="field-value">${escapeHtml(malote.destino || "Nao informado")}</div>
              </td>
              <td>
                <span class="field-label">Origem</span>
                <div class="field-value">${escapeHtml(malote.origem || "Nao informada")}</div>
              </td>
              <td>
                <span class="field-label">Data</span>
                <div class="field-value">${escapeHtml(malote.createdAt || "")}</div>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Registrado por</span>
                <div class="field-value">${escapeHtml(malote.createdBy || getSystemFallbackAuthor())}</div>
              </td>
              <td>
                <span class="field-label">Alterado por</span>
                <div class="field-value">${escapeHtml(malote.updatedBy || "Sem alteracoes")}</div>
              </td>
              <td>
                <span class="field-label">Emissao</span>
                <div class="field-value">${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
              </td>
            </tr>
          </table>

          <div class="section-title">Dados dos EPIs</div>
          <table>
            <thead>
              <tr>
                <th class="table-col-item">Item</th>
                <th>Colaborador</th>
                <th>EPI</th>
                <th class="table-col-epi-size">Tamanho do EPI</th>
                <th class="table-col-quantity">Quantidade</th>
              </tr>
            </thead>
            <tbody>${epiRows}</tbody>
          </table>

          <div class="section-title">Observações</div>
          <table>
            <tr>
              <td style="min-height:48px; height:48px;">
                <div class="field-value" style="font-weight:normal; white-space:pre-wrap;">${malote.observacoes ? escapeHtml(malote.observacoes) : '<span style="color:#9ca3af;">Sem observações.</span>'}</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", conteudo], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeNumero = String(malote.codigoSolicitacao || malote.id || "malote").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `malote-${safeNumero || "sem-numero"}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

async function excluirMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;

  showPasswordActionModal({
    title: "Deletar malote",
    text: `Confirme a senha de autorizacao para deletar o malote para "${malote.destino}".`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => deleteMaloteWithAuthorization(id, password),
    onConfirm: async () => {},
  });
};

async function verifyAuthorizationPassword(password) {
  const session = await getAuthSession();
  const config = getHubSupabaseConfig();
  if (!session?.access_token || !config.url || !config.anonKey) return false;
  const response = await fetch(`${config.url}/functions/v1/hub-malote-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": config.anonKey, "Authorization": `Bearer ${session.access_token}` },
    body: JSON.stringify({ validateOnly: true, password }),
  });
  if (response.ok) return true;
  const result = await response.json().catch(() => ({}));
  // Se a Edge Function nao suporta validateOnly, tenta id invalido para checar apenas a senha
  if (result.error === "Senha de autorizacao invalida.") return false;
  // Qualquer outro erro (ex: id invalido) significa que a senha foi aceita
  return response.status !== 401 && response.status !== 403;
}

async function deleteMaloteWithAuthorization(id, password) {
  const session = await getAuthSession();
  const config = getHubSupabaseConfig();
  if (!session?.access_token || !config.url || !config.anonKey) return false;
  const response = await fetch(`${config.url}/functions/v1/hub-malote-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": config.anonKey, "Authorization": `Bearer ${session.access_token}` },
    body: JSON.stringify({ id, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (result.error && result.error !== "Senha de autorizacao invalida.") showModal("Erro ao deletar malote", result.error, "error");
    return false;
  }
  data.malotes = (data.malotes || []).filter((item) => String(item.id) !== String(id));
  saveLocalData();
  renderAll();
  return true;
}

const documentFieldLabels = {
  colaborador: "Colaborador",
  cpf: "CPF",
  rg: "RG",
  cargo: "Cargo",
  funcao: "Função",
  filial: "Filial / Unidade",
  setor: "Setor",
  data: "Data de admissão",
  data_admissao: "Data de admissão",
  data_desligamento: "Data de desligamento",
  data_solicitacao: "Data da solicitação",
  data_entrevista: "Data da entrevista",
  data_ausencia: "Data(s) da ausência",
  data_feedback: "Data do feedback",
  data_registro: "Data do registro",
  data_abertura: "Data de abertura",
  data_inicio: "Data de início",
  data_movimentacao: "Data da movimentação",
  salario: "Salário",
  salario_atual: "Salário atual",
  salario_proposto: "Salário proposto",
  faixa_salarial: "Faixa salarial",
  horario_trabalho: "Horário de trabalho",
  horario_atraso: "Horário / período",
  centro_custo: "Centro de custo",
  requisitante: "Requisitante",
  lider: "Gestor / líder avaliador",
  gestor: "Gestor imediato",
  gestor_aplicador: "Gestor aplicador",
  gestor_solicitante: "Gestor solicitante",
  entrevistador: "Entrevistador",
  motivo: "Motivo",
  observacoes: "Observações",
  feedback: "Feedback final",
  positivos: "Pontos positivos",
  melhorias: "Pontos a desenvolver",
  acao: "Plano de ação",
  plano_acao: "Plano de ação",
  justificativa: "Justificativa",
  justificativa_movimentacao: "Justificativa da movimentação",
  descricao: "Descrição",
  requisitos: "Requisitos",
  pontos_atencao: "Pontos de atenção",
};

const documentLongFieldKeys = new Set([
  "observacoes",
  "feedback",
  "positivos",
  "melhorias",
  "acao",
  "plano_acao",
  "justificativa",
  "justificativa_movimentacao",
  "descricao",
  "requisitos",
  "pontos_atencao",
  "motivo",
  "impacto",
  "situacao",
  "expectativa_colaborador",
  "acompanhamento",
  "dependentes",
]);

function normalizeDownloadText(value) {
  return String(value || "").trim();
}

function formatFormDate(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
}

function getDocValue(formData, key) {
  const value = formData?.[key] || "";
  return key.includes("data") || key === "admissao" ? formatFormDate(value) : normalizeDownloadText(value);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl) {
  const [header = "", base64 = ""] = String(dataUrl || "").split(",");
  const mimeMatch = header.match(/^data:([^;]+);base64$/i);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

function safeDownloadName(title, ext) {
  const safeTitle = String(title || "documento").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  return `${safeTitle.toLowerCase()}-${Date.now()}.${ext}`;
}

function getDocumentFieldLabel(key) {
  return documentFieldLabels[key] || String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildStyledDocumentRows(formData = {}) {
  const entries = Object.entries(formData).filter(([, value]) => String(value || "").trim());
  const compactRows = entries.filter(([key]) => !documentLongFieldKeys.has(key));
  const longRows = entries.filter(([key]) => documentLongFieldKeys.has(key));

  const compactHtml = compactRows.map(([key, value]) => `
    <tr>
      <td class="label-cell">${escapeHtml(getDocumentFieldLabel(key))}</td>
      <td class="value-cell">${escapeHtml(getDocValue(formData, key)).replace(/\n/g, "<br>")}</td>
    </tr>
  `).join("");

  const longHtml = longRows.map(([key]) => `
    <section class="note-section">
      <h3>${escapeHtml(getDocumentFieldLabel(key))}</h3>
      <p>${escapeHtml(getDocValue(formData, key)).replace(/\n/g, "<br>")}</p>
    </section>
  `).join("");

  return { compactHtml, longHtml };
}

function downloadStyledRhDocument(doc, title) {
  const { compactHtml, longHtml } = buildStyledDocumentRows(doc.formData || {});
  const emittedAt = formatDateTime(new Date().toISOString());
  const owner = doc.updatedBy || doc.createdBy || getCurrentUserName();
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 18mm 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: 'Calibri', 'Segoe UI', Arial, Helvetica, sans-serif; color: #1f2933; background: #ffffff; font-size: 10.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .document { width: 100%; }

          /* Letterhead */
          .letterhead { display: table; width: 100%; padding-bottom: 12px; border-bottom: 3px solid #1f3a3a; }
          .letterhead-brand, .letterhead-meta { display: table-cell; vertical-align: bottom; }
          .letterhead-brand h1 { margin: 0; font-size: 20px; font-weight: 700; color: #1f3a3a; letter-spacing: 2px; }
          .letterhead-brand p { margin: 3px 0 0; font-size: 9px; color: #6b7c7c; text-transform: uppercase; letter-spacing: 1.5px; }
          .letterhead-meta { text-align: right; font-size: 9px; color: #4b5b5b; line-height: 1.6; }
          .letterhead-meta strong { color: #1f3a3a; }

          /* Title block */
          .doc-title { margin-top: 18px; margin-bottom: 4px; }
          .doc-title .doc-kicker { margin: 0; font-size: 9px; font-weight: 700; color: #1f7a6f; text-transform: uppercase; letter-spacing: 2px; }
          .doc-title h2 { margin: 4px 0 0; font-size: 17px; font-weight: 700; color: #1f2933; }
          .doc-title p { margin: 5px 0 0; font-size: 10.5px; color: #6b7c7c; font-style: italic; }
          .doc-title-rule { height: 1px; background: #d8e0e0; margin: 12px 0 18px; }

          /* Section heading */
          .section-heading { font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 5px; margin: 0 0 10px; border-bottom: 1px solid #1f3a3a; }

          /* Data table */
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          .data-table td { border: 1px solid #d8e0e0; padding: 7px 10px; vertical-align: top; }
          .data-table td.label-cell { width: 32%; background: #f4f7f7; font-size: 9px; font-weight: 700; color: #4b5b5b; text-transform: uppercase; letter-spacing: .5px; }
          .data-table td.value-cell { font-size: 11px; color: #1f2933; font-weight: 500; }

          /* Long-form notes */
          .note-section { margin-top: 16px; }
          .note-section h3 { margin: 0 0 6px; font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 5px; border-bottom: 1px solid #1f3a3a; }
          .note-section p { margin: 0; padding: 10px 12px; border: 1px solid #d8e0e0; border-radius: 2px; min-height: 46px; line-height: 1.65; white-space: normal; color: #344048; background: #fafcfc; }

          /* Signatures */
          .signature-box { display: table; width: 100%; margin-top: 56px; table-layout: fixed; }
          .signature-col { display: table-cell; width: 50%; padding: 0 24px; text-align: center; }
          .signature-line { border-top: 1px solid #1f2933; margin: 0 0 6px; }
          .signature-col span { font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: .8px; }

          /* Footer */
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #d8e0e0; color: #9aa8a8; font-size: 8.5px; text-align: center; letter-spacing: .5px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <main class="document">
          <header class="letterhead">
            <div class="letterhead-brand">
              <h1>HUB RH</h1>
              <p>Departamento de Recursos Humanos</p>
            </div>
            <div class="letterhead-meta">
              Emitido em <strong>${escapeHtml(emittedAt)}</strong><br />
              Responsável: <strong>${escapeHtml(owner)}</strong>
            </div>
          </header>

          <section class="doc-title">
            <p class="doc-kicker">Documento interno</p>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(doc.summary || "Registro de rotina RH")}</p>
          </section>
          <div class="doc-title-rule"></div>

          <p class="section-heading">Dados do registro</p>
          <table class="data-table">${compactHtml || '<tr><td class="label-cell">Registro</td><td class="value-cell">Sem dados cadastrados.</td></tr>'}</table>

          ${longHtml}

          <div class="signature-box">
            <div class="signature-col"><div class="signature-line"></div><span>Assinatura do colaborador</span></div>
            <div class="signature-col"><div class="signature-line"></div><span>Assinatura do RH / gestor</span></div>
          </div>
          <div class="footer">Documento interno HUB RH &middot; Conferir dados antes de assinar ou arquivar</div>
        </main>
      </body>
    </html>
  `;

  downloadBlob(new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" }), safeDownloadName(title, "doc"));
}

function baixarDocumentoRH(id) {
  const doc = documentRecords.find((item) => String(item.id) === String(id));
  if (!doc) return;
  const title = documentLabels[doc.type] || doc.type;
  downloadStyledRhDocument(doc, title);
};

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const { action, id } = target.dataset;

  // Ação especial para não fazer nada, útil para checkboxes dentro de elementos clicáveis
  if (action === 'no-op') {
    event.stopPropagation();
    return;
  }

  // Ações que precisam de stopPropagation
  if (['reabrir-denuncia', 'reabrir-chamado', 'toggle-denuncia-selection', 'toggle-chamado-selection'].includes(action)) {
    event.stopPropagation();
  }

  switch (action) {
    case 'ler-denuncia':
      lerDenuncia(id);
      break;
    case 'toggle-denuncia-selection': {
      const checkbox = document.querySelector(`.denuncia-select[value="${CSS.escape(String(id))}"]`);
      if (checkbox) checkbox.checked = !checkbox.checked;
      break;
    }
    case 'reabrir-denuncia':
      reabrirDenuncia(id);
      break;
    case 'toggle-chamado-selection': {
      const checkbox = document.querySelector(`.chamado-select[value="${CSS.escape(String(id))}"]`);
      if (checkbox) checkbox.checked = !checkbox.checked;
      break;
    }
    case 'reabrir-chamado':
      reabrirChamado(id);
      break;
    case 'editar-malote': editarMalote(id); break;
    case 'baixar-documento-malote': baixarDocumentoMalote(id); break;
    case 'excluir-malote': excluirMalote(id); break;
    case 'open-dashboard-activity': openDashboardActivity(target.dataset.index); break;
    case 'editar-vaga': editarVaga(id); break;
    case 'excluir-vaga': excluirVaga(id); break;
    case 'editar-evento': editarEvento(id); break;
    case 'excluir-evento': excluirEvento(id); break;
    case 'editar-vt': editarVtRegistro(id); break;
    case 'excluir-vt': excluirVtRegistro(id); break;
    case 'gerar-relatorio-vt': gerarRelatorioVt(target.dataset.scope); break;
    case 'editar-documento': editarDocumento(id); break;
    case 'baixar-documento-rh': baixarDocumentoRH(id); break;
    case 'excluir-documento': excluirDocumento(id); break;
    case 'excluir-documento-contratado': excluirDocumentoContratado(id); break;
    case 'excluir-usuario': excluirUsuario(id); break;
    case 'clear-chat-file':
      clearChatSelectedFile();
      break;
    case 'remove-chat-file':
      removeChatSelectedFile(target.dataset.index);
      break;
    case 'preview-chat-file':
      previewChatSelectedFile(target.dataset.index);
      break;
    case 'toggle-chat-attach-menu':
      event.preventDefault();
      toggleChatAttachMenu();
      break;
    case 'chat-attach-option':
      event.preventDefault();
      handleChatAttachOption(target.dataset.attachType);
      break;
    case 'toggle-chat-emoji-menu':
      event.preventDefault();
      toggleChatEmojiMenu();
      break;
    case 'insert-chat-emoji':
      event.preventDefault();
      insertChatEmoji(target.dataset.emoji || "");
      break;
    case 'open-chat-poll':
      showChatPollModal();
      break;
    case 'vote-chat-poll':
      votarEnqueteChat(id, target.dataset.option);
      break;
    case 'open-chat-image':
      openChatImageModal(target.dataset.chatImageBucket, target.dataset.chatImagePath, target.dataset.chatImageName || "Imagem");
      break;
    case 'download-chat-image':
      downloadPrivateStorageFile(target.dataset.chatImageBucket, target.dataset.chatImagePath, target.dataset.chatImageName || "imagem");
      break;
    case 'close-modal':
      target.closest('.modal-overlay')?.remove();
      break;
  }
});