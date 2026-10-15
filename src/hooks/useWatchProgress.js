
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getSeriesProgress,
  saveSeriesProgress,
} from "../services/watchProgress";

export default function useWatchProgress(seriesId) {
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState("");

  const seriesIdRef = useRef(seriesId);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    seriesIdRef.current = seriesId;
    saveQueueRef.current = Promise.resolve();
  }, [seriesId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setLoadingProgress(true);
      setProgress(null);
      setProgressError("");

      if (!seriesId) {
        setLoadingProgress(false);
        return;
      }

      try {
        const result = await getSeriesProgress(seriesId);

        if (!cancelled) {
          setProgress(result);
        }
      } catch (error) {
        if (!cancelled) {
          setProgressError(
            error.response?.data?.error ||
              "Não foi possível carregar o histórico."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProgress(false);
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  const saveProgress = useCallback(
    (payload) => {
      if (!seriesId) return Promise.resolve(null);

      const targetSeriesId = seriesId;

      // Serializa os envios para evitar que uma
      // gravação antiga termine depois de uma nova.
      const operation = saveQueueRef.current
        .catch(() => null)
        .then(() =>
          saveSeriesProgress(targetSeriesId, payload)
        );

      saveQueueRef.current = operation;

      operation
        .then((result) => {
          if (seriesIdRef.current === targetSeriesId) {
            setProgress(result);
            setProgressError("");
          }
        })
        .catch((error) => {
          if (seriesIdRef.current === targetSeriesId) {
            setProgressError(
              error.response?.data?.error ||
                "Não foi possível salvar o progresso."
            );
          }
        });

      return operation;
    },
    [seriesId]
  );

  return {
    progress,
    loadingProgress,
    progressError,
    saveProgress,
  };
}
