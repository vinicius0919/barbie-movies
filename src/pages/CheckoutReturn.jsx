
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { subscriptionApi } from "../services/api";

export default function CheckoutReturn() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timeoutId;

    async function checkAccess() {
      if (cancelled) return;

      try {
        const data = await subscriptionApi.access();

        if (cancelled) return;

        if (data.hasAccess) {
          setStatus("active");
          return;
        }
      } catch {
        // A verificação pode falhar temporariamente.
      }

      attempts += 1;

      if (attempts >= 10) {
        setStatus("pending");
        return;
      }

      timeoutId = setTimeout(checkAccess, 3000);
    }

    checkAccess();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="checkout-return">
      {status === "checking" && (
        <>
          <h1>Verificando pagamento</h1>
          <p>
            Estamos aguardando a confirmação
            do Mercado Pago.
          </p>
        </>
      )}

      {status === "active" && (
        <>
          <h1>Seu acesso está liberado!</h1>
          <p>Sua assinatura está ativa.</p>
          <Link to="/">Assistir agora</Link>
        </>
      )}

      {status === "pending" && (
        <>
          <h1>Pagamento em processamento</h1>
          <p>
            Ainda não identificamos uma assinatura
            ativa. Você pode consultar novamente
            em alguns instantes.
          </p>
          <Link to="/subscription">
            Consultar assinatura
          </Link>
        </>
      )}
    </main>
  );
}
