import { useState } from "react";

import { searchTmdb } from "../services/tmdb";

import { addMovie } from "../services/movies";

export default function SearchMovie({
  onMovieAdded,
}) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [videoUrl, setVideoUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSearch() {
    if (!query) return;

    try {
      setLoading(true);

      const data =
        await searchTmdb(query);

      setResults(data);
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao buscar filmes"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(movie) {
    try {
      if (!videoUrl) {
        return alert(
          "Informe a URL do vídeo"
        );
      }

      await addMovie({
        tmdbId: movie.id,

        title: movie.title,

        overview:
          movie.overview,

        poster:
          "https://image.tmdb.org/t/p/w500" +
          movie.poster_path,

        backdrop:
          "https://image.tmdb.org/t/p/original" +
          movie.backdrop_path,

        year:
          movie.release_date?.split(
            "-"
          )[0],

        videoUrl,
      });

      alert("Filme adicionado");

      setVideoUrl("");

      setQuery("");

      setResults([]);

      if (onMovieAdded) {
        onMovieAdded();
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data
          ?.error ||
          "Erro ao adicionar filme"
      );
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <input
          placeholder="Buscar filme"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

        <button
          onClick={handleSearch}
        >
          {loading
            ? "Buscando..."
            : "Buscar"}
        </button>

        <input
          placeholder="Link do vídeo"
          value={videoUrl}
          onChange={(e) =>
            setVideoUrl(
              e.target.value
            )
          }
        />
      </div>

      <div className="search-results">
        {results.map((movie) => (
          <div
            className="search-card"
            key={movie.id}
          >
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
            />

            <h3>{movie.title}</h3>

            <button
              onClick={() =>
                handleAdd(movie)
              }
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}