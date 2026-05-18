import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Clock3,
  Heart,
  Play,
  Star,
  Volume2,
} from "lucide-react";
import { toggleFavorite } from "../services/movies";
import { getMovie } from "../services/movies";

export default function Player() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);

  const [favorite, setFavorite] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleFavorite(
    e
  ) {
    e.preventDefault();

    e.stopPropagation();

    try {
      setLoading(true);

      const updatedMovie =
        await toggleFavorite(
          movie._id
        );

      setFavorite(
        updatedMovie.favorite
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const [isLoading, setIsLoading] =
    useState(true);

  const [progress, setProgress] =
    useState(0);

  const videoRef = useRef(null);

  const storageKey = `movie-progress-${id}`;

  useEffect(() => {
    async function loadMovie() {
      try {
        setIsLoading(true);

        const data = await getMovie(id);

        setMovie(data);
        setFavorite(movie.favorite)
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !movie) return;

    const saved = localStorage.getItem(
      storageKey
    );

    if (saved) {
      const parsed = JSON.parse(saved);

      video.currentTime =
        parsed.currentTime || 0;
    }
  }, [movie]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !movie) return;

    const saveProgress = () => {
      const current = video.currentTime;

      const duration = video.duration || 0;

      const percentage =
        duration > 0
          ? (current / duration) * 100
          : 0;

      setProgress(percentage);

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentTime: current,
          duration,
          percentage,
          updatedAt: Date.now(),
        })
      );
    };

    const interval = setInterval(
      saveProgress,
      5000
    );

    video.addEventListener(
      "timeupdate",
      saveProgress
    );

    return () => {
      clearInterval(interval);

      video.removeEventListener(
        "timeupdate",
        saveProgress
      );
    };
  }, [movie]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleEnded = () => {
      localStorage.removeItem(storageKey);

      setProgress(100);
    };

    video.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      video.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [movie]);

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loader" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="player-error">
        Filme não encontrado.
      </div>
    );
  }

  async function handleWatchNow() {
    const video = videoRef.current;

    if (!video) return;

    try {
      /* PLAY */

      await video.play();

      /* FULLSCREEN */

      if (
        document.fullscreenElement == null
      ) {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (
          video.webkitEnterFullscreen
        ) {
          /* iPhone Safari */
          video.webkitEnterFullscreen();
        }
      }

      /* SCROLL SUAVE ATÉ O PLAYER */

      video.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } catch (error) {
      console.error(
        "Erro ao iniciar vídeo:",
        error
      );
    }
  }

  return (
    <div className="player-page">
      <div className="player-backdrop">
        <img
          src={movie.cover}
          alt={movie.title}
        />
      </div>

      <div className="player-gradient" />

      <div className="player-topbar">
        <Link
          to="/"
          className="player-back-button"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </div>

      <div className="player-content">
        <div className="player-video-section">
          <div className="video-shell">
            <video
              ref={videoRef}
              controls
              preload="metadata"
              playsInline
              className="modern-video"
            >
              <source
                src={`${import.meta.env.VITE_API_URL}/api/stream?url=${encodeURIComponent(movie.videoUrl)}`}
                type="video/mp4"
              />
            </video>
          </div>

          <div className="player-progress-wrapper">
            <div className="player-progress-labels">
              <span>
                Continuar assistindo
              </span>

              <span>
                {Math.floor(progress)}%
              </span>
            </div>

            <div className="player-progress-bar">
              <div
                className="player-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="player-info-card">
          <div className="player-title-row">
            <div>
              <h1>{movie.title}</h1>

              <div className="player-meta">
                <span>
                  <Star size={16} />
                  9.2
                </span>

                <span>
                  {movie.year}
                </span>

                <span>
                  <Clock3 size={16} />
                  2h 14m
                </span>

                <button
                  className="favorite-button"
                  onClick={
                    handleFavorite
                  }
                  disabled={loading}
                >
                  <Heart
                    size={20}
                    fill={
                      favorite
                        ? "red"
                        : "none"
                    }
                  />
                </button>
              </div>
            </div>

          </div>

          <p className="player-description">
            {movie.overview}
          </p>

          <div className="player-actions">
            <button
              className="watch-button"
              onClick={handleWatchNow}
            >
              <Play size={18} />
              Assistir agora
            </button>

            <button className="secondary-button">
              <Volume2 size={18} />
              Trailer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}