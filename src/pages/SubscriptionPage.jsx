
import "./SubscriptionPage.css";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Check,
  ChevronRight,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Clock3,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";

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
  if (amount === null || amount === undefined || amount === "") {
    return "Valor indisponível";
  }

  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    return "Valor indisponível";
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
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

function isRecurring(plan) {
  return plan?.billingType === "recurring";
}

function isFixed(plan) {
  return plan?.billingType === "fixed";
}

function formatBilling(plan) {
  if (isRecurring(plan)) {
    return "Cobrança recorrente";
  }

  if (isFixed(plan)) {
    const days = Number(plan.intervalDays);

    if (Number.isFinite(days) && days > 0) {
      return `${days} ${days === 1 ? "dia" : "dias"} de acesso`;
    }

    return "Acesso por período definido";
  }

  return "Consulte as condições do plano";
}

function getPlanBenefits(plan) {
  if (!Array.isArray(plan?.benefits)) {
    return [];
  }

  return plan.benefits.filter(
    (benefit) =>
      typeof benefit === "string" &&
      benefit.trim().length > 0
  );
}

function isFeatured(plan) {
  return (
    plan?.featured === true ||
    plan?.isFeatured === true ||
    plan?.recommended === true
  );
}

// =============================================
// CARD DO PLANO
// =============================================

