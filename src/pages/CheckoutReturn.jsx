import "./CheckoutReturn.css";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { subscriptionApi } from "../services/api";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY = 3000;
const REDIRECT_DELAY = 2000;

function safeReturnPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "/";
  }

  const blockedPaths = [
    "/login",
    "/register",
    "/subscription",
    "/checkout/retorno",
  ];

  try {
    const url = new URL(value, window.location.origin);

    if (
      url.origin !== window.location.origin ||
      blockedPaths.includes(url.pathname)
    ) {
      return "/";
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export default function CheckoutReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const subscriptionId =
    searchParams.get("subscriptionId");

  const returnTo = safeReturnPath(
    searchParams.get("returnTo") || "/"
  );

  const [status, setStatus] = useState("checking");
  const [attempt, setAttempt] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function verify() {
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        if (cancelled) return;

        setAttempt(i);

        try {
          let result;

          if (subscriptionId) {
            result = await subscriptionApi.confirm(
              subscriptionId
            );
          } else {
            result = await subscriptionApi.access();
          }

          if (cancelled) return;

          if (result.hasAccess === true) {
            setStatus("active");

            timerId = setTimeout(() => {
              if (!cancelled) {
                navigate(returnTo, {
                  replace: true,
                });
              }
            }, REDIRECT_DELAY);

            return;
          }
        } catch (error) {
          if (cancelled) return;

          if (error.response?.status === 401) {
            setStatus("unauthorized");
            return;
          }

          if (
            error.response?.status === 403 ||
            error.response?.status === 404
          ) {
            setErrorMessage(
              error.message ||
              "Não foi possível localizar a assinatura."
            );

            setStatus("error");
            return;
          }

          console.error(
            "[CHECKOUT] Erro ao verificar pagamento:",
            error
          );
        }

        if (i < MAX_ATTEMPTS) {
          await new Promise((resolve) => {
            timerId = setTimeout(resolve, RETRY_DELAY);
          });
        }
      }

      if (!cancelled) {
        setStatus("pending");
      }
    }

    setStatus("checking");
    setAttempt(0);
    setErrorMessage("");

    verify();

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [subscriptionId, retryKey, navigate, returnTo]);

  function retry() {
    setRetryKey((value) => value + 1);
  }

  return (
    <main className="checkout-return">
      {status === "checking" && (
        <>
          <h1>Verificando pagamento</h1>

          <p>
            Estamos consultando o Mercado Pago
            para confirmar sua assinatura.
          </p>

          <p>
            Tentativa {attempt} de {MAX_ATTEMPTS}
          </p>
        </>
      )}

      {status === "active" && (
        <>
          <h1>Seu acesso está liberado!</h1>

          <p>
            Sua assinatura está ativa.
            Você será redirecionado automaticamente.
          </p>

          <Link to={returnTo}>
            Assistir agora
          </Link>
        </>
      )}

      {status === "pending" && (
        <>
          <h1>Pagamento em processamento</h1>

          <p>
            Ainda não conseguimos confirmar
            a liberação da sua assinatura.
          </p>

          <p>
            Se o pagamento já foi realizado,
            não é necessário pagar novamente.
          </p>

          <button
            type="button"
            onClick={retry}
          >
            Verificar novamente
          </button>

          <Link to="/subscription">
            Consultar assinatura
          </Link>
        </>
      )}

      {status === "unauthorized" && (
        <>
          <h1>Sessão expirada</h1>

          <p>
            Faça login novamente para verificar
            o pagamento. Sua compra não será
            cancelada por isso.
          </p>

          <Link
            to={`/login?returnTo=${encodeURIComponent(
              window.location.pathname +
              window.location.search
            )}`}
          >
            Entrar na minha conta
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1>Não foi possível verificar a assinatura</h1>

          <p>{errorMessage}</p>

          <button
            type="button"
            onClick={retry}
          >
            Tentar novamente
          </button>

          <Link to="/subscription">
            Consultar assinatura
          </Link>
        </>
      )}
    </main>
  );
}
