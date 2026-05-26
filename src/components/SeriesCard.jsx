// components/series/SeriesCard/index.jsx

import "./SeriesCard.css";

import {
  useNavigate,
} from "react-router-dom";

import {
  Heart,
  Play,
  Tv,
  Eye,
  Pencil,
  Trash2,
  Settings2,
} from "lucide-react";

export default function SeriesCard({
  series,
  onEdit,
  onDelete,
  onManage,
}) {
  const navigate =
    useNavigate();

  if (!series) return null;

  /* =========================================
     NAVIGATE
  ========================================= */

  function handleOpenSeries() {
    navigate(
      `/series/${series._id}`
    );
  }

  /* =========================================
     ACTIONS
  ========================================= */

  function handleEdit(e) {
    e.stopPropagation();

    onEdit?.(series);
  }

  function handleDelete(e) {
    e.stopPropagation();

    onDelete?.(series);
  }

  function handleManage(e) {
    e.stopPropagation();

    onManage?.(series);
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="series-card">

      {/* =====================================
          POSTER
      ===================================== */}

      <div
        className="series-card-poster"
        onClick={
          handleOpenSeries
        }
      >

        <img
          src={series.poster}
          alt={series.title}
          loading="lazy"
        />

        {/* =====================================
            ACTIONS
        ===================================== */}

        <div className="series-card-actions">

          <button
            className="series-card-action edit"
            onClick={
              handleEdit
            }
            title="Editar Série"
          >
            <Pencil size={16} />
          </button>

          <button
            className="series-card-action manage"
            onClick={
              handleManage
            }
            title="Gerenciar Temporadas"
          >
            <Settings2 size={16} />
          </button>

          <button
            className="series-card-action delete"
            onClick={
              handleDelete
            }
            title="Excluir Série"
          >
            <Trash2 size={16} />
          </button>

        </div>

        {/* =====================================
            OVERLAY
        ===================================== */}

        <div className="series-card-overlay">

          <button className="series-card-play">
            <Play
              size={18}
              fill="white"
            />
          </button>

        </div>

      </div>

      {/* =====================================
          CONTENT
      ===================================== */}

      <div
        className="series-card-content"
        onClick={
          handleOpenSeries
        }
      >

        <div className="series-card-top">

          <h3>
            {series.title}
          </h3>

          {series.favorite && (
            <Heart
              size={18}
              fill="#ff003c"
              color="#ff003c"
            />
          )}

        </div>

        {/* =====================================
            META
        ===================================== */}

        <div className="series-card-meta">

          <span>
            <Tv size={14} />

            {
              series.totalSeasons
            }{" "}
            Temporadas
          </span>

          <span>
            <Eye size={14} />

            {(
              series.views || 0
            ).toLocaleString()}
          </span>

        </div>

        {/* =====================================
            DESCRIPTION
        ===================================== */}

        <p>
          {series.overview}
        </p>

        {/* =====================================
            GENRES
        ===================================== */}

        <div className="series-card-genres">

          {series.genres
            ?.slice(0, 3)
            .map((genre) => (
              <span
                key={genre}
              >
                {genre}
              </span>
            ))}

        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="series-card-footer">

          <span>
            {series.year}
          </span>

          <span>

            {
              series.seasons?.reduce(
                (total, season) =>
                  total +
                  (
                    season.episodes
                      ?.length || 0
                  ),
                0
              )
            }{" "}

            episódios

          </span>
        </div>

      </div>

    </div>
  );
}