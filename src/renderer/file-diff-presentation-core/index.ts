import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-diff-css";
import "@rchunk/register-pierre-themes";
import "@rchunk/diff-worker-runtime";
import "@rchunk/diff-worker-algorithm";
import "@rchunk/diff-worker-model";
import "@rchunk/diff-worker-renderer";
import "@rchunk/diff-worker-utils";
const jsx = getJsxRuntime();
function useDiffPresentationOptions({ diffStyle = "unified", lineDiffType = "word" }: { diffStyle?: string; lineDiffType?: string } = {}) { return { diffStyle, lineDiffType, hunkSeparators: "simple" }; }
function initializeDiffWorkerRuntime(): void {}
function initializeDiffPresentation(): void {}
function FileDiffPresentation({ fileDiff, diffStyle = "unified", lineDiffType = "word", hunkSeparators = "simple", onPostRender, ...props }: { fileDiff: unknown; diffStyle?: string; lineDiffType?: string; hunkSeparators?: string; onPostRender?(): void; [key: string]: unknown }): unknown { onPostRender?.(); return jsx.jsx("pre", { ...props, "data-diff-style": diffStyle, "data-line-diff-type": lineDiffType, "data-hunk-separators": hunkSeparators, children: typeof fileDiff === "string" ? fileDiff : JSON.stringify(fileDiff) }); }
export { useDiffPresentationOptions as i, initializeDiffPresentation as n, initializeDiffWorkerRuntime as r, FileDiffPresentation as t };
