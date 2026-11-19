export const MAX_HTML_BYTES = 5 * 1024 * 1024;

export function getUtf8ByteLength(value) {
  if (typeof value !== "string") return 0;
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return new Blob([value]).size;
}

export function formatImportSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImportText(value) {
  if (typeof value !== "string") return { valid: false, bytes: 0, error: "O conteúdo precisa ser texto." };
  const bytes = getUtf8ByteLength(value);
  if (bytes > MAX_HTML_BYTES) {
    return {
      valid: false,
      bytes,
      error: `O conteúdo tem ${formatImportSize(bytes)} e excede o limite de 5 MB. Reduza o arquivo ou divida a importação.`,
    };
  }
  return { valid: true, bytes, error: "" };
}

export async function readImportFile(file) {
  if (!file) throw new Error("Nenhum arquivo foi selecionado.");
  if (file.size > MAX_HTML_BYTES) {
    throw new Error(`O arquivo tem ${formatImportSize(file.size)} e excede o limite de 5 MB.`);
  }
  const text = typeof file.text === "function"
    ? await file.text()
    : await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("não foi possível ler o arquivo."));
      reader.readAsText(file);
    });
  const validation = validateImportText(text);
  if (!validation.valid) throw new Error(validation.error);
  if (!text.trim()) throw new Error("O arquivo está vazio.");
  return { text, bytes: validation.bytes };
}
