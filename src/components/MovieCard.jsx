import { Link } from "react-router-dom";

export default function MovieCard({
  movie,
}) {
  return (
    <Link
      className="movie-card"
      to={`/movie/${movie.id}`}
    >
      <img
        src={movie.poster}
        alt={movie.title}
      />

      <div className="movie-info">
        <h2>{movie.title}</h2>

        <p>{movie.year}</p>
      </div>
    </Link>
  );
}