
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// =========================================
// CONFIGURAÇÕES
// =========================================

const SAVE_INTERVAL_SECONDS = 15;

const STALL_TIMEOUT_MS = 20000;
const CHECK_INTERVAL_MS = 2000;

const MAX_RETRIES = 3;
const STABLE_PLAYBACK_MS = 60000;

// =========================================
// RECOVERY STATE
// =========================================

function createRecoveryState() {
  return {
    attempts: 0,
    recovering: false,
    resumePending: false,
    wantsPlayback: false,
    ended: false,

    waitingSince: null,
    lastProgressAt: Date.now(),
    lastPosition: 0,

    pendingSeek: null,
    recoveryStartedAt: 0,
    stableSince: null,

    fatalReported: false,
  };
}

// =========================================
// HELPERS
// =========================================

function appendRetryToken(url, token) {
  if (!url || token === 0) {
    return url || "";
  }

  const separator = url.includes("?")
    ? "&"
    : "?";

  return `${url}${separator}_retry=${token}`;
}

function normalizeResumeTime(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
}

// =========================================
// SERIES PLAYER
// =========================================

export default function SeriesPlayer({
  episode,

  // URL protegida para reprodução nativa.
  streamUrl = "",

  // URL autorizada para iframe.
  embedUrl = "",

  playbackRequested = false,
  playbackError = "",

  resumeTime = 0,

  onProgress,
  onStarted,
  onError,
}) {
  // =========================================
  // REFS
  // =========================================

  const videoRef = useRef(null);

  const lastSavedSecondRef = useRef(0);

  const resumeAppliedRef = useRef(false);
  const initialResumeTimeRef = useRef(
    normalizeResumeTime(resumeTime)
  );

  const recoveryRef = useRef(
    createRecoveryState()
  );

  // =========================================
  // STATE
  // =========================================

  const [retryToken, setRetryToken] =
    useState(0);

  // =========================================
  // IDENTIFICAÇÃO DO EPISÓDIO
  // =========================================

  const episodeKey =
    episode?._id ||
    `${episode?.seasonNumber ?? ""}-${
      episode?.episodeNumber ?? ""
    }`;

  // =========================================
  // FONTES AUTORIZADAS
  // =========================================

  const canRenderPlayback =
    playbackRequested &&
    !playbackError;

  const authorizedEmbedUrl =
    canRenderPlayback &&
    typeof embedUrl === "string"
      ? embedUrl
      : "";

  const authorizedStreamUrl =
    canRenderPlayback &&
    typeof streamUrl === "string"
      ? streamUrl
      : "";

  const activeSource =
    authorizedEmbedUrl
      ? ""
      : appendRetryToken(
          authorizedStreamUrl,
          retryToken
        );

  // =========================================
  // RESET ON EPISODE / SOURCE CHANGE
  // =========================================

  useEffect(() => {
    recoveryRef.current =
      createRecoveryState();

    lastSavedSecondRef.current = 0;

    resumeAppliedRef.current = false;

    initialResumeTimeRef.current =
      normalizeResumeTime(resumeTime);

    setRetryToken(0);
  }, [
    episodeKey,
    streamUrl,
    embedUrl,
  ]);

  // Se o progresso chegar depois dos
  // metadados do episódio, atualizamos
  // a posição inicial enquanto ela ainda
  // não tiver sido aplicada.
  useEffect(() => {
    if (!resumeAppliedRef.current) {
      initialResumeTimeRef.current =
        normalizeResumeTime(resumeTime);
    }
  }, [resumeTime]);

  // =========================================
  // PLAYBACK DATA
  // =========================================

  const getPlaybackData = useCallback(
    (video, completed = false) => {
      const currentTime =
        Number.isFinite(video.currentTime)
          ? Math.max(
              0,
              video.currentTime
            )
          : 0;

      const duration =
        Number.isFinite(video.duration)
          ? Math.max(
              0,
              video.duration
            )
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
        typeof onProgress !== "function"
      ) {
        return;
      }

      const state = recoveryRef.current;

      // Não salvar posições intermediárias
      // durante uma reconexão.
      if (
        state.recovering &&
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

      try {
        const result = onProgress(data);

        // Permite callbacks assíncronos sem
        // deixar rejeições sem tratamento.
        if (
          result &&
          typeof result.catch === "function"
        ) {
          result.catch((error) => {
            console.error(
              "[SeriesPlayer] Falha ao salvar progresso",
              error
            );
          });
        }
      } catch (error) {
        console.error(
          "[SeriesPlayer] Falha ao salvar progresso",
          error
        );
      }
    },
    [
      episode,
      onProgress,
      getPlaybackData,
    ]
  );

  // =========================================
  // REPORT FINAL ERROR
  // =========================================

  const reportFatalError = useCallback(
    (event) => {
      const state = recoveryRef.current;

      if (state.fatalReported) {
        return;
      }

      state.fatalReported = true;
      state.recovering = false;
      state.resumePending = false;

      console.error(
        "[SeriesPlayer] Tentativas de recuperação esgotadas",
        {
          episode: episodeKey,
          attempts: state.attempts,
        }
      );

      onError?.(event);
    },
    [episodeKey, onError]
  );

  // =========================================
  // SILENT RECOVERY
  // =========================================

  const recover = useCallback(() => {
    const video = videoRef.current;
    const state = recoveryRef.current;

    if (
      !video ||
      !canRenderPlayback ||
      !authorizedStreamUrl ||
      state.ended ||
      state.fatalReported ||
      video.ended
    ) {
      return;
    }

    if (
      state.attempts >= MAX_RETRIES
    ) {
      reportFatalError({
        type: "error",
        currentTarget: video,
        target: video,
      });

      return;
    }

    const now = Date.now();

    // Impede tentativas simultâneas.
    if (
      state.recovering &&
      now - state.recoveryStartedAt <
        STALL_TIMEOUT_MS
    ) {
      return;
    }

    state.attempts += 1;

    state.recovering = true;
    state.resumePending = false;

    // Preserva a intenção de reprodução.
    // A pausa causada pela troca do src
    // não deve cancelar a recuperação.
    state.wantsPlayback =
      state.wantsPlayback ||
      !video.paused;

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
      "[SeriesPlayer] Reconexão silenciosa",
      {
        episode: episodeKey,
        attempt: state.attempts,
        maxRetries: MAX_RETRIES,
        position: state.pendingSeek,
      }
    );

    // Atualiza apenas o src.
    // O elemento <video> permanece montado.
    setRetryToken(
      (previous) => previous + 1
    );
  }, [
    canRenderPlayback,
    authorizedStreamUrl,
    episodeKey,
    reportFatalError,
  ]);

  // =========================================
  // RECOVERY WATCHDOG
  // =========================================

  useEffect(() => {
    if (
      !canRenderPlayback ||
      !authorizedStreamUrl ||
      authorizedEmbedUrl
    ) {
      return;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      const state = recoveryRef.current;

      if (
        !video ||
        state.ended ||
        state.fatalReported ||
        video.ended ||
        video.seeking
      ) {
        return;
      }

      const now = Date.now();

      // Recuperação em andamento.
      if (state.recovering) {
        const elapsed =
          now - state.recoveryStartedAt;

        if (
          elapsed >= STALL_TIMEOUT_MS
        ) {
          recover();
        }

        return;
      }

      // Não recuperar enquanto o usuário
      // estiver com o vídeo pausado.
      if (
        video.paused ||
        !state.wantsPlayback
      ) {
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
    canRenderPlayback,
    authorizedStreamUrl,
    authorizedEmbedUrl,
    recover,
  ]);

  // =========================================
  // RESUME RECOVERED PLAYBACK
  // =========================================

  const resumeRecoveredPlayback =
    async (video) => {
      const state = recoveryRef.current;

      if (
        !video ||
        video !== videoRef.current ||
        !state.recovering ||
        !state.wantsPlayback ||
        state.resumePending ||
        state.ended ||
        state.fatalReported ||
        video.seeking ||
        state.pendingSeek !== null ||
        !video.paused
      ) {
        return;
      }

      state.resumePending = true;

      try {
        await video.play();

        console.info(
          "[SeriesPlayer] Reprodução retomada"
        );
      } catch (error) {
        console.warn(
          "[SeriesPlayer] Retomada automática indisponível",
          error
        );
      } finally {
        state.resumePending = false;
      }
    };

  // =========================================
  // LOADED METADATA
  // =========================================

  const handleLoadedMetadata = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    let target = null;

    // Durante o recovery, a posição
    // anterior tem prioridade.
    if (state.pendingSeek !== null) {
      target = state.pendingSeek;
      state.pendingSeek = null;
    } else if (!resumeAppliedRef.current) {
      target =
        initialResumeTimeRef.current;

      resumeAppliedRef.current = true;
    }

    if (
      target === null ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      if (state.recovering) {
        void resumeRecoveredPlayback(
          video
        );
      }

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
      state.lastProgressAt =
        Date.now();
    } catch (error) {
      console.warn(
        "[SeriesPlayer] Falha ao restaurar posição",
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
      position >
      state.lastPosition + 0.1;

    if (advanced) {
      state.lastPosition = position;
      state.lastProgressAt =
        Date.now();

      state.waitingSince = null;

      // Reprodução voltou a avançar.
      if (state.recovering) {
        state.recovering = false;
        state.resumePending = false;

        state.recoveryStartedAt = 0;
        state.stableSince = Date.now();

        console.info(
          "[SeriesPlayer] Recovery concluído"
        );
      }

      if (
        !video.paused &&
        state.stableSince === null
      ) {
        state.stableSince =
          Date.now();
      }

      // Após reprodução estável,
      // libera novamente as tentativas.
      if (
        state.stableSince !== null &&
        !video.paused &&
        Date.now() -
          state.stableSince >=
          STABLE_PLAYBACK_MS
      ) {
        state.attempts = 0;
        state.stableSince =
          Date.now();
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
      Math.abs(
        currentSecond -
          lastSavedSecondRef.current
      ) >= SAVE_INTERVAL_SECONDS
    ) {
      persist(video);
    }
  };

  // =========================================
  // WAITING / STALLED
  // =========================================

  const handleWaiting = () => {
    const state = recoveryRef.current;

    if (state.waitingSince === null) {
      state.waitingSince =
        Date.now();
    }
  };

  const handleStalled = handleWaiting;

  // =========================================
  // PLAYING
  // =========================================

  const handlePlaying = () => {
    const state = recoveryRef.current;

    state.wantsPlayback = true;

    state.waitingSince = null;
    state.lastProgressAt =
      Date.now();

    if (state.stableSince === null) {
      state.stableSince =
        Date.now();
    }
  };

  // =========================================
  // SEEKING
  // =========================================

  const handleSeeking = () => {
    const state = recoveryRef.current;

    state.waitingSince = null;
    state.lastProgressAt =
      Date.now();
  };

  // =========================================
  // SEEKED
  // =========================================

  const handleSeeked = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    state.lastPosition =
      video.currentTime;

    state.lastProgressAt =
      Date.now();

    state.waitingSince = null;

    if (state.recovering) {
      void resumeRecoveredPlayback(
        video
      );

      return;
    }

    // Salva também quando o usuário
    // avança ou retrocede manualmente.
    if (!video.ended) {
      persist(video);
    }
  };

  // =========================================
  // PLAY
  // =========================================

  const handlePlay = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    // O play gerado pela reconexão não
    // deve disparar novamente onStarted.
    if (state.recovering) {
      return;
    }

    state.wantsPlayback = true;
    state.fatalReported = false;

    state.lastProgressAt =
      Date.now();

    onStarted?.();

    persist(video);
  };

  // =========================================
  // PAUSE
  // =========================================

  const handlePause = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    // A troca do src pode disparar pause.
    // Não cancelar a intenção de reprodução
    // durante uma recuperação interna.
    if (state.recovering) {
      return;
    }

    state.wantsPlayback = false;

    state.waitingSince = null;
    state.stableSince = null;

    if (!video.ended) {
      persist(video);
    }
  };

  // =========================================
  // CAN PLAY
  // =========================================

  const handleCanPlay = (event) => {
    void resumeRecoveredPlayback(
      event.currentTarget
    );
  };

  // =========================================
  // MEDIA ERROR
  // =========================================

  const handleError = (event) => {
    const video = event.currentTarget;
    const state = recoveryRef.current;

    console.error(
      "[SeriesPlayer] Erro de mídia",
      {
        episode: episodeKey,
        code: video.error?.code,
        message: video.error?.message,
        currentTime: video.currentTime,
        attempts: state.attempts,
      }
    );

    if (
      state.attempts < MAX_RETRIES
    ) {
      recover();
      return;
    }

    reportFatalError(event);
  };

  // =========================================
  // ENDED
  // =========================================

  const handleEnded = (event) => {
    const state = recoveryRef.current;

    state.ended = true;
    state.recovering = false;
    state.resumePending = false;

    state.wantsPlayback = false;
    state.pendingSeek = null;

    state.waitingSince = null;

    persist(
      event.currentTarget,
      true
    );
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <section className="series-player-section">
      {playbackError && (
        <p
          className="series-player-error"
          role="alert"
        >
          {playbackError}
        </p>
      )}

      {/* =====================================
          EMBED PLAYER
      ===================================== */}

      {authorizedEmbedUrl ? (
        <div className="series-video-wrapper">
          <iframe
            key={`${episodeKey}-${authorizedEmbedUrl}`}
            className="series-video"
            src={authorizedEmbedUrl}
            title={
              episode?.title ||
              "Reprodução do episódio"
            }
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              border: 0,
              display: "block",
            }}
          />
        </div>
      ) : activeSource ? (
        /* ===================================
           NATIVE VIDEO PLAYER
        =================================== */

        <video
          key={episodeKey}
          ref={videoRef}
          className="series-video"
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
        /* ===================================
           PLACEHOLDER
        =================================== */

        <div className="series-player-placeholder">
          <p>
            {playbackError
              ? "Não foi possível iniciar a reprodução."
              : playbackRequested
                ? "Preparando reprodução..."
                : "Selecione um episódio para começar a assistir."}
          </p>
        </div>
      )}
    </section>
  );
}
