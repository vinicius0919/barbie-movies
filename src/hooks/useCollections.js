
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCollectionsCatalog,
  getPublicCollectionConfigs,
} from "../services/collections";

import { buildCollections } from "../utils/buildCollections";
import { mergeCollections } from "../utils/mergeCollections";

export function useCollections() {
  const [catalog, setCatalog] = useState({
    movies: [],
    series: [],
  });

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [requestVersion, setRequestVersion] =
    useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setWarnings([]);

      try {
        const [catalogData, savedConfigs] =
          await Promise.all([
            getCollectionsCatalog(),
            getPublicCollectionConfigs(),
          ]);

        if (!active) return;

        setCatalog({
          movies: catalogData.movies,
          series: catalogData.series,
        });

        setConfigs(savedConfigs);
        setWarnings(catalogData.warnings);
      } catch (err) {
        if (!active) return;

        console.error(
          "[Collections] Falha:",
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

        setConfigs([]);
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

  const collections = useMemo(() => {
    const automatic = buildCollections(
      catalog.movies,
      catalog.series
    );

    return mergeCollections(
      automatic,
      configs,
      catalog.movies,
      catalog.series
    );
  }, [catalog, configs]);

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
