import { api } from "./api";

export async function getMovies() {
  const response = await api.get(
    "/api/movies"
  );

  return response.data;
}

export async function searchTmdb(query) {
  const response = await api.get(
    `/api/tmdb/search?query=${query}`
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

export async function removeMovie(id) {
  const response = await api.delete(
    `/api/movies/${id}`
  );

  return response.data;
}