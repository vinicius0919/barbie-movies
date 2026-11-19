import { useEffect, useRef } from "react";

export default function BulkSelectionToolbar({
  selected,
  setSelected,
  visibleIds = [],
  totalCount = visibleIds.length,
  allResultsSelected = false,
  onSelectAllResults,
  onClear,
  selectAllResultsLabel = "Selecionar todos os resultados",
  selectVisibleLabel = "Selecionar visíveis",
  deselectVisibleLabel = "Desmarcar visíveis",
  children,
}) {
  const checkboxRef = useRef(null);
  const visibleSelectedCount = allResultsSelected
    ? visibleIds.length
    : visibleIds.filter((id) => selected.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const partiallySelected = visibleSelectedCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  function toggleVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected || allResultsSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    if (onClear) onClear();
    else setSelected(new Set());
  }

  return (
    <div className="bulk-selection-toolbar" role="toolbar" aria-label="Controles de seleção múltipla">
      <label className="bulk-selection-toggle">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allVisibleSelected || allResultsSelected}
          onChange={toggleVisible}
          aria-label={allVisibleSelected ? "Desmarcar registros visíveis" : "Selecionar registros visíveis"}
        />
        <span>{allVisibleSelected ? deselectVisibleLabel : selectVisibleLabel}</span>
      </label>
      {onSelectAllResults && (
        <button type="button" onClick={onSelectAllResults} aria-label={selectAllResultsLabel}>
          {selectAllResultsLabel}
        </button>
      )}
      <button type="button" onClick={clearSelection} disabled={selected.size === 0 && !allResultsSelected}>
        Desmarcar todos
      </button>
      <strong aria-live="polite">{allResultsSelected ? totalCount : selected.size} selecionado(s)</strong>
      {children}
    </div>
  );
}
