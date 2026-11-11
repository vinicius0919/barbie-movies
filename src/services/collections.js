
import api from "./api";
import { getSeriesCatalog } from "./series";

// Ajuste somente esta URL caso o serviço
// público de filmes utilize outra rota.
const MOVIES_URL = "/movies";
const COLLECTIONS_URL = "/collections";

function extractItems(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    ...keys.map((key) => data?.[key]),
    data?.items,
    data?.results,
    data?.data,
    data?.data?.items,
    data?.data?.results,
  ];

  const result = candidates.find(Array.isArray);

  if (!result) {
    throw new Error(
      "A API retornou um formato de catálogo inesperado."
    );
  }

  return result;
}

export async function getPublicMovies() {
  const { data } = await api.get(MOVIES_URL);

  return extractItems(data, ["movies"]);
}

export async function getPublicSeries() {
  const data = await getSeriesCatalog();

  return extractItems(data, ["series"]);
}

export async function getCollectionsCatalog() {
  const [moviesResult, seriesResult] =
    await Promise.allSettled([
      getPublicMovies(),
      getPublicSeries(),
    ]);

  const moviesOk = moviesResult.status === "fulfilled";
  const seriesOk = seriesResult.status === "fulfilled";

  if (!moviesOk && !seriesOk) {
    throw new Error(
      "Não foi possível carregar os catálogos de filmes e séries."
    );
  }

  const warnings = [];

  if (!moviesOk) {
    console.error(
      "[Collections] Erro ao carregar filmes:",
      moviesResult.reason
    );

    warnings.push(
      "Não foi possível carregar os filmes."
    );
  }

  if (!seriesOk) {
    console.error(
      "[Collections] Erro ao carregar séries:",
      seriesResult.reason
    );

    warnings.push(
      "Não foi possível carregar as séries."
    );
  }

  return {
    movies: moviesOk ? moviesResult.value : [],
    series: seriesOk ? seriesResult.value : [],
    warnings,
  };
}

function extractItems(data, keys = []) {
  if (Array.isArray(data)) return data;

  const candidates = [
    ...keys.map((key) => data?.[key]),
    data?.items,
    data?.results,
    data?.data,
    data?.data?.items,
    data?.data?.results,
  ];

  const result = candidates.find(Array.isArray);

  if (!result) {
    throw new Error(
      "A API retornou um formato de catálogo inesperado."
    );
  }

  return result;
}

export async function getPublicMovies() {
  const { data } = await api.get(MOVIES_URL);
  return extractItems(data, ["movies"]);
}

export async function getPublicSeries() {
  const data = await getSeriesCatalog();
  return extractItems(data, ["series"]);
}

export async function getCollectionsCatalog() {
  const [moviesResult, seriesResult] =
    await Promise.allSettled([
      getPublicMovies(),
      getPublicSeries(),
    ]);

  const moviesOk =
    moviesResult.status === "fulfilled";

  const seriesOk =
    seriesResult.status === "fulfilled";

  if (!moviesOk && !seriesOk) {
    throw new Error(
      "Não foi possível carregar os catálogos de filmes e séries."
    );
  }

  const warnings = [];

  if (!moviesOk) {
    console.error(
      "[Collections] Filmes:",
      moviesResult.reason
    );

    warnings.push(
      "Não foi possível carregar os filmes."
    );
  }

  if (!seriesOk) {
    console.error(
      "[Collections] Séries:",
      seriesResult.reason
    );

    warnings.push(
      "Não foi possível carregar as séries."
    );
  }

  return {
    movies: moviesOk ? moviesResult.value : [],
    series: seriesOk ? seriesResult.value : [],
    warnings,
  };
}

export async function getPublicCollectionConfigs() {
  const { data } = await api.get(COLLECTIONS_URL);
  return extractItems(data, ["collections"]);
}

export async function getAdminCollectionConfigs() {
  const { data } = await api.get(
    `${COLLECTIONS_URL}/admin`
  );

  return extractItems(data, ["collections"]);
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
