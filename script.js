const STORAGE_KEY = "hub-rh-data";
const DOCUMENT_RECORDS_KEY = "hub-document-records";
const SESSION_KEY = "hub-rh-session";
const LOGIN_NAME = "ariel";
const LOGIN_PASSWORD = "arielc";
const TABLES = {
  denuncias: "hub_denuncias",
  comunicados: "hub_chat_messages",
  malotes: "hub_malotes",
  vagas: "hub_vagas",
  candidaturas: "hub_candidaturas",
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
      arquivo: null,
      createdAt: "Hoje",
    },
  ],
  malotes: [
    {
      id: generateUUID(),
      destino: "Unidade Norte",
      epis: "Luvas nitrilicas, oculos de protecao, protetor auricular",
      status: "Em transito",
      createdAt: "Hoje",
    },
  ],
  vagas: [
    {
      id: generateUUID(),
      cargo: "Auxiliar Administrativo",
      projeto: "Projeto Expansao",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  candidaturas: [],
};

let data = loadLocalData();
let supabaseClient = null;
let realtimeChannel = null;
let activeChatChannel = 'geral';
let refreshTimer = null;
let refreshInProgress = false;
let documentRecords = loadDocumentRecords();
window.editingDocId = null;

const chatChannels = {
  geral: "Chat geral",
  rh: "Equipe RH",
};

const documentLabels = {
  admissao: "Checklist de Admissao",
  ausencia: "Entrevista ausencia",
  desligamento: "Entrevista de Desligamento",
  beneficios: "Adesao plano saude e odonto",
  "feedback-operacional": "Feedback operacional",
  "feedback-fredy": "Feedback Fredy Pneus",
};

function isLoginMatch(value, expected) {
  return String(value || "").trim().toLowerCase() === expected;
}

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "active";
}

function isPublicPage() {
  return Boolean(document.querySelector("[data-public-denuncia]") || document.querySelector("[data-public-vagas]"));
}

function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

function setupLogin() {
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");

  // Redirecionamentos Inteligentes
  if (isAuthenticated()) {
    if (isLoginPage()) {
      window.location.href = "index.html";
      return false;
    }
  } else {
    if (!isLoginPage() && !isPublicPage()) {
      window.location.href = "login.html";
      return false;
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const nameOk = isLoginMatch(form.get("nome"), LOGIN_NAME);
      const passwordOk = isLoginMatch(form.get("senha"), LOGIN_PASSWORD);
  
      if (!nameOk || !passwordOk) {
        document.getElementById("login-error").textContent = "Nome ou senha incorretos.";
        return;
      }
  
      sessionStorage.setItem(SESSION_KEY, "active");
      window.location.href = "index.html";
    });
  }

  logoutButton?.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });

  return isAuthenticated() || isPublicPage();
}

function getSupabaseClient() {
  const config = window.HUB_SUPABASE;
  const hasConfig =
    config &&
    config.url &&
    config.anonKey &&
    !config.url.includes("COLE_AQUI") &&
    !config.anonKey.includes("COLE_AQUI") &&
    window.supabase;

  if (!hasConfig) return null;
  return window.supabase.createClient(config.url, config.anonKey);
}

function setSyncStatus(text, isOnline = false) {
  const target = document.getElementById("sync-status");
  if (!target) return;
  target.textContent = text;
  document.querySelector(".status-dot")?.classList.toggle("offline", !isOnline);
}

function loadLocalData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData;

  try {
    const parsed = JSON.parse(saved);
    parsed.comunicados = (parsed.comunicados || []).map((item) => ({
      id: item.id || generateUUID(),
      autor: item.autor || "Equipe RH",
      mensagem: item.mensagem || item.titulo || "",
      canal: item.canal || "geral",
      arquivo: item.arquivo || null,
      createdAt: item.createdAt || "Hoje",
    }));
    return {
      denuncias: parsed.denuncias || [],
      comunicados: parsed.comunicados || [],
      malotes: parsed.malotes || [],
      vagas: parsed.vagas || [],
      candidaturas: parsed.candidaturas || [],
    };
  } catch {
    return defaultData;
  }
}

