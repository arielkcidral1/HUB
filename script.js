const STORAGE_KEY = "hub-rh-data";
const SESSION_KEY = "hub-rh-session";
const LOGIN_NAME = "ariel";
const LOGIN_PASSWORD = "arielc";
const TABLES = {
  denuncias: "hub_denuncias",
  comunicados: "hub_chat_messages",
  malotes: "hub_malotes",
  vagas: "hub_vagas",
};

const defaultData = {
  denuncias: [
    {
      id: crypto.randomUUID(),
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: "Relato anonimo recebido para avaliacao inicial do RH.",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  comunicados: [
    {
      id: crypto.randomUUID(),
      autor: "Marina Souza",
      mensagem: "Revisar pendencias de beneficios, vagas e entregas de EPI.",
      arquivo: null,
      createdAt: "Hoje",
    },
  ],
  malotes: [
    {
      id: crypto.randomUUID(),
      destino: "Unidade Norte",
      epis: "Luvas nitrilicas, oculos de protecao, protetor auricular",
      status: "Em transito",
      createdAt: "Hoje",
    },
  ],
  vagas: [
    {
      id: crypto.randomUUID(),
      cargo: "Auxiliar Administrativo",
      projeto: "Projeto Expansao",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
};

let data = loadLocalData();
let supabaseClient = null;

function isLoginMatch(value, expected) {
  return String(value || "").trim().toLowerCase() === expected;
}

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "active";
}

function showApp() {
  document.getElementById("login-screen")?.classList.add("is-hidden");
  document.getElementById("app-shell")?.classList.remove("is-locked");
}

function showLogin() {
  document.getElementById("login-screen")?.classList.remove("is-hidden");
  document.getElementById("app-shell")?.classList.add("is-locked");
}

function setupLogin() {
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");

  if (!loginForm) return true;

  if (isAuthenticated()) {
    showApp();
  } else {
    showLogin();
  }

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
    document.getElementById("login-error").textContent = "";
    event.currentTarget.reset();
    showApp();
    initializeAppData();
  });

  logoutButton?.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  return isAuthenticated();
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
      id: item.id || crypto.randomUUID(),
      autor: item.autor || "Equipe RH",
      mensagem: item.mensagem || item.titulo || "",
      arquivo: item.arquivo || null,
      createdAt: item.createdAt || "Hoje",
    }));
    return {
      denuncias: parsed.denuncias || [],
      comunicados: parsed.comunicados || [],
      malotes: parsed.malotes || [],
      vagas: parsed.vagas || [],
    };
  } catch {
    return defaultData;
  }
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

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mapRows(collection, rows) {
  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status,
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "comunicados") {
    return rows.map((row) => ({
      id: row.id,
      autor: row.autor,
      mensagem: row.mensagem || "",
      arquivo: row.arquivo_nome
        ? {
            name: row.arquivo_nome,
            size: row.arquivo_tamanho,
            type: row.arquivo_tipo,
            url: row.arquivo_url,
          }
        : null,
      createdAt: formatDate(row.created_at),
    }));
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

  return rows.map((row) => ({
    id: row.id,
    cargo: row.cargo,
    projeto: row.projeto,
    status: row.status,
    createdAt: formatDate(row.created_at),
  }));
}

function toDbPayload(collection, values) {
  if (collection === "comunicados") {
    return {
      autor: values.autor,
      mensagem: values.mensagem || null,
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
  }

  return values;
}

async function loadFromSupabase() {
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
    setSyncStatus("Supabase EIXO online", true);
    renderAll();
  } catch (error) {
    console.error("Erro ao carregar Supabase:", error);
    setSyncStatus("Supabase pendente", false);
    renderAll();
  }
}

async function uploadChatFile(file) {
  if (!supabaseClient || !file || !file.name) return null;

  const bucket = window.HUB_SUPABASE.chatFilesBucket || "hub-chat-files";
  const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "-");
  const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data: publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return publicUrl.publicUrl;
}

