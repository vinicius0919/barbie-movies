
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublicCollectionConfigs,
} from "../services/collections";

function normalizeCollection(collection) {
  const items = Array.isArray(collection.resolvedItems)
    ? collection.resolvedItems.map((item) => ({
        ...item,
        _id: String(item._id),
      }))
    : [];

  const movieCount = items.filter(
    (item) => item.mediaType === "movie"
  ).length;

  const seriesCount = items.filter(
    (item) => item.mediaType === "series"
  ).length;

  const posters = [
    collection.coverUrl,
    ...items.map((item) => item.poster),
  ]
    .filter(
      (url) =>
        typeof url === "string" &&
        /^https?:\/\//i.test(url)
    )
    .filter(
      (url, index, list) =>
        list.indexOf(url) === index
    )
    .slice(0, 3);

  return {
    id: collection.id,
    title: collection.title,
    description: collection.description || "",
    coverUrl: collection.coverUrl || "",
    featured: collection.featured === true,
    sortOrder: collection.sortOrder ?? 100,
    items,
    total: items.length,
    movieCount,
    seriesCount,
    posters,
  };
}

export function useCollections() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] =
    useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result =
          await getPublicCollectionConfigs();

        if (!active) return;

        setData(result);
      } catch (err) {
        if (!active) return;

        console.error(
          "[Collections] Erro:",
          err
        );

        setError(
          err.message ||
          "Não foi possível carregar as coleções."
        );

        setData([]);
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
    () => data.map(normalizeCollection),
    [data]
  );

  function reload() {
    setRequestVersion((value) => value + 1);
  }

  return {
    collections,
    loading,
    error,
    warnings: [],
    reload,
  };
}