function loadDocumentRecords() {
  try {
    return JSON.parse(localStorage.getItem(DOCUMENT_RECORDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDocumentRecords() {
  localStorage.setItem(DOCUMENT_RECORDS_KEY, JSON.stringify(documentRecords));
}

function saveLocalData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

function todayLabel() {
  return formatDate(new Date().toISOString());
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
        <button class="primary-button" onclick="document.getElementById('custom-modal').remove()">Entendi</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function encodeChatMessage(channel, message) {
  return `[hub-channel:${channel || "geral"}] ${message || ""}`.trim();
}

function parseChatMessage(row) {
  const text = row.mensagem || "";
  const match = text.match(/^\[hub-channel:([^\]]+)\]\s*/);
  return {
    canal: row.canal || match?.[1] || "geral",
    mensagem: match ? text.slice(match[0].length) : text,
  };
}

function mapRows(collection, rows) {
  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status || "Aberta", // Garante o mapeamento do status
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
      epis: row.epis,
      status: row.status,
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "candidaturas") {
    return rows.map((row) => ({
      id: row.id,
      vaga_id: row.vaga_id,
      nome: row.nome,
      cpf: row.cpf,
      curriculo_url: row.curriculo_url,
      createdAt: formatDate(row.created_at),
    }));
  }

  return rows.map((row) => ({
    id: row.id,
    cargo: row.cargo,
    projeto: row.projeto,
    status: row.status,
    createdAt: formatDate(row.created_at),
  }));
}

function mergeRealtimeRow(collection, row, action = "INSERT") {
  const mapped = mapRows(collection, [row])[0];
  const current = data[collection] || [];

  if (action === "DELETE") {
    data[collection] = current.filter((item) => String(item.id) !== String(row.id));
    return;
  }

  const index = current.findIndex((item) => String(item.id) === String(mapped.id));
  if (index >= 0) {
    data[collection] = current.map((item, itemIndex) => (itemIndex === index ? mapped : item));
    return;
  }

  data[collection] = [mapped, ...current];
}

function toDbPayload(collection, values) {
  if (collection === "comunicados") {
    return {
      autor: values.autor,
      mensagem: encodeChatMessage(values.canal || "geral", values.mensagem || ""),
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
  }

  return values;
}

async function loadFromSupabase(options = {}) {
  const { setupLive = true } = options;

  if (!supabaseClient) {
    setSyncStatus("Modo local", false);
    renderAll();
    return;
  }

  try {
    const requests = await Promise.all(
      Object.entries(TABLES).map(async ([collection, table]) => {
        const { data: rows, error } = await supabaseClient.from(table).select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return [collection, mapRows(collection, rows || [])];
      })
    );

    data = Object.fromEntries(requests);
    saveLocalData();
    if (setupLive) {
      setupRealtime();
      setupAutoRefresh();
    }
    renderAll();
  } catch (error) {

  }
}

async function refreshFromSupabase() {
  if (!supabaseClient || refreshInProgress || isPublicPage()) return;

  refreshInProgress = true;
  try {
    await loadFromSupabase({ setupLive: false });
  } finally {
    refreshInProgress = false;
  }
}

function setupAutoRefresh() {
  if (refreshTimer || isPublicPage()) return;

  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshFromSupabase();
    }
  }, 15000);
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

        mergeRealtimeRow(collection, row, payload.eventType);
        saveLocalData();
        renderAll();
      }
    );
  });

  realtimeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.info("HUB realtime conectado");
    }
  });
}

