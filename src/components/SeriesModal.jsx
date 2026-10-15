
import { useEffect, useState } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Film,
  Settings2,
  Layers3,
  Eye,
  EyeOff,
} from "lucide-react";

import SeriesSearch from "./SeriesSearch";
import "./SeriesModal.css";

// =========================================
// HELPERS
// =========================================

const createEpisode = (episodeNumber) => ({
  episodeNumber,
  title: "",
  overview: "",
  duration: "",
  still: "",
  videoUrl: "",
  sources: [],
});

const createSeason = (seasonNumber) => ({
  seasonNumber,
  title:
    seasonNumber === 0
      ? "Especiais"
      : `Temporada ${seasonNumber}`,
  episodes: [],
});

const getNextNumber = (items, field) => {
  const numbers = items.map(
    (item) => Number(item[field]) || 0
  );

  return Math.max(0, ...numbers) + 1;
};

const getEpisodeKey = (season, episode) =>
  `${season.seasonNumber}-${episode.episodeNumber}`;

const formatEpisodeCount = (count) =>
  `${count} ${count === 1 ? "episódio" : "episódios"}`;

const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.message ||
  "Não foi possível salvar as alterações.";

// =========================================
// COMPONENT
// =========================================

export default function SeriesModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  loading = false,
}) {
  const [genreInput, setGenreInput] = useState("");
  const [error, setError] = useState("");

  const [showGeneral, setShowGeneral] = useState(true);

  const [expandedSeasons, setExpandedSeasons] = useState([]);
  const [visibleEpisodeLists, setVisibleEpisodeLists] = useState([]);
  const [expandedEpisodes, setExpandedEpisodes] = useState([]);

  const seasons = Array.isArray(form?.seasons)
    ? form.seasons
    : [];

  const genres = Array.isArray(form?.genres)
    ? form.genres
    : [];

  const totalEpisodes = seasons.reduce(
    (total, season) =>
      total + (season.episodes?.length || 0),
    0
  );

  // =========================================
  // EFFECTS
  // =========================================

  useEffect(() => {
    if (!open) return;

    setError("");
    setGenreInput("");

    setShowGeneral(!form?._id);
    setExpandedSeasons([]);
    setVisibleEpisodeLists([]);
    setExpandedEpisodes([]);
  }, [open, form?._id]);

  useEffect(() => {
    if (!open || loading) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, loading, onClose]);

  // =========================================
  // COLLAPSE HELPERS
  // =========================================

  const toggleItem = (setter, id) => {
    setter((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleSeason = (seasonNumber) => {
    toggleItem(
      setExpandedSeasons,
      seasonNumber
    );
  };

  const toggleEpisodeList = (seasonNumber) => {
    toggleItem(
      setVisibleEpisodeLists,
      seasonNumber
    );
  };

  const toggleEpisode = (key) => {
    toggleItem(
      setExpandedEpisodes,
      key
    );
  };

  const expandAll = () => {
    setExpandedSeasons(
      seasons.map(
        (season) => season.seasonNumber
      )
    );

    setVisibleEpisodeLists(
      seasons.map(
        (season) => season.seasonNumber
      )
    );

    setExpandedEpisodes(
      seasons.flatMap((season) =>
        (season.episodes || []).map(
          (episode) =>
            getEpisodeKey(season, episode)
        )
      )
    );
  };

  const collapseAll = () => {
    setExpandedSeasons([]);
    setVisibleEpisodeLists([]);
    setExpandedEpisodes([]);
  };

  // =========================================
  // GENERAL FIELDS
  // =========================================

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleTMDBSelect = (series) => {
    setForm((previous) => ({
      ...previous,
      tmdbId:
        series.tmdbId ?? previous.tmdbId,
      title:
        series.title ?? previous.title,
      overview:
        series.overview ?? previous.overview,
      poster:
        series.poster ?? previous.poster,
      backdrop:
        series.backdrop ?? previous.backdrop,
      year:
        series.year ?? previous.year,
    }));
  };

  // =========================================
  // GENRES
  // =========================================

  const addGenre = () => {
    const genre = genreInput.trim();

    if (!genre) return;

    setForm((previous) => {
      const current = previous.genres || [];

      const exists = current.some(
        (item) =>
          item.toLocaleLowerCase("pt-BR") ===
          genre.toLocaleLowerCase("pt-BR")
      );

      if (exists) return previous;

      return {
        ...previous,
        genres: [...current, genre],
      };
    });

    setGenreInput("");
  };

  const removeGenre = (index) => {
    setForm((previous) => ({
      ...previous,
      genres: (previous.genres || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =========================================
  // SEASONS
  // =========================================

  const addSeason = () => {
    const seasonNumber = getNextNumber(
      seasons,
      "seasonNumber"
    );

    setForm((previous) => ({
      ...previous,
      seasons: [
        ...(previous.seasons || []),
        createSeason(seasonNumber),
      ],
    }));

    setExpandedSeasons((previous) => [
      ...new Set([...previous, seasonNumber]),
    ]);

    setVisibleEpisodeLists((previous) => [
      ...new Set([...previous, seasonNumber]),
    ]);
  };

  const updateSeason = (
    seasonIndex,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      seasons: (previous.seasons || []).map(
        (season, index) =>
          index === seasonIndex
            ? {
                ...season,
                [field]: value,
              }
            : season
      ),
    }));
  };

  const removeSeason = (seasonIndex) => {
    const season = seasons[seasonIndex];

    if (!season) return;

    const episodeCount =
      season.episodes?.length || 0;

    if (
      !window.confirm(
        episodeCount > 0
          ? `Excluir a temporada ${season.seasonNumber} e seus ${episodeCount} episódios?`
          : `Excluir a temporada ${season.seasonNumber}?`
      )
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      seasons: (previous.seasons || []).filter(
        (_, index) => index !== seasonIndex
      ),
    }));

    setExpandedSeasons((previous) =>
      previous.filter(
        (number) =>
          number !== season.seasonNumber
      )
    );

    setVisibleEpisodeLists((previous) =>
      previous.filter(
        (number) =>
          number !== season.seasonNumber
      )
    );

    setExpandedEpisodes((previous) =>
      previous.filter(
        (key) =>
          !key.startsWith(
            `${season.seasonNumber}-`
          )
      )
    );
  };

  // =========================================
  // EPISODES
  // =========================================

  const addEpisode = (seasonIndex) => {
    const season = seasons[seasonIndex];

    if (!season) return;

    const episodeNumber = getNextNumber(
      season.episodes || [],
      "episodeNumber"
    );

    const key = `${season.seasonNumber}-${episodeNumber}`;

    setForm((previous) => ({
      ...previous,
      seasons: (previous.seasons || []).map(
        (item, index) => {
          if (index !== seasonIndex) {
            return item;
          }

          return {
            ...item,
            episodes: [
              ...(item.episodes || []),
              createEpisode(episodeNumber),
            ],
          };
        }
      ),
    }));

    setExpandedSeasons((previous) => [
      ...new Set([
        ...previous,
        season.seasonNumber,
      ]),
    ]);

    setVisibleEpisodeLists((previous) => [
      ...new Set([
        ...previous,
        season.seasonNumber,
      ]),
    ]);

    setExpandedEpisodes((previous) => [
      ...new Set([...previous, key]),
    ]);
  };

  const updateEpisode = (
    seasonIndex,
    episodeIndex,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      seasons: (previous.seasons || []).map(
        (season, sIndex) => {
          if (sIndex !== seasonIndex) {
            return season;
          }

          return {
            ...season,
            episodes: (
              season.episodes || []
            ).map((episode, eIndex) =>
              eIndex === episodeIndex
                ? {
                    ...episode,
                    [field]: value,
                  }
                : episode
            ),
          };
        }
      ),
    }));
  };

  const removeEpisode = (
    seasonIndex,
    episodeIndex
  ) => {
    const season = seasons[seasonIndex];
    const episode =
      season?.episodes?.[episodeIndex];

    if (!episode) return;

    if (
      !window.confirm(
        `Excluir o episódio ${episode.episodeNumber}?`
      )
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      seasons: (previous.seasons || []).map(
        (item, index) => {
          if (index !== seasonIndex) {
            return item;
          }

          return {
            ...item,
            episodes: (
              item.episodes || []
            ).filter(
              (_, index) =>
                index !== episodeIndex
            ),
          };
        }
      ),
    }));

    const key = getEpisodeKey(
      season,
      episode
    );

    setExpandedEpisodes((previous) =>
      previous.filter(
        (item) => item !== key
      )
    );
  };

  // =========================================
  // SAVE
  // =========================================

  const handleSave = async () => {
    if (loading) return;

    setError("");

    if (!form.title?.trim()) {
      setError("Informe o título da série.");
      setShowGeneral(true);
      return;
    }

    const seasonNumbers = new Set();

    for (const season of seasons) {
      const seasonNumber = Number(
        season.seasonNumber
      );

      if (
        !Number.isInteger(seasonNumber) ||
        seasonNumber < 0 ||
        seasonNumbers.has(seasonNumber)
      ) {
        setError(
          "Existem temporadas com números inválidos ou duplicados."
        );
        return;
      }

      seasonNumbers.add(seasonNumber);

      const episodeNumbers = new Set();

      for (
        const episode of season.episodes || []
      ) {
        const episodeNumber = Number(
          episode.episodeNumber
        );

        if (
          !Number.isInteger(episodeNumber) ||
          episodeNumber < 0 ||
          episodeNumbers.has(episodeNumber)
        ) {
          setError(
            `Numeração inválida na temporada ${seasonNumber}.`
          );
          return;
        }

        if (!episode.title?.trim()) {
          setError(
            `Informe o título do episódio ${episodeNumber} da temporada ${seasonNumber}.`
          );

          setExpandedSeasons((previous) => [
            ...new Set([
              ...previous,
              seasonNumber,
            ]),
          ]);

          setVisibleEpisodeLists(
            (previous) => [
              ...new Set([
                ...previous,
                seasonNumber,
              ]),
            ]
          );

          setExpandedEpisodes((previous) => [
            ...new Set([
              ...previous,
              `${seasonNumber}-${episodeNumber}`,
            ]),
          ]);

          return;
        }

        episodeNumbers.add(episodeNumber);
      }
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      published: form.published === true,
      seasons: seasons.map((season) => ({
        ...season,
        seasonNumber: Number(
          season.seasonNumber
        ),
        episodes: (
          season.episodes || []
        ).map((episode) => ({
          ...episode,
          episodeNumber: Number(
            episode.episodeNumber
          ),
          duration:
            episode.duration === "" ||
            episode.duration == null
              ? 0
              : Number(episode.duration),
        })),
      })),
    };

    try {
      await onSave(payload);
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  if (!open || !form) return null;

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="series-modal-overlay">
      <div
        className="series-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-modal-title"
      >
        {/* HEADER */}

        <div className="series-modal-header">
          <div className="series-modal-heading">
            <span className="series-modal-eyebrow">
              MIQFLIX / ADMINISTRAÇÃO
            </span>

            <h2 id="series-modal-title">
              {form._id
                ? "Editar série"
                : "Nova série"}
            </h2>

            <p>
              {seasons.length} temporadas •{" "}
              {formatEpisodeCount(totalEpisodes)}
            </p>
          </div>

          <button
            type="button"
            className="series-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}

        <div className="series-modal-content">
          {/* GENERAL SECTION */}

          <section className="series-general-section">
            <button
              type="button"
              className="series-collapse-header"
              onClick={() =>
                setShowGeneral((previous) => !previous)
              }
              aria-expanded={showGeneral}
            >
              <div className="series-collapse-heading">
                <Settings2 size={20} />

                <div>
                  <strong>
                    Informações gerais
                  </strong>

                  <small>
                    Título, imagens, gêneros e publicação
                  </small>
                </div>
              </div>

              {showGeneral ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>

            {showGeneral && (
              <div className="series-general-content">
                <SeriesSearch
                  onSelect={handleTMDBSelect}
                />

                {form.poster && (
                  <div className="series-preview">
                    <img
                      src={form.poster}
                      alt={form.title || "Pôster"}
                    />

                    <div className="series-preview-info">
                      <h3>
                        {form.title || "Sem título"}
                      </h3>

                      <span>
                        {form.year || "Ano não informado"}
                      </span>

                      <p>
                        {form.overview ||
                          "Sem descrição."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="series-form-grid">
                  <label className="series-field">
                    <span>Título</span>
                    <input
                      value={form.title || ""}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value
                        )
                      }
                      placeholder="Título da série"
                    />
                  </label>

                  <label className="series-field">
                    <span>Ano</span>
                    <input
                      value={form.year || ""}
                      onChange={(event) =>
                        updateField(
                          "year",
                          event.target.value
                        )
                      }
                      placeholder="Ano de lançamento"
                    />
                  </label>

                  <label className="series-field">
                    <span>URL do pôster</span>
                    <input
                      value={form.poster || ""}
                      onChange={(event) =>
                        updateField(
                          "poster",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label className="series-field">
                    <span>URL do backdrop</span>
                    <input
                      value={form.backdrop || ""}
                      onChange={(event) =>
                        updateField(
                          "backdrop",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                    />
                  </label>
                </div>

                <label className="series-field">
                  <span>Descrição</span>

                  <textarea
                    value={form.overview || ""}
                    onChange={(event) =>
                      updateField(
                        "overview",
                        event.target.value
                      )
                    }
                    placeholder="Descrição da série"
                  />
                </label>

                <div className="series-form-grid">
                  <label className="series-field">
                    <span>Status</span>

                    <select
                      value={
                        form.status || "ongoing"
                      }
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value
                        )
                      }
                    >
                      <option value="ongoing">
                        Em andamento
                      </option>
                      <option value="completed">
                        Concluída
                      </option>
                      <option value="hiatus">
                        Em pausa
                      </option>
                      <option value="cancelled">
                        Cancelada
                      </option>
                    </select>
                  </label>

                  <label className="series-published-control">
                    <input
                      type="checkbox"
                      checked={
                        form.published === true
                      }
                      onChange={(event) =>
                        updateField(
                          "published",
                          event.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        Publicar no catálogo
                      </strong>

                      <small>
                        Disponibilizar para assinantes
                      </small>
                    </div>
                  </label>
                </div>

                {/* GENRES */}

                <div className="series-genres">
                  <div className="series-section-header">
                    <h3>Gêneros</h3>
                  </div>

                  <div className="series-genres-input">
                    <input
                      value={genreInput}
                      onChange={(event) =>
                        setGenreInput(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          addGenre();
                        }
                      }}
                      placeholder="Adicionar gênero"
                    />

                    <button
                      type="button"
                      onClick={addGenre}
                      aria-label="Adicionar gênero"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="series-genres-list">
                    {genres.map(
                      (genre, index) => (
                        <span
                          className="genre-chip"
                          key={`${genre}-${index}`}
                        >
                          {genre}

                          <button
                            type="button"
                            onClick={() =>
                              removeGenre(index)
                            }
                            aria-label={`Remover ${genre}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SEASONS SECTION */}

          <section className="series-seasons-section">
            <div className="series-section-header series-seasons-toolbar">
              <div className="series-toolbar-title">
                <Layers3 size={21} />

                <div>
                  <h3>Temporadas</h3>
                  <p>
                    {seasons.length} cadastradas
                  </p>
                </div>
              </div>

              <div className="series-toolbar-actions">
                <button
                  type="button"
                  className="series-secondary-button"
                  onClick={expandAll}
                >
                  <Eye size={16} />
                  Expandir tudo
                </button>

                <button
                  type="button"
                  className="series-secondary-button"
                  onClick={collapseAll}
                >
                  <EyeOff size={16} />
                  Recolher tudo
                </button>

                <button
                  type="button"
                  className="series-primary-button"
                  onClick={addSeason}
                >
                  <Plus size={16} />
                  Temporada
                </button>
              </div>
            </div>

            {seasons.length === 0 && (
              <div className="series-empty-state">
                <Clapperboard size={32} />

                <strong>
                  Nenhuma temporada cadastrada
                </strong>

                <p>
                  Adicione uma temporada para
                  começar a organizar os episódios.
                </p>
              </div>
            )}

            <div className="series-seasons">
              {seasons.map(
                (season, seasonIndex) => {
                  const seasonNumber =
                    season.seasonNumber;

                  const seasonExpanded =
                    expandedSeasons.includes(
                      seasonNumber
                    );

                  const episodesVisible =
                    visibleEpisodeLists.includes(
                      seasonNumber
                    );

                  const episodes =
                    season.episodes || [];

                  return (
                    <div
                      className="season-card"
                      key={
                        season._id ||
                        `season-${seasonNumber}`
                      }
                    >
                      {/* SEASON HEADER */}

                      <div className="season-header">
                        <button
                          type="button"
                          className="season-collapse-trigger"
                          onClick={() =>
                            toggleSeason(
                              seasonNumber
                            )
                          }
                          aria-expanded={
                            seasonExpanded
                          }
                        >
                          {seasonExpanded ? (
                            <ChevronDown
                              size={20}
                            />
                          ) : (
                            <ChevronRight
                              size={20}
                            />
                          )}

                          <Layers3 size={19} />

                          <div className="season-header-info">
                            <strong>
                              {season.title ||
                                `Temporada ${seasonNumber}`}
                            </strong>

                            <small>
                              Temporada{" "}
                              {seasonNumber} •{" "}
                              {formatEpisodeCount(
                                episodes.length
                              )}
                            </small>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            removeSeason(
                              seasonIndex
                            )
                          }
                          aria-label={`Excluir temporada ${seasonNumber}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {/* SEASON CONTENT */}

                      {seasonExpanded && (
                        <div className="season-content">
                          <label className="series-field">
                            <span>
                              Título da temporada
                            </span>

                            <input
                              value={
                                season.title || ""
                              }
                              onChange={(
                                event
                              ) =>
                                updateSeason(
                                  seasonIndex,
                                  "title",
                                  event.target.value
                                )
                              }
                            />
                          </label>

                          <div className="season-episodes-toolbar">
                            <div>
                              <h5>
                                <Film size={17} />
                                Episódios
                              </h5>

                              <small>
                                {formatEpisodeCount(
                                  episodes.length
                                )}
                              </small>
                            </div>

                            <div className="season-episodes-actions">
                              <button
                                type="button"
                                className="series-secondary-button"
                                onClick={() =>
                                  toggleEpisodeList(
                                    seasonNumber
                                  )
                                }
                              >
                                {episodesVisible ? (
                                  <EyeOff
                                    size={15}
                                  />
                                ) : (
                                  <Eye
                                    size={15}
                                  />
                                )}

                                {episodesVisible
                                  ? "Ocultar lista"
                                  : "Mostrar lista"}
                              </button>

                              <button
                                type="button"
                                className="series-primary-button"
                                onClick={() =>
                                  addEpisode(
                                    seasonIndex
                                  )
                                }
                              >
                                <Plus size={15} />
                                Episódio
                              </button>
                            </div>
                          </div>

                          {/* EPISODES LIST */}

                          {episodesVisible && (
                            <div className="episodes-list">
                              {episodes.length ===
                                0 && (
                                <div className="series-empty-episodes">
                                  Nenhum episódio
                                  cadastrado nesta
                                  temporada.
                                </div>
                              )}

                              {episodes.map(
                                (
                                  episode,
                                  episodeIndex
                                ) => {
                                  const episodeKey =
                                    getEpisodeKey(
                                      season,
                                      episode
                                    );

                                  const episodeExpanded =
                                    expandedEpisodes.includes(
                                      episodeKey
                                    );

                                  return (
                                    <div
                                      className="episode-card"
                                      key={
                                        episode._id ||
                                        episodeKey
                                      }
                                    >
                                      {/* EPISODE HEADER */}

                                      <div className="episode-header">
                                        <button
                                          type="button"
                                          className="episode-collapse-trigger"
                                          onClick={() =>
                                            toggleEpisode(
                                              episodeKey
                                            )
                                          }
                                          aria-expanded={
                                            episodeExpanded
                                          }
                                        >
                                          {episodeExpanded ? (
                                            <ChevronDown
                                              size={18}
                                            />
                                          ) : (
                                            <ChevronRight
                                              size={18}
                                            />
                                          )}

                                          <div className="episode-number-badge">
                                            EP{" "}
                                            {
                                              episode.episodeNumber
                                            }
                                          </div>

                                          <div className="episode-header-info">
                                            <strong>
                                              {episode.title ||
                                                "Episódio sem título"}
                                            </strong>

                                            <small>
                                              {episode.duration
                                                ? `${episode.duration} min`
                                                : "Duração não informada"}
                                            </small>
                                          </div>
                                        </button>

                                        <button
                                          type="button"
                                          className="danger-button"
                                          onClick={() =>
                                            removeEpisode(
                                              seasonIndex,
                                              episodeIndex
                                            )
                                          }
                                          aria-label={`Excluir episódio ${episode.episodeNumber}`}
                                        >
                                          <Trash2
                                            size={16}
                                          />
                                        </button>
                                      </div>

                                      {/* EPISODE FORM */}

                                      {episodeExpanded && (
                                        <div className="episode-content">
                                          <label className="series-field">
                                            <span>
                                              Título
                                            </span>

                                            <input
                                              value={
                                                episode.title ||
                                                ""
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateEpisode(
                                                  seasonIndex,
                                                  episodeIndex,
                                                  "title",
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </label>

                                          <label className="series-field">
                                            <span>
                                              Descrição
                                            </span>

                                            <textarea
                                              value={
                                                episode.overview ||
                                                ""
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateEpisode(
                                                  seasonIndex,
                                                  episodeIndex,
                                                  "overview",
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </label>

                                          <div className="series-form-grid">
                                            <label className="series-field">
                                              <span>
                                                Duração (min)
                                              </span>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  episode.duration ??
                                                  ""
                                                }
                                                onChange={(
                                                  event
                                                ) =>
                                                  updateEpisode(
                                                    seasonIndex,
                                                    episodeIndex,
                                                    "duration",
                                                    event.target.value
                                                  )
                                                }
                                              />
                                            </label>

                                            <label className="series-field">
                                              <span>
                                                Imagem do episódio
                                              </span>

                                              <input
                                                value={
                                                  episode.still ||
                                                  ""
                                                }
                                                onChange={(
                                                  event
                                                ) =>
                                                  updateEpisode(
                                                    seasonIndex,
                                                    episodeIndex,
                                                    "still",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="https://..."
                                              />
                                            </label>
                                          </div>

                                          <label className="series-field">
                                            <span>
                                              URL do vídeo
                                            </span>

                                            <input
                                              value={
                                                episode.videoUrl ||
                                                ""
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateEpisode(
                                                  seasonIndex,
                                                  episodeIndex,
                                                  "videoUrl",
                                                  event.target.value
                                                )
                                              }
                                              placeholder="https://..."
                                            />
                                          </label>

                                          <div className="episode-form-footer">
                                            <button
                                              type="button"
                                              className="series-secondary-button"
                                              onClick={() =>
                                                toggleEpisode(
                                                  episodeKey
                                                )
                                              }
                                            >
                                              <ChevronDown
                                                size={16}
                                              />
                                              Recolher episódio
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}

        <div className="series-modal-footer">
          {error && (
            <p
              className="series-modal-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="series-cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="series-save-button"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={18} />

            {loading
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