async function addItem(collection, values) {
  if (!supabaseClient) {
    data[collection].unshift({
      id: crypto.randomUUID(),
      createdAt: todayLabel(),
      ...values,
    });
    saveLocalData();
    renderAll();
    return;
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
  } catch (error) {
    console.error("Erro ao salvar no Supabase:", error);
    setSyncStatus("Erro no Supabase", false);
    alert("Nao foi possivel salvar no Supabase. Confira se as tabelas hub_* existem no projeto EIXO.");
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

  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status !== "Fechada").length;
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

  const priorityItems = [
    ...data.denuncias.map((item) => ({
      title: `Denuncia: ${item.categoria}`,
      text: item.descricao,
      tag: item.status,
    })),
    ...data.comunicados
      .filter((item) => item.arquivo)
      .map((item) => ({ title: `Arquivo: ${item.arquivo.name}`, text: item.mensagem || "Anexo compartilhado no chat", tag: "RH" })),
  ].slice(0, 4);

  const recentItems = [
    ...data.malotes.map((item) => ({ title: `Malote para ${item.destino}`, text: item.epis, tag: item.status })),
    ...data.vagas.map((item) => ({ title: item.cargo, text: item.projeto, tag: item.status })),
  ].slice(0, 4);

  if (document.getElementById("priority-list")) {
    document.getElementById("priority-list").innerHTML = priorityItems
      .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p></li>`)
      .join("");
  }

  if (document.getElementById("recent-list")) {
    document.getElementById("recent-list").innerHTML = recentItems
      .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p></li>`)
      .join("");
  }
}

function renderAll() {
  renderDashboard();

  renderCards("denuncias-list", data.denuncias, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">Denuncia anonima</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p>${escapeHtml(item.descricao)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);

  renderChat();

  renderCards("malotes-list", data.malotes, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.destino)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p>${escapeHtml(item.epis)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);

  renderCards("vagas-list", data.vagas, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.cargo)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p>${escapeHtml(item.projeto)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);
}

function renderChat() {
  const target = document.getElementById("chat-feed");
  if (!target) return;

  if (!data.comunicados.length) {
    target.innerHTML = '<p class="empty-state">Nenhuma mensagem no chat ainda.</p>';
    return;
  }

  target.innerHTML = data.comunicados
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

const denunciaForm = document.getElementById("denuncia-form");
if (denunciaForm) {
  denunciaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("mensagem") || form.get("descricao") || "").trim();
    if (!message) return;

    await addItem("denuncias", {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: message,
      status: "Aberta",
    });

    event.currentTarget.reset();
    const feedback = document.getElementById("denuncia-feedback");
    if (feedback) {
      feedback.textContent = "Denuncia enviada com sucesso. Obrigado pelo relato.";
    }
  });
}

const chatFile = document.getElementById("chat-file");
if (chatFile) {
  chatFile.addEventListener("change", (event) => {
    const file = event.currentTarget.files[0];
    document.getElementById("selected-file").textContent = file ? `${file.name} - ${formatFileSize(file.size)}` : "Nenhum arquivo selecionado";
  });
}

const chatForm = document.getElementById("chat-form");
if (chatForm) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("arquivo");
    const message = String(form.get("mensagem") || "").trim();

    if (!message && (!file || !file.name)) return;

    try {
      const fileUrl = file && file.name ? await uploadChatFile(file) : null;
      await addItem("comunicados", {
        autor: "Voce",
        mensagem: message,
        arquivo: file && file.name ? { name: file.name, size: file.size, type: file.type, url: fileUrl } : null,
      });
      event.currentTarget.reset();
      document.getElementById("selected-file").textContent = "Nenhum arquivo selecionado";
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      setSyncStatus("Erro no anexo", false);
      alert("Nao foi possivel enviar o arquivo. Confira o bucket hub-chat-files no Supabase.");
    }
  });
}

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  maloteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await addItem("malotes", {
      destino: form.get("destino"),
      epis: form.get("epis"),
      status: form.get("status"),
    });
    event.currentTarget.reset();
  });
}

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await addItem("vagas", {
      cargo: form.get("cargo"),
      projeto: form.get("projeto"),
      status: form.get("status"),
    });
    event.currentTarget.reset();
  });
}

function initializeAppData() {
  supabaseClient = getSupabaseClient();
  loadFromSupabase();
}

if (setupLogin()) {
  initializeAppData();
}
