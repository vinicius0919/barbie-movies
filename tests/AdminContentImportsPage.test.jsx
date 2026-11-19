import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importedItem = {
  _id: "import-1",
  extractedTitle: "Hero Inside T 01 E 01",
  sourceUrl: "/br/video/hero-inside-t01-e01",
  suggestedType: "episode",
  seasonNumber: 1,
  episodeNumber: 1,
  processingStatus: "pending",
  createdAt: "2026-01-01T00:00:00.000Z",
  validation: { status: "unreviewed", tmdbStatus: "unlinked", matches: [] },
};

vi.mock("../src/services/contentImports", () => ({
  listContentImports: vi.fn(async () => ({ data: [importedItem], pagination: { total: 1, totalPages: 1 } })),
  getContentImport: vi.fn(async () => importedItem),
  getContentImportHistory: vi.fn(async () => ({ history: [] })),
  updateContentImport: vi.fn(),
  validateContentImport: vi.fn(),
  linkContentImportTmdb: vi.fn(),
  confirmContentImportValidation: vi.fn(),
  previewContentImportBatch: vi.fn(),
  processContentImportBatch: vi.fn(),
  createStructuredContentImportBatch: vi.fn(),
}));

vi.mock("../src/services/tmdb", () => ({ searchTmdb: vi.fn(), searchTMDBSeries: vi.fn() }));

import AdminContentImportsPage from "../src/pages/AdminContentImportsPage";
import { confirmContentImportValidation, getContentImport, linkContentImportTmdb } from "../src/services/contentImports";
import { searchTMDBSeries } from "../src/services/tmdb";

describe("AdminContentImportsPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("abre e fecha a revisão individual sem perder os status traduzidos", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    expect(await screen.findByText("Pendente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revisar" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Não revisado").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Fechar revisão" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Revisar" })).toHaveFocus());
  });

  it("alterna abas sem limpar os dados carregados", async () => {
    render(<AdminContentImportsPage />);
    expect(await screen.findByText("Analisar HTML")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    expect(screen.getByText("Registros preparados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Importar" }));
    expect(screen.getByText("Analisar HTML")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "" })).toBeInTheDocument();
  });

  it("protege alterações não salvas e fecha com Escape", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Revisar" }));
    fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Título alterado" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar revisão" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("sugere a série sem a numeração do episódio e atualiza o vínculo TMDB", async () => {
    const linkedItem = {
      ...importedItem,
      validation: { ...importedItem.validation, status: "unreviewed", tmdbStatus: "validated", tmdbId: 321, tmdbType: "tv" },
    };
    vi.mocked(searchTMDBSeries).mockResolvedValue({ results: [{ tmdbId: 321, title: "Hero Inside", year: "2024", poster: "https://image.tmdb.org/t/p/w500/poster.jpg", alreadyAdded: true }] });
    vi.mocked(linkContentImportTmdb).mockResolvedValue(linkedItem);
    vi.mocked(getContentImport).mockResolvedValueOnce(importedItem);

    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Revisar" }));
    const query = await screen.findByRole("textbox", { name: "Pesquisar no TMDB" });
    expect(query).toHaveValue("Hero Inside");
    fireEvent.click(screen.getByRole("button", { name: "Pesquisar" }));
    expect(await screen.findByText("Hero Inside")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hero Inside.*TMDB 321/i }));
    expect(await screen.findByText(/Vínculo TMDB salvo/)).toBeInTheDocument();
    expect(screen.getByText(/Série · TMDB 321 · Vínculo confirmado/)).toBeInTheDocument();
  });

  it("preserva o vínculo ao reabrir e separa a URL de origem da reprodução", async () => {
    const linkedItem = {
      ...importedItem,
      validation: { ...importedItem.validation, tmdbStatus: "validated", tmdbId: 321, tmdbType: "tv", status: "unreviewed" },
    };
    vi.mocked(getContentImport).mockResolvedValue(linkedItem);
    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Revisar" }));
    expect(await screen.findByText("Obra vinculada")).toBeInTheDocument();
    expect(screen.getByText(/Série · TMDB 321 · Vínculo confirmado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir página original" })).toHaveAttribute("href", "https://www.tokyvideo.com/br/video/hero-inside-t01-e01");
    expect(screen.getByPlaceholderText("Cole uma URL de reprodução autorizada, se disponível.")).toBeInTheDocument();
    expect(screen.getByText(/A URL de origem é uma página externa/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar URL de origem como candidata" })).toBeInTheDocument();
  });

  it("informa quando a validação não encontra destino local", async () => {
    vi.mocked(getContentImport).mockResolvedValue({ ...importedItem, validation: { ...importedItem.validation, status: "validated", matches: [] } });
    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Revisar" }));
    expect(await screen.findByText(/Nenhuma correspondência local foi encontrada/)).toBeInTheDocument();
  });

  it("separa verificar correspondências de confirmar revisão administrativa", async () => {
    const pendingItem = { ...importedItem, validation: { status: "pending", tmdbStatus: "validated", tmdbId: 321, tmdbType: "tv", matches: [] } };
    const validatedItem = { ...pendingItem, validation: { ...pendingItem.validation, status: "validated" } };
    vi.mocked(getContentImport).mockResolvedValue(pendingItem);
    vi.mocked(confirmContentImportValidation).mockResolvedValue(validatedItem);
    render(<AdminContentImportsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Revisar" }));
    expect(await screen.findByRole("button", { name: "Verificar correspondências" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar revisão" }));
    expect(await screen.findByText(/Revisão administrativa confirmada/)).toBeInTheDocument();
    expect(confirmContentImportValidation).toHaveBeenCalledWith("import-1", expect.objectContaining({ matchIndex: null, operation: "create" }));
  });
});
