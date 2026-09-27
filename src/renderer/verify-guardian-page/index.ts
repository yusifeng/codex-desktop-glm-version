import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/page-layout";
import "@rchunk/pepper-persona";

export type GuardianVerificationPhase = "loading" | "refreshing" | "active" | "pending" | "canceled" | "error" | "refresh-error" | "redirect";
export interface VerifyGuardianPageProps { accountId?: string; userId?: string; phase?: GuardianVerificationPhase; onRetry?(): void; onReturn?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
const guardianMessages: Record<GuardianVerificationPhase, string> = { loading: "Checking your account…", refreshing: "Checking your account…", active: "Complete guardian verification with Persona", pending: "Your verification was submitted. Check again for an updated account status", canceled: "Guardian verification was canceled", error: "We couldn’t start guardian verification", "refresh-error": "Your verification was submitted, but we couldn’t refresh your account", redirect: "Checking your account…" };
function VerifyGuardianPage(props: VerifyGuardianPageProps): unknown {
  const runtime = ensureJsx(); if (!props.accountId || !props.userId) return runtime.jsx("main", { "aria-busy": true, children: "Checking your account…" }); const phase = props.phase ?? "loading";
  if (phase === "redirect") return runtime.jsx("a", { "data-redirect": true, href: "/settings/account", children: "Return to Account settings" });
  const retryable = phase === "pending" || phase === "canceled" || phase === "error" || phase === "refresh-error";
  return runtime.jsxs("main", { className: "verify-guardian-page", "data-phase": phase, children: [runtime.jsx("h1", { children: "Verify with a parent or guardian" }), runtime.jsx("p", { role: phase === "error" || phase === "refresh-error" ? "alert" : "status", children: guardianMessages[phase] }), retryable ? runtime.jsx("button", { type: "button", onClick: props.onRetry, children: phase === "pending" ? "Check again" : "Try again" }) : null, runtime.jsx("button", { type: "button", onClick: props.onReturn, children: "Return to Account settings" })] });
}
export { VerifyGuardianPage };
