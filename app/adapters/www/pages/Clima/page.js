// Pagina: pesquisa de clima organizacional (formulario publico + dashboard e listagem administrativa).
// ponytail: carrega DEPOIS de script.js (ao contrario dos demais modulos) porque decora renderAll,
// que so existe depois que script.js executa.

(function setupClimaModule() {
  const CLIMA_OPTIONS = {
    binario: ["Sim", "Não"],
    ternario: ["Sim", "Não", "Às vezes"],
    verdadeiro_falso: ["Verdadeiro", "Falso"],
    escala5: ["Ótimo", "Bom", "Razoável", "Ruim", "Péssimo"],
    escolha: ["Conversa nos corredores", "Quadros de aviso", "Colegas de trabalho", "Superior imediato", "Através do RH"],
  };

  const CLIMA_SECTIONS = [
    { titulo: "Liderança e Gestão de Pessoas", perguntas: [
      { texto: "As orientações que você recebe sobre o seu trabalho são claras e objetivas?", tipo: "binario" },
      { texto: "Seu superior imediato é receptivo às sugestões de mudança?", tipo: "ternario" },
      { texto: "Você tem uma ideia clara sobre o resultado que o seu superior imediato espera do seu trabalho?", tipo: "binario" },
      { texto: "Você recebe do setor operacional as informações necessárias para a realização do seu trabalho?", tipo: "ternario" },
      { texto: "Você é informado pelo seu superior imediato sobre o que ele acha do seu trabalho?", tipo: "binario" },
      { texto: "Os gestores da empresa têm interesse no bem-estar dos funcionários?", tipo: "binario" },
      { texto: "Você considera que seu trabalho é avaliado de forma justa pelo seu superior?", tipo: "binario" },
      { texto: "Você se considera respeitado pelo seu superior imediato?", tipo: "binario" },
      { texto: "Seu superior transmite a você e aos seus colegas as informações que vocês precisam conhecer?", tipo: "binario" },
      { texto: "Você considera seu superior hierárquico um bom líder?", tipo: "binario" },
      { texto: "Você considera o seu superior hierárquico bom profissionalmente?", tipo: "binario" },
      { texto: "Avalie os seguintes setores:", tipo: "escala5", subitens: ["RH", "Regulação", "Direção", "Financeiro"] },
      { texto: "Você se sente à vontade para falar abertamente a respeito de trabalho com o seu superior imediato?", tipo: "binario" },
      { texto: "O seu superior imediato reconhece os bons resultados alcançados por você no seu trabalho?", tipo: "binario" },
      { texto: "Você acha que os seus superiores são receptivos às críticas dos seus subordinados?", tipo: "ternario" },
      { texto: "As decisões tomadas pelo seu chefe no dia-a-dia são corretas?", tipo: "ternario" },
      { texto: "Seu chefe está sempre disponível quando você precisa dele?", tipo: "binario" },
      { texto: "No seu setor de trabalho há algum funcionário \"protegido\" pelo seu chefe?", tipo: "binario" },
    ]},
    { titulo: "Treinamento e Desenvolvimento", perguntas: [
      { texto: "A empresa oferece oportunidades para o seu desenvolvimento e crescimento profissional?", tipo: "binario" },
      { texto: "Você considera suficiente o treinamento dado pela empresa?", tipo: "binario" },
      { texto: "A empresa dá condições de treinamento/desenvolvimento para que você tenha um aprendizado contínuo?", tipo: "binario" },
    ]},
    { titulo: "Comunicação", perguntas: [
      { texto: "A empresa explica adequadamente aos funcionários o motivo das decisões que ela toma?", tipo: "ternario" },
      { texto: "Os funcionários se sentem adequadamente informados sobre as decisões que afetam o trabalho deles?", tipo: "binario" },
      { texto: "Você se sente informado a respeito dos reajustes/aumentos salariais praticados pela empresa?", tipo: "binario" },
      { texto: "Onde você encontra as informações que deseja saber sobre a empresa? Assinale a principal alternativa:", tipo: "escolha" },
      { texto: "Você se sente bem informado sobre os benefícios da empresa?", tipo: "binario" },
      { texto: "Você se considera bem informado sobre o que se passa na empresa?", tipo: "binario" },
      { texto: "A comunicação entre colaboradores de diferentes setores flui adequadamente?", tipo: "binario" },
      { texto: "As informações que recebo da empresa são confiáveis, a comunicação é transparente?", tipo: "binario" },
    ]},
    { titulo: "Relações Interpessoais", perguntas: [
      { texto: "Existe um relacionamento de cooperação entre os diversos departamentos da empresa?", tipo: "binario" },
      { texto: "O trabalho em equipe é presente na empresa?", tipo: "binario" },
      { texto: "O clima de trabalho da minha equipe é bom?", tipo: "binario" },
      { texto: "No meu setor existe elevado grau de abertura e confiança mútua entre o superior imediato e demais membros da equipe?", tipo: "binario" },
      { texto: "Existe respeito, cooperação e ajuda mútua entre os colegas do meu setor, somos um grupo integrado?", tipo: "binario" },
      { texto: "O relacionamento entre as pessoas da minha equipe é autêntico?", tipo: "binario" },
      { texto: "Acredito que há um relacionamento profissional adequado entre pessoas de diferentes setores.", tipo: "verdadeiro_falso" },
    ]},
    { titulo: "Ética e Cidadania", perguntas: [
      { texto: "A atuação da empresa é guiada por valores éticos?", tipo: "binario" },
      { texto: "Você acha que a empresa age eticamente nas suas decisões?", tipo: "binario" },
      { texto: "Você considera a empresa socialmente responsável?", tipo: "binario" },
      { texto: "A empresa cumpre as promessas oficialmente feitas aos funcionários?", tipo: "ternario" },
      { texto: "A empresa pratica ações éticas com os trabalhadores?", tipo: "binario" },
    ]},
    { titulo: "Sistemas de Remuneração", perguntas: [
      { texto: "O seu salário satisfaz as suas necessidades básicas de vida?", tipo: "binario" },
      { texto: "Você se sente satisfeito em relação ao seu salário?", tipo: "binario" },
    ]},
    { titulo: "Condições de Trabalho", perguntas: [
      { texto: "Você se sente satisfeito em relação ao volume de trabalho que realiza?", tipo: "binario" },
      { texto: "As condições do seu local de trabalho são satisfatórias?", tipo: "binario", subitens: ["Temperatura", "Espaço interno das ambulâncias", "Equipamentos", "Higiene", "Instalações Sanitárias"] },
      { texto: "Você se sente satisfeito em relação ao volume de trabalho que realiza?", tipo: "binario" },
    ]},
    { titulo: "Qualidade e Produtividade", perguntas: [
      { texto: "O compromisso da empresa com a qualidade dos seus produtos, serviços e processos está visível no trabalho diário?", tipo: "binario" },
      { texto: "A qualidade do trabalho é considerada mais importante do que a sua quantidade?", tipo: "binario" },
      { texto: "A empresa costuma melhorar os produtos e serviços prestados aos seus clientes?", tipo: "binario" },
      { texto: "Seus colegas de setor de trabalho procuram formas de melhorar a qualidade e produtividade do trabalho?", tipo: "binario" },
      { texto: "Conheço bem a Política de Qualidade da empresa e compreendo bem seus conceitos e objetivos?", tipo: "binario" },
      { texto: "Considero que os serviços gerados pelo meu setor apresentam a qualidade esperada pelos nossos clientes?", tipo: "binario" },
    ]},
    { titulo: "Imagem e Adesão", perguntas: [
      { texto: "Você indicaria um amigo para trabalhar na sua empresa?", tipo: "binario" },
      { texto: "A empresa desfruta de boa imagem entre os funcionários?", tipo: "binario" },
      { texto: "Considera a empresa um bom lugar para trabalhar?", tipo: "binario" },
      { texto: "O seu trabalho lhe dá um sentimento de realização profissional?", tipo: "binario" },
      { texto: "Você considera justas as decisões tomadas pela diretoria em relação aos funcionários da empresa?", tipo: "binario" },
      { texto: "Você está satisfeito por trabalhar na empresa?", tipo: "binario" },
      { texto: "Você gosta do trabalho que faz?", tipo: "binario" },
      { texto: "Você acha que os funcionários se orgulham do desempenho da empresa?", tipo: "binario" },
      { texto: "Você se sente satisfeito trabalhando nessa empresa?", tipo: "binario" },
    ]},
  ];

  function buildClimaQuestionIndex() {
    const flat = [];
    let counter = 0;
    CLIMA_SECTIONS.forEach((secao) => {
      secao.perguntas.forEach((pergunta) => {
        const opcoes = CLIMA_OPTIONS[pergunta.tipo] || [];
        if (Array.isArray(pergunta.subitens) && pergunta.subitens.length) {
          pergunta.subitens.forEach((subitem) => {
            counter += 1;
            flat.push({
              id: `q${counter}`,
              secao: secao.titulo,
              texto: `${pergunta.texto} — ${subitem}`,
              tipo: pergunta.tipo,
              opcoes,
            });
          });
        } else {
          counter += 1;
          flat.push({ id: `q${counter}`, secao: secao.titulo, texto: pergunta.texto, tipo: pergunta.tipo, opcoes });
        }
      });
    });
    return flat;
  }

  const CLIMA_QUESTIONS = buildClimaQuestionIndex();
  window.CLIMA_QUESTIONS = CLIMA_QUESTIONS;

  function buildClimaFormFieldsHtml() {
    let currentSection = "";
    return CLIMA_QUESTIONS.map((question) => {
      const sectionHeader = question.secao !== currentSection
        ? (() => { currentSection = question.secao; return `<h2 class="clima-section-title">${escapeHtml(question.secao)}</h2>`; })()
        : "";
      const optionsHtml = question.opcoes.map((option, index) => `
        <label class="clima-option">
          <input type="radio" name="${question.id}" value="${escapeHtml(option)}" ${index === 0 ? "required" : ""} />
          <span>${escapeHtml(option)}</span>
        </label>
      `).join("");
      return `
        ${sectionHeader}
        <div class="clima-question" role="group" aria-label="${escapeHtml(question.texto)}">
          <p class="clima-question-title">${escapeHtml(question.texto)}</p>
          <div class="clima-options">${optionsHtml}</div>
        </div>
      `;
    }).join("");
  }
  window.buildClimaFormFieldsHtml = buildClimaFormFieldsHtml;

  function enableClimaRadioToggle(container) {
    container.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("click", function handleClimaRadioClick() {
        if (this.dataset.wasChecked === "true") {
          this.checked = false;
          this.dataset.wasChecked = "false";
        } else {
          container.querySelectorAll(`input[name="${this.name}"]`).forEach((sibling) => {
            sibling.dataset.wasChecked = "false";
          });
          this.dataset.wasChecked = "true";
        }
      });
    });
  }

  function getClimaAnswerRows(item) {
    const respostas = item?.respostas || {};
    return CLIMA_QUESTIONS.map((question) => ({
      secao: question.secao,
      texto: question.texto,
      resposta: respostas[question.id] || "Não respondido",
    }));
  }

  async function submitClimaPesquisa({ respostas, sugestao }) {
    if (!postgresClient) throw new Error("PostgreSQL indisponível. Verifique a configuração pública do HUB.");
    const { error } = await postgresClient.from(TABLES.climaPesquisas).insert({ respostas, sugestao: sugestao || "" });
    if (error) throw error;
  }

  function setupPublicClimaForm() {
    const container = document.getElementById("clima-form-fields");
    const form = document.getElementById("clima-form");
    if (!form || !container || form.dataset.climaReady === "true") return;
    form.dataset.climaReady = "true";
    ensurePublicCaptchaNotice?.(form);
    container.innerHTML = buildClimaFormFieldsHtml();
    enableClimaRadioToggle(container);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const publicFormError = validatePublicFormSubmission?.(formElement);
      if (publicFormError) {
        showModal?.("Envio bloqueado", publicFormError, "error");
        return;
      }

      const formData = new FormData(formElement);
      const respostas = {};
      let missing = false;
      CLIMA_QUESTIONS.forEach((question) => {
        const value = String(formData.get(question.id) || "").trim();
        if (!value) missing = true;
        respostas[question.id] = value;
      });
      if (missing) {
        showModal?.("Perguntas pendentes", "Responda todas as perguntas antes de enviar a pesquisa.", "error");
        return;
      }
      const sugestao = String(formData.get("sugestao") || "").trim();

      const submitButton = formElement.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || "Enviar pesquisa";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      try {
        await submitClimaPesquisa({ respostas, sugestao });
        formElement.reset();
        showModal?.("Pesquisa enviada", "Obrigado por participar da Pesquisa de Clima Organizacional! Sua resposta é anônima.", "success");
      } catch (error) {
        console.error("Erro ao enviar pesquisa de clima:", error);
        showModal?.("Erro no envio", error.message || "Não foi possível enviar a pesquisa. Verifique sua conexão e tente novamente.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  const CLIMA_SCORE_MAP = {
    "Sim": 1, "Não": 0, "Às vezes": 0.5,
    "Verdadeiro": 1, "Falso": 0,
    "Ótimo": 1, "Bom": 0.75, "Razoável": 0.5, "Ruim": 0.25, "Péssimo": 0,
  };

  function climaScoreBand(score) {
    if (score >= 70) return "good";
    if (score >= 40) return "warning";
    return "critical";
  }

  function climaScoreColorVar(band) {
    return { good: "var(--success)", warning: "var(--gold)", critical: "var(--danger)" }[band] || "var(--muted)";
  }

  function climaScoreStatusText(band) {
    return {
      good: "Clima favorável",
      warning: "Clima neutro — atenção recomendada",
      critical: "Clima desfavorável — requer atenção",
    }[band] || "";
  }

  function renderClimaBarRow(label, percent, { neutral = false } = {}) {
    const band = neutral ? "neutral" : climaScoreBand(percent);
    return `
      <div class="clima-bar-row">
        <p class="clima-bar-row-label">${escapeHtml(label)}</p>
        <div class="clima-bar-track"><div class="clima-bar-fill clima-bar-${band}" style="width:${Math.max(percent, 2)}%"></div></div>
        <span class="clima-bar-value">${percent}%</span>
      </div>
    `;
  }

  function computeClimaDashboardData(items) {
    const sectionTotals = new Map();
    const questionTotals = new Map();
    const canalCounts = new Map();
    let overallSum = 0;
    let overallCount = 0;
    let canalTotal = 0;

    items.forEach((item) => {
      const respostas = item.respostas || {};
      CLIMA_QUESTIONS.forEach((question) => {
        const answer = respostas[question.id];
        if (!answer) return;

        if (question.tipo === "escolha") {
          canalCounts.set(answer, (canalCounts.get(answer) || 0) + 1);
          canalTotal += 1;
          return;
        }

        const score = CLIMA_SCORE_MAP[answer];
        if (score === undefined) return;

        overallSum += score;
        overallCount += 1;

        const sectionEntry = sectionTotals.get(question.secao) || { sum: 0, count: 0 };
        sectionEntry.sum += score;
        sectionEntry.count += 1;
        sectionTotals.set(question.secao, sectionEntry);

        const questionEntry = questionTotals.get(question.id) || { texto: question.texto, sum: 0, count: 0 };
        questionEntry.sum += score;
        questionEntry.count += 1;
        questionTotals.set(question.id, questionEntry);
      });
    });

    const toPercent = (sum, count) => (count ? Math.round((sum / count) * 100) : 0);

    const sections = Array.from(sectionTotals.entries())
      .map(([secao, { sum, count }]) => ({ secao, score: toPercent(sum, count) }))
      .sort((a, b) => b.score - a.score);

    const questions = Array.from(questionTotals.values())
      .filter((q) => q.count > 0)
      .map((q) => ({ texto: q.texto, score: toPercent(q.sum, q.count) }));
    const sortedQuestions = questions.slice().sort((a, b) => b.score - a.score);

    const canal = Array.from(canalCounts.entries())
      .map(([label, count]) => ({ label, percent: canalTotal ? Math.round((count / canalTotal) * 100) : 0 }))
      .sort((a, b) => b.percent - a.percent);

    return {
      respondents: items.length,
      overallScore: toPercent(overallSum, overallCount),
      sections,
      top: sortedQuestions.slice(0, 5),
      bottom: sortedQuestions.slice(-5).reverse(),
      canal,
    };
  }

  function computeClimaAnswerDistribution(items) {
    let favoravel = 0;
    let neutro = 0;
    let desfavoravel = 0;

    items.forEach((item) => {
      const respostas = item.respostas || {};
      CLIMA_QUESTIONS.forEach((question) => {
        if (question.tipo === "escolha") return;
        const answer = respostas[question.id];
        if (!answer) return;
        const score = CLIMA_SCORE_MAP[answer];
        if (score === undefined) return;
        if (score >= 0.75) favoravel += 1;
        else if (score === 0.5) neutro += 1;
        else desfavoravel += 1;
      });
    });

    return { favoravel, neutro, desfavoravel, total: favoravel + neutro + desfavoravel };
  }

  function formatClimaDayLabel(day) {
    const parts = String(day || "").split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : day;
  }

  function computeClimaTimeline(items) {
    const counts = new Map();
    items.forEach((item) => {
      const day = String(item.sortAt || "").slice(0, 10);
      if (!day) return;
      counts.set(day, (counts.get(day) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }));
  }

  function renderClimaDonut(items) {
    const donut = document.getElementById("clima-donut");
    const totalEl = document.getElementById("clima-donut-total");
    const legendEl = document.getElementById("clima-donut-legend");
    if (!donut || !legendEl) return;

    const dist = computeClimaAnswerDistribution(items);
    if (totalEl) totalEl.textContent = String(dist.total);

    if (!dist.total) {
      donut.style.background = "var(--surface-soft)";
      legendEl.innerHTML = '<p class="empty-state">Sem dados suficientes.</p>';
      return;
    }

    const favPct = (dist.favoravel / dist.total) * 100;
    const neuPct = (dist.neutro / dist.total) * 100;
    const favEnd = favPct;
    const neuEnd = favPct + neuPct;
    donut.style.background = `conic-gradient(var(--success) 0% ${favEnd}%, var(--gold) ${favEnd}% ${neuEnd}%, var(--danger) ${neuEnd}% 100%)`;

    const rows = [
      { label: "Favorável", value: dist.favoravel, percent: Math.round(favPct), colorClass: "clima-dot-good" },
      { label: "Neutro", value: dist.neutro, percent: Math.round(neuPct), colorClass: "clima-dot-warning" },
      { label: "Desfavorável", value: dist.desfavoravel, percent: Math.round((dist.desfavoravel / dist.total) * 100), colorClass: "clima-dot-critical" },
    ];
    legendEl.innerHTML = rows.map((row) => `
      <div class="clima-donut-legend-row">
        <span><i class="clima-dot ${row.colorClass}"></i> ${escapeHtml(row.label)}</span>
        <strong>${row.percent}% <span class="item-meta">(${row.value})</span></strong>
      </div>
    `).join("");
  }

  function renderClimaTimeline(items) {
    const target = document.getElementById("clima-timeline-chart");
    if (!target) return;

    const timeline = computeClimaTimeline(items);
    if (!timeline.length) {
      target.innerHTML = '<p class="empty-state">Sem dados suficientes.</p>';
      return;
    }

    const max = Math.max(...timeline.map((entry) => entry.count));
    target.innerHTML = `
      <div class="clima-timeline-bars">
        ${timeline.map((entry) => `
          <div class="clima-timeline-col" title="${escapeHtml(formatClimaDayLabel(entry.day))}: ${entry.count}">
            <span class="clima-timeline-count">${entry.count}</span>
            <div class="clima-timeline-bar" style="height:${Math.max((entry.count / max) * 100, 8)}%"></div>
            <span class="clima-timeline-label">${escapeHtml(formatClimaDayLabel(entry.day))}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderClimaDashboard(items) {
    const dashboard = document.getElementById("clima-dashboard");
    const emptyState = document.getElementById("clima-dashboard-empty");
    if (!dashboard || !emptyState) return;

    if (!items.length) {
      dashboard.hidden = true;
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    dashboard.hidden = false;

    const summary = computeClimaDashboardData(items);
    const band = climaScoreBand(summary.overallScore);

    const scoreValueEl = document.getElementById("clima-score-value");
    if (scoreValueEl) {
      scoreValueEl.textContent = `${summary.overallScore}%`;
      scoreValueEl.style.color = climaScoreColorVar(band);
    }
    const scoreLabelEl = document.getElementById("clima-score-label");
    if (scoreLabelEl) scoreLabelEl.textContent = climaScoreStatusText(band);
    const scoreSummaryEl = document.getElementById("clima-score-summary");
    if (scoreSummaryEl) {
      scoreSummaryEl.textContent = `Baseado em ${summary.respondents} ${summary.respondents === 1 ? "resposta anônima" : "respostas anônimas"}.`;
    }

    renderClimaDonut(items);
    renderClimaTimeline(items);

    const emptyBars = '<p class="empty-state">Sem dados suficientes.</p>';

    const sectionsChart = document.getElementById("clima-sections-chart");
    if (sectionsChart) {
      sectionsChart.innerHTML = summary.sections.map((s) => renderClimaBarRow(s.secao, s.score)).join("") || emptyBars;
    }

    const topEl = document.getElementById("clima-top-questions");
    if (topEl) {
      topEl.innerHTML = summary.top.map((q) => renderClimaBarRow(q.texto, q.score)).join("") || emptyBars;
    }

    const bottomEl = document.getElementById("clima-bottom-questions");
    if (bottomEl) {
      bottomEl.innerHTML = summary.bottom.map((q) => renderClimaBarRow(q.texto, q.score)).join("") || emptyBars;
    }

    const canalEl = document.getElementById("clima-canal-chart");
    if (canalEl) {
      canalEl.innerHTML = summary.canal.length
        ? summary.canal.map((c) => renderClimaBarRow(c.label, c.percent, { neutral: true })).join("")
        : emptyBars;
    }

    const sugestoesList = document.getElementById("clima-sugestoes-list");
    if (sugestoesList) {
      const sugestoes = items
        .filter((item) => item.sugestao)
        .slice()
        .sort((a, b) => String(b.sortAt || "").localeCompare(String(a.sortAt || "")));
      sugestoesList.innerHTML = sugestoes.length
        ? sugestoes.map((item) => `
          <article class="item-card">
            <p>${escapeHtml(item.sugestao)}</p>
            <p class="item-meta">${escapeHtml(item.createdAt || "")}</p>
          </article>
        `).join("")
        : '<p class="empty-state">Nenhuma sugestão enviada ainda.</p>';
    }
  }

  function renderClimaConfigControls() {
    const button = document.getElementById("clima-toggle-button");
    const statusTag = document.getElementById("clima-status-tag");
    if (!button && !statusTag) return;
    const aberto = Boolean((data.climaConfig || [])[0]?.aberto);
    if (button) button.textContent = aberto ? "Encerrar teste" : "Liberar teste";
    if (statusTag) {
      statusTag.textContent = aberto ? "Teste liberado" : "Teste encerrado";
      statusTag.classList.toggle("alert", !aberto);
    }
  }

  async function toggleClimaAberto() {
    const current = (data.climaConfig || [])[0];
    const nextAberto = !current?.aberto;
    const timestamp = new Date().toISOString();
    const values = {
      aberto: nextAberto,
      abertoEm: nextAberto ? timestamp : (current?.abertoEm || ""),
      encerradoEm: !nextAberto ? timestamp : "",
    };
    const success = current?.id
      ? await updateItem("climaConfig", current.id, values)
      : await addItem("climaConfig", values);
    if (success) {
      showModal(
        nextAberto ? "Teste liberado" : "Teste encerrado",
        nextAberto
          ? "O formulário público de clima está liberado para respostas."
          : "O formulário público de clima foi encerrado. Quem acessar o link verá o aviso de teste encerrado.",
        "info",
      );
    }
  }

  document.getElementById("clima-toggle-button")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await toggleClimaAberto();
    } finally {
      button.disabled = false;
    }
  });

  function renderClimaSection() {
    const listTarget = document.getElementById("clima-pesquisas-list");
    renderClimaConfigControls();
    if (!listTarget) return;
    const items = (data.climaPesquisas || []).slice().sort((a, b) => String(b.sortAt || "").localeCompare(String(a.sortAt || "")));
    const countEl = document.getElementById("clima-pesquisas-count");
    if (countEl) countEl.textContent = String(items.length);

    renderClimaDashboard(items);

    renderCards("clima-pesquisas-list", items, (item) => `
      <article class="item-card">
        <div class="item-topline">
          <p class="item-title">Resposta anônima</p>
        </div>
        <p class="item-meta">Recebida em ${escapeHtml(item.createdAt || "Não informado")}</p>
        ${item.sugestao ? `<p><strong>Sugestão:</strong> ${escapeHtml(item.sugestao)}</p>` : ""}
        <div class="job-actions">
          <button class="secondary-link" type="button" data-action="ver-clima-pesquisa" data-id="${escapeHtml(item.id)}">Ver respostas</button>
          <button class="danger-button" type="button" data-action="excluir-clima-pesquisa" data-id="${escapeHtml(item.id)}">Deletar</button>
        </div>
      </article>
    `);
  }
  window.renderClimaSection = renderClimaSection;

  window.verClimaPesquisa = function verClimaPesquisa(id) {
    const item = (data.climaPesquisas || []).find((registro) => String(registro.id) === String(id));
    if (!item) return;

    const rows = getClimaAnswerRows(item);
    let currentSection = "";
    const detailMarkup = [];
    rows.forEach((row) => {
      if (row.secao !== currentSection) {
        currentSection = row.secao;
        detailMarkup.push(`<h3 class="clima-answers-section">${escapeHtml(currentSection)}</h3>`);
      }
      detailMarkup.push(`<p class="clima-answers-row">${escapeHtml(row.texto)} <strong>${escapeHtml(row.resposta)}</strong></p>`);
    });
    if (item.sugestao) {
      detailMarkup.push(`<h3 class="clima-answers-section">Sugestão</h3>`);
      detailMarkup.push(`<p class="clima-answers-row">${escapeHtml(item.sugestao)}</p>`);
    }

    const overlay = document.createElement("div");
    overlay.id = "custom-modal";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card modal-card-large">
        <div class="modal-header info">Resposta da pesquisa de clima</div>
        <div class="modal-body modal-body-large"><div class="clima-answers-list">${detailMarkup.join("")}</div></div>
        <div class="modal-footer"><button class="primary-button" data-action="close-modal">Fechar</button></div>
      </div>
    `;
    overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
    document.body.appendChild(overlay);
  };

  window.excluirClimaPesquisa = function excluirClimaPesquisa(id) {
    const item = (data.climaPesquisas || []).find((registro) => String(registro.id) === String(id));
    if (!item) return;

    showPasswordActionModal({
      title: "Deletar resposta",
      text: "Confirme a senha de autorizacao para deletar esta resposta da pesquisa de clima.",
      confirmText: "Deletar",
      danger: true,
      validatePassword: async (password) => verifyAuthorizationPassword(password),
      onConfirm: async () => {
        await deleteItem("climaPesquisas", id);
      },
    });
  };

  async function applyClimaOpenState() {
    const form = document.getElementById("clima-form");
    const closedState = document.getElementById("clima-closed-state");
    if (!form || !closedState) return;
    let aberto = false;
    try {
      const response = await fetch(`/api/records?table=${encodeURIComponent(TABLES.climaConfig)}&select=*`);
      const result = await response.json().catch(() => ({}));
      aberto = Boolean(result?.data?.[0]?.aberto);
    } catch (error) {
      console.error("Erro ao verificar status da pesquisa de clima:", error);
    }
    form.hidden = !aberto;
    closedState.hidden = aberto;
    if (aberto) setupPublicClimaForm();
  }

  try {
    const originalRenderAll = renderAll;
    renderAll = function patchedRenderAllForClima() {
      originalRenderAll?.();
      renderClimaSection();
    };
  } catch (_) {}

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("clima-closed-state")) {
      applyClimaOpenState();
    } else {
      setupPublicClimaForm();
    }
  });

  if (document.getElementById("clima-closed-state")) {
    applyClimaOpenState();
  } else {
    setupPublicClimaForm();
  }
})();
