const STORAGE_KEY = "hub-rh-data";

const defaultData = {
  denuncias: [
    {
      id: crypto.randomUUID(),
      identificacao: "Anonimo",
      categoria: "Conduta inadequada",
      descricao: "Relato recebido para avaliacao inicial do RH.",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  comunicados: [
    {
      id: crypto.randomUUID(),
      titulo: "Alinhamento semanal",
      prioridade: "Normal",
      mensagem: "Revisar pendencias de beneficios, vagas e entregas de EPI.",
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

let data = loadData();

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData;

  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
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
  const metricDenuncias = document.getElementById("metric-denuncias");
  if (!metricDenuncias) return;

  metricDenuncias.textContent = data.denuncias.filter((item) => item.status !== "Fechada").length;
  document.getElementById("metric-comunicados").textContent = data.comunicados.length;
  document.getElementById("metric-malotes").textContent = data.malotes.filter((item) => item.status === "Em transito").length;
  document.getElementById("metric-vagas").textContent = data.vagas.filter((item) => item.status !== "Fechada").length;

  const priorityItems = [
    ...data.denuncias.map((item) => ({
      title: `Denuncia: ${item.categoria}`,
      text: item.descricao,
      tag: item.status,
    })),
    ...data.comunicados
      .filter((item) => item.prioridade !== "Normal")
      .map((item) => ({ title: item.titulo, text: item.mensagem, tag: item.prioridade })),
  ].slice(0, 4);

  const recentItems = [
    ...data.malotes.map((item) => ({ title: `Malote para ${item.destino}`, text: item.epis, tag: item.status })),
    ...data.vagas.map((item) => ({ title: item.cargo, text: item.projeto, tag: item.status })),
  ].slice(0, 4);

  document.getElementById("priority-list").innerHTML = priorityItems
    .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p></li>`)
    .join("");

  document.getElementById("recent-list").innerHTML = recentItems
    .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p></li>`)
    .join("");
}

function renderAll() {
  renderDashboard();

  renderCards("denuncias-list", data.denuncias, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.categoria)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p>${escapeHtml(item.descricao)}</p>
      <p class="item-meta">${escapeHtml(item.identificacao)} | ${escapeHtml(item.createdAt)}</p>
    </article>
  `);

  renderCards("comunicados-list", data.comunicados, (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.titulo)}</p><span class="${badgeClass(item.prioridade)}">${escapeHtml(item.prioridade)}</span></div>
      <p>${escapeHtml(item.mensagem)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);

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

function addItem(collection, values) {
  data[collection].unshift({
    id: crypto.randomUUID(),
    createdAt: todayLabel(),
    ...values,
  });
  saveData();
  renderAll();
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
  denunciaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addItem("denuncias", {
      identificacao: "Anônimo",
      categoria: "Denúncia",
      descricao: form.get("descricao"),
      status: "Aberta",
    });
    event.currentTarget.reset();
    alert("Sua denúncia foi registrada com sucesso e de forma segura!");
  });
}

const comunicadoForm = document.getElementById("comunicado-form");
if (comunicadoForm) {
  comunicadoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addItem("comunicados", {
      titulo: form.get("titulo"),
      prioridade: form.get("prioridade"),
      mensagem: form.get("mensagem"),
    });
    event.currentTarget.reset();
  });
}

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  maloteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addItem("malotes", {
      destino: form.get("destino"),
      epis: form.get("epis"),
      status: form.get("status"),
    });
    event.currentTarget.reset();
  });
}

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addItem("vagas", {
      cargo: form.get("cargo"),
      projeto: form.get("projeto"),
      status: form.get("status"),
    });
    event.currentTarget.reset();
  });
}

renderAll();
