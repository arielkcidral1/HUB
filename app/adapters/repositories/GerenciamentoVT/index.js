// Repositorio: como o registro de VT vira linha do PostgreSQL e volta.

const vtRegistrosRepository = {
  collection: "vtRegistros",
  table: "hub_vt_registros",
  mapRow: (row) => ({
    id: row.id,
    colaborador: row.colaborador || "",
    unidade: row.unidade || "",
    mes: row.mes || "",
    diasUteis: row.dias_uteis || 0,
    valorPassagem: Number(row.valor_passagem) || 0,
    saldoAtual: Number(row.saldo_atual) || 0,
    valorNecessario: Number(row.valor_necessario) || 0,
    createdBy: row.created_by || getSystemFallbackAuthor(),
    createdAt: formatDate(row.created_at),
    sortAt: row.created_at || "",
  }),
  toPayload: (values) => ({
    colaborador: values.colaborador,
    unidade: values.unidade,
    mes: values.mes,
    dias_uteis: values.diasUteis,
    valor_passagem: values.valorPassagem,
    saldo_atual: values.saldoAtual,
    valor_necessario: values.valorNecessario,
    created_by: values.createdBy || getCurrentUserName(),
  }),
};
