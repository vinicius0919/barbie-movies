import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContentImportStatusBadge from "../src/components/ContentImportStatusBadge";

describe("ContentImportStatusBadge", () => {
  it("traduz status técnicos de processamento", () => {
    render(<ContentImportStatusBadge value="processed" />);
    expect(screen.getByText("Processado")).toBeInTheDocument();
  });

  it("traduz status de validação", () => {
    render(<ContentImportStatusBadge value="unreviewed" kind="validation" />);
    expect(screen.getByText("Não revisado")).toBeInTheDocument();
  });
});
