
import {
  Tv,
  Layers3,
  Play,
  Eye,
  Heart,
  Check,
  Loader2,
  AlertCircle,
  History,
  RotateCcw,
} from "lucide-react";

import { formatViews } from "../../utils/seriesDetails";

export default function SeriesHero({
  series,
  seasonCount,
  episodeCount,
  onWatch,
  favorite,
  favoriteLoading,
  favoriteError,
  onToggleFavorite,
  resumeEpisode = null,
  hasProgress = false,
  resumeTime = 0,
}) {
  const canResume = hasProgress && Boolean(resumeEpisode);

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <section className="series-hero">
      <div className="series-hero-poster">
        {series.poster && (
          <img src={series.poster} alt={series.title} />
        )}
      </div>

      <div className="series-hero-content">
        <h1>{series.title}</h1>

        <div className="series-meta">
          {series.year && (
            <span>
              <Tv size={16} />
              {series.year}
            </span>
          )}

          <span>
            <Layers3 size={16} />
            {seasonCount} temporadas
          </span>

          <span>
            <Play size={16} />
            {episodeCount} episódios
          </span>

          <span>
            <Eye size={16} />
            {formatViews(series.views)}
          </span>
        </div>

        {series.overview && (
          <p className="series-overview">
            {series.overview}
          </p>
        )}

        <div className="series-genres">
          {(series.genres || []).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>

        {canResume && (
          <div className="series-resume-info">
            <div className="series-resume-heading">
              <History size={17} />
              <span>Último episódio assistido</span>
            </div>

            <strong className="series-resume-title">
              T{resumeEpisode.seasonNumber}:E
              {resumeEpisode.episodeNumber}
              {resumeEpisode.title
                ? ` — ${resumeEpisode.title}`
                : ""}
            </strong>

            {resumeTime > 0 && (
              <span className="series-resume-time">
                <RotateCcw size={14} />
                Continuar de {formatTime(resumeTime)}
              </span>
            )}
          </div>
        )}

        <div className="series-hero-actions">
          {episodeCount > 0 && (
            <button
              type="button"
              className="watch-series-button"
              onClick={onWatch}
            >
              <Play size={18} fill="currentColor" />
              {canResume
                ? "Continuar Assistindo"
                : "Assistir Agora"}
            </button>
          )}

          <button
            type="button"
            className={`series-favorite-button ${
              favorite ? "active" : ""
            }`}
            onClick={onToggleFavorite}
            disabled={favoriteLoading}
            aria-pressed={Boolean(favorite)}
          >
            {favoriteLoading ? (
              <Loader2 size={18} className="spin" />
            ) : favorite ? (
              <Check size={18} />
            ) : (
              <Heart size={18} />
            )}

            {favorite ? "Na Minha Lista" : "Minha Lista"}
          </button>
        </div>

        {favoriteError && (
          <p className="series-action-error" role="alert">
            <AlertCircle size={16} />
            {favoriteError}
          </p>
        )}
      </div>
    </section>
  );
}
