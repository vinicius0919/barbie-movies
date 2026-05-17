import { useState } from "react";

import { searchTmdb, addMovie } from "../services/movies";

export default function SearchMovie() {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  const [videoUrl, setVideoUrl] = useState("");

  async function handleSearch() {
    const data = await searchTmdb(query);

    setResults(data);
  }

  async function handleAdd(movie) {
    try {
      await addMovie({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: "https://image.tmdb.org/t/p/w500" + movie.poster_path,
        backdrop: "https://image.tmdb.org/t/p/original" + movie.backdrop_path,
        year: movie.release_date?.split("-")[0],
        videoUrl,
      });

      alert("Filme adicionado");
    } catch (error) {
      console.log(error.response.data);

      alert(error.response.data.error);
    }
  }

  return (
    <div>
      <input
        placeholder="Buscar filme"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button onClick={handleSearch}>Buscar</button>

      <input
        placeholder="Link do vídeo"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />

      <div>
        {results.map((movie) => (
          <div key={movie.id}>
            <img
              width={120}
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
            />

            <h3>{movie.title}</h3>

            <button onClick={() => handleAdd(movie)}>Adicionar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
