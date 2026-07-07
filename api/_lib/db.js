import { neon } from "@neondatabase/serverless";

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

let cached = null;

export function sql() {
  if (!cached) {
    const url = envValue("DATABASE_URL");
    if (!url) throw new Error("DATABASE_URL nao configurada.");
    cached = neon(url);
  }
  return cached(...arguments);
}
