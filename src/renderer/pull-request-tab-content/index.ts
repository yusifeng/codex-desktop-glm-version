import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/pull-request-checks-summary";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-query";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-status-label";

interface PullRequestWorkspaceTabProps { item?: { title?: string; number?: number }; request?: { provider?: string; pullRequest?: { number?: number; title?: string } }; summaryOnly?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PullRequestWorkspaceTab(props: PullRequestWorkspaceTabProps): unknown { const pullRequest = props.item ?? props.request?.pullRequest; if (pullRequest == null) return jsx().jsx("div", { role: "status", children: "Loading pull request" }); return jsx().jsxs("article", { "data-provider": props.request?.provider ?? "workspace", children: [jsx().jsx("h2", { children: pullRequest.title ?? `Pull request #${pullRequest.number ?? ""}` }), props.summaryOnly === true ? null : jsx().jsx("div", { role: "tabpanel", children: "Pull request details" })] }); }
export { PullRequestWorkspaceTab };
