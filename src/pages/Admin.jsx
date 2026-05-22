import "./Admin.css";

import {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Film,
  Loader2,
} from "lucide-react";

import SearchMovie from "../components/SearchMovie";
import MovieForm from "../components/MovieForm";
import MovieList from "../components/MovieList";

import {
  getMovies,
  updateMovie,
  deleteMovie,
} from "../services/movies";

export default function Admin() {
  const [movies, setMovies] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [editingMovie, setEditingMovie] =
    useState(null);

  const [searching, setSearching] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  /* =========================================
     LOAD MOVIES
  ========================================= */

  const loadMovies =
    useCallback(
      async (
        currentPage = 1,
        reset = false
      ) => {
        if (loading) return;

        try {
          setLoading(true);

          const response =
            await getMovies(
              currentPage,
              20
            );

          setMovies((prev) =>
            reset
              ? response.data
              : [
                  ...prev,
                  ...response.data,
                ]
          );

          setHasMore(
            response.pagination
              .hasNextPage
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
          setInitialLoading(false);
        }
      },
      [loading]
    );

  useEffect(() => {
    loadMovies(1, true);
  }, []);

  /* =========================================
     DELETE
  ========================================= */

  async function handleDelete(id) {
    const confirmDelete = confirm(
      "Deseja remover este filme?"
    );

    if (!confirmDelete) return;

    try {
      await deleteMovie(id);

      setMovies((prev) =>
        prev.filter(
          (movie) =>
            movie._id !== id
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================
     UPDATE
  ========================================= */

  async function handleUpdate(data) {
    try {
      const updated =
        await updateMovie(
          editingMovie._id,
          data
        );

      setMovies((prev) =>
        prev.map((movie) =>
          movie._id === updated._id
            ? updated
            : movie
        )
      );

      setEditingMovie(null);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.error
      );
    }
  }

  /* =========================================
     LOAD MORE
  ========================================= */

  function handleLoadMore() {
    const nextPage =
      page + 1;

    setPage(nextPage);

    loadMovies(nextPage);
  }

  /* =========================================
     LOADING
  ========================================= */

  if (initialLoading) {
    return (
      <div className="admin-loading">
        <Loader2
          size={42}
          className="spin"
        />

        <p>
          Carregando painel...
        </p>
      </div>
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <span className="admin-badge">
            Dashboard
          </span>

          <h1>
            Painel Admin
          </h1>

          <p>
            Gerencie filmes,
            favoritos e catálogo
            da plataforma.
          </p>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <Film size={20} />

            <div>
              <strong>
                {movies.length}
              </strong>

              <span>
                Filmes
              </span>
            </div>
          </div>
        </div>
      </div>

      <SearchMovie
        movies={movies}
        onMovieAdded={() =>
          loadMovies(1, true)
        }
        onEdit={
          setEditingMovie
        }
        onDelete={
          handleDelete
        }
        onSearching={
          setSearching
        }
      />

      {editingMovie && (
        <div className="admin-form-wrapper">
          <MovieForm
            movie={editingMovie}
            onSave={handleUpdate}
            onCancel={() =>
              setEditingMovie(null)
            }
          />
        </div>
      )}

      {!searching && (
        <>
          {movies.length === 0 ? (
            <div className="admin-empty">
              <Film size={44} />

              <h2>
                Nenhum filme
                encontrado
              </h2>

              <p>
                Adicione novos filmes
                ao catálogo.
              </p>
            </div>
          ) : (
            <div className="admin-list-wrapper">
              <MovieList
                movies={movies}
                onEdit={
                  setEditingMovie
                }
                onDelete={
                  handleDelete
                }
              />
            </div>
          )}

          {hasMore && (
            <div className="admin-load-more">
              <button
                onClick={
                  handleLoadMore
                }
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spin"
                    />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}