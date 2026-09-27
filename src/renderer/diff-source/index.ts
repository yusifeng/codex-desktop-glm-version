import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/highlight-selectors";
import "@rchunk/scroll-to-match";

interface DiffLineSpan { end: number; lineEnd: number; lineStart: number; side?: "left" | "right" | "unified"; start: number }
interface DiffHunk { hunkId: string; lineEnd: number; lineMapping?: string; lineSpans?: DiffLineSpan[]; lineStart: number; text: string }
interface DiffFile { hunks: DiffHunk[]; path: string }
interface DiffSearchRequest { contextId: string; domain: string; query: string }
interface DiffSearchLocation { contextId: string; domain: "diff"; end: number; hunkId: string; lineEnd: number; lineStart: number; path: string; side?: "left" | "right" | "unified"; start: number }
interface DiffScrollAdapter { getFileContainer(path: string): Element | null; scrollToFile(path: string, options?: { signal?: AbortSignal }): Promise<void> | void; scrollToLocation?(location: DiffSearchLocation, options?: { signal?: AbortSignal }): Promise<void> | void }
const MAX_MATCHES = 250;

function countNewlines(value: string): number { let count = 0; for (const character of value) if (character === "\n") count++; return count; }
function locateMatch(hunk: DiffHunk, start: number, end: number): { lineEnd: number; lineStart: number; side?: "left" | "right" | "unified" } {
  const first = hunk.lineSpans?.find(span => start >= span.start && start < span.end);
  if (first != null) { const lastOffset = Math.max(start, end - 1); const last = hunk.lineSpans?.find(span => lastOffset >= span.start && lastOffset < span.end) ?? first; return { lineStart: first.lineStart, lineEnd: last.lineEnd, ...(first.side != null && first.side === last.side ? { side: first.side } : {}) }; }
  if (hunk.lineMapping !== "contiguous") return { lineStart: hunk.lineStart, lineEnd: hunk.lineEnd };
  const lineStart = hunk.lineStart + countNewlines(hunk.text.slice(0, start));
  return { lineStart, lineEnd: lineStart + countNewlines(hunk.text.slice(start, end)) };
}
function searchFiles(request: DiffSearchRequest, files: DiffFile[]) { const query = request.query.trim(); const matches: Array<{ id: string; location: DiffSearchLocation; ordinal: number; snippet: string }> = []; let totalMatches = 0; if (query !== "") for (const file of files) for (const hunk of file.hunks) { let offset = 0; while ((offset = hunk.text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), offset)) !== -1) { totalMatches++; const end = offset + query.length; if (matches.length < MAX_MATCHES) { const lines = locateMatch(hunk, offset, end); matches.push({ id: `diff:${file.path}:${hunk.hunkId}:${offset}`, ordinal: matches.length + 1, location: { domain: "diff", contextId: request.contextId, path: file.path, hunkId: hunk.hunkId, start: offset, end, ...lines }, snippet: hunk.text.slice(Math.max(0, offset - 40), Math.min(hunk.text.length, end + 40)) }); } offset = end || offset + 1; } } return { domain: request.domain, contextId: request.contextId, query, matches, totalMatches, isCapped: totalMatches > matches.length }; }
function t({ contextId, getFiles, preserveScrollBeforeResultClear, scrollAdapter }: { contextId: string; getFiles(): DiffFile[]; preserveScrollBeforeResultClear?: boolean; scrollAdapter: DiffScrollAdapter }) { return { domain: "diff" as const, contextId, preserveScrollBeforeResultClear, async search(request: DiffSearchRequest) { return searchFiles(request, request.query.trim() === "" ? [] : getFiles()); }, async ensureVisible(location: DiffSearchLocation, options?: { signal?: AbortSignal }) { if (location.domain !== "diff" || location.contextId !== contextId || options?.signal?.aborted) return; let container = scrollAdapter.getFileContainer(location.path); if (container == null) { await scrollAdapter.scrollToFile(location.path, options); if (options?.signal?.aborted) return; await scrollAdapter.scrollToLocation?.(location, options); container = scrollAdapter.getFileContainer(location.path); } container?.querySelector(`[data-line="${location.lineStart}"]`)?.scrollIntoView({ block: "center" }); } }; }
function i({ path, skipFindHighlight = false }: { path: string; skipFindHighlight?: boolean }): (element: Element | null) => void { return element => { if (element == null) return; element.setAttribute("data-diff-path", path); if (skipFindHighlight) element.setAttribute("data-skip-find-highlight", "true"); }; }
function n(): void {}
function r(): void {}
export { i, n, r, t };
