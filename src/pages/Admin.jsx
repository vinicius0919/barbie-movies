import {
  useEffect,
  useState,
} from "react";

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

  async function loadMovies(
    currentPage = 1,
    reset = false
  ) {
    if (loading) return;

    try {
      setLoading(true);

      const response =
        await getMovies(
          currentPage,
          20
        );

      if (reset) {
        setMovies(
          response.data
        );
      } else {
        setMovies((prev) => [
          ...prev,
          ...response.data,
        ]);
      }

      setHasMore(
        response.pagination
          .hasNextPage
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies(1, true);
  }, []);

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

  function handleLoadMore() {
    const nextPage =
      page + 1;

    setPage(nextPage);

    loadMovies(nextPage);
  }

  return (
    <div className="container">
      <h1>Painel Admin</h1>

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
        <div
          style={{
            marginTop: 40,
            marginBottom: 40,
          }}
        >
          <h2>
            Editando filme
          </h2>

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
          <MovieList
            movies={movies}
            onEdit={
              setEditingMovie
            }
            onDelete={
              handleDelete
            }
          />

          {hasMore && (
            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                marginTop: 24,
              }}
            >
              <button
                onClick={
                  handleLoadMore
                }
                disabled={loading}
              >
                {loading
                  ? "Carregando..."
                  : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}