function formatAudioDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}
function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function parseBrazilianCurrency(value) {
  const normalized = String(value || "").replace(/[^\d,]/g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function formatCurrencyInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const reais = String(Number(padded.slice(0, -2)));
  const centavos = padded.slice(-2);
  return `${reais},${centavos}`;
}

function formatVtReportDateTime(value = new Date()) {
  if (value instanceof Date) {
    return value.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return String(value || "")
    .replace(/(\d{1,2}:\d{2}):\d{2}/, "$1")
    .replace(/,\s*/g, " ")
    .trim();
}
