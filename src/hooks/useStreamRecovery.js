
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STALL_TIMEOUT_MS = 20000;
const CHECK_INTERVAL_MS = 5000;
const MAX_RETRIES = 3;

export default function useStreamRecovery({
  videoRef,
  sourceUrl,
}) {
  const [retryToken, setRetryToken] =
    useState(0);

  const [recoveryState, setRecoveryState] =
    useState({
      recovering: false,
      attempts: 0,
      error: "",
    });

  const lastProgressAt = useRef(Date.now());
  const lastPosition = useRef(0);
  const pendingSeek = useRef(null);
  const shouldResume = useRef(false);
  const attemptsRef = useRef(0);
  const recoveringRef = useRef(false);
  const waitingSince = useRef(null);
  const endedRef = useRef(false);
  const mountedRef = useRef(true);

  const resetRecovery = useCallback(() => {
    attemptsRef.current = 0;
    recoveringRef.current = false;
    waitingSince.current = null;

    setRecoveryState({
      recovering: false,
      attempts: 0,
      error: "",
    });
  }, []);

  const recover = useCallback(() => {
    const video = videoRef.current;

    if (
      !video ||
      !sourceUrl ||
      recoveringRef.current ||
      endedRef.current ||
      video.ended
    ) {
      return;
    }

    if (attemptsRef.current >= MAX_RETRIES) {
      setRecoveryState({
        recovering: false,
        attempts: attemptsRef.current,
        error:
          "Não foi possível restabelecer a transmissão. Tente novamente.",
      });

      return;
    }

    attemptsRef.current += 1;
    recoveringRef.current = true;

    const position = Number.isFinite(
      video.currentTime
    )
      ? video.currentTime
      : lastPosition.current;

    pendingSeek.current = Math.max(
      0,
      position - 0.5
    );

    shouldResume.current = !video.paused;

    console.warn(
      "[MiqFlix] Reconectando streaming",
      {
        attempt: attemptsRef.current,
        position: pendingSeek.current,
      }
    );

    setRecoveryState({
      recovering: true,
      attempts: attemptsRef.current,
      error: "",
    });

    lastProgressAt.current = Date.now();
    waitingSince.current = null;

    // Gera uma nova URL para forçar uma
    // nova requisição HTTP ao backend.
    setRetryToken((current) => current + 1);
  }, [videoRef, sourceUrl]);

  const handleTimeUpdate = useCallback(
    (event) => {
      const video = event.currentTarget;
      const current = video.currentTime;

      if (!Number.isFinite(current)) return;

      if (
        Math.abs(
          current - lastPosition.current
        ) >= 0.1
      ) {
        lastPosition.current = current;
        lastProgressAt.current = Date.now();
        waitingSince.current = null;

        if (recoveringRef.current) {
          recoveringRef.current = false;

          setRecoveryState((previous) => ({
            ...previous,
            recovering: false,
            error: "",
          }));
        }
      }
    },
    []
  );

  const handleWaiting = useCallback(() => {
    if (!waitingSince.current) {
      waitingSince.current = Date.now();
    }

    console.warn(
      "[MiqFlix] Aguardando buffer"
    );
  }, []);

  const handleStalled = useCallback(() => {
    if (!waitingSince.current) {
      waitingSince.current = Date.now();
    }

    console.warn(
      "[MiqFlix] Stream sem progresso"
    );
  }, []);

  const handlePlaying = useCallback(() => {
    waitingSince.current = null;
    lastProgressAt.current = Date.now();
    recoveringRef.current = false;

    setRecoveryState((previous) => ({
      ...previous,
      recovering: false,
      error: "",
    }));
  }, []);

  const handleLoadedMetadata = useCallback(
    (event) => {
      const video = event.currentTarget;

      if (pendingSeek.current == null) {
        return;
      }

      const duration = video.duration;
      let position = pendingSeek.current;

      if (
        Number.isFinite(duration) &&
        duration > 1
      ) {
        position = Math.min(
          position,
          duration - 0.5
        );
      }

      try {
        video.currentTime = position;
      } catch (error) {
        console.warn(
          "[MiqFlix] Não foi possível restaurar a posição",
          error
        );
      }

      pendingSeek.current = null;
    },
    []
  );

  const handleCanPlay = useCallback(
    async (event) => {
      const video = event.currentTarget;

      if (!recoveringRef.current) return;

      if (shouldResume.current) {
        shouldResume.current = false;

        try {
          await video.play();
        } catch (error) {
          console.warn(
            "[MiqFlix] Reprodução automática bloqueada",
            error
          );
        }
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

      // Um erro fatal pode ocorrer sem stalled.
      // A recuperação usa o mesmo limite
      // de tentativas.
      recoveringRef.current = false;
      recover();
    },
    [recover]
  );

  const handleEnded = useCallback(() => {
    endedRef.current = true;
    resetRecovery();
  }, [resetRecovery]);

  const retryManually = useCallback(() => {
    attemptsRef.current = 0;
    recoveringRef.current = false;
    endedRef.current = false;
    recover();
  }, [recover]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);


useEffect(() => {
  if (!sourceUrl) return;

  const interval = setInterval(() => {
    if (!mountedRef.current) return;

    const video = videoRef.current;

    if (
      !video ||
      video.ended ||
      video.seeking ||
      endedRef.current
    ) {
      return;
    }

    const now = Date.now();

    if (recoveringRef.current) {
      if (
        now - lastProgressAt.current >=
        STALL_TIMEOUT_MS
      ) {
        // A tentativa atual não produziu
        // progresso dentro do prazo.
        recoveringRef.current = false;
        recover();
      }

      return;
    }

    if (video.paused) return;

    const stalledFor = waitingSince.current
      ? now - waitingSince.current
      : now - lastProgressAt.current;

    if (stalledFor >= STALL_TIMEOUT_MS) {
      recover();
    }
  }, CHECK_INTERVAL_MS);

  return () => clearInterval(interval);
}, [videoRef, sourceUrl, recover]);


  useEffect(() => {
    attemptsRef.current = 0;
    recoveringRef.current = false;
    endedRef.current = false;
    pendingSeek.current = null;
    shouldResume.current = false;
    lastPosition.current = 0;
    lastProgressAt.current = Date.now();
    waitingSince.current = null;

    setRetryToken(0);

    setRecoveryState({
      recovering: false,
      attempts: 0,
      error: "",
    });
  }, [sourceUrl]);

  

  const streamUrl = sourceUrl
    ? `${sourceUrl}${
        sourceUrl.includes("?") ? "&" : "?"
      }_retry=${retryToken}`
    : "";

  return {
    streamUrl,
    recoveryState,
    resetRecovery,
    retryManually,
    handleTimeUpdate,
    handleWaiting,
    handleStalled,
    handlePlaying,
    handleLoadedMetadata,
    handleCanPlay,
    handleError,
    handleEnded,
  };
}
