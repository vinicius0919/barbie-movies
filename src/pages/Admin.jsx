import { useEffect, useState } from "react";

import SearchMovie from "../components/SearchMovie";
import MovieForm from "../components/MovieForm";
import MovieList from "../components/MovieList";

import {
  getMovies,
  updateMovie,
  deleteMovie,
} from "../services/movies";

export default function Admin() {
  const [movies, setMovies] = useState(
    []
  );

  const [editingMovie, setEditingMovie] =
    useState(null);

  async function loadMovies() {
    try {
      const data = await getMovies();

      setMovies(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  async function handleDelete(id) {
    const confirmDelete = confirm(
      "Deseja remover este filme?"
    );

    if (!confirmDelete) return;

    try {
      await deleteMovie(id);

      loadMovies();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleUpdate(data) {
    try {
      await updateMovie(
        editingMovie._id,
        data
      );

      setEditingMovie(null);

      loadMovies();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.error
      );
    }
  }

  return (
    <div className="container">
      <h1>Painel Admin</h1>

      <SearchMovie
        onMovieAdded={loadMovies}
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

      <MovieList
        movies={movies}
        onEdit={setEditingMovie}
        onDelete={handleDelete}
      />
    </div>
  );
}