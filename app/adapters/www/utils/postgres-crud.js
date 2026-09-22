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

async function addItem(collection, values) {
  if (!postgresClient) {
    appendLocalInsertedItem(collection, values);
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const isPublicInsert = isPublicInsertOnlyCollection(collection);
    const { _turnstileToken, ...cleanValues } = values;
    const payload = isPublicInsert
      ? toPublicSubmissionPayload(collection, cleanValues)
      : toDbPayload(collection, values);

    if (isPublicInsert) {
      const inserted = await submitPublicRecord(collection, payload, _turnstileToken);
      data[collection].unshift(inserted ? mapRows(collection, [inserted])[0] : {
        id: generateUUID(),
        createdAt: todayLabel(),
        sortAt: new Date().toISOString(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      if (!isPublicPage()) {
        saveLocalData();
        renderAll();
      }
      return true;
    }

    const { data: inserted, error } = await postgresClient
      .from(TABLES[collection])
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: insertedWithoutAuthor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(withoutCreatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutAuthor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL sem autoria", false);
        renderAll();
        return true;
      }

      if (collection === "malotes" && isMissingColumn(error, "updated_by")) {
        const { data: insertedWithoutEditor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(withoutUpdatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutEditor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        return true;
      }

      const legacyInsert = HubModules.byCollection(collection)?.insertFallbacks?.find((fallback) => isMissingColumn(error, fallback.column));
      if (legacyInsert) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(legacyInsert.strip(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          ...legacyInsert.patch(values),
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", legacyInsert.message, "info");
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(withoutOptionalJobColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A vaga foi salva em modo compatibilidade. Rode o postgres-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      if (collection === "candidaturas" && isMissingColumn(error, "telefone")) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(withoutOptionalApplicationColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          telefone: values.telefone || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A candidatura foi salva, mas rode o postgres-schema.sql atualizado para gravar telefone no banco.", "info");
        return true;
      }

      throw error;
    }

    data[collection].unshift(mapRows(collection, [inserted])[0]);
    saveLocalData();
    setSyncStatus("PostgreSQL EIXO online", true);
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao salvar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection].unshift({
        id: generateUUID(),
        createdAt: todayLabel(),
        sortAt: new Date().toISOString(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      saveLocalData();
      setSyncStatus("Evento salvo localmente", false);
      renderAll();
      showModal("Evento salvo localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows = error?.code === "PGRST116";
    const message = isPublicInsertOnlyCollection(collection)
      ? (error?.message || "Nao foi possivel enviar o formulario publico.")
      : collection === "chamados"
        ? "Nao foi possivel abrir o chamado. Rode o arquivo fix-chamados-postgres.sql no PostgreSQL para criar a tabela hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para salvar a vaga. Verifique se seu usuario tem cargo 'RH' na tabela hub_users e se o e-mail do perfil coincide com o e-mail do login. Rode o hub-vagas-fix.sql para corrigir."
          : collection === "vagas"
            ? `Nao foi possivel salvar a vaga. ${error?.message || "Confira se as colunas descricao, requisitos e created_by existem em hub_vagas (rode hub-vagas-fix.sql)."}`
            : HubModules.byCollection(collection)?.saveErrorMessage
              ? HubModules.byCollection(collection).saveErrorMessage(error)
              : "Nao foi possivel salvar no PostgreSQL. Confira se as tabelas hub_* existem no projeto EIXO.";
    showModal("Erro ao Salvar", message, "error");
    return false;
  }
}

async function addChatMessage(values) {
  if (!postgresClient) {
    return {
      id: generateUUID(),
      createdAt: todayLabel(),
      sortAt: new Date().toISOString(),
      createdBy: values.createdBy || getCurrentUserName(),
      ...values,
    };
  }

  try {
    const { data: inserted, error } = await postgresClient
      .from(TABLES.comunicados)
      .insert(toDbPayload("comunicados", values))
      .select("*")
      .single();

    if (error) throw error;

    setSyncStatus("PostgreSQL EIXO online", true);
    return mapRows("comunicados", [inserted])[0];
  } catch (error) {
    console.error("Erro ao salvar mensagem no PostgreSQL:", error);
    setSyncStatus("Erro no chat", false);
    showModal("Erro ao enviar", "Nao foi possivel enviar a mensagem. Confira a conexao e tente novamente.", "error");
    return null;
  }
}

async function deleteChatMessageRecord(id) {
  beginChatMutation();
  const current = data.comunicados || [];
  const removed = current.find((item) => String(item.id) === String(id));
  if (!removed) {
    endChatMutation();
    return false;
  }

  rememberDeletedChatMessage(id);
  sendChatRealtimeBroadcast("chat", { action: "delete", id });
  data.comunicados = current.filter((item) => String(item.id) !== String(id));
  saveLocalDataDebounced();
  renderChat({ skipPostRender: true });
  window.setTimeout(() => {
    renderDashboard();
    renderChatChannels();
  }, 0);

  if (!postgresClient || String(id).startsWith("pending-")) {
    endChatMutation();
    return true;
  }

  try {
    const { data: deletedRows, error } = await postgresClient
      .from(TABLES.comunicados)
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!deletedRows?.length) throw new Error("Delete nao confirmado pelo PostgreSQL.");

    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao excluir mensagem no PostgreSQL:", error);
    forgetDeletedChatMessage(id);
    sendChatRealtimeBroadcast("chat", { action: "upsert", message: removed, localEcho: true, forceRestore: true });
    data.comunicados = [removed, ...(data.comunicados || []).filter((item) => String(item.id) !== String(id))];
    saveLocalDataDebounced();
    renderChat({ skipPostRender: true });
    window.setTimeout(() => {
      renderDashboard();
      renderChatChannels();
    }, 0);
    setSyncStatus("Erro no chat", false);
    showModal("Erro ao excluir", "Nao foi possivel excluir a mensagem. Confira a conexao e tente novamente.", "error");
    return false;
  } finally {
    endChatMutation();
  }
}

async function updateItem(collection, id, values) {
  if (!id) return false;

  if (!postgresClient) {
    data[collection] = (data[collection] || []).map((item) =>
      String(item.id) === String(id) ? { ...item, ...values } : item
    );
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const payload = toDbPayload(collection, values);
    if (collection === "malotes") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
if (collection === "eventos") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
    if (collection === "chamados") {
      delete payload.created_by;
    }
    if (collection === "vagas") {
      delete payload.created_by;
    }
    HubModules.byCollection(collection)?.prepareUpdate?.(payload);
    const { data: updated, error } = await postgresClient
      .from(TABLES[collection])
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: updatedWithoutAuthor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .update(withoutCreatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, updatedWithoutAuthor, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("PostgreSQL sem autoria", false);
        return true;
      }

      if ((collection === "malotes" || collection === "eventos") && isMissingColumn(error, "updated_by")) {
        const { data: updatedWithoutEditor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .update(withoutUpdatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedWithoutEditor,
          updated_by: values.updatedBy || getCurrentUserName(),
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("PostgreSQL precisa migracao", false);
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: updatedLegacy, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .update(withoutOptionalJobColumns(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedLegacy,
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("PostgreSQL precisa migracao", false);
        showModal("Banco precisa atualizar", "A vaga foi atualizada em modo compatibilidade. Rode o postgres-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      throw error;
    }

    mergeRealtimeRow(collection, updated, "UPDATE");
    renderRealtimeUpdate(collection);
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection] = (data[collection] || []).map((item) =>
        String(item.id) === String(id)
          ? { ...item, ...values, createdBy: item.createdBy || values.createdBy || getCurrentUserName(), updatedBy: values.updatedBy || getCurrentUserName() }
          : item
      );
      saveLocalData();
      setSyncStatus("Evento atualizado localmente", false);
      renderAll();
      showModal("Evento atualizado localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows   = error?.code === "PGRST116";
    const message =
      collection === "chamados"
        ? "O PostgreSQL bloqueou o arquivamento do chamado. Rode o arquivo fix-arquivar-chamados-postgres.sql no PostgreSQL para liberar UPDATE em hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para editar a vaga. Verifique se seu usuario tem cargo 'RH' em hub_users com o mesmo e-mail do login."
          : collection === "vagas"
            ? `Nao foi possivel editar a vaga. ${error?.message || "Confira as colunas de hub_vagas (rode hub-vagas-fix.sql)."}`
            : "Nao foi possivel atualizar o registro no PostgreSQL.";
    showModal("Erro ao Atualizar", message, "error");
    return false;
  }
}

async function deleteItem(collection, id) {
  if (!id) return false;

  if (!postgresClient) {
    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    if (collection === "vagas") {
      const { error: candidaturaError } = await postgresClient.from(TABLES.candidaturas).delete().eq("vaga_id", id);
      if (candidaturaError) throw candidaturaError;
    }

    const { data: deletedRows, error } = await postgresClient.from(TABLES[collection]).delete().eq("id", id).select("id");
    if (error) throw error;

    if (!deletedRows?.length) {
      setSyncStatus("Delete pendente no PostgreSQL", false);
      showModal("Permissao de Delete", "O PostgreSQL nao confirmou a exclusao da vaga. Rode o postgres-schema.sql atualizado para liberar DELETE em hub_vagas.", "error");
      await refreshFromPostgreSQL();
      return false;
    }

    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao deletar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
      saveLocalData();
      renderAll();
      setSyncStatus("Evento deletado localmente", false);
      showModal("Evento deletado localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    showModal("Erro ao Deletar", "Nao foi possivel deletar o registro no PostgreSQL.", "error");
    return false;
  }
}

async function loadPublicData() {
  if (!isPublicJobsPage()) return;

  try {
    const response = await fetch(`/api/records?table=${encodeURIComponent(TABLES.vagas)}&select=*&order=${encodeURIComponent(JSON.stringify([{ column: "created_at", ascending: false }]))}`);

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nao foi possivel carregar vagas publicas.");

    const rows = result.data || [];
    data.vagas = mapRows("vagas", rows || []);
    renderPublicVagas();
  } catch (error) {
    console.error("Erro ao carregar vagas publicas:", error);
    renderPublicVagas();
  }
}

async function loadIndexVagasData(options = {}) {
  const { render = true } = options;
  if (!document.getElementById("vagas-list")) return false;

  try {
    const order = encodeURIComponent(JSON.stringify([{ column: "created_at", ascending: false }]));
    const [vagasResponse, candidaturasResponse] = await Promise.all([
      fetch(`/api/records?table=${encodeURIComponent(TABLES.vagas)}&select=*&order=${order}`, { credentials: "same-origin" }),
      fetch(`/api/records?table=${encodeURIComponent(TABLES.candidaturas)}&select=*&order=${order}`, { credentials: "same-origin" }),
    ]);
    const vagasResult = await vagasResponse.json().catch(() => ({}));
    const candidaturasResult = await candidaturasResponse.json().catch(() => ({}));
    if (!vagasResponse.ok) throw new Error(vagasResult.error || "Nao foi possivel carregar vagas no index.");
    if (!candidaturasResponse.ok) throw new Error(candidaturasResult.error || "Nao foi possivel carregar curriculos no index.");

    data.vagas = mapRows("vagas", vagasResult.data || []);
    data.candidaturas = mapRows("candidaturas", candidaturasResult.data || []);
    saveLocalData();
    publishHubDataCounts();
    if (render) {
      safeRenderSection("vagas", renderVagasSection);
      safeRenderSection("dashboard", renderDashboard);
    }
    return true;
  } catch (error) {
    console.error("Erro ao carregar vagas e curriculos no index:", error);
    return false;
  }
}
