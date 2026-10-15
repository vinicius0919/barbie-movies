
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getSeriesById,
  addEpisodeView,
} from "../services/series";

import {
  findFirstEpisode,
  getApiError,
  getEpisodeKey,
  sortSeasons,
} from "../utils/seriesDetails";

export default function useSeriesDetails(id) {
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selection, setSelection] = useState(null);
  const [playbackRequested, setPlaybackRequested] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [expandedSeasons, setExpandedSeasons] = useState({});

  const countedViews = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setSeries(null);
      setSelection(null);
      setPlaybackRequested(false);
      setPlaybackError("");
      setExpandedSeasons({});
      countedViews.current = new Set();

      try {
        const data = await getSeriesById(id);
        if (cancelled) return;

        const first = findFirstEpisode(data.seasons);

        setSeries(data);
        setSelection(first);

        if (first) {
          setExpandedSeasons({
            [first.seasonNumber]: true,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiError(err, "Não foi possível carregar a série.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) {
      load();
    } else {
      setLoading(false);
      setError("Identificador da série inválido.");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const seasons = useMemo(
    () => sortSeasons(series?.seasons),
    [series]
  );

  const totalEpisodes = useMemo(
    () =>
      seasons.reduce(
        (total, season) => total + season.episodes.length,
        0
      ),
    [seasons]
  );

  const selectedSeason = seasons.find(
    (season) =>
      season.seasonNumber === selection?.seasonNumber
  );

  const currentEpisode = selectedSeason?.episodes.find(
    (episode) =>
      episode.episodeNumber === selection?.episodeNumber
  );

  const toggleSeason = useCallback((seasonNumber) => {
    setExpandedSeasons((previous) => ({
      ...previous,
      [seasonNumber]: !previous[seasonNumber],
    }));
  }, []);

  const selectEpisode = useCallback((seasonNumber, episodeNumber) => {
    setSelection({ seasonNumber, episodeNumber });
    setPlaybackRequested(false);
    setPlaybackError("");
    setExpandedSeasons((previous) => ({
      ...previous,
      [seasonNumber]: true,
    }));
  }, []);

  const requestPlayback = useCallback(() => {
    if (!selection) return;
    setPlaybackError("");
    setPlaybackRequested(true);
  }, [selection]);

  const watchFirstEpisode = useCallback(() => {
    const first = findFirstEpisode(series?.seasons);
    if (!first) return;

    setSelection(first);
    setPlaybackError("");
    setPlaybackRequested(true);
    setExpandedSeasons((previous) => ({
      ...previous,
      [first.seasonNumber]: true,
    }));
  }, [series]);

  const registerView = useCallback(async () => {
    if (!series?._id || !selection) return;

    const { seasonNumber, episodeNumber } = selection;
    const key = getEpisodeKey(seasonNumber, { episodeNumber });

    if (countedViews.current.has(key)) return;
    countedViews.current.add(key);

    try {
      const result = await addEpisodeView(
        series._id,
        seasonNumber,
        episodeNumber
      );

      setSeries((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          views: result?.totalSeriesViews ?? previous.views,
          seasons: previous.seasons.map((season) =>
            season.seasonNumber !== seasonNumber
              ? season
              : {
                  ...season,
                  episodes: season.episodes.map((episode) =>
                    episode.episodeNumber !== episodeNumber
                      ? episode
                      : {
                          ...episode,
                          views: result?.episodeViews ?? episode.views,
                        }
                  ),
                }
          ),
        };
      });
    } catch (err) {
      countedViews.current.delete(key);
      console.error("Erro ao registrar visualização:", err);
    }
  }, [series?._id, selection]);

  return {
    series,
    loading,
    error,
    seasons,
    totalEpisodes,
    selection,
    currentEpisode,
    playbackRequested,
    playbackError,
    setPlaybackError,
    expandedSeasons,
    toggleSeason,
    selectEpisode,
    requestPlayback,
    watchFirstEpisode,
    registerView,
  };
}
