import "./MovieCard.css";

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
      <div className="movie-card-poster">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
        />

        <div className="movie-card-overlay">
          <button className="movie-play-button">
            <Play size={22} />
          </button>
        </div>
      </div>

      <div className="movie-card-content">
        <h2 className="movie-title">
          {movie.title}
        </h2>

        <div className="movie-card-footer">
          <span className="movie-year">
            {movie.year}
          </span>

          <button
            className={`favorite-button ${
              favorite
                ? "active"
                : ""
            }`}
            onClick={
              handleFavorite
            }
            disabled={loading}
            aria-label="Favoritar filme"
          >
            <Heart
              size={18}
              fill={
                favorite
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </Link>
  );
}