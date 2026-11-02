import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/keyboard-shortcuts-gate";
import "@rchunk/review-file-tree-pane";
import "@rchunk/workspace-file-context-menu-trigger";

interface BreadcrumbProps {
  cwd?: string | null;
  hostId?: string;
  line?: number | null;
  onSelectFile?(path: string, options?: { preview?: boolean }): void;
  onSelectPath?(path: string): void;
  path?: string | null;
  pathActions?: unknown;
  root?: string | null;
  trailingContent?: unknown;
  workspaceRoot?: string | null;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function normalizePath(value: string): string { return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, ""); }
function l(contents: string): number { if (contents === "") return 1; return contents.split(/\r\n|\r|\n/).length; }
function d(line: number, lineCount: number): number {
  const count = Math.max(1, Math.trunc(lineCount));
  const normalized = line < 0 ? count + 1 + Math.trunc(line) : Math.trunc(line);
  return Math.min(Math.max(1, normalized), count);
}
function u(value: string, lineCount = Number.POSITIVE_INFINITY): number | null {
  const match = value.trim().match(/^(?:L|line\s*)?(-?\d+)$/i);
  if (match == null) return null;
  const parsed = Number(match[1]);
  if (!Number.isSafeInteger(parsed) || parsed === 0) return null;
  return Number.isFinite(lineCount) ? d(parsed, lineCount) : parsed;
}
function o(element: HTMLElement, line: number, character: number): boolean {
  const root = element.shadowRoot ?? element;
  const target = root.querySelector<HTMLElement>(`[data-line="${line}"]`);
  if (target == null) return false;
  const characters = [...target.querySelectorAll<HTMLElement>("[data-char]")];
  if (characters.length === 0) return false;
  const offset = Math.max(0, character - 1);
  const selected = characters.find((candidate, index) => {
    const start = Number.parseInt(candidate.dataset.char ?? "", 10);
    const next = Number.parseInt(characters[index + 1]?.dataset.char ?? "", 10);
    return Number.isInteger(start) && start <= offset && (!Number.isInteger(next) || offset < next);
  }) ?? characters.at(-1);
  if (selected == null) return false;
  selected.setAttribute?.("data-character", String(Math.max(1, character)));
  return true;
}
function GoToLine(props: {
  getLineCount?(): number;
  onCancelPreview?(): void;
  onGoToLine?(line: number): void;
  onPreviewLine?(line: number): void;
}): unknown {
  let value = "";
  const resolve = () => u(value, props.getLineCount?.() ?? Number.POSITIVE_INFINITY);
  return jsx().jsxs("form", {
    "aria-label": "Go to line",
    onSubmit: (event: { preventDefault?(): void }) => {
      event.preventDefault?.();
      const line = resolve();
      if (line != null) props.onGoToLine?.(line);
    },
    children: [
      jsx().jsx("input", {
        "aria-label": "Line",
        inputMode: "numeric",
        onChange: (event: { currentTarget: { value: string } }) => {
          value = event.currentTarget.value;
          const line = resolve();
          if (line != null) props.onPreviewLine?.(line);
        },
        type: "text",
      }),
      jsx().jsx("button", { "aria-label": "Close go to line", onClick: () => props.onCancelPreview?.(), type: "button", children: "Close" }),
    ],
  });
}
function FileLanguageSurface(props: {
  children?: unknown;
  isActive?: boolean;
  panelId?: string;
  withContextMenu?: boolean;
}): unknown {
  return jsx().jsx("div", {
    "data-active": props.isActive !== false,
    "data-context-menu": props.withContextMenu === true,
    "data-panel-id": props.panelId,
    children: props.children,
  });
}
function breadcrumb(props: BreadcrumbProps): unknown {
  const path = normalizePath(props.path ?? "");
  const root = normalizePath(props.workspaceRoot ?? props.root ?? props.cwd ?? "");
  const relative = root !== "" && (path === root || path.startsWith(`${root}/`))
    ? path.slice(root.length).replace(/^\//, "")
    : path;
  const segments = relative.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const select = (selectedPath: string) => {
    props.onSelectPath?.(selectedPath);
    props.onSelectFile?.(selectedPath, { preview: true });
  };
  return jsx().jsxs("nav", {
    "aria-label": "File path",
    children: [
      jsx().jsx("ol", {
        children: segments.map((segment, index) => {
          const selectedPath = segments.slice(0, index + 1).join("/");
          const label = index === segments.length - 1 && props.line != null ? `${segment}:${props.line}` : segment;
          return jsx().jsx("li", {
            children: jsx().jsx("button", { onClick: () => select(selectedPath), type: "button", children: label }),
          }, selectedPath);
        }),
      }),
      props.pathActions,
      props.trailingContent,
    ],
  });
}
let coreInitialized = false;
let goToLineInitialized = false;
let languageInitialized = false;
let breadcrumbInitialized = false;
function a(): void { coreInitialized = true; }
function c(): void { if (!goToLineInitialized) { goToLineInitialized = true; a(); } }
function i(): void { if (!languageInitialized) { languageInitialized = true; a(); } }
function n(): void { if (!breadcrumbInitialized) { breadcrumbInitialized = true; a(); c(); i(); } }
const r = FileLanguageSurface;
const s = GoToLine;
const t = breadcrumb;
export { a, c, d, i, l, n, o, r, s, t, u };
