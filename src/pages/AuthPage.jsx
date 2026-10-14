import "./AuthPage.css";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";

  const { user, login, register } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }

      const from = location.state?.from;

      const destination = from?.pathname
        ? `${from.pathname}${from.search || ""}${from.hash || ""}`
        : "/";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="miqflix-auth">
      <form className="miqflix-auth-card" onSubmit={handleSubmit}>
        <h1>MiqFlix</h1>

        <h2>{isRegister ? "Crie sua conta" : "Entre na sua conta"}</h2>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        {isRegister && (
          <label>
            Nome
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
        </button>

        <p>
          {isRegister ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Entrar" : "Cadastrar"}
          </Link>
        </p>
      </form>
    </main>
  );
}