async function uploadChatFile(file) {
  if (!supabaseClient || !file || !file.name) return null;

  const bucket = window.HUB_SUPABASE.chatFilesBucket || "hub-chat-files";
  const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "-");
  const path = `${Date.now()}-${generateUUID()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data: publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return publicUrl.publicUrl;
}

async function addItem(collection, values) {
  if (!supabaseClient) {
    data[collection].unshift({
      id: generateUUID(),
      createdAt: todayLabel(),
      ...values,
    });
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const { data: inserted, error } = await supabaseClient
      .from(TABLES[collection])
      .insert(toDbPayload(collection, values))
      .select("*")
      .single();

    if (error) throw error;

    data[collection].unshift(mapRows(collection, [inserted])[0]);
    saveLocalData();
    setSyncStatus("Supabase EIXO online", true);
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao salvar no Supabase:", error);
    setSyncStatus("Erro no Supabase", false);
    showModal("Erro ao Salvar", "Nao foi possivel salvar no Supabase. Confira se as tabelas hub_* existem no projeto EIXO.", "error");
    return false;
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

function renderDashboard() {
  if (!document.getElementById("metric-denuncias")) return;

  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status !== "Lida" && item.status !== "Fechada").length;
  if (document.getElementById("metric-comunicados")) {
    document.getElementById("metric-comunicados").textContent = data.comunicados.length;
  }
  if (document.getElementById("chat-total")) {
    document.getElementById("chat-total").textContent = data.comunicados.length;
  }
  if (document.getElementById("metric-malotes")) {
    document.getElementById("metric-malotes").textContent = data.malotes.filter((item) => item.status === "Em transito").length;
  }
  if (document.getElementById("metric-vagas")) {
    document.getElementById("metric-vagas").textContent = data.vagas.filter((item) => item.status !== "Fechada").length;
  }
  if (document.getElementById("metric-documentos")) {
    document.getElementById("metric-documentos").textContent = documentRecords.length;
  }

  // Filtra itens prioritários (apenas denúncias abertas/urgentes e anexos recentes)
  const priorityItems = [
    ...data.denuncias
      .filter(item => item.status === "Aberta" || item.status === "Urgente")
      .map((item) => ({
        title: `Denúncia: ${item.categoria}`,
        text: item.descricao,
        tag: item.status,
        date: item.createdAt,
      })),
    ...data.comunicados
      .filter((item) => item.arquivo)
      .map((item) => ({ 
        title: `Arquivo: ${item.arquivo.name}`, 
        text: item.mensagem || "Anexo compartilhado no chat", 
        tag: "RH", 
        date: item.createdAt 
      })),
  ].slice(0, 6);

  // Compila atividades de todos os outros módulos na lista de recentes
  const recentItems = [
    ...data.malotes.map((item) => ({ title: `Malote: ${item.destino}`, text: item.epis, tag: item.status, date: item.createdAt })),
    ...data.vagas.map((item) => ({ title: `Vaga: ${item.cargo}`, text: item.projeto, tag: item.status, date: item.createdAt })),
    ...documentRecords.map((item) => ({ title: `Doc: ${documentLabels[item.type] || item.type}`, text: item.summary, tag: "Registro", date: item.createdAt }))
  ].slice(0, 6);

  const priorityTarget = document.getElementById("priority-list");
  if (priorityTarget) {
    if (priorityItems.length === 0) {
      priorityTarget.innerHTML = '<p class="empty-state">Nenhuma pendência prioritária no momento.</p>';
    } else {
      priorityTarget.innerHTML = priorityItems
        .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p><p class="item-meta" style="margin-top: 6px; font-size: 12px;">${escapeHtml(item.date)}</p></li>`)
        .join("");
    }
  }

  const recentTarget = document.getElementById("recent-list");
  if (recentTarget) {
    if (recentItems.length === 0) {
      recentTarget.innerHTML = '<p class="empty-state">Nenhuma atividade recente registrada.</p>';
    } else {
      recentTarget.innerHTML = recentItems
        .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p><p class="item-meta" style="margin-top: 6px; font-size: 12px;">${escapeHtml(item.date)}</p></li>`)
        .join("");
    }
  }
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

function renderPublicVagas() {
  const select = document.getElementById("vaga-select");
  const list = document.getElementById("public-vagas-list");
  if (!select || !list) return;

  const openVagas = data.vagas.filter(v => v.status === "Aberta");

  if (!openVagas.length) {
    list.innerHTML = '<p class="empty-state">Nenhuma vaga aberta no momento.</p>';
    select.innerHTML = '<option value="">Nenhuma vaga disponível</option>';
    select.disabled = true;
    return;
  }

  list.innerHTML = openVagas.map(v => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(v.cargo)}</p>
        <span class="tag">${escapeHtml(v.projeto)}</span>
      </div>
    </article>
  `).join("");

  select.disabled = false;
  select.innerHTML = '<option value="">Selecione uma vaga...</option>' + openVagas.map(v => `<option value="${v.id}">${escapeHtml(v.cargo)} - ${escapeHtml(v.projeto)}</option>`).join("");
}

