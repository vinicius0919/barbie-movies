import { useEffect, useState } from "react";

import MovieCard from "../components/MovieCard";

import { getMovies } from "../services/movies";

export default function Home() {
  const [movies, setMovies] = useState(
    []
  );

  useEffect(() => {
    async function loadMovies() {
      try {
        const data = await getMovies();

        setMovies(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadMovies();
  }, []);

  return (
    <div className="container">
      <h1>Filmes</h1>

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={movie}
          />
        ))}
      </div>
    </div>
  );
}