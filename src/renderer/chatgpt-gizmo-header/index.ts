import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/gpt-report-menu-item";
import "@rchunk/gpt-header-about-dialog";

export interface ChatGptGizmo { id: string; name: string; canWrite?: boolean; isMigratedPlugin?: boolean; isPinned?: boolean }
export interface ChatGptGizmoHeaderProps { conversationId?: string | null; gizmo?: ChatGptGizmo | null; gizmoId: string; onAbout?(gizmo: ChatGptGizmo): void; onEdit?(gizmo: ChatGptGizmo): void; onPinChange?(gizmo: ChatGptGizmo, pinned: boolean): Promise<void> | void; onReport?(gizmo: ChatGptGizmo): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function ChatGptGizmoHeader(props: ChatGptGizmoHeaderProps): unknown {
  const gizmo = props.gizmo;
  if (gizmo == null) return null;
  const name = gizmo.name.trim();
  return jsx().jsxs("div", { className: "flex min-w-0 items-center gap-1", "data-gizmo-id": props.gizmoId, children: [
    name === "" ? null : jsx().jsx("span", { className: "truncate", children: name }),
    jsx().jsx(ChatGptGizmoActions, { ...props, gizmo }),
  ] });
}

function ChatGptGizmoActions({ gizmo, onAbout, onEdit, onPinChange, onReport }: ChatGptGizmoHeaderProps & { gizmo: ChatGptGizmo }): unknown {
  const view = jsx();
  return view.jsxs("details", { className: "gizmo-actions", children: [
    view.jsx("summary", { "aria-label": "GPT actions", children: "•••" }),
    view.jsx("button", { type: "button", onClick: () => onAbout?.(gizmo), children: "About" }),
    view.jsx("button", { type: "button", onClick: () => onPinChange?.(gizmo, !gizmo.isPinned), children: gizmo.isPinned ? "Unpin GPT" : "Pin GPT" }),
    gizmo.canWrite === true && gizmo.isMigratedPlugin !== true ? view.jsx("button", { type: "button", onClick: () => onEdit?.(gizmo), children: "Edit GPT" }) : null,
    view.jsx("button", { type: "button", onClick: () => onReport?.(gizmo), children: "Report GPT" }),
  ] });
}
function initializeChatGptGizmoHeader(): void { jsx(); void Button; }
export { ChatGptGizmoHeader as n, initializeChatGptGizmoHeader as r, ChatGptGizmoActions as t };
