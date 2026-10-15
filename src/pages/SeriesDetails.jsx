import "./SeriesDetails.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

import useSeriesDetails from "../hooks/useSeriesDetails";
import useSeriesFavorite from "../hooks/useSeriesFavorite";
import useWatchProgress from "../hooks/useWatchProgress";

import SeriesHero from "../components/series-details/SeriesHero";
import SeriesPlayer from "../components/series-details/SeriesPlayer";
import SeriesSeasons from "../components/series-details/SeriesSeasons";

export default function SeriesDetails() {
  const { id } = useParams();

  const playerRef = useRef(null);
  const restoredRef = useRef(false);

  // =========================================
  // SERIES
  // =========================================

  const {
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
    registerView,
  } = useSeriesDetails(id);

  // =========================================
  // FAVORITES
  // =========================================

  const { favorite, favoriteLoading, favoriteError, toggleFavorite } =
    useSeriesFavorite(id);

  // =========================================
  // WATCH PROGRESS
  // =========================================

  const { progress, loadingProgress, progressError, saveProgress } =
    useWatchProgress(id);

  const [resumeTime, setResumeTime] = useState(0);
  const [resumeEpisode, setResumeEpisode] = useState(null);

  // =========================================
  // STREAM URL
  // =========================================

  const streamUrl = useMemo(() => {
    if (!playbackRequested || !currentEpisode?.videoUrl) {
      return "";
    }

    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

    if (!baseUrl) return "";

    return (
      `${baseUrl}/stream?page=` + encodeURIComponent(currentEpisode.videoUrl)
    );
  }, [playbackRequested, currentEpisode?.videoUrl]);

  // =========================================
  // SCROLL
  // =========================================

  const scrollToPlayer = useCallback(() => {
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  // =========================================
  // RESET ON SERIES CHANGE
  // =========================================

  useEffect(() => {
    restoredRef.current = false;

    setResumeTime(0);
    setResumeEpisode(null);
  }, [id]);

  // =========================================
  // RESTORE WATCH PROGRESS
  // =========================================

  useEffect(() => {
    if (
      loading ||
      loadingProgress ||
      !series ||
      !Array.isArray(seasons) ||
      restoredRef.current
    ) {
      return;
    }

    restoredRef.current = true;

    if (!progress) return;

    const season = seasons.find(
      (item) => item.seasonNumber === progress.seasonNumber,
    );

    const episode = season?.episodes?.find(
      (item) => item.episodeNumber === progress.episodeNumber,
    );

    if (!episode) return;

    selectEpisode(progress.seasonNumber, progress.episodeNumber);

    // Abre a temporada do episódio recuperado.
    const isSeasonExpanded =
      expandedSeasons instanceof Set
        ? expandedSeasons.has(progress.seasonNumber)
        : Array.isArray(expandedSeasons)
          ? expandedSeasons.includes(progress.seasonNumber)
          : false;

    if (!isSeasonExpanded) {
      toggleSeason(progress.seasonNumber);
    }

    setResumeEpisode({
      seasonNumber: progress.seasonNumber,
      episodeNumber: progress.episodeNumber,
      title: episode.title,
    });

    setResumeTime(
      progress.completed ? 0 : Math.max(0, progress.currentTime || 0),
    );
  }, [
    loading,
    loadingProgress,
    series,
    seasons,
    progress,
    selectEpisode,
    expandedSeasons,
    toggleSeason,
  ]);

  // =========================================
  // SAVE WATCH PROGRESS
  // =========================================

  const handleSaveProgress = useCallback(
    ({ currentTime, duration, completed }) => {
      if (!selection || !currentEpisode) {
        return;
      }

      saveProgress({
        seasonNumber: selection.seasonNumber,
        episodeNumber: selection.episodeNumber,
        currentTime,
        duration,
        completed,
      }).catch((error) => {
        console.error("[SeriesDetails] Erro ao salvar progresso:", error);
      });
    },
    [selection, currentEpisode, saveProgress],
  );

  // =========================================
  // PLAYBACK ERROR
  // =========================================

  const handlePlaybackError = useCallback(
    (message) => {
      setPlaybackError(
        typeof message === "string"
          ? message
          : "Não foi possível reproduzir este episódio.",
      );
    },
    [setPlaybackError],
  );

  // =========================================
  // START PLAYBACK
  // =========================================

  const handlePlay = useCallback(() => {
    if (!currentEpisode?.videoUrl) {
      setPlaybackError(
        "Este episódio não possui uma fonte de reprodução cadastrada.",
      );

      return;
    }

    setPlaybackError("");
    requestPlayback();

    scrollToPlayer();
  }, [currentEpisode, setPlaybackError, requestPlayback, scrollToPlayer]);

  // =========================================
  // WATCH NOW / CONTINUE WATCHING
  // =========================================

  const handleWatchNow = useCallback(() => {
    // Prioriza o último episódio assistido.
    if (resumeEpisode) {
      const season = seasons.find(
        (item) => item.seasonNumber === resumeEpisode.seasonNumber,
      );

      const episode = season?.episodes?.find(
        (item) => item.episodeNumber === resumeEpisode.episodeNumber,
      );

      if (episode) {
        selectEpisode(resumeEpisode.seasonNumber, resumeEpisode.episodeNumber);

        if (!episode.videoUrl) {
          setPlaybackError(
            "Este episódio não possui uma fonte de reprodução cadastrada.",
          );

          return;
        }

        setPlaybackError("");
        requestPlayback();
        scrollToPlayer();

        return;
      }
    }

    // Sem histórico: começa no primeiro episódio.
    const firstSeason = seasons
      .filter((season) => season.seasonNumber > 0)
      .find((season) => season.episodes?.length > 0);

    const season =
      firstSeason || seasons.find((item) => item.episodes?.length > 0);

    const episode = season?.episodes?.[0];

    if (!episode) return;

    setResumeTime(0);

    selectEpisode(season.seasonNumber, episode.episodeNumber);

    if (!episode.videoUrl) {
      setPlaybackError(
        "Este episódio não possui uma fonte de reprodução cadastrada.",
      );

      return;
    }

    setPlaybackError("");
    requestPlayback();
    scrollToPlayer();
  }, [
    resumeEpisode,
    seasons,
    selectEpisode,
    setPlaybackError,
    requestPlayback,
    scrollToPlayer,
  ]);

  // =========================================
  // SELECT EPISODE
  // =========================================

  const handleSelectEpisode = useCallback(
    (seasonNumber, episodeNumber) => {
      const season = seasons.find((item) => item.seasonNumber === seasonNumber);

      const episode = season?.episodes?.find(
        (item) => item.episodeNumber === episodeNumber,
      );

      if (!episode) {
        setPlaybackError("Episódio não encontrado.");
        return;
      }

      // Evita reutilizar o tempo de outro episódio.
      const isResumeEpisode =
        resumeEpisode?.seasonNumber === seasonNumber &&
        resumeEpisode?.episodeNumber === episodeNumber;

      if (!isResumeEpisode) {
        setResumeTime(0);
      }

      selectEpisode(seasonNumber, episodeNumber);

      if (!episode.videoUrl) {
        setPlaybackError(
          "Este episódio não possui uma fonte de reprodução cadastrada.",
        );
        return;
      }

      setPlaybackError("");

      // Solicita a reprodução após selecionar o episódio.
      requestPlayback();

      scrollToPlayer();
    },
    [
      seasons,
      resumeEpisode,
      selectEpisode,
      requestPlayback,
      setPlaybackError,
      scrollToPlayer,
    ],
  );

  // =========================================
  // LOADING
  // =========================================

  if (loading || loadingProgress) {
    return (
      <div className="series-details-loading">
        <div className="series-loader" />
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (!series) {
    return (
      <div className="series-details-error">
        <AlertCircle size={24} />

        <p>{error || "Série não encontrada."}</p>

        <Link to="/series">Voltar para séries</Link>
      </div>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="series-details-page">
      <div className="series-details-backdrop">
        {(series.backdrop || series.poster) && (
          <img
            src={series.backdrop || series.poster}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>

      <div className="series-details-overlay" />

      <div className="series-details-topbar">
        <Link to="/series" className="series-back-button">
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <SeriesHero
        series={series}
        seasonCount={seasons.length}
        episodeCount={totalEpisodes}
        onWatch={handleWatchNow}
        favorite={favorite}
        favoriteLoading={favoriteLoading}
        favoriteError={favoriteError}
        onToggleFavorite={toggleFavorite}
        resumeEpisode={resumeEpisode}
        hasProgress={Boolean(resumeEpisode)}
        resumeTime={resumeTime}
      />

      {progressError && (
        <p className="series-progress-error">{progressError}</p>
      )}

      <div ref={playerRef}>
        <SeriesPlayer
          episode={currentEpisode}
          streamUrl={streamUrl}
          playbackRequested={playbackRequested}
          playbackError={playbackError}
          resumeTime={resumeTime}
          onProgress={handleSaveProgress}
          onStarted={registerView}
          onError={handlePlaybackError}
          onPlay={handlePlay}
        />
      </div>

      <SeriesSeasons
        poster={series.poster}
        seasons={seasons}
        selection={selection}
        expandedSeasons={expandedSeasons}
        onToggleSeason={toggleSeason}
        onSelectEpisode={handleSelectEpisode}
      />
    </div>
  );
}
