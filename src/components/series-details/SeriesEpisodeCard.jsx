
import { Clock3, Eye, Play } from "lucide-react";

import { formatViews } from "../../utils/seriesDetails";

export default function SeriesEpisodeCard({
  episode,
  active,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`episode-item ${active ? "active" : ""}`}
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
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
            E{episode.episodeNumber} · {episode.title}
          </h4>

          <span>
            <Eye size={14} />
            {formatViews(episode.views)}
          </span>
        </div>

        {episode.overview && <p>{episode.overview}</p>}

        {Number(episode.duration) > 0 && (
          <span className="episode-duration">
            <Clock3 size={14} />
            {episode.duration} min
          </span>
        )}
      </div>
    </button>
  );
}
