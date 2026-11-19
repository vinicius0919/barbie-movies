function randomHex(bytes) {
  const values = new Uint8Array(bytes);
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(values);
    return [...values].map((value) => value.toString(16).padStart(2, "0")).join("");
  }
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

/** Identificador operacional; não é credencial nem mecanismo de autenticação. */
export function createBatchId() {
  try {
    const uuid = globalThis.crypto?.randomUUID;
    if (typeof uuid === "function") return uuid.call(globalThis.crypto);
  } catch {
    // Continua com o fallback compatível abaixo.
  }
  return `miqflix-batch-${Date.now().toString(36)}-${randomHex(12)}`;
}
