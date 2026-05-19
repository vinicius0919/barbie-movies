import api from "./api";

export async function getMovies(
  page = 1,
  limit = 20,
  search = ""
) {
  const response = await api.get(
    "/api/movies",
    {
      params: {
        page,
        limit,
        search,
      },
    }
  );

  return response.data;
}

export async function getMovie(id) {
  const response = await api.get(
    `/api/movies/${id}`
  );

  return response.data;
}

export async function addMovie(movie) {
  const response = await api.post(
    "/api/movies",
    movie
  );

  return response.data;
}

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

export async function deleteMovie(id) {
  const response = await api.delete(
    `/api/movies/${id}`
  );

  return response.data;
}

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

export async function toggleFavorite(
  id
) {
  const response =
    await api.patch(
      `/api/movies/${id}/favorite`
    );

  return response.data;
}