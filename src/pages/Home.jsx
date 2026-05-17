import { useEffect, useState } from "react";

import { getMovies } from "../services/movies";

import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] =
    useState([]);

  useEffect(() => {
    async function loadMovies() {
      const data = await getMovies();

      setMovies(data);
    }

    loadMovies();
  }, []);

  return (
    <div className="movies-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
        />
      ))}
    </div>
  );
}