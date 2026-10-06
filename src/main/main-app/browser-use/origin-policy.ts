/** Pure browser-use origin normalization; config/state I/O remains in origin-state.ts. */
export function normalizeBrowserUseOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol !== "http:" && url.protocol !== "https:" ? null : url.origin;
  } catch {
    return null;
  }
}

if (typeof module !== "undefined") module.exports = { normalizeBrowserUseOrigin };
