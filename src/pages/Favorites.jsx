import { useEffect, useState } from "react";

import MovieCard from "../components/MovieCard";

import { getFavorites } from "../services/movies";

export default function Favorites() {
  const [movies, setMovies] = useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const response =
          await getFavorites();

        setMovies(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h1>Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Favoritos</h1>

      {movies.length === 0 ? (
        <p>
          Nenhum filme favoritado.
        </p>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
            />
          ))}
        </div>
      )}
    </div>
  );
}