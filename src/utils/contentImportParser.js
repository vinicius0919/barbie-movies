import { getUtf8ByteLength, MAX_HTML_BYTES } from "./contentImportInput";

export const DEFAULT_IMPORT_SOURCE_ORIGIN = "https://www.tokyvideo.com";

function isUnsafeOrigin(url) {
  const hostname = url.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "[::1]" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function getImportSourceOrigin(value = DEFAULT_IMPORT_SOURCE_ORIGIN) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || isUnsafeOrigin(url)) return new URL(DEFAULT_IMPORT_SOURCE_ORIGIN);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(DEFAULT_IMPORT_SOURCE_ORIGIN);
  }
}

export function normalizeSourceUrl(value, sourceOrigin = DEFAULT_IMPORT_SOURCE_ORIGIN) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  if (raw.startsWith("/")) {
    try { return new URL(raw, getImportSourceOrigin(sourceOrigin)).toString(); } catch { return null; }
  }
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || isUnsafeOrigin(url)) return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}

export function parseEpisodeReference(value) {
  const text = String(value || "");
  const compound = text.match(/\b(?:s|t)\s*(\d{1,3})\s*(?:[\\/|._-]\s*)?(?:e|ep)\s*(\d{1,4})\b/i)
    || text.match(/\b(?:temporada|season)\s*(\d{1,3})\s*(?:[\\/|._-]\s*)?(?:ep|epis[oó]dio)\s*(\d{1,4})\b/i);
  if (compound) return { seasonNumber: Number(compound[1]), episodeNumber: Number(compound[2]) };
  const episode = text.match(/\b(?:ep|epis[oó]dio)\s*[-._/#]?\s*(\d{1,4})\b/i);
  return episode ? { episodeNumber: Number(episode[1]) } : {};
}

export function suggestSeriesName(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const name = text
    .replace(/\b(?:s|t)\s*\d{1,3}\s*(?:[\\/|._-]\s*)?(?:e|ep)\s*\d{1,4}\b/ig, " ")
    .replace(/\b(?:temporada|season)\s*\d{1,3}\s*(?:[\\/|._-]\s*)?(?:ep|epis[oó]dio)\s*\d{1,4}\b/ig, " ")
    .replace(/\b(?:ep|epis[oó]dio)\s*[-._/#]?\s*\d{1,4}\b/ig, " ")
    .replace(/\((?:pt[- ]?br|dublado|legendado)\)/ig, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name || null;
}

function durationInMinutes(value) {
  const match = String(value || "").match(/(\d{1,3})(?::([0-5]\d))?\s*(?:min|m|h)?/i);
  return match ? (match[2] ? Number(match[1]) * 60 + Number(match[2]) : Number(match[1])) : undefined;
}

export function extractContentImports(html) {
  if (typeof html !== "string") throw new Error("O conteúdo precisa ser texto.");
  if (getUtf8ByteLength(html) > MAX_HTML_BYTES) throw new Error("O HTML excede o limite de 5 MB.");
  const document = new DOMParser().parseFromString(html, "text/html");
  const elements = [...document.querySelectorAll(".thumb-video")];
  const records = [];
  const seen = new Set();
  let linksFound = 0;
  for (const element of elements) {
    const anchor = element.matches("a") ? element : element.querySelector("a[href]");
    const sourceUrl = normalizeSourceUrl(anchor?.getAttribute("href"), import.meta.env.VITE_CONTENT_IMPORT_SOURCE_ORIGIN || DEFAULT_IMPORT_SOURCE_ORIGIN);
    if (!sourceUrl) continue;
    linksFound += 1;
    const sourceKey = sourceUrl.toLowerCase();
    if (seen.has(sourceKey)) continue;
    seen.add(sourceKey);
    const title = (element.querySelector("[data-title], .title, .name, h1, h2, h3, h4")?.textContent || anchor?.getAttribute("title") || anchor?.getAttribute("aria-label") || element.textContent || sourceUrl.split("/").pop() || "").trim().replace(/\s+/g, " ");
    const reference = parseEpisodeReference(`${title} ${sourceUrl}`);
    const image = element.querySelector("img");
    const thumbnail = normalizeSourceUrl(image?.getAttribute("src") || image?.getAttribute("data-src"), import.meta.env.VITE_CONTENT_IMPORT_SOURCE_ORIGIN || DEFAULT_IMPORT_SOURCE_ORIGIN);
    const duration = durationInMinutes(element.querySelector("[data-duration], .duration, time")?.textContent || element.getAttribute("data-duration"));
    const seriesName = element.getAttribute("data-series") || (reference.episodeNumber !== undefined ? suggestSeriesName(title) : undefined);
    const suggestedType = reference.episodeNumber !== undefined ? "episode" : /\b(série|serie|season|temporada)\b/i.test(`${title} ${sourceUrl}`) ? "series" : "movie";
    records.push({ sourceKey, sourceUrl, extractedTitle: title.slice(0, 500), suggestedType, ...reference, duration, thumbnail, metadata: { seriesName } });
  }
  return { linksFound, uniqueLinks: records.length, duplicates: linksFound - records.length, records };
}
