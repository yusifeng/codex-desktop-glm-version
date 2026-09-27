import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";

const React = getReactRuntime();
const jsx = getJsxRuntime();
type EditorFactory = (element: HTMLElement, options: unknown, state: unknown) => unknown;

function useStableCallback<Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result): (...arguments_: Arguments) => Result {
  const reference = React.useRef(callback);
  React.useInsertionEffect?.(() => { reference.current = callback; });
  return React.useCallback?.((...arguments_: Arguments) => reference.current(...arguments_), []) ?? callback;
}

const editorFactoryContext = React.createContext<EditorFactory | undefined>(undefined);
const diffRuntimeContext = React.createContext<unknown>(undefined);

interface DiffEditorProviderProps { children?: unknown; createEditor: EditorFactory; }
function DiffEditorProvider({ children, createEditor }: DiffEditorProviderProps): unknown {
  const stableFactory = useStableCallback((element: HTMLElement, options: unknown, state: unknown) => createEditor(element, options, state));
  return jsx.jsx(editorFactoryContext.Provider, { value: stableFactory, children });
}
function useDiffEditorFactory(): EditorFactory | undefined { return React.useContext(editorFactoryContext); }
function EmptyDiffOverlay(): null { return null; }

const diffOverlayStyle = { position: "absolute", top: 0, bottom: 0, textAlign: "center", whiteSpace: "normal", touchAction: "none" } as const;
const displayContentsStyle = { display: "contents" } as const;

function renderDeclarativeShadowRoot(children: unknown, shadowHtml?: string | null): unknown {
  return typeof window === "undefined" && shadowHtml != null
    ? jsx.jsxs(jsx.Fragment, { children: [
        jsx.jsx("template", { shadowrootmode: "open", dangerouslySetInnerHTML: { __html: shadowHtml } }),
        children,
      ] })
    : jsx.jsx(jsx.Fragment, { children });
}
function useDiffRuntime(): unknown { return React.useContext(diffRuntimeContext); }

const normalSurface = "var(--color-surface)";
const diffSurface = "var(--color-codex-diff-surface)";
const diffCssVariables = `
  --codex-diffs-surface: ${normalSurface};
  --codex-diffs-context-surface: color-mix(in srgb, var(--codex-diffs-surface) 94%, var(--color-surface));
  --codex-diffs-separator-surface: color-mix(in srgb, var(--codex-diffs-surface) 94%, var(--color-text-info));
  --codex-diffs-hover-surface: color-mix(in srgb, var(--codex-diffs-surface) 92%, var(--color-surface));
  --codex-diffs-header-surface: var(--codex-diffs-surface);
  --codex-diffs-context-number: color-mix(in lab, var(--codex-diffs-surface) 98.5%, var(--diffs-mixer));
  --codex-diffs-addition-number: light-dark(color-mix(in lab, var(--diffs-light-bg, #fff) 91%, var(--diffs-addition-base)), color-mix(in lab, var(--diffs-dark-bg, #000) 85%, var(--diffs-addition-base)));
  --codex-diffs-deletion-number: light-dark(color-mix(in lab, var(--diffs-light-bg, #fff) 91%, var(--diffs-deletion-base)), color-mix(in lab, var(--diffs-dark-bg, #000) 85%, var(--diffs-deletion-base)));
  --codex-diffs-addition-hover: light-dark(color-mix(in lab, var(--diffs-light-bg, #fff) 80%, var(--diffs-addition-base)), color-mix(in lab, var(--diffs-dark-bg, #000) 70%, var(--diffs-addition-base)));
  --codex-diffs-deletion-hover: light-dark(color-mix(in lab, var(--diffs-light-bg, #fff) 80%, var(--diffs-deletion-base)), color-mix(in lab, var(--diffs-dark-bg, #000) 75%, var(--diffs-deletion-base)));
  --diffs-dark: var(--color-text);
  --diffs-light: var(--color-text);
  --diffs-bg-context-override: var(--codex-diffs-context-surface);
  --diffs-bg-separator-override: var(--codex-diffs-separator-surface);
  --diffs-bg-hover-override: var(--codex-diffs-hover-surface);
`;

interface DiffCssOptions {
  alignCommentGutter?: boolean;
  includeDiffHeader?: boolean;
  includeSimpleLineSeparators?: boolean;
  rootSelector: string;
  surface: string;
  useReviewLineInfoSeparators?: boolean;
}

