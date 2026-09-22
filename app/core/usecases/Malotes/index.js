// Casos de uso: gerar documento do malote e excluir com senha de autorizacao.

function baixarDocumentoMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;

  const collaboratorGroups = normalizeMaloteCollaborators(malote);
  const documentItems = collaboratorGroups.length
    ? collaboratorGroups.flatMap((group) => group.itens.map((item) => ({ ...item, colaborador: group.colaborador })))
    : parseEpiItems(malote.epis).map((item) => ({ ...item, colaborador: "Nao informado" }));
  const epiRows = (documentItems.length ? documentItems : [{ nome: malote.epis || "Nao informado", tamanho: "Nao se aplica", quantidade: "1", colaborador: "Nao informado" }])
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.colaborador || "Nao informado")}</td>
        <td>${escapeHtml(item.nome || "Nao informado")}</td>
        <td>${escapeHtml(item.tamanho || "Nao se aplica")}</td>
        <td>${escapeHtml(item.quantidade || "1")}</td>
      </tr>
    `)
    .join("");

  const conteudo = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; }
          .doc { border: 1px solid #111827; padding: 10px; }
          .top-note { border: 1px solid #9ca3af; padding: 6px; font-size: 9px; text-transform: uppercase; margin-bottom: 8px; }
          .header { display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header > div { display: table-cell; border: 1px solid #111827; padding: 8px; vertical-align: middle; }
          .brand { width: 58%; }
          .brand h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
          .brand p { margin: 4px 0 0; font-size: 10px; }
          .number { width: 22%; text-align: center; }
          .number strong { display: block; font-size: 18px; margin-top: 4px; }
          .status { width: 20%; text-align: center; }
          .section-title { background: #e5e7eb; border: 1px solid #111827; padding: 5px; font-weight: bold; text-transform: uppercase; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #111827; padding: 6px; vertical-align: top; }
          th { background: #f3f4f6; text-transform: uppercase; font-size: 9px; }
          .field-label { display: block; font-size: 8px; color: #374151; text-transform: uppercase; margin-bottom: 4px; }
          .field-value { font-size: 12px; font-weight: bold; min-height: 16px; }
          .muted { color: #6b7280; font-weight: normal; }
          .signature { height: 72px; }
          .table-col-item { width: 8%; }
          .table-col-epi-size { width: 22%; }
          .table-col-quantity { width: 16%; }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="top-note">Recebemos os materiais constantes neste documento de malote de EPI.</div>
          <div class="header">
            <div class="brand">
              <h1>HUB RH</h1>
              <p>Controle interno de malotes de EPI</p>
              <p class="muted">Documento gerado automaticamente pelo sistema</p>
            </div>
            <div class="number">
              <span class="field-label">Nº do malote</span>
              <strong>${escapeHtml(String(malote.codigoSolicitacao || malote.id || ""))}</strong>
            </div>
            <div class="status">
              <span class="field-label">Status</span>
              <div class="field-value">${escapeHtml(malote.status || "")}</div>
            </div>
          </div>

          <div class="section-title">Dados do malote</div>
          <table>
            <tr>
              <td>
                <span class="field-label">Destino</span>
                <div class="field-value">${escapeHtml(malote.destino || "Nao informado")}</div>
              </td>
              <td>
                <span class="field-label">Origem</span>
                <div class="field-value">${escapeHtml(malote.origem || "Nao informada")}</div>
              </td>
              <td>
                <span class="field-label">Data</span>
                <div class="field-value">${escapeHtml(malote.createdAt || "")}</div>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Registrado por</span>
                <div class="field-value">${escapeHtml(malote.createdBy || getSystemFallbackAuthor())}</div>
              </td>
              <td>
                <span class="field-label">Alterado por</span>
                <div class="field-value">${escapeHtml(malote.updatedBy || "Sem alteracoes")}</div>
              </td>
              <td>
                <span class="field-label">Emissao</span>
                <div class="field-value">${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
              </td>
            </tr>
          </table>

          <div class="section-title">Dados dos EPIs</div>
          <table>
            <thead>
              <tr>
                <th class="table-col-item">Item</th>
                <th>Colaborador</th>
                <th>EPI</th>
                <th class="table-col-epi-size">Tamanho do EPI</th>
                <th class="table-col-quantity">Quantidade</th>
              </tr>
            </thead>
            <tbody>${epiRows}</tbody>
          </table>

          <div class="section-title">Observações</div>
          <table>
            <tr>
              <td style="min-height:48px; height:48px;">
                <div class="field-value" style="font-weight:normal; white-space:pre-wrap;">${malote.observacoes ? escapeHtml(malote.observacoes) : '<span style="color:#9ca3af;">Sem observações.</span>'}</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(["﻿", conteudo], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeNumero = String(malote.codigoSolicitacao || malote.id || "malote").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `malote-${safeNumero || "sem-numero"}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function deleteMaloteWithAuthorization(id, password) {
  const response = await fetch("/api/malote-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (result.error && result.error !== "Senha de autorizacao invalida.") showModal("Erro ao deletar malote", result.error, "error");
    return false;
  }
  data.malotes = (data.malotes || []).filter((item) => String(item.id) !== String(id));
  saveLocalData();
  renderAll();
  return true;
}

async function excluirMalote(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;

  showPasswordActionModal({
    title: "Deletar malote",
    text: `Confirme a senha de autorizacao para deletar o malote para "${malote.destino}".`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => deleteMaloteWithAuthorization(id, password),
    onConfirm: async () => {},
  });
}
