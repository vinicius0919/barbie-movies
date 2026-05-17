import {
  Pencil,
  Trash2,
  Play,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function MovieList({
  movies,
  onEdit,
  onDelete,
}) {
  return (
    <div className="movies-grid">
      {movies.map((movie) => (
        <div
          className="movie-card"
          key={movie._id}
        >
          <img
            src={movie.poster}
            alt={movie.title}
          />

          <div className="movie-info">
            <h2>{movie.title}</h2>

            <p>{movie.year}</p>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
              }}
            >
              <Link
                to={`/movie/${movie._id}`}
              >
                <button>
                  <Play size={16} />
                </button>
              </Link>

              <button
                onClick={() =>
                  onEdit(movie)
                }
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() =>
                  onDelete(movie._id)
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}