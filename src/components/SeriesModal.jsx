// components/series/SeriesModal/index.jsx

import "./SeriesModal.css";

import {
  useEffect,
  useState,
} from "react";

import {
  X,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

import SeriesSearch from "./SeriesSearch";

/* =========================================
   EMPTY EPISODE
========================================= */

const EMPTY_EPISODE = {
  episodeNumber: 1,
  title: "",
  overview: "",
  duration: "",
  still: "",
  videoUrl: "",
};

/* =========================================
   EMPTY SEASON
========================================= */

const EMPTY_SEASON = {
  seasonNumber: 1,
  title: "",
  episodes: [],
};

/* =========================================
   COMPONENT
========================================= */

export default function SeriesModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  loading = false,
}) {
  const [genreInput, setGenreInput] =
    useState("");

  /* =========================================
     ESC CLOSE
  ========================================= */

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleEsc
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEsc
      );
  }, [onClose]);

  /* =========================================
     TMDB SELECT
  ========================================= */

  function handleTMDBSelect(
    series
  ) {
    setForm((prev) => ({
      ...prev,

      tmdbId:
        series.tmdbId,

      title:
        series.title,

      overview:
        series.overview,

      poster:
        series.poster,

      backdrop:
        series.backdrop,

      year:
        series.year,
    }));
  }

  /* =========================================
     INPUT CHANGE
  ========================================= */

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* =========================================
     GENRES
  ========================================= */

  function addGenre() {
    if (!genreInput.trim()) return;

    if (
      form.genres?.includes(
        genreInput
      )
    ) {
      return;
    }

    setForm((prev) => ({
      ...prev,

      genres: [
        ...(prev.genres ||
          []),

        genreInput,
      ],
    }));

    setGenreInput("");
  }

  function removeGenre(index) {
    setForm((prev) => ({
      ...prev,

      genres:
        prev.genres.filter(
          (_, i) => i !== index
        ),
    }));
  }

  /* =========================================
     SEASONS
  ========================================= */

  function addSeason() {
    setForm((prev) => ({
      ...prev,

      seasons: [
        ...(prev.seasons ||
          []),

        {
          ...EMPTY_SEASON,

          seasonNumber:
            (prev.seasons
              ?.length || 0) + 1,
        },
      ],
    }));
  }

  function removeSeason(index) {
    setForm((prev) => ({
      ...prev,

      seasons:
        prev.seasons.filter(
          (_, i) => i !== index
        ),
    }));
  }

  function updateSeason(
    seasonIndex,
    field,
    value
  ) {
    const updated =
      [...form.seasons];

    updated[seasonIndex][field] =
      value;

    setForm((prev) => ({
      ...prev,
      seasons: updated,
    }));
  }

  /* =========================================
     EPISODES
  ========================================= */

  function addEpisode(
    seasonIndex
  ) {
    const updated =
      [...form.seasons];

    updated[
      seasonIndex
    ].episodes.push({
      ...EMPTY_EPISODE,

      episodeNumber:
        updated[seasonIndex]
          .episodes.length + 1,
    });

    setForm((prev) => ({
      ...prev,
      seasons: updated,
    }));
  }

  function removeEpisode(
    seasonIndex,
    episodeIndex
  ) {
    const updated =
      [...form.seasons];

    updated[
      seasonIndex
    ].episodes =
      updated[
        seasonIndex
      ].episodes.filter(
        (_, i) =>
          i !== episodeIndex
      );

    setForm((prev) => ({
      ...prev,
      seasons: updated,
    }));
  }

  function updateEpisode(
    seasonIndex,
    episodeIndex,
    field,
    value
  ) {
    const updated =
      [...form.seasons];

    updated[
      seasonIndex
    ].episodes[
      episodeIndex
    ][field] = value;

    setForm((prev) => ({
      ...prev,
      seasons: updated,
    }));
  }

  /* =========================================
     SAVE
  ========================================= */

  function handleSave() {
    const totalSeasons =
      form.seasons?.length || 0;

    const totalEpisodes =
      form.seasons?.reduce(
        (acc, season) =>
          acc +
          season.episodes.length,
        0
      );

    onSave({
      ...form,

      totalSeasons,

      totalEpisodes,
    });
  }

  /* =========================================
     CLOSED
  ========================================= */

  if (!open) return null;

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="series-modal-overlay">
      <div className="series-modal">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="series-modal-header">

          <h2>
            {form._id
              ? "Editar Série"
              : "Nova Série"}
          </h2>

          <button
            className="series-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>

        {/* =====================================
            CONTENT
        ===================================== */}

        <div className="series-modal-content">

          {/* =============================
              SEARCH
          ============================= */}

          <SeriesSearch
            onSelect={
              handleTMDBSelect
            }
          />

          {/* =============================
              PREVIEW
          ============================= */}

          {form.poster && (
            <div className="series-preview">

              <img
                src={form.poster}
                alt={form.title}
              />

              <div className="series-preview-info">

                <h3>
                  {form.title}
                </h3>

                <span>
                  {form.year}
                </span>

                <p>
                  {form.overview}
                </p>

              </div>

            </div>
          )}

          {/* =============================
              FORM
          ============================= */}

          <div className="series-form-grid">

            <input
              type="text"
              name="title"
              placeholder="Título"
              value={form.title}
              onChange={
                handleChange
              }
            />

            <input
              type="text"
              name="year"
              placeholder="Ano"
              value={form.year}
              onChange={
                handleChange
              }
            />

            <input
              type="text"
              name="poster"
              placeholder="Poster URL"
              value={form.poster}
              onChange={
                handleChange
              }
            />

            <input
              type="text"
              name="backdrop"
              placeholder="Backdrop URL"
              value={
                form.backdrop
              }
              onChange={
                handleChange
              }
            />

          </div>

          <textarea
            name="overview"
            placeholder="Descrição"
            value={form.overview}
            onChange={
              handleChange
            }
          />

          {/* =============================
              GENRES
          ============================= */}

          <div className="series-genres">

            <div className="series-genres-input">

              <input
                type="text"
                placeholder="Adicionar gênero"
                value={
                  genreInput
                }
                onChange={(e) =>
                  setGenreInput(
                    e.target.value
                  )
                }
              />

              <button
                onClick={addGenre}
              >
                <Plus size={16} />
              </button>

            </div>

            <div className="series-genres-list">

              {form.genres?.map(
                (
                  genre,
                  index
                ) => (
                  <span
                    key={index}
                    className="genre-chip"
                  >
                    {genre}

                    <button
                      onClick={() =>
                        removeGenre(
                          index
                        )
                      }
                    >
                      <X
                        size={12}
                      />
                    </button>
                  </span>
                )
              )}

            </div>

          </div>

          {/* =============================
              SEASONS
          ============================= */}

          <div className="series-seasons">

            <div className="series-section-header">

              <h3>
                Temporadas
              </h3>

              <button
                onClick={
                  addSeason
                }
              >
                <Plus size={16} />
                Adicionar
              </button>

            </div>

            {form.seasons?.map(
              (
                season,
                seasonIndex
              ) => (
                <div
                  key={
                    seasonIndex
                  }
                  className="season-card"
                >

                  {/* ===================
                      HEADER
                  =================== */}

                  <div className="season-header">

                    <h4>
                      Temporada{" "}
                      {
                        season.seasonNumber
                      }
                    </h4>

                    <button
                      className="danger-button"
                      onClick={() =>
                        removeSeason(
                          seasonIndex
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                  <input
                    type="text"
                    placeholder="Título da temporada"
                    value={
                      season.title
                    }
                    onChange={(e) =>
                      updateSeason(
                        seasonIndex,
                        "title",
                        e.target
                          .value
                      )
                    }
                  />

                  {/* ===================
                      EPISODES
                  =================== */}

                  <div className="episodes-list">

                    <div className="series-section-header">

                      <h5>
                        Episódios
                      </h5>

                      <button
                        onClick={() =>
                          addEpisode(
                            seasonIndex
                          )
                        }
                      >
                        <Plus
                          size={14}
                        />
                        Episódio
                      </button>

                    </div>

                    {season.episodes.map(
                      (
                        episode,
                        episodeIndex
                      ) => (
                        <div
                          key={
                            episodeIndex
                          }
                          className="episode-card"
                        >

                          <div className="episode-header">

                            <strong>
                              Episódio{" "}
                              {
                                episode.episodeNumber
                              }
                            </strong>

                            <button
                              className="danger-button"
                              onClick={() =>
                                removeEpisode(
                                  seasonIndex,
                                  episodeIndex
                                )
                              }
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />
                            </button>

                          </div>

                          <input
                            type="text"
                            placeholder="Título"
                            value={
                              episode.title
                            }
                            onChange={(
                              e
                            ) =>
                              updateEpisode(
                                seasonIndex,
                                episodeIndex,
                                "title",
                                e.target
                                  .value
                              )
                            }
                          />

                          <textarea
                            placeholder="Descrição"
                            value={
                              episode.overview
                            }
                            onChange={(
                              e
                            ) =>
                              updateEpisode(
                                seasonIndex,
                                episodeIndex,
                                "overview",
                                e.target
                                  .value
                              )
                            }
                          />

                          <input
                            type="text"
                            placeholder="Still URL"
                            value={
                              episode.still
                            }
                            onChange={(
                              e
                            ) =>
                              updateEpisode(
                                seasonIndex,
                                episodeIndex,
                                "still",
                                e.target
                                  .value
                              )
                            }
                          />

                          <input
                            type="text"
                            placeholder="Vídeo URL"
                            value={
                              episode.videoUrl
                            }
                            onChange={(
                              e
                            ) =>
                              updateEpisode(
                                seasonIndex,
                                episodeIndex,
                                "videoUrl",
                                e.target
                                  .value
                              )
                            }
                          />

                          <input
                            type="number"
                            placeholder="Duração"
                            value={
                              episode.duration
                            }
                            onChange={(
                              e
                            ) =>
                              updateEpisode(
                                seasonIndex,
                                episodeIndex,
                                "duration",
                                e.target
                                  .value
                              )
                            }
                          />

                        </div>
                      )
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="series-modal-footer">

          <button
            className="series-cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="series-save-button"
            onClick={
              handleSave
            }
            disabled={loading}
          >
            <Save size={18} />

            {loading
              ? "Salvando..."
              : "Salvar Série"}
          </button>

        </div>

      </div>
    </div>
  );
}