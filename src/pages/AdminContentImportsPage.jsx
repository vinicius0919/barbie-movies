import "./AdminContentImportsPage.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, FileInput, Loader2, RefreshCw, Search } from "lucide-react";
import AdminImportsSectionNav from "../components/AdminImportsSectionNav";
import BulkSelectionToolbar from "../components/BulkSelectionToolbar";
import ContentImportReviewDrawer from "../components/ContentImportReviewDrawer";
import ContentImportStatusBadge from "../components/ContentImportStatusBadge";
import {
  createStructuredContentImportBatch,
  confirmContentImportValidation,
  getContentImport,
  getContentImportHistory,
  linkContentImportTmdb,
  listContentImports,
  previewContentImportBatch,
  processContentImportBatch,
  updateContentImport,
  validateContentImport,
} from "../services/contentImports";
import { searchTmdb, searchTMDBSeries } from "../services/tmdb";
import { DEFAULT_IMPORT_SOURCE_ORIGIN, extractContentImports, suggestSeriesName } from "../utils/contentImportParser";
import { createBatchId } from "../utils/batchId";
import { formatImportSize, getUtf8ByteLength, readImportFile, validateImportText } from "../utils/contentImportInput";
import { contentImportStatusLabel } from "../utils/contentImportStatus";

const typeLabels = { movie: "Filme", series: "Série", episode: "Episódio" };
const statusLabels = { pending: "Pendente", ready: "Pronto", processed: "Processado", rejected: "Rejeitado", error: "Erro", unlinked: "Não vinculado", unreviewed: "Não revisado", validated: "Validado" };

function getPreviewId(record) {
  return typeof record?.sourceKey === "string" && record.sourceKey.trim()
    ? record.sourceKey
    : typeof record?.sourceUrl === "string" && record.sourceUrl.trim()
      ? record.sourceUrl.trim().toLowerCase()
      : null;
}

function getInitialTmdbQuery(item, form) {
  const title = form?.extractedTitle || item?.extractedTitle || "";
  return form?.suggestedType === "episode" ? (suggestSeriesName(item?.metadata?.seriesName || title) || title) : title;
}

