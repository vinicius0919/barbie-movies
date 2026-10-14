
import "./SeriesManager.css";

import { useCallback, useEffect, useState } from "react";

import { Plus, AlertCircle, Loader2 } from "lucide-react";

import {
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
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
  published: Boolean(series.published),
  seasons: Array.isArray(series.seasons)
    ? structuredClone(series.seasons)
    : [],
});

const buildSeriesPayload = (form) => {
  const tmdbId = Number(form.tmdbId);

  return {
    title: form.title.trim(),
    overview: form.overview?.trim() || "",
    poster: form.poster?.trim() || "",
    backdrop: form.backdrop?.trim() || "",
    year: String(form.year || "").trim(),

    ...(form.tmdbId !== "" &&
    form.tmdbId !== null &&
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
    published: Boolean(form.published),
  };
};

// =========================================
// COMPONENT
// =========================================

export default function SeriesManager() {
  const [seriesList, setSeriesList] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [selectedSeries, setSelectedSeries] =
    useState(null);

  const [form, setForm] = useState(
    createEmptySeries
  );

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    } catch (err) {
      console.error(
        "Erro ao carregar séries:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Não foi possível carregar as séries."
      );
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  // =========================================
  // OPEN NEW SERIES
  // =========================================

  const handleNewSeries = () => {
    setEditing(false);
    setSelectedSeries(null);
    setForm(createEmptySeries());
    setModalError("");
    setModalOpen(true);
  };

  // =========================================
  // OPEN EDIT
  // =========================================

  const handleEdit = (series) => {
    setEditing(true);
    setSelectedSeries(series);
    setForm(normalizeSeriesForm(series));
    setModalError("");
    setModalOpen(true);
  };

  // =========================================
  // MANAGE SERIES
  // =========================================

  const handleManage = (series) => {
    handleEdit(series);
  };

  // =========================================
  // CLOSE MODAL
  // =========================================

  const handleCloseModal = () => {
    if (loading) return;

    setModalOpen(false);
    setEditing(false);
    setSelectedSeries(null);
    setForm(createEmptySeries());
    setModalError("");
  };

  // =========================================
  // CREATE / UPDATE
  // =========================================

  const handleSave = async () => {
    if (loading) return;

    const payload = buildSeriesPayload(form);

    if (!payload.title) {
      setModalError(
        "Informe o título da série."
      );
      return;
    }

    if (
      form.tmdbId !== "" &&
      form.tmdbId !== null &&
      (!Number.isInteger(Number(form.tmdbId)) ||
        Number(form.tmdbId) <= 0)
    ) {
      setModalError(
        "O ID do TMDB deve ser um número inteiro positivo."
      );
      return;
    }

    try {
      setLoading(true);
      setModalError("");

      if (editing && selectedSeries?._id) {
        const updated = await updateSeries(
          selectedSeries._id,
          payload
        );

        setSeriesList((prev) =>
          prev.map((item) =>
            item._id === selectedSeries._id
              ? updated
              : item
          )
        );
      } else {
        const created = await createSeries(
          payload
        );

        setSeriesList((prev) => [
          created,
          ...prev,
        ]);
      }

      setModalOpen(false);
      setEditing(false);
      setSelectedSeries(null);
      setForm(createEmptySeries());

      // Sincroniza o catálogo com o servidor.
      await loadSeries();
    } catch (err) {
      console.error(
        "Erro ao salvar série:",
        err
      );

      setModalError(
        err.response?.data?.error ||
          "Não foi possível salvar a série."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // DELETE SERIES
  // =========================================

  const handleDelete = async (series) => {
    if (deletingId) return;

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

      setSeriesList((prev) =>
        prev.filter(
          (item) => item._id !== series._id
        )
      );
    } catch (err) {
      console.error(
        "Erro ao excluir série:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Não foi possível excluir a série."
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
          disabled={loading || Boolean(deletingId)}
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
            onClick={loadSeries}
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

          {seriesList.length === 0 &&
            !error && (
              <div className="series-empty">
                <h2>
                  Nenhuma série cadastrada
                </h2>

                <p>
                  Comece adicionando sua
                  primeira série ao catálogo.
                </p>
              </div>
            )}

          {/* GRID */}

          <div className="series-grid">
            {seriesList.map((series) => (
              <SeriesCard
                key={series._id}
                series={series}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManage={handleManage}
                deleting={
                  deletingId === series._id
                }
              />
            ))}
          </div>
        </>
      )}

      {/* MODAL */}

      <SeriesModal
        open={modalOpen}
        onClose={handleCloseModal}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        loading={loading}
        editing={editing}
        error={modalError}
        selectedSeries={selectedSeries}
        onUpdated={loadSeries}
      />

    </div>
  );
}
