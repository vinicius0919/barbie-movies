
import { ChevronDown, ChevronUp } from "lucide-react";

import SeriesEpisodeCard from "./SeriesEpisodeCard";

import { getSeasonTitle } from "../../utils/seriesDetails";

export default function SeriesSeasons({
  seasons,
  selection,
  expandedSeasons,
  onToggleSeason,
  onSelectEpisode,
}) {
  return (
    <section className="series-seasons-section">
      <div className="section-title">
        <h2>Temporadas</h2>
      </div>

      {seasons.length === 0 ? (
        <p className="series-empty-message">
          Nenhuma temporada cadastrada.
        </p>
      ) : (
        <div className="season-list">
          {seasons.map((season) => {
            const isOpen = Boolean(
              expandedSeasons[season.seasonNumber]
            );

            return (
              <div
                className="season-block"
                key={season._id || season.seasonNumber}
              >
                <button
                  type="button"
                  className="season-toggle"
                  aria-expanded={isOpen}
                  onClick={() =>
                    onToggleSeason(season.seasonNumber)
                  }
                >
                  <div>
                    <h3>{getSeasonTitle(season)}</h3>
                    <span>
                      {season.episodes.length} episódios
                    </span>
                  </div>

                  {isOpen ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>

                {isOpen && (
                  <div className="episode-list">
                    {season.episodes.length === 0 ? (
                      <p className="series-empty-message">
                        Nenhum episódio nesta temporada.
                      </p>
                    ) : (
                      season.episodes.map((episode) => (
                        <SeriesEpisodeCard
                          key={
                            episode._id ||
                            `${season.seasonNumber}-${episode.episodeNumber}`
                          }
                          episode={episode}
                          active={
                            selection?.seasonNumber ===
                              season.seasonNumber &&
                            selection?.episodeNumber ===
                              episode.episodeNumber
                          }
                          onSelect={() =>
                            onSelectEpisode(
                              season.seasonNumber,
                              episode.episodeNumber
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
