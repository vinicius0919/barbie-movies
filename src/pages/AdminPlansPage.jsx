import "./AdminPlansPage.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArrowDown, ArrowUp, Copy, Plus, Save, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";

import BenefitsEditor from "../components/BenefitsEditor";
import { adminPlansApi } from "../services/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  billingType: "fixed",
  intervalDays: "30",
  frequency: "1",
  frequencyType: "months",
  benefits: [],
  featured: false,
  sortOrder: 0,
};

function errorMessage(error) {
  return error?.response?.data?.error || error?.message || "Não foi possível concluir a operação.";
}

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function formatDuration(plan) {
  if (plan.billingType === "fixed") return `${plan.intervalDays} dias`;
  return `${plan.frequency} ${plan.frequencyType === "months" ? "mês(es)" : "dia(s)"}`;
}

function toForm(plan) {
  if (!plan) return { ...EMPTY_FORM, benefits: [] };
  return {
    name: plan.name || "",
    description: plan.description || "",
    amount: String(plan.amount ?? ""),
    billingType: plan.billingType || "fixed",
    intervalDays: String(plan.intervalDays ?? ""),
    frequency: String(plan.frequency ?? 1),
    frequencyType: plan.frequencyType || "months",
    benefits: Array.isArray(plan.benefits) ? [...plan.benefits] : [],
    featured: plan.featured === true,
    sortOrder: plan.sortOrder ?? 0,
  };
}

