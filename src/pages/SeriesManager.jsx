// pages/SeriesManager.jsx

import "./SeriesManager.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import {
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
} from "../services/series";

import SeriesCard from "../components/SeriesCard";
import SeriesModal from "../components/SeriesModal";

const EMPTY_SERIES = {
  title: "",
  overview: "",
  poster: "",
  backdrop: "",
  genres: [],
  seasons: [],
};

export default function SeriesManager() {
  const [seriesList, setSeriesList] =
    useState([]);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [selectedSeries, setSelectedSeries] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_SERIES);

  const [loading, setLoading] =
    useState(false);

  /* =========================================
     LOAD
  ========================================= */

  async function loadSeries() {
    try {
      const data =
        await getSeries();

      setSeriesList(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadSeries();
  }, []);

  /* =========================================
     CREATE / UPDATE
  ========================================= */

  async function handleSave() {
    try {
      setLoading(true);

      if (
        editing &&
        selectedSeries
      ) {
        await updateSeries(
          selectedSeries._id,
          form
        );
      } else {
        await createSeries(
          form
        );
      }

      handleCloseModal();

      loadSeries();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     EDIT
  ========================================= */

  function handleEdit(series) {
    setEditing(true);

    setSelectedSeries(
      series
    );

    setForm({
      title:
        series.title || "",

      overview:
        series.overview ||
        "",

      poster:
        series.poster || "",

      backdrop:
        series.backdrop ||
        "",

      genres:
        series.genres || [],

      seasons:
        series.seasons || [],
    });

    setModalOpen(true);
  }

  /* =========================================
     DELETE
  ========================================= */

  async function handleDelete(
    series
  ) {
    const confirmDelete =
      window.confirm(
        `Deseja realmente excluir "${series.title}"?`
      );

    if (!confirmDelete)
      return;

    try {
      await deleteSeries(
        series._id
      );

      setSeriesList((prev) =>
        prev.filter(
          (item) =>
            item._id !==
            series._id
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao excluir série"
      );
    }
  }

  /* =========================================
     MANAGE
  ========================================= */

  function handleManage(
    series
  ) {
    setEditing(true);

    setSelectedSeries(
      series
    );

    setForm({
      title:
        series.title || "",

      overview:
        series.overview ||
        "",

      poster:
        series.poster || "",

      backdrop:
        series.backdrop ||
        "",

      genres:
        series.genres || [],

      seasons:
        series.seasons || [],
    });

    setModalOpen(true);
  }

  /* =========================================
     NEW SERIES
  ========================================= */

  function handleNewSeries() {
    setEditing(false);

    setSelectedSeries(null);

    setForm(
      EMPTY_SERIES
    );

    setModalOpen(true);
  }

  /* =========================================
     CLOSE MODAL
  ========================================= */

  function handleCloseModal() {
    setModalOpen(false);

    setEditing(false);

    setSelectedSeries(null);

    setForm(
      EMPTY_SERIES
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="series-manager-page">

      {/* =====================================
          TOPBAR
      ===================================== */}

      <div className="series-manager-top">

        <h1>
          Séries
        </h1>

        <button
          className="new-series-button"
          onClick={
            handleNewSeries
          }
        >
          <Plus size={18} />
          Nova Série
        </button>

      </div>

      {/* =====================================
          EMPTY
      ===================================== */}

      {seriesList.length ===
        0 && (
        <div className="series-empty">

          <h2>
            Nenhuma série cadastrada
          </h2>

          <p>
            Comece adicionando
            sua primeira série
            ao catálogo.
          </p>

        </div>
      )}

      {/* =====================================
          GRID
      ===================================== */}

      <div className="series-grid">

        {seriesList.map(
          (series) => (
            <SeriesCard
              key={series._id}
              series={series}
              onEdit={
                handleEdit
              }
              onDelete={
                handleDelete
              }
              onManage={
                handleManage
              }
            />
          )
        )}

      </div>

      {/* =====================================
          MODAL
      ===================================== */}

      <SeriesModal
        open={modalOpen}
        onClose={
          handleCloseModal
        }
        form={form}
        setForm={setForm}
        onSave={handleSave}
        loading={loading}
        editing={editing}
      />

    </div>
  );
}