// Casos de uso: fluxos de gerar documento, exportar relatorio, validar anexo e excluir registro.

function getDisciplinaryReportRows(useFilters = true) {
  const records = useFilters ? getFilteredDisciplinaryRecords() : (data.disciplinaryRecords || []);
  return records.map((item) => ({
    tipo: getDisciplinaryTypeLabel(item.tipo),
    colaborador: item.colaborador || "Funcionario nao informado",
    unidade: item.unidade || "Nao informada",
    dataMedida: formatEventDate(item.dataMedida || ""),
    local: item.local || "Nao informado",
    motivo: item.motivo || "Nao informado",
    registradoEm: formatVtReportDateTime(item.createdAt || todayLabel()),
    registradoPor: item.createdBy || getSystemFallbackAuthor(),
  }));
}

async function gerarDocumentoDisciplinary(id) {
  const record = (data.disciplinaryRecords || []).find((item) => String(item.id) === String(id));
  if (!record) return;

  const templateFile = getDisciplinaryTemplateFile(record.unidade);
  if (!templateFile) {
    showModal("Sem modelo cadastrado", "Nao ha modelo de documento para a unidade deste registro.", "error");
    return;
  }

  try {
    const response = await fetch(`assets/modelos-advertencia/${templateFile}`);
    if (!response.ok) throw new Error("Nao foi possivel carregar o modelo do documento.");
    const templateBuffer = await response.arrayBuffer();
    const entries = readZipEntries(templateBuffer);

    const files = await Promise.all(entries.map(async (entry) => {
      const inflated = await inflateZipEntry(entry);
      if (entry.name !== "word/document.xml") return { name: entry.name, content: inflated };
      const xml = new TextDecoder().decode(inflated);
      return { name: entry.name, content: new TextEncoder().encode(buildDisciplinaryDocumentXml(xml, record)) };
    }));

    const blob = createZipBlob(files, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    downloadBlob(blob, safeDownloadName(`${record.tipo}-${record.colaborador}`, "docx"));
  } catch (error) {
    console.error("Erro ao gerar documento disciplinar:", error);
    showModal("Erro ao gerar documento", error.message || "Nao foi possivel gerar o documento.", "error");
  }
}

function gerarRelatorioDisciplinary(scope = "filtered") {
  const useFilters = scope !== "all";
  const rows = getDisciplinaryReportRows(useFilters);
  if (!rows.length) {
    showModal("Relatorio vazio", "Nao ha advertencias ou suspensoes para gerar o relatorio.", "error");
    return;
  }
  downloadBlob(createDisciplinaryReportXlsxBlob(rows), safeDownloadName(`relatorio-advertencias-suspensoes-${useFilters ? "filtrado" : "todos"}`, "xlsx"));
  document.getElementById("custom-modal")?.remove();
}

function validateDisciplinaryAttachment(file) {
  if (!file || !file.name) return null;
  if (file.size > DISCIPLINARY_ATTACHMENT_MAX_SIZE_BYTES) return "O anexo deve ter ate 3 MB.";
  if (!DISCIPLINARY_ATTACHMENT_ALLOWED_MIME_TYPES.has(file.type)) return "Anexe somente imagem, PDF ou arquivo Word.";
  return null;
}

function excluirDisciplinaryRecord(id) {
  const registro = (data.disciplinaryRecords || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showPasswordActionModal({
    title: "Deletar registro",
    text: `Confirme a senha de exclusao para deletar a medida de "${registro.colaborador || "funcionario nao informado"}".`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      const deleted = await deleteItem("disciplinaryRecords", id);
      if (deleted) {
        showModal("Registro deletado", "A medida disciplinar foi removida.", "info");
      }
    },
  });
}
