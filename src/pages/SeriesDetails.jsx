
import "./SeriesDetails.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Play,
  Eye,
  Tv,
  Layers3,
  Clock3,
  ChevronDown,
  ChevronUp,
  Heart,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";

import {
  getSeriesById,
  addEpisodeView,
} from "../services/series";

// =========================================
// HELPERS
// =========================================

const formatViews = (views) => {
  return Number(views || 0).toLocaleString("pt-BR");
};

const getSeasonTitle = (season) => {
  if (season.seasonNumber === 0) {
    return season.title || "Especiais";
  }

  return season.title || `Temporada ${season.seasonNumber}`;
};

const getEpisodeKey = (seasonNumber, episode) => {
  return (
    episode._id ||
    `${seasonNumber}-${episode.episodeNumber}`
  );
};

const findFirstEpisode = (series) => {
  if (!series?.seasons?.length) {
    return null;
  }

  const seasons = [...series.seasons].sort(
    (a, b) => a.seasonNumber - b.seasonNumber
  );

  // Prioriza temporadas regulares.
  const regularSeasons = seasons.filter(
    (season) => season.seasonNumber > 0
  );

  const specialSeasons = seasons.filter(
    (season) => season.seasonNumber === 0
  );

  for (const season of [
    ...regularSeasons,
    ...specialSeasons,
  ]) {
    const episodes = [...(season.episodes || [])].sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    );

    if (episodes.length > 0) {
      return {
        seasonNumber: season.seasonNumber,
        episode: episodes[0],
      };
    }
  }

  return null;
};

// =========================================
// COMPONENT
// =========================================

