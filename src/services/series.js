
import api from "./api";

// =========================================
// CONFIGURATION
// =========================================

const BASE_URL = "/series";

// =========================================
// URL HELPERS
// =========================================

const seriesUrl = (seriesId) =>
  `${BASE_URL}/${encodeURIComponent(seriesId)}`;

const seasonUrl = (seriesId, seasonNumber) =>
  `${seriesUrl(seriesId)}/seasons/${encodeURIComponent(
    seasonNumber
  )}`;

const episodeUrl = (
  seriesId,
  seasonNumber,
  episodeNumber
) =>
  `${seasonUrl(seriesId, seasonNumber)}/episodes/${encodeURIComponent(
    episodeNumber
  )}`;

// =========================================
// DATA HELPERS
// =========================================

// Somente os campos aceitos pelo controller
// para criar ou atualizar os metadados.
const SERIES_FIELDS = [
  "tmdbId",
  "title",
  "overview",
  "poster",
  "backdrop",
  "year",
  "genres",
  "status",
  "published",
];

const pickFields = (data, fields) => {
  const result = {};

  for (const field of fields) {
    if (data?.[field] !== undefined) {
      result[field] = data[field];
    }
  }

  return result;
};

export const normalizeSeriesMetadata = (data) => {
  const metadata = pickFields(data, SERIES_FIELDS);

  if (typeof metadata.title === "string") {
    metadata.title = metadata.title.trim();
  }

  if (metadata.published !== undefined) {
    metadata.published = metadata.published === true;
  }

  if (metadata.tmdbId === "") {
    delete metadata.tmdbId;
  }

  if (metadata.year === "") {
    delete metadata.year;
  }

  return metadata;
};

// =========================================
// SERIES - READ
// =========================================

// Listagem administrativa.
// O backend deve restringir este endpoint
// aos administradores.
export async function getSeries(params = {}) {
  const response = await api.get(BASE_URL, {
    params,
  });

  return response.data;
}

// Catálogo de séries publicadas.
export async function getSeriesCatalog(params = {}) {
  const response = await api.get(
    `${BASE_URL}/catalog`,
    { params }
  );

  return response.data;
}

// Séries exibidas na Home.
export async function getHomeSeries() {
  const response = await api.get(
    `${BASE_URL}/home`
  );

  return response.data;
}

// Detalhes de uma série.
// Para edição, o backend deve retornar
// o documento completo ao administrador.
export async function getSeriesById(id) {
  const response = await api.get(
    seriesUrl(id)
  );

  return response.data;
}

// =========================================
// SERIES - ADMIN READ
// =========================================

// Recupera séries publicadas ou não publicadas.
// Requer autenticação de administrador.
export async function getAdminSeriesById(id) {
  const response = await api.get(
    `${BASE_URL}/admin/${encodeURIComponent(id)}`
  );

  return response.data;
}

// =========================================
// SERIES - CREATE / UPDATE / DELETE
// =========================================

export async function createSeries(data) {
  const response = await api.post(
    BASE_URL,
    normalizeSeriesMetadata(data)
  );

  return response.data;
}

export async function updateSeries(id, data) {
  const response = await api.put(
    seriesUrl(id),
    normalizeSeriesMetadata(data)
  );

  return response.data;
}

export async function deleteSeries(id) {
  const response = await api.delete(
    seriesUrl(id)
  );

  return response.data;
}

// =========================================
// SEASONS
// =========================================

export async function addSeason(
  seriesId,
  seasonNumber,
  title = ""
) {
  const response = await api.post(
    `${seriesUrl(seriesId)}/seasons`,
    {
      seasonNumber: Number(seasonNumber),
      title,
    }
  );

  return response.data;
}

export async function updateSeason(
  seriesId,
  seasonNumber,
  data
) {
  const response = await api.put(
    seasonUrl(seriesId, seasonNumber),
    {
      title: data.title,
    }
  );

  return response.data;
}

export async function deleteSeason(
  seriesId,
  seasonNumber,
  force = false
) {
  const response = await api.delete(
    seasonUrl(seriesId, seasonNumber),
    {
      params: {
        force,
      },
    }
  );

  return response.data;
}

// =========================================
// EPISODES
// =========================================

const EPISODE_FIELDS = [
  "episodeNumber",
  "title",
  "overview",
  "duration",
  "still",
  "videoUrl",
  "sources",
];

export const normalizeEpisode = (data) => {
  const episode = pickFields(
    data,
    EPISODE_FIELDS
  );

  if (episode.episodeNumber !== undefined) {
    episode.episodeNumber = Number(
      episode.episodeNumber
    );
  }

  if (
    episode.duration === "" ||
    episode.duration === null
  ) {
    episode.duration = 0;
  } else if (episode.duration !== undefined) {
    episode.duration = Number(
      episode.duration
    );
  }

  if (typeof episode.title === "string") {
    episode.title = episode.title.trim();
  }

  return episode;
};

export async function addEpisode(
  seriesId,
  seasonNumber,
  episode
) {
  const response = await api.post(
    `${seriesUrl(seriesId)}/episodes`,
    {
      seasonNumber: Number(seasonNumber),
      episode: normalizeEpisode(episode),
    }
  );

  return response.data;
}

export async function updateEpisode(
  seriesId,
  seasonNumber,
  episodeNumber,
  data
) {
  const payload = normalizeEpisode(data);

  // O número identifica o episódio na URL.
  // O controller atual não permite renumerá-lo.
  delete payload.episodeNumber;

  const response = await api.put(
    episodeUrl(
      seriesId,
      seasonNumber,
      episodeNumber
    ),
    payload
  );

  return response.data;
}

export async function deleteEpisode(
  seriesId,
  seasonNumber,
  episodeNumber
) {
  const response = await api.delete(
    episodeUrl(
      seriesId,
      seasonNumber,
      episodeNumber
    )
  );

  return response.data;
}

// =========================================
// FAVORITES
// =========================================

export async function toggleSeriesFavorite(
  seriesId
) {
  const response = await api.patch(
    `${seriesUrl(seriesId)}/favorite`
  );

  return response.data;
}

export async function getFavoriteSeries(
  params = {}
) {
  const response = await api.get(
    `${BASE_URL}/favorites/list`,
    {
      params,
    }
  );

  return response.data;
}

// =========================================
// VIEWS
// =========================================

export async function addSeriesView(id) {
  const response = await api.post(
    `${seriesUrl(id)}/view`
  );

  return response.data;
}

export async function addEpisodeView(
  seriesId,
  seasonNumber,
  episodeNumber
) {
  const response = await api.post(
    `${episodeUrl(
      seriesId,
      seasonNumber,
      episodeNumber
    )}/view`
  );

  return response.data;
}
