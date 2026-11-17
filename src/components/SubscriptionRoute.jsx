import { useEffect, useState } from "react";

import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { subscriptionApi } from "../services/api";

import "./SubscriptionRoute.css";

export default function SubscriptionRoute() {
  const { user } = useAuth();
  const location = useLocation();

  const [status, setStatus] = useState("loading");
  const [checkedUserId, setCheckedUserId] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const userId = user?._id || user?.id || null;

  const isAdmin = user?.role === "admin";

  const returnTo = location.pathname + location.search + location.hash;

  // =========================================
  // CHECK SUBSCRIPTION
  // =========================================

  useEffect(() => {
    let cancelled = false;

    if (!userId || isAdmin) return () => { cancelled = true; };

    async function checkSubscription() {
      try {
        const data = await subscriptionApi.access();

        if (cancelled) return;

        setStatus(data.hasAccess === true ? "allowed" : "denied");
        setCheckedUserId(userId);
      } catch (error) {
        if (cancelled) return;

        console.error("[SUBSCRIPTION ROUTE]", error);

        setStatus(error.response?.status === 401 ? "unauthorized" : "error");
        setCheckedUserId(userId);
      }
    }

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin, retryKey]);

  // =========================================
  // UNAUTHORIZED
  // =========================================

  const effectiveStatus = !userId
    ? "unauthorized"
    : isAdmin
      ? "allowed"
      : checkedUserId !== userId
        ? "loading"
        : status;

  if (effectiveStatus === "unauthorized") {
    return (
      <Navigate
        to="/login"
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
        replace
      />
    );
  }

  // =========================================
  // ADMIN ACCESS
  // =========================================

  if (isAdmin) {
    return <Outlet />;
  }

  // =========================================
  // LOADING
  // =========================================

  if (effectiveStatus === "loading") {
    return (
      <main className="subscription-guard">
        <div className="subscription-guard-card">
          <div className="subscription-guard-spinner" aria-hidden="true" />

          <h2>Verificando sua assinatura</h2>

          <p>Estamos verificando se seu acesso ao MiqFlix está ativo.</p>
        </div>
      </main>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (effectiveStatus === "error") {
    return (
      <main className="subscription-guard">
        <div className="subscription-guard-card">
          <div className="subscription-guard-icon error">!</div>

          <h2>Não foi possível verificar seu acesso</h2>

          <p>
            O serviço de assinaturas está temporariamente indisponível. Tente
            novamente em alguns instantes.
          </p>

          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setRetryKey((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>

          <Link to="/" className="subscription-guard-link">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  // =========================================
  // SUBSCRIPTION REQUIRED
  // =========================================

  if (effectiveStatus === "denied") {
    return (
      <Navigate
        to={`/subscription?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  // =========================================
  // ACCESS ALLOWED
  // =========================================

  return <Outlet />;
}