function createCodexDiffCss({ alignCommentGutter = false, includeDiffHeader = false, includeSimpleLineSeparators = false, rootSelector, surface, useReviewLineInfoSeparators = false }: DiffCssOptions): string {
  const surfaceSelector = includeDiffHeader ? `[data-diffs-header],\n  ${rootSelector}` : rootSelector;
  const simpleSeparators = includeSimpleLineSeparators ? `
  :host(.composer-diff-simple-line) [data-separator]:empty { background-color: transparent; }
  :host(.composer-diff-simple-line) [data-separator]:empty::after {
    content: ""; grid-column: 2 / 3; align-self: center; margin-inline: 1ch;
    border-top: 1px solid color-mix(in srgb, var(--diffs-fg) 18%, transparent);
  }` : "";
  const commentGutter = alignCommentGutter ? `\n  ${rootSelector} [data-column-number] { padding-inline-start: calc(var(--spacing) * 10); }` : "";
  const reviewSeparators = useReviewLineInfoSeparators ? `
  ${rootSelector} [data-separator='line-info'] [data-expand-button] {
    border-inline-end: 1px solid var(--diffs-bg); border-start-start-radius: 8px; border-end-start-radius: 8px;
  }
  ${rootSelector} [data-unified] [data-separator='line-info'] [data-separator-wrapper] {
    grid-template-columns: var(--diffs-column-number-width) minmax(0, 1fr); padding-inline: 2px;
  }
  ${rootSelector} [data-deletions] [data-content] [data-separator='line-info'] [data-expand-button] { display: none; }
  ${rootSelector} [data-additions] [data-content] [data-separator='line-info'] [data-separator-wrapper] {
    border-start-end-radius: 8px; border-end-end-radius: 8px;
  }` : "";
  return `
  ${surfaceSelector} {
    ${diffCssVariables}
    --diffs-bg: ${surface} !important;
    background-color: ${surface} !important;
  }
  ${rootSelector} [data-code] { scrollbar-gutter: auto; }
  ${rootSelector} [data-language-symbol-highlight] { background-color: var(--color-background-primary-ghost-hover) !important; }
  ${rootSelector} [data-utility-button] { background-color: var(--color-text); color: var(--color-surface-secondary); border: none; border-radius: 4px; margin-right: 0; }
  ${rootSelector} [data-line-type='change-addition']:is([data-line], [data-no-newline]) { --diffs-computed-diff-line-bg: var(--diffs-bg-addition); }
  ${rootSelector} [data-line-type='change-deletion']:is([data-line], [data-no-newline]) { --diffs-computed-diff-line-bg: var(--diffs-bg-deletion); }
  ${rootSelector} [data-line-type='change-addition']:is([data-column-number], [data-gutter-buffer]) { --diffs-computed-diff-line-bg: var(--codex-diffs-addition-number); }
  ${rootSelector} [data-line-type='change-deletion']:is([data-column-number], [data-gutter-buffer]) { --diffs-computed-diff-line-bg: var(--codex-diffs-deletion-number); }
  [data-placeholder][data-loading] { position: relative; overflow: hidden; background-size: calc(100% - 24px) 22px; }
  [data-placeholder][data-loading]::before { content: ""; position: absolute; inset: 8px 12px; animation: codex-diffs-placeholder-shimmer 3000ms linear infinite; }
  @media (prefers-reduced-motion: reduce) { [data-placeholder][data-loading]::before { animation: none; } }
  @keyframes codex-diffs-placeholder-shimmer { to { transform: translateX(100%); } }
  ${reviewSeparators}
  ${commentGutter}
  ${simpleSeparators}`;
}

function resolveDiffSurface(usePrimarySurface: boolean, kind: string): string {
  return usePrimarySurface ? (kind === "diff" ? diffSurface : normalSurface) : "var(--color-surface-secondary)";
}
function initializeStableCallback(): void {}
function initializeDiffEditorContext(): void {}
function initializeDiffOverlayStyles(): void {}
function initializeDeclarativeShadowRoot(): void {}
function initializeDiffRuntimeContext(): void {}
function initializeCodexDiffCss(): void {}

export { useStableCallback as _, initializeDiffRuntimeContext as a, renderDeclarativeShadowRoot as c, initializeDiffOverlayStyles as d, EmptyDiffOverlay as f, initializeStableCallback as g, useDiffEditorFactory as h, diffRuntimeContext as i, diffOverlayStyle as l, initializeDiffEditorContext as m, createCodexDiffCss as n, useDiffRuntime as o, DiffEditorProvider as p, initializeCodexDiffCss as r, initializeDeclarativeShadowRoot as s, resolveDiffSurface as t, displayContentsStyle as u };
