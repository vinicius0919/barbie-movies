
export const formatViews = (value) =>
  Number(value || 0).toLocaleString("pt-BR");

export const getSeasonTitle = (season) =>
  season.title ||
  (Number(season.seasonNumber) === 0
    ? "Especiais"
    : `Temporada ${season.seasonNumber}`);

export const getEpisodeKey = (seasonNumber, episode) =>
  `${seasonNumber}:${episode.episodeNumber}`;

export const sortSeasons = (seasons = []) =>
  [...seasons]
    .sort((a, b) => a.seasonNumber - b.seasonNumber)
    .map((season) => ({
      ...season,
      episodes: [...(season.episodes || [])].sort(
        (a, b) => a.episodeNumber - b.episodeNumber
      ),
    }));

export const findFirstEpisode = (seasons = []) => {
  const sorted = sortSeasons(seasons);

  const prioritized = [
    ...sorted.filter((s) => s.seasonNumber > 0),
    ...sorted.filter((s) => s.seasonNumber === 0),
  ];

  for (const season of prioritized) {
    if (season.episodes.length) {
      return {
        seasonNumber: season.seasonNumber,
        episodeNumber: season.episodes[0].episodeNumber,
      };
    }
  }

  return null;
};

export const getApiError = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;
