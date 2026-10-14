import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================
// DIAGNÓSTICO DAS REQUISIÇÕES
// =============================================

if (import.meta.env.DEV) {
  console.log("[MIQFLIX API] Base URL:", API_URL);

  api.interceptors.request.use((config) => {
    console.log("[MIQFLIX REQUEST]", {
      method: config.method?.toUpperCase(),
      url: api.getUri(config),
    });

    return config;
  });
}

// =============================================
// TRATAMENTO GLOBAL DE ERROS
// =============================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    const expectedUnauthorized =
      error.response?.status === 401 && error.config?.url === "/auth/me";

    if (import.meta.env.DEV && !expectedUnauthorized) {
      console.error("[MIQFLIX API ERROR]", {
        url: error.config ? api.getUri(error.config) : undefined,
        status: error.response?.status,
        code: error.code,
        originalMessage: error.message,
        response: error.response?.data,
      });
    }

    if (error.response) {
      const serverMessage =
        error.response.data?.error || error.response.data?.message;

      error.message =
        typeof serverMessage === "string"
          ? serverMessage
          : `Erro HTTP ${status}`;
    } else if (error.code === "ECONNABORTED") {
      error.message = "O servidor demorou muito para responder.";
    } else if (error.code === "ERR_NETWORK") {
      error.message = "Falha de rede. Verifique a API, o proxy ou o CORS.";
    }

    return Promise.reject(error);
  },
);

// =============================================
// AUTENTICAÇÃO
// =============================================

export const authApi = {
  async me() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async login(email, password) {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    return data;
  },

  async register(name, email, password) {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return data;
  },

  async logout() {
    const { data } = await api.post("/auth/logout");
    return data;
  },
};

// =============================================
// ASSINATURAS
// =============================================

export const subscriptionApi = {
  async plans() {
    const { data } = await api.get("/subscriptions/plans");

    return data;
  },

  async access() {
    const { data } = await api.get("/subscriptions/access");

    return data;
  },

  async checkout(planId) {
    const { data } = await api.post("/subscriptions/checkout", { planId });

    return data;
  },
};

export default api;