function renderAll() {
  renderDashboard();
  renderPublicVagas();

  // Filtra as denúncias entre as listas de Não Lidas e Lidas
  const naoLidas = data.denuncias.filter(item => item.status === "Aberta");
  const lidas = data.denuncias.filter(item => item.status === "Lida");

  const cardTemplate = (item) => `
    <article class="item-card" style="cursor: pointer;" onclick="lerDenuncia('${item.id}')">
      <div class="item-topline">
        <p class="item-title">Denuncia anonima</p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.descricao.substring(0, 80))}${item.descricao.length > 80 ? '...' : ''}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `;

  renderCards("denuncias-nao-lidas", naoLidas, cardTemplate);
  renderCards("denuncias-lidas", lidas, cardTemplate);

  renderChat();

  renderCards("malotes-list", data.malotes, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.destino)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p>${escapeHtml(item.epis)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);

  renderCards("vagas-list", data.vagas, (item) => {
    const candidaturas = (data.candidaturas || []).filter(c => String(c.vaga_id) === String(item.id));
    let candidaturasHtml = `<p style="margin-top: 8px; font-size: 13px; color: var(--muted);">Nenhum currículo recebido.</p>`;
    
    if (candidaturas.length > 0) {
      candidaturasHtml = candidaturas.map(c => `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
          <p style="margin: 0; font-size: 13px; font-weight: 600;">${escapeHtml(c.nome)} <span style="font-weight: normal; color: var(--muted);">(CPF: ${escapeHtml(c.cpf)})</span></p>
          <a href="${escapeHtml(c.curriculo_url)}" target="_blank" class="secondary-link" style="min-height: 28px; padding: 0 10px; font-size: 12px;">Ver Currículo</a>
        </div>
      `).join("");
    }

    return `
      <article class="item-card">
        <div class="item-topline"><p class="item-title">${escapeHtml(item.cargo)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
        <p>${escapeHtml(item.projeto)}</p>
        <p class="item-meta">${escapeHtml(item.createdAt)}</p>
        <div style="margin-top: 16px; background: var(--surface-soft); padding: 16px; border-radius: var(--radius-md);"><p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--teal);">Currículos Recebidos (${candidaturas.length})</p>${candidaturasHtml}</div>
      </article>
    `;
  });

  renderDocumentRecords();
}

