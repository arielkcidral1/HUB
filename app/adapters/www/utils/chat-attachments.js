async function uploadChatFile(file, channelId = activeChatChannel) {
  if (!file || !file.name) return null;

  const bucket = getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files";
  const safeName = safePublicFileName(file.name || "arquivo");
  const channel = safePublicFileName(normalizeChatChannel(channelId || GENERAL_CHANNEL)).replace(/\./g, "-") || GENERAL_CHANNEL;
  const path = `chat/${channel}/${Date.now()}-${generateUUID()}-${safeName}`;

  if (postgresClient?.storage?.from) {
    try {
      const { error } = await postgresClient.storage.from(bucket).upload(path, file, { contentType: getChatFileMimeType(file), upsert: false });
      if (!error) return path;
      console.warn("Storage do chat indisponivel, tentando API local:", error);
    } catch (error) {
      console.warn("Falha no storage do chat, tentando API local:", error);
    }
  }

  await uploadPublicFile(file, path);
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
    return "O arquivo do chat deve ter no maximo 3 MB.";
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

function clearChatPreviewImageSizing(panel) {
  panel?.style.removeProperty("--chat-preview-image-url");
}

function updateChatPreviewImageSizing(panel, imageUrl) {
  if (!panel || !imageUrl) return;
  panel.style.setProperty("--chat-preview-image-url", `url("${imageUrl}")`);
}

function renderChatAttachmentPreview(files) {
  const preview = document.getElementById("chat-attachment-preview");
  if (!preview) return;
  const composer = document.getElementById("chat-form") || preview.closest(".chat-composer");
  const panel = composer?.closest(".chat-panel") || preview.closest(".chat-panel");
  let composerStrip = document.getElementById("chat-composer-preview-strip");
  if (!composerStrip && composer) {
    composerStrip = document.createElement("div");
    composerStrip.id = "chat-composer-preview-strip";
    composerStrip.className = "chat-preview-strip chat-composer-preview-strip";
    composerStrip.setAttribute("aria-label", "Anexo selecionado");
    composer.appendChild(composerStrip);
  }

  revokeChatAttachmentPreviewUrls();

  const selectedFiles = Array.isArray(files) ? files.filter((file) => file && file.name) : files && files.name ? [files] : [];
  if (!selectedFiles.length) {
    preview.hidden = true;
    preview.innerHTML = "";
    if (composerStrip) {
      composerStrip.hidden = true;
      composerStrip.innerHTML = "";
    }
    composer?.classList.remove("has-attachment-preview");
    panel?.classList.remove("has-attachment-preview");
    clearChatPreviewImageSizing(panel);
    return;
  }
  composer?.classList.add("has-attachment-preview");
  panel?.classList.add("has-attachment-preview");
  if (panel && preview.parentElement !== panel) panel.appendChild(preview);

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
    updateChatPreviewImageSizing(panel, chatAttachmentPreviewUrl);
    body = `
      <div class="chat-preview-image-frame">
        <img class="chat-preview-image" src="${chatAttachmentPreviewUrl}" alt="Previa de ${fileName}">
      </div>`;
    activeChip = `<img class="chat-preview-chip-image" src="${chatAttachmentPreviewUrl}" alt="" aria-hidden="true">`;
  } else if (mimeType.startsWith("video/")) {
    clearChatPreviewImageSizing(panel);
    body = `
      <div class="chat-preview-image-frame chat-preview-video-frame">
        <canvas class="chat-preview-video-canvas" aria-hidden="true"></canvas>
        <video class="chat-preview-video" src="${chatAttachmentPreviewUrl}" preload="auto" playsinline aria-label="Previa de ${fileName}"></video>
        <button type="button" class="chat-preview-video-toggle" data-action="toggle-chat-preview-video" aria-label="Reproduzir video">▶</button>
      </div>`;
    activeChip = `<video class="chat-preview-chip-image" src="${chatAttachmentPreviewUrl}" muted preload="metadata" playsinline aria-hidden="true"></video>`;
  } else if (mimeType.startsWith("audio/")) {
    clearChatPreviewImageSizing(panel);
    body = `
      <div class="chat-preview-audio-card">
        <button type="button" class="chat-preview-audio-trash" data-action="clear-chat-file" title="Remover audio" aria-label="Remover audio">??</button>
        <audio class="chat-preview-audio-player" controls src="${chatAttachmentPreviewUrl}"></audio>
      </div>`;
    activeChip = `<span class="chat-preview-chip-icon" aria-hidden="true">AUD</span>`;
  } else {
    clearChatPreviewImageSizing(panel);
    const fileIcon = `<span class="chat-preview-chip-icon" aria-hidden="true">${escapeHtml(extension.slice(0, 3))}</span>`;
    body = `
      <div class="chat-preview-unavailable chat-preview-file-only" title="${meta}" aria-label="${meta}">
        <div class="chat-preview-file-icon" aria-hidden="true">${fileIcon}</div>
      </div>`;
    activeChip = fileIcon;
  }

  const chips = selectedFiles.map((item, index) => {
    const itemType = getChatFileMimeType(item);
    const itemExtension = escapeHtml(getChatFileExtension(item).slice(0, 3));
    let chipContent = `<span class="chat-preview-chip-icon" aria-hidden="true">${itemType.startsWith("audio/") ? "AUD" : itemExtension}</span>`;
    if (index === chatAttachmentPreviewIndex) chipContent = activeChip;
    else if (itemType.startsWith("image/") || itemType.startsWith("video/")) {
      const itemUrl = URL.createObjectURL(item);
      chatAttachmentPreviewUrls.push(itemUrl);
      chipContent = itemType.startsWith("video/")
        ? `<video class="chat-preview-chip-image" src="${itemUrl}" muted preload="metadata" playsinline aria-hidden="true"></video>`
        : `<img class="chat-preview-chip-image" src="${itemUrl}" alt="" aria-hidden="true">`;
    }

    return `
      <span class="chat-preview-chip-wrap">
        <button type="button" class="chat-preview-chip ${index === chatAttachmentPreviewIndex ? "is-active" : ""}" data-action="preview-chat-file" data-index="${index}" title="Visualizar ${escapeHtml(item.name)}" aria-label="Visualizar ${escapeHtml(item.name)}">
          ${chipContent}
        </button>
        <button type="button" class="chat-preview-chip-remove" data-action="remove-chat-file" data-index="${index}" title="Remover ${escapeHtml(item.name)}" aria-label="Remover ${escapeHtml(item.name)}">&times;</button>
      </span>`;
  }).join("");

  preview.innerHTML = `
    <button type="button" class="chat-preview-close" data-action="clear-chat-file" title="Remover anexo" aria-label="Remover anexo">&times;</button>
    <div class="chat-preview-title">${fileName}${selectedFiles.length > 1 ? ` + ${selectedFiles.length - 1} arquivo(s)` : ""}</div>
    <div class="chat-preview-body">${body}</div>
  `;
  preview.hidden = false;
  hydrateChatAttachmentPreviewVideo(preview);
  if (composerStrip) {
    composerStrip.innerHTML = `
      ${chips}
      <label class="chat-preview-add" for="chat-file" title="Trocar anexo" aria-label="Trocar anexo">+</label>
    `;
    composerStrip.hidden = false;
  }
}

