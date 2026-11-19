import { createPortal } from "react-dom";
import { Check, Loader2, Search, Save, X } from "lucide-react";
import ContentImportStatusBadge from "./ContentImportStatusBadge";
import { normalizeSourceUrl } from "../utils/contentImportParser";

export default function ContentImportReviewDrawer({
  reviewItem,
  reviewForm,
  reviewHistory,
  reviewError,
  reviewFeedback,
  reviewWorking,
  tmdbQuery,
  setTmdbQuery,
  tmdbResults,
  tmdbSelection,
  tmdbWorking,
  onClose,
  onSave,
  onValidate,
  onConfirmValidation,
  onProcess,
  onSearchTmdb,
  onLinkTmdb,
  onChangeTmdb,
  onConfirmMatch,
  setReviewForm,
  drawerRef,
  closeButtonRef,
}) {
  if (!reviewItem || !reviewForm) return null;

  const validation = reviewItem.validation || {};
  const linkedTmdbId = validation.tmdbId;
  const linkedTmdbTitle = tmdbSelection?.title || validation.tmdbTitle;
  const linkedTmdbImage = tmdbSelection?.poster || tmdbSelection?.poster_path || validation.tmdbPoster;
  const hasLocalMatches = validation.matches?.length > 0;
  const hasReviewedLocalMatch = ["pending", "validated", "conflict"].includes(validation.status);
  const sourceUrl = normalizeSourceUrl(reviewItem.sourceUrl) || reviewItem.sourceUrl || "";
  const candidateStatusLabels = { unknown: "Ainda não verificada", compatible: "Provider compatível", incompatible: "Não compatível com os providers atuais" };
  const localMatches = validation.matches || [];
  const canConfirmReview = validation.status !== "validated" && validation.tmdbStatus === "validated" && (localMatches.length === 0 || Boolean(reviewForm.objectId));
  const pendingProcessRequirements = [];
  if (validation.status !== "validated") pendingProcessRequirements.push("confirme a revisão administrativa");
  if (!reviewForm.objectId && reviewForm.suggestedType === "episode" && reviewForm.operation === "create" && !reviewForm.createSeriesConfirmed) pendingProcessRequirements.push("selecione uma série ou confirme sua criação");
  if (reviewForm.operation === "create" && !reviewForm.reproductionUrl) pendingProcessRequirements.push("informe ou aprove uma fonte de reprodução");
  if (reviewForm.operation === "create" && !reviewForm.reproductionAuthorizationConfirmed) pendingProcessRequirements.push("confirme a autorização da fonte");
  const processDisabled = reviewWorking || pendingProcessRequirements.length > 0;

  return createPortal(
    <div className="admin-imports-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={drawerRef} className="admin-imports-review-panel" role="dialog" aria-modal="true" aria-labelledby="admin-imports-review-title">
        <header className="admin-imports-review-header">
          <div className="admin-imports-review-heading">
            <span className="admin-imports-eyebrow">Revisão individual</span>
            <h2 id="admin-imports-review-title" title={reviewItem.extractedTitle}>{reviewItem.extractedTitle}</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="admin-imports-button admin-imports-button-ghost admin-imports-review-close" onClick={onClose} aria-label="Fechar revisão">
            <X size={20} />
          </button>
        </header>

        <div className="admin-imports-review-content">
          {reviewError && <div className="admin-imports-alert error" role="alert">{reviewError}</div>}
          {reviewFeedback && <div className="admin-imports-alert success" role="status">{reviewFeedback}</div>}
          {reviewItem.thumbnail && <img className="admin-imports-review-thumbnail" src={reviewItem.thumbnail} alt="Imagem extraída" />}

          <dl className="admin-imports-review-meta">
            <div><dt>URL de origem</dt><dd className="admin-imports-source-url">{sourceUrl ? <><a href={sourceUrl} target="_blank" rel="noreferrer">{sourceUrl}</a><a className="admin-imports-button admin-imports-button-outline" href={sourceUrl} target="_blank" rel="noreferrer">Abrir página original</a></> : "Não informada"}</dd></div>
            <div><dt>Série identificada</dt><dd>{reviewItem.metadata?.seriesName || "Não identificada"}</dd></div>
            <div><dt>Status</dt><dd><ContentImportStatusBadge value={reviewItem.processingStatus} /></dd></div>
            <div><dt>Vínculo TMDB</dt><dd><ContentImportStatusBadge value={validation.tmdbStatus || "unlinked"} kind="tmdb" /></dd></div>
            <div><dt>Revisão administrativa</dt><dd><ContentImportStatusBadge value={validation.status || "unreviewed"} kind="validation" /></dd></div>
          </dl>

          <section>
            <div className="admin-imports-review-section-heading"><span className="admin-imports-review-step">01</span><div><h3>Identificação</h3><p>Confira e corrija os dados extraídos.</p></div></div>
            <div className="admin-imports-review-grid">
              <label>Título<input value={reviewForm.extractedTitle} onChange={(event) => setReviewForm({ ...reviewForm, extractedTitle: event.target.value })} /></label>
              <label>Tipo<select value={reviewForm.suggestedType} onChange={(event) => setReviewForm({ ...reviewForm, suggestedType: event.target.value })}><option value="movie">Filme</option><option value="series">Série</option><option value="episode">Episódio</option></select></label>
              <label>Temporada<input type="number" min="0" value={reviewForm.seasonNumber} onChange={(event) => setReviewForm({ ...reviewForm, seasonNumber: event.target.value })} disabled={reviewForm.suggestedType !== "episode"} /></label>
              <label>Episódio<input type="number" min="0" value={reviewForm.episodeNumber} onChange={(event) => setReviewForm({ ...reviewForm, episodeNumber: event.target.value })} disabled={reviewForm.suggestedType !== "episode"} /></label>
              <label>Duração<input type="number" min="0" value={reviewForm.duration} onChange={(event) => setReviewForm({ ...reviewForm, duration: event.target.value })} /></label>
              <label>Thumbnail<input value={reviewForm.thumbnail} onChange={(event) => setReviewForm({ ...reviewForm, thumbnail: event.target.value })} /></label>
            </div>
            <button type="button" className="admin-imports-button admin-imports-button-secondary" onClick={onSave} disabled={reviewWorking}><Save size={16} /> Salvar dados extraídos</button>
          </section>

          <section>
            <div className="admin-imports-review-section-heading"><span className="admin-imports-review-step">02</span><div><h3>Correspondência TMDB</h3><p>Vincule manualmente os metadados corretos.</p></div></div>
            {linkedTmdbId ? <div className="admin-imports-tmdb-link-card">{linkedTmdbImage && <img src={linkedTmdbImage} alt="" /> }<div><strong>{linkedTmdbTitle || "Obra vinculada"}</strong><span>{validation.tmdbType === "movie" ? "Filme" : "Série"} · TMDB {linkedTmdbId} · Vínculo confirmado</span></div><button type="button" className="admin-imports-button admin-imports-button-outline" onClick={onChangeTmdb}>Alterar vínculo</button></div> : <div className="admin-imports-review-validation"><span>TMDB ainda não vinculado</span><small>Pesquise e confirme a obra correta. Esse vínculo não valida nem publica o conteúdo.</small></div>}
            <div className="admin-imports-review-search"><input value={tmdbQuery} onChange={(event) => setTmdbQuery(event.target.value)} placeholder="Pesquisar título" aria-label="Pesquisar no TMDB" /><button type="button" className="admin-imports-button admin-imports-button-secondary" onClick={onSearchTmdb} disabled={tmdbWorking || !tmdbQuery.trim()}>{tmdbWorking ? <Loader2 className="spinning" size={16} /> : <Search size={16} />} Pesquisar</button></div>
            {tmdbResults.length > 0 && <div className="admin-imports-review-results"><h4>Resultados TMDB — confirme uma correspondência</h4>{tmdbResults.map((result) => <button type="button" className="admin-imports-review-result" key={result.tmdbId || result.id} onClick={() => onLinkTmdb(result)}>{(result.poster || result.poster_path) && <img src={result.poster || result.poster_path} alt="" /> }<span><strong>{result.title || result.name}</strong><small>{result.year || result.release_date || result.first_air_date || "Ano não informado"} · {reviewForm.suggestedType === "movie" ? "Filme" : "Série"} · TMDB {result.tmdbId || result.id}</small>{result.alreadyAdded && <em>Já existe no catálogo</em>}</span></button>)}</div>}
            <div className="admin-imports-local-destination"><h4>Destino no MiqFlix</h4>{hasLocalMatches ? <><p>Correspondência local encontrada. Selecione o destino correto para confirmar a revisão.</p><div className="admin-imports-review-results">{localMatches.map((match, index) => <button type="button" className="admin-imports-review-result" key={`${match.model}-${match.objectId}-${index}`} onClick={() => onConfirmMatch(index)}><strong>{match.data?.title || match.model}</strong><small>{match.model}{match.seasonNumber !== undefined ? ` · Temporada ${match.seasonNumber}` : ""}{match.episodeNumber !== undefined ? ` · Episódio ${match.episodeNumber}` : ""} · selecionar e confirmar</small></button>)}</div></> : <p>{hasReviewedLocalMatch ? "Nenhuma correspondência local foi encontrada. Selecione uma série existente ou confirme a criação explícita do destino." : "A correspondência local ainda será consultada ao verificar correspondências."}</p>}</div>
          </section>

          <section>
            <div className="admin-imports-review-section-heading"><span className="admin-imports-review-step">03</span><div><h3>Destino</h3><p>Defina se o registro será criado ou atualizado.</p></div></div>
            <div className="admin-imports-review-grid">
              <label>Operação<select value={reviewForm.operation} onChange={(event) => setReviewForm({ ...reviewForm, operation: event.target.value })}><option value="create">Criar novo</option><option value="update">Atualizar existente</option></select></label>
              <label>Documento de destino<input value={reviewForm.objectId} onChange={(event) => setReviewForm({ ...reviewForm, objectId: event.target.value })} placeholder="ID do filme ou série" /></label>
              <label className="admin-imports-review-field-wide">Fonte de reprodução (opcional)<input value={reviewForm.reproductionUrl} onChange={(event) => setReviewForm({ ...reviewForm, reproductionUrl: event.target.value, reproductionCandidateStatus: "unknown" })} placeholder="Cole uma URL de reprodução autorizada, se disponível." aria-describedby="admin-imports-reproduction-help" /><small id="admin-imports-reproduction-help" className="admin-imports-field-help">A URL de origem é uma página externa. Só será usada como fonte após confirmação e validação do provider.</small>{sourceUrl && reviewForm.reproductionUrl !== sourceUrl && <button type="button" className="admin-imports-button admin-imports-button-outline admin-imports-use-source" onClick={() => setReviewForm({ ...reviewForm, reproductionUrl: sourceUrl, reproductionCandidateStatus: "unknown" })}>Usar URL de origem como candidata</button>}{reviewForm.reproductionUrl && <small className={`admin-imports-field-help admin-imports-candidate-status ${reviewForm.reproductionCandidateStatus === "incompatible" ? "is-error" : reviewForm.reproductionCandidateStatus === "compatible" ? "is-compatible" : ""}`}>Compatibilidade: {candidateStatusLabels[reviewForm.reproductionCandidateStatus] || candidateStatusLabels.unknown}.</small>}</label>
              {reviewForm.suggestedType === "episode" && reviewForm.operation === "create" && <label className="admin-imports-check-field"><input type="checkbox" checked={reviewForm.createSeriesConfirmed} onChange={(event) => setReviewForm({ ...reviewForm, createSeriesConfirmed: event.target.checked })} /> Confirmo a criação da série se não houver destino local</label>}
              {reviewForm.suggestedType === "episode" && reviewForm.operation === "create" && <label className="admin-imports-check-field"><input type="checkbox" checked={reviewForm.createSeason} onChange={(event) => setReviewForm({ ...reviewForm, createSeason: event.target.checked })} /> Confirmo a criação da temporada ausente</label>}
              {reviewForm.suggestedType === "series" && reviewForm.operation === "create" && <label className="admin-imports-check-field"><input type="checkbox" checked={reviewForm.createSeriesConfirmed} onChange={(event) => setReviewForm({ ...reviewForm, createSeriesConfirmed: event.target.checked })} /> Confirmo a criação desta nova série</label>}
              <label className="admin-imports-check-field"><input type="checkbox" checked={reviewForm.reproductionAuthorizationConfirmed} onChange={(event) => setReviewForm({ ...reviewForm, reproductionAuthorizationConfirmed: event.target.checked })} /> Confirmo que a fonte de reprodução foi autorizada e validada</label>
            </div>
          </section>

          <section>
            <div className="admin-imports-review-section-heading"><span className="admin-imports-review-step">04</span><div><h3>Validação</h3><p>Resolva as pendências antes de processar.</p></div></div>
            <div className="admin-imports-review-validation"><span><Check size={15} /> Status atual: {reviewItem.validation?.status === "validated" ? "Validado" : "Validação pendente"}</span>{reviewItem.validation?.status !== "validated" && <small>“Verificar correspondências” consulta o catálogo. Depois, use “Confirmar revisão” para liberar o processamento.</small>}</div>
          </section>

          <section>
            <div className="admin-imports-review-section-heading"><span className="admin-imports-review-step">05</span><div><h3>Histórico</h3><p>Eventos registrados para este conteúdo.</p></div></div>
            {reviewHistory.length === 0 ? <p className="admin-imports-history-empty">Nenhum evento registrado.</p> : <ul className="admin-imports-history">{reviewHistory.map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.operation}</strong><span>{entry.message}</span><small>{entry.at ? new Date(entry.at).toLocaleString("pt-BR") : ""}</small></li>)}</ul>}
          </section>
        </div>

        <footer className="admin-imports-review-footer">
          <button type="button" className="admin-imports-button admin-imports-button-secondary" onClick={onValidate} disabled={reviewWorking}>{reviewWorking ? <Loader2 className="spinning" size={16} /> : <Search size={16} />} Verificar correspondências</button>
          <button type="button" className="admin-imports-button admin-imports-button-secondary" onClick={onConfirmValidation} disabled={reviewWorking || !canConfirmReview}><Check size={16} /> Confirmar revisão</button>
          <button type="button" className="admin-imports-button admin-imports-button-primary" onClick={() => onProcess(reviewForm.operation)} disabled={processDisabled}>Processar</button>
          {pendingProcessRequirements.length > 0 && <small className="admin-imports-review-footer-help">Processamento bloqueado: {pendingProcessRequirements.join("; ")}.</small>}
          <button type="button" className="admin-imports-button admin-imports-button-danger" onClick={() => onProcess("reject")} disabled={reviewWorking}>Rejeitar</button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
