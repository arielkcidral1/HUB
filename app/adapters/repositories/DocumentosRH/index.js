// Repositorio: como o documento RH vira linha do PostgreSQL e volta.

const documentosRHRepository = {
  collection: "documentos",
  table: "hub_documentos",
  mapRow: (row) => ({
    id: row.id,
    type: row.tipo || "",
    summary: row.resumo || "",
    details: row.detalhes || "",
    formData: row.dados && typeof row.dados === "object" ? row.dados : {},
    createdBy: row.created_by || getSystemFallbackAuthor(),
    createdAt: formatDateTime(row.created_at),
    sortAt: row.created_at || "",
    updatedBy: row.updated_by || "",
    updatedAt: row.updated_at ? formatDateTime(row.updated_at) : "",
    updatedSortAt: row.updated_at || "",
  }),
  toPayload: (values) => ({
    tipo: values.type || "",
    resumo: values.summary || "",
    detalhes: values.details || "",
    dados: values.formData || {},
    created_by: values.createdBy || getCurrentUserName(),
    updated_by: values.updatedBy || null,
  }),
  saveErrorMessage: (error) => `Nao foi possivel salvar o documento. ${error?.message || "Confira as colunas da tabela hub_documentos (tipo, resumo, detalhes, dados, created_by)."}`,
  prepareUpdate: (payload) => {
    delete payload.created_by;
    payload.updated_at = new Date().toISOString();
  },
};
