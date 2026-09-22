// Casos de uso: gerar relatorio de VT e excluir registro.

function gerarRelatorioVt(scope = "filtered") {
  const useFilters = scope !== "all";
  const registros = useFilters ? getFilteredVtRegistros() : (data.vtRegistros || []);
  const rows = buildVtReportRows(registros);
  if (!rows.length) {
    showModal("Relatório vazio", "Não há registros de VT para gerar o relatório.", "error");
    return;
  }
  const blob = createVtReportXlsxBlob(rows);
  downloadBlob(blob, safeDownloadName(`relatorio-vt-${useFilters ? "filtrado" : "todos"}`, "xlsx"));
  document.getElementById("custom-modal")?.remove();
}

async function excluirVtRegistro(id) {
  const registro = (data.vtRegistros || []).find((item) => String(item.id) === String(id));
  if (!registro) return;

  showConfirmActionModal({
    title: "Apagar registro de VT",
    text: `Tem certeza que deseja apagar o registro de VT de "${registro.colaborador || "colaborador não informado"}"?`,
    confirmText: "Apagar",
    danger: true,
    onConfirm: async () => {
      const deleted = await deleteItem("vtRegistros", id);
      if (deleted) {
        showModal("Registro apagado", "O registro de vale-transporte foi apagado com sucesso.", "info");
      }
    },
  });
}
