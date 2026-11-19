import { contentImportStatusLabel } from "../utils/contentImportStatus";

export default function ContentImportStatusBadge({ value, kind = "processing" }) {
  const label = contentImportStatusLabel(value, kind);
  return <span className={`admin-imports-status admin-imports-status-${kind} ${value || "unknown"}`}>{label}</span>;
}