export default function AdminContentImportsPage() {
  const [html, setHtml] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(new Set());
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [filters, setFilters] = useState({ search: "", type: "", status: "", batchId: "", page: 1 });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [batchProgress, setBatchProgress] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewForm, setReviewForm] = useState(null);
  const [reviewInitialForm, setReviewInitialForm] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewWorking, setReviewWorking] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbWorking, setTmdbWorking] = useState(false);
  const [tmdbSelection, setTmdbSelection] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [activeSection, setActiveSection] = useState("import");
  const cancelRef = useRef(false);
  const reviewTriggerRef = useRef(null);
  const reviewDrawerRef = useRef(null);
  const reviewCloseButtonRef = useRef(null);
  const reviewFormRef = useRef(null);
  const reviewInitialFormRef = useRef(null);
  const reviewWorkingRef = useRef(false);
  useEffect(() => {
    reviewFormRef.current = reviewForm;
    reviewInitialFormRef.current = reviewInitialForm;
    reviewWorkingRef.current = reviewWorking;
  }, [reviewForm, reviewInitialForm, reviewWorking]);

  const loadItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await listContentImports(filters);
      setItems(response.data || []);
      setPagination(response.pagination || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // A listagem inicial sincroniza dados externos e atualiza o estado ao concluir.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadItems(false); }, [loadItems]);

  const selectedPreviewCount = selectedPreview.size;
  const previewIds = useMemo(() => (analysis?.records || []).map((record) => getPreviewId(record)).filter(Boolean), [analysis]);
  const itemIds = useMemo(() => items.map((item) => item._id).filter(Boolean), [items]);
  const updateListSelection = useCallback((updater) => {
    setSelectAllFiltered(false);
    setSelected(updater);
  }, []);

  function togglePreview(sourceKey) {
    if (!sourceKey) return;
    setSelectedPreview((current) => {
      const next = new Set(current);
      if (next.has(sourceKey)) next.delete(sourceKey);
      else next.add(sourceKey);
      return next;
    });
  }

  function updateImportText(value) {
    setHtml(value);
    setAnalysis(null);
    setSelectedPreview(new Set());
    setError("");
    setMessage("");
    const validation = validateImportText(value);
    setInputError(validation.error ? `Colagem: ${validation.error}` : "");
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    setAnalysis(null);
    setSelectedPreview(new Set());
    try {
      const result = await readImportFile(file);
      setHtml(result.text);
      setInputError("");
      setMessage(`Arquivo carregado: ${file.name} (${formatImportSize(result.bytes)}).`);
    } catch (fileError) {
      setHtml("");
      setInputError(`Arquivo: ${fileError.message || "não foi possível ler o conteúdo."}`);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    const validation = validateImportText(html);
    if (!validation.valid) {
      setInputError(validation.error);
      return;
    }
    if (!html.trim()) {
      setError("Análise: o conteúdo HTML está vazio.");
      return;
    }
    setError("");
    setMessage("");
    setWorking(true);
    try {
      const result = extractContentImports(html);
      const validRecords = (result.records || []).filter((record) => getPreviewId(record));
      setAnalysis({ ...result, records: validRecords });
      setSelectedPreview(new Set(validRecords.map((record) => getPreviewId(record))));
    } catch (requestError) {
      setError(`Análise: ${requestError.message || "não foi possível interpretar o HTML."}`);
    } finally {
      setWorking(false);
    }
  }

  async function handleImport() {
    if (!analysis || !selectedPreviewCount) return;
    if (!window.confirm(`Importar ${selectedPreviewCount} registro(s) para revisão? Nenhum conteúdo será publicado.`)) return;
    setError("");
    setWorking(true);
    cancelRef.current = false;
    try {
      const operationBatchId = createBatchId();
      const records = analysis.records.filter((record) => selectedPreview.has(getPreviewId(record)));
      if (!records.length) throw new Error("Nenhum registro válido foi selecionado para importação.");
      const chunks = [];
      let current = [];
      let currentBytes = 0;
      for (const record of records) {
        const size = new TextEncoder().encode(JSON.stringify(record)).length + 120;
        if (current.length && (current.length >= 50 || currentBytes + size > 70_000)) { chunks.push(current); current = []; currentBytes = 0; }
        current.push(record); currentBytes += size;
      }
      if (current.length) chunks.push(current);
      setBatchProgress({ total: chunks.length, completed: 0, imported: 0, duplicates: 0, errors: 0, pending: chunks.length });
      let totals = { imported: 0, duplicates: 0, errors: 0 };
      for (let index = 0; index < chunks.length; index += 1) {
        if (cancelRef.current) break;
        let result;
        let attempt = 0;
        while (attempt < 3) {
          try { result = await createStructuredContentImportBatch({ batchId: operationBatchId, sourceOrigin: DEFAULT_IMPORT_SOURCE_ORIGIN, records: chunks[index] }); break; }
          catch (requestError) {
            const status = requestError.response?.status;
            if (![413, 429, 500].includes(status) && requestError.code !== "ERR_NETWORK" && requestError.code !== "ECONNABORTED") throw requestError;
            if (status === 413 && chunks[index].length > 1) { const middle = Math.ceil(chunks[index].length / 2); chunks.splice(index, 1, chunks[index].slice(0, middle), chunks[index].slice(middle)); setBatchProgress((value) => ({ ...value, total: chunks.length, pending: chunks.length - value.completed })); index -= 1; break; }
            await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt))); attempt += 1;
          }
        }
        if (!result) continue;
        totals = { imported: totals.imported + result.imported, duplicates: totals.duplicates + result.duplicates, errors: totals.errors + result.errors };
        setBatchProgress((value) => ({ ...value, completed: index + 1, pending: chunks.length - index - 1, ...totals }));
      }
      setMessage(`${totals.imported} importado(s), ${totals.duplicates} duplicata(s), ${totals.errors} erro(s).`);
      await loadItems();
    } catch (requestError) {
      setError(`Envio: ${requestError?.response?.status === 413
        ? "o lote excede o tamanho permitido. Reduza a quantidade de registros e tente novamente."
        : requestError?.message || "não foi possível iniciar a importação."}`);
    } finally {
      setWorking(false);
    }
  }

  function cancelPendingBatches() { cancelRef.current = true; setMessage("Envios pendentes cancelados; lotes concluídos foram preservados."); }

  function toggleItem(id) {
    setSelectAllFiltered(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function reviewFormFromItem(item) {
    return {
      extractedTitle: item.extractedTitle || "",
      suggestedType: item.suggestedType || "movie",
      seasonNumber: item.seasonNumber ?? "",
      episodeNumber: item.episodeNumber ?? "",
      duration: item.duration ?? "",
      thumbnail: item.thumbnail || "",
      objectId: item.finalReference?.objectId || "",
      operation: item.finalReference?.objectId ? "update" : "create",
      reproductionUrl: item.reproductionCandidateUrl || "",
      reproductionCandidateStatus: item.reproductionCandidateStatus || "unknown",
      reproductionAuthorizationConfirmed: false,
      createSeason: false,
      createSeriesConfirmed: false,
    };
  }

  async function openReview(id, trigger = null) {
    setReviewError("");
    setReviewWorking(true);
    reviewTriggerRef.current = trigger;
    try {
      const [item, history] = await Promise.all([getContentImport(id), getContentImportHistory(id)]);
      const form = reviewFormFromItem(item);
      // O registro já foi carregado; liberar o fechamento antes de montar o drawer
      // evita que o usuário fique preso ao estado transitório da requisição inicial.
      setReviewWorking(false);
      setReviewItem(item);
      setReviewHistory(history.history || []);
      setReviewForm(form);
      setReviewInitialForm(form);
      setTmdbQuery(getInitialTmdbQuery(item, form));
      setTmdbResults([]);
      setTmdbSelection(null);
      setReviewFeedback("");
    } catch (requestError) {
      setError(`Revisão: ${requestError.message || "não foi possível carregar o registro."}`);
    } finally {
      setReviewWorking(false);
    }
  }

  const closeReview = useCallback(() => {
    if (reviewWorkingRef.current) return;
    const dirty = reviewFormRef.current && reviewInitialFormRef.current && JSON.stringify(reviewFormRef.current) !== JSON.stringify(reviewInitialFormRef.current);
    if (dirty && !window.confirm("Fechar a revisão? Alterações ainda não salvas serão descartadas.")) return;
    const trigger = reviewTriggerRef.current;
    setReviewItem(null);
    setReviewForm(null);
    setReviewInitialForm(null);
    setReviewHistory([]);
    setTmdbResults([]);
    setTmdbSelection(null);
    setReviewFeedback("");
    setReviewError("");
    window.requestAnimationFrame(() => trigger?.focus?.());
  }, []);

  useEffect(() => {
    if (!reviewItem) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => reviewCloseButtonRef.current?.focus());
    function handleReviewKeyDown(event) {
      if (event.key === "Escape") {
        closeReview();
        return;
      }
      if (event.key !== "Tab" || !reviewDrawerRef.current) return;
      const focusable = [...reviewDrawerRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex=\"-1\"])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", handleReviewKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleReviewKeyDown);
    };
  }, [closeReview, reviewItem]);

  async function refreshReview(itemId = reviewItem?._id) {
    const [item, history] = await Promise.all([getContentImport(itemId), getContentImportHistory(itemId)]);
    setReviewItem(item);
    setReviewHistory(history.history || []);
    const form = reviewFormFromItem(item);
    setReviewForm(form);
    setReviewInitialForm(form);
  }

  async function saveReview() {
    if (!reviewItem || !reviewForm) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      await updateContentImport(reviewItem._id, {
        extractedTitle: reviewForm.extractedTitle,
        suggestedType: reviewForm.suggestedType,
        seasonNumber: reviewForm.seasonNumber,
        episodeNumber: reviewForm.episodeNumber,
        duration: reviewForm.duration,
        thumbnail: reviewForm.thumbnail,
        reproductionCandidateUrl: reviewForm.reproductionUrl,
      });
      await refreshReview();
      await loadItems(false);
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível salvar a revisão.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function validateReview() {
    if (!reviewItem) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      const item = await validateContentImport(reviewItem._id);
      const history = await getContentImportHistory(reviewItem._id);
      setReviewItem(item);
      setReviewHistory(history.history || []);
      const form = reviewFormFromItem(item);
      setReviewForm(form);
      setReviewInitialForm(form);
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível validar o registro.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function searchReviewTmdb() {
    if (!reviewItem || !tmdbQuery.trim()) return;
    setTmdbWorking(true);
    setReviewError("");
    try {
      const response = reviewForm.suggestedType === "movie" ? await searchTmdb(tmdbQuery.trim()) : await searchTMDBSeries(tmdbQuery.trim());
      setTmdbResults(response.results || []);
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível pesquisar no TMDB.");
    } finally {
      setTmdbWorking(false);
    }
  }

  async function linkReviewTmdb(result) {
    if (!reviewItem) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      const tmdbType = reviewForm.suggestedType === "movie" ? "movie" : "tv";
      const tmdbId = Number(result.tmdbId || result.id);
      if (reviewItem.validation?.tmdbId === tmdbId && reviewItem.validation?.tmdbType === tmdbType && reviewItem.validation?.tmdbStatus === "validated") {
        setReviewFeedback("Este vínculo TMDB já está confirmado; nenhuma nova operação foi executada.");
        setTmdbResults([]);
        return;
      }
      const item = await linkContentImportTmdb(reviewItem._id, { tmdbId, tmdbType });
      const history = await getContentImportHistory(reviewItem._id);
      setReviewItem(item);
      setReviewHistory(history.history || []);
      const form = reviewFormFromItem(item);
      setReviewForm(form);
      setReviewInitialForm(form);
      setTmdbResults([]);
      setTmdbSelection(result);
      setReviewFeedback(`Vínculo TMDB salvo: ${result.title || "obra selecionada"} (TMDB ${result.tmdbId || result.id}).`);
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível vincular o TMDB.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function confirmReviewMatch(matchIndex) {
    if (!reviewItem) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      const item = await confirmContentImportValidation(reviewItem._id, { matchIndex, operation: reviewForm.operation, objectId: reviewForm.objectId || undefined, createSeriesConfirmed: reviewForm.createSeriesConfirmed });
      const history = await getContentImportHistory(reviewItem._id);
      setReviewItem(item);
      setReviewHistory(history.history || []);
      const form = reviewFormFromItem(item);
      setReviewForm(form);
      setReviewInitialForm(form);
      setReviewFeedback("Destino local selecionado e revisão administrativa confirmada.");
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível confirmar a correspondência.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function confirmReview() {
    if (!reviewItem || !reviewForm) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      const item = await confirmContentImportValidation(reviewItem._id, {
        matchIndex: null,
        operation: reviewForm.operation,
        objectId: reviewForm.objectId || undefined,
        createSeriesConfirmed: reviewForm.createSeriesConfirmed,
      });
      const history = await getContentImportHistory(reviewItem._id);
      setReviewItem(item);
      setReviewHistory(history.history || []);
      const form = reviewFormFromItem(item);
      setReviewForm(form);
      setReviewInitialForm(form);
      setReviewFeedback("Revisão administrativa confirmada. O registro está apto para processamento, sujeito aos demais requisitos.");
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível confirmar a revisão.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function processReview(operation) {
    if (!reviewItem || !reviewForm) return;
    setReviewWorking(true);
    setReviewError("");
    try {
      const payload = {
        ids: [reviewItem._id],
        operation,
        objectId: reviewForm.objectId || undefined,
        title: reviewForm.extractedTitle,
        reproductionUrl: reviewForm.reproductionUrl || undefined,
        reproductionAuthorizationConfirmed: reviewForm.reproductionAuthorizationConfirmed,
        createSeason: reviewForm.createSeason,
        createSeriesConfirmed: reviewForm.createSeriesConfirmed,
        seriesTitle: reviewItem.metadata?.seriesName || undefined,
      };
      const preview = await previewContentImportBatch(payload);
      if (!window.confirm(`Registro elegível: ${preview.eligible}. Conflitos: ${preview.conflicts}. Confirmar operação?`)) return;
      const result = await processContentImportBatch(payload);
      const outcome = result.results?.[0];
      if (outcome?.result === "error") throw new Error(outcome.message || "O processamento falhou.");
      await refreshReview();
      await loadItems(false);
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || requestError.message || "Não foi possível processar o registro.");
    } finally {
      setReviewWorking(false);
    }
  }

  async function handleBatch(operation) {
    const ids = [...selected];
    if (!ids.length || selectAllFiltered) {
      setError("Selecione registros carregados individualmente para esta operação.");
      return;
    }
    setError("");
    setWorking(true);
    try {
      const preview = await previewContentImportBatch({ ids, operation });
      const confirmed = window.confirm(`Revisão: ${preview.eligible} elegível(is), ${preview.conflicts} conflito(s), ${preview.manualReview} para revisão manual. Confirmar?`);
      if (!confirmed) return;
      const result = await processContentImportBatch({ ids, operation });
      const errors = (result.results || []).filter((item) => item.result === "error").length;
      setMessage(`${result.results?.length || 0} registro(s) processado(s). ${errors} erro(s).`);
      await loadItems();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="admin-imports">
      <header className="admin-imports-header">
        <div><span className="admin-imports-eyebrow">Administração</span><h1>Central de importação</h1><p>Prepare conteúdos a partir de HTML para validação manual.</p></div>
        <button type="button" onClick={() => void loadItems()} disabled={loading}><RefreshCw size={17} /> Atualizar</button>
      </header>

      {error && <div className="admin-imports-alert error" role="alert">{error}</div>}
      {message && <div className="admin-imports-alert success" role="status">{message}</div>}

      <AdminImportsSectionNav activeSection={activeSection} onChange={setActiveSection} />

      {activeSection === "import" && <section id="admin-imports-import" className="admin-imports-section admin-imports-analyzer">
        <div className="admin-imports-section-title"><FileInput size={20} /><div><span className="admin-imports-section-kicker">Importar</span><h2>Analisar HTML</h2><p>Scripts são tratados como texto e não são executados.</p></div></div>
        <form onSubmit={handleAnalyze}>
          <textarea value={html} onChange={(event) => updateImportText(event.target.value)} placeholder="Cole aqui o HTML com os links dos conteúdos…" aria-describedby="admin-imports-input-help" required />
          <div id="admin-imports-input-help" className={`admin-imports-input-meta${inputError ? " has-error" : ""}`}>
            <span>{html.length.toLocaleString("pt-BR")} caracteres · {formatImportSize(getUtf8ByteLength(html))} / 5 MB</span>
            {inputError && <strong role="alert">{inputError}</strong>}
          </div>
          <div className="admin-imports-source-actions">
            <label className="admin-imports-file-button">
              <FileInput size={17} /> Carregar .html ou .txt
              <input type="file" accept=".html,.htm,.txt,text/html,text/plain" onChange={handleFileChange} disabled={working} />
            </label>
            <button type="submit" disabled={working || !html.trim() || Boolean(inputError)}>{working ? <Loader2 className="spinning" size={17} /> : <Search size={17} />} Analisar conteúdo</button>
          </div>
        </form>
        {analysis && <div className="admin-imports-analysis"><span>{analysis.linksFound} links válidos</span><span>{analysis.uniqueLinks} únicos</span><span>{analysis.duplicates} duplicados</span><BulkSelectionToolbar selected={selectedPreview} setSelected={setSelectedPreview} visibleIds={previewIds} selectVisibleLabel="Selecionar todos" deselectVisibleLabel="Desmarcar todos"><button type="button" className="bulk-selection-primary" onClick={handleImport} disabled={working || !selectedPreviewCount}>Importar {selectedPreviewCount} selecionado(s)</button>{working && <button type="button" onClick={cancelPendingBatches}>Cancelar próximos envios</button>}</BulkSelectionToolbar></div>}
        {batchProgress && <div className="admin-imports-progress">Lotes: {batchProgress.completed}/{batchProgress.total} · Registros importados: {batchProgress.imported} · Duplicatas: {batchProgress.duplicates} · Erros: {batchProgress.errors}</div>}
        {analysis?.records?.length > 0 && <div className="admin-imports-preview">{analysis.records.map((record) => { const previewId = getPreviewId(record); return <label key={previewId} className="admin-imports-preview-row"><input type="checkbox" checked={selectedPreview.has(previewId)} onChange={() => togglePreview(previewId)} /><span><strong>{record.extractedTitle}</strong><small>{typeLabels[record.suggestedType]}{record.seasonNumber !== undefined ? ` · T${record.seasonNumber}` : ""}{record.episodeNumber !== undefined ? ` E${record.episodeNumber}` : ""} · {record.sourceUrl}</small></span></label>; })}</div>}
      </section>}

      {activeSection === "review" && <section id="admin-imports-review" className="admin-imports-section admin-imports-list">
        <div className="admin-imports-list-toolbar"><div><span className="admin-imports-section-kicker">Revisar</span><h2>Registros preparados</h2><span>{pagination?.total || 0} total</span></div><div className="admin-imports-filters"><label><span>Busca</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder="Título" /></label><label><span>Tipo</span><select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value, page: 1 })}><option value="">Todos</option><option value="movie">Filmes</option><option value="series">Séries</option><option value="episode">Episódios</option></select></label><label><span>Status</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        <BulkSelectionToolbar selected={selected} setSelected={updateListSelection} onClear={() => { setSelected(new Set()); setSelectAllFiltered(false); }} visibleIds={itemIds} totalCount={pagination?.total || 0} allResultsSelected={selectAllFiltered} selectVisibleLabel="Selecionar página" deselectVisibleLabel="Desmarcar página" onSelectAllResults={() => setSelectAllFiltered(true)}><button type="button" disabled={working || (!selected.size && !selectAllFiltered)} onClick={() => void handleBatch("reject")}>Rejeitar selecionados</button><button type="button" disabled={working || (!selected.size && !selectAllFiltered)} onClick={() => void handleBatch("create")}>Criar elegíveis</button></BulkSelectionToolbar>
        {selected.size > 1 && !selectAllFiltered && <div className="admin-imports-selection-context" role="status">{selected.size} registros selecionados. A revisão em massa será disponibilizada em uma etapa futura.</div>}
        {loading ? <div className="admin-imports-state"><Loader2 className="spinning" size={24} /> Carregando…</div> : items.length === 0 ? <div className="admin-imports-state">Nenhuma importação encontrada.</div> : <div className="admin-imports-table">{items.map((item) => <div className={`admin-imports-row${selected.has(item._id) || selectAllFiltered ? " is-selected" : ""}`} key={item._id}><input type="checkbox" checked={selectAllFiltered || selected.has(item._id)} onChange={() => toggleItem(item._id)} aria-label={`Selecionar ${item.extractedTitle}`} /><span className="admin-imports-row-main"><strong>{item.extractedTitle}</strong><small>{typeLabels[item.suggestedType] || "Tipo não informado"}{item.seasonNumber !== undefined ? ` · T${item.seasonNumber}` : ""}{item.episodeNumber !== undefined ? ` E${item.episodeNumber}` : ""}</small></span><ContentImportStatusBadge value={item.processingStatus} /><small>{new Date(item.createdAt).toLocaleString("pt-BR")}</small><Check size={17} className={item.validation?.status === "validated" ? "validated" : "muted"} aria-label={contentImportStatusLabel(item.validation?.status || "unreviewed", "validation")} /><button type="button" className="admin-imports-button admin-imports-button-secondary admin-imports-review-button" onClick={(event) => void openReview(item._id, event.currentTarget)} disabled={reviewWorking}>Revisar</button></div>)}</div>}
        {pagination?.totalPages > 1 && <div className="admin-imports-pagination"><button type="button" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</button><span>Página {filters.page} de {pagination.totalPages}</span><button type="button" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Próxima</button></div>}
      </section>}
      <ContentImportReviewDrawer reviewItem={reviewItem} reviewForm={reviewForm} reviewHistory={reviewHistory} reviewError={reviewError} reviewFeedback={reviewFeedback} reviewWorking={reviewWorking} tmdbQuery={tmdbQuery} setTmdbQuery={setTmdbQuery} tmdbResults={tmdbResults} tmdbSelection={tmdbSelection} tmdbWorking={tmdbWorking} onClose={closeReview} onSave={() => void saveReview()} onValidate={() => void validateReview()} onConfirmValidation={() => void confirmReview()} onProcess={(operation) => void processReview(operation)} onSearchTmdb={() => void searchReviewTmdb()} onLinkTmdb={(result) => void linkReviewTmdb(result)} onChangeTmdb={() => { setTmdbSelection(null); setTmdbResults([]); setReviewFeedback(""); }} onConfirmMatch={(index) => void confirmReviewMatch(index)} setReviewForm={setReviewForm} drawerRef={reviewDrawerRef} closeButtonRef={reviewCloseButtonRef} />
      {activeSection === "history" && <section id="admin-imports-history" className="admin-imports-section admin-imports-history-section">
        <div className="admin-imports-section-title"><RefreshCw size={20} /><div><span className="admin-imports-section-kicker">Histórico</span><h2>Operações recentes</h2><p>Os eventos detalhados de cada registro continuam disponíveis na revisão individual.</p></div></div>
        {batchProgress ? <div className="admin-imports-history-summary"><strong>Última importação estruturada</strong><span>{batchProgress.completed}/{batchProgress.total} lotes concluídos</span><span>{batchProgress.imported} registros importados</span><span>{batchProgress.errors} erros</span></div> : <p className="admin-imports-history-empty">Nenhuma operação em lote nesta sessão.</p>}
      </section>}
    </main>
  );
}
