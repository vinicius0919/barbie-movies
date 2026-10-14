
import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { subscriptionApi } from "../services/api";

export default function SubscriptionRoute() {
  const { user } = useAuth();

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");

    subscriptionApi.access()
      .then((data) => {
        if (!cancelled) {
          setStatus(
            data.hasAccess ? "allowed" : "denied"
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (status === "loading") {
    return <p>Verificando sua assinatura...</p>;
  }

  if (status === "error") {
    return (
      <div>
        <h2>Não foi possível verificar seu acesso.</h2>
        <button onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/subscription" replace />;
  }

  return <Outlet />;
}
