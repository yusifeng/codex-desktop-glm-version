import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClasses, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface BinarySource { contentsBase64?: string | null; cwd?: string | null; environmentId?: string; hostId?: string; isError?: boolean; isLoading?: boolean; kind: "git" | "worktree"; mimeType?: string | null; path?: string; ref?: string }
interface BinaryPreviewResult { dataUrl: string | null; isError: boolean; isLoading: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function mimeFromPath(path: string): string { const extension = path.split(".").pop()?.toLowerCase(); return ({ gif: "image/gif", jpeg: "image/jpeg", jpg: "image/jpeg", pdf: "application/pdf", png: "image/png", svg: "image/svg+xml", webp: "image/webp" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream"; }
function n(source?: BinarySource | null): BinaryPreviewResult { const path = source?.path ?? ""; if (path === "" || path === "/dev/null") return { dataUrl: null, isLoading: false, isError: false }; if (!source?.contentsBase64) return { dataUrl: null, isLoading: source?.isLoading === true, isError: source?.isError === true }; return { dataUrl: `data:${source.mimeType ?? mimeFromPath(path)};base64,${source.contentsBase64}`, isLoading: source.isLoading === true, isError: source.isError === true }; }
function o({ after, before, className, showAfterOnly = false }: { after?: unknown; before?: unknown; className?: string; showAfterOnly?: boolean }): unknown { return jsx().jsx("div", { className: joinClasses("relative overflow-auto", className), children: jsx().jsx("div", { className: joinClasses("grid gap-px", showAfterOnly ? "grid-cols-1" : "grid-cols-2"), children: showAfterOnly ? after : [before, after] }) }); }
function r({ className }: { className?: string }): unknown { return jsx().jsx("div", { className: joinClasses("text-secondary flex items-center gap-2", className), role: "status", children: "Loading preview…" }); }
function i({ children }: { children?: unknown }): unknown { return jsx().jsx("div", { className: "flex min-h-40 flex-col", children: jsx().jsx("div", { className: "flex flex-1 items-center justify-center overflow-auto p-3 text-sm", children }) }); }
function s(): void {}
function a(): void {}
function t(): void {}
export { a, i, n, o, r, s, t };
