
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeGenres(genres) {
  if (!Array.isArray(genres)) {
    return [];
  }

  return [
    ...new Set(
      genres
        .filter(
          (genre) =>
            typeof genre === "string" &&
            genre.trim().length > 0
        )
        .map((genre) => genre.trim())
    ),
  ];
}

function normalizeItem(item, mediaType) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = item._id ?? item.id;

  if (!id || !item.title) {
    return null;
  }

  // Defesa visual adicional.
  // A autorização definitiva pertence ao backend.
  if (item.published === false) {
    return null;
  }

  return {
    ...item,
    _id: id,
    mediaType,
    genres: normalizeGenres(item.genres),
  };
}

export function buildCollections(
  movies = [],
  series = []
) {
  const collectionMap = new Map();

  const normalizedMovies = movies
    .map((movie) => normalizeItem(movie, "movie"))
    .filter(Boolean);

  const normalizedSeries = series
    .map((item) => normalizeItem(item, "series"))
    .filter(Boolean);

  const allItems = [
    ...normalizedMovies,
    ...normalizedSeries,
  ];

  for (const item of allItems) {
    for (const genre of item.genres) {
      const slug = slugify(genre);

      if (!slug) continue;

      const id = `genre-${slug}`;

      if (!collectionMap.has(id)) {
        collectionMap.set(id, {
          id,
          title: genre,
          description: `Explore filmes e séries de ${genre.toLocaleLowerCase(
            "pt-BR"
          )}.`,
          type: "genre",
          items: [],
          itemKeys: new Set(),
        });
      }

      const collection = collectionMap.get(id);

      const itemKey = `${item.mediaType}:${item._id}`;

      if (collection.itemKeys.has(itemKey)) {
        continue;
      }

      collection.itemKeys.add(itemKey);
      collection.items.push(item);
    }
  }

  return [...collectionMap.values()]
    .map((collection) => {
      const items = collection.items.sort(
        (a, b) =>
          a.title.localeCompare(
            b.title,
            "pt-BR"
          )
      );

      const movieCount = items.filter(
        (item) => item.mediaType === "movie"
      ).length;

      const seriesCount = items.filter(
        (item) => item.mediaType === "series"
      ).length;

      const posters = items
        .map((item) => item.poster)
        .filter(
          (poster) =>
            typeof poster === "string" &&
            /^https?:\/\//i.test(poster)
        )
        .slice(0, 3);

      return {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        type: collection.type,
        items,
        total: items.length,
        movieCount,
        seriesCount,
        posters,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.title.localeCompare(
          b.title,
          "pt-BR"
        )
    );
}
