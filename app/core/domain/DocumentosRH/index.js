// Dominio: rotulos dos tipos e campos de documento, e montagem do documento .doc estilizado.

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

          .letterhead { display: table; width: 100%; padding-bottom: 12px; border-bottom: 3px solid #1f3a3a; }
          .letterhead-brand, .letterhead-meta { display: table-cell; vertical-align: bottom; }
          .letterhead-brand h1 { margin: 0; font-size: 20px; font-weight: 700; color: #1f3a3a; letter-spacing: 2px; }
          .letterhead-brand p { margin: 3px 0 0; font-size: 9px; color: #6b7c7c; text-transform: uppercase; letter-spacing: 1.5px; }
          .letterhead-meta { text-align: right; font-size: 9px; color: #4b5b5b; line-height: 1.6; }
          .letterhead-meta strong { color: #1f3a3a; }

          .doc-title { margin-top: 18px; margin-bottom: 4px; }
          .doc-title .doc-kicker { margin: 0; font-size: 9px; font-weight: 700; color: #1f7a6f; text-transform: uppercase; letter-spacing: 2px; }
          .doc-title h2 { margin: 4px 0 0; font-size: 17px; font-weight: 700; color: #1f2933; }
          .doc-title p { margin: 5px 0 0; font-size: 10.5px; color: #6b7c7c; font-style: italic; }
          .doc-title-rule { height: 1px; background: #d8e0e0; margin: 12px 0 18px; }

          .section-heading { font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 5px; margin: 0 0 10px; border-bottom: 1px solid #1f3a3a; }

          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          .data-table td { border: 1px solid #d8e0e0; padding: 7px 10px; vertical-align: top; }
          .data-table td.label-cell { width: 32%; background: #f4f7f7; font-size: 9px; font-weight: 700; color: #4b5b5b; text-transform: uppercase; letter-spacing: .5px; }
          .data-table td.value-cell { font-size: 11px; color: #1f2933; font-weight: 500; }

          .note-section { margin-top: 16px; }
          .note-section h3 { margin: 0 0 6px; font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 5px; border-bottom: 1px solid #1f3a3a; }
          .note-section p { margin: 0; padding: 10px 12px; border: 1px solid #d8e0e0; border-radius: 2px; min-height: 46px; line-height: 1.65; white-space: normal; color: #344048; background: #fafcfc; }

          .signature-box { display: table; width: 100%; margin-top: 56px; table-layout: fixed; }
          .signature-col { display: table-cell; width: 50%; padding: 0 24px; text-align: center; }
          .signature-line { border-top: 1px solid #1f2933; margin: 0 0 6px; }
          .signature-col span { font-size: 9.5px; font-weight: 700; color: #1f3a3a; text-transform: uppercase; letter-spacing: .8px; }

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

  downloadBlob(new Blob(["﻿", html], { type: "application/msword;charset=utf-8" }), safeDownloadName(title, "doc"));
}
