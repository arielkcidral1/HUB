import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const ALLOWED_ORIGINS = new Set([
  "https://hub-opal-nine.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const RATE_LIMITS = {
  denuncias: { windowSeconds: 60 * 10, max: 5 },
  chamados: { windowSeconds: 60 * 10, max: 3 },
  candidaturas: { windowSeconds: 60 * 30, max: 2 },
  documentosContratados: { windowSeconds: 60 * 30, max: 3 },
};

const SUBMISSION_TABLES = {
  denuncias: "hub_denuncias",
  chamados: "hub_chamados",
  candidaturas: "hub_candidaturas",
  documentosContratados: "hub_documentos_contratados",
} as const;

type SubmissionType = keyof typeof RATE_LIMITS;

const RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const RESUME_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const CONTRACTOR_ACCESS_PASSWORDS: Record<string, string> = {
  "Fredy Pneus": "fredy5212",
  "Besten Pneus": "besten5212",
  "Achei Pneus": "Achei5212",
  "Trinca Mkt": "trinca5212",
};

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function hasAllowedOrigin(req: Request) {
  return ALLOWED_ORIGINS.has(req.headers.get("origin") || "");
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Connection": "keep-alive",
    },
  });
}

function asText(value: unknown) {
  return String(value || "").trim();
}

function normalizeContractorDocumentMimeType(mimeType: unknown) {
  const provided = asText(mimeType).toLowerCase();
  return provided || "application/octet-stream";
}

function validLength(value: unknown, min: number, max: number) {
  const text = asText(value);
  return text.length >= min && text.length <= max;
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: Request) {
  const address = (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip")
  );
  if (address) return address;

  // A Edge Function pode não receber um IP de origem em alguns ambientes.
  // Não compartilhe um único bucket de rate limit entre todos esses visitantes.
  return `ua:${req.headers.get("user-agent") || "unknown"}`;
}

function isSubmissionType(value: string): value is SubmissionType {
  return value in RATE_LIMITS;
}

function normalizeSubmissionType(value: unknown, payload: Record<string, unknown> = {}) {
  const raw = asText(value);
  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (["denuncia", "denuncias"].includes(normalized)) return "denuncias";
  if (["chamado", "chamados"].includes(normalized)) return "chamados";
  if (["candidatura", "candidaturas", "vaga", "vagas"].includes(normalized)) return "candidaturas";
  if ([
    "documentoscontratados",
    "documentocontratado",
    "documentosdecontratados",
    "contratados",
    "contratado",
    "documentos",
    "documento",
  ].includes(normalized)) return "documentosContratados";
  if (
    payload
    && (
      payload.empresa
      || payload.origemHtml
      || payload.accessPassword
      || (Array.isArray(payload.documentos) && payload.documentos.length)
    )
  ) return "documentosContratados";
  return raw;
}

