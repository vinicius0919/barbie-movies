import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BulkSelectionToolbar from "../src/components/BulkSelectionToolbar";

function Harness() {
  const [first, setFirst] = useState(new Set(["a", "b"]));
  const [second, setSecond] = useState(new Set());
  return <>
    <BulkSelectionToolbar selected={first} setSelected={setFirst} visibleIds={["a", "b"]} />
    <BulkSelectionToolbar selected={second} setSelected={setSecond} visibleIds={["x", "y"]} />
    <output data-testid="first">{[...first].join(",")}</output>
    <output data-testid="second">{[...second].join(",")}</output>
  </>;
}

describe("BulkSelectionToolbar", () => {
  it("mantém seleções independentes, seleciona todos e limpa a seção", () => {
    render(<Harness />);
    const toggles = screen.getAllByRole("checkbox");
    fireEvent.click(toggles[0]);
    expect(screen.getByTestId("first")).toHaveTextContent("");
    fireEvent.click(toggles[0]);
    expect(screen.getByTestId("first")).toHaveTextContent("a,b");
    fireEvent.click(toggles[1]);
    expect(screen.getByTestId("second")).toHaveTextContent("x,y");
    fireEvent.click(screen.getAllByRole("button", { name: "Desmarcar todos" })[0]);
    expect(screen.getByTestId("first")).toHaveTextContent("");
    expect(screen.getByTestId("second")).toHaveTextContent("x,y");
  });
});
