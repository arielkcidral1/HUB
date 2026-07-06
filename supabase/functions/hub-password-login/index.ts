import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const ALLOWED_ORIGINS = new Set(["https://hub-opal-nine.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-client-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

function normalizeCpf(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(value: unknown) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function getClientIdentifier(req: Request) {
  const clientId = String(req.headers.get("x-hub-client-id") || "");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
    return `client:${clientId.toLowerCase()}`;
  }
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    `ua:${req.headers.get("user-agent") || "unknown"}`;
}

function formatCpf(value: string) {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Metodo nao permitido." });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return json(req, 500, { error: "Funcao sem configuracao de servico." });

  let body: { cpf?: unknown; email?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return json(req, 400, { error: "Credenciais invalidas." }); }
  const cpf = normalizeCpf(body.cpf);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if ((!isValidCpf(cpf) && !isEmail) || !password) return json(req, 400, { error: "Credenciais invalidas." });

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const rateRequestId = crypto.randomUUID();
  const { data: allowed, error: rateError } = await admin.rpc("hub_reserve_public_rate_limit", {
    p_form_type: "login_cpf",
    p_ip_hash: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${Deno.env.get("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(req)}`)).then((hash) => Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("")),
    p_window_seconds: 600,
    p_max: 5,
    p_request_id: rateRequestId,
  });
  if (rateError || !allowed) return json(req, 429, { error: "Muitas tentativas. Tente novamente mais tarde." });

  let loginEmail = email;
  if (!isEmail) {
    const formattedCpf = formatCpf(cpf);
    const { data: profiles } = await admin
      .from("hub_users")
      .select("email, cpf")
      .or(`cpf.eq.${cpf},cpf.eq.${formattedCpf}`)
      .limit(1);
    loginEmail = profiles?.[0]?.email || "";
  }
  if (!loginEmail) return json(req, 401, { error: "Credenciais invalidas." });

  const { data, error } = await admin.auth.signInWithPassword({ email: loginEmail, password });
  if (error || !data.session) return json(req, 401, { error: "Credenciais invalidas." });
  return json(req, 200, { session: data.session });
});
