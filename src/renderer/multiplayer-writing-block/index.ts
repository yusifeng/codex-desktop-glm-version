import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/writing-block-surface";
import "@rchunk/multiplayer-document-runtime";
interface MultiplayerWritingBlockProps { content?: string | null; name?: string; onOpen?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function MultiplayerWritingBlock({ content = null, name = "Note", onOpen }: MultiplayerWritingBlockProps): unknown { return jsx().jsxs("article", { "aria-label": name, children: [jsx().jsx("p", { children: content ?? "" }), jsx().jsx("button", { onClick: onOpen, type: "button", children: "Open note" })] }); }
export { MultiplayerWritingBlock };
