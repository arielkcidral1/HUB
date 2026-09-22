const STORAGE_KEY = "hub-rh-data";
const DOCUMENT_RECORDS_KEY = "hub-document-records";
const CONTRACTOR_PENDING_DOCUMENTS_KEY = "hub-contractor-pending-documents";
const SESSION_KEY = "hub-rh-session";
const PERSISTED_AUTH_USER_KEY = "hub-rh-persisted-auth-user";
const LAST_ACCOUNT_KEY = "hub-rh-last-account";
const POSTGRES_SESSION_KEY = "hub-postgres-session";
const ACCOUNT_LOADING_REAUTH_MS = 2000;
const POSTGRES_BOOT_TIMEOUT_MS = 8000;
const PUBLIC_CLIENT_ID_KEY = "hub-public-client-id";
const TEAM_USERS_KEY = "hub-team-users";
const TEAM_CREDENTIALS_KEY = "hub-team-credentials";
const READ_RH_MESSAGES_KEY = "hub-rh-read-message-ids";
const READ_NOTIFICATIONS_KEY = "hub-rh-read-notification-ids";
const SHOWN_NOTIFICATIONS_KEY = "hub-rh-shown-notification-ids";
const DISMISSED_NOTIFICATIONS_KEY = "hub-rh-dismissed-notification-ids";
const USER_SETTINGS_STORAGE_KEY = "hub-user-settings-v1";

const SENSITIVE_CLIENT_CACHE_KEYS = [
  STORAGE_KEY,
  DOCUMENT_RECORDS_KEY,
  TEAM_USERS_KEY,
  TEAM_CREDENTIALS_KEY,
];
