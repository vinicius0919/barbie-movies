import { movies } from "../data/movies";
import MovieCard from "../components/MovieCard";

export default function Home() {
  return (
    <div className="container">
      <h1>Biblioteca Barbie</h1>

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}