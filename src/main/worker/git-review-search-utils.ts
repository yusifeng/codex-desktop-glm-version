export function formatReviewSearchPath(change: { oldPath: string; newPath: string }): string {
  return change.oldPath === change.newPath ? change.newPath : `${change.oldPath} -> ${change.newPath}`;
}
export function buildSearchSnippet(text: string, start: number, end: number, context = 30) {
  return { before: text.slice(Math.max(0, start - context), start), match: text.slice(start, end), after: text.slice(end, Math.min(text.length, end + context)) };
}
export function findCaseInsensitiveOffsets(text: string, query: string, limit: number) {
  const lowerText = text.toLowerCase(), lowerQuery = query.toLowerCase(), offsets = [] as { start: number; end: number }[];
  let cursor = 0, totalMatches = 0, isCapped = false;
  while (cursor < lowerText.length) {
    const start = lowerText.indexOf(lowerQuery, cursor);
    if (start === -1) break;
    const end = start + query.length; totalMatches++;
    if (offsets.length < limit) offsets.push({ start, end }); else isCapped = true;
    cursor = end;
  }
  return { offsets, totalMatches, isCapped };
}
export function createLineDecoder(onLine: (line: string) => void) {
  const decoder = new TextDecoder(); let pending = ``;
  return (chunk: Uint8Array) => {
    pending += decoder.decode(chunk, { stream: true });
    for (;;) { const index = pending.indexOf(`\n`); if (index === -1) break; const line = pending.slice(0, index); pending = pending.slice(index + 1); onLine(line); }
  };
}
if (typeof module !== `undefined`) module.exports = { formatReviewSearchPath, buildSearchSnippet, findCaseInsensitiveOffsets, createLineDecoder };
