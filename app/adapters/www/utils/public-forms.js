// Formularios publicos: validacao de anexos, upload, submissao e payload de insercao publica (sem autenticacao).

function validateResumeFile(file) {
  if (!file || !file.name) {
    return "Anexe um curriculo em PDF, DOC ou DOCX.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = String(file.type || "").toLowerCase();

  if (!RESUME_ALLOWED_EXTENSIONS.has(extension) || !RESUME_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas arquivos PDF, DOC ou DOCX.";
  }

  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return "O curriculo deve ter no maximo 3 MB.";
  }

  if (file.size <= 0) {
    return "O arquivo enviado parece estar vazio.";
  }

  return null;
}

function validateContractorDocumentFile(file) {
  if (!file || !file.name) return "Anexe pelo menos um documento.";
  if (file.size <= 0) return "Um dos arquivos enviados parece estar vazio.";
  if (file.size > CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES) return "Cada documento deve ter no máximo 3 MB.";
  return null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo anexado."));
    reader.readAsDataURL(file);
  });
}

function safePublicFileName(fileName = "arquivo") {
  return String(fileName || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_.-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "arquivo";
}

function createContractorDocumentField(required = false) {
  return `
    <div class="contractor-document-field">
      <label>${required ? "Documentos" : "Documento adicional"}
        <input name="documentos" type="file" multiple ${required ? "required" : ""} />
      </label>
      ${required ? "" : '<button class="secondary-link contractor-remove-document-button" type="button" data-action="remover-documento-contratado">Remover</button>'}
    </div>
  `;
}

function resetContractorDocumentFields(container) {
  if (!container) return;
  container.innerHTML = createContractorDocumentField(true);
}

async function buildContractorDocumentPayload(documentos, batchId) {
  const files = Array.from(documentos || []);
  const uploadedDocuments = [];
  for (const file of files) {
    const safeName = safePublicFileName(file.name || "documento");
    const path = `contratados/${batchId}/${Date.now()}-${safeName}`;
    const upload = await uploadPublicFile(file, path);
    uploadedDocuments.push({
      name: String(file.name || "documento"),
      size: Number(file.size || 0),
      type: String(file.type || "application/octet-stream"),
      path: upload?.path || path,
    });
  }
  return uploadedDocuments;
}

async function uploadPublicFile(file, path = "") {
  if (!file || !file.name) return null;
  const response = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      dataUrl: await readFileAsDataUrl(file),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Nao foi possivel enviar o arquivo.");
  return result;
}


function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function validatePublicFormSubmission(formElement) {
  const honeypot = String(formElement?.elements?.website?.value || "").trim();

  if (honeypot) {
    return "Nao foi possivel validar o envio. Recarregue a pagina e tente novamente.";
  }

  return null;
}

function getPublicChallengeToken(formElement) {
  return String(
    formElement?.querySelector('[name="cf-turnstile-response"]')?.value ||
    formElement?.elements?.turnstileToken?.value ||
    ""
  ).trim();
}

function loadTurnstileScript() {
  if (document.querySelector('script[data-turnstile-loader]')) return;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  script.dataset.turnstileLoader = "true";
  document.head.appendChild(script);
}

function ensurePublicCaptchaNotice(formElement) {
  const config = getHubPostgreSQLConfig();
  if (!formElement || !config.turnstileSiteKey || formElement.querySelector(".cf-turnstile")) return;

  loadTurnstileScript();
  const target = document.createElement("div");
  target.className = "cf-turnstile";
  target.dataset.sitekey = config.turnstileSiteKey;
  formElement.querySelector('button[type="submit"]')?.before(target);
}

async function submitPublicRecord(collection, payload, turnstileToken = "") {
  const table = TABLES[collection];
  if (!table) throw new Error("Tipo de envio invalido.");
  const response = await fetch(`/api/records?table=${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-client-id": getPublicClientId() },
    body: JSON.stringify({ rows: [{ ...payload, created_by: payload.created_by || "Publico" }] }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function submitPublicApplicationWithFile({ vaga_id, nome, telefone, cpf, curriculo, turnstileToken }) {
  const safeName = safePublicFileName(curriculo?.name || "curriculo.pdf");
  const resumePath = `${RESUME_PUBLIC_PREFIX}/${generateUUID()}/${safeName}`;
  const upload = await uploadPublicFile(curriculo, resumePath);
  const response = await fetch(`/api/records?table=${encodeURIComponent(TABLES.candidaturas)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-client-id": getPublicClientId() },
    body: JSON.stringify({
      rows: [{
        vaga_id,
        nome,
        telefone,
        cpf,
        curriculo_url: upload?.path || resumePath,
        created_by: "Publico",
      }],
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function submitPublicContractorDocuments({ empresa, origemHtml, nome, telefone, cpf, email, documentos, accessPassword, turnstileToken }) {
  const uploadedDocuments = await buildContractorDocumentPayload(documentos, generateUUID());

  const attempts = [{ url: "/api/contractor-documents", type: "documentosContratados", localApi: true }];

  let lastError = null;
  for (const attempt of attempts) {
    const response = await fetch(attempt.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa: String(empresa || ""),
        origemHtml: String(origemHtml || ""),
        nome: String(nome || ""),
        telefone: String(telefone || ""),
        cpf: String(cpf || ""),
        email: String(email || ""),
        accessPassword: String(accessPassword || ""),
        documentos: uploadedDocuments,
        turnstileToken: String(turnstileToken || ""),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      const savedRecord = mapContractorDocumentRow(result.data || {});
      if (savedRecord.id) {
        data.documentosContratados = mergeContractorDocuments([savedRecord], data.documentosContratados || []);
        saveLocalData();
      }
      return result.data;
    }

    lastError = new Error(result.error || "Envio publico bloqueado.");
    lastError.code = result.code;
    lastError.status = response.status;
    const canTryNext = /tipo invalido|not found|not_found|funcao sem postgres_service_role_key|function not found|schema cache|row-level security/i.test(lastError.message)
      || [400, 401, 404, 405, 500].includes(response.status);
    if (!canTryNext) throw lastError;
  }

  throw new Error(lastError?.message || "Nao foi possivel salvar os documentos no PostgreSQL. O envio nao foi registrado para o RH.");
}

function isPublicInsertOnlyCollection(collection) {
  return isPublicSubmissionFormPage() && ["denuncias", "feedbacks", "chamados", "candidaturas", "documentosContratados", "climaPesquisas"].includes(collection);
}

function toPublicSubmissionPayload(collection, values) {
  if (collection === "denuncias") {
    return {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: String(values.descricao || "").trim(),
      status: "Aberta",
    };
  }

  if (collection === "feedbacks") {
    return {
      tipo: String(values.tipo || "Sugestao").trim(),
      mensagem: String(values.mensagem || "").trim(),
      autor_nome: String(values.autorNome || values.nome || "").trim(),
      autor_email: String(values.autorEmail || values.email || "").trim() || null,
      status: "Novo",
      created_by: String(values.autorNome || values.nome || "Formulario publico").trim(),
    };
  }

  if (collection === "chamados") {
    return {
      solicitante: String(values.solicitante || "").trim(),
      unidade: String(values.unidade || "").trim(),
      setor: String(values.setor || "").trim(),
      epis: String(values.epis || "").trim(),
      observacoes: String(values.observacoes || "").trim(),
      status: "Aberto",
      created_by: "Publico",
    };
  }

  return toDbPayload(collection, values);
}

function appendLocalInsertedItem(collection, values) {
  data[collection].unshift({
    id: generateUUID(),
    createdAt: todayLabel(),
    sortAt: new Date().toISOString(),
    createdBy: values.createdBy || getCurrentUserName(),
    ...values,
  });
}

