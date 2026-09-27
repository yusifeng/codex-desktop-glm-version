import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/arrow-rotate-ccw";
import "@rchunk/filter-alt";
import "@rchunk/filter-alt-badged";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-query";
import "@rchunk/pull-request-readonly-comment";

interface PullRequestsRouteProps { error?: string | null; isLoading?: boolean; pullRequestNumber?: number | null; pullRequests?: Array<{ number: number; title?: string }>; selectedNumber?: number | null; onRetry?(): void; onSelect?(number: number): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PullRequestsRoute({ error = null, isLoading = false, pullRequestNumber = null, pullRequests = [], selectedNumber = pullRequestNumber, onRetry, onSelect }: PullRequestsRouteProps = {}): unknown { if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading pull requests" }); if (error != null) return jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { onClick: onRetry, type: "button", children: "Try again" })] }); const selected = pullRequests.find(item => item.number === selectedNumber); return jsx().jsxs("main", { "aria-label": "Pull requests", children: [jsx().jsx("nav", { children: pullRequests.map(item => jsx().jsx("button", { "aria-current": item.number === selectedNumber ? "page" : undefined, onClick: () => onSelect?.(item.number), type: "button", children: `#${item.number} ${item.title ?? "Untitled"}` }, item.number)) }), selected == null ? jsx().jsx("p", { children: pullRequestNumber == null ? "Select a pull request" : "Pull request not found" }) : jsx().jsx("section", { children: selected.title ?? `Pull request #${selected.number}` })] }); }
export { PullRequestsRoute };
