// services/movies.js

import api from "./api";

/* =========================================
   GET ALL
========================================= */

export async function getMovies(
  page = 1,
  limit = 20,
  search = "",
  genre = ""
) {
  const response = await api.get(
    "/api/movies",
    {
      params: {
        page,
        limit,
        search,
        genre,
      },
    }
  );

  return response.data;
}

/* =========================================
   GET HOME
========================================= */

export async function getHome(
  params = {}
) {
  const response =
    await api.get(
      "/api/movies/home",
      {
        params,
      }
    );

  return response.data;
}

/* =========================================
   ADD VIEW
========================================= */

export async function addView(id) {
  const response =
    await api.post(
      `/api/movies/${id}/view`
    );

  return response.data;
}
/* =========================================
   GET ONE
========================================= */

export async function getMovie(id) {
  const response = await api.get(
    `/api/movies/${id}`
  );

  return response.data;
}

/* =========================================
   CREATE
========================================= */

export async function addMovie(movie) {
  const response = await api.post(
    "/api/movies",
    movie
  );

  return response.data;
}

/* =========================================
   UPDATE
========================================= */

export async function updateMovie(
  id,
  movie
) {
  const response = await api.put(
    `/api/movies/${id}`,
    movie
  );

  return response.data;
}

/* =========================================
   DELETE
========================================= */

export async function deleteMovie(id) {
  const response = await api.delete(
    `/api/movies/${id}`
  );

  return response.data;
}

/* =========================================
   FAVORITES
========================================= */

export async function getFavorites(
  page = 1,
  limit = 20
) {
  const response = await api.get(
    "/api/movies/favorites/list",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return response.data;
}

export async function toggleFavorite(id) {
  const response = await api.patch(
    `/api/movies/${id}/favorite`
  );

  return response.data;
}

/* =========================================
   TMDB REFRESH
========================================= */

export async function refreshMovieFromTMDB(
  id
) {
  const response = await api.post(
    `/api/movies/${id}/refresh-tmdb`
  );

  return response.data;
}