function renderDocumentRecords() {
  const target = document.getElementById("document-records");
  if (!target) return;

  if (!documentRecords.length) {
    target.innerHTML = '<p class="empty-state">Nenhum registro salvo ainda.</p>';
    return;
  }

  target.innerHTML = documentRecords
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(documentLabels[item.type] || item.type)}</p>
          <div>
            <span class="tag">${escapeHtml(item.createdAt)}</span>
            <button type="button" class="tag" style="cursor: pointer; border: none; margin-left: 6px; background: var(--teal-surface); color: var(--teal-dark);" onclick="editarDocumento('${item.id}')">Editar</button>
            <button type="button" class="tag alert" style="cursor: pointer; border: none; margin-left: 6px;" onclick="excluirDocumento('${item.id}')">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <p class="item-meta">${escapeHtml(item.details)}</p>
      </article>
    `)
    .join("");
}

function renderChat() {
  const target = document.getElementById("chat-feed");
  if (!target) return;

  const title = document.getElementById("chat-title");
  const subtitle = document.getElementById("chat-subtitle");
  if (title) title.textContent = chatChannels[activeChatChannel] || "Chat geral";
  if (subtitle) subtitle.textContent = activeChatChannel === "geral" ? "Mensagens e arquivos compartilhados pela equipe" : `Conversa com ${chatChannels[activeChatChannel]}`;

  if (document.getElementById("chat-total")) {
    document.getElementById("chat-total").textContent = data.comunicados.filter((item) => (item.canal || "geral") === "geral").length;
  }
  document.querySelectorAll("[data-channel-count]").forEach((counter) => {
    const channel = counter.dataset.channelCount;
    counter.textContent = data.comunicados.filter((item) => (item.canal || "geral") === channel).length;
  });

  const messages = data.comunicados.filter((item) => (item.canal || "geral") === activeChatChannel);

  if (!messages.length) {
    target.innerHTML = '<p class="empty-state">Nenhuma mensagem neste chat ainda.</p>';
    return;
  }

  target.innerHTML = messages
    .slice()
    .reverse()
    .map((item) => {
      const attachment = item.arquivo
        ? `<a class="attachment-chip" href="${escapeHtml(item.arquivo.url || "#")}" target="_blank" rel="noreferrer">Arquivo: ${escapeHtml(item.arquivo.name)} ${escapeHtml(formatFileSize(item.arquivo.size))}</a>`
        : "";

      return `
        <article class="chat-message ${item.autor === "Voce" ? "own" : ""}">
          <div class="chat-author">
            <span>${escapeHtml(item.autor)}</span>
            <time>${escapeHtml(item.createdAt)}</time>
          </div>
          ${item.mensagem ? `<p>${escapeHtml(item.mensagem)}</p>` : ""}
          ${attachment}
        </article>
      `;
    })
    .join("");

  target.scrollTop = target.scrollHeight;
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
  });
});
document.querySelectorAll("[data-chat-channel]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-chat-channel]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeChatChannel = button.dataset.chatChannel || "geral";
    renderChat();
  });
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
  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = [...form.entries()].filter(([, value]) => String(value || "").trim());
    const collaborator = form.get("colaborador") || form.get("cargo") || "Registro sem colaborador";
    const details = entries
      .filter(([key]) => key !== "colaborador")
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    if (window.editingDocId) {
      // Atualiza o documento existente
      const index = documentRecords.findIndex(d => d.id === window.editingDocId);
      if (index > -1) {
        documentRecords[index] = {
          ...documentRecords[index],
          summary: String(collaborator),
          details: details || "Registro salvo",
          formData: Object.fromEntries(entries),
        };
      }
      window.editingDocId = null;
      const btn = event.currentTarget.querySelector("button[type='submit']");
      if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    } else {
      // Cria um novo documento
      documentRecords.unshift({
        id: generateUUID(),
        type: event.currentTarget.dataset.docForm,
        summary: String(collaborator),
        details: details || "Registro salvo",
        formData: Object.fromEntries(entries),
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
  denunciaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const message = String(form.get("mensagem") || form.get("descricao") || "").trim();
    if (!message) return;

    const success = await addItem("denuncias", {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: message,
      status: "Aberta",
    });

    if (success) {
      formElement.reset();
      const feedback = document.getElementById("denuncia-feedback");
      if (feedback) {
        feedback.textContent = "Denuncia enviada com sucesso. Obrigado pelo relato.";
      }
    }
  });
}