function hydrateChatAttachmentPreviewVideo(preview) {
  const video = preview?.querySelector?.(".chat-preview-video");
  const canvas = preview?.querySelector?.(".chat-preview-video-canvas");
  const toggle = preview?.querySelector?.(".chat-preview-video-toggle");
  if (!video || video.dataset.previewHydrated === "true") return;
  video.dataset.previewHydrated = "true";
  let animationFrameId = 0;

  const drawVideoFrame = () => {
    if (!video.videoWidth || !video.videoHeight) return;
    try {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#0f1110";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const canvasRatio = canvas.width / canvas.height;
      const videoRatio = video.videoWidth / video.videoHeight;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      if (videoRatio > canvasRatio) drawHeight = canvas.width / videoRatio;
      else drawWidth = canvas.height * videoRatio;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      console.warn("Nao foi possivel desenhar previa do video:", error);
    }
  };
  const syncToggle = () => {
    if (!toggle) return;
    toggle.textContent = video.paused ? "▶" : "⏸";
    toggle.setAttribute("aria-label", video.paused ? "Reproduzir video" : "Pausar video");
  };
  const drawWhilePlaying = () => {
    drawVideoFrame();
    if (!video.paused && !video.ended) animationFrameId = window.requestAnimationFrame(drawWhilePlaying);
  };

  video.addEventListener("loadeddata", drawVideoFrame, { once: true });
  video.addEventListener("seeked", drawVideoFrame);
  video.addEventListener("timeupdate", drawVideoFrame);
  video.addEventListener("play", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    syncToggle();
    drawWhilePlaying();
  });
  video.addEventListener("pause", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    syncToggle();
    drawVideoFrame();
  });
  video.addEventListener("ended", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    syncToggle();
    drawVideoFrame();
  });
  video.addEventListener("loadedmetadata", () => {
    const targetTime = Math.min(0.1, Math.max(0, Number(video.duration || 0) / 2));
    if (Number.isFinite(targetTime) && targetTime > 0) {
      try { video.currentTime = targetTime; } catch (_) {}
    }
  }, { once: true });

  try { video.load(); } catch (_) {}
  syncToggle();
}

function toggleChatAttachmentPreviewVideo() {
  const preview = document.getElementById("chat-attachment-preview");
  const video = preview?.querySelector?.(".chat-preview-video");
  if (!video) return;
  if (video.paused || video.ended) {
    video.play().catch((error) => {
      console.warn("Nao foi possivel reproduzir o video:", error);
    });
    return;
  }
  video.pause();
}

function resetAudioRecordButton() {
  const button = document.getElementById("record-audio-button");
  if (!button) return;
  button.title = "Gravar Áudio";
  button.setAttribute("aria-label", "Gravar Áudio");
  button.classList.remove("is-recording");
  button.classList.remove("is-processing");
  stopChatAudioTimer();
  updateChatAudioDuration(0);
  button.disabled = false;
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
    button.title = "Processando Áudio";
    button.setAttribute("aria-label", "Processando Áudio");
    button.classList.remove("is-recording");
    button.classList.add("is-processing");
    button.disabled = true;
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showModal("Gravação indisponível", "Seu navegador não suporta gravação de Áudio neste canal.", "error");
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
        showModal("Áudio vazio", "A gravação não capturou Áudio.", "error");
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
