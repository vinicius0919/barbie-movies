import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import { getMovies } from "../services/movies";

export default function Player() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);

  useEffect(() => {
    async function loadMovie() {
      const movies = await getMovies();

      const selected = movies.find((m) => m.id === Number(id));

      setMovie(selected);
    }

    loadMovie();
  }, [id]);

  if (!movie) {
    return <h1>Carregando...</h1>;
  }

  return (
    <div>
      <h1>{movie.title}</h1>

      <video controls autoPlay width="100%">
        <source
          src={`${
            import.meta.env.VITE_API_URL
          }/api/stream?url=${encodeURIComponent(movie.videoUrl)}`}
          type="video/mp4"
        />
      </video>
    </div>
  );
}