const chatFile = document.getElementById("chat-file");
if (chatFile) {
  chatFile.addEventListener("change", (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      document.getElementById("selected-file").innerHTML = `${escapeHtml(file.name)} - ${formatFileSize(file.size)} <button type="button" onclick="document.getElementById('chat-file').value=''; document.getElementById('selected-file').textContent='Nenhum arquivo selecionado';" style="margin-left: 8px; background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;" title="Remover anexo">X</button>`;
    } else {
      document.getElementById("selected-file").textContent = "Nenhum arquivo selecionado";
    }
  });
}

const chatForm = document.getElementById("chat-form");
if (chatForm) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const file = form.get("arquivo");
    const message = String(form.get("mensagem") || "").trim();

    if (!message && (!file || !file.name)) return;

    let fileUrl = null;
    if (file && file.name) {
      try {
        fileUrl = await uploadChatFile(file);
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
        setSyncStatus("Erro no anexo", false);
        showModal("Erro no Anexo", "Nao foi possivel enviar o arquivo. Confira o bucket hub-chat-files no Supabase.", "error");
        return; // Interrompe o envio se o arquivo falhar!
      }
    }

    const success = await addItem("comunicados", {
      autor: "Voce",
      canal: activeChatChannel,
      mensagem: message,
      arquivo: file && file.name ? { name: file.name, size: file.size, type: file.type, url: fileUrl } : null,
    });

    if (success) {
      formElement.reset();
      document.getElementById("selected-file").textContent = "Nenhum arquivo selecionado";
    }
  });
}

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  maloteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const success = await addItem("malotes", {
      destino: form.get("destino"),
      epis: form.get("epis"),
      status: form.get("status"),
    });
    if (success) {
      formElement.reset();
    }
  });
}

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const success = await addItem("vagas", {
      cargo: form.get("cargo"),
      projeto: form.get("projeto"),
      status: form.get("status"),
    });
    if (success) {
      formElement.reset();
    }
  });
}

const candidaturaForm = document.getElementById("candidatura-form");
if (candidaturaForm) {
  candidaturaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const vaga_id = form.get("vaga_id");
    const nome = form.get("nome");
    const cpf = form.get("cpf");
    const curriculo = form.get("curriculo");

    if (!vaga_id || !nome || !cpf || !curriculo || !curriculo.name) return;

    const existing = (data.candidaturas || []).find(c => String(c.vaga_id) === String(vaga_id) && c.cpf === cpf);
    if (existing) {
      showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      return;
    }

    try {
      let fileUrl = "Arquivo local (não enviado)";
      if (supabaseClient) {
        const safeName = curriculo.name.replace(/[^a-z0-9_.-]/gi, "-");
        const path = `${Date.now()}-${generateUUID()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage.from("hub-curriculos").upload(path, curriculo);
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabaseClient.storage.from("hub-curriculos").getPublicUrl(path);
        fileUrl = publicData.publicUrl;
      }

      const success = await addItem("candidaturas", { vaga_id, nome, cpf, curriculo_url: fileUrl });
      if (success) {
        formElement.reset();
        showModal("Sucesso", "Seu currículo foi enviado com sucesso!", "info");
      }
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      } else {
        showModal("Erro", "Não foi possível enviar o currículo. Verifique sua conexão e tente novamente.", "error");
      }
    }
  });
}

function initializeAppData() {
  supabaseClient = getSupabaseClient();
  loadFromSupabase({ setupLive: !isPublicPage() });
}

if (setupLogin()) {
  initializeAppData();
}

// Vincula a função globalmente ao escopo de janela (window) para que o atributo onclick do HTML consiga disparar a leitura.
window.lerDenuncia = lerDenuncia;

// Lógica para preparar os formulários com os dados de um documento existente
window.editarDocumento = function(id) {
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
      if (form.elements[key]) form.elements[key].value = value;
    });
    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.textContent = "Salvar alterações";
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Lógica de exclusão rápida
window.excluirDocumento = function(id) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    documentRecords = documentRecords.filter(d => d.id !== id);
    saveDocumentRecords();
    renderDocumentRecords();
  }
};