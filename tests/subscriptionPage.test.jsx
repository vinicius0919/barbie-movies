import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("../src/services/api", () => ({
  subscriptionApi: {
    plans: vi.fn(),
    access: vi.fn(),
    checkout: vi.fn(),
  },
}));

import SubscriptionPage from "../src/pages/SubscriptionPage";
import { subscriptionApi } from "../src/services/api";

function renderPage() {
  return render(
    <MemoryRouter>
      <SubscriptionPage />
    </MemoryRouter>
  );
}

describe("SubscriptionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionApi.access.mockResolvedValue({ hasAccess: false });
  });

  it("renderiza benefícios na ordem recebida pela API", async () => {
    subscriptionApi.plans.mockResolvedValue([
      {
        id: "plan-1",
        name: "Plano teste",
        amount: 9.9,
        currency: "BRL",
        billingType: "fixed",
        intervalDays: 30,
        benefits: ["Primeiro benefício", "Segundo benefício"],
      },
    ]);

    renderPage();

    const first = await screen.findByText("Primeiro benefício");
    const second = screen.getByText("Segundo benefício");

    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("exibe estado vazio quando o plano não possui benefícios", async () => {
    subscriptionApi.plans.mockResolvedValue([
      {
        id: "plan-legacy",
        name: "Plano legado",
        amount: 9.9,
        currency: "BRL",
        billingType: "fixed",
        intervalDays: 30,
      },
    ]);

    renderPage();

    expect(
      await screen.findByText("Benefícios não informados para este plano.")
    ).toBeInTheDocument();
  });
});
