import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const ALLOWED_ORIGINS = new Set([
  "https://hub-opal-nine.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function asText(value: unknown) {
  return String(value || "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, 405, { error: "Metodo nao permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, 500, { error: "Funcao sem configuracao de servico." });
  }

  if (!token) {
    return json(req, 401, { error: "Autenticacao obrigatoria." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) {
    return json(req, 401, { error: "Sessao invalida." });
  }

  let body: { nome?: unknown; foto_perfil?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: "JSON invalido." });
  }

  const nome = asText(body.nome);
  const fotoPerfil = body.foto_perfil === null || body.foto_perfil === undefined
    ? null
    : asText(body.foto_perfil);

  if (nome.length < 2 || nome.length > 120 || /[\x00-\x1F\x7F]/.test(nome)) {
    return json(req, 400, { error: "Nome invalido." });
  }

  if (fotoPerfil !== null && fotoPerfil !== "" && !/^avatars\/[A-Za-z0-9][A-Za-z0-9_.-]{0,240}$/.test(fotoPerfil)) {
    return json(req, 400, { error: "Caminho de foto invalido." });
  }

  const { data, error } = await supabase
    .from("hub_users")
    .update({
      nome,
      ...(fotoPerfil === null ? {} : { foto_perfil: fotoPerfil || null }),
    })
    .ilike("email", userData.user.email)
    .select("id, nome, email, cargo, foto_perfil, created_by, created_at")
    .single();

  if (error) {
    return json(req, 400, { error: error.message, code: error.code });
  }

  return json(req, 200, { data });
});
