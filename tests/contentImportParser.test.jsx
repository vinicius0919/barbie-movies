import { describe, expect, it } from "vitest";
import { extractContentImports, parseEpisodeReference, suggestSeriesName } from "../src/utils/contentImportParser";

describe("extração local de importações", () => {
  it("extrai thumb-video, episódio, imagem e duração sem inserir o HTML", () => {
    const result = extractContentImports(`
      <script>window.evil = true</script>
      <div class="thumb-video"><a href="/br/video/show-t01-ep02" title="Show T01 EP02"><img src="/cover.jpg" /></a><span class="duration">42 min</span></div>
      <div class="thumb-video"><a href="/br/video/show-t01-ep02">duplicado</a></div>
    `);
    expect(result.linksFound).toBe(2);
    expect(result.uniqueLinks).toBe(1);
    expect(result.records[0]).toMatchObject({ sourceKey: "https://www.tokyvideo.com/br/video/show-t01-ep02", sourceUrl: "https://www.tokyvideo.com/br/video/show-t01-ep02", suggestedType: "episode", seasonNumber: 1, episodeNumber: 2, duration: 42, thumbnail: "https://www.tokyvideo.com/cover.jpg" });
    expect(result.records[0].sourceUrl).not.toContain("localhost");
    expect(document.body.textContent).not.toContain("Show T01 EP02");
  });

  it.each([
    ["T 01 / E 01", { seasonNumber: 1, episodeNumber: 1 }],
    ["T01 E01", { seasonNumber: 1, episodeNumber: 1 }],
    ["S01E02", { seasonNumber: 1, episodeNumber: 2 }],
    ["Temporada 2 Episódio 3", { seasonNumber: 2, episodeNumber: 3 }],
    ["EP 04", { episodeNumber: 4 }],
  ])("identifica o padrão de episódio %s", (value, expected) => {
    expect(parseEpisodeReference(value)).toEqual(expected);
  });

  it("sugere o nome da série sem alterar o título persistido", () => {
    expect(suggestSeriesName("Hero Inside (PT-BR) T 01 / E 01")).toBe("Hero Inside");
  });
});
