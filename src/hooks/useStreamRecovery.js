
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

  // Mantém o estado vinculado à fonte atual.
  if (sourceRef.current !== sourceUrl) {
    sourceRef.current = sourceUrl;
    stateRef.current = createRecoveryState();
  }

  const isRecovering = useCallback(() => {
    return stateRef.current.recovering;
  }, []);

  const recover = useCallback(() => {
    const video = videoRef.current;
    const state = stateRef.current;

    if (
      !video ||
      !sourceUrl ||
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

    const position = Number.isFinite(
      video.currentTime
    )
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
    state.sourceGeneration += 1;

    console.warn(
      "[MiqFlix] Reconexão interna",
      {
        attempt: state.attempts,
        position: state.pendingSeek,
      }
    );

    setRetryToken(
      state.sourceGeneration
    );
  }, [videoRef, sourceUrl]);

  const handleTimeUpdate = useCallback(
    (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

      const position = video.currentTime;

      if (!Number.isFinite(position)) {
        return;
      }

      const advanced =
        position > state.lastPosition + 0.1;

      if (!advanced) return;

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
    },
    []
  );

  const handleWaiting = useCallback(() => {
    const state = stateRef.current;

    if (state.waitingSince === null) {
      state.waitingSince = Date.now();
    }
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
    }
  }, []);

  const handleSeeking = useCallback(() => {
    const state = stateRef.current;

    state.waitingSince = null;
    state.lastProgressAt = Date.now();
  }, []);

  const handleSeeked = useCallback(
    (event) => {
      const state = stateRef.current;

      state.lastPosition =
        event.currentTarget.currentTime;

      state.lastProgressAt = Date.now();
      state.waitingSince = null;
    },
    []
  );

  const handleLoadedMetadata = useCallback(
    (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

      if (state.pendingSeek === null) {
        return;
      }

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
    async (event) => {
      const video = event.currentTarget;
      const state = stateRef.current;

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
          "[MiqFlix] Reprodução automática indisponível",
          error
        );
      }
    },
    []
  );

  const handleError = useCallback(
    (event) => {
      const video = event.currentTarget;

      console.error(
        "[MiqFlix] Erro de mídia",
        {
          code: video.error?.code,
          message: video.error?.message,
          currentTime: video.currentTime,
        }
      );

      recover();
    },
    [recover]
  );

  const handleEnded = useCallback(() => {
    const state = stateRef.current;

    state.ended = true;
    state.recovering = false;
    state.wantsPlayback = false;
    state.pendingSeek = null;
  }, []);

  useEffect(() => {
    setRetryToken(0);
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceUrl) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const state = stateRef.current;

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
        recover();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
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
