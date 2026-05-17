const TOKEN = import.meta.env.VITE_TMDB_TOKEN;

const BASE_URL = "https://api.themoviedb.org/3";

export async function searchMovie(title) {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?query=${encodeURIComponent(
        title
      )}&language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return data.results?.[0];
  } catch (error) {
    console.error("Erro TMDB:", error);
    return null;
  }
}

export function getPosterUrl(path) {
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function getBackdropUrl(path) {
  return `https://image.tmdb.org/t/p/original${path}`;
}