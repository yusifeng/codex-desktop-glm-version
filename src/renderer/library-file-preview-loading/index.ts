import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function LibraryFilePreviewLoading(): unknown { return jsx().jsxs("div", { className: "library-file-preview-loading", children: [jsx().jsx("span", { "aria-hidden": true, children: "…" }), jsx().jsx("div", { role: "status", children: "Loading" })] }); }
function initialize(): void {}
export { initialize as n, LibraryFilePreviewLoading as t };
