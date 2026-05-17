import { useParams, Link } from "react-router-dom";
import { movies } from "../data/movies";

export default function Player() {
  const { id } = useParams();

  const movie = movies.find((m) => m.id === Number(id));

  if (!movie) {
    return <h1>Filme não encontrado</h1>;
  }

  return (
    <div className="player-page">
      <Link to="/" className="back-button">
        ← Voltar
      </Link>

      <div className="video-container">
        <video controls autoPlay width="100%">
          <source src={movie.videoUrl} type="video/mp4" />
        </video>
      </div>

      <div className="movie-details">
        <h1>{movie.title}</h1>

        <p>{movie.description}</p>

        <p>Ano: {movie.year}</p>
      </div>
    </div>
  );
}