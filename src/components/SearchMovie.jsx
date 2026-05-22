import "./SearchMovie.css";

import {
  Heart,
  Play,
  Pencil,
  Trash2,
  Check,
  Search,
  Loader2,
  Film,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { searchTmdb } from "../services/tmdb";

import {
  addMovie,
  toggleFavorite,
} from "../services/movies";

export default function SearchMovie({
  onMovieAdded,
  onEdit,
  onDelete,
  onSearching,
}) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [selectedMovie, setSelectedMovie] =
    useState(null);

  const [videoUrl, setVideoUrl] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState(null);

  const hasSearch =
    query.trim().length > 0;

  useEffect(() => {
    onSearching?.(hasSearch);
  }, [hasSearch]);

  async function handleSearch(
    currentPage = 1
  ) {
    if (!query.trim()) {
      setResults([]);
      setPagination(null);

      return;
    }

    try {
      setLoading(true);

      const data =
        await searchTmdb(
          query,
          currentPage
        );

      setResults(
        Array.isArray(
          data.results
        )
          ? data.results
          : []
      );

      setPagination(
        data.pagination || null
      );

      setPage(currentPage);
    } catch (error) {
      console.error(error);

      setResults([]);

      setPagination(null);

      alert(
        error.response?.data
          ?.error ||
          "Erro ao buscar filmes"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    try {
      if (!videoUrl.trim()) {
        return alert(
          "Informe a URL do vídeo"
        );
      }

      if (!selectedMovie) return;

      setAdding(true);

      await addMovie({
        tmdbId: selectedMovie.id,

        title:
          selectedMovie.title,

        overview:
          selectedMovie.overview,

        poster:
          selectedMovie.poster_path
            ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
            : "",

        backdrop:
          selectedMovie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path}`
            : "",

        year:
          selectedMovie.release_date?.split(
            "-"
          )[0] || "",

        videoUrl,
      });

      closeModal();

      onMovieAdded?.();

      await handleSearch(page);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data
          ?.error ||
          "Erro ao adicionar filme"
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleFavorite(
    e,
    localMovie
  ) {
    e.preventDefault();

    e.stopPropagation();

    try {
      const updatedMovie =
        await toggleFavorite(
          localMovie._id
        );

      setResults((prev) =>
        prev.map((movie) => {
          if (
            movie.localMovie
              ?._id ===
            localMovie._id
          ) {
            return {
              ...movie,

              localMovie: {
                ...movie.localMovie,

                favorite:
                  updatedMovie.favorite,
              },
            };
          }

          return movie;
        })
      );
    } catch (error) {
      console.error(error);
    }
  }

  function closeModal() {
    setSelectedMovie(null);

    setVideoUrl("");
  }

  function renderMovieCard(movie) {
    const localMovie =
      movie.localMovie;

    if (
      movie.alreadyAdded &&
      localMovie
    ) {
      return (
        <Link
          key={movie.id}
          to={`/movie/${localMovie._id}`}
          className="search-card"
        >
          <div className="search-card-poster">
            <img
              src={
                localMovie.poster
              }
              alt={
                localMovie.title
              }
            />
          </div>

          <div className="search-card-content">
            <h2>
              {localMovie.title}
            </h2>

            <div className="search-card-footer">
              <span>
                {localMovie.year}
              </span>

              <div className="search-card-actions">
                <button
                  className="icon-button"
                  onClick={(e) =>
                    handleFavorite(
                      e,
                      localMovie
                    )
                  }
                >
                  <Heart
                    size={18}
                    fill={
                      localMovie.favorite
                        ? "red"
                        : "none"
                    }
                  />
                </button>

                <button
                  className="icon-button"
                  onClick={(e) => {
                    e.preventDefault();

                    onEdit(
                      localMovie
                    );
                  }}
                >
                  <Pencil
                    size={18}
                  />
                </button>

                <button
                  className="icon-button danger"
                  onClick={(e) => {
                    e.preventDefault();

                    onDelete(
                      localMovie._id
                    );
                  }}
                >
                  <Trash2
                    size={18}
                  />
                </button>
              </div>
            </div>

            <div className="existing-badge">
              <Check size={15} />
              Já cadastrado
            </div>
          </div>
        </Link>
      );
    }

    return (
      <article
        className="search-card"
        key={movie.id}
      >
        <div className="search-card-poster">
          <img
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "/placeholder.jpg"
            }
            alt={movie.title}
          />
        </div>

        <div className="search-card-content">
          <h2>{movie.title}</h2>

          <div className="search-card-footer">
            <span>
              {movie.release_date?.split(
                "-"
              )[0] || "—"}
            </span>

            <button
              className="icon-button play"
              onClick={() =>
                setSelectedMovie(
                  movie
                )
              }
            >
              <Play size={18} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <section className="search-movie">
      <div className="search-toolbar">
        <div className="search-input-group">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar filmes..."
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleSearch(1);
              }
            }}
          />
        </div>

        <button
          className="search-submit-button"
          onClick={() =>
            handleSearch(1)
          }
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                className="spin"
              />
              Buscando...
            </>
          ) : (
            <>
              <Search size={18} />
              Buscar
            </>
          )}
        </button>
      </div>

      {hasSearch && (
        <>
          {!loading &&
            results.length ===
              0 && (
              <div className="search-empty">
                <Film size={48} />

                <p>
                  Nenhum filme
                  encontrado
                </p>
              </div>
            )}

          {results.length > 0 && (
            <div className="search-grid">
              {results.map(
                renderMovieCard
              )}
            </div>
          )}

          {pagination && (
            <div className="search-pagination">
              <button
                disabled={
                  page === 1 ||
                  loading
                }
                onClick={() =>
                  handleSearch(
                    page - 1
                  )
                }
              >
                Anterior
              </button>

              <span>
                Página {page} de{" "}
                {
                  pagination.totalPages
                }
              </span>

              <button
                disabled={
                  page ===
                    pagination.totalPages ||
                  loading
                }
                onClick={() =>
                  handleSearch(
                    page + 1
                  )
                }
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {selectedMovie && (
        <div className="modal-overlay">
          <div className="search-modal">
            <button
              className="modal-close"
              onClick={
                closeModal
              }
            >
              <X size={18} />
            </button>

            <h2>
              Adicionar filme
            </h2>

            <p>
              {
                selectedMovie.title
              }
            </p>

            <input
              type="text"
              placeholder="Link do vídeo"
              value={videoUrl}
              onChange={(e) =>
                setVideoUrl(
                  e.target.value
                )
              }
            />

            <div className="modal-actions">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={adding}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleAdd
                }
                disabled={adding}
              >
                {adding ? (
                  <>
                    <Loader2
                      size={16}
                      className="spin"
                    />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}