function validatePayload(type: string, payload: Record<string, unknown>) {
  if (type === "denuncias") {
    if (payload.identificacao && payload.identificacao !== "Anonimo") return "Identificacao invalida.";
    if (payload.categoria && payload.categoria !== "Denuncia anonima") return "Categoria invalida.";
    if (payload.status && payload.status !== "Aberta") return "Status invalido.";
    if (!validLength(payload.descricao, 1, 4000)) return "Descricao invalida.";
    return null;
  }

  if (type === "chamados") {
    if (payload.status && payload.status !== "Aberto") return "Status invalido.";
    if (payload.created_by && payload.created_by !== "Publico") return "Origem invalida.";
    if (!validLength(payload.solicitante, 3, 120)) return "Solicitante invalido.";
    if (!validLength(payload.unidade, 2, 120)) return "Unidade invalida.";
    if (!validLength(payload.epis, 3, 1500)) return "Itens invalidos.";
    if (asText(payload.observacoes).length > 1000) return "Observacoes muito longas.";
    return null;
  }

  if (type === "candidaturas") {
    if (!Number.isSafeInteger(Number(payload.vaga_id)) || Number(payload.vaga_id) <= 0) return "Vaga invalida.";
    if (!validLength(payload.nome, 3, 160)) return "Nome invalido.";
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(asText(payload.cpf))) return "CPF invalido.";
    if (!/^\d{10,11}$/.test(asText(payload.telefone).replace(/\D/g, ""))) return "Telefone invalido.";
    if (!/^candidaturas\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9][a-z0-9_.-]*\.(pdf|doc|docx)$/.test(asText(payload.curriculo_url))) {
      return "Curriculo invalido.";
    }
    return null;
  }

  if (type === "documentosContratados") {
    if (!["Fredy Pneus", "Besten Pneus", "Achei Pneus", "Trinca Mkt"].includes(asText(payload.empresa))) return "Empresa invalida.";
    if (!/^documentos-(fredy|besten|achei|trinca)\.html$/.test(asText(payload.origemHtml))) return "Origem invalida.";
    if (CONTRACTOR_ACCESS_PASSWORDS[asText(payload.empresa)] !== asText(payload.accessPassword)) return "Senha de acesso invalida.";
    if (!validLength(payload.nome, 3, 160)) return "Nome invalido.";
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(asText(payload.cpf))) return "CPF invalido.";
    if (!/^\d{10,11}$/.test(asText(payload.telefone).replace(/\D/g, ""))) return "Telefone invalido.";
    if (!Array.isArray(payload.documentos) || !payload.documentos.length || payload.documentos.length > 20) return "Documentos invalidos.";
    const validPaths = payload.documentos.every((doc) => {
      const item = doc as { path?: unknown; name?: unknown; size?: unknown; type?: unknown };
      return /^contratados\/[0-9a-f-]{36}\/[a-z0-9][a-z0-9_.-]*(?:\.[a-z0-9][a-z0-9_-]*)?$/.test(asText(item.path))
        && validLength(item.name, 1, 180)
        && Number(item.size) > 0
        && Number(item.size) <= CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES;
    });
    if (!validPaths) return "Documentos invalidos.";
    return null;
  }

  return "Tipo invalido.";
}

function toInsertPayload(type: SubmissionType, payload: Record<string, unknown>) {
  if (type === "denuncias") {
    return {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: asText(payload.descricao),
      status: "Aberta",
    };
  }

  if (type === "chamados") {
    return {
      solicitante: asText(payload.solicitante),
      unidade: asText(payload.unidade),
      setor: asText(payload.setor),
      epis: asText(payload.epis),
      observacoes: asText(payload.observacoes),
      status: "Aberto",
      created_by: "Publico",
    };
  }

  if (type === "documentosContratados") {
    return {
      empresa: asText(payload.empresa),
      origem_html: asText(payload.origemHtml),
      nome: asText(payload.nome),
      telefone: asText(payload.telefone),
      cpf: asText(payload.cpf),
      documentos: payload.documentos,
      created_by: "Publico",
    };
  }

  return {
    vaga_id: Number(payload.vaga_id),
    nome: asText(payload.nome),
    telefone: asText(payload.telefone),
    cpf: asText(payload.cpf),
    curriculo_url: asText(payload.curriculo_url),
  };
}

async function validateContractorDocumentFile(file: File | null) {
  if (!file || !file.name) return "Documento obrigatorio.";
  if (file.size <= 0 || file.size > CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES) {
    return "Cada documento deve ter entre 1 byte e 10 MB.";
  }
  return null;
}

async function validateResumeFile(file: File | null) {
  if (!file || !file.name) return "Curriculo obrigatorio.";

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = String(file.type || "").toLowerCase();

  if (!RESUME_ALLOWED_EXTENSIONS.has(extension) || !RESUME_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas arquivos PDF, DOC ou DOCX.";
  }

  if (file.size <= 0 || file.size > RESUME_MAX_SIZE_BYTES) {
    return "O curriculo deve ter entre 1 byte e 5 MB.";
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => signature[index] === byte);
  const validSignature =
    (extension === "pdf" && startsWith(0x25, 0x50, 0x44, 0x46, 0x2d)) ||
    (extension === "doc" && startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)) ||
    (extension === "docx" && startsWith(0x50, 0x4b, 0x03, 0x04));

  if (!validSignature) return "O conteudo do curriculo nao corresponde ao formato informado.";

  return null;
}

