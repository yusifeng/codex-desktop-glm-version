import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/preview-layout";
import "@rchunk/library-file-preview-loading";
import "@rchunk/multiplayer-document-runtime";
interface MultiplayerNoteProps { content?: string | null; error?: string | null; isLoading?: boolean; name?: string; onClose(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function MultiplayerNote({ content = null, error = null, isLoading = false, name = "Note", onClose }: MultiplayerNoteProps): unknown { return jsx().jsxs("section", { "aria-label": name, children: [jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" }), isLoading ? jsx().jsx("div", { role: "status", children: "Loading note" }) : error != null ? jsx().jsx("div", { role: "alert", children: error }) : jsx().jsx("article", { children: content ?? "" })] }); }
export { MultiplayerNote };
