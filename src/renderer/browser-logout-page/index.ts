import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";

export type BrowserLogoutStatus = "confirm" | "pending" | "error" | "complete";
export interface BrowserLogoutPageProps { email?: string; status?: BrowserLogoutStatus; logoutAllDevices?: boolean; onConfirm?(): void; onCancel?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function BrowserLogoutPage(props: BrowserLogoutPageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "confirm";
  if (status === "complete") return runtime.jsx("main", { role: "status", children: props.logoutAllDevices ? "Successfully logged out of all devices" : "You’re logged out" });
  return runtime.jsxs("main", { className: "browser-logout-page", "data-status": status, "aria-busy": status === "pending", children: [runtime.jsx("h1", { children: "Log out of ChatGPT?" }), props.email ? runtime.jsx("p", { children: props.email }) : null, runtime.jsx("p", { children: "You’ll need to log in again to access your chats" }), status === "error" ? runtime.jsx("p", { role: "alert", children: "We couldn’t log you out. Please try again" }) : null, runtime.jsx("button", { type: "button", disabled: status === "pending", onClick: props.onConfirm, children: status === "pending" ? "Logging out…" : "Log out" }), runtime.jsx("button", { type: "button", disabled: status === "pending", onClick: props.onCancel, children: "Cancel" })] });
}
export { BrowserLogoutPage };
