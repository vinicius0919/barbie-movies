
import "./SeriesManager.css";

import { useCallback, useEffect, useState } from "react";
import { Plus, AlertCircle, Loader2 } from "lucide-react";

import {
  getSeries,
  getSeriesById,
  getAdminSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  addSeason,
  updateSeason,
  deleteSeason,
  addEpisode,
  updateEpisode,
  deleteEpisode,
} from "../services/series";

import SeriesCard from "../components/SeriesCard";
import SeriesModal from "../components/SeriesModal";

// =========================================
// INITIAL DATA
// =========================================

const createEmptySeries = () => ({
  title: "",
  overview: "",
  poster: "",
  backdrop: "",
  year: "",
  tmdbId: "",
  genres: [],
  status: "ongoing",
  published: false,
  seasons: [],
});

// =========================================
// HELPERS
// =========================================

const normalizeSeriesForm = (series = {}) => ({
  _id: series._id || undefined,
  title: series.title || "",
  overview: series.overview || "",
  poster: series.poster || "",
  backdrop: series.backdrop || "",
  year: series.year || "",
  tmdbId: series.tmdbId ?? "",
  genres: Array.isArray(series.genres)
    ? [...series.genres]
    : [],
  status: series.status || "ongoing",
  published: series.published === true,
  seasons: Array.isArray(series.seasons)
    ? structuredClone(series.seasons)
    : [],
});

const buildSeriesPayload = (form) => {
  const tmdbId = Number(form.tmdbId);

  return {
    title: String(form.title || "").trim(),
    overview: String(form.overview || "").trim(),
    poster: String(form.poster || "").trim(),
    backdrop: String(form.backdrop || "").trim(),
    year: String(form.year || "").trim(),

    ...(form.tmdbId !== "" &&
    form.tmdbId != null &&
    Number.isInteger(tmdbId) &&
    tmdbId > 0
      ? { tmdbId }
      : {}),

    genres: Array.isArray(form.genres)
      ? [
          ...new Set(
            form.genres
              .map((genre) => String(genre).trim())
              .filter(Boolean)
          ),
        ]
      : [],

    status: form.status || "ongoing",
    published: form.published === true,
  };
};

