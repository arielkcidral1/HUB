// Repositorio: como o quadro (board) vira linha do PostgreSQL e volta.

function parseBoardLists(value) {
  return parseJsonArray(value);
}

const quadrosRepository = {
  collection: "quadros",
  table: "hub_quadros",
  mapRow: (row) => ({
    id: row.id,
    nome: row.nome || "Quadro",
    listas: parseBoardLists(row.listas),
    ownerName: row.owner_name || "",
    ownerId: row.owner_id || row.user_id || "",
    ownerEmail: row.owner_email || "",
    createdBy: row.created_by || getSystemFallbackAuthor(),
    updatedBy: row.updated_by || "",
    createdAt: formatDate(row.created_at),
    sortAt: row.created_at || "",
  }),
  toPayload: (values) => {
    const payload = {
      nome: values.nome || "Quadro",
      listas: values.listas || [],
      owner_name: values.ownerName || values.owner_name || getCurrentUserName(),
      created_by: values.createdBy || getCurrentUserName(),
      updated_by: values.updatedBy || null,
    };
    if (values.id) payload.id = values.id;
    return payload;
  },
};
