
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { subscriptionApi } from "../services/api";

export default function SubscriptionPage() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const plansData = await subscriptionApi.plans();

        const accessData = user
          ? await subscriptionApi.access()
          : null;

        if (!cancelled) {
          setPlans(plansData);
          setAccess(accessData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function handleSubscribe(planId) {
    if (!user) return;

    setError("");
    setProcessingId(planId);

    try {
      const data = await subscriptionApi.checkout(planId);

      const url = new URL(data.checkoutUrl);

      if (
        url.protocol !== "https:" ||
        !(
          url.hostname === "mercadopago.com" ||
          url.hostname.endsWith(".mercadopago.com") ||
          url.hostname === "mercadopago.com.br" ||
          url.hostname.endsWith(".mercadopago.com.br")
        )
      ) {
        throw new Error(
          "O checkout retornou um endereço inválido."
        );
      }

      window.location.assign(url.href);
    } catch (err) {
      setError(err.message);
      setProcessingId(null);
    }
  }

  const formatPrice = (amount, currency) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(amount);

  if (loading) {
    return <main><p>Carregando planos...</p></main>;
  }

  return (
    <main className="miqflix-subscription">
      <h1>Escolha seu plano MiqFlix</h1>

      {error && <p role="alert">{error}</p>}

      {access?.hasAccess && (
        <section className="subscription-active">
          <h2>Assinatura ativa</h2>
          <p>
            Acesso válido até{" "}
            {new Date(
              access.subscription.accessUntil
            ).toLocaleDateString("pt-BR")}
          </p>
          <Link to="/">Explorar catálogo</Link>
        </section>
      )}

      <div className="subscription-plans">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="subscription-plan"
          >
            <h2>{plan.name}</h2>
            <p>{plan.description}</p>

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
                  },
                }}
              >
                Entrar para assinar
              </Link>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
