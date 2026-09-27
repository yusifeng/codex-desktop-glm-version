import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-status-label";
import "@rchunk/pull-request-checks-summary";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { i as PullRequestTaskDetail, n as PullRequestRemoteDetail, type PullRequestDetail } from "@rchunk/pull-request-detail-query";
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function mergePullRequestDetail(item: PullRequestDetail, detail: PullRequestDetail): PullRequestDetail { const status = detail.state === "open" ? (detail.isDraft ? "draft" : "open") : detail.state; return { ...item, additions: detail.additions ?? item.additions, baseBranch: detail.baseBranch ?? item.baseBranch, canMerge: detail.canMerge, ciStatus: detail.ciStatus, deletions: detail.deletions ?? item.deletions, headBranch: detail.headBranch ?? item.headBranch, isAuthor: detail.isAuthor, mergeBlocker: detail.mergeBlocker, number: detail.number ?? item.number, repo: detail.repo ?? item.repo, state: status === "successful" ? "in_progress" : status, title: detail.title ?? item.title, url: detail.url ?? item.url }; }
function PullRequestWorkspaceTab(props: { item?: PullRequestDetail; request?: { provider: "github" | "gitlab"; pullRequest?: { number?: number } }; detail?: PullRequestDetail | null; error?: unknown; summaryOnly?: boolean }): unknown { if (props.item != null) return jsx().jsx(PullRequestTaskDetail, { item: props.item, detail: props.detail }); if (props.request?.provider === "gitlab") return jsx().jsx("section", { children: jsx().jsx("h2", { children: "GitLab merge request" }) }); return jsx().jsx(PullRequestRemoteDetail, { request: props.request, detail: props.detail, error: props.error instanceof Error ? props.error.message : props.error }); }
export { PullRequestWorkspaceTab };
void mergePullRequestDetail;