const normalizeEpisodePayload = (episode) => ({
  title: String(episode.title || "").trim(),
  overview: episode.overview || "",
  duration: Number(episode.duration) || 0,
  still: episode.still || "",
  videoUrl: episode.videoUrl || "",
  sources: Array.isArray(episode.sources)
    ? episode.sources
    : [],
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const hasChanges = (previous, current) =>
  JSON.stringify(previous) !== JSON.stringify(current);

const validateStructure = (seasons) => {
  const seasonNumbers = new Set();

  for (const season of seasons) {
    const seasonNumber = Number(season.seasonNumber);

    if (
      !Number.isInteger(seasonNumber) ||
      seasonNumber < 0 ||
      seasonNumbers.has(seasonNumber)
    ) {
      throw new Error(
        "Existem temporadas com números inválidos ou duplicados."
      );
    }

    seasonNumbers.add(seasonNumber);

    const episodeNumbers = new Set();

    for (const episode of season.episodes || []) {
      const episodeNumber = Number(episode.episodeNumber);

      if (
        !Number.isInteger(episodeNumber) ||
        episodeNumber < 0 ||
        episodeNumbers.has(episodeNumber)
      ) {
        throw new Error(
          `Numeração inválida na temporada ${seasonNumber}.`
        );
      }

      if (!String(episode.title || "").trim()) {
        throw new Error(
          `Informe o título do episódio ${episodeNumber} da temporada ${seasonNumber}.`
        );
      }

      episodeNumbers.add(episodeNumber);
    }
  }
};

// =========================================
// SYNC SEASONS / EPISODES
// =========================================

async function syncSeriesStructure(
  seriesId,
  originalSeasons = [],
  desiredSeasons = []
) {
  const originalMap = new Map(
    originalSeasons.map((season) => [
      Number(season.seasonNumber),
      season,
    ])
  );

  const desiredMap = new Map(
    desiredSeasons.map((season) => [
      Number(season.seasonNumber),
      season,
    ])
  );

  // Create/update seasons and episodes.
  for (const season of desiredSeasons) {
    const seasonNumber = Number(season.seasonNumber);
    const previousSeason = originalMap.get(seasonNumber);

    if (!previousSeason) {
      await addSeason(
        seriesId,
        seasonNumber,
        season.title || ""
      );
    } else if (
      (previousSeason.title || "") !==
      (season.title || "")
    ) {
      await updateSeason(seriesId, seasonNumber, {
        title: season.title || "",
      });
    }

    const previousEpisodes =
      previousSeason?.episodes || [];

    const previousEpisodeMap = new Map(
      previousEpisodes.map((episode) => [
        Number(episode.episodeNumber),
        episode,
      ])
    );

    const desiredEpisodeNumbers = new Set(
      (season.episodes || []).map((episode) =>
        Number(episode.episodeNumber)
      )
    );

    // Create or update episodes.
    for (const episode of season.episodes || []) {
      const episodeNumber = Number(
        episode.episodeNumber
      );

      const previousEpisode =
        previousEpisodeMap.get(episodeNumber);

      const payload = normalizeEpisodePayload(episode);

      if (!previousEpisode) {
        await addEpisode(
          seriesId,
          seasonNumber,
          {
            ...payload,
            episodeNumber,
          }
        );
      } else {
        const originalPayload =
          normalizeEpisodePayload(previousEpisode);

        if (hasChanges(originalPayload, payload)) {
          await updateEpisode(
            seriesId,
            seasonNumber,
            episodeNumber,
            payload
          );
        }
      }
    }

    // Delete episodes removed from the form.
    for (const previousEpisode of previousEpisodes) {
      const episodeNumber = Number(
        previousEpisode.episodeNumber
      );

      if (!desiredEpisodeNumbers.has(episodeNumber)) {
        await deleteEpisode(
          seriesId,
          seasonNumber,
          episodeNumber
        );
      }
    }
  }

  // Delete seasons removed from the form.
  for (const previousSeason of originalSeasons) {
    const seasonNumber = Number(
      previousSeason.seasonNumber
    );

    if (!desiredMap.has(seasonNumber)) {
      await deleteSeason(
        seriesId,
        seasonNumber,
        true
      );
    }
  }
}

// =========================================
// COMPONENT
// =========================================

export default function SeriesManager() {
  const [seriesList, setSeriesList] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [originalSeries, setOriginalSeries] = useState(null);

  const [form, setForm] = useState(createEmptySeries);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openingSeriesId, setOpeningSeriesId] = useState(null);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // =========================================
  // LOAD SERIES
  // =========================================

  const loadSeries = useCallback(async () => {
    try {
      setFetching(true);
      setError("");

      const data = await getSeries();

      setSeriesList(
        Array.isArray(data) ? data : []
      );

      return data;
    } catch (err) {
      console.error("Erro ao carregar séries:", err);

      setError(
        getErrorMessage(
          err,
          "Não foi possível carregar as séries."
        )
      );

      throw err;
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadSeries().catch(() => {});
  }, [loadSeries]);

  // =========================================
  // NEW SERIES
  // =========================================

  const handleNewSeries = () => {
    if (loading || openingSeriesId) return;

    setSelectedSeries(null);
    setOriginalSeries(null);
    setForm(createEmptySeries());
    setModalError("");
    setModalOpen(true);
  };

  // =========================================
  // EDIT SERIES
  // =========================================

  const handleEdit = async (series) => {
    if (loading || openingSeriesId) return;

    try {
      setOpeningSeriesId(series._id);
      setModalError("");
      setError("");

      // Always fetch the complete administrative document.
      // The card/list may not contain seasons and episodes.
      const completeSeries = await getAdminSeriesById(
        series._id
      );

      if (!completeSeries?._id) {
        throw new Error(
          "A API não retornou uma série válida."
        );
      }

      const normalized = normalizeSeriesForm(
        completeSeries
      );

      setSelectedSeries(completeSeries);
      setOriginalSeries(structuredClone(normalized));
      setForm(structuredClone(normalized));
      setModalOpen(true);
    } catch (err) {
      console.error("Erro ao abrir série:", err);

      setError(
        getErrorMessage(
          err,
          "Não foi possível carregar os dados da série."
        )
      );
    } finally {
      setOpeningSeriesId(null);
    }
  };

  const handleManage = (series) => {
    handleEdit(series);
  };

  // =========================================
  // CLOSE MODAL
  // =========================================

  const handleCloseModal = () => {
    if (loading) return;

    setModalOpen(false);
    setSelectedSeries(null);
    setOriginalSeries(null);
    setForm(createEmptySeries());
    setModalError("");
  };

  // =========================================
  // CREATE / UPDATE
  // =========================================

  const handleSave = async (submittedForm) => {
    if (loading) return;

    const currentForm = submittedForm || form;
    const metadata = buildSeriesPayload(currentForm);
    const desiredSeasons = Array.isArray(
      currentForm.seasons
    )
      ? currentForm.seasons
      : [];

    try {
      if (!metadata.title) {
        throw new Error(
          "Informe o título da série."
        );
      }

      if (
        currentForm.tmdbId !== "" &&
        currentForm.tmdbId != null &&
        (!Number.isInteger(
          Number(currentForm.tmdbId)
        ) ||
          Number(currentForm.tmdbId) <= 0)
      ) {
        throw new Error(
          "O ID do TMDB deve ser um número inteiro positivo."
        );
      }

      validateStructure(desiredSeasons);

      setLoading(true);
      setModalError("");

      const isEditing = Boolean(
        selectedSeries?._id
      );

      let seriesId;

      if (isEditing) {
        seriesId = selectedSeries._id;

        await updateSeries(
          seriesId,
          metadata
        );
      } else {
        const created = await createSeries(
          metadata
        );

        seriesId = created?._id;

        if (!seriesId) {
          throw new Error(
            "A série foi criada, mas a API não retornou seu identificador."
          );
        }
      }

      // Compare with the original administrative data.
      await syncSeriesStructure(
        seriesId,
        isEditing
          ? originalSeries?.seasons || []
          : [],
        desiredSeasons
      );

      // Persisted successfully.
      handleCloseModal();

      // Refresh the administrative listing.
      try {
        await loadSeries();
      } catch (refreshError) {
        console.error(
          "Série salva, mas houve erro ao atualizar a listagem:",
          refreshError
        );
      }
    } catch (err) {
      console.error("Erro ao salvar série:", err);

      const message = getErrorMessage(
        err,
        "Não foi possível salvar a série."
      );

      setModalError(message);

      // Let SeriesModal display the error.
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // DELETE SERIES
  // =========================================

  const handleDelete = async (series) => {
    if (deletingId || loading) return;

    const confirmed = window.confirm(
      `Deseja realmente excluir "${series.title}"?\n\n` +
        "Todas as temporadas e episódios cadastrados " +
        "nessa série também serão excluídos."
    );

    if (!confirmed) return;

    try {
      setDeletingId(series._id);
      setError("");

      await deleteSeries(series._id);

      setSeriesList((previous) =>
        previous.filter(
          (item) => item._id !== series._id
        )
      );
    } catch (err) {
      console.error("Erro ao excluir série:", err);

      setError(
        getErrorMessage(
          err,
          "Não foi possível excluir a série."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="series-manager-page">
      {/* TOPBAR */}

      <div className="series-manager-top">
        <h1>Séries</h1>

        <button
          type="button"
          className="new-series-button"
          onClick={handleNewSeries}
          disabled={
            loading ||
            Boolean(deletingId) ||
            Boolean(openingSeriesId)
          }
        >
          <Plus size={18} />
          Nova Série
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="series-manager-error"
          role="alert"
        >
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              loadSeries().catch(() => {});
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* LOADING */}

      {fetching ? (
        <div className="series-manager-loading">
          <Loader2
            size={30}
            className="spin"
          />

          <p>Carregando séries...</p>
        </div>
      ) : (
        <>
          {/* EMPTY */}

          {seriesList.length === 0 && !error && (
            <div className="series-empty">
              <h2>Nenhuma série cadastrada</h2>

              <p>
                Comece adicionando sua primeira
                série ao catálogo.
              </p>
            </div>
          )}

          {/* GRID */}

          <div className="series-grid">
            {seriesList.map((series) => (
              <SeriesCard
                key={series._id}
                series={series}
                admin
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManage={handleManage}
              />
            ))}
          </div>
        </>
      )}

      {/* EDIT LOADING */}

      {openingSeriesId && (
        <div
          className="series-manager-loading"
          role="status"
        >
          <Loader2
            size={22}
            className="spin"
          />
          <p>Carregando dados da série...</p>
        </div>
      )}

      {/* MODAL */}

      <SeriesModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        form={form}
        setForm={setForm}
        loading={loading}
        error={modalError}
      />
    </div>
  );
}
