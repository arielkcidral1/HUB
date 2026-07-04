<<<<<<< HEAD
/* Filtros da aba Vagas e Projetos - arquivo separado para nao quebrar o script principal */
(function () {
  let renderOriginal = null;
  let wrapperAtivo = false;

  function html(value) {
=======
﻿(function () {
  const SUPABASE_URL = "https://nblfwesptlpetbwfmdqf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_zHawhaceNuAtRyTn3MRbmw_g_LFUGov";

  let client = null;
  let vagas = [];
  let candidaturas = [];
  let internalRender = false;
  let observerReady = false;

  function escapeHtml(value) {
>>>>>>> b3751af (feat: adicionar filtros e formatação em vagas e projetos)
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

<<<<<<< HEAD
  function maskCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function getHubData() {
    try {
      return data || {};
    } catch (error) {
      return {};
    }
  }

  function getCandidaturas(vagaId) {
    const hubData = getHubData();
    return (hubData.candidaturas || []).filter((item) => String(item.vaga_id) === String(vagaId));
  }

  function getFiltros() {
    return {
      unidade: document.getElementById("vaga-filter-unidade")?.value || "",
      nome: normalize(document.getElementById("vaga-filter-candidato")?.value || ""),
      cpf: onlyDigits(document.getElementById("vaga-filter-cpf")?.value || ""),
    };
  }

  function criarFiltros() {
    const lista = document.getElementById("vagas-list");
    const painel = lista?.closest(".panel");
    if (!lista || !painel || document.getElementById("vagas-admin-filters")) return;

    const filtros = document.createElement("div");
    filtros.id = "vagas-admin-filters";
    filtros.className = "vagas-admin-filters";
    filtros.innerHTML = `
      <div class="vagas-admin-filter-grid">
        <label>Filtrar por unidade
          <select id="vaga-filter-unidade"><option value="">Todas as unidades</option></select>
        </label>
        <label>Nome do candidato
          <input id="vaga-filter-candidato" type="search" placeholder="Digite o nome do candidato" autocomplete="off" />
        </label>
        <label>CPF do candidato
          <input id="vaga-filter-cpf" type="search" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" autocomplete="off" />
        </label>
        <button class="secondary-link compact-filter-button" id="limpar-filtros-vagas" type="button">Limpar</button>
      </div>
      <p class="vagas-admin-filter-summary" id="vagas-filter-summary">Todas as vagas cadastradas.</p>
    `;
    painel.insertBefore(filtros, lista);

    document.getElementById("vaga-filter-unidade")?.addEventListener("change", renderVagasComFiltro);
    document.getElementById("vaga-filter-candidato")?.addEventListener("input", renderVagasComFiltro);
    document.getElementById("vaga-filter-cpf")?.addEventListener("input", (event) => {
      event.currentTarget.value = maskCpf(event.currentTarget.value);
      renderVagasComFiltro();
    });
    document.getElementById("limpar-filtros-vagas")?.addEventListener("click", () => {
      ["vaga-filter-unidade", "vaga-filter-candidato", "vaga-filter-cpf"].forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
      });
      renderVagasComFiltro();
    });
  }

  function atualizarUnidades() {
    const select = document.getElementById("vaga-filter-unidade");
    if (!select) return;

    const valorAtual = select.value;
    const hubData = getHubData();
    const unidades = [...new Set((hubData.vagas || []).map((vaga) => vaga.unidade).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));

    select.innerHTML = '<option value="">Todas as unidades</option>' + unidades
      .map((unidade) => `<option value="${html(unidade)}">${html(unidade)}</option>`)
      .join("");

    if (valorAtual && unidades.includes(valorAtual)) select.value = valorAtual;
  }

  function vagasFiltradas() {
    const hubData = getHubData();
    const filtros = getFiltros();

    return (hubData.vagas || []).filter((vaga) => {
      if (filtros.unidade && String(vaga.unidade || "") !== filtros.unidade) return false;

      const candidatos = getCandidaturas(vaga.id);
      if (filtros.nome && !candidatos.some((c) => normalize(c.nome).includes(filtros.nome))) return false;
      if (filtros.cpf && !candidatos.some((c) => onlyDigits(c.cpf).includes(filtros.cpf))) return false;
=======
  function getClient() {
    if (client) return client;
    if (!window.supabase?.createClient) return null;

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    return client;
  }

  function getCandidatesByVagaId(vagaId) {
    return candidaturas.filter((item) => String(item.vaga_id) === String(vagaId));
  }

  function ensureFilters() {
    const list = document.getElementById("vagas-list");
    if (!list) return;

    const panel = list.closest(".panel");
    if (!panel || document.getElementById("admin-vaga-filters")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "admin-vaga-filters";
    wrapper.className = "admin-vaga-filter-panel";
    wrapper.innerHTML = `
      <div class="admin-vaga-filter-grid">
        <label>Filtrar por unidade
          <select id="admin-vaga-filter-unidade">
            <option value="">Todas as unidades</option>
          </select>
        </label>

        <label>Nome do candidato
          <input id="admin-vaga-filter-nome" type="search" placeholder="Digite o nome" autocomplete="off" />
        </label>

        <label>CPF do candidato
          <input id="admin-vaga-filter-cpf" type="search" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" autocomplete="off" />
        </label>

        <button class="secondary-link" id="admin-vaga-filter-clear" type="button">Limpar</button>
      </div>

      <p class="admin-vaga-filter-summary" id="admin-vaga-filter-summary">Carregando vagas...</p>
    `;

    panel.insertBefore(wrapper, list);

    wrapper.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("input", () => renderAdminVagas());
      field.addEventListener("change", () => renderAdminVagas());
    });

    document.getElementById("admin-vaga-filter-cpf")?.addEventListener("input", (event) => {
      const digits = onlyDigits(event.currentTarget.value).slice(0, 11);
      if (digits.length <= 3) event.currentTarget.value = digits;
      else if (digits.length <= 6) event.currentTarget.value = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      else if (digits.length <= 9) event.currentTarget.value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      else event.currentTarget.value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      renderAdminVagas();
    });

    document.getElementById("admin-vaga-filter-clear")?.addEventListener("click", () => {
      ["admin-vaga-filter-unidade", "admin-vaga-filter-nome", "admin-vaga-filter-cpf"].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
      });
      renderAdminVagas();
    });
  }

  function populateUnitFilter() {
    const select = document.getElementById("admin-vaga-filter-unidade");
    if (!select) return;

    const current = select.value;
    const units = [...new Set(vagas.map((vaga) => vaga.unidade).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));

    select.innerHTML = '<option value="">Todas as unidades</option>' +
      units.map((unit) => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`).join("");

    if (current && units.includes(current)) select.value = current;
  }

  function getFilteredVagas() {
    const unit = document.getElementById("admin-vaga-filter-unidade")?.value || "";
    const name = normalize(document.getElementById("admin-vaga-filter-nome")?.value || "");
    const cpf = onlyDigits(document.getElementById("admin-vaga-filter-cpf")?.value || "");

    return vagas.filter((vaga) => {
      if (unit && String(vaga.unidade || "") !== unit) return false;

      const candidates = getCandidatesByVagaId(vaga.id);

      if (name) {
        const hasName = candidates.some((candidate) => normalize(candidate.nome).includes(name));
        if (!hasName) return false;
      }

      if (cpf) {
        const hasCpf = candidates.some((candidate) => onlyDigits(candidate.cpf).includes(cpf));
        if (!hasCpf) return false;
      }
>>>>>>> b3751af (feat: adicionar filtros e formatação em vagas e projetos)

      return true;
    });
  }

<<<<<<< HEAD
  function renderTexto(titulo, valor, fallback) {
    return `
      <div class="job-text-block">
        <strong>${html(titulo)}</strong>
        <p>${html(valor || fallback)}</p>
      </div>
    `;
  }

  function renderCandidatos(candidatos) {
    if (!candidatos.length) return `<p class="empty-candidates">Nenhum currículo recebido.</p>`;

    return candidatos.map((candidato) => `
      <div class="candidate-row">
        <p>
          <strong>${html(candidato.nome || "Nome não informado")}</strong><br />
          <span class="meta-line">CPF: ${html(maskCpf(candidato.cpf) || "Não informado")}</span><br />
          <span class="meta-line">Telefone: ${html(candidato.telefone || "Não informado")}</span>
        </p>
        ${candidato.curriculo_url ? `<button type="button" class="secondary-link private-file-button" data-private-storage-bucket="hub-curriculos" data-private-storage-path="${html(candidato.curriculo_url)}">Ver Currículo</button>` : ""}
      </div>
    `).join("");
  }

  function renderVagasComFiltro() {
    const lista = document.getElementById("vagas-list");
    if (!lista) return;

    criarFiltros();
    atualizarUnidades();

    const hubData = getHubData();
    const vagas = vagasFiltradas();
    const resumo = document.getElementById("vagas-filter-summary");
    const total = (hubData.vagas || []).length;
    const totalCandidaturas = (hubData.candidaturas || []).length;

    if (resumo) resumo.textContent = `${vagas.length} vaga(s) exibida(s) de ${total} cadastrada(s). Candidaturas no sistema: ${totalCandidaturas}.`;

    lista.classList.add("vagas-admin-grid");

    if (!vagas.length) {
      lista.innerHTML = '<p class="empty-state">Nenhuma vaga encontrada com os filtros aplicados.</p>';
      return;
    }

    lista.innerHTML = vagas.map((vaga) => {
      const candidatos = getCandidaturas(vaga.id);
      const statusAberta = String(vaga.status || "").toLowerCase() === "aberta";

      return `
        <article class="item-card admin-job-card">
          <div class="item-topline">
            <p class="item-title">${html(vaga.cargo || "Cargo não informado")}</p>
            <span class="${statusAberta ? "tag alert" : "tag"}">${html(vaga.status || "Aberta")}</span>
          </div>
          <p><strong>Unidade destinada:</strong> ${html(vaga.unidade || "Não informada")}</p>
          ${renderTexto("Descrição", vaga.descricao, "Descrição não informada.")}
          ${renderTexto("Requisitos", vaga.requisitos, "Requisitos não informados.")}
          <p class="item-meta">${html(vaga.createdAt || "")}${vaga.createdBy ? ` | Registrado por ${html(vaga.createdBy)}` : ""}</p>
          <div class="job-actions">
            <button class="secondary-link" type="button" data-action="editar-vaga" data-id="${html(vaga.id)}">Editar</button>
            <button class="danger-button" type="button" data-action="excluir-vaga" data-id="${html(vaga.id)}">Deletar</button>
          </div>
          <div class="candidate-list">
            <p class="candidate-list-title">Currículos Recebidos (${candidatos.length})</p>
            ${renderCandidatos(candidatos)}
          </div>
        </article>
      `;
    }).join("");
  }

  function ativarWrapperRenderAll() {
    if (wrapperAtivo) return;
    try {
      if (typeof renderAll !== "function") return;
      renderOriginal = renderAll;
      renderAll = function (...args) {
        const retorno = renderOriginal.apply(this, args);
        window.setTimeout(renderVagasComFiltro, 0);
        return retorno;
      };
      wrapperAtivo = true;
    } catch (error) {
      console.warn("Não foi possível ativar filtros de vagas:", error);
    }
  }

  function iniciar() {
    let tentativas = 0;
    const timer = window.setInterval(() => {
      tentativas += 1;
      criarFiltros();
      ativarWrapperRenderAll();
      renderVagasComFiltro();
      if (wrapperAtivo || tentativas >= 20) window.clearInterval(timer);
    }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
=======
  function renderCandidateList(vagaId) {
    const candidates = getCandidatesByVagaId(vagaId);

    if (!candidates.length) {
      return `<p class="item-meta">Nenhum candidato vinculado a esta vaga.</p>`;
    }

    return `
      <details>
        <summary>Candidatos (${candidates.length})</summary>
        <div class="admin-candidate-list">
          ${candidates.map((candidate) => `
            <div class="admin-candidate-chip">
              <strong>${escapeHtml(candidate.nome || "Nome não informado")}</strong>
              <span>CPF: ${escapeHtml(candidate.cpf || "Não informado")}</span>
              ${candidate.telefone ? `<span>Telefone: ${escapeHtml(candidate.telefone)}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </details>
    `;
  }

  function renderAdminVagas() {
    const list = document.getElementById("vagas-list");
    if (!list) return;

    ensureFilters();
    populateUnitFilter();

    const filtered = getFilteredVagas();
    const summary = document.getElementById("admin-vaga-filter-summary");
    if (summary) {
      summary.textContent = `${filtered.length} vaga(s) exibida(s) de ${vagas.length} cadastrada(s).`;
    }

    internalRender = true;
    list.classList.add("admin-vagas-grid");

    if (!filtered.length) {
      list.innerHTML = `<p class="empty-state">Nenhuma vaga encontrada com os filtros aplicados.</p>`;
      internalRender = false;
      return;
    }

    list.innerHTML = filtered.map((vaga) => `
      <article class="item-card admin-job-card" data-admin-vaga-id="${escapeHtml(vaga.id)}">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(vaga.cargo || "Cargo não informado")}</p>
          <span class="${vaga.status === "Aberta" ? "tag alert" : "tag"}">${escapeHtml(vaga.status || "Aberta")}</span>
        </div>

        <p><strong>Unidade destinada:</strong> ${escapeHtml(vaga.unidade || "Não informada")}</p>

        <div class="job-text-block">
          <strong>Descrição</strong>
          <p>${escapeHtml(vaga.descricao || "Descrição não informada.")}</p>
        </div>

        <div class="job-text-block">
          <strong>Requisitos</strong>
          <p>${escapeHtml(vaga.requisitos || "Requisitos não informados.")}</p>
        </div>

        ${renderCandidateList(vaga.id)}

        <div class="job-actions">
          <button class="secondary-link" type="button" data-admin-edit-vaga="${escapeHtml(vaga.id)}">Editar</button>
          <button class="danger-button" type="button" data-admin-delete-vaga="${escapeHtml(vaga.id)}">Excluir</button>
        </div>
      </article>
    `).join("");

    internalRender = false;
  }

  async function loadAdminVagas() {
    const supabase = getClient();
    if (!supabase) return;

    ensureFilters();

    const [{ data: vagasData, error: vagasError }, { data: candData, error: candError }] = await Promise.all([
      supabase.from("hub_vagas").select("*").order("created_at", { ascending: false }),
      supabase.from("hub_candidaturas").select("id, vaga_id, nome, cpf, telefone, created_at").order("created_at", { ascending: false }),
    ]);

    if (vagasError || candError) {
      console.error("Erro ao carregar vagas/candidaturas:", vagasError || candError);
      const summary = document.getElementById("admin-vaga-filter-summary");
      if (summary) summary.textContent = "Não foi possível carregar os filtros de vagas.";
      return;
    }

    vagas = Array.isArray(vagasData) ? vagasData : [];
    candidaturas = Array.isArray(candData) ? candData : [];
    renderAdminVagas();
  }

  function fillEditForm(id) {
    const vaga = vagas.find((item) => String(item.id) === String(id));
    const form = document.getElementById("vaga-form");
    if (!vaga || !form) return;

    form.elements.id.value = vaga.id || "";
    form.elements.cargo.value = vaga.cargo || "";
    form.elements.unidade.value = vaga.unidade || "";
    form.elements.descricao.value = vaga.descricao || "";
    form.elements.requisitos.value = vaga.requisitos || "";
    form.elements.status.value = vaga.status || "Aberta";

    document.getElementById("cancelar-edicao-vaga")?.removeAttribute("hidden");
    form.querySelector('button[type="submit"]').textContent = "Atualizar vaga";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteVaga(id) {
    const vaga = vagas.find((item) => String(item.id) === String(id));
    if (!vaga) return;

    const confirmed = window.confirm(`Deseja excluir a vaga "${vaga.cargo}" da unidade "${vaga.unidade || "sem unidade"}"?`);
    if (!confirmed) return;

    const supabase = getClient();
    const { error } = await supabase.from("hub_vagas").delete().eq("id", id);

    if (error) {
      alert("Não foi possível excluir a vaga. Verifique as permissões no Supabase.");
      console.error(error);
      return;
    }

    await loadAdminVagas();
  }

  function setupEvents() {
    document.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-admin-edit-vaga]");
      if (editButton) {
        fillEditForm(editButton.dataset.adminEditVaga);
        return;
      }

      const deleteButton = event.target.closest("[data-admin-delete-vaga]");
      if (deleteButton) {
        deleteVaga(deleteButton.dataset.adminDeleteVaga);
      }
    });

    document.getElementById("vaga-form")?.addEventListener("submit", () => {
      setTimeout(loadAdminVagas, 1200);
    });

    document.getElementById("cancelar-edicao-vaga")?.addEventListener("click", () => {
      setTimeout(loadAdminVagas, 200);
    });
  }

  function setupObserver() {
    const list = document.getElementById("vagas-list");
    if (!list || observerReady) return;

    const observer = new MutationObserver(() => {
      if (internalRender) return;
      window.clearTimeout(window.__adminVagaFilterTimer);
      window.__adminVagaFilterTimer = window.setTimeout(renderAdminVagas, 100);
    });

    observer.observe(list, { childList: true });
    observerReady = true;
  }

  function init() {
    if (!document.getElementById("vagas")) return;

    ensureFilters();
    setupEvents();
    setupObserver();

    setTimeout(loadAdminVagas, 500);
    setTimeout(loadAdminVagas, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
>>>>>>> b3751af (feat: adicionar filtros e formatação em vagas e projetos)
  }
})();
