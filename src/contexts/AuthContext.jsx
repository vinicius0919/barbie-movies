
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { authApi } from "../services/api";

const AuthContext = createContext(null);

// Compartilha a verificação inicial entre montagens
// simultâneas, inclusive no StrictMode.
let pendingSessionRequest = null;

function getInitialSession() {
  if (!pendingSessionRequest) {
    pendingSessionRequest = authApi
      .me()
      .then((data) => data.user ?? null)
      .catch((error) => {
        if (error.response?.status !== 401) {
          console.error(
            "Erro ao verificar sessão:",
            error
          );
        }

        return null;
      })
      .finally(() => {
        pendingSessionRequest = null;
      });
  }

  return pendingSessionRequest;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getInitialSession().then((authenticatedUser) => {
      if (!active) return;

      setUser(authenticatedUser);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function refreshUser() {
    try {
      const data = await authApi.me();
      const authenticatedUser = data.user ?? null;

      setUser(authenticatedUser);

      return authenticatedUser;
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Erro ao atualizar sessão:", error);
      }

      setUser(null);
      return null;
    }
  }

  async function login(email, password) {
    await authApi.login(email, password);
    return refreshUser();
  }

  async function register(name, email, password) {
    await authApi.register(name, email, password);
    return refreshUser();
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider"
    );
  }

  return context;
}
