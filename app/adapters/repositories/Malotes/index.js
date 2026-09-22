// Repositorio: como o malote vira linha do PostgreSQL e volta (mapeamento e payload).
// ponytail: a compatibilidade de coluna updated_by ausente continua em script.js (addItem/updateItem),
// pois usa setSyncStatus em vez do showModal generico de insertFallbacks e tambem cobre eventos; mover
// exigiria um segundo mecanismo generico so para isso.

const malotesRepository = {
  collection: "malotes",
  table: "hub_malotes",
  mapRow: (row) => ({
    id: row.id,
    destino: row.destino,
    origem: row.origem || "",
    epis: row.epis,
    colaboradores: parseJsonArray(row.colaboradores),
    codigoSolicitacao: row.codigo_solicitacao || "",
    observacoes: row.observacoes || "",
    status: row.status,
    createdBy: row.created_by || getSystemFallbackAuthor(),
    updatedBy: row.updated_by || "",
    createdAt: formatDate(row.created_at),
    sortAt: row.created_at || "",
  }),
  toPayload: (values) => ({
    destino: values.destino,
    origem: values.origem || "",
    epis: values.epis,
    colaboradores: values.colaboradores || [],
    codigo_solicitacao: values.codigoSolicitacao || "",
    observacoes: values.observacoes || "",
    status: values.status || "Separação",
    created_by: values.createdBy || getCurrentUserName(),
    updated_by: values.updatedBy || null,
  }),
};
