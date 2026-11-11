
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  Film,
  Tv,
} from "lucide-react";

export default function CollectionCard({
  collection,
}) {
  if (!collection) return null;

  const posters = collection.posters || [];

  return (
    <Link
      to={`/collections/${encodeURIComponent(
        collection.id
      )}`}
      className="collection-card"
      aria-label={`Explorar coleção ${collection.title}`}
    >
      <div className="collection-card-art">
        {posters.length > 0 ? (
          <div className="collection-card-posters">
            {posters.map((poster, index) => (
              <img
                key={`${poster}-${index}`}
                src={poster}
                alt=""
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="collection-card-placeholder">
            <Film size={44} />
          </div>
        )}

        <div className="collection-card-gradient" />

        <span className="collection-card-count">
          {collection.total}{" "}
          {collection.total === 1
            ? "título"
            : "títulos"}
        </span>
      </div>

      <div className="collection-card-info">
        <div>
          <h2>{collection.title}</h2>

          <div className="collection-card-meta">
            {collection.movieCount > 0 && (
              <span>
                <Film size={14} />
                {collection.movieCount} filmes
              </span>
            )}

            {collection.seriesCount > 0 && (
              <span>
                <Tv size={14} />
                {collection.seriesCount} séries
              </span>
            )}
          </div>
        </div>

        <ArrowUpRight
          size={21}
          className="collection-card-arrow"
        />
      </div>
    </Link>
  );
}
