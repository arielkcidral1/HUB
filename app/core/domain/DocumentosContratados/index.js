// Dominio: normalizacao e mesclagem de documentos de contratados (upload publico).

function inferContractorDocumentSource(origemHtml = "", empresa = "") {
  const source = String(origemHtml || "").trim();
  if (source) return source;
  const normalizedCompany = String(empresa || "").toLowerCase();
  if (normalizedCompany.includes("fredy")) return "documentos-fredy.html";
  if (normalizedCompany.includes("besten")) return "documentos-besten.html";
  if (normalizedCompany.includes("achei")) return "documentos-achei.html";
  if (normalizedCompany.includes("trinca")) return "documentos-trinca.html";
  return "";
}

function parseContractorDocumentsValue(value) {
  const normalizeDoc = (doc = {}) => ({
    name: doc.name || doc.nome || doc.filename || doc.fileName || "documento",
    size: doc.size || doc.tamanho || 0,
    type: doc.type || doc.mime || doc.mimeType || doc.contentType || "application/octet-stream",
    dataUrl: doc.dataUrl || doc.data_url || doc.url || "",
    path: doc.path || doc.storagePath || doc.storage_path || "",
  });
  if (Array.isArray(value)) return value.map(normalizeDoc);
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(normalizeDoc) : parsed ? [normalizeDoc(parsed)] : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object") return [normalizeDoc(value)];
  return [];
}

function mapContractorDocumentRow(row = {}) {
  return {
    id: row.id,
    empresa: row.empresa || "",
    origemHtml: inferContractorDocumentSource(row.origem_html || row.origemHtml, row.empresa),
    nome: row.nome || "",
    cpf: row.cpf || "",
    telefone: row.telefone || "",
    email: row.email || "",
    documentos: parseContractorDocumentsValue(row.documentos),
    createdBy: row.created_by || row.createdBy || "Publico",
    createdAt: formatDateTime(row.created_at || row.createdAt),
    sortAt: row.created_at || row.sortAt || row.createdAt || "",
    pendingSync: Boolean(row.pendingSync),
  };
}

function getContractorDocumentIdentity(item = {}) {
  return [
    normalizeCpf(item.cpf || ""),
    String(item.nome || "").trim().toLowerCase(),
    String(item.empresa || "").trim().toLowerCase(),
    String(item.origemHtml || "").trim().toLowerCase(),
    String(item.createdAt || "").trim().toLowerCase(),
  ].join("|");
}

function mergeContractorDocuments(localItems = [], remoteItems = []) {
  const merged = [];
  const seen = new Set();
  [...localItems, ...remoteItems].forEach((item) => {
    const normalized = {
      ...item,
      origemHtml: inferContractorDocumentSource(item.origemHtml, item.empresa),
      documentos: Array.isArray(item.documentos) ? item.documentos : [],
    };
    const key = String(normalized.id || "").startsWith("local-")
      ? getContractorDocumentIdentity(normalized)
      : String(normalized.id || getContractorDocumentIdentity(normalized));
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  });
  return merged;
}

function loadPendingContractorDocuments() {
  return storageService.getLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, []);
}

function savePendingContractorDocuments(items = []) {
  storageService.setLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, items);
}

function addPendingContractorDocument(item) {
  const pending = mergeContractorDocuments([item], loadPendingContractorDocuments());
  savePendingContractorDocuments(pending);
  return pending;
}

function removePendingContractorDocument(id) {
  const remaining = loadPendingContractorDocuments().filter((item) => String(item.id) !== String(id));
  savePendingContractorDocuments(remaining);
  return remaining;
}
