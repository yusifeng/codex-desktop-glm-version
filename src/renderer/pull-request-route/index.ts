import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/arrow-rotate-ccw";
import "@rchunk/filter-alt";
import "@rchunk/filter-alt-badged";
import "@rchunk/pull-request-comment";
import { n as PullRequestDetail, r as initializePullRequestDetail } from "@rchunk/pull-request-detail-query";
import "@rchunk/pull-request-readonly-comment";

interface PullRequestListItem { number?: number; state?: string; title?: string; url?: string }
interface PullRequestsRouteProps { error?: string | null; initialPullRequest?: string | null; isLoading?: boolean; pullRequestNumber?: number | null; pullRequests?: PullRequestListItem[]; selectedNumber?: number | null; onNavigate?(path: string): void; onRetry?(): void; onSelect?(number: number): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function parsePullRequestReference(value: string | null | undefined): { number: number; reference: string } | null { if (!value) return null; const urlMatch = value.match(/^https?:\/\/[^/]+\/[^/]+\/[^/]+\/(?:pull|merge_requests)\/(\d+)(?:[/?#].*)?$/i); const shorthand = value.match(/^[^/\s]+\/[^#\s]+#(\d+)$/); const bareNumber = value.match(/^#?(\d+)$/); const number = Number((urlMatch ?? shorthand ?? bareNumber)?.[1]); return Number.isInteger(number) && number > 0 ? { number, reference: value } : null; }
function routeFor(reference: string): string { return `/pull-requests?url=${encodeURIComponent(reference)}`; }
function PullRequestsRoute({ error = null, initialPullRequest = null, isLoading = false, pullRequestNumber = null, pullRequests = [], selectedNumber, onNavigate, onRetry, onSelect }: PullRequestsRouteProps = {}): unknown {
  initializePullRequestDetail();
  if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading pull requests" });
  if (error != null) return jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { onClick: onRetry, type: "button", children: "Try again" })] });
  const parsed = parsePullRequestReference(initialPullRequest);
  const activeNumber = selectedNumber ?? pullRequestNumber ?? parsed?.number ?? null;
  const matched = pullRequests.find(item => item.number === activeNumber || item.url === initialPullRequest);
  const selected = matched == null ? (parsed ? { number: parsed.number, state: "open", title: `Pull request #${parsed.number}`, url: parsed.reference } : undefined) : { ...matched, number: matched.number ?? parsed?.number, state: matched.state ?? "open" };
  const choose = (item: PullRequestListItem) => { if (item.number != null) onSelect?.(item.number); const reference = item.url ?? (item.number == null ? null : String(item.number)); if (reference != null) onNavigate?.(routeFor(reference)); };
  return jsx().jsxs("main", { "aria-label": "Pull requests", children: [jsx().jsx("nav", { children: pullRequests.map((item, index) => { const number = item.number ?? parsePullRequestReference(item.url)?.number; return jsx().jsx("button", { "aria-current": number === activeNumber || item.url === initialPullRequest ? "page" : undefined, onClick: () => choose({ ...item, number }), type: "button", children: `#${number ?? "?"} ${item.title ?? "Untitled"}` }, item.url ?? number ?? index); }) }), selected == null ? jsx().jsx("p", { children: pullRequestNumber == null ? "Select a pull request" : "Pull request not found" }) : jsx().jsx(PullRequestDetail, { detail: selected, error: null, isLoading: false })] });
}
export { PullRequestsRoute };
