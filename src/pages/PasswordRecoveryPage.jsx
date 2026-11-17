import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getRecoveryToken, clearRecoveryToken } from "../utils/recoveryToken";
import "./AuthPage.css";

export default function PasswordRecoveryPage({ mode = "forgot" }) {
  const reset = mode === "reset";
  const { refreshUser } = useAuth();
  const [token, setToken] = useState(getRecoveryToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(reset && !token);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (reset && (password.length < 8 || new TextEncoder().encode(password).length > 72)) {
      setError("Use pelo menos 8 caracteres e no máximo 72 bytes UTF-8.");
      return;
    }
    if (reset && password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      const data = reset ? await authApi.resetPassword(token, password) : await authApi.forgotPassword(email.trim().toLowerCase());
      if (reset) {
        clearRecoveryToken();
        setToken("");
        setPassword("");
        setConfirmation("");
        await refreshUser();
      }
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Não foi possível concluir. Tente novamente.");
      if (reset && err.response?.status === 400) {
        setError("");
        setInvalid(true);
        clearRecoveryToken();
        setToken("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="miqflix-auth">
    <form className="miqflix-auth-card" onSubmit={submit} aria-busy={submitting}>
      <h1>MiqFlix</h1>
      <h2>{reset ? "Defina sua nova senha" : "Recupere sua senha"}</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      {invalid && <p className="form-error" role="alert">Link inválido, expirado ou já utilizado. Solicite uma nova recuperação.</p>}
      {message && <p className="recovery-success" role="status">{message}</p>}
      {!message && !invalid && <>
        {reset ? <>
          <p id="password-policy">Use pelo menos 8 caracteres e no máximo 72 bytes UTF-8.</p>
          <label>Nova senha<input type={visible ? "text" : "password"} autoComplete="new-password" aria-describedby="password-policy" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} /></label>
          <label>Confirme a nova senha<input type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={submitting} /></label>
          <button className="recovery-toggle" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Ocultar senhas" : "Mostrar senhas"}</button>
        </> : <>
          <p>Informe seu e-mail para receber um link válido por 30 minutos.</p>
          <label>E-mail<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} /></label>
        </>}
        <button type="submit" disabled={submitting}>{submitting ? "Aguarde..." : reset ? "Redefinir senha" : "Enviar instruções"}</button>
      </>}
      {invalid && <p><Link to="/forgot-password">Solicitar novo link</Link></p>}
      <p><Link to="/login">Voltar ao login</Link></p>
    </form>
  </main>;
}
