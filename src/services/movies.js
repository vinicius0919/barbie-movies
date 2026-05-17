import api from "./api";

export async function getMovies() {
  const response = await api.get(
    "/api/movies"
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