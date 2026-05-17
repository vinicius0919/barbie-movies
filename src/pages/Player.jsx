import { useEffect, useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { getMovie } from "../services/movies";

export default function Player() {
  const { id } = useParams();

  const [movie, setMovie] = useState(
    null
  );

  useEffect(() => {
    async function loadMovie() {
      try {
        const data = await getMovie(id);

        setMovie(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadMovie();
  }, [id]);

  if (!movie) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="player-page">
      <div className="video-container">
        <Link
          to="/"
          className="back-button"
        >
          ← Voltar
        </Link>

        <video controls>
          <source
            src={`${import.meta.env.VITE_API_URL}/api/stream?url=${encodeURIComponent(movie.videoUrl)}`}
            type="video/mp4"
          />
        </video>
      </div>

      <div className="movie-details">
        <h1>{movie.title}</h1>

        <div className="movie-meta">
          <span>{movie.year}</span>
        </div>

        <p
          style={{ marginTop: 20 }}
        >
          {movie.overview}
        </p>
      </div>
    </div>
  );
}