function safeFileName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
  return cleaned || "curriculo.pdf";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    if (!hasAllowedOrigin(req)) return json(req, 403, { error: "Origem nao permitida." });
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (!hasAllowedOrigin(req)) return json(req, 403, { error: "Origem nao permitida." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, 500, { error: "Funcao sem configuracao de servico." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("type") !== "vagas") {
      return json(req, 400, { error: "Tipo invalido." });
    }

    const { data, error } = await supabase
      .from("hub_vagas")
      .select("*")
      .eq("status", "Aberta")
      .order("created_at", { ascending: false });

    if (error) return json(req, 400, { error: error.message, code: error.code });
    return json(req, 200, { data: data || [] });
  }

  if (req.method !== "POST") {
    return json(req, 405, { error: "Metodo nao permitido." });
  }

  const contentType = req.headers.get("content-type") || "";
  const url = new URL(req.url);
  let type = "";
  let payload: Record<string, unknown> = {};
  let turnstileToken = "";
  let resumeFile: File | null = null;
  let contractorDocumentFiles: File[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      type = normalizeSubmissionType(
        formData.get("type") || url.searchParams.get("type") || formData.get("submissionType") || formData.get("tipo"),
      );
      if (!isSubmissionType(type) && (formData.has("empresa") || formData.has("origemHtml") || formData.has("accessPassword") || formData.has("documentos"))) {
        type = "documentosContratados";
      }
      turnstileToken = asText(formData.get("turnstileToken"));
      resumeFile = formData.get("curriculo") instanceof File ? formData.get("curriculo") as File : null;
      if (type === "documentosContratados") {
        contractorDocumentFiles = formData.getAll("documentos").filter((file): file is File => file instanceof File && Boolean(file.name));
        const documentBatchId = crypto.randomUUID();
        payload = {
          empresa: asText(formData.get("empresa")),
          origemHtml: asText(formData.get("origemHtml")),
          accessPassword: asText(formData.get("accessPassword")),
          nome: asText(formData.get("nome")),
          telefone: asText(formData.get("telefone")),
          cpf: asText(formData.get("cpf")),
          documentos: contractorDocumentFiles.map((file) => {
            const safeName = safeFileName(file.name);
            return { name: safeName, size: file.size, type: normalizeContractorDocumentMimeType(file.type), path: `contratados/${documentBatchId}/${safeName}` };
          }),
        };
        type = normalizeSubmissionType(type, payload);
      } else {
        payload = {
          vaga_id: Number(asText(formData.get("vaga_id"))),
          nome: asText(formData.get("nome")),
          telefone: asText(formData.get("telefone")),
          cpf: asText(formData.get("cpf")),
        };
      }
    } else {
      const body = await req.json() as { type?: string; payload?: Record<string, unknown>; turnstileToken?: string };
      type = normalizeSubmissionType(body.type || url.searchParams.get("type") || body.payload?.type || body.payload?.tipo, body.payload || {});
      payload = body.payload || {};
      turnstileToken = asText(body.turnstileToken);
    }
  } catch {
    return json(req, 400, { error: contentType.includes("multipart/form-data") ? "Formulario invalido." : "JSON invalido." });
  }

  if (!isSubmissionType(type)) {
    return json(req, 400, { error: "Tipo invalido." });
  }

  if (resumeFile && type === "candidaturas") {
    const path = `candidaturas/${crypto.randomUUID()}/${safeFileName(resumeFile.name)}`;
    payload.curriculo_url = path;
  }

  if (type === "documentosContratados" && !contentType.includes("multipart/form-data")) {
    return json(req, 400, { error: "Formulario de documentos invalido." });
  }

  const validationError = validatePayload(type, payload);
  if (validationError) {
    return json(req, 400, { error: validationError });
  }

  if (type === "candidaturas" && contentType.includes("multipart/form-data")) {
    const resumeError = await validateResumeFile(resumeFile);
    if (resumeError) return json(req, 400, { error: resumeError });
  }

  if (type === "documentosContratados" && contentType.includes("multipart/form-data")) {
    for (const file of contractorDocumentFiles) {
      const fileError = await validateContractorDocumentFile(file);
      if (fileError) return json(req, 400, { error: fileError });
    }
  }

  const insertPayload = toInsertPayload(type, payload);
  const resumePath = type === "candidaturas" ? asText(payload.curriculo_url) : "";

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (turnstileSecret) {
    const formData = new FormData();
    formData.append("secret", turnstileSecret);
    formData.append("response", turnstileToken);
    formData.append("remoteip", getClientIp(req));

    const challenge = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json() as Promise<{ success?: boolean }>)
      .catch((): { success: false } => ({ success: false }));

    if (!challenge.success) {
      return json(req, 403, { error: "Validacao anti-spam falhou." });
    }
  }

  const ipHash = await sha256(`${Deno.env.get("RATE_LIMIT_SALT") || "hub"}:${getClientIp(req)}`);
  const limit = RATE_LIMITS[type];

  const rateRequestId = crypto.randomUUID();
  const { data: rateAllowed, error: rateError } = await supabase
    .rpc("hub_reserve_public_rate_limit", {
      p_form_type: type,
      p_ip_hash: ipHash,
      p_window_seconds: limit.windowSeconds,
      p_max: limit.max,
      p_request_id: rateRequestId,
    });

  if (rateError) return json(req, 500, { error: "Falha no rate limit." });
  if (!rateAllowed) {
    return json(req, 429, { error: "Muitos envios. Tente novamente mais tarde." });
  }

  if (resumeFile && type === "candidaturas") {
    const { error: uploadError } = await supabase.storage
      .from("hub-curriculos")
      .upload(resumePath, resumeFile, {
        cacheControl: "3600",
        contentType: resumeFile.type,
        upsert: false,
      });

    if (uploadError) {
      await supabase.rpc("hub_release_public_rate_limit", { p_request_id: rateRequestId });
      return json(req, 400, { error: uploadError.message });
    }
  }

  const uploadedContractorPaths: string[] = [];
  if (type === "documentosContratados" && contractorDocumentFiles.length) {
    const documents = Array.isArray(payload.documentos) ? payload.documentos as Array<{ path: string; type: string }> : [];
    for (let index = 0; index < contractorDocumentFiles.length; index += 1) {
      const file = contractorDocumentFiles[index];
      const documentMeta = documents[index];
      const { error: uploadError } = await supabase.storage
        .from("hub-contratados-documentos")
        .upload(documentMeta.path, file, {
          cacheControl: "3600",
          contentType: normalizeContractorDocumentMimeType(file.type),
          upsert: false,
        });

      if (uploadError) {
        await supabase.rpc("hub_release_public_rate_limit", { p_request_id: rateRequestId });
        if (uploadedContractorPaths.length) await supabase.storage.from("hub-contratados-documentos").remove(uploadedContractorPaths);
        return json(req, 400, { error: uploadError.message });
      }
      uploadedContractorPaths.push(documentMeta.path);
    }
  }

  const table = SUBMISSION_TABLES[type];

  const { data, error } = await supabase
    .from(table)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    await supabase.rpc("hub_release_public_rate_limit", { p_request_id: rateRequestId });
    if (resumeFile && resumePath) {
      await supabase.storage.from("hub-curriculos").remove([resumePath]);
    }
    if (uploadedContractorPaths.length) {
      await supabase.storage.from("hub-contratados-documentos").remove(uploadedContractorPaths);
    }
    const status = error.code === "23505" ? 409 : 400;
    const message = error.code === "23505" && type === "documentosContratados"
      ? "CPF ja possui envio de documentos registrado."
      : error.message;
    return json(req, status, { error: message, code: error.code });
  }

  return json(req, 200, { data });
});
