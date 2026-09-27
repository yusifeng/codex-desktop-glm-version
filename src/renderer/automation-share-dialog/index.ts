import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/share-analytics";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Props { automationName?: string; isPending?: boolean; onClose(): void; onCopy?(link: string): void; onDelete?(): void; onRefresh?(): void; shareLink?: string | null }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ScheduledTaskShareDialog({ automationName, isPending = false, onClose, onCopy, onDelete, onRefresh, shareLink }: Props): unknown { return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: `Share ${automationName ?? "scheduled task"}` }), shareLink == null ? jsx().jsx("p", { children: "Create a link to share this scheduled task" }) : jsx().jsx("input", { readOnly: true, "aria-label": "Share link", value: shareLink }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Close" }), shareLink == null ? null : jsx().jsx("button", { type: "button", disabled: isPending, onClick: () => onCopy?.(shareLink), children: "Copy link" }), jsx().jsx("button", { type: "button", disabled: isPending, onClick: onRefresh, children: shareLink == null ? "Create link" : "Refresh link" }), shareLink == null ? null : jsx().jsx("button", { type: "button", disabled: isPending, onClick: onDelete, children: "Delete link" })] }); }
export { ScheduledTaskShareDialog };
