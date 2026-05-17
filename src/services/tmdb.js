const TOKEN =
  import.meta.env.VITE_TMDB_TOKEN;

const BASE_URL =
  "https://api.themoviedb.org/3";

/* =====================================
   SEARCH MOVIES
===================================== */

export async function searchTmdb(
  query
) {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,

          "Content-Type":
            "application/json",
        },
      }
    );

    const data =
      await response.json();

    return data.results || [];
  } catch (error) {
    console.error(
      "Erro TMDB:",
      error
    );

    return [];
  }
}

/* =====================================
   GET MOVIE DETAILS
===================================== */

export async function getMovieDetails(
  id
) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}?language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,

          "Content-Type":
            "application/json",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);

    return null;
  }
}

/* =====================================
   IMAGE HELPERS
===================================== */

export function getPosterUrl(
  path
) {
  if (!path) {
    return "/placeholder.jpg";
  }

  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function getBackdropUrl(
  path
) {
  if (!path) {
    return "/placeholder-backdrop.jpg";
  }

  return `https://image.tmdb.org/t/p/original${path}`;
}