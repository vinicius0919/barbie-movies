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

import {
  getMovie,
  toggleFavorite,
} from "../services/movies";

export default function Player() {
  const { id } = useParams();

  const [movie, setMovie] =
    useState(null);

  const [favorite, setFavorite] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [progress, setProgress] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const videoRef = useRef(null);

  const storageKey = `movie-progress-${id}`;

  /* =========================
     LOAD MOVIE
  ========================= */

  useEffect(() => {
    async function loadMovie() {
      try {
        setIsLoading(true);

        const data =
          await getMovie(id);

        if (!data) return;

        setMovie(data);

        setFavorite(
          Boolean(data.favorite)
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  /* =========================
     VIDEO METADATA
  ========================= */

  function handleLoadedMetadata() {
    const video = videoRef.current;

    if (!video) return;

    const videoDuration =
      video.duration;

    if (
      isFinite(videoDuration) &&
      !isNaN(videoDuration)
    ) {
      setDuration(videoDuration);
    }
  }

  /* =========================
     RESTORE PROGRESS
  ========================= */

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !movie) return;

    const saved =
      localStorage.getItem(
        storageKey
      );

    if (saved) {
      try {
        const parsed =
          JSON.parse(saved);

        video.currentTime =
          parsed.currentTime || 0;

        setProgress(
          parsed.percentage || 0
        );
      } catch (error) {
        console.error(error);
      }
    }
  }, [movie]);

  /* =========================
     SAVE PROGRESS
  ========================= */

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !movie) return;

    const saveProgress = () => {
      const current =
        video.currentTime;

      const duration =
        video.duration || 0;

      const percentage =
        duration > 0
          ? (current / duration) *
          100
          : 0;

      setProgress(percentage);

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentTime: current,
          duration,
          percentage,
          updatedAt:
            Date.now(),
        })
      );
    };

    const interval =
      setInterval(
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

  /* =========================
     VIDEO ENDED
  ========================= */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleEnded = () => {
      localStorage.removeItem(
        storageKey
      );

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

  /* =========================
     FAVORITE
  ========================= */

  async function handleFavorite(
    e
  ) {
    e.preventDefault();

    e.stopPropagation();

    if (!movie) return;

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

  /* =========================
     WATCH NOW
  ========================= */

  async function handleWatchNow() {
    const video = videoRef.current;

    if (!video) return;

    try {
      await video.play();

      if (
        document.fullscreenElement ==
        null
      ) {
        if (
          video.requestFullscreen
        ) {
          await video.requestFullscreen();
        } else if (
          video.webkitEnterFullscreen
        ) {
          video.webkitEnterFullscreen();
        }
      }

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

  /* =========================
     FORMAT DURATION
  ========================= */

  function formatDuration(
    seconds
  ) {
    if (
      !seconds ||
      !isFinite(seconds)
    ) {
      return "--";
    }

    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /* =========================
     LOADING
  ========================= */

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loader" />
      </div>
    );
  }

  /* =========================
     NOT FOUND
  ========================= */

  if (!movie) {
    return (
      <div className="player-error">
        Filme não encontrado.
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="player-page">
      <div className="player-backdrop">
        <img
          src={
            movie.cover ||
            movie.backdrop
          }
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
              onLoadedMetadata={
                handleLoadedMetadata
              }
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
                Continuar
                assistindo
              </span>

              <span>
                {Math.floor(
                  progress
                )}
                %
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
              <h1>
                {movie.title}
              </h1>

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
                  {formatDuration(
                    duration
                  )}
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
              onClick={
                handleWatchNow
              }
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