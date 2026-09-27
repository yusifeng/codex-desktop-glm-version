import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/library-cloud-file-preview";
import "@rchunk/cloud-file-preview";
interface SearchFilePreviewProps { accountId: string; authenticatedAccountId: string; item: { cloudFile: { name: string }; [key: string]: unknown }; onClose(): void; renderPreview?(item: SearchFilePreviewProps["item"]): unknown; sessionReady?: boolean; userId: string; authenticatedUserId?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ChatGptSearchFilePreview(props: SearchFilePreviewProps): unknown { if (props.accountId !== props.authenticatedAccountId || (props.authenticatedUserId != null && props.userId !== props.authenticatedUserId) || props.sessionReady === false) return null; return jsx().jsxs("section", { role: "dialog", "aria-modal": true, "aria-label": props.item.cloudFile.name, children: [jsx().jsx("h2", { className: "sr-only", children: props.item.cloudFile.name }), props.renderPreview?.(props.item) ?? jsx().jsx("div", { children: "File preview" }), jsx().jsx("button", { type: "button", onClick: props.onClose, children: "Close" })] }); }
export { ChatGptSearchFilePreview };
