let publicVagaCargoFilter = "";
let publicVagaCidadeFilter = "";
let chatAudioRecorder = null;
let chatAudioChunks = [];
let chatAudioStream = null;
let chatAudioStartedAt = 0;
let chatAudioTimer = null;
let chatAttachmentPreviewUrl = "";
let chatAttachmentPreviewUrls = [];
let chatSelectedFiles = [];
let chatAttachmentPreviewIndex = 0;
let lastChatClientTimestamp = 0;

function getHubPostgreSQLConfig() {
  return {
    ...DEFAULT_HUB_POSTGRES,
    ...(window.HUB_POSTGRES || {}),
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
