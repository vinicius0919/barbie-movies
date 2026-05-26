import api from "./api";

/* =========================================
   GET ALL
========================================= */

export async function getSeries(
  params = {}
) {
  const response =
    await api.get(
      "/api/series",
      {
        params,
      }
    );

  return response.data;
}

/* =========================================
   GET HOME
========================================= */

export async function getHomeSeries() {
  const response =
    await api.get(
      "/api/series/home"
    );

  return response.data;
}

/* =========================================
   GET BY ID
========================================= */

export async function getSeriesById(
  id
) {
  const response =
    await api.get(
      `/api/series/${id}`
    );

  return response.data;
}

/* =========================================
   CREATE
========================================= */

export async function createSeries(
  data
) {
  const response =
    await api.post(
      "/api/series",
      data
    );

  return response.data;
}

/* =========================================
   UPDATE
========================================= */

export async function updateSeries(
  id,
  data
) {
  const response =
    await api.put(
      `/api/series/${id}`,
      data
    );

  return response.data;
}

/* =========================================
   DELETE
========================================= */

export async function deleteSeries(
  id
) {
  const response =
    await api.delete(
      `/api/series/${id}`
    );

  return response.data;
}

/* =========================================
   ADD EPISODE
========================================= */

export async function addEpisode(
  seriesId,
  seasonNumber,
  episode
) {
  const response =
    await api.post(
      `/api/series/${seriesId}/episodes`,
      {
        seasonNumber,
        episode,
      }
    );

  return response.data;
}

/* =========================================
   UPDATE EPISODE
========================================= */

export async function updateEpisode(
  seriesId,
  seasonNumber,
  episodeNumber,
  data
) {
  const response =
    await api.put(
      `/api/series/${seriesId}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
      data
    );

  return response.data;
}

/* =========================================
   DELETE EPISODE
========================================= */

export async function deleteEpisode(
  seriesId,
  seasonNumber,
  episodeNumber
) {
  const response =
    await api.delete(
      `/api/series/${seriesId}/seasons/${seasonNumber}/episodes/${episodeNumber}`
    );

  return response.data;
}

/* =========================================
   SERIES VIEW
========================================= */

export async function addSeriesView(
  id
) {
  const response =
    await api.post(
      `/api/series/${id}/view`
    );

  return response.data;
}

/* =========================================
   EPISODE VIEW
========================================= */

export async function addEpisodeView(
  seriesId,
  seasonNumber,
  episodeNumber
) {
  const response =
    await api.post(
      `/api/series/${seriesId}/seasons/${seasonNumber}/episodes/${episodeNumber}/view`
    );

  return response.data;
}