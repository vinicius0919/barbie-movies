// front-end services/tmdb.js

/* =====================================
   SEARCH MOVIES
===================================== */

import api from "./api";

export async function searchTmdb(
  query,
  page = 1
) {
  const response =
    await api.get(
      `/api/tmdb/movies/search`,
      {
        params: {
          query,
          page,
        },
      }
    );

  return response.data;
}


export async function searchTMDBSeries(
  query,
  page = 1
) {
  const response =
    await api.get(
      "/api/tmdb/series/search",
      {
        params: {
          query,
          page,
        },
      }
    );

  return response.data;
}