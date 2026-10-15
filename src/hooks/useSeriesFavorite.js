
import { useEffect, useState } from "react";

import {
  getFavoriteSeries,
  toggleSeriesFavorite,
} from "../services/series";

import { getApiError } from "../utils/seriesDetails";

export default function useSeriesFavorite(seriesId) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!seriesId) return;

    let cancelled = false;

    async function load() {
      setFavorite(false);
      setError("");

      try {
        let page = 1;
        let totalPages = 1;
        let found = false;

        do {
          const data = await getFavoriteSeries({
            page,
            limit: 100,
          });

          if (cancelled) return;

          found = (data.series || []).some(
            (item) => String(item._id) === String(seriesId)
          );

          totalPages = Number(data.totalPages) || 1;
          page++;
        } while (!found && page <= totalPages);

        if (!cancelled) setFavorite(found);
      } catch (err) {
        if (!cancelled && err.response?.status !== 401) {
          setError(
            getApiError(err, "Não foi possível carregar favoritos.")
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  async function toggleFavorite() {
    if (!seriesId || loading) return;

    try {
      setLoading(true);
      setError("");

      const result = await toggleSeriesFavorite(seriesId);
      setFavorite(Boolean(result.favorite));
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Faça login para adicionar séries à sua lista."
          : getApiError(err, "Não foi possível atualizar sua lista.")
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    favorite,
    favoriteLoading: loading,
    favoriteError: error,
    toggleFavorite,
  };
}
