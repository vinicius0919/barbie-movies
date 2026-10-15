
import { useEffect, useRef } from "react";

const SAVE_INTERVAL_SECONDS = 15;

export default function SeriesPlayer({
  episode,
  streamUrl,
  playbackRequested,
  playbackError,
  resumeTime = 0,
  onProgress,
  onStarted,
  onError,
}) {
  const videoRef = useRef(null);
  const lastSavedSecondRef = useRef(0);
  const resumeAppliedRef = useRef(false);

  const episodeKey = episode?._id || null;

  useEffect(() => {
    resumeAppliedRef.current = false;
    lastSavedSecondRef.current = 0;
  }, [episodeKey, streamUrl]);

  const getPlaybackData = (video, completed = false) => {
    const currentTime = Number.isFinite(video.currentTime)
      ? Math.max(0, video.currentTime)
      : 0;

    const duration = Number.isFinite(video.duration)
      ? Math.max(0, video.duration)
      : 0;

    return {
      currentTime,
      duration,
      completed,
    };
  };

  const persist = (video, completed = false) => {
    if (!video || !episode || !onProgress) return;

    const data = getPlaybackData(video, completed);

    lastSavedSecondRef.current = Math.floor(
      data.currentTime
    );

    onProgress(data);
  };

  const handleLoadedMetadata = (event) => {
    const video = event.currentTarget;

    if (resumeAppliedRef.current) return;

    resumeAppliedRef.current = true;

    const duration = video.duration;

    if (
      !Number.isFinite(resumeTime) ||
      resumeTime <= 0
    ) {
      return;
    }

    const target = Number.isFinite(duration)
      ? Math.min(resumeTime, Math.max(0, duration - 2))
      : resumeTime;

    try {
      video.currentTime = target;
    } catch (error) {
      console.warn(
        "[SeriesPlayer] Retomada indisponível:",
        error
      );
    }
  };

  const handleTimeUpdate = (event) => {
    const video = event.currentTarget;

    if (video.paused || video.seeking) return;

    const currentSecond = Math.floor(video.currentTime);

    if (
      currentSecond - lastSavedSecondRef.current >=
      SAVE_INTERVAL_SECONDS
    ) {
      persist(video);
    }
  };

  const handlePlay = (event) => {
    const video = event.currentTarget;

    onStarted?.();

    // Registra o episódio mesmo que o usuário
    // assista por menos de 15 segundos.
    persist(video);
  };

  const handlePause = (event) => {
    const video = event.currentTarget;

    if (!video.ended) {
      persist(video);
    }
  };

  const handleEnded = (event) => {
    persist(event.currentTarget, true);
  };

  return (
    <section className="series-player-section">
      {playbackError && (
        <p className="series-player-error">
          {playbackError}
        </p>
      )}

      {playbackRequested && streamUrl ? (
        <video
          key={`${episodeKey}-${streamUrl}`}
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          src={streamUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={onError}
        />
      ) : (
        <div className="series-player-placeholder">
          <p>
            Selecione um episódio para começar a assistir.
          </p>
        </div>
      )}
    </section>
  );
}