export default function SeriesDetails() {
  const { id } = useParams();

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const viewRequestRef = useRef(new Set());

  // =========================================
  // STATES
  // =========================================

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEpisode, setSelectedEpisode] =
    useState(null);

  const [playbackRequested, setPlaybackRequested] =
    useState(false);

  const [expandedSeasons, setExpandedSeasons] =
    useState({});

  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  const [playbackError, setPlaybackError] =
    useState("");

  // =========================================
  // LOAD SERIES
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadSeries() {
      try {
        setLoading(true);
        setError("");
        setSeries(null);
        setSelectedEpisode(null);
        setPlaybackRequested(false);
        setPlaybackError("");
        setExpandedSeasons({});
        setFavorite(false);

        viewRequestRef.current = new Set();

        const data = await getSeriesById(id);

        if (cancelled) return;

        setSeries(data);

        const firstEpisode = findFirstEpisode(data);

        if (firstEpisode) {
          setSelectedEpisode(firstEpisode);

          setExpandedSeasons({
            [firstEpisode.seasonNumber]: true,
          });
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Erro ao carregar série:",
          err
        );

        setError(
          err.response?.data?.error ||
            "Não foi possível carregar a série."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSeries();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // =========================================
  // LOAD FAVORITE STATE
  // =========================================

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadFavorite() {
      try {
        // Consulta os IDs das séries favoritas
        // do usuário autenticado.
        //
        // O endpoint atual é paginado, então
        // buscamos todas as páginas necessárias.

        let page = 1;
        let found = false;
        let totalPages = 1;

        do {
          const response = await api.get(
            "/series/favorites/list",
            {
              params: {
                page,
                limit: 100,
              },
            }
          );

          if (cancelled) return;

          const data = response.data;

          found = (data.series || []).some(
            (item) => String(item._id) === String(id)
          );

          totalPages = data.totalPages || 0;
          page++;
        } while (!found && page <= totalPages);

        if (!cancelled) {
          setFavorite(found);
        }
      } catch (err) {
        if (cancelled) return;

        // Visitantes não autenticados podem
        // visualizar os metadados da série.
        if (err.response?.status !== 401) {
          console.error(
            "Erro ao carregar favoritos:",
            err
          );
        }
      }
    }

    loadFavorite();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // =========================================
  // SORTED SEASONS
  // =========================================

  const seasons = useMemo(() => {
    return [...(series?.seasons || [])]
      .sort(
        (a, b) =>
          a.seasonNumber - b.seasonNumber
      )
      .map((season) => ({
        ...season,
        episodes: [...(season.episodes || [])].sort(
          (a, b) =>
            a.episodeNumber - b.episodeNumber
        ),
      }));
  }, [series]);

  // =========================================
  // TOTAL EPISODES
  // =========================================

  const totalEpisodes = useMemo(() => {
    return seasons.reduce(
      (total, season) =>
        total + season.episodes.length,
      0
    );
  }, [seasons]);

  // =========================================
  // CURRENT EPISODE
  // =========================================

  const currentEpisode = selectedEpisode?.episode;

  const currentSeasonNumber =
    selectedEpisode?.seasonNumber;

  const currentEpisodeKey = currentEpisode
    ? getEpisodeKey(
        currentSeasonNumber,
        currentEpisode
      )
    : null;

  // =========================================
  // STREAM URL
  // =========================================

  // Compatibilidade com o endpoint atual.
  // Futuramente, substituir por uma rota
  // protegida por assinatura no backend.

  const streamUrl = useMemo(() => {
    if (
      !playbackRequested ||
      !currentEpisode?.videoUrl
    ) {
      return "";
    }

    const baseUrl =
      import.meta.env.VITE_API_URL?.replace(
        /\/$/,
        ""
      );

    if (!baseUrl) return "";

    return (
      `${baseUrl}/stream?page=` +
      encodeURIComponent(
        currentEpisode.videoUrl
      )
    );
  }, [
    playbackRequested,
    currentEpisode?.videoUrl,
  ]);

  // =========================================
  // PLAYBACK EFFECT
  // =========================================

  useEffect(() => {
    if (
      !playbackRequested ||
      !streamUrl ||
      !videoRef.current
    ) {
      return;
    }

    const video = videoRef.current;

    video.load();

    const promise = video.play();

    if (promise?.catch) {
      promise.catch((err) => {
        if (err.name !== "AbortError") {
          console.error(
            "Reprodução não iniciada:",
            err
          );
        }
      });
    }
  }, [
    playbackRequested,
    streamUrl,
    currentEpisodeKey,
  ]);

  // =========================================
  // TOGGLE SEASON
  // =========================================

  const toggleSeason = useCallback(
    (seasonNumber) => {
      setExpandedSeasons((prev) => ({
        ...prev,
        [seasonNumber]:
          !prev[seasonNumber],
      }));
    },
    []
  );

  // =========================================
  // REGISTER EPISODE VIEW
  // =========================================

  const registerEpisodeView = useCallback(
    async (seasonNumber, episode) => {
      if (!series?._id) return;

      const key = getEpisodeKey(
        seasonNumber,
        episode
      );

      // Evita registrar novamente o mesmo
      // episódio nesta montagem da página.
      if (viewRequestRef.current.has(key)) {
        return;
      }

      viewRequestRef.current.add(key);

      try {
        const result = await addEpisodeView(
          series._id,
          seasonNumber,
          episode.episodeNumber
        );

        // Atualiza os contadores localmente.
        setSeries((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            views:
              result?.totalSeriesViews ??
              prev.views,
            seasons: prev.seasons.map(
              (season) => {
                if (
                  season.seasonNumber !==
                  seasonNumber
                ) {
                  return season;
                }

                return {
                  ...season,
                  episodes: season.episodes.map(
                    (item) => {
                      if (
                        item.episodeNumber !==
                        episode.episodeNumber
                      ) {
                        return item;
                      }

                      return {
                        ...item,
                        views:
                          result?.episodeViews ??
                          item.views,
                      };
                    }
                  ),
                };
              }
            ),
          };
        });
      } catch (err) {
        viewRequestRef.current.delete(key);

        console.error(
          "Erro ao registrar visualização:",
          err
        );
      }
    },
    [series?._id]
  );

  // =========================================
  // PLAY EPISODE
  // =========================================

  const handlePlayEpisode = useCallback(
    async (season, episode) => {
      if (!episode?.videoUrl) {
        setPlaybackError(
          "Este episódio ainda não possui uma fonte de reprodução."
        );
        return;
      }

      setPlaybackError("");

      setSelectedEpisode({
        seasonNumber: season.seasonNumber,
        episode,
      });

      setExpandedSeasons((prev) => ({
        ...prev,
        [season.seasonNumber]: true,
      }));

      setPlaybackRequested(true);

      // Registra visualização sem bloquear
      // a seleção do episódio.
      void registerEpisodeView(
        season.seasonNumber,
        episode
      );

      requestAnimationFrame(() => {
        playerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [registerEpisodeView]
  );

  // =========================================
  // WATCH NOW
  // =========================================

  const handleWatchNow = useCallback(() => {
    if (!series) return;

    const first = findFirstEpisode(series);

    if (!first) return;

    const season = series.seasons.find(
      (item) =>
        item.seasonNumber ===
        first.seasonNumber
    );

    if (!season) return;

    handlePlayEpisode(
      season,
      first.episode
    );
  }, [series, handlePlayEpisode]);

  // =========================================
  // TOGGLE FAVORITE
  // =========================================

  const handleToggleFavorite = async () => {
    if (favoriteLoading || !series?._id) {
      return;
    }

    try {
      setFavoriteLoading(true);

      const response = await api.patch(
        `/series/${series._id}/favorite`
      );

      setFavorite(
        Boolean(response.data.favorite)
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar favorito:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Faça login para adicionar séries à sua lista."
        );
      } else {
        setError(
          "Não foi possível atualizar sua lista."
        );
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="series-details-loading">
        <div className="series-loader" />
      </div>
    );
  }

  // =========================================
  // NOT FOUND
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

      {/* =====================================
          BACKDROP
      ===================================== */}

      <div className="series-details-backdrop">
        <img
          src={
            series.backdrop ||
            series.poster
          }
          alt={series.title}
        />
      </div>

      <div className="series-details-overlay" />

      {/* =====================================
          TOPBAR
      ===================================== */}

      <div className="series-details-topbar">
        <Link
          to="/series"
          className="series-back-button"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="series-hero">

        <div className="series-hero-poster">
          <img
            src={series.poster}
            alt={series.title}
          />
        </div>

        <div className="series-hero-content">

          <h1>{series.title}</h1>

          <div className="series-meta">

            <span>
              <Tv size={16} />
              {series.year}
            </span>

            <span>
              <Layers3 size={16} />
              {seasons.length} temporadas
            </span>

            <span>
              <Play size={16} />
              {totalEpisodes} episódios
            </span>

            <span>
              <Eye size={16} />
              {formatViews(series.views)}
            </span>

          </div>

          <p className="series-overview">
            {series.overview}
          </p>

          <div className="series-genres">
            {series.genres?.map(
              (genre, index) => (
                <span key={index}>
                  {genre}
                </span>
              )
            )}
          </div>

          {/* ACTIONS */}

          <div className="series-hero-actions">

            {totalEpisodes > 0 && (
              <button
                type="button"
                className="watch-series-button"
                onClick={handleWatchNow}
              >
                <Play size={18} />
                Assistir Agora
              </button>
            )}

            <button
              type="button"
              className={`series-favorite-button ${
                favorite ? "active" : ""
              }`}
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              aria-pressed={favorite}
            >
              {favoriteLoading ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : favorite ? (
                <Check size={18} />
              ) : (
                <Heart size={18} />
              )}

              {favorite
                ? "Na Minha Lista"
                : "Minha Lista"}
            </button>

          </div>

          {error && (
            <p
              className="series-action-error"
              role="alert"
            >
              <AlertCircle size={16} />
              {error}
            </p>
          )}

        </div>
      </section>

      {/* =====================================
          PLAYER
      ===================================== */}

      {currentEpisode && (
        <section
          ref={playerRef}
          className="series-player-section"
        >

          <div className="series-player-header">

            <div>
              <span>
                {currentSeasonNumber === 0
                  ? "Especiais"
                  : `Temporada ${currentSeasonNumber}`}
              </span>

              <h2>
                Episódio{" "}
                {currentEpisode.episodeNumber}
                : {currentEpisode.title}
              </h2>
            </div>

            {currentEpisode.duration > 0 && (
              <div className="episode-duration">
                <Clock3 size={16} />
                {currentEpisode.duration} min
              </div>
            )}

          </div>

          <div className="series-video-wrapper">

            {playbackRequested && streamUrl ? (
              <video
                ref={videoRef}
                key={currentEpisodeKey}
                controls
                playsInline
                preload="metadata"
                className="series-video"
                onError={() => {
                  setPlaybackError(
                    "Não foi possível carregar o vídeo."
                  );
                }}
              >
                <source
                  src={streamUrl}
                  type="video/mp4"
                />

                Seu navegador não suporta vídeo.
              </video>
            ) : (
              <div className="series-player-placeholder">

                {currentEpisode.still && (
                  <img
                    src={currentEpisode.still}
                    alt={currentEpisode.title}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    const season = seasons.find(
                      (item) =>
                        item.seasonNumber ===
                        currentSeasonNumber
                    );

                    if (season) {
                      handlePlayEpisode(
                        season,
                        currentEpisode
                      );
                    }
                  }}
                >
                  <Play size={28} />
                  Reproduzir episódio
                </button>

              </div>
            )}

          </div>

          {playbackError && (
            <p
              className="series-playback-error"
              role="alert"
            >
              <AlertCircle size={16} />
              {playbackError}
            </p>
          )}

          {currentEpisode.overview && (
            <p className="episode-overview">
              {currentEpisode.overview}
            </p>
          )}

        </section>
      )}

      {/* =====================================
          SEASONS
      ===================================== */}

      <section className="series-seasons-section">

        <div className="section-title">
          <h2>Temporadas</h2>
        </div>

        {seasons.length === 0 ? (
          <p className="series-empty-message">
            Nenhuma temporada cadastrada.
          </p>
        ) : (
          <div className="season-list">

            {seasons.map((season) => {
              const isOpen = Boolean(
                expandedSeasons[
                  season.seasonNumber
                ]
              );

              return (
                <div
                  key={
                    season._id ||
                    season.seasonNumber
                  }
                  className="season-block"
                >

                  {/* SEASON HEADER */}

                  <button
                    type="button"
                    className="season-toggle"
                    onClick={() =>
                      toggleSeason(
                        season.seasonNumber
                      )
                    }
                    aria-expanded={isOpen}
                  >
                    <div>
                      <h3>
                        {getSeasonTitle(season)}
                      </h3>

                      <span>
                        {season.episodes.length}{" "}
                        episódios
                      </span>
                    </div>

                    {isOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {/* EPISODES */}

                  {isOpen && (
                    <div className="episode-list">

                      {season.episodes.length === 0 ? (
                        <p className="series-empty-message">
                          Nenhum episódio nesta
                          temporada.
                        </p>
                      ) : (
                        season.episodes.map(
                          (episode) => {
                            const isActive =
                              currentSeasonNumber ===
                                season.seasonNumber &&
                              currentEpisode?.episodeNumber ===
                                episode.episodeNumber;

                            return (
                              <button
                                type="button"
                                key={getEpisodeKey(
                                  season.seasonNumber,
                                  episode
                                )}
                                className={`episode-item ${
                                  isActive
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  handlePlayEpisode(
                                    season,
                                    episode
                                  )
                                }
                              >

                                <div className="episode-thumb">
                                  {episode.still ? (
                                    <img
                                      src={episode.still}
                                      alt={episode.title}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="episode-no-thumb">
                                      <Play size={26} />
                                    </div>
                                  )}
                                </div>

                                <div className="episode-info">

                                  <div className="episode-title-row">

                                    <h4>
                                      E{episode.episodeNumber}
                                      {" · "}
                                      {episode.title}
                                    </h4>

                                    <span>
                                      <Eye size={14} />
                                      {formatViews(
                                        episode.views
                                      )}
                                    </span>

                                  </div>

                                  {episode.overview && (
                                    <p>
                                      {episode.overview}
                                    </p>
                                  )}

                                  {episode.duration > 0 && (
                                    <span className="episode-duration">
                                      <Clock3 size={14} />
                                      {episode.duration} min
                                    </span>
                                  )}

                                </div>

                              </button>
                            );
                          }
                        )
                      )}

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}
