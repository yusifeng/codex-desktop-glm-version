import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-connect-modal";
import "@rchunk/page-layout";

export type ICloudHostedStatus = "loading" | "ready" | "unavailable" | "finished";
export interface ICloudHostedPageProps { status?: ICloudHostedStatus; service?: "mail" | "calendar"; userId?: string; accountId?: string; children?: unknown; onReturn?(result: "connected" | "cancelled" | "unavailable"): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function statusMessage(status: ICloudHostedStatus): string { return status === "loading" ? "Checking your ChatGPT account…" : status === "unavailable" ? "This connection can’t continue. Return to the ChatGPT app and try again." : status === "finished" ? "Return to the ChatGPT app to continue." : ""; }
function ICloudHostedPage(props: ICloudHostedPageProps): unknown {
  const runtime = ensureJsx(); const status = props.status ?? "loading";
  if (status !== "ready" || !props.userId || !props.accountId) return runtime.jsxs("main", { className: "icloud-hosted-page", "data-status": status === "ready" ? "unavailable" : status, children: [runtime.jsx("h1", { children: "Connect iCloud" }), runtime.jsx("p", { "aria-live": "polite", children: statusMessage(status === "ready" ? "unavailable" : status) }), status === "unavailable" || status === "ready" ? runtime.jsx("button", { type: "button", onClick: () => props.onReturn?.("unavailable"), children: "Return to the ChatGPT app" }) : null] });
  const appName = props.service === "calendar" ? "iCloud Calendar for ChatGPT" : "iCloud Mail for ChatGPT";
  return runtime.jsxs("main", { className: "icloud-hosted-page", "data-status": "ready", "data-account-id": props.accountId, children: [runtime.jsx("h1", { children: "Connect iCloud" }), runtime.jsx("h2", { children: appName }), props.children, runtime.jsx("button", { type: "button", onClick: () => props.onReturn?.("connected"), children: "Continue" }), runtime.jsx("button", { type: "button", onClick: () => props.onReturn?.("cancelled"), children: "Cancel" })] });
}
function ICloudHostedCompletionPage(props: Pick<ICloudHostedPageProps, "onReturn">): unknown { const runtime = ensureJsx(); return runtime.jsxs("main", { className: "icloud-hosted-completion-page", children: [runtime.jsx("h1", { children: "Return to ChatGPT" }), runtime.jsx("p", { children: "Return to the ChatGPT app to continue." }), runtime.jsx("button", { type: "button", onClick: () => props.onReturn?.("connected"), children: "Return to the ChatGPT app" })] }); }
export { ICloudHostedCompletionPage, ICloudHostedPage };
