import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PasswordRecoveryPage from "../src/pages/PasswordRecoveryPage";
import AuthPage from "../src/pages/AuthPage";
import { captureRecoveryToken } from "../src/utils/recoveryToken";
const mocks = vi.hoisted(() => ({ forgotPassword: vi.fn(), resetPassword: vi.fn(), refreshUser: vi.fn(), getToken: vi.fn(), clearToken: vi.fn() }));
vi.mock("../src/services/api", () => ({ authApi: mocks }));
vi.mock("../src/contexts/AuthContext", () => ({ useAuth: () => ({ refreshUser: mocks.refreshUser, user: null }) }));
vi.mock("../src/utils/recoveryToken", async (original) => ({ ...await original(), getRecoveryToken: mocks.getToken, clearRecoveryToken: mocks.clearToken }));
function mount(mode = "forgot") {
  return render(<MemoryRouter><Routes><Route path="/" element={<PasswordRecoveryPage key={mode} mode={mode} />} /><Route path="/login" element={<h1>Login</h1>} /><Route path="/forgot-password" element={<PasswordRecoveryPage key="forgot" />} /></Routes></MemoryRouter>);
}
async function fillPasswords(password = "new-password", confirmation = password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nova senha"), password);
  await user.type(screen.getByLabelText("Confirme a nova senha"), confirmation);
  return user;
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.getToken.mockReturnValue("a".repeat(64)); mocks.refreshUser.mockResolvedValue(null);
});
describe("password recovery screens", () => {
  it("login link opens recovery route", async () => {
    render(<MemoryRouter><Routes><Route path="/" element={<AuthPage />} /><Route path="/forgot-password" element={<PasswordRecoveryPage key="forgot" />} /></Routes></MemoryRouter>);
    await userEvent.click(screen.getByRole("link", { name: "Esqueci minha senha" }));
    expect(screen.getByRole("heading", { name: "Recupere sua senha" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });
  it("submits normalized email, shows loading and generic success", async () => {
    let resolve;
    mocks.forgotPassword.mockReturnValue(new Promise((done) => { resolve = done; }));
    mount(); const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), "PERSON@EXAMPLE.COM");
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }));
    expect(screen.getByRole("button", { name: "Aguarde..." })).toBeDisabled();
    expect(mocks.forgotPassword).toHaveBeenCalledWith("person@example.com");
    resolve({ message: "Se houver uma conta, enviaremos instruções." });
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
    await user.click(screen.getByRole("link", { name: "Voltar ao login" }));
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });
  it("displays API failure and allows retry", async () => {
    mocks.forgotPassword.mockRejectedValue(new Error("Muitas tentativas"));
    mount(); const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas");
    expect(screen.getByRole("button", { name: "Enviar instruções" })).toBeEnabled();
  });
  it("requires matching passwords and supports visibility toggle", async () => {
    mount("reset"); const user = await fillPasswords("new-password", "different-password");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("não coincidem");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Mostrar senhas" }));
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar senhas" }));
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password");
  });
  it("enforces UTF-8 password byte limit", async () => {
    mount("reset"); const user = await fillPasswords("é".repeat(37));
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("72 bytes");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
  it("successful reset clears token and passwords and refreshes session", async () => {
    mocks.resetPassword.mockResolvedValue({ message: "Senha redefinida." });
    mount("reset"); const user = await fillPasswords();
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Senha redefinida");
    expect(mocks.resetPassword).toHaveBeenCalledWith("a".repeat(64), "new-password");
    expect(mocks.clearToken).toHaveBeenCalled(); expect(mocks.refreshUser).toHaveBeenCalled();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });
  it("missing token offers a fresh request", async () => {
    mocks.getToken.mockReturnValue(""); mount("reset");
    expect(screen.getByRole("alert")).toHaveTextContent("Link inválido");
    await userEvent.click(screen.getByRole("link", { name: "Solicitar novo link" }));
    expect(screen.getByRole("heading", { name: "Recupere sua senha" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });
  it("expired, invalid or reused token displays recovery navigation", async () => {
    mocks.resetPassword.mockRejectedValue({ message: "Link inválido, expirado ou já utilizado.", response: { status: 400 } });
    mount("reset"); const user = await fillPasswords();
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Solicitar novo link" })).toBeInTheDocument());
    expect(mocks.clearToken).toHaveBeenCalled();
  });
});
it("captures fragment/query tokens, strips URL synchronously and never uses storage", () => {
  for (const suffix of [`#token=${"a".repeat(64)}`, `?token=${"a".repeat(64)}`]) {
    const browser = { location: new URL(`https://miqflix.example/reset-password${suffix}`), history: { state: null, replaceState: vi.fn() } };
    expect(captureRecoveryToken(browser)).toBe("a".repeat(64));
    expect(browser.history.replaceState).toHaveBeenCalledWith(null, "", "/reset-password");
  }
  expect(captureRecoveryToken({ location: new URL("https://miqflix.example/login") })).toBe("");
});
