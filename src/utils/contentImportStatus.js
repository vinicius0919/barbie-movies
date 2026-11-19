export const contentImportStatusLabels = {
  processing: { pending: "Pendente", ready: "Pronto", processed: "Processado", rejected: "Rejeitado", error: "Erro" },
  validation: { unreviewed: "Não revisado", pending: "Pendente", validated: "Validado", rejected: "Rejeitado", error: "Com erro" },
  tmdb: { unlinked: "Não vinculado", suggested: "Sugerido", linked: "Vinculado", validated: "Validado", rejected: "Rejeitado" },
};

export function contentImportStatusLabel(value, kind = "processing") {
  return contentImportStatusLabels[kind]?.[value] || value || "Não informado";
}
