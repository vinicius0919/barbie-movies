
import "./Favorites.css";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Heart,
  Film,
  Tv,
  AlertCircle,
  Loader2,
} from "lucide-react";

import MovieCard from "../components/MovieCard";

import { getFavorites } from "../services/movies";
import { getFavoriteSeries } from "../services/series";

export default function Favorites() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("movies");

  // =========================================
  // LOAD FAVORITES
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getFavorites({ page: 1, limit: 100 }),
          getFavoriteSeries({ page: 1, limit: 100 }),
        ]);

        if (cancelled) return;

        const [moviesResult, seriesResult] = results;

        if (moviesResult.status === "fulfilled") {
          const data = moviesResult.value;

          const movieList = Array.isArray(data)
            ? data
            : Array.isArray(data?.movies)
              ? data.movies
              : Array.isArray(data?.data?.movies)
                ? data.data.movies
                : [];

          setMovies(movieList);
        } else {
          console.error(
            "Erro ao carregar filmes favoritos:",
            moviesResult.reason
          );

          setMovies([]);
        }

        if (seriesResult.status === "fulfilled") {
          const data = seriesResult.value;

          const seriesList = Array.isArray(data)
            ? data
            : Array.isArray(data?.series)
              ? data.series
              : Array.isArray(data?.data?.series)
                ? data.data.series
                : [];

          setSeries(seriesList);
        } else {
          console.error(
            "Erro ao carregar séries favoritas:",
            seriesResult.reason
          );

          setSeries([]);
        }

        if (
          moviesResult.status === "rejected" ||
          seriesResult.status === "rejected"
        ) {
          setError(
            "Não foi possível carregar todos os seus favoritos."
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Erro ao carregar favoritos:", err);

        setError(
          "Não foi possível carregar sua lista."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // RENDER
  // =========================================

  if (loading) {
    return (
      <div className="container favorites-page">
        <div className="favorites-loading">
          <Loader2 size={30} className="spin" />
          <p>Carregando sua lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container favorites-page">

      {/* HEADER */}

      <div className="favorites-header">
        <h1>
          <Heart size={28} />
          Minha Lista
        </h1>

        <p>
          Seus filmes e séries favoritos em um só lugar.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="favorites-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TABS */}

      <div className="favorites-tabs">
        <button
          type="button"
          className={`favorites-tab ${
            activeTab === "movies" ? "active" : ""
          }`}
          onClick={() => setActiveTab("movies")}
        >
          <Film size={18} />
          Filmes ({movies.length})
        </button>

        <button
          type="button"
          className={`favorites-tab ${
            activeTab === "series" ? "active" : ""
          }`}
          onClick={() => setActiveTab("series")}
        >
          <Tv size={18} />
          Séries ({series.length})
        </button>
      </div>

      {/* MOVIES */}

      {activeTab === "movies" && (
        <section className="favorites-section">
          {movies.length === 0 ? (
            <div className="favorites-empty">
              <Film size={36} />

              <h2>Nenhum filme favorito</h2>

              <p>
                Os filmes adicionados à sua lista
                aparecerão aqui.
              </p>

              <Link to="/">
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="movies-grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* SERIES */}

      {activeTab === "series" && (
        <section className="favorites-section">
          {series.length === 0 ? (
            <div className="favorites-empty">
              <Tv size={36} />

              <h2>Nenhuma série favorita</h2>

              <p>
                As séries adicionadas à sua lista
                aparecerão aqui.
              </p>

              <Link to="/">
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="movies-grid">
              {series.map((item) => (
                <Link
                  key={item._id}
                  to={`/series/${item._id}`}
                  className="favorite-series-card"
                >
                  <div className="favorite-series-poster">
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                    />
                  </div>

                  <div className="favorite-series-info">
                    <h3>{item.title}</h3>

                    <span>
                      {item.year || "Série"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
