
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STALL_TIMEOUT_MS = 20000;
const CHECK_INTERVAL_MS = 2000;
const MAX_RETRIES = 3;
const STABLE_PLAYBACK_MS = 60000;
const RETRY_DELAYS_MS = [800, 1500, 3000];

function createRecoveryState() {
  return {
    attempts: 0,
    recovering: false,
    scheduled: false,
    wantsPlayback: false,
    ended: false,
    waitingSince: null,
    lastProgressAt: Date.now(),
    lastPosition: 0,
    pendingSeek: null,
    recoveryStartedAt: 0,
    stableSince: null,
    sourceGeneration: 0,
  };
}

export default function useStreamRecovery({
  videoRef,
  sourceUrl,
}) {
  const [retryToken, setRetryToken] = useState(0);

  const stateRef = useRef(createRecoveryState());
  const sourceRef = useRef(sourceUrl);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    sourceRef.current = sourceUrl;
    stateRef.current = createRecoveryState();
    setRetryToken(0);

    return () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [sourceUrl]);

  const isRecovering = useCallback(
    () => stateRef.current.recovering,
    []
  );

  const recover = useCallback(
    (reason = "stall") => {
      const video = videoRef.current;
      const state = stateRef.current;

      if (
        !video ||
        !sourceUrl ||
        sourceRef.current !== sourceUrl ||
        state.ended ||
        video.ended ||
        state.scheduled ||
        state.attempts >= MAX_RETRIES
      ) {
        return;
      }

      const now = Date.now();

      // Impede que múltiplos eventos de erro
      // iniciem reconexões simultâneas.
      if (
        state.recovering &&
        now - state.recoveryStartedAt <
          STALL_TIMEOUT_MS
      ) {
        return;
      }

      state.wantsPlayback =
        state.wantsPlayback || !video.paused;

      const position =
        Number.isFinite(video.currentTime) &&
        video.currentTime > 0
          ? video.currentTime
          : state.lastPosition;

      state.pendingSeek = Math.max(
        0,
        position - 0.5
      );

      state.recovering = true;
      state.scheduled = true;
      state.waitingSince = null;
      state.stableSince = null;

      const delay =
        RETRY_DELAYS_MS[
          Math.min(
            state.attempts,
            RETRY_DELAYS_MS.length - 1
          )
        ];

      console.warn("[MiqFlix] Reconexão agendada", {
        attempt: state.attempts + 1,
        reason,
        position: state.pendingSeek,
        delayMs: delay,
      });

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;

        if (
          stateRef.current !== state ||
          sourceRef.current !== sourceUrl ||
          state.ended
        ) {
          return;
        }

        state.scheduled = false;
        state.attempts += 1;
        state.recoveryStartedAt = Date.now();
        state.lastProgressAt = Date.now();
        state.sourceGeneration += 1;

        console.warn("[MiqFlix] Reconexão interna", {
          attempt: state.attempts,
          position: state.pendingSeek,
        });

        setRetryToken(state.sourceGeneration);
      }, delay);
    },
    [videoRef, sourceUrl]
  );

  const handleTimeUpdate = useCallback(
    (event) => {
      const video = event.currentTarget;

      if (video !== videoRef.current) return;

      const state = stateRef.current;
      const position = video.currentTime;

      if (!Number.isFinite(position)) return;

      const advanced =
        position > state.lastPosition + 0.1;

      if (!advanced) return;

      const now = Date.now();

      state.lastPosition = position;
      state.lastProgressAt = now;
      state.waitingSince = null;

      // Se a reprodução voltou antes da
      // tentativa agendada, cancela a troca.
      if (state.scheduled) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
        state.scheduled = false;
      }

      if (state.recovering) {
        state.recovering = false;
        state.recoveryStartedAt = 0;
        state.stableSince = now;

        console.info(
          "[MiqFlix] Reprodução recuperada",
          {
            position,
            attempts: state.attempts,
          }
        );
      }

      if (!video.paused) {
        if (state.stableSince === null) {
          state.stableSince = now;
        }

        if (
          state.attempts > 0 &&
          now - state.stableSince >=
            STABLE_PLAYBACK_MS
        ) {
          state.attempts = 0;
          state.stableSince = now;

          console.info(
            "[MiqFlix] Reprodução estável; tentativas reiniciadas"
          );
        }
      }
    },
    [videoRef]
  );

  const handleWaiting = useCallback(() => {
    const state = stateRef.current;

    if (state.waitingSince === null) {
      state.waitingSince = Date.now();
    }

    state.stableSince = null;
  }, []);

  const handleStalled = handleWaiting;

  const handlePlaying = useCallback(() => {
    const state = stateRef.current;

    state.wantsPlayback = true;
    state.waitingSince = null;
    state.lastProgressAt = Date.now();

    if (state.stableSince === null) {
      state.stableSince = Date.now();
    }
  }, []);

  const handlePause = useCallback(() => {
    const state = stateRef.current;

    if (!state.recovering) {
      state.wantsPlayback = false;
      state.waitingSince = null;
      state.stableSince = null;
    }
  }, []);

  const handleSeeking = useCallback(() => {
    const state = stateRef.current;

    state.waitingSince = null;
    state.lastProgressAt = Date.now();
    state.stableSince = null;
  }, []);

  const resumePlayback = useCallback(
    async (video) => {
      const state = stateRef.current;

      if (
        video !== videoRef.current ||
        !state.recovering ||
        !state.wantsPlayback
      ) {
        return;
      }

      try {
        await video.play();
      } catch (error) {
        console.warn(
          "[MiqFlix] Não foi possível retomar automaticamente",
          error
        );
      }
    },
    [videoRef]
  );

  const handleSeeked = useCallback(
    (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

      state.lastPosition = video.currentTime;
      state.lastProgressAt = Date.now();
      state.waitingSince = null;

      if (state.recovering) {
        void resumePlayback(video);
      }
    },
    [resumePlayback]
  );

  const handleLoadedMetadata = useCallback(
    (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

      if (state.pendingSeek === null) return;

      let position = state.pendingSeek;

      if (
        Number.isFinite(video.duration) &&
        video.duration > 1
      ) {
        position = Math.min(
          position,
          video.duration - 0.5
        );
      }

      try {
        video.currentTime = position;
        state.lastPosition = position;

        console.info(
          "[MiqFlix] Restaurando posição",
          { position }
        );
      } catch (error) {
        console.warn(
          "[MiqFlix] Falha ao restaurar posição",
          error
        );
      }

      state.pendingSeek = null;
    },
    []
  );

  const handleCanPlay = useCallback(
    (event) => {
      void resumePlayback(event.currentTarget);
    },
    [resumePlayback]
  );

  const handleError = useCallback(
    (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

      // Ignora eventos de elementos que
      // já foram substituídos pelo React.
      if (video !== videoRef.current) return;

      const code = video.error?.code ?? null;

      const errorTypes = {
        1: "MEDIA_ERR_ABORTED",
        2: "MEDIA_ERR_NETWORK",
        3: "MEDIA_ERR_DECODE",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
      };

      console.error("[MiqFlix] Erro de mídia", {
        code,
        type: errorTypes[code] || "UNKNOWN",
        currentTime: video.currentTime,
        networkState: video.networkState,
        readyState: video.readyState,
        attempts: state.attempts,
        recovering: state.recovering,
      });

      // O navegador pode emitir ABORTED ao
      // substituir uma fonte durante a recuperação.
      if (
        code === 1 &&
        (state.recovering || state.scheduled)
      ) {
        return;
      }

      // Uma fonte não suportada não se torna
      // compatível apenas por recarregá-la.
      if (code === 4) {
        console.error(
          "[MiqFlix] Fonte de mídia incompatível"
        );
        return;
      }

      recover(errorTypes[code] || "media-error");
    },
    [videoRef, recover]
  );

  const handleEnded = useCallback(() => {
    const state = stateRef.current;

    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    state.ended = true;
    state.recovering = false;
    state.scheduled = false;
    state.wantsPlayback = false;
    state.pendingSeek = null;
  }, []);

  useEffect(() => {
    if (!sourceUrl) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const state = stateRef.current;

      if (
        !video ||
        state.ended ||
        video.ended ||
        video.seeking ||
        state.scheduled
      ) {
        return;
      }

      const now = Date.now();

      if (state.recovering) {
        if (
          now - state.recoveryStartedAt >=
          STALL_TIMEOUT_MS
        ) {
          recover("recovery-timeout");
        }

        return;
      }

      // Não reconectar quando o usuário
      // pausou intencionalmente.
      if (video.paused) return;

      const referenceTime =
        state.waitingSince ??
        state.lastProgressAt;

      if (
        now - referenceTime >=
        STALL_TIMEOUT_MS
      ) {
        recover("playback-stalled");
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [videoRef, sourceUrl, recover]);

  const streamUrl = sourceUrl
    ? `${sourceUrl}${
        sourceUrl.includes("?") ? "&" : "?"
      }_retry=${retryToken}`
    : "";

  return {
    streamUrl,
    isRecovering,
    handleTimeUpdate,
    handleWaiting,
    handleStalled,
    handlePlaying,
    handlePause,
    handleSeeking,
    handleSeeked,
    handleLoadedMetadata,
    handleCanPlay,
    handleError,
    handleEnded,
  };
}
