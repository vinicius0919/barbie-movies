import "./MovieRow.css";

import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { useRef } from "react";

import MovieCard from "./MovieCard";

export default function MovieRow({
  title,
  movies,
}) {
  const rowRef = useRef(null);

  function scroll(direction) {
    const container =
      rowRef.current;

    if (!container) return;

    const amount = 720;

    container.scrollBy({
      left:
        direction === "left"
          ? -amount
          : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="movie-row">
      <div className="movie-row-header">
        <h2>{title}</h2>
      </div>

      <div className="movie-row-wrapper">
        <button
          className="movie-row-arrow left"
          onClick={() =>
            scroll("left")
          }
        >
          <ArrowLeft size={28} />
        </button>

        <div
          ref={rowRef}
          className="movie-row-scroll"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
            />
          ))}
        </div>

        <button
          className="movie-row-arrow right"
          onClick={() =>
            scroll("right")
          }
        >
          <ArrowRight size={28} />
        </button>
      </div>
    </section>
  );
}