import api from "./api";

export async function analyzeContentHtml(html) {
  const { data } = await api.post("/admin/content-imports/analyze", { html });
  return data;
}

export async function createContentImportBatch(payload) {
  const { data } = await api.post("/admin/content-imports/batches", payload);
  return data;
}

export async function createStructuredContentImportBatch(payload) {
  const { data } = await api.post("/admin/content-imports/structured-batches", payload);
  return data;
}

export async function listContentImports(params = {}) {
  const { data } = await api.get("/admin/content-imports", { params });
  return data;
}

export async function getContentImport(id) {
  const { data } = await api.get(`/admin/content-imports/${encodeURIComponent(id)}`);
  return data;
}

export async function getContentImportHistory(id) {
  const { data } = await api.get(`/admin/content-imports/${encodeURIComponent(id)}/history`);
  return data;
}

export async function updateContentImport(id, payload) {
  const { data } = await api.patch(`/admin/content-imports/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function validateContentImport(id) {
  const { data } = await api.post(`/admin/content-imports/${encodeURIComponent(id)}/validate`);
  return data;
}

export async function linkContentImportTmdb(id, payload) {
  const { data } = await api.post(`/admin/content-imports/${encodeURIComponent(id)}/tmdb-link`, payload);
  return data;
}

export async function confirmContentImportValidation(id, payload = {}) {
  const { data } = await api.post(`/admin/content-imports/${encodeURIComponent(id)}/validation-confirm`, payload);
  return data;
}

export async function previewContentImportBatch(payload) {
  const { data } = await api.post("/admin/content-imports/batch/preview", payload);
  return data;
}

export async function processContentImportBatch(payload) {
  const { data } = await api.post("/admin/content-imports/batch/process", payload);
  return data;
}
