import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";
import "@rchunk/browser-mfa-session";

export type MfaDisableStatus = "loading" | "ready" | "reauthenticate" | "disabled" | "no_default" | "error";
export interface BrowserMfaDisablePageProps { status?: MfaDisableStatus; onDisable?(): void; onReauthenticate?(): void; onRetry?(): void; onReturn?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function BrowserMfaDisablePage(props: BrowserMfaDisablePageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "loading"; let content: unknown;
  if (status === "loading") content = runtime.jsx("p", { role: "status", children: "Loading…" });
  else if (status === "disabled") content = runtime.jsx("p", { role: "status", children: "Multi-factor authentication is disabled" });
  else if (status === "no_default") content = runtime.jsx("p", { role: "status", children: "There is no default authentication factor to disable" });
  else if (status === "error") content = runtime.jsxs("div", { role: "alert", children: ["Something went wrong. Please try again", runtime.jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" })] });
  else content = runtime.jsx("button", { type: "button", onClick: status === "reauthenticate" ? props.onReauthenticate : props.onDisable, children: status === "reauthenticate" ? "Confirm it’s you" : "Disable" });
  return runtime.jsxs("main", { className: "browser-mfa-disable-page", "data-status": status, children: [runtime.jsx("h1", { children: "Disable multi-factor authentication?" }), runtime.jsx("p", { children: "You won’t be asked for a verification code when you log in" }), content, runtime.jsx("button", { type: "button", onClick: props.onReturn, children: "Return to ChatGPT" })] });
}
export { BrowserMfaDisablePage };