function PlanCard({
  plan,
  user,
  processingId,
  onSubscribe,
  returnTo,
}) {
  const featured = isFeatured(plan);
  const benefits = getPlanBenefits(plan);
  const processing = processingId === plan.id;
  const billing = formatBilling(plan);

  return (
    <article
      className={`subscription-plan ${
        featured ? "subscription-plan-featured" : ""
      }`}
    >
      {featured && (
        <div className="subscription-plan-badge">
          <Sparkles size={14} />
          Plano em destaque
        </div>
      )}

      <div className="subscription-plan-content">
        <div className="subscription-plan-heading">
          <h2>{plan.name}</h2>

          {plan.description && (
            <p className="subscription-plan-description">
              {plan.description}
            </p>
          )}
        </div>

        <div className="subscription-plan-pricing">
          <strong className="subscription-plan-price">
            {formatPrice(plan.amount, plan.currency)}
          </strong>

          <span className="subscription-plan-period">
            {billing}
          </span>
        </div>

        <div className="subscription-plan-divider" />

        <div className="subscription-plan-details">
          <div className="subscription-plan-detail">
            {isRecurring(plan) ? (
              <CreditCard size={18} />
            ) : (
              <CalendarDays size={18} />
            )}

            <span>{billing}</span>
          </div>

          {isFixed(plan) && (
            <div className="subscription-plan-detail">
              <Check size={18} />
              <span>Sem renovação automática</span>
            </div>
          )}

          {isRecurring(plan) && (
            <div className="subscription-plan-detail">
              <Clock3 size={18} />
              <span>
                Renovação conforme condições do checkout
              </span>
            </div>
          )}

          {benefits.map((benefit, index) => (
            <div
              key={`${index}-${benefit}`}
              className="subscription-plan-detail"
            >
              <Check size={18} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="subscription-plan-bottom">
          {user ? (
            <button
              type="button"
              className="subscription-plan-button"
              disabled={processingId !== null || !plan.id}
              onClick={() => onSubscribe(plan.id)}
              aria-busy={processing}
            >
              {processing
                ? "Preparando pagamento..."
                : "Escolher plano"}

              {!processing && <ChevronRight size={18} />}
            </button>
          ) : (
            <Link
              className="subscription-plan-button"
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
              <ChevronRight size={18} />
            </Link>
          )}

          <p className="subscription-plan-footnote">
            Confira os detalhes antes de confirmar o pagamento.
          </p>
        </div>
      </div>
    </article>
  );
}

// =============================================
// COMPARAÇÃO DOS PLANOS
// =============================================

function PlanComparison({ plans }) {
  if (plans.length < 2) return null;

  return (
    <section className="subscription-comparison">
      <div className="subscription-section-heading">
        <h2>Compare os planos</h2>
        <p>
          Encontre a opção que melhor combina com você.
        </p>
      </div>

      <div className="subscription-table-scroll">
        <table className="subscription-table">
          <thead>
            <tr>
              <th scope="col">Plano</th>
              <th scope="col">Preço</th>
              <th scope="col">Cobrança e acesso</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <th scope="row">{plan.name}</th>

                <td>
                  {formatPrice(
                    plan.amount,
                    plan.currency
                  )}
                </td>

                <td>{formatBilling(plan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// =============================================
// PERGUNTAS FREQUENTES
// =============================================

function SubscriptionFAQ() {
  const questions = [
    {
      question: "Como funciona a assinatura?",
      answer:
        "Escolha um plano e siga para o checkout. " +
        "As condições de cobrança e acesso dependem " +
        "do plano selecionado.",
    },
    {
      question: "Qual é a diferença entre os tipos de plano?",
      answer:
        "Planos de duração fixa oferecem acesso por " +
        "um período definido, sem renovação automática. " +
        "Planos recorrentes possuem cobranças periódicas " +
        "conforme as condições apresentadas no checkout.",
    },
    {
      question: "Quando meu acesso será liberado?",
      answer:
        "A liberação depende da confirmação do pagamento " +
        "e do processamento da assinatura. " +
        "Após a ativação, você poderá consultar " +
        "a validade do acesso nesta página.",
    },
    {
      question: "Como verifico minha assinatura?",
      answer:
        "Entre na sua conta e acesse esta página. " +
        "Se houver uma assinatura ativa, " +
        "a data de validade será exibida.",
    },
    {
      question: "Como funcionam cancelamentos e renovações?",
      answer:
        "As condições dependem do tipo de plano " +
        "e dos termos apresentados na contratação. " +
        "Confira essas informações antes de pagar.",
    },
  ];

  return (
    <section className="subscription-faq">
      <div className="subscription-section-heading">
        <HelpCircle size={24} />

        <h2>Perguntas frequentes</h2>

        <p>
          Informações importantes antes de assinar.
        </p>
      </div>

      <div className="subscription-faq-list">
        {questions.map((item) => (
          <details
            key={item.question}
            className="subscription-faq-item"
          >
            <summary>{item.question}</summary>

            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// =============================================
// COMPONENTE PRINCIPAL
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
  // CARREGAMENTO
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // =============================================
  // CHECKOUT
  // =============================================

  async function handleSubscribe(planId) {
    if (
      !user ||
      processingId !== null ||
      access?.hasAccess ||
      !planId
    ) {
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
  // ORGANIZAÇÃO DOS PLANOS
  // =============================================

  const availablePlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan &&
          typeof plan === "object" &&
          plan.id
      ),
    [plans]
  );

  // =============================================
  // LOADING
  // =============================================

  if (loading) {
    return (
      <main className="miqflix-subscription">
        <div className="subscription-loading" role="status">
          <div className="subscription-spinner" />
          <p>Carregando planos...</p>
        </div>
      </main>
    );
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <main className="miqflix-subscription">
      <div className="subscription-container">
        <header className="subscription-header">
          <Link
            to={returnTo}
            className="subscription-back"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>

          <div className="subscription-header-content">
            <span className="subscription-eyebrow">
              <Sparkles size={15} />
              MIQFLIX PREMIUM
            </span>

            <h1>
              {access?.hasAccess
                ? "Sua assinatura MiqFlix"
                : "Escolha seu plano MiqFlix"}
            </h1>

            <p>
              {access?.hasAccess
                ? "Confira as informações do seu acesso."
                : "Escolha a opção ideal para você e continue assistindo."}
            </p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="subscription-error"
          >
            {error}
          </div>
        )}

        {/* ASSINATURA ATIVA */}

        {access?.hasAccess && (
          <section className="subscription-active">
            <div className="subscription-active-icon">
              <ShieldCheck size={30} />
            </div>

            <div className="subscription-active-content">
              <span className="subscription-active-label">
                Acesso liberado
              </span>

              <h2>Assinatura ativa</h2>

              <p>
                Acesso válido até{" "}
                <strong>
                  {formatDate(
                    access.subscription?.accessUntil
                  )}
                </strong>
              </p>
            </div>

            <Link
              to={returnTo}
              className="subscription-active-button"
            >
              Continuar assistindo
              <ChevronRight size={18} />
            </Link>
          </section>
        )}

        {/* PLANOS */}

        {!access?.hasAccess && (
          <>
            {availablePlans.length === 0 ? (
              !error && (
                <div className="subscription-empty">
                  <CreditCard size={30} />
                  <h2>Nenhum plano disponível</h2>
                  <p>
                    Não há planos disponíveis no momento.
                  </p>
                </div>
              )
            ) : (
              <>
                <section
                  className="subscription-plans-section"
                  aria-label="Planos de assinatura"
                >
                  <div className="subscription-plans">
                    {availablePlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        user={user}
                        processingId={processingId}
                        onSubscribe={handleSubscribe}
                        returnTo={returnTo}
                      />
                    ))}
                  </div>
                </section>

                <div className="subscription-trust">
                  <ShieldCheck size={19} />

                  <p>
                    Você será direcionado ao ambiente
                    de pagamento do Mercado Pago.
                  </p>
                </div>

                <PlanComparison plans={availablePlans} />
              </>
            )}
          </>
        )}

        <SubscriptionFAQ />
      </div>
    </main>
  );
}
