import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const ALLOWED_ORIGINS = new Set(["https://hub-opal-nine.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"]);
function headers(req: Request) {
  const origin = req.headers.get("origin") || "";
  return { "Content-Type": "application/json", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}) };
}
function json(req: Request, status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: headers(req) }); }
async function sha256(value: string) { const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Metodo nao permitido." });
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!url || !key || !token) return json(req, 401, { error: "Autenticacao obrigatoria." });
  let body: { id?: unknown; password?: unknown }; try { body = await req.json(); } catch { return json(req, 400, { error: "JSON invalido." }); }
  const id = Number(body.id), password = String(body.password || "");
  if (!Number.isSafeInteger(id) || id <= 0 || !password) return json(req, 400, { error: "Dados invalidos." });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user?.email) return json(req, 401, { error: "Sessao invalida." });
  const { data: profile } = await admin.from("hub_users").select("cargo").ilike("email", auth.user.email).maybeSingle();
  if (String(profile?.cargo || "").trim().toLowerCase() !== "rh") return json(req, 403, { error: "Permissao insuficiente." });
  const { data: passwordHash } = await admin.rpc("hub_get_action_password_hash", { p_action: "delete_malote" });
  if (!passwordHash || (await sha256(password)) !== passwordHash) return json(req, 403, { error: "Senha de autorizacao invalida." });
  const { error } = await admin.from("hub_malotes").delete().eq("id", id);
  if (error) return json(req, 400, { error: error.message });
  return json(req, 200, { success: true });
});
