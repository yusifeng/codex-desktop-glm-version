function normalizeText(value: unknown): string | undefined {
  const normalized = typeof value === `string` ? value.replace(/\s+/g, ` `).trim() : undefined;
  return normalized == null || normalized.length === 0 ? undefined : normalized;
}

function readTabId(url: URL): string | null {
  const queryTab = normalizeText(url.searchParams.get(`tab`));
  if (queryTab != null) return queryTab;
  const hash = url.hash.startsWith(`#`) ? url.hash.slice(1) : url.hash;
  return normalizeText(new URLSearchParams(hash).get(`tab`)) ?? null;
}

function parseGoogleDocsUrl(value: unknown): { documentId: string; tabId?: string } | null {
  let url: URL;
  try {
    url = new URL(String(value));
  } catch {
    return null;
  }
  if (url.hostname !== `docs.google.com`) return null;
  const parts = url.pathname.split(`/`).filter(Boolean);
  const documentIndex = parts.indexOf(`document`);
  const dIndex = documentIndex === -1 ? -1 : parts.indexOf(`d`, documentIndex + 1);
  const marker = dIndex === -1 ? undefined : parts[dIndex + 1];
  const documentId = marker === `e` && parts[dIndex + 2] === `pub` ? parts[dIndex + 3] : marker;
  if (documentId == null || documentId.length === 0) return null;
  const tabId = readTabId(url);
  return tabId == null ? { documentId } : { documentId, tabId };
}

function parseGoogleSheetsId(value: unknown): string | null {
  let url: URL;
  try {
    url = new URL(String(value));
  } catch {
    return null;
  }
  if (url.hostname !== `docs.google.com`) return null;
  const parts = url.pathname.split(`/`).filter(Boolean);
  const sheetsIndex = parts.indexOf(`spreadsheets`);
  const dIndex = sheetsIndex === -1 ? -1 : parts.indexOf(`d`, sheetsIndex + 1);
  return dIndex === -1 ? null : parts[dIndex + 1] ?? null;
}

function isGoogleDocsOrSheetsUrl(value: unknown): boolean {
  return parseGoogleDocsUrl(value) != null || parseGoogleSheetsId(value) != null;
}

function createGoogleDocsContext(input: { documentTitle?: unknown; pageUrl: unknown; selectedText?: unknown; visibleText?: unknown }) {
  const document = parseGoogleDocsUrl(input.pageUrl);
  if (document == null) return undefined;
  return {
    provider: `google-docs`,
    kind: `google-docs`,
    documentId: document.documentId,
    tabId: document.tabId,
    documentTitle: normalizeText(input.documentTitle),
    selectedText: normalizeText(input.selectedText),
    visibleText: normalizeText(input.visibleText),
  };
}

export { createGoogleDocsContext, isGoogleDocsOrSheetsUrl, normalizeText, parseGoogleDocsUrl, parseGoogleSheetsId, readTabId };
if (typeof module !== `undefined`) module.exports = { createGoogleDocsContext, isGoogleDocsOrSheetsUrl, normalizeText, parseGoogleDocsUrl, parseGoogleSheetsId, readTabId };
