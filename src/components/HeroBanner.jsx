import "./HeroBanner.css";

import {
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Star,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

export default function HeroBanner({
  movies = [],
}) {
  const [current, setCurrent] =
    useState(0);

  /* =========================================
     SLIDES
  ========================================= */

  const slides = useMemo(() => {
    return movies
      .filter(
        (movie) =>
          movie?.backdrop
      )
      .slice(0, 6);
  }, [movies]);

  /* =========================================
     AUTOPLAY
  ========================================= */

  useEffect(() => {
    if (!slides.length) return;

    const interval =
      setInterval(() => {
        setCurrent((prev) =>
          prev === slides.length - 1
            ? 0
            : prev + 1
        );
      }, 7000);

    return () =>
      clearInterval(interval);
  }, [slides]);

  /* =========================================
     NAVIGATION
  ========================================= */

  function nextSlide() {
    setCurrent((prev) =>
      prev === slides.length - 1
        ? 0
        : prev + 1
    );
  }

  function prevSlide() {
    setCurrent((prev) =>
      prev === 0
        ? slides.length - 1
        : prev - 1
    );
  }

  if (!slides.length) {
    return null;
  }

  return (
    <section className="hero">
      {slides.map(
        (movie, index) => (
          <article
            key={movie._id}
            className={`hero-slide ${
              index === current
                ? "active"
                : ""
            }`}
          >
            {/* BACKDROP */}

            <img
              src={movie.backdrop}
              alt={movie.title}
              className="hero-backdrop"
            />

            <div className="hero-overlay" />

            {/* CONTENT */}

            <div className="hero-content">
              <div className="hero-top">
                <span className="hero-badge">
                  <Star size={14} />
                  Destaque
                </span>

                <div className="hero-meta">
                  <span>
                    {movie.year}
                  </span>

                  {movie
                    .genres?.slice(
                      0,
                      3
                    )
                    .map((genre) => (
                      <span
                        key={genre}
                      >
                        {genre}
                      </span>
                    ))}
                </div>
              </div>

              <h1>
                {movie.title}
              </h1>

              <p>
                {movie.overview}
              </p>

              <div className="hero-actions">
                <Link
                  to={`/movie/${movie._id}`}
                  className="hero-button primary"
                >
                  <Play size={18} />
                  Assistir
                </Link>

                <Link
                  to={`/movie/${movie._id}`}
                  className="hero-button secondary"
                >
                  <Info size={18} />
                  Detalhes
                </Link>
              </div>
            </div>
          </article>
        )
      )}

      {/* CONTROLS */}

      <button
        className="hero-nav left"
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>

      <button
        className="hero-nav right"
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>

      {/* INDICATORS */}

      <div className="hero-indicators">
        {slides.map(
          (_, index) => (
            <button
              key={index}
              className={`hero-dot ${
                index === current
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setCurrent(index)
              }
            />
          )
        )}
      </div>
    </section>
  );
}