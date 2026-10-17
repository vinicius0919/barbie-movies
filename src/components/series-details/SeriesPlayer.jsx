
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const SAVE_INTERVAL_SECONDS = 15;

const STALL_TIMEOUT_MS = 20000;
const CHECK_INTERVAL_MS = 2000;
const MAX_RETRIES = 3;
const STABLE_PLAYBACK_MS = 60000;

function createRecoveryState() {
  return {
    attempts: 0,
    recovering: false,
    wantsPlayback: false,
    ended: false,
    waitingSince: null,
    lastProgressAt: Date.now(),
    lastPosition: 0,
    pendingSeek: null,
    recoveryStartedAt: 0,
    stableSince: null,
  };
}

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
  const initialResumeTimeRef = useRef(0);

  const recoveryRef = useRef(createRecoveryState());

  const [retryToken, setRetryToken] = useState(0);

  const episodeKey = episode?._id || null;

  const activeSource =
    playbackRequested && streamUrl
      ? `${streamUrl}${
          streamUrl.includes("?") ? "&" : "?"
        }_retry=${retryToken}`
      : "";

  // =========================================
  // RESET ON EPISODE CHANGE
  // =========================================

  useEffect(() => {
    recoveryRef.current = createRecoveryState();

    lastSavedSecondRef.current = 0;
    resumeAppliedRef.current = false;

    initialResumeTimeRef.current =
      Number.isFinite(resumeTime)
        ? Math.max(0, resumeTime)
        : 0;

    setRetryToken(0);
  }, [episodeKey, streamUrl]);

  // =========================================
  // PLAYBACK DATA
  // =========================================

  const getPlaybackData = useCallback(
    (video, completed = false) => {
      const currentTime =
        Number.isFinite(video.currentTime)
          ? Math.max(0, video.currentTime)
          : 0;

      const duration =
        Number.isFinite(video.duration)
          ? Math.max(0, video.duration)
          : 0;

      return {
        currentTime,
        duration,
        completed,
      };
    },
    []
  );

  // =========================================
  // SAVE PROGRESS
  // =========================================

  const persist = useCallback(
    (video, completed = false) => {
      if (
        !video ||
        !episode ||
        !onProgress
      ) {
        return;
      }

      // Evita salvar posições incorretas
      // durante a recuperação.
      if (
        recoveryRef.current.recovering &&
        !completed
      ) {
        return;
      }

      const data = getPlaybackData(
        video,
        completed
      );

      lastSavedSecondRef.current =
        Math.floor(data.currentTime);

      onProgress(data);
    },
    [episode, onProgress, getPlaybackData]
  );

  // =========================================
  // SILENT RECOVERY
  // =========================================

  const recover = useCallback(() => {
    const video = videoRef.current;
    const state = recoveryRef.current;

    if (
      !video ||
      !playbackRequested ||
      !streamUrl ||
      state.ended ||
      video.ended ||
      state.attempts >= MAX_RETRIES
    ) {
      return;
    }

    const now = Date.now();

    if (
      state.recovering &&
      now - state.recoveryStartedAt <
        STALL_TIMEOUT_MS
    ) {
      return;
    }

    state.attempts += 1;
    state.recovering = true;

    state.wantsPlayback =
      state.wantsPlayback || !video.paused;

    const position =
      Number.isFinite(video.currentTime)
        ? video.currentTime
        : state.lastPosition;

    state.pendingSeek = Math.max(
      0,
      position - 0.5
    );

    state.recoveryStartedAt = now;
    state.lastProgressAt = now;
    state.waitingSince = null;
    state.stableSince = null;

    console.warn(
      "[SeriesPlayer] Reconexão interna",
      {
        episode: episodeKey,
        attempt: state.attempts,
        position: state.pendingSeek,
      }
    );

    setRetryToken((value) => value + 1);
  }, [
    playbackRequested,
    streamUrl,
    episodeKey,
  ]);

  // =========================================
  // RECOVERY WATCHDOG
  // =========================================

  useEffect(() => {
    if (
      !playbackRequested ||
      !streamUrl
    ) {
      return;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      const state = recoveryRef.current;

      if (
        !video ||
        state.ended ||
        video.ended ||
        video.seeking
      ) {
        return;
      }

      const now = Date.now();

      if (state.recovering) {
        if (
          now - state.recoveryStartedAt >=
          STALL_TIMEOUT_MS
        ) {
          recover();
        }

        return;
      }

      if (video.paused) {
        return;
      }

      const referenceTime =
        state.waitingSince ??
        state.lastProgressAt;

      if (
        now - referenceTime >=
        STALL_TIMEOUT_MS
      ) {
        recover();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [
    playbackRequested,
    streamUrl,
    recover,
  ]);

  // =========================================
  // LOADED METADATA
  // =========================================

  const handleLoadedMetadata = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    let target = null;

    // A recuperação tem prioridade sobre
    // o progresso salvo originalmente.
    if (state.pendingSeek !== null) {
      target = state.pendingSeek;
      state.pendingSeek = null;
    } else if (!resumeAppliedRef.current) {
      target = initialResumeTimeRef.current;
      resumeAppliedRef.current = true;
    }

    if (
      target === null ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return;
    }

    const duration = video.duration;

    if (Number.isFinite(duration)) {
      target = Math.min(
        target,
        Math.max(0, duration - 2)
      );
    }

    try {
      video.currentTime = target;
      state.lastPosition = target;
      state.lastProgressAt = Date.now();
    } catch (error) {
      console.warn(
        "[SeriesPlayer] Retomada indisponível",
        error
      );
    }
  };

  // =========================================
  // TIME UPDATE
  // =========================================

  const handleTimeUpdate = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    const position = video.currentTime;

    if (!Number.isFinite(position)) {
      return;
    }

    const advanced =
      position > state.lastPosition + 0.1;

    if (advanced) {
      state.lastPosition = position;
      state.lastProgressAt = Date.now();
      state.waitingSince = null;

      if (state.recovering) {
        state.recovering = false;
        state.recoveryStartedAt = 0;
        state.stableSince = Date.now();
      }

      if (
        !video.paused &&
        state.stableSince === null
      ) {
        state.stableSince = Date.now();
      }

      if (
        state.stableSince !== null &&
        !video.paused &&
        Date.now() - state.stableSince >=
          STABLE_PLAYBACK_MS
      ) {
        state.attempts = 0;
        state.stableSince = Date.now();
      }
    }

    if (
      video.paused ||
      video.seeking ||
      state.recovering
    ) {
      return;
    }

    const currentSecond =
      Math.floor(position);

    if (
      currentSecond -
        lastSavedSecondRef.current >=
      SAVE_INTERVAL_SECONDS
    ) {
      persist(video);
    }
  };

  // =========================================
  // BUFFER EVENTS
  // =========================================

  const handleWaiting = () => {
    const state = recoveryRef.current;

    if (state.waitingSince === null) {
      state.waitingSince = Date.now();
    }
  };

  const handleStalled = handleWaiting;

  const handlePlaying = () => {
    const state = recoveryRef.current;

    state.wantsPlayback = true;
    state.waitingSince = null;
    state.lastProgressAt = Date.now();

    if (state.stableSince === null) {
      state.stableSince = Date.now();
    }
  };

  // =========================================
  // SEEK EVENTS
  // =========================================

  const handleSeeking = () => {
    const state = recoveryRef.current;

    state.waitingSince = null;
    state.lastProgressAt = Date.now();
  };

  const handleSeeked = (event) => {
    const state = recoveryRef.current;

    state.lastPosition =
      event.currentTarget.currentTime;

    state.lastProgressAt = Date.now();
    state.waitingSince = null;
  };

  // =========================================
  // PLAY / PAUSE
  // =========================================

  const handlePlay = (event) => {
    const video = event.currentTarget;

    onStarted?.();

    // Durante a recuperação, não registra
    // novamente o início do episódio.
    if (recoveryRef.current.recovering) {
      return;
    }

    recoveryRef.current.wantsPlayback = true;

    persist(video);
  };

  const handlePause = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    if (state.recovering) {
      return;
    }

    state.wantsPlayback = false;
    state.waitingSince = null;

    if (!video.ended) {
      persist(video);
    }
  };

  // =========================================
  // CAN PLAY
  // =========================================

  const handleCanPlay = async (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    if (
      !state.recovering ||
      !state.wantsPlayback
    ) {
      return;
    }

    try {
      await video.play();
    } catch (error) {
      console.warn(
        "[SeriesPlayer] Reprodução automática indisponível",
        error
      );
    }
  };

  // =========================================
  // MEDIA ERROR
  // =========================================

  const handleError = (event) => {
    const video = event.currentTarget;

    console.error(
      "[SeriesPlayer] Erro de mídia",
      {
        episode: episodeKey,
        code: video.error?.code,
        message: video.error?.message,
        currentTime: video.currentTime,
      }
    );

    if (
      recoveryRef.current.attempts <
      MAX_RETRIES
    ) {
      recover();
      return;
    }

    // Apenas comunica o erro ao componente
    // pai após esgotar as tentativas.
    onError?.(event);
  };

  // =========================================
  // ENDED
  // =========================================

  const handleEnded = (event) => {
    const state = recoveryRef.current;

    state.ended = true;
    state.recovering = false;
    state.wantsPlayback = false;
    state.pendingSeek = null;

    persist(event.currentTarget, true);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <section className="series-player-section">
      {playbackError && (
        <p className="series-player-error">
          {playbackError}
        </p>
      )}

      {playbackRequested && streamUrl ? (
        <video
          key={`${episodeKey}-${activeSource}`}
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          src={activeSource}
          onLoadedMetadata={
            handleLoadedMetadata
          }
          onCanPlay={handleCanPlay}
          onPlay={handlePlay}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onWaiting={handleWaiting}
          onStalled={handleStalled}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
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
