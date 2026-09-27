import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/datadog-rum-browser";

export type MobileAgeVerificationStatus = "loading" | "active" | "success" | "cancelled" | "error";
export interface MobileAgeVerificationPageProps { inquiryId?: string; status?: MobileAgeVerificationStatus; errorCode?: string; errorStatus?: string; onStart?(): void; onResult?(url: string): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function resultUrl(props: MobileAgeVerificationPageProps): string | null {
  if (!props.inquiryId || props.status === "loading" || props.status === "active") return null;
  const query = new URLSearchParams({ status: props.status ?? "error", inquiry_id: props.inquiryId });
  if (props.errorCode) query.set("error_code", props.errorCode); if (props.errorStatus) query.set("error_status", props.errorStatus);
  return `/mobile/age-verification/result?${query.toString()}`;
}
function MobileAgeVerificationPage(props: MobileAgeVerificationPageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "loading"; const destination = resultUrl(props);
  if (destination) props.onResult?.(destination);
  return runtime.jsxs("main", { className: "mobile-age-verification-page", "data-status": status, children: [runtime.jsx("h1", { children: "Verify your age" }), status === "loading" ? runtime.jsx("p", { "aria-live": "polite", children: "Loading…" }) : status === "active" ? runtime.jsx("button", { type: "button", onClick: () => { void import("@rchunk/persona-runtime"); props.onStart?.(); }, children: "Continue verification" }) : runtime.jsx("a", { href: destination ?? "/mobile/age-verification/result?status=error", children: status === "success" ? "Continue" : "Return to the app" })] });
}
export { MobileAgeVerificationPage };
