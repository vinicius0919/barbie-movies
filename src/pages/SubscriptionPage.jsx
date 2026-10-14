import "./SubscriptionPage.css";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { subscriptionApi } from "../services/api";

// =============================================
// UTILITÁRIOS
// =============================================

function normalizeReturnTo(value) {
  if (typeof value !== "string") return "/";

  const path = value.trim();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(path) ||
    path.length > 1000
  ) {
    return "/";
  }

  const pathname = path.split(/[?#]/, 1)[0];

  const blockedPaths = [
    "/login",
    "/register",
    "/subscription",
    "/checkout/retorno",
  ];

  if (
    blockedPaths.some(
      (blocked) =>
        pathname === blocked ||
        pathname.startsWith(`${blocked}/`)
    )
  ) {
    return "/";
  }

  return path;
}

function isMercadoPagoUrl(value) {
  try {
    const url = new URL(value);

    const allowedHosts = [
      "mercadopago.com",
      "mercadopago.com.br",
      "mercadopago.com.mx",
    ];

    return (
      url.protocol === "https:" &&
      allowedHosts.some(
        (host) =>
          url.hostname === host ||
          url.hostname.endsWith(`.${host}`)
      )
    );
  } catch {
    return false;
  }
}

function formatPrice(amount, currency = "BRL") {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "Valor indisponível";
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return "Valor indisponível";
  }
}

function formatDate(value) {
  if (!value) return "Data indisponível";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleDateString("pt-BR");
}

// =============================================
// COMPONENTE
// =============================================

export default function SubscriptionPage() {
  const { user } = useAuth();
  const location = useLocation();

  const returnTo = normalizeReturnTo(
    location.state?.returnTo ||
      new URLSearchParams(location.search).get("returnTo") ||
      "/"
  );

  const [plans, setPlans] = useState([]);
  const [access, setAccess] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  // =============================================
  // CARREGAMENTO DOS PLANOS E ACESSO
  // =============================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [plansData, accessData] = await Promise.all([
          subscriptionApi.plans(),
          user
            ? subscriptionApi.access()
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setPlans(
          Array.isArray(plansData) ? plansData : []
        );

        setAccess(accessData);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Não foi possível carregar os planos."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // =============================================
  // CHECKOUT
  // =============================================

  async function handleSubscribe(planId) {
    if (!user || processingId || access?.hasAccess) {
      return;
    }

    setError("");
    setProcessingId(planId);

    try {
      const data = await subscriptionApi.checkout(
        planId,
        returnTo
      );

      if (!isMercadoPagoUrl(data?.checkoutUrl)) {
        throw new Error(
          "O checkout retornou um endereço inválido."
        );
      }

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setError(
        err.message ||
          "Não foi possível iniciar o pagamento."
      );

      setProcessingId(null);
    }
  }

  // =============================================
  // CARREGAMENTO
  // =============================================

  if (loading) {
    return (
      <main className="miqflix-subscription">
        <p role="status">Carregando planos...</p>
      </main>
    );
  }

  // =============================================
  // RENDERIZAÇÃO
  // =============================================

  return (
    <main className="miqflix-subscription">
      <h1>Escolha seu plano MiqFlix</h1>

      {error && (
        <p role="alert" className="subscription-error">
          {error}
        </p>
      )}

      {access?.hasAccess && (
        <section className="subscription-active">
          <h2>Assinatura ativa</h2>

          <p>
            Acesso válido até{" "}
            {formatDate(
              access.subscription?.accessUntil
            )}
          </p>

          <Link to={returnTo}>
            Continuar assistindo
          </Link>
        </section>
      )}

      {!access?.hasAccess && (
        <div className="subscription-plans">
          {plans.length === 0 && !error && (
            <p>
              Nenhum plano disponível no momento.
            </p>
          )}

          {plans.map((plan) => (
            <article
              key={plan.id}
              className="subscription-plan"
            >
              <h2>{plan.name}</h2>

              {plan.description && (
                <p>{plan.description}</p>
              )}

              <strong>
                {formatPrice(
                  plan.amount,
                  plan.currency
                )}
              </strong>

              <p>
                {plan.billingType === "recurring"
                  ? "Cobrança recorrente"
                  : `${plan.intervalDays} dias de acesso`}
              </p>

              {user ? (
                <button
                  type="button"
                  disabled={Boolean(processingId)}
                  onClick={() =>
                    handleSubscribe(plan.id)
                  }
                >
                  {processingId === plan.id
                    ? "Preparando pagamento..."
                    : "Assinar"}
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{
                    from: {
                      pathname: "/subscription",
                      search: `?returnTo=${encodeURIComponent(
                        returnTo
                      )}`,
                    },
                  }}
                >
                  Entrar para assinar
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
