
import api from "./api";

// =========================================
// HELPERS
// =========================================

const BASE_URL = "/series";

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
// SERIES - READ
// =========================================

export async function getSeries(params = {}) {
  const response = await api.get(BASE_URL, {
    params,
  });

  return response.data;
}

export async function getHomeSeries() {
  const response = await api.get(
    `${BASE_URL}/home`
  );

  return response.data;
}

export async function getSeriesById(id) {
  const response = await api.get(
    seriesUrl(id)
  );

  return response.data;
}

// =========================================
// SERIES - CREATE / UPDATE / DELETE
// =========================================

export async function createSeries(data) {
  const response = await api.post(
    BASE_URL,
    data
  );

  return response.data;
}

export async function updateSeries(id, data) {
  const response = await api.put(
    seriesUrl(id),
    data
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
      seasonNumber,
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
    data
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

export async function addEpisode(
  seriesId,
  seasonNumber,
  episode
) {
  const response = await api.post(
    `${seriesUrl(seriesId)}/episodes`,
    {
      seasonNumber,
      episode,
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
  const response = await api.put(
    episodeUrl(
      seriesId,
      seasonNumber,
      episodeNumber
    ),
    data
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
