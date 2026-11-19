import { describe, expect, it } from "vitest";
import { formatImportSize, MAX_HTML_BYTES, readImportFile, validateImportText } from "../src/utils/contentImportInput";

describe("entrada da Central de Importações", () => {
  it("aceita arquivo pequeno", async () => {
    const result = await readImportFile({ size: 18, text: async () => "<div>conteúdo</div>" });
    expect(result.text).toContain("conteúdo");
  });

  it("rejeita arquivo vazio", async () => {
    await expect(readImportFile({ size: 0, text: async () => "" })).rejects.toThrow("arquivo está vazio");
  });

  it("rejeita arquivo maior que 5 MB antes de ler o conteúdo", async () => {
    const text = async () => { throw new Error("não deveria ser lido"); };
    await expect(readImportFile({ size: MAX_HTML_BYTES + 1, text })).rejects.toThrow("excede o limite de 5 MB");
  });

  it("valida texto acima do limite sem truncá-lo", () => {
    const value = "x".repeat(MAX_HTML_BYTES + 1);
    const result = validateImportText(value);
    expect(result.valid).toBe(false);
    expect(result.bytes).toBeGreaterThan(MAX_HTML_BYTES);
    expect(formatImportSize(result.bytes)).toContain("MB");
  });
});
