
import "./SeriesDetails.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import useSeriesDetails from "../hooks/useSeriesDetails";
import useSeriesFavorite from "../hooks/useSeriesFavorite";
import useWatchProgress from "../hooks/useWatchProgress";
import SeriesHero from "../components/series-details/SeriesHero";
import SeriesPlayer from "../components/series-details/SeriesPlayer";
import SeriesSeasons from "../components/series-details/SeriesSeasons";
import {
  getSeriesEpisodePlayback,
} from "../services/series";
// =========================================
// HELPERS
// =========================================
function getPlaybackError(error) {
  const status = error?.response?.status;
  if (status === 401) {
    return "Faça login para assistir a este episódio.";
  }
  if (status === 403) {
    return "É necessária uma assinatura ativa para assistir.";
  }
  if (status === 404) {
    return "Episódio ou fonte de reprodução não encontrado.";
  }
  if (status === 422) {
    return "Nenhuma fonte de reprodução está disponível.";
  }
  if (status === 503) {
    return "Não foi possível verificar sua assinatura. Tente novamente.";
  }
  if (error?.message === "INVALID_PLAYBACK_RESPONSE") {
    return "O servidor retornou dados de reprodução inválidos.";
  }
  return "Não foi possível preparar a reprodução.";
}
function invalidPlaybackResponse() {
  return new Error("INVALID_PLAYBACK_RESPONSE");
}
function getApiBase() {
  const configuredBase = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
  const url = new URL(`${configuredBase}/`, window.location.origin);
  return url;
}
// Aceita apenas URLs internas dos endpoints de mídia autorizados.
function resolveStreamUrl(streamPath) {
  if (typeof streamPath !== "string" || !streamPath.trim()) {
    throw invalidPlaybackResponse();
  }
  const base = getApiBase();
  const path = streamPath.trim();
  let resolved;
  try {
    if (/^https?:\/\//i.test(path)) {
      resolved = new URL(path);
    } else if (path.startsWith(base.pathname)) {
      resolved = new URL(path, base.origin);
    } else {
      resolved = new URL(path.replace(/^\/+/, ""), base);
    }
  } catch {
    throw invalidPlaybackResponse();
  }
  const apiPrefix = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
  if (
    resolved.origin !== base.origin ||
    resolved.username ||
    resolved.password ||
    resolved.hash ||
    !resolved.pathname.startsWith(apiPrefix)
  ) {
    throw invalidPlaybackResponse();
  }
  const relative = resolved.pathname.slice(apiPrefix.length);
  if (!/^(?:stream|media)\//.test(relative)) {
    throw invalidPlaybackResponse();
  }
  return resolved.toString();
}
function validateEmbedUrl(embedUrl) {
  if (typeof embedUrl !== "string" || !embedUrl.trim()) {
    throw invalidPlaybackResponse();
  }
  let url;
  try {
    url = new URL(embedUrl);
  } catch {
    throw invalidPlaybackResponse();
  }
  const allowedHosts = new Set([
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "youtube.com",
  ]);
  if (
    url.protocol !== "https:" ||
    !allowedHosts.has(url.hostname) ||
    !/^\/embed\/[a-zA-Z0-9_-]{11}\/?$/.test(url.pathname) ||
    url.username ||
    url.password
  ) {
    throw invalidPlaybackResponse();
  }
  return url.toString();
}
function validateExternalUrl(watchUrl) {
  if (typeof watchUrl !== "string" || !watchUrl.trim()) {
    throw invalidPlaybackResponse();
  }
  let url;
  try {
    url = new URL(watchUrl);
  } catch {
    throw invalidPlaybackResponse();
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw invalidPlaybackResponse();
  }
  return url.toString();
}
function getYoutubeEmbedUrl(watchUrl) {
  let url;
  try {
    url = new URL(watchUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  let id = null;
  if (["www.youtube.com", "youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      id = url.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})\/?$/)?.[1];
    }
  } else if (host === "youtu.be") {
    id = url.pathname.match(/^\/([a-zA-Z0-9_-]{11})\/?$/)?.[1];
  }
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
    ? `https://www.youtube.com/embed/${id}`
    : null;
}
// Compatibilidade temporária com a API antiga, que devolve { videoUrl }.
// Páginas de terceiros nunca são enviadas ao player nativo.
function normalizePlaybackResponse(payload) {
  const response = payload?.data?.provider || payload?.data?.videoUrl
    ? payload.data
    : payload;
  if (response?.provider === "native") {
    return {
      provider: "native",
      streamUrl: resolveStreamUrl(response.streamPath),
      embedUrl: "",
    };
  }
  if (response?.provider === "youtube") {
    return {
      provider: "youtube",
      streamUrl: "",
      embedUrl: validateEmbedUrl(response.embedUrl),
    };
  }
  if (response?.provider === "external") {
    return {
      provider: "external",
      watchUrl: validateExternalUrl(response.watchUrl),
      streamUrl: "",
      embedUrl: "",
    };
  }
  if (!response?.provider && typeof response?.videoUrl === "string") {
    const watchUrl = validateExternalUrl(response.videoUrl);
    const embedUrl = getYoutubeEmbedUrl(watchUrl);
    return embedUrl
      ? { provider: "youtube", embedUrl: validateEmbedUrl(embedUrl), streamUrl: "" }
      : { provider: "external", watchUrl, streamUrl: "", embedUrl: "" };
  }
  throw invalidPlaybackResponse();
}
// =========================================
// SERIES DETAILS
// =========================================
export default function SeriesDetails() {
  const { id } = useParams();
  const playerRef = useRef(null);
  const restoredRef = useRef(false);
  // Controle de requisições concorrentes.
  const requestSequenceRef = useRef(0);
  const requestControllerRef = useRef(null);
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
    expandedSeasons,
    toggleSeason,
    selectEpisode,
    registerView,
  } = useSeriesDetails(id);
  // =========================================
  // FAVORITES
  // =========================================
  const {
    favorite,
    favoriteLoading,
    favoriteError,
    toggleFavorite,
  } = useSeriesFavorite(id);
  // =========================================
  // WATCH PROGRESS
  // =========================================
  const {
    progress,
    loadingProgress,
    progressError,
    saveProgress,
  } = useWatchProgress(id);
  const [resumeTime, setResumeTime] = useState(0);
  const [resumeEpisode, setResumeEpisode] =
    useState(null);
  // =========================================
  // AUTHORIZED PLAYBACK
  // =========================================
  const [playback, setPlayback] = useState(null);
  const [
    playbackRequested,
    setPlaybackRequested,
  ] = useState(false);
  const [playbackLoading, setPlaybackLoading] =
    useState(false);
  const [playbackError, setPlaybackError] =
    useState("");
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
    setPlayback(null);
    setPlaybackError("");
    setPlaybackRequested(false);
    setPlaybackLoading(false);
    return () => {
      // Cancela qualquer autorização pendente
      // ao trocar de série ou desmontar a página.
      requestSequenceRef.current += 1;
      requestControllerRef.current?.abort();
    };
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
      (item) =>
        item.seasonNumber ===
        progress.seasonNumber
    );
    const episode = season?.episodes?.find(
      (item) =>
        item.episodeNumber ===
        progress.episodeNumber
    );
    if (!episode) return;
    selectEpisode(
      progress.seasonNumber,
      progress.episodeNumber
    );
    // Abre a temporada do episódio salvo.
    const isExpanded = Boolean(expandedSeasons?.[progress.seasonNumber]);
    if (!isExpanded) {
      toggleSeason(progress.seasonNumber);
    }
    setResumeEpisode({
      seasonNumber: progress.seasonNumber,
      episodeNumber: progress.episodeNumber,
      title: episode.title,
    });
    setResumeTime(
      progress.completed
        ? 0
        : Math.max(
            0,
            Number(progress.currentTime) || 0
          )
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
  // REQUEST AUTHORIZED PLAYBACK
  // =========================================
  const requestAuthorizedPlayback = useCallback(
    async (seasonNumber, episodeNumber) => {
      // Invalida requisições anteriores.
      const requestId =
        ++requestSequenceRef.current;
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      // Não reutilizar fonte do episódio anterior.
      setPlayback(null);
      setPlaybackError("");
      setPlaybackRequested(true);
      setPlaybackLoading(true);
      scrollToPlayer();
      try {
        const response =
          await getSeriesEpisodePlayback(
            id,
            seasonNumber,
            episodeNumber,
            {
              signal: controller.signal,
            }
          );
        if (
          controller.signal.aborted ||
          requestId !== requestSequenceRef.current
        ) {
          return;
        }
        setPlayback(normalizePlaybackResponse(response));
      } catch (error) {
        if (
          controller.signal.aborted ||
          requestId !== requestSequenceRef.current
        ) {
          return;
        }
        console.error(
          "[SeriesDetails] Falha ao autorizar episódio:",
          error
        );
        setPlayback(null);
        setPlaybackError(
          getPlaybackError(error)
        );
      } finally {
        if (
          requestId === requestSequenceRef.current &&
          !controller.signal.aborted
        ) {
          setPlaybackLoading(false);
        }
      }
    },
    [id, scrollToPlayer]
  );
  // =========================================
  // START EPISODE
  // =========================================
  const startEpisode = useCallback(
    (
      seasonNumber,
      episodeNumber,
      initialTime = 0
    ) => {
      const season = seasons.find(
        (item) =>
          item.seasonNumber === seasonNumber
      );
      const episode = season?.episodes?.find(
        (item) =>
          item.episodeNumber === episodeNumber
      );
      if (!episode) {
        setPlaybackError(
          "Episódio não encontrado."
        );
        return;
      }
      setResumeTime(
        Math.max(
          0,
          Number(initialTime) || 0
        )
      );
      selectEpisode(
        seasonNumber,
        episodeNumber
      );
      // Não verificamos episode.videoUrl.
      // O backend é responsável por localizar
      // e autorizar a fonte de reprodução.
      void requestAuthorizedPlayback(
        seasonNumber,
        episodeNumber
      );
    },
    [
      seasons,
      selectEpisode,
      requestAuthorizedPlayback,
    ]
  );
  // =========================================
  // WATCH NOW / CONTINUE WATCHING
  // =========================================
  const handleWatchNow = useCallback(() => {
    if (resumeEpisode) {
      const season = seasons.find(
        (item) =>
          item.seasonNumber ===
          resumeEpisode.seasonNumber
      );
      const episode = season?.episodes?.find(
        (item) =>
          item.episodeNumber ===
          resumeEpisode.episodeNumber
      );
      if (episode) {
        startEpisode(
          resumeEpisode.seasonNumber,
          resumeEpisode.episodeNumber,
          resumeTime
        );
        return;
      }
    }
    // Sem histórico: começa pelo primeiro
    // episódio disponível da série.
    const firstSeason = seasons
      .filter(
        (season) =>
          season.seasonNumber > 0
      )
      .find(
        (season) =>
          season.episodes?.length > 0
      );
    const season =
      firstSeason ||
      seasons.find(
        (item) =>
          item.episodes?.length > 0
      );
    const episode = season?.episodes?.[0];
    if (!episode) {
      setPlaybackError(
        "Esta série não possui episódios disponíveis."
      );
      scrollToPlayer();
      return;
    }
    startEpisode(
      season.seasonNumber,
      episode.episodeNumber,
      0
    );
  }, [
    resumeEpisode,
    resumeTime,
    seasons,
    startEpisode,
    scrollToPlayer,
  ]);
  // =========================================
  // SELECT EPISODE
  // =========================================
  const handleSelectEpisode = useCallback(
    (seasonNumber, episodeNumber) => {
      const isResumeEpisode =
        resumeEpisode?.seasonNumber ===
          seasonNumber &&
        resumeEpisode?.episodeNumber ===
          episodeNumber;
      startEpisode(
        seasonNumber,
        episodeNumber,
        isResumeEpisode ? resumeTime : 0
      );
    },
    [
      resumeEpisode,
      resumeTime,
      startEpisode,
    ]
  );
  // =========================================
  // SAVE WATCH PROGRESS
  // =========================================
  const handleSaveProgress = useCallback(
    ({ currentTime, duration, completed }) => {
      if (!selection || !currentEpisode) {
        return;
      }
      return Promise.resolve(
        saveProgress({
          seasonNumber:
            selection.seasonNumber,
          episodeNumber:
            selection.episodeNumber,
          currentTime,
          duration,
          completed,
        })
      ).catch((error) => {
        console.error(
          "[SeriesDetails] Erro ao salvar progresso:",
          error
        );
      });
    },
    [
      selection,
      currentEpisode,
      saveProgress,
    ]
  );
  // =========================================
  // PLAYBACK ERROR
  // =========================================
  const handlePlaybackError = useCallback(
    (message) => {
      setPlaybackError(
        typeof message === "string"
          ? message
          : "Não foi possível reproduzir este episódio."
      );
      // Interrompe novas tentativas de
      // reprodução após erro definitivo.
      setPlayback(null);
      setPlaybackRequested(false);
    },
    []
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
        <p>
          {error || "Série não encontrada."}
        </p>
        <Link to="/series">
          Voltar para séries
        </Link>
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
            src={
              series.backdrop ||
              series.poster
            }
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
      <div className="series-details-overlay" />
      <div className="series-details-topbar">
        <Link
          to="/series"
          className="series-back-button"
        >
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
        <p className="series-progress-error">
          {progressError}
        </p>
      )}
      <div ref={playerRef}>
        {playbackLoading && (
          <p
            className="series-progress-error"
            role="status"
          >
            Verificando acesso e preparando reprodução...
          </p>
        )}
        {!playback && playbackError && (
          <p className="series-progress-error" role="alert">
            {playbackError}
          </p>
        )}
        {playback?.provider === "external" ? (
          <div className="series-progress-error" role="region" aria-label="Reprodução externa">
            <p>Este episódio está disponível no site de origem. A reprodução não está integrada ao player do MiqFlix.</p>
            <a
              href={playback.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir no site de origem
            </a>
          </div>
        ) : (
          <SeriesPlayer
            episode={currentEpisode}
            streamUrl={playback?.streamUrl || ""}
            embedUrl={playback?.embedUrl || ""}
            playbackRequested={playbackRequested && !playbackLoading && Boolean(playback)}
            playbackError={playbackError}
            resumeTime={resumeTime}
            onProgress={handleSaveProgress}
            onStarted={registerView}
            onError={handlePlaybackError}
          />
        )}
      </div>
      <SeriesSeasons
        poster={series.poster}
        seasons={seasons}
        selection={selection}
        expandedSeasons={expandedSeasons}
        onToggleSeason={toggleSeason}
        onSelectEpisode={
          handleSelectEpisode
        }
      />
    </div>
  );
}
