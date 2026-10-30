
 // Identifica somente URLs oficiais do YouTube e converte para embed seguro.
function parseYouTubeTime(value) {
  if (!value) return 0;

  const raw = String(value).toLowerCase();

  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(
    /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/
  );

  if (!match || !match[0]) return 0;

  return (
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0)
  );
}

export function getYouTubeEmbedUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);

    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }

    const host = url.hostname.toLowerCase();
    let id = null;

    if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com",
      ].includes(host)
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (/^\/(embed|shorts|live)\//.test(url.pathname)) {
        id = url.pathname.split("/")[2];
      }
    } else if (
      ["youtu.be", "www.youtu.be"].includes(host)
    ) {
      id = url.pathname.split("/")[1];
    }

    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return null;
    }

    const embed = new URL(
      `https://www.youtube-nocookie.com/embed/${id}`
    );

    const seconds = parseYouTubeTime(
      url.searchParams.get("t") ||
      url.searchParams.get("start")
    );

    if (Number.isFinite(seconds) && seconds > 0) {
      embed.searchParams.set(
        "start",
        String(Math.floor(seconds))
      );
    }

    return embed.toString();
  } catch {
    return null;
  }
}
