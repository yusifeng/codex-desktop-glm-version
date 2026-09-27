import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/arrow-rotate-ccw";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-comment";
import "@rchunk/filter-alt";
import "@rchunk/filter-alt-badged";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { n as PullRequestRemoteDetail } from "@rchunk/pull-request-detail-query";
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function parsePullRequest(value: string | null | undefined): { hostname: string; number: number; owner: string; repository: string } | null { if (value == null) return null; try { const url = new URL(value); const match = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(url.pathname); return match == null ? null : { hostname: url.hostname, owner: match[1], repository: match[2], number: Number(match[3]) }; } catch { const match = /^([^/]+)\/([^#]+)#(\d+)$/.exec(value); return match == null ? null : { hostname: "github.com", owner: match[1], repository: match[2], number: Number(match[3]) }; } }
function PullRequestsRoute({ initialPullRequest, locationState, onNavigate, pullRequests = [] }: { initialPullRequest?: string | null; locationState?: { pullRequest?: string }; onNavigate?(path: string): void; pullRequests?: Array<{ title?: string; url: string }> }): unknown { const parsed = parsePullRequest(initialPullRequest ?? locationState?.pullRequest); return jsx().jsxs("main", { children: [jsx().jsx("aside", { children: jsx().jsx("ul", { children: pullRequests.map(item => jsx().jsx("li", { children: jsx().jsx("button", { type: "button", onClick: () => onNavigate?.(`/pull-requests?url=${encodeURIComponent(item.url)}`), children: item.title ?? item.url }) }, item.url)) }) }), parsed == null ? jsx().jsx("section", { children: jsx().jsx("h2", { children: "Select pull request to view" }) }) : jsx().jsx(PullRequestRemoteDetail, { detail: { number: parsed.number, repo: `${parsed.owner}/${parsed.repository}`, title: `#${parsed.number}`, state: "open" } })] }); }
export { PullRequestsRoute };
