import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";
import "@rchunk/browser-mfa-session";

export type MfaEnrollStatus = "loading" | "ready" | "reauthenticate" | "email_required" | "error";
export interface BrowserMfaEnrollPageProps { status?: MfaEnrollStatus; token?: string; factor?: "passkey" | "totp"; appName?: string; redirectPath?: string; onReauthenticate?(): void; onRetry?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function enrollmentUrl(props: BrowserMfaEnrollPageProps): string | null { if (!props.token) return null; const query = new URLSearchParams({ token: props.token, origin_app_name: props.appName ?? "ChatGPT" }); if (props.redirectPath) query.set("redirect_path", props.redirectPath); return `${props.factor === "passkey" ? "/passkey-enroll" : "/totp_enroll"}?${query}`; }
function BrowserMfaEnrollPage(props: BrowserMfaEnrollPageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "loading"; const url = enrollmentUrl(props);
  let content: unknown;
  if (status === "loading") content = runtime.jsx("p", { role: "status", children: "Loading…" });
  else if (status === "ready" && url) content = runtime.jsx("a", { href: url, children: "Continue to enrollment" });
  else if (status === "reauthenticate") content = runtime.jsx("button", { type: "button", onClick: props.onReauthenticate, children: "Confirm it’s you" });
  else content = runtime.jsxs("div", { role: "alert", children: [status === "email_required" ? "Add an email address to your account before setting up multi-factor authentication" : "Something went wrong. Please try again", runtime.jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" })] });
  return runtime.jsxs("main", { className: "browser-mfa-enroll-page", "data-status": status, children: [runtime.jsx("h1", { children: "Set up multi-factor authentication" }), content] });
}
export { BrowserMfaEnrollPage };
