import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/keyboard-shortcuts-gate";
import "@rchunk/review-file-tree-pane";
import "@rchunk/workspace-file-context-menu-trigger";

interface BreadcrumbProps { path?: string | null; root?: string | null; line?: number | null; onSelectPath?(path: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function normalizePath(value: string): string { return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, ""); }
function l(contents: string): number { if (contents === "") return 1; return contents.split(/\r\n|\r|\n/).length; }
function d(line: number, lineCount: number): number { return Math.max(1, Math.min(Math.trunc(line), Math.max(1, lineCount))); }
function u(value: string, lineCount = Number.POSITIVE_INFINITY): number | null { const match = value.trim().match(/^(?:L|line\s*)?(\d+)$/i); return match == null ? null : d(Number(match[1]), lineCount); }
function o(element: HTMLElement, line: number, character: number): boolean { const target = element.querySelector<HTMLElement>(`[data-line="${line}"]`); if (target == null) return false; target.scrollIntoView({ block: "center" }); target.focus?.(); target.setAttribute("data-character", String(Math.max(1, character))); return true; }
function breadcrumb({ path = "", root = null, line = null, onSelectPath }: BreadcrumbProps): unknown { const normalized = normalizePath(path); const relative = root == null ? normalized : normalized.startsWith(`${normalizePath(root)}/`) ? normalized.slice(normalizePath(root).length + 1) : normalized; const segments = relative.split("/").filter(Boolean); return jsx().jsx("nav", { "aria-label": "File path", children: segments.map((segment, index) => { const selectedPath = segments.slice(0, index + 1).join("/"); return jsx().jsx("button", { onClick: () => onSelectPath?.(selectedPath), type: "button", children: index === segments.length - 1 && line != null ? `${segment}:${line}` : segment }, selectedPath); }) }); }
const r = breadcrumb;
const s = breadcrumb;
const t = breadcrumb;
function a(): void {}
function c(): void {}
function i(): void {}
function n(): void {}
export { a, c, d, i, l, n, o, r, s, t, u };
