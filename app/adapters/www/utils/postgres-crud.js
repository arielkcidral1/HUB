// Infra generica de CRUD/payload/bootstrap contra o PostgreSQL (mapeamento de linhas, shaping de payload, bootstrap e carregamento das colecoes).

function mapRows(collection, rows) {
  const hubModule = HubModules.byCollection(collection);
  if (hubModule) return rows.map(hubModule.mapRow);

  if (collection === "readReceipts") {
    return rows.map((row) => ({
      id: row.id || `${row.user_id || row.user_key || "user"}:${row.item_id || row.notification_id || row.message_id || generateUUID()}`,
      userKey: row.user_id || row.user_key || "",
      itemType: row.item_type || "",
      itemId: row.item_id || "",
      notificationId: row.notification_id || (row.item_type === "notification" ? row.item_id : ""),
      messageId: row.message_id || (row.item_type === "message" ? row.item_id : ""),
      readAt: row.read_at || row.created_at || "",
    }));
  }

  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status || "Aberta",
      createdBy: row.created_by || "Sistema",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }

  if (collection === "feedbacks") {
    return rows.map((row) => ({
      id: row.id || generateUUID(),
      tipo: row.tipo || "Feedback",
      mensagem: row.mensagem || "",
      autorNome: row.autor_nome || row.autorNome || row.created_by || "Nao informado",
      autorEmail: row.autor_email || row.autorEmail || "",
      status: row.status || "Novo",
      createdBy: row.created_by || row.autor_nome || "Sistema",
      createdAt: row.created_at ? formatDateTime(row.created_at) : row.createdAt || todayLabel(),
      sortAt: row.created_at || row.sortAt || "",
    }));
  }

  if (collection === "comunicados") {
    return rows.map((row) => {
      const parsed = parseChatMessage(row);
      return {
        id: row.id,
        autor: row.autor,
        mensagem: parsed.mensagem,
        canal: parsed.canal,
        createdBy: row.created_by || row.autor,
        arquivo: row.arquivo_nome
          ? {
              name: row.arquivo_nome,
              size: row.arquivo_tamanho,
              type: row.arquivo_tipo,
              url: row.arquivo_url,
            }
          : null,
        createdAt: formatDateTime(row.created_at),
        sortAt: row.created_at || "",
      };
    });
  }

  if (collection === "chamados") {
    return rows.map((row) => ({
      id: row.id,
      solicitante: row.solicitante,
      unidade: row.unidade,
      setor: row.setor || "",
      epis: row.epis,
      codigoSolicitacao: row.codigo_solicitacao || "",
      observacoes: row.observacoes || "",
      status: row.status || "Aberto",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }

  if (collection === "candidaturas") {
    return rows.map((row) => ({
      id: row.id,
      vaga_id: row.vaga_id,
      nome: row.nome,
      telefone: row.telefone || "",
      cpf: row.cpf,
      curriculo_url: row.curriculo_url,
      createdBy: row.created_by || row.nome,
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }
  if (collection === "climaPesquisas") {
    return rows.map((row) => ({
      id: row.id,
      respostas: row.respostas && typeof row.respostas === "object" ? row.respostas : {},
      sugestao: row.sugestao || "",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }
  if (collection === "climaConfig") {
    return rows.map((row) => ({
      id: row.id,
      aberto: Boolean(row.aberto),
      abertoEm: row.aberto_em || "",
      encerradoEm: row.encerrado_em || "",
    }));
  }
  if (collection === "atestados") {
    return rows.map(mapAtestadoRow);
  }

  if (collection === "documentosContratados") {
    return rows.map(mapContractorDocumentRow);
  }

  if (collection === "usuarios") {
    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email || "",
      cpf: row.cpf || "",
      cargo: row.cargo || "",
      unidade: row.unidade || getDefaultUserUnit(row.nome),
      foto_perfil: row.foto_perfil || "",
      configuracoes: parseJsonObject(row.configuracoes),
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
      sortAt: row.created_at || "",
    }));
  }

  return rows.map((row) => {
    const legacyDetails = parseLegacyJobDetails(row.projeto);
    return {
      id: row.id,
      cargo: row.cargo,
      unidade: row.unidade || "",
      projeto: "",
      descricao: row.descricao || legacyDetails.descricao,
      requisitos: row.requisitos || legacyDetails.requisitos,
      status: normalizeJobStatus(row.status),
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
      sortAt: row.created_at || "",
    };
  });
}

function toDbPayload(collection, values) {
  const hubModule = HubModules.byCollection(collection);
  if (hubModule) return hubModule.toPayload(values);

  if (collection === "comunicados") {
    const payload = {
      autor: values.autor,
      canal: normalizeChatChannel(values.canal),
      mensagem: values.mensagem || "",
      created_by: values.createdBy || values.autor || getCurrentUserName(),
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
    if (values.sortAt || values.createdAt) payload.created_at = values.sortAt || values.createdAt;
    return payload;
  }

  if (collection === "usuarios") {
    return {
      nome: values.nome,
      email: values.email || null,
      cpf: normalizeCpf(values.cpf) || null,
      cargo: values.cargo || "",
      unidade: values.unidade || getDefaultUserUnit(values.nome),
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "vagas") {
    return {
      cargo: values.cargo,
      unidade: values.unidade || "",
      descricao: values.descricao || "",
      requisitos: values.requisitos || "",
      status: values.status || "Aberta",
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "chamados") {
    const payload = {};
    if ("solicitante" in values) payload.solicitante = values.solicitante;
    if ("unidade" in values) payload.unidade = values.unidade;
    if ("setor" in values) payload.setor = values.setor || "";
    if ("epis" in values) payload.epis = values.epis;
    if ("observacoes" in values) payload.observacoes = values.observacoes || "";
    payload.status = values.status || "Aberto";
    payload.created_by = values.createdBy || getCurrentUserName();
    return payload;
  }

  if (collection === "climaConfig") {
    const payload = { aberto: Boolean(values.aberto) };
    if ("abertoEm" in values) payload.aberto_em = values.abertoEm || null;
    if ("encerradoEm" in values) payload.encerrado_em = values.encerradoEm || null;
    return payload;
  }

  if (collection === "atestados") {
    return {
      nome: values.nome || "",
      cpf: values.cpf || "",
      telefone: values.telefone || "",
      unidade: values.unidade || "",
      arquivo_nome: values.arquivoNome || "Atestado",
      arquivo_tamanho: values.arquivoTamanho || 0,
      arquivo_tipo: values.arquivoTipo || "application/octet-stream",
      arquivo_url: values.arquivoUrl || "",
      status: values.status || "Recebido",
      created_by: values.createdBy || "Publico",
    };
  }

  if (collection === "documentosContratados") {
    return {
      empresa: values.empresa,
      origem_html: values.origemHtml || "",
      nome: values.nome,
      cpf: values.cpf,
      telefone: values.telefone || "",
      email: values.email || "",
      documentos: values.documentos || [],
      created_by: values.createdBy || "Publico",
    };
  }

  const { createdBy, ...payload } = values;
  return {
    ...payload,
    created_by: createdBy || getCurrentUserName(),
  };
}

function withoutCreatedBy(payload) {
  const { created_by, ...rest } = payload;
  return rest;
}

function withoutUpdatedBy(payload) {
  const { updated_by, ...rest } = payload;
  return rest;
}

function isMissingCreatedByColumn(error) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes("created_by");
}

function isMissingColumn(error, columnName) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes(columnName);
}

function isMissingDbColumn(error, columnName) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const column = String(columnName || "").toLowerCase();
  return Boolean(column) && (
    message.includes(column) ||
    message.includes(`column "${column}"`) ||
    message.includes(`coluna "${column}"`)
  );
}

async function selectPostgreSQLRows(table, { orderBy = "created_at", ascending = false, configure } = {}) {
  let query = postgresClient.from(table).select("*");
  if (typeof configure === "function") query = configure(query) || query;
  if (orderBy) query = query.order(orderBy, { ascending });

  let result = await query;
  if (result.error && orderBy && isMissingDbColumn(result.error, orderBy)) {
    let fallbackQuery = postgresClient.from(table).select("*");
    if (typeof configure === "function") fallbackQuery = configure(fallbackQuery) || fallbackQuery;
    result = await fallbackQuery;
  }
  return result;
}

async function loadBootstrapRows() {
  try {
    const response = await fetch("/api/bootstrap", { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.data) {
      throw new Error(result?.error || "Bootstrap do PostgreSQL indisponivel.");
    }
    return result.data;
  } catch (error) {
    console.warn("Bootstrap do PostgreSQL falhou; usando carregamento por tabela:", error);
    return null;
  }
}

function shouldRepairCoreCollections() {
  return ["vagas", "malotes", "quadros", "documentosContratados"].some((collection) => !(data[collection] || []).length);
}

function getHubDataCounts() {
  return {
    comunicados: (data.comunicados || []).length,
    malotes: (data.malotes || []).length,
    quadros: (data.quadros || []).length,
    vagas: (data.vagas || []).length,
    documentosContratados: (data.documentosContratados || []).length,
    candidaturas: (data.candidaturas || []).length,
    usuarios: (data.usuarios || []).length,
  };
}

function publishHubDataCounts() {
  const counts = getHubDataCounts();
  window.__hubDataCounts = counts;
  document.body?.setAttribute("data-hub-counts", JSON.stringify(counts));
  return counts;
}

function mapBootstrapCollectionRows(collection, sourceRows = []) {
  const rows = collection === "comunicados"
    ? sourceRows.filter((row) => getAllowedChatChannelIds().includes(normalizeChatChannel(row.canal)))
    : sourceRows;
  return mapRows(collection, rows || []);
}

function applyBootstrapRowsToState(bootstrapRows, options = {}) {
  if (!bootstrapRows) return false;
  const { forceCore = false, overwriteEmpty = false } = options;
  const forceCollections = new Set(forceCore
    ? [
      "denuncias",
      "feedbacks",
      "comunicados",
      "chamados",
      "vagas",
      ...HubModules.list.map((mod) => mod.collection),
      "documentosContratados",
      "candidaturas",
      "atestados",
      "climaPesquisas",
      "readReceipts",
    ]
    : []);
  let changed = false;

  Object.keys(TABLES).forEach((collection) => {
    if (!Object.prototype.hasOwnProperty.call(bootstrapRows, collection)) return;
    const sourceRows = bootstrapRows[collection] || [];
    if (!sourceRows.length && !overwriteEmpty) return;
    if (collection !== "usuarios" && !forceCollections.has(collection) && (data[collection] || []).length) return;

    try {
      const mappedRows = mapBootstrapCollectionRows(collection, sourceRows);
      if (!mappedRows.length && !overwriteEmpty) return;
      if (collection === "usuarios") {
        data.usuarios = mergeUsersByName(data.usuarios || [], mappedRows);
      } else if (collection === "comunicados") {
        data.comunicados = mappedRows.length
          ? mergeLocalChatMessages(mappedRows, forceCollections.has(collection) ? [] : data.comunicados)
          : [];
      } else {
        data[collection] = mappedRows;
      }
      changed = true;
    } catch (error) {
      console.error("Erro ao aplicar dados do bootstrap no index:", { collection, error });
    }
  });

  if (changed) {
    saveLocalData();
    publishHubDataCounts();
  }
  return changed;
}

async function loadIndexBootstrapData(options = {}) {
  const { forceCore = true, overwriteEmpty = false, render = true } = options;
  const bootstrapRows = await loadBootstrapRows();
  const changed = applyBootstrapRowsToState(bootstrapRows, { forceCore, overwriteEmpty });
  if (changed && render) renderAll();
  return changed;
}

async function ensureViewBootstrapData(viewId) {
  const requiredByView = {
    comunicacao: ["comunicados", "usuarios"],
    malotes: ["malotes"],
    quadros: ["quadros"],
    vagas: ["vagas", "candidaturas"],
    "documentos-contratados": ["documentosContratados"],
  };
  const requiredCollections = requiredByView[viewId];
  if (!requiredCollections) return false;
  const shouldForceFreshView = ["malotes", "quadros", "documentos-contratados", "comunicacao"].includes(viewId);
  if (!shouldForceFreshView && !requiredCollections.some((collection) => !(data[collection] || []).length)) return false;

  try {
    const loaded = await loadIndexBootstrapData({ forceCore: true, overwriteEmpty: true, render: true });
    if (loaded) setSyncStatus("PostgreSQL EIXO online", true);
    return loaded;
  } catch (error) {
    console.error("Erro ao carregar dados da aba pelo bootstrap:", { viewId, error });
    return false;
  }
}

async function repairCoreCollectionsFromBootstrap() {
  if (coreCollectionsRepairInProgress || !shouldRepairCoreCollections()) return false;
  coreCollectionsRepairInProgress = true;
  try {
    return await loadIndexBootstrapData({ forceCore: false, render: true });
  } catch (error) {
    console.error("Erro ao reparar colecoes principais do PostgreSQL:", error);
    return false;
  } finally {
    coreCollectionsRepairInProgress = false;
  }
}

function parseLegacyJobDetails(projeto) {
  try {
    const parsed = JSON.parse(projeto || "{}");
    return {
      descricao: parsed.descricao || "",
      requisitos: parsed.requisitos || "",
    };
  } catch {
    return {
      descricao: "",
      requisitos: "",
    };
  }
}

function normalizeJobStatus(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!normalized || normalized === "aberta" || normalized === "aberto") return "Aberta";
  if (normalized === "fechada" || normalized === "fechado") return "Fechada";
  return String(value || "Aberta").trim() || "Aberta";
}

function isOpenJobStatus(value) {
  return normalizeJobStatus(value) === "Aberta";
}

function withoutOptionalJobColumns(payload) {
  const { descricao, requisitos, unidade, created_by, ...rest } = payload;
  return rest;
}

function withoutOptionalApplicationColumns(payload) {
  const { telefone, created_by, ...rest } = payload;
  return rest;
}

async function loadFromPostgreSQL(options = {}) {
  const { setupLive = true } = options;
  const chatLoadMutationVersion = chatMutationVersion;

  if (!postgresClient) {
    const repaired = await repairCoreCollectionsFromBootstrap();
    setSyncStatus(repaired ? "PostgreSQL EIXO online" : "Modo local", repaired);
    renderAll();
    return repaired;
  }

  try {
    const bootstrapRows = await loadBootstrapRows();
    if (bootstrapRows) {
      const loaded = applyBootstrapRowsToState(bootstrapRows, { forceCore: true, overwriteEmpty: true });
      ensureRequiredTeamUsers();

      await loadReadReceiptsFromPostgreSQL();
      publishHubDataCounts();
      if (setupLive) {
        setupRealtime();
        setupAutoRefresh();
      }
      setSyncStatus("PostgreSQL EIXO online", true);
      if (setupLive) markCurrentNotificationsAsShown();
      renderAll();
      if (setupLive) rememberCurrentNotificationKeysForPolling();
      return loaded;
    }

    const usersResult = bootstrapRows ? { data: bootstrapRows.usuarios || [], error: null } : await selectPostgreSQLRows(USERS_TABLE, {
      orderBy: "created_at",
      ascending: false,
    });
    const userRows = usersResult.data || [];
    const usersError = usersResult.error;
    let usersLoadFailed = false;

    if (usersError) {
      usersLoadFailed = true;
      console.error("Erro ao carregar usuarios do PostgreSQL:", usersError);
      ensureRequiredTeamUsers();
    } else {
      const mappedUsers = mapRows("usuarios", userRows || []);
      const dbNames = mappedUsers.map((user) => normalizeLoginName(user.nome));
      data.usuarios = (data.usuarios || []).filter((localUser) => {
        const normalizedName = normalizeLoginName(localUser.nome);
        if (dbNames.includes(normalizedName)) return true;
        if (localUser.syncStatus === "local") {
          postgresClient.from(USERS_TABLE).insert({
            nome: localUser.nome,
            email: localUser.email || null,
            created_by: "Auto-Sync",
          }).then();
          return true;
        }
        return false;
      });
      data.usuarios = mergeUsersByName(data.usuarios, mappedUsers);
    }

    const requests = bootstrapRows
      ? Object.entries(TABLES)
        .filter(([collection]) => collection !== "usuarios")
        .map(([collection]) => {
          try {
            const rows = collection === "comunicados"
              ? (bootstrapRows[collection] || []).filter((row) => getAllowedChatChannelIds().includes(normalizeChatChannel(row.canal)))
              : bootstrapRows[collection] || [];
            return { status: "fulfilled", value: [collection, mapRows(collection, rows)] };
          } catch (error) {
            return { status: "rejected", reason: { collection, error } };
          }
        })
      : await Promise.allSettled(
        Object.entries(TABLES)
          .filter(([collection]) => collection !== "usuarios")
          .map(async ([collection, table]) => {
        const { data: rows, error } = await selectPostgreSQLRows(table, {
          orderBy: "created_at",
          ascending: false,
          configure(query) {
            return collection === "comunicados"
              ? query.in("canal", getAllowedChatChannelIds())
              : query;
          },
        });
        if (error) throw error;
        return [collection, mapRows(collection, rows || [])];
      })
      );

    requests.forEach((result) => {
      if (result.status === "fulfilled") {
        const [collection, rows] = result.value;

        if (collection === "comunicados") {
          if (shouldDeferChatRefresh(chatLoadMutationVersion)) {
            queueChatRefreshAfterMutation();
            return;
          }
          data[collection] = mergeLocalChatMessages(rows, data.comunicados);
          return;
        }

        data[collection] = rows;
      } else {
        console.error("Erro ao carregar colecao do PostgreSQL:", result.reason);
      }
    });
    await loadReadReceiptsFromPostgreSQL();
    ensureRequiredTeamUsers();
    saveLocalData();
    publishHubDataCounts();
    if (setupLive) {
      setupRealtime();
      setupAutoRefresh();
    }
    const hasFailures = usersLoadFailed || requests.some((result) => result.status === "rejected");
    setSyncStatus(hasFailures ? "PostgreSQL parcial" : "PostgreSQL EIXO online", !hasFailures);
    if (setupLive) markCurrentNotificationsAsShown();
    renderAll();
    if (setupLive) rememberCurrentNotificationKeysForPolling();
    return !hasFailures;
  } catch (error) {
    console.error("Erro ao carregar PostgreSQL:", error);
    setSyncStatus("PostgreSQL pendente", false);
    renderAll();
    return false;
  }
}
