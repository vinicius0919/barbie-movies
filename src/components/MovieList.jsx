import "./MovieList.css";

import {
  Pencil,
  Trash2,
  Play,
  Calendar,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function MovieList({
  movies,
  onEdit,
  onDelete,
}) {
  if (!movies.length) {
    return (
      <div className="movie-list-empty">
        <h2>
          Nenhum filme encontrado
        </h2>

        <p>
          Adicione filmes para
          começar a montar seu
          catálogo.
        </p>
      </div>
    );
  }

  return (
    <section className="movie-list">
      <div className="movie-list-grid">
        {movies.map((movie) => (
          <article
            className="movie-list-card"
            key={movie._id}
          >
            <div className="movie-list-poster">
              <img
                src={movie.poster}
                alt={movie.title}
                loading="lazy"
              />
            </div>

            <div className="movie-list-content">
              <div className="movie-list-header">
                <h2>
                  {movie.title}
                </h2>

                <div className="movie-list-year">
                  <Calendar
                    size={14}
                  />

                  <span>
                    {movie.year}
                  </span>
                </div>
              </div>

              <div className="movie-list-actions">
                <Link
                  to={`/movie/${movie._id}`}
                  className="movie-list-button play"
                >
                  <Play size={16} />

                  <span>
                    Assistir
                  </span>
                </Link>

                <button
                  className="movie-list-button edit"
                  onClick={() =>
                    onEdit(movie)
                  }
                >
                  <Pencil
                    size={16}
                  />

                  <span>
                    Editar
                  </span>
                </button>

                <button
                  className="movie-list-button delete"
                  onClick={() =>
                    onDelete(
                      movie._id
                    )
                  }
                >
                  <Trash2
                    size={16}
                  />

                  <span>
                    Excluir
                  </span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}