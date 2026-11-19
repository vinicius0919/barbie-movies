import { afterEach, describe, expect, it, vi } from "vitest";
import { createBatchId } from "../src/utils/batchId";

afterEach(() => vi.unstubAllGlobals());

describe("createBatchId", () => {
  it("usa randomUUID quando disponível", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "uuid-de-teste") });
    expect(createBatchId()).toBe("uuid-de-teste");
  });

  it("gera identificador compatível sem randomUUID", () => {
    vi.stubGlobal("crypto", {});
    const id = createBatchId();
    expect(id).toMatch(/^miqflix-batch-[a-z0-9-]+$/);
    expect(id.length).toBeLessThanOrEqual(100);
  });

  it("funciona sem crypto global", () => {
    vi.stubGlobal("crypto", undefined);
    expect(createBatchId()).toMatch(/^miqflix-batch-/);
  });
});
