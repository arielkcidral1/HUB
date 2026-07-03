/* Filtros da aba Vagas e Projetos - arquivo separado para nao quebrar o script principal */
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

      return true;
    });
  }

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
  }
})();
