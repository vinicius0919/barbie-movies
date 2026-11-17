import "./AdminUsersPage.css";

import { useCallback, useEffect, useState } from "react";
import { adminPlansApi, adminUsersApi } from "../services/api";

const emptyForm = { days: 7, expiresAt: "", startsAt: "", grantExpiresAt: "", planId: "", reason: "" };

function message(error) {
  return error?.response?.data?.error || error?.message || "Não foi possível concluir a operação.";
}

function key() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function date(value) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [plans, setPlans] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminUsersApi.list({ page, pageSize: 20, search, status });
      setRows(result.items || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) { setError(message(err)); } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    const task = Promise.resolve().then(load);
    return () => { void task; };
  }, [load]);

  useEffect(() => {
    const task = adminPlansApi.list().then((items) => setPlans(Array.isArray(items) ? items : [])).catch(() => {});
    return () => { void task; };
  }, []);

  async function openUser(id) {
    setError("");
    try { setSelected(await adminUsersApi.get(id)); } catch (err) { setError(message(err)); }
  }

  function openModal(type, grant = null) {
    setModal({ type, grant });
    setForm({ ...emptyForm, startsAt: new Date().toISOString().slice(0, 16), grantExpiresAt: "" });
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const userId = selected.user.id;
      const payload = { reason: form.reason.trim(), idempotencyKey: key() };
      if (!payload.reason) throw new Error("Informe uma justificativa.");
      if (modal.type === "extend") await adminUsersApi.extend(userId, { ...payload, days: Number(form.days) });
      if (modal.type === "expiration") await adminUsersApi.setExpiration(userId, { ...payload, expiresAt: new Date(form.expiresAt).toISOString() });
      if (modal.type === "grant") await adminUsersApi.grant(userId, { ...payload, planId: form.planId || undefined, startsAt: new Date(form.startsAt).toISOString(), expiresAt: new Date(form.grantExpiresAt).toISOString() });
      if (modal.type === "revoke") await adminUsersApi.revokeGrant(userId, modal.grant.id, payload);
      setModal(null); setSuccess("Operação concluída."); await openUser(userId); await load();
    } catch (err) { setError(message(err)); } finally { setSaving(false); }
  }

  const access = selected?.access;
  return (
    <main className="admin-users-page">
      <header className="admin-page-header"><div><p className="eyebrow">Administração</p><h1>Usuários e acesso</h1></div></header>
      {error && <p className="admin-feedback error">{error}</p>}
      {success && <p className="admin-feedback success">{success}</p>}
      <section className="admin-users-toolbar">
        <input aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
        <select aria-label="Filtrar usuários" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="all">Todos</option><option value="active">Com acesso ativo</option><option value="pending">Pagamento pendente</option><option value="expired">Expirados</option><option value="no_subscription">Sem assinatura</option><option value="cancelled">Cancelados</option><option value="manual">Acesso manual</option><option value="expiring">Próximos do vencimento</option>
        </select>
      </section>
      <section className="admin-users-layout">
        <div className="admin-users-table-wrap">
          {loading ? <p>Carregando usuários…</p> : <table className="admin-users-table"><thead><tr><th>Usuário</th><th>Assinatura</th><th>Pagamento</th><th>Acesso efetivo</th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.user.id} onClick={() => void openUser(row.user.id)}><td><strong>{row.user.name || "Sem nome"}</strong><small>{row.user.email}</small></td><td>{row.subscription?.plan?.name || "Sem assinatura"}<small>{row.subscriptionStatus}</small></td><td>{row.paymentStatus}</td><td>{row.access.hasAccess ? `Até ${date(row.access.effectiveUntil)}` : "Sem acesso"}</td></tr>)}
            {!rows.length && <tr><td colSpan="4">Nenhum usuário encontrado.</td></tr>}
          </tbody></table>}
        </div>
        {selected && <aside className="admin-user-detail"><button type="button" className="admin-detail-close" onClick={() => setSelected(null)}>Fechar</button><h2>{selected.user.name || selected.user.email}</h2><p>{selected.user.email}</p><dl><dt>Acesso efetivo</dt><dd>{access?.hasAccess ? date(access.effectiveUntil) : "Sem acesso"}</dd><dt>Origem</dt><dd>{access?.source || "—"}</dd></dl><div className="admin-user-actions"><button type="button" onClick={() => openModal("extend")}>Prorrogar acesso</button><button type="button" onClick={() => openModal("expiration")}>Definir vencimento</button><button type="button" onClick={() => openModal("grant")}>Conceder acesso</button></div><h3>Concessões</h3>{selected.grants.map((grant) => <div className="admin-grant" key={grant.id}><span>{date(grant.startsAt)} → {date(grant.expiresAt)} · {grant.status}</span>{grant.status === "active" && <button type="button" onClick={() => openModal("revoke", grant)}>Revogar</button>}</div>)}<h3>Pagamentos (somente leitura)</h3>{selected.payments.map((payment) => <p className="admin-history-line" key={payment.id}>{payment.status} · {payment.amount} {payment.currency} · {date(payment.createdAt)}</p>)}<h3>Auditoria</h3>{selected.audit.map((item) => <p className="admin-history-line" key={item.id}>{item.action} · {date(item.createdAt)}<br />{item.reason}</p>)}</aside>}
      </section>
      <nav className="admin-users-pagination" aria-label="Paginação de usuários"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {page} de {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></nav>
      {modal && <div className="admin-modal-backdrop" role="presentation"><form className="admin-modal" onSubmit={submit}><h2>{modal.type === "extend" ? "Prorrogar acesso" : modal.type === "expiration" ? "Definir vencimento" : modal.type === "grant" ? "Conceder acesso" : "Revogar concessão"}</h2>{modal.type === "extend" && <label>Dias<input type="number" min="1" max="3650" value={form.days} onChange={(event) => setForm({ ...form, days: event.target.value })} /></label>}{modal.type === "expiration" && <><p>Vencimento atual: {date(access?.effectiveUntil)}</p><label>Novo vencimento<input type="datetime-local" required value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label></>}{modal.type === "grant" && <><label>Plano ou escopo<select value={form.planId} onChange={(event) => setForm({ ...form, planId: event.target.value })}><option value="">Acesso ao catálogo</option>{plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select></label><label>Início<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><label>Vencimento<input type="datetime-local" required value={form.grantExpiresAt} onChange={(event) => setForm({ ...form, grantExpiresAt: event.target.value })} /></label></>}<label>Justificativa<textarea required maxLength="1000" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label><div className="admin-modal-actions"><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? "Salvando…" : "Confirmar operação"}</button></div></form></div>}
    </main>
  );
}
