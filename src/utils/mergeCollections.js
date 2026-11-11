
function validImage(url) {
  return (
    typeof url === "string" &&
    /^https?:\/\//i.test(url)
  );
}

function normalizeMedia(item, mediaType) {
  if (!item || item.published === false) {
    return null;
  }

  const id = item._id ?? item.id;

  if (!id || !item.title) {
    return null;
  }

  return {
    ...item,
    _id: String(id),
    mediaType,
  };
}

function buildMediaIndex(movies, series) {
  const index = new Map();

  for (const [type, items] of [
    ["movie", movies],
    ["series", series],
  ]) {
    for (const item of items) {
      const normalized = normalizeMedia(item, type);

      if (!normalized) continue;

      index.set(
        `${type}:${normalized._id}`,
        normalized
      );
    }
  }

  return index;
}

function getPosters(items, coverUrl) {
  const posters = items
    .map((item) => item.poster)
    .filter(validImage);

  if (validImage(coverUrl)) {
    posters.unshift(coverUrl);
  }

  return [...new Set(posters)].slice(0, 3);
}

function makeManualCollection(config, mediaIndex) {
  const items = [];
  const seen = new Set();

  for (const reference of config.items || []) {
    const key =
      `${reference.mediaType}:${reference.mediaId}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const item = mediaIndex.get(key);

    if (item) items.push(item);
  }

  const movieCount = items.filter(
    (item) => item.mediaType === "movie"
  ).length;

  const seriesCount = items.filter(
    (item) => item.mediaType === "series"
  ).length;

  return {
    id: config.id,
    title: config.title,
    description: config.description || "",
    type: "manual",
    items,
    total: items.length,
    movieCount,
    seriesCount,
    posters: getPosters(items, config.coverUrl),
    coverUrl: config.coverUrl || "",
    published: config.published === true,
    featured: config.featured === true,
    sortOrder: config.sortOrder ?? 100,
  };
}

export function mergeCollections(
  automaticCollections = [],
  savedConfigs = [],
  movies = [],
  series = [],
  { includeUnpublished = false } = {}
) {
  const configs = new Map(
    savedConfigs.map((config) => [
      config.id,
      config,
    ])
  );

  const mediaIndex = buildMediaIndex(
    movies,
    series
  );

  const result = [];

  for (const automatic of automaticCollections) {
    const config = configs.get(automatic.id);

    const published =
      config?.published ?? true;

    if (!includeUnpublished && !published) {
      continue;
    }

    result.push({
      ...automatic,
      title: config?.title ?? automatic.title,
      description:
        config?.description ??
        automatic.description,
      genre: config?.genre || automatic.title,
      type: "genre",
      coverUrl: config?.coverUrl || "",
      posters: getPosters(
        automatic.items,
        config?.coverUrl
      ),
      published,
      featured: config?.featured === true,
      sortOrder: config?.sortOrder ?? 100,
    });
  }

  for (const config of savedConfigs) {
    if (config.type !== "manual") {
      continue;
    }

    if (
      !includeUnpublished &&
      config.published !== true
    ) {
      continue;
    }

    result.push(
      makeManualCollection(config, mediaIndex)
    );
  }

  return result.sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      b.total - a.total ||
      a.title.localeCompare(
        b.title,
        "pt-BR"
      )
  );
}
