import {
  Heart,
  Play,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useState } from "react";

import { toggleFavorite } from "../services/movies";

export default function MovieCard({
  movie,
}) {
  const [favorite, setFavorite] =
    useState(movie.favorite);

  const [loading, setLoading] =
    useState(false);

  async function handleFavorite(
    e
  ) {
    e.preventDefault();

    e.stopPropagation();

    try {
      setLoading(true);

      const updatedMovie =
        await toggleFavorite(
          movie._id
        );

      setFavorite(
        updatedMovie.favorite
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Link
      to={`/movie/${movie._id}`}
      className="movie-card"
    >
      <img
        src={movie.poster}
        alt={movie.title}
      />

      <div className="movie-info">
        <h2>{movie.title}</h2>

        <div className="movie-card-footer">
          <span>{movie.year}</span>

          <button
            className="favorite-button"
            onClick={
              handleFavorite
            }
            disabled={loading}
          >
            <Heart
              size={20}
              fill={
                favorite
                  ? "red"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </Link>
  );
}