function PlanPreview({ form }) {
  return (
    <article className={`admin-plan-preview ${form.featured ? "featured" : ""}`}>
      {form.featured && <span className="admin-plan-preview-badge">Plano em destaque</span>}
      <h3>{form.name.trim() || "Nome do plano"}</h3>
      <strong>{formatPrice(form.amount)}</strong>
      <span className="admin-plan-preview-duration">
        {form.billingType === "fixed" ? `${form.intervalDays || "0"} dias` : `${form.frequency || "0"} ${form.frequencyType === "months" ? "mês(es)" : "dia(s)"}`}
      </span>
      <ul>
        {form.benefits.filter((item) => item.trim()).map((benefit, index) => <li key={`${index}-${benefit}`}>✓ <span>{benefit}</span></li>)}
      </ul>
    </article>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState("new");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orderDirty, setOrderDirty] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPlansApi.list();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = Promise.resolve().then(loadPlans);
    return () => { void task; };
  }, [loadPlans]);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedId), [plans, selectedId]);

  function selectPlan(plan) {
    setSelectedId(plan.id);
    setForm(toForm(plan));
    setMessage("");
    setError("");
  }

  function newPlan() {
    setSelectedId("new");
    setForm({ ...EMPTY_FORM, benefits: [] });
    setMessage("");
    setError("");
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function payload() {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      billingType: form.billingType,
      intervalDays: form.billingType === "fixed" ? Number(form.intervalDays) : null,
      frequency: Number(form.frequency),
      frequencyType: form.frequencyType,
      benefits: form.benefits,
      featured: form.featured,
      sortOrder: Number(form.sortOrder),
    };
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const saved = selectedId === "new" ? await adminPlansApi.create(payload()) : await adminPlansApi.update(selectedId, payload());
      await loadPlans();
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("Plano salvo com sucesso.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  async function action(name, id) {
    if (saving) return;
    if (name === "archive" && !window.confirm("Arquivar este plano? Ele não será oferecido para novas compras.")) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const saved = await adminPlansApi[name](id);
      await loadPlans();
      selectPlan(saved);
      setMessage("Operação concluída.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  function movePlan(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= plans.length) return;
    const next = [...plans];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setPlans(next.map((plan, itemIndex) => ({ ...plan, sortOrder: itemIndex })));
    setOrderDirty(true);
  }

  async function saveOrder() {
    setSaving(true); setError("");
    try {
      const updated = await adminPlansApi.reorder(plans.map((plan, index) => ({ id: plan.id, sortOrder: index })));
      setPlans(updated); setOrderDirty(false); setMessage("Ordem salva com sucesso.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <main className="admin-plans">
      <header className="admin-plans-header">
        <div><span className="admin-plans-eyebrow"><ShieldCheck size={17} /> ADMINISTRAÇÃO</span><h1>Planos de assinatura</h1><p>Gerencie preços, disponibilidade, destaque e benefícios sem alterar contratos históricos.</p></div>
        <button type="button" className="admin-plans-primary" onClick={newPlan}><Plus size={18} /> Novo plano</button>
      </header>
      {error && <div className="admin-plans-alert error" role="alert">{error}</div>}
      {message && <div className="admin-plans-alert success" role="status">{message}</div>}
      <div className="admin-plans-layout">
        <aside className="admin-plans-list">
          <div className="admin-plans-list-heading"><h2>Planos cadastrados</h2><span>{plans.length}</span></div>
          {loading && <p className="admin-plans-muted">Carregando...</p>}
          {!loading && plans.length === 0 && <p className="admin-plans-muted">Nenhum plano cadastrado.</p>}
          <div className="admin-plans-items">
            {plans.map((plan, index) => <div key={plan.id} className={`admin-plan-item ${selectedId === plan.id ? "selected" : ""}`} role="button" tabIndex="0" onClick={() => selectPlan(plan)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectPlan(plan); }}>
              <span><strong>{plan.name}</strong><small>{formatPrice(plan.amount)} · {formatDuration(plan)} · {plan.benefits?.length || 0} benefícios</small></span>
              <i className={plan.archived ? "archived" : plan.active ? "active" : "inactive"} title={plan.archived ? "Arquivado" : plan.active ? "Ativo" : "Inativo"} />
              <span className="admin-plan-item-order"><button type="button" aria-label="Mover plano para cima" onClick={(event) => { event.stopPropagation(); movePlan(index, -1); }} disabled={index === 0}><ArrowUp size={14} /></button><button type="button" aria-label="Mover plano para baixo" onClick={(event) => { event.stopPropagation(); movePlan(index, 1); }} disabled={index === plans.length - 1}><ArrowDown size={14} /></button></span>
            </div>)}
          </div>
          {orderDirty && <button type="button" className="admin-plans-secondary" onClick={saveOrder} disabled={saving}><Save size={16} /> Salvar ordem</button>}
        </aside>
        <section className="admin-plans-editor">
          <div className="admin-plans-editor-heading"><div><span>{selectedId === "new" ? "NOVO PLANO" : "EDIÇÃO"}</span><h2>{selectedPlan?.name || "Cadastrar plano"}</h2></div>{selectedPlan && <div className="admin-plans-actions"><button type="button" onClick={() => action("duplicate", selectedId)} disabled={saving}><Copy size={16} /> Duplicar</button>{!selectedPlan.archived && (selectedPlan.active ? <button type="button" onClick={() => action("deactivate", selectedId)} disabled={saving}><ToggleLeft size={16} /> Desativar</button> : <button type="button" onClick={() => action("activate", selectedId)} disabled={saving}><ToggleRight size={16} /> Ativar</button>)}{!selectedPlan.archived && <button type="button" className="danger" onClick={() => action("archive", selectedId)} disabled={saving}><Archive size={16} /> Arquivar</button>}</div>}</div>
          <form onSubmit={save}>
            <div className="admin-plans-form-grid"><label>Nome<input required value={form.name} onChange={(event) => setField("name", event.target.value)} /></label><label>Preço (BRL)<input required type="number" min="1" max="100000" step="0.01" value={form.amount} onChange={(event) => setField("amount", event.target.value)} /></label><label>Tipo de cobrança<select value={form.billingType} onChange={(event) => setField("billingType", event.target.value)}><option value="fixed">Período fixo</option><option value="recurring">Recorrente</option></select></label>{form.billingType === "fixed" ? <label>Duração (dias)<input required type="number" min="1" max="3650" step="1" value={form.intervalDays} onChange={(event) => setField("intervalDays", event.target.value)} /></label> : <><label>Frequência<input required type="number" min="1" max="12" step="1" value={form.frequency} onChange={(event) => setField("frequency", event.target.value)} /></label><label>Unidade<select value={form.frequencyType} onChange={(event) => setField("frequencyType", event.target.value)}><option value="months">Meses</option><option value="days">Dias</option></select></label></>}</div>
            <label>Descrição<textarea rows="3" maxLength="500" value={form.description} onChange={(event) => setField("description", event.target.value)} /></label>
            <BenefitsEditor benefits={form.benefits} onChange={(benefits) => setField("benefits", benefits)} disabled={saving} />
            <div className="admin-plans-switches"><label><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} /> Destacar plano</label><label>Ordem<input type="number" min="-10000" max="10000" step="1" value={form.sortOrder} onChange={(event) => setField("sortOrder", event.target.value)} /></label></div>
            <div className="admin-plans-save-row"><button type="submit" className="admin-plans-primary" disabled={saving}><Save size={17} /> {saving ? "Salvando..." : "Salvar plano"}</button></div>
          </form>
          <div className="admin-plans-preview-wrap"><h3>Pré-visualização</h3><PlanPreview form={form} /></div>
        </section>
      </div>
    </main>
  );
}
