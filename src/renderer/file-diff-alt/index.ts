import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/file-diff-presentation-core";
import "@rchunk/register-pierre-themes";
import "@rchunk/virtualized-file-diff-line-position";
import "@rchunk/shiki-highlight-provider";
const jsx = getJsxRuntime();
function HighlightProvider({ children }: { children?: unknown }): unknown { return jsx.jsx("div", { "data-highlight-provider": true, children }); }
function FileDiff({ alignCommentGutter = false, fileDiff, lineDiffType, ...props }: { alignCommentGutter?: boolean; fileDiff: unknown; lineDiffType?: string; [key: string]: unknown }): unknown { return jsx.jsx(HighlightProvider, { children: jsx.jsx("div", { ...props, "data-align-comment-gutter": alignCommentGutter, "data-line-diff-type": lineDiffType, "data-testid": "file-diff", children: fileDiff }) }); }
function initializeHighlightProvider(): void { getReactRuntime(); }
function initializeFileDiff(): void { initializeHighlightProvider(); }
export { initializeHighlightProvider as i, initializeFileDiff as n, HighlightProvider as r, FileDiff as t };
