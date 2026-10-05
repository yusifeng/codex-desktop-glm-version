export function formatReviewSearchPath(change: { oldPath: string; newPath: string }): string {
  return change.oldPath === change.newPath ? change.newPath : `${change.oldPath} -> ${change.newPath}`;
}
export function createLineDecoder(onLine: (line: string) => void) {
  const decoder = new TextDecoder(); let pending = ``;
  return (chunk: Uint8Array) => {
    pending += decoder.decode(chunk, { stream: true });
    for (;;) { const index = pending.indexOf(`\n`); if (index === -1) break; const line = pending.slice(0, index); pending = pending.slice(index + 1); onLine(line); }
  };
}
if (typeof module !== `undefined`) module.exports = { formatReviewSearchPath, buildSearchSnippet, findCaseInsensitiveOffsets, createLineDecoder };
import { findCaseInsensitiveOffsets } from "./git-review-search-policy";
import { buildSearchSnippet } from "./git-review-snippet-policy";
