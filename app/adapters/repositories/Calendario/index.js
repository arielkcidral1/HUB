// Repositorio: como o evento vira linha do PostgreSQL e volta.

function normalizeEventDateKey(value) {
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value || "");
}

const calendarioRepository = {
  collection: "eventos",
  table: "hub_eventos",
  mapRow: (row) => ({
    id: row.id,
    titulo: row.titulo,
    data: normalizeEventDateKey(row.data),
    horario: row.horario,
    responsavel: row.responsavel,
    tipo: row.tipo || "Evento",
    descricao: row.descricao || "",
    createdBy: row.created_by || getSystemFallbackAuthor(),
    updatedBy: row.updated_by || "",
    createdAt: formatDate(row.created_at),
    sortAt: row.created_at || "",
  }),
  toPayload: (values) => ({
    titulo: values.titulo,
    data: values.data,
    horario: values.horario,
    responsavel: values.responsavel,
    tipo: values.tipo || "Evento",
    descricao: values.descricao || "",
    created_by: values.createdBy || getCurrentUserName(),
    updated_by: values.updatedBy || null,
  }),
};
