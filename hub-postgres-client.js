(function () {
  function toParams(params) {
    return new URLSearchParams(params).toString();
  }

  function jsonHeaders() {
    return { "Content-Type": "application/json" };
  }

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(path, options);
    } catch (error) {
      return {
        data: null,
        error: {
          message: error?.message || "Nao foi possivel conectar ao PostgreSQL.",
          cause: error,
        },
      };
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = result?.message || result?.error || response.statusText || "Erro no PostgreSQL.";
      return { data: null, error: { ...result, message, status: response.status } };
    }
    return { data: result.data ?? result, error: null };
  }

  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.orders = [];
      this.limitValue = null;
      this.selectColumns = "*";
      this.action = "select";
      this.payload = null;
      this.singleResult = false;
    }

    select(columns = "*") {
      this.selectColumns = columns;
      return this;
    }

    insert(payload) {
      this.action = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.action = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    eq(column, value) {
      this.filters.push({ column, op: "eq", value });
      return this;
    }

    ilike(column, value) {
      this.filters.push({ column, op: "ilike", value });
      return this;
    }

    in(column, value) {
      this.filters.push({ column, op: "in", value });
      return this;
    }

    or(expression) {
      const parts = String(expression || "").split(",");
      const conditions = [];
      parts.forEach((part) => {
        const [column, op, ...rest] = part.split(".");
        if (column && op && rest.length) conditions.push({ column, op, value: rest.join(".") });
      });
      if (conditions.length) this.filters.push({ op: "or", conditions });
      return this;
    }

    order(column, options = {}) {
      this.orders.push({ column, ascending: options.ascending !== false });
      return this;
    }

    limit(value) {
      this.limitValue = value;
      return this;
    }

    single() {
      this.singleResult = true;
      return this;
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }

    async execute() {
      const params = toParams({
        table: this.table,
        select: this.selectColumns,
        filters: JSON.stringify(this.filters),
        order: JSON.stringify(this.orders),
        ...(this.limitValue ? { limit: String(this.limitValue) } : {}),
      });

      let result;
      if (this.action === "select") {
        result = await request(`/api/records?${params}`);
      } else if (this.action === "insert") {
        result = await request(`/api/records?table=${encodeURIComponent(this.table)}`, {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({ rows: Array.isArray(this.payload) ? this.payload : [this.payload] }),
        });
      } else if (this.action === "update") {
        result = await request(`/api/records?table=${encodeURIComponent(this.table)}`, {
          method: "PATCH",
          headers: jsonHeaders(),
          body: JSON.stringify({ row: this.payload, filters: this.filters }),
        });
      } else {
        result = await request(`/api/records?table=${encodeURIComponent(this.table)}`, {
          method: "DELETE",
          headers: jsonHeaders(),
          body: JSON.stringify({ filters: this.filters }),
        });
      }

      if (result.error) return result;
      const rows = Array.isArray(result.data) ? result.data : [];
      return { data: this.singleResult ? rows[0] || null : rows, error: null };
    }
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  window.HubPostgresClient = {
    createClient() {
      const sessionStorageKey = "hub-postgres-session";
      const readStoredSession = () => {
        try {
          return JSON.parse(window.localStorage.getItem(sessionStorageKey) || window.sessionStorage.getItem(sessionStorageKey) || "null");
        } catch {
          return null;
        }
      };
      const persistSession = (nextSession) => {
        if (!nextSession) {
          window.sessionStorage.removeItem(sessionStorageKey);
          window.localStorage.removeItem(sessionStorageKey);
          return;
        }
        const serialized = JSON.stringify(nextSession);
        window.sessionStorage.setItem(sessionStorageKey, serialized);
        window.localStorage.setItem(sessionStorageKey, serialized);
      };
      let session = readStoredSession();
      return {
        from(table) {
          return new Query(table);
        },
        channel() {
          return {
            on() { return this; },
            subscribe(callback) {
              callback?.("SUBSCRIBED");
              return this;
            },
            unsubscribe() {},
          };
        },
        auth: {
          async getUser() {
            if (!session?.user) {
              const restored = await this.getSession();
              session = restored.data?.session || session;
            }
            return { data: { user: session?.user || null }, error: null };
          },
          async getSession() {
            if (!session?.user) {
              const result = await request("/api/auth", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ action: "session" }),
              });
              if (!result.error && result.data?.session?.user) {
                session = result.data.session;
                persistSession(session);
              }
            }
            return { data: { session }, error: null };
          },
          async setSession(nextSession) {
            session = nextSession;
            persistSession(session);
            return { data: { session, user: session?.user || null }, error: null };
          },
          async signInWithPassword({ email, password }) {
            const result = await request("/api/auth", {
              method: "POST",
              headers: jsonHeaders(),
              body: JSON.stringify({ identifier: email, password }),
            });
            if (result.error) return { data: null, error: result.error };
            session = result.data.session;
            persistSession(session);
            return { data: { session, user: session.user }, error: null };
          },
          async updateUser() {
            return { data: {}, error: null };
          },
          async signOut() {
            session = null;
            persistSession(null);
            await request("/api/auth", {
              method: "POST",
              headers: jsonHeaders(),
              body: JSON.stringify({ action: "logout" }),
            });
            return { error: null };
          },
        },
        storage: {
          from() {
            return {
              async upload(path, file) {
                const dataUrl = await fileToDataUrl(file);
                const result = await request("/api/files", {
                  method: "POST",
                  headers: jsonHeaders(),
                  body: JSON.stringify({ path, name: file.name, size: file.size, type: file.type, dataUrl }),
                });
                return { data: result.data, error: result.error };
              },
              async createSignedUrl(path) {
                return { data: { signedUrl: path }, error: null };
              },
            };
          },
        },
      };
    },
  };
})();
