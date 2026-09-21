// Repositorio: como o registro vira linha do PostgreSQL e volta (mapeamento, payload, compatibilidade de colunas, upload de anexo).

async function uploadDisciplinaryAttachment(file) {
  const path = `medidas-disciplinares/${generateUUID()}/${safePublicFileName(file.name || "anexo")}`;
  await uploadPublicFile(file, path);
  return { name: file.name || "anexo", size: file.size || 0, type: file.type || "application/octet-stream", url: path };
}

function withoutDiasSuspensaoColumn(payload) {
  const { dias_suspensao, ...rest } = payload;
  return rest;
}

function withoutDisciplinaryAnexoColumns(payload) {
  const { arquivo_nome, arquivo_tamanho, arquivo_tipo, arquivo_url, ...rest } = payload;
  return rest;
}

const disciplinaryRepository = {
  collection: "disciplinaryRecords",
  table: "hub_advertencias_suspensoes",
  mapRow: (row) => ({
    id: row.id,
    tipo: row.tipo || "advertencia",
    colaborador: row.colaborador || "",
    dataMedida: row.data_medida || "",
    unidade: row.unidade || "",
    local: row.local || "",
    motivo: row.motivo || "",
    diasSuspensao: row.dias_suspensao || "",
    arquivoNome: row.arquivo_nome || "",
    arquivoTamanho: row.arquivo_tamanho || 0,
    arquivoTipo: row.arquivo_tipo || "",
    arquivoUrl: row.arquivo_url || "",
    createdBy: row.created_by || getSystemFallbackAuthor(),
    createdAt: formatDate(row.created_at),
    sortAt: row.created_at || "",
  }),
  toPayload: (values) => ({
    tipo: values.tipo || "advertencia",
    colaborador: values.colaborador,
    data_medida: values.dataMedida || "",
    unidade: values.unidade || "",
    local: values.local || "",
    motivo: values.motivo || "",
    dias_suspensao: values.diasSuspensao ? Number(values.diasSuspensao) : null,
    arquivo_nome: values.anexo?.name || null,
    arquivo_tamanho: values.anexo?.size || null,
    arquivo_tipo: values.anexo?.type || null,
    arquivo_url: values.anexo?.url || null,
    created_by: values.createdBy || getCurrentUserName(),
  }),
  prepareUpdate: (payload) => {
    delete payload.created_by;
  },
  saveErrorMessage: (error) => `Nao foi possivel salvar a advertencia/suspensao. ${error?.message || "Confira se a tabela hub_advertencias_suspensoes existe."} Rode o arquivo postgres/migrations/20260812000300_create_advertencias_suspensoes.sql no PostgreSQL para criar a tabela.`,
  insertFallbacks: [
    {
      column: "dias_suspensao",
      strip: withoutDiasSuspensaoColumn,
      patch: (values) => ({ diasSuspensao: values.diasSuspensao || "" }),
      message: "O registro foi salvo, mas rode a migration 20260819000100 no PostgreSQL para gravar os dias de suspensao.",
    },
    {
      column: "arquivo_nome",
      strip: withoutDisciplinaryAnexoColumns,
      patch: (values) => ({
        arquivoNome: values.anexo?.name || "",
        arquivoTamanho: values.anexo?.size || 0,
        arquivoTipo: values.anexo?.type || "",
        arquivoUrl: values.anexo?.url || "",
      }),
      message: "O registro foi salvo, mas rode a migration 20260825000100 no PostgreSQL para gravar o anexo.",
    },
  ],
};
