import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminImportsSectionNav from "../src/components/AdminImportsSectionNav";

describe("AdminImportsSectionNav", () => {
  it("expõe navegação acessível para as três áreas", () => {
    render(<AdminImportsSectionNav activeSection="import" onChange={() => {}} />);
    expect(screen.getByRole("tablist", { name: /seções da central/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Importar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Revisar" })).toHaveAttribute("aria-controls", "admin-imports-review");
    expect(screen.getByRole("tab", { name: "Histórico" })).toHaveAttribute("aria-controls", "admin-imports-history");
  });
});
