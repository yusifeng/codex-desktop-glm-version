import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";
import "@rchunk/pepper-persona";

export type AgeVerificationPhase = "loading" | "refreshing" | "active" | "pending" | "canceled" | "error" | "refresh-error" | "redirect";
export interface VerifyAgePageProps { accountId?: string; userId?: string; phase?: AgeVerificationPhase; onRetry?(): void; onReturn?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
const ageMessages: Record<AgeVerificationPhase, string> = { loading: "Checking your account…", refreshing: "Checking your account…", active: "Complete your age verification with Persona", pending: "Your verification was submitted. Check again for an updated account status", canceled: "Age verification was canceled", error: "We couldn’t start age verification", "refresh-error": "Your verification was submitted, but we couldn’t refresh your account", redirect: "Checking your account…" };
function VerifyAgePage(props: VerifyAgePageProps): unknown {
  const runtime = ensureJsx(); if (!props.accountId || !props.userId) return runtime.jsx("main", { "aria-busy": true, children: "Checking your account…" }); const phase = props.phase ?? "loading";
  if (phase === "redirect") return runtime.jsx("a", { "data-redirect": true, href: "/settings/account", children: "Return to Account settings" });
  const retryable = phase === "pending" || phase === "canceled" || phase === "error" || phase === "refresh-error";
  return runtime.jsxs("main", { className: "verify-age-page", "data-phase": phase, children: [runtime.jsx("h1", { children: "Verify your age" }), runtime.jsx("p", { role: phase === "error" || phase === "refresh-error" ? "alert" : "status", children: ageMessages[phase] }), retryable ? runtime.jsx("button", { type: "button", onClick: props.onRetry, children: phase === "pending" ? "Check again" : "Try again" }) : null, runtime.jsx("button", { type: "button", onClick: props.onReturn, children: "Return to Account settings" })] });
}
export { VerifyAgePage };
