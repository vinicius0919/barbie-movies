
import api from "./api";

const COLLECTIONS_URL = "/collections";

function extractCollections(data) {
  if (!Array.isArray(data?.collections)) {
    throw new Error(
      "A API retornou um formato de coleções inválido."
    );
  }

  return data.collections;
}

export async function getPublicCollectionConfigs() {
  const { data } = await api.get(COLLECTIONS_URL);
  return extractCollections(data);
}

export async function getAdminCollectionConfigs() {
  const { data } = await api.get(
    `${COLLECTIONS_URL}/admin`
  );

  return extractCollections(data);
}

export async function getAdminCollectionsMedia() {
  const { data } = await api.get(
    `${COLLECTIONS_URL}/admin/media`
  );

  if (
    !Array.isArray(data?.movies) ||
    !Array.isArray(data?.series)
  ) {
    throw new Error(
      "Catálogo administrativo inválido."
    );
  }

  return {
    movies: data.movies,
    series: data.series,
  };
}

export async function createCollection(payload) {
  const { data } = await api.post(
    COLLECTIONS_URL,
    payload
  );

  return data;
}

export async function updateCollection(id, payload) {
  const { data } = await api.put(
    `${COLLECTIONS_URL}/${encodeURIComponent(id)}`,
    payload
  );

  return data;
}

export async function deleteCollection(id) {
  const { data } = await api.delete(
    `${COLLECTIONS_URL}/${encodeURIComponent(id)}`
  );

  return data;
}
