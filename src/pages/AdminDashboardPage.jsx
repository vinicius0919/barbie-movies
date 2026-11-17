import "./AdminDashboardPage.css";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminDashboardApi } from "../services/api";

const periods = { "7": 7, "30": 30, "90": 90 };

function isoDate(date) { return date.toISOString().slice(0, 10); }
function formatMoney(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0); }
function formatDate(value) { return value ? new Date(value).toLocaleDateString("pt-BR") : "—"; }
function errorMessage(error) { return error?.response?.data?.error || error?.message || "Não foi possível carregar o dashboard."; }

function BarList({ items, valueKey, labelKey = "name", money = false }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  return <div className="dashboard-bars">{items.length ? items.map((item) => <div className="dashboard-bar-row" key={`${item[labelKey]}-${item[valueKey]}`}><div className="dashboard-bar-label"><span>{item[labelKey]}</span><strong>{money ? formatMoney(item[valueKey]) : item[valueKey]}</strong></div><div className="dashboard-bar-track"><span style={{ width: `${Math.max(2, ((Number(item[valueKey]) || 0) / max) * 100)}%` }} /></div></div>) : <p className="dashboard-muted">Sem dados no período.</p>}</div>;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState("30");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const range = useMemo(() => {
    if (period === "custom" && custom.from && custom.to) return custom;
    const to = new Date(); const from = new Date(to.getTime() - periods[period] * 86400000);
    return { from: isoDate(from), to: isoDate(to) };
  }, [period, custom]);

  useEffect(() => {
    let cancelled = false;
    const task = Promise.resolve().then(() => {
      setLoading(true); setError("");
      return adminDashboardApi.metrics(range);
    }).then((result) => { if (!cancelled) setData(result); }).catch((err) => { if (!cancelled) { setData(null); setError(errorMessage(err)); } }).finally(() => { if (!cancelled) setLoading(false); });
    void task;
    return () => { cancelled = true; };
  }, [range]);

  const cards = data ? [
    ["Usuários cadastrados", data.users.total], ["Novos usuários", data.users.newInPeriod], ["Acesso ativo", data.users.activeAccess], ["Sem assinatura", data.users.withoutSubscription],
    ["Assinaturas ativas", data.subscriptions.statuses.active || 0], ["Expiradas", data.subscriptions.statuses.expired || 0], ["Pendentes", data.subscriptions.statuses.pending || 0], ["Acesso manual", data.users.manualAccess],
    ["Receita confirmada", formatMoney(data.payments.approved.revenue)], ["Pagamentos aprovados", data.payments.approved.count], ["Pagamentos pendentes", data.payments.statuses.pending?.count || 0], ["Ticket médio", formatMoney(data.payments.approved.average)],
  ] : [];
  const planData = data?.subscriptions.byPlan || [];
  const newSubscribersData = (data?.series.newSubscriptions || []).map((item) => ({ name: item.date, subscriptions: item.subscriptions }));
  const revenueData = data?.payments.byPlan || [];
  return <main className="admin-dashboard-page"><header className="admin-dashboard-header"><div><p className="eyebrow">Administração</p><h1>Dashboard</h1><p className="dashboard-muted">Usuários, acesso, assinaturas e pagamentos confirmados.</p></div><div className="dashboard-actions"><Link to="/admin/plans">Planos</Link><Link to="/admin/users">Usuários</Link></div></header><section className="dashboard-filters"><button className={period === "7" ? "selected" : ""} onClick={() => setPeriod("7")}>7 dias</button><button className={period === "30" ? "selected" : ""} onClick={() => setPeriod("30")}>30 dias</button><button className={period === "90" ? "selected" : ""} onClick={() => setPeriod("90")}>90 dias</button><button className={period === "custom" ? "selected" : ""} onClick={() => setPeriod("custom")}>Personalizado</button>{period === "custom" && <><input type="date" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} /><input type="date" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} /></>}</section>{loading && <p className="dashboard-state">Carregando métricas…</p>}{error && <p className="dashboard-state error">{error}</p>}{!loading && !error && data && <><section className="dashboard-cards">{cards.map(([label, value]) => <article className="dashboard-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section><section className="dashboard-grid"><article className="dashboard-panel"><h2>Receita por plano</h2><BarList items={revenueData} valueKey="revenue" money /></article><article className="dashboard-panel"><h2>Assinaturas ativas por plano</h2><BarList items={planData} valueKey="subscriptions" /></article><article className="dashboard-panel dashboard-wide"><h2>Receita confirmada por dia</h2><BarList items={(data.series.revenue || []).map((item) => ({ name: item.date, revenue: item.revenue }))} valueKey="revenue" money /></article><article className="dashboard-panel dashboard-wide"><h2>Novos assinantes por dia</h2><BarList items={newSubscribersData} valueKey="subscriptions" /></article><article className="dashboard-panel"><h2>Status de pagamentos</h2><BarList items={Object.entries(data.payments.statuses || {}).map(([name, value]) => ({ name, count: value.count }))} valueKey="count" /></article><article className="dashboard-panel"><h2>Próximos vencimentos</h2>{data.subscriptions.expiringSoon.length ? data.subscriptions.expiringSoon.map((item) => <div className="dashboard-expiring" key={item.id}><strong>{item.plan?.name || "Plano"}</strong><span>{formatDate(item.accessUntil)}</span></div>) : <p className="dashboard-muted">Nenhuma assinatura vencendo nos próximos 7 dias.</p>}</article></section></>}</main>;
}
