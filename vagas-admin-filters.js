/* Filtros da aba Vagas e Projetos */
(function () {
  let renderOriginal = null;
  let wrapperAtivo = false;

  function html(value) {
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

  function maskCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function getHubData() {
    try {
      return window.data || data || {};
    } catch {
      return {};
    }
  }

  function getCandidaturas(vagaId) {
    const hubData = getHubData();
    return (hubData.candidaturas || []).filter((item) => String(item.vaga_id || item.vagaId) === String(vagaId));
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
      return true;
    });
  }

  function renderVagasComFiltro() {
    if (typeof renderOriginal !== "function" || wrapperAtivo) return;
    wrapperAtivo = true;
    try {
      atualizarUnidades();
      const filtradas = vagasFiltradas();
      const hubData = getHubData();
      const originalVagas = hubData.vagas;
      hubData.vagas = filtradas;
      renderOriginal();
      hubData.vagas = originalVagas;

      const resumo = document.getElementById("vagas-filter-summary");
      if (resumo) resumo.textContent = `${filtradas.length} de ${(originalVagas || []).length} vagas exibidas.`;
    } finally {
      wrapperAtivo = false;
    }
  }

  function instalar() {
    if (typeof window.renderVagas === "function" && !renderOriginal) {
      renderOriginal = window.renderVagas;
      window.renderVagas = function () {
        criarFiltros();
        renderVagasComFiltro();
      };
      criarFiltros();
      renderVagasComFiltro();
    }
  }

  document.addEventListener("DOMContentLoaded", instalar);
  window.addEventListener("load", instalar);
})();
