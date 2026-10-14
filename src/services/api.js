
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
    const responseData = error.response?.data;

    const expectedUnauthorized =
      status === 401 &&
      error.config?.url === "/auth/me";

    if (
      import.meta.env.DEV &&
      !expectedUnauthorized
    ) {
      console.error("[MIQFLIX API ERROR]", {
        url: error.config
          ? api.getUri(error.config)
          : undefined,
        status,
        code: error.code,
        originalMessage: error.message,
        response: responseData,
      });
    }

    if (error.response) {
      const isHtml =
        typeof responseData === "string" &&
        /^\s*(<!doctype html|<html)/i.test(
          responseData
        );

      if (isHtml) {
        error.message =
          "A API retornou HTML em vez de JSON. Verifique o rewrite da Vercel e a URL da Railway.";
      } else {
        const serverMessage =
          responseData?.error ||
          responseData?.message;

        error.message =
          typeof serverMessage === "string"
            ? serverMessage
            : `Erro HTTP ${status}`;
      }
    } else if (error.code === "ECONNABORTED") {
      error.message =
        "O servidor demorou muito para responder.";
    } else if (error.code === "ERR_NETWORK") {
      error.message =
        "Falha de rede. Verifique a API, o proxy ou o CORS.";
    }

    return Promise.reject(error);
  }
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
    const { data } = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    return data;
  },

  async register(name, email, password) {
    const { data } = await api.post(
      "/auth/register",
      {
        name,
        email,
        password,
      }
    );

    return data;
  },

  async logout() {
    const { data } = await api.post(
      "/auth/logout"
    );

    return data;
  },
};

// =============================================
// ASSINATURAS
// =============================================

export const subscriptionApi = {
  // -------------------------------------------
  // LISTAR PLANOS
  // -------------------------------------------

  async plans() {
    const { data } = await api.get(
      "/subscriptions/plans"
    );

    return data;
  },

  // -------------------------------------------
  // CONSULTAR ACESSO
  // -------------------------------------------

  async access() {
    const { data } = await api.get(
      "/subscriptions/access"
    );

    return data;
  },

  // -------------------------------------------
  // CRIAR CHECKOUT
  // -------------------------------------------

  async checkout(planId, returnTo = "/") {
    const { data } = await api.post(
      "/subscriptions/checkout",
      {
        planId,
        returnTo,
      }
    );

    return data;
  },

  // -------------------------------------------
  // CONFIRMAR PAGAMENTO
  // -------------------------------------------

  async confirm(subscriptionId) {
    if (
      typeof subscriptionId !== "string" ||
      !/^[a-f\d]{24}$/i.test(subscriptionId)
    ) {
      throw new Error(
        "Identificador de assinatura inválido."
      );
    }

    const { data } = await api.post(
      "/subscriptions/confirm",
      {
        subscriptionId,
      }
    );

    return data;
  },
};

export default api;
