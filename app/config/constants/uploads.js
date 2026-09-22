const RESUME_BUCKET = "hub-curriculos";
const RESUME_PUBLIC_PREFIX = "candidaturas";
const CONTRACTOR_DOCUMENTS_BUCKET = "hub-contratados-documentos";
const ATESTADOS_BUCKET = "hub-atestados";

const ATESTADO_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const RESUME_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const RESUME_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const CHAT_FILE_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const CHAT_FILE_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const CHAT_FILE_MIME_ALIASES = new Map([
  ["audio/x-wav", "audio/wav"],
  ["audio/wave", "audio/wav"],
  ["audio/x-m4a", "audio/mp4"],
  ["audio/mp4", "audio/mp4"],
]);
const CHAT_FILE_EXTENSION_MIME_TYPES = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
  ["mp3", "audio/mpeg"],
  ["wav", "audio/wav"],
  ["ogg", "audio/ogg"],
  ["webm", "audio/webm"],
  ["m4a", "audio/mp4"],
  ["mp4", "video/mp4"],
  ["mov", "video/quicktime"],
]);
