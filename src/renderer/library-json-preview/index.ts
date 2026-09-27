import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/codemirror-view-runtime";
import "@rchunk/codemirror-json-runtime";
import "@rchunk/chatgpt-code-block-highlighting";

export interface LibraryJsonPreviewProps { content: string; fileName: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function LibraryJsonPreview({ content, fileName }: LibraryJsonPreviewProps): unknown {
  let valid = true;
  try { JSON.parse(content); } catch { valid = false; }
  return jsx().jsxs("section", { "aria-label": `${fileName} JSON preview`, "data-json-valid": valid, onKeyDown: (event: { stopPropagation(): void }) => event.stopPropagation(), children: [
    jsx().jsxs("header", { children: [jsx().jsx("span", { children: fileName }), jsx().jsx("span", { role: "status", children: valid ? "Valid JSON" : "Invalid JSON" })] }),
    jsx().jsx("pre", { tabIndex: 0, children: jsx().jsx("code", { "data-language": "json", children: content }) }),
  ] });
}
export { LibraryJsonPreview };
