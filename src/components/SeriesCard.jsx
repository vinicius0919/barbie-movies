
import "./SeriesCard.css";

import { useNavigate } from "react-router-dom";

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
  admin = false,
}) {
  const navigate = useNavigate();

  if (!series) return null;

  const totalSeasons =
    series.totalSeasons ??
    series.seasons?.length ??
    0;

  const totalEpisodes =
    series.totalEpisodes ??
    series.seasons?.reduce(
      (total, season) =>
        total + (season.episodes?.length || 0),
      0
    ) ??
    0;

  function handleOpenSeries() {
    navigate(`/series/${series._id}`);
  }

  function handleEdit(event) {
    event.stopPropagation();
    onEdit?.(series);
  }

  function handleDelete(event) {
    event.stopPropagation();
    onDelete?.(series);
  }

  function handleManage(event) {
    event.stopPropagation();
    onManage?.(series);
  }

  return (
    <article className="series-card">
      <div className="series-card-poster">
        <img
          src={series.poster}
          alt={series.title}
          loading="lazy"
        />

        {admin && (
          <div className="series-card-actions">
            <button
              type="button"
              className="series-card-action edit"
              onClick={handleEdit}
              title="Editar série"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="series-card-action manage"
              onClick={handleManage}
              title="Gerenciar temporadas"
            >
              <Settings2 size={16} />
            </button>

            <button
              type="button"
              className="series-card-action delete"
              onClick={handleDelete}
              title="Excluir série"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className="series-card-overlay">
          <button
            type="button"
            className="series-card-play"
            onClick={handleOpenSeries}
            aria-label={`Ver ${series.title}`}
          >
            <Play size={18} fill="white" />
          </button>
        </div>
      </div>

      <div
        className="series-card-content"
        onClick={handleOpenSeries}
      >
        <div className="series-card-top">
          <h3>{series.title}</h3>

          {series.favorite && (
            <Heart
              size={18}
              fill="#ff003c"
              color="#ff003c"
            />
          )}
        </div>

        <div className="series-card-meta">
          <span>
            <Tv size={14} />
            {totalSeasons} temporadas
          </span>

          <span>
            <Eye size={14} />
            {(series.views || 0).toLocaleString(
              "pt-BR"
            )}
          </span>
        </div>

        <p>{series.overview}</p>

        <div className="series-card-genres">
          {series.genres?.slice(0, 3).map(
            (genre) => (
              <span key={genre}>{genre}</span>
            )
          )}
        </div>

        <div className="series-card-footer">
          <span>{series.year}</span>
          <span>{totalEpisodes} episódios</span>
        </div>
      </div>
    </article>
  );
}
