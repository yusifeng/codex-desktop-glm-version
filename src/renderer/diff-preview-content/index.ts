import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/register-pierre-themes";
import { t as FileDiff } from "@rchunk/file-diff-alt";
const jsx = getJsxRuntime();
const React = getReactRuntime();
function DiffHighlightPreloader({ fileDiff }: { fileDiff: unknown }): unknown { return jsx.jsx("span", { hidden: true, "data-preload-diff": true, children: JSON.stringify(fileDiff) }); }
function DiffPreviewContent({ diff, displayPath, linesAdded = 0, linesRemoved = 0, onOpen }: { diff: { metadata?: unknown }; displayPath?: string; linesAdded?: number; linesRemoved?: number; onOpen?(event?: unknown): void }): unknown { const [rendered, setRendered] = React.useState(false); const keyDown = (event: { key: string; preventDefault(): void }) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen?.(event); } }; return jsx.jsxs("div", { className: rendered ? "diff-preview" : "diff-preview invisible", role: onOpen ? "button" : undefined, tabIndex: onOpen ? 0 : undefined, onClick: onOpen, onKeyDown: keyDown, children: [jsx.jsxs("header", { children: [jsx.jsx("span", { children: displayPath }), jsx.jsx("span", { children: `+${linesAdded} −${linesRemoved}` })] }), jsx.jsx("div", { "data-testid": "diff-preview-scroll", children: jsx.jsx(FileDiff, { fileDiff: diff.metadata, onPostRender: () => setRendered(true) }) })] }); }
export { DiffHighlightPreloader, DiffPreviewContent };
