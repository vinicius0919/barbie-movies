export default function AdminImportsSectionNav({ activeSection, onChange }) {
  const sections = [["import", "Importar"], ["review", "Revisar"], ["history", "Histórico"]];
  return (
    <nav className="admin-imports-nav" role="tablist" aria-label="Seções da Central de importações">
      {sections.map(([value, label]) => <button type="button" role="tab" key={value} className={activeSection === value ? "is-active" : ""} aria-selected={activeSection === value} aria-controls={`admin-imports-${value}`} onClick={() => onChange(value)}>{label}</button>)}
    </nav>
  );
}
