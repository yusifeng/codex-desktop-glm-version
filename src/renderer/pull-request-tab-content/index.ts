import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/pull-request-checks-summary";
import "@rchunk/pull-request-comment";
import { n as PullRequestDetail, r as initializePullRequestDetail, t as PullRequestUnavailable } from "@rchunk/pull-request-detail-query";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-status-label";

interface PullRequestWorkspaceTabProps { detail?: { [key: string]: unknown; number?: number; state?: string; title?: string } | null; error?: unknown; isLoading?: boolean; item?: { [key: string]: unknown; title?: string; number?: number; state?: string }; onRetry?(): void; request?: { provider?: string; pullRequest?: { number?: number; title?: string } }; summaryOnly?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PullRequestWorkspaceTab(props: PullRequestWorkspaceTabProps): unknown {
  initializePullRequestDetail();
  const provider = props.request?.provider ?? "workspace";
  const fallback = props.item ?? props.request?.pullRequest;
  const detail = props.detail === undefined ? fallback : props.detail;
  if (props.isLoading || detail === undefined) return jsx().jsx("div", { role: "status", children: provider === "gitlab" ? "Loading GitLab merge request" : "Loading pull request" });
  if (detail == null) return jsx().jsxs("section", { "data-provider": provider, children: [provider === "gitlab" ? jsx().jsx("h2", { children: "GitLab merge request" }) : null, jsx().jsx(PullRequestUnavailable, { error: props.error, isLoading: false, onRetry: props.onRetry })] });
  return jsx().jsx("section", { "data-provider": provider, role: props.summaryOnly ? undefined : "tabpanel", children: jsx().jsx(PullRequestDetail, { detail, error: props.error, isLoading: false, summaryOnly: props.summaryOnly }) });
}
export { PullRequestWorkspaceTab };
