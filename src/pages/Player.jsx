import "./Player.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Clock3,
  Heart,
  Play,
  Star,
  Volume2,
  Eye,
} from "lucide-react";

import {
  getMovie,
  getMoviePlayback,
  toggleFavorite,
  addView,
} from "../services/movies";

import useStreamRecovery from "../hooks/useStreamRecovery";

// =========================================
// HELPERS
// =========================================

const isYoutube = (playback) => playback?.provider === "youtube";

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatViews = (views = 0) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }

  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }

  return views;
};

function getPlaybackError(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Faça login para assistir a este filme.";
  }

  if (status === 403) {
    return "É necessária uma assinatura ativa para assistir.";
  }

  if (status === 404) {
    return "Filme ou reprodução não encontrado.";
  }

  if (status === 422) {
    return "Nenhuma fonte de reprodução disponível.";
  }

  if (status === 503) {
    return "Não foi possível verificar sua assinatura. Tente novamente.";
  }

  return "Não foi possível preparar a reprodução.";
}

// =========================================
// YOUTUBE PLAYER
// =========================================

function YoutubePlayer({ title, embedUrl, iframeRef }) {
  return (
    <div className="video-shell youtube-shell">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="modern-video youtube-iframe"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

// =========================================
// PLAYER
// =========================================

export default function Player() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [playback, setPlayback] = useState(null);

  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [playbackError, setPlaybackError] = useState("");

  const [youtubeRequested, setYoutubeRequested] = useState(false);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  const hasCountedView = useRef(false);
  const viewInFlightRef = useRef(false);
  const watchedSecondsRef = useRef(0);
  const lastWatchPositionRef = useRef(null);
  const lastSavedAtRef = useRef(0);

  const resumePositionRef = useRef(0);
  const initialSeekDoneRef = useRef(false);
  const completedRef = useRef(false);

  const storageKey = `movie-progress-${id}`;
  const viewStorageKey = `movie-view-${id}`;

  const youtube = isYoutube(playback);
  const canPlay = Boolean(
    playback &&
    ((youtube && playback.embedUrl) || (!youtube && playback.streamPath)),
  );

  // =========================================
  // STREAM URL
  // =========================================

  const sourceUrl = useMemo(() => {
    if (!movie?._id || !playback?.streamPath || youtube) {
      return "";
    }

    // VITE_API_URL pode ser:
    // /api
    // http://localhost:3001/api
    // https://backend.exemplo.com/api

    const configuredBase = import.meta.env.VITE_API_URL || "/api";

    const base = new URL(
      `${configuredBase.replace(/\/+$/, "")}/`,
      window.location.origin,
    );

    // A URL é construída com o ID do filme.
    // Não utilizamos URLs arbitrárias do cliente.
    return new URL(
      `stream/movies/${encodeURIComponent(movie._id)}`,
      base,
    ).toString();
  }, [movie?._id, playback?.streamPath, youtube]);

  // =========================================
  // SILENT STREAM RECOVERY
  // =========================================

  const {
    streamUrl,
    isRecovering,

    handleTimeUpdate: trackStreamProgress,
    handleWaiting,
    handleStalled,
    handlePlaying,
    handlePause: trackStreamPause,
    handleSeeking: trackStreamSeeking,
    handleSeeked: trackStreamSeeked,
    handleLoadedMetadata: restoreStreamMetadata,
    handleCanPlay,
    handleError,
    handleEnded: finishRecovery,
  } = useStreamRecovery({
    videoRef,
    sourceUrl,
  });

  // =========================================
  // LOAD MOVIE + AUTHORIZE PLAYBACK
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadMovie() {
      setIsLoading(true);
      setLoadError("");
      setPlaybackError("");
      setMovie(null);
      setPlayback(null);
      setYoutubeRequested(false);
      setDuration(0);
      setProgress(0);

      hasCountedView.current = false;
      viewInFlightRef.current = false;
      watchedSecondsRef.current = 0;
      lastWatchPositionRef.current = null;
      lastSavedAtRef.current = 0;
      initialSeekDoneRef.current = false;
      completedRef.current = false;

      try {
        const data = await getMovie(id);

        if (cancelled) return;

        if (!data) {
          setLoadError("Filme não encontrado.");
          return;
        }

        setMovie(data);
        setFavorite(Boolean(data.favorite));

        // A reprodução exige autorização.
        // Os metadados continuam visíveis
        // mesmo quando a assinatura é negada.
        try {
          const authorizedPlayback = await getMoviePlayback(id);

          if (cancelled) return;

          if (
            !authorizedPlayback ||
            !["youtube", "native"].includes(authorizedPlayback.provider)
          ) {
            setPlaybackError("Resposta de reprodução inválida.");
            return;
          }

          setPlayback(authorizedPlayback);
        } catch (error) {
          if (cancelled) return;

          console.error("[MiqFlix] Falha ao autorizar playback", error);

          setPlaybackError(getPlaybackError(error));
        }
      } catch (error) {
        if (cancelled) return;

        console.error("[MiqFlix] Erro ao carregar filme", error);

        setLoadError("Não foi possível carregar o filme.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // =========================================
  // RESTORE SAVED PROGRESS
  // =========================================

  useEffect(() => {
    resumePositionRef.current = 0;

    try {
      const saved = localStorage.getItem(storageKey);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      const savedTime = Number(parsed.currentTime);
      const savedPercentage = Number(parsed.percentage);

      if (Number.isFinite(savedTime) && savedTime >= 0) {
        resumePositionRef.current = savedTime;
      }

      if (Number.isFinite(savedPercentage)) {
        setProgress(Math.min(100, Math.max(0, savedPercentage)));
      }
    } catch (error) {
      console.warn("[MiqFlix] Progresso inválido", error);
    }
  }, [storageKey]);

  // =========================================
  // SAVE PROGRESS
  // =========================================

  const saveProgress = useCallback(
    (video, force = false) => {
      if (
        !video ||
        video.ended ||
        completedRef.current ||
        isRecovering() ||
        !Number.isFinite(video.currentTime)
      ) {
        return;
      }

      const now = Date.now();

      if (!force && now - lastSavedAtRef.current < 5000) {
        return;
      }

      const currentTime = video.currentTime;

      const videoDuration = Number.isFinite(video.duration)
        ? video.duration
        : 0;

      const percentage =
        videoDuration > 0
          ? Math.min(100, (currentTime / videoDuration) * 100)
          : 0;

      lastSavedAtRef.current = now;
      setProgress(percentage);

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentTime,
            duration: videoDuration,
            percentage,
            updatedAt: now,
          }),
        );
      } catch (error) {
        console.warn("[MiqFlix] Erro ao salvar progresso", error);
      }
    },
    [storageKey, isRecovering],
  );

  // =========================================
  // COUNT VIEW
  // =========================================

  const registerView = useCallback(async () => {
    if (
      !movie?._id ||
      hasCountedView.current ||
      viewInFlightRef.current ||
      watchedSecondsRef.current < 15
    ) {
      return;
    }

    try {
      const savedView = Number(localStorage.getItem(viewStorageKey) || 0);

      const twelveHours = 12 * 60 * 60 * 1000;

      if (savedView && Date.now() - savedView < twelveHours) {
        hasCountedView.current = true;
        return;
      }

      viewInFlightRef.current = true;

      await addView(movie._id);

      hasCountedView.current = true;

      localStorage.setItem(viewStorageKey, String(Date.now()));

      setMovie((previous) =>
        previous?._id === movie._id
          ? {
              ...previous,
              views: (previous.views || 0) + 1,
            }
          : previous,
      );
    } catch (error) {
      console.error("[MiqFlix] Erro ao registrar view", error);
    } finally {
      viewInFlightRef.current = false;
    }
  }, [movie?._id, viewStorageKey]);

  // =========================================
  // VIDEO METADATA
  // =========================================

  const handleLoadedMetadata = (event) => {
    const video = event.currentTarget;

    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }

    if (!initialSeekDoneRef.current) {
      initialSeekDoneRef.current = true;

      const savedTime = resumePositionRef.current;

      if (savedTime > 0) {
        const limit = Number.isFinite(video.duration)
          ? Math.max(0, video.duration - 1)
          : savedTime;

        try {
          video.currentTime = Math.min(savedTime, limit);
        } catch (error) {
          console.warn("[MiqFlix] Falha ao restaurar progresso", error);
        }
      }
    }

    restoreStreamMetadata(event);
  };

  // =========================================
  // TIME UPDATE
  // =========================================

  const handleVideoTimeUpdate = (event) => {
    const video = event.currentTarget;

    trackStreamProgress(event);

    if (!isRecovering()) {
      saveProgress(video);
    }

    const current = video.currentTime;
    const previous = lastWatchPositionRef.current;

    if (previous !== null && !video.paused && !video.seeking) {
      const delta = current - previous;

      if (delta > 0 && delta <= 2) {
        watchedSecondsRef.current += delta;
      }
    }

    lastWatchPositionRef.current = current;

    if (watchedSecondsRef.current >= 15) {
      void registerView();
    }
  };

  // =========================================
  // SEEKING
  // =========================================

  const handleVideoSeeking = (event) => {
    lastWatchPositionRef.current = null;
    trackStreamSeeking(event);
  };

  const handleVideoSeeked = (event) => {
    lastWatchPositionRef.current = event.currentTarget.currentTime;

    trackStreamSeeked(event);
  };

  // =========================================
  // PAUSE
  // =========================================

  const handleVideoPause = (event) => {
    trackStreamPause(event);

    if (isRecovering()) return;

    saveProgress(event.currentTarget, true);
  };

  // =========================================
  // ENDED
  // =========================================

  const handleVideoEnded = () => {
    completedRef.current = true;

    finishRecovery();

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("[MiqFlix] Erro ao limpar progresso", error);
    }

    resumePositionRef.current = 0;
    setProgress(100);
  };

  // =========================================
  // FAVORITE
  // =========================================

  async function handleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!movie || favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      const result = await toggleFavorite(movie._id);

      setFavorite(Boolean(result.favorite));
    } catch (error) {
      console.error("[MiqFlix] Erro ao atualizar favorito", error);
    } finally {
      setFavoriteLoading(false);
    }
  }

  // =========================================
  // YOUTUBE SCROLL
  // =========================================

  useEffect(() => {
    if (!youtubeRequested) return;

    iframeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [youtubeRequested]);

  // =========================================
  // WATCH NOW / FULLSCREEN
  // =========================================

  async function handleWatchNow() {
    if (!canPlay) return;

    if (youtube) {
      setYoutubeRequested(true);

      iframeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    const video = videoRef.current;

    if (!video || !sourceUrl) return;

    let playPromise;

    try {
      // Mantém a reprodução e o fullscreen
      // na mesma interação do usuário.
      playPromise = video.play();
    } catch (error) {
      console.error("[MiqFlix] Erro ao iniciar reprodução", error);
      return;
    }

    if (!document.fullscreenElement) {
      try {
        if (video.requestFullscreen) {
          const fullscreenPromise = video.requestFullscreen();

          fullscreenPromise?.catch((error) => {
            console.warn("[MiqFlix] Tela cheia indisponível", error);
          });
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      } catch (error) {
        console.warn("[MiqFlix] Não foi possível ativar tela cheia", error);
      }
    }

    try {
      await playPromise;
    } catch (error) {
      console.error("[MiqFlix] Erro ao iniciar vídeo", error);
    }
  }

  // =========================================
  // RENDER
  // =========================================

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loader" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="player-error">{loadError || "Filme não encontrado."}</div>
    );
  }

  return (
    <div className="player-page">
      <div className="player-backdrop">
        <img src={movie.cover || movie.backdrop} alt={movie.title} />
      </div>

      <div className="player-gradient" />

      <div className="player-topbar">
        <Link to="/" className="player-back-button">
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </div>

      <div className="player-content">
        <div className="player-video-section">
          {playbackError && (
            <div className="player-error" role="alert">
              {playbackError}
            </div>
          )}

          {canPlay && youtube ? (
            youtubeRequested ? (
              <YoutubePlayer
                title={movie.title}
                embedUrl={playback.embedUrl}
                iframeRef={iframeRef}
              />
            ) : (
              <div className="video-shell">
                <p>Clique em Assistir agora para iniciar o vídeo.</p>
              </div>
            )
          ) : canPlay && sourceUrl ? (
            <div className="video-shell">
              <video
                key={movie._id}
                ref={videoRef}
                src={streamUrl}
                controls
                preload="metadata"
                playsInline
                className="modern-video"
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={handleCanPlay}
                onTimeUpdate={handleVideoTimeUpdate}
                onSeeking={handleVideoSeeking}
                onSeeked={handleVideoSeeked}
                onPause={handleVideoPause}
                onWaiting={handleWaiting}
                onStalled={handleStalled}
                onPlaying={handlePlaying}
                onError={handleError}
                onEnded={handleVideoEnded}
              />
            </div>
          ) : !playbackError ? (
            <div className="video-shell">
              <p>Reprodução indisponível.</p>
            </div>
          ) : null}

          {canPlay && !youtube && (
            <div className="player-progress-wrapper">
              <div className="player-progress-labels">
                <span>Continuar assistindo</span>
                <span>{Math.floor(progress)}%</span>
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
          )}
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

                <span>{movie.year}</span>

                <span>
                  <Eye size={16} />
                  {formatViews(movie.views)} views
                </span>

                {canPlay && !youtube && (
                  <span>
                    <Clock3 size={16} />
                    {formatDuration(duration)}
                  </span>
                )}

                <button
                  type="button"
                  className="favorite-button"
                  onClick={handleFavorite}
                  disabled={favoriteLoading}
                  aria-label={
                    favorite
                      ? "Remover dos favoritos"
                      : "Adicionar aos favoritos"
                  }
                >
                  <Heart size={20} fill={favorite ? "red" : "none"} />
                </button>
              </div>
            </div>
          </div>

          <p className="player-description">{movie.overview}</p>

          <div className="player-actions">
            <button
              type="button"
              className="watch-button"
              onClick={handleWatchNow}
              disabled={!canPlay}
            >
              <Play size={18} />

              {youtube ? "Ir para o vídeo" : "Assistir agora"}
            </button>

            <button type="button" className="secondary-button">
              <Volume2 size={18} />
              Trailer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
