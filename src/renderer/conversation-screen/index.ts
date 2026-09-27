import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export interface SeatAccessState {
  accountId?: string;
  canSwitchToWork?: boolean;
  email?: string;
  isCapable?: boolean;
  isLoading?: boolean;
  status?: "allowed" | "restricted" | "unknown";
  userId?: string;
}
export interface SeatAccessScreenProps extends SeatAccessState { modeToggle?: unknown; onRequestAccess?(): void; onSwitchToWork?(): void }
export interface SeatAccessGateProps extends SeatAccessState { children?: unknown; enabled?: boolean; modeToggle?: unknown; onRequestAccess?(): void; onSwitchToWork?(): void }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function ChatSeatAccessScreen(props: SeatAccessScreenProps = {}): unknown {
  if (props.status !== "restricted") return null;
  const view = jsx();
  return view.jsxs(view.Fragment, { children: [
    props.modeToggle == null ? null : view.jsx("div", { className: "chat-mode-toggle", children: props.modeToggle }),
    view.jsxs("main", { className: "flex h-full min-h-0 flex-1 items-center justify-center px-panel", children: [
      view.jsxs("div", { className: "flex max-w-3xl flex-col items-center gap-8 text-center", children: [
        view.jsx("h1", { children: "You don’t have access to Chat on this plan" }),
        props.email == null ? null : view.jsx("p", { children: props.email }),
        view.jsxs("div", { className: "flex gap-2", children: [
          view.jsx(Button, { type: "button", onClick: props.onRequestAccess, children: "Review access options" }),
          props.canSwitchToWork !== true ? null : view.jsx(Button, { type: "button", color: "secondary", onClick: props.onSwitchToWork, children: "Switch to Work" }),
        ] }),
      ] }),
    ] }),
  ] });
}

function ChatSeatAccessGate(props: SeatAccessGateProps): unknown {
  if (props.enabled !== true) return props.children;
  if (props.isLoading) return null;
  if (props.isCapable !== true) return props.children;
  return ChatSeatAccessScreen(props);
}

function initializeConversationScreen(): void { jsx(); }
export { ChatSeatAccessScreen as n, initializeConversationScreen as r, ChatSeatAccessGate as t };
