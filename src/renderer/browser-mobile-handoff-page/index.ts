import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";

export type MobileHandoffStatus = "loading" | "account_changed" | "unavailable" | "ready";
export interface BrowserMobileHandoffPageProps { status?: MobileHandoffStatus; redirectTo?: string; onContinue?(url: string): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function BrowserMobileHandoffPage(props: BrowserMobileHandoffPageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "loading";
  if (status === "ready" && props.redirectTo) return runtime.jsx("a", { "data-redirect": true, href: props.redirectTo, onClick: () => props.onContinue?.(props.redirectTo!), children: "Continue" });
  const message = status === "account_changed" ? "This browser account changed. Return to the app and try again" : status === "unavailable" ? "This sign-in link is no longer available. Return to the app and try again" : "Loading…";
  return runtime.jsxs("main", { className: "browser-mobile-handoff-page", "data-status": status, children: [runtime.jsx("h1", { children: "Mobile sign-in" }), runtime.jsx("p", { "aria-live": "polite", children: message })] });
}
export { BrowserMobileHandoffPage };
