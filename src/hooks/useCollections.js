
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCollectionsCatalog } from "../services/collections";
import { buildCollections } from "../utils/buildCollections";

export function useCollections() {
  const [catalog, setCatalog] = useState({
    movies: [],
    series: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setWarnings([]);

      try {
        const data = await getCollectionsCatalog();

        if (!active) return;

        setCatalog({
          movies: data.movies,
          series: data.series,
        });

        setWarnings(data.warnings);
      } catch (err) {
        if (!active) return;

        console.error(
          "[Collections] Falha no carregamento:",
          err
        );

        setError(
          err.message ||
            "Não foi possível carregar as coleções."
        );

        setCatalog({
          movies: [],
          series: [],
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [requestVersion]);

  const collections = useMemo(
    () =>
      buildCollections(
        catalog.movies,
        catalog.series
      ),
    [catalog]
  );

  function reload() {
    setRequestVersion((value) => value + 1);
  }

  return {
    collections,
    loading,
    error,
    warnings,
    reload,
  };
}
