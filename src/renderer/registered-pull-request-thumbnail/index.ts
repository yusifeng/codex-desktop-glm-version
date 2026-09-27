import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pull-request-status-label";
import "@rchunk/pull-request-checks-summary";
const jsx = getJsxRuntime();
function RegisteredPullRequestThumbnail({ props, title }: { props?: { request?: Record<string, unknown>; status?: string; checks?: unknown[] }; title?: string }): unknown { const request = props?.request ?? {}; return jsx.jsxs("article", { "data-testid": "pull-request-thumbnail", children: [jsx.jsx("strong", { children: title ?? "Pull request" }), jsx.jsx("span", { children: props?.status ?? "open" }), jsx.jsx("span", { children: `${props?.checks?.length ?? 0} checks` }), jsx.jsx("code", { children: JSON.stringify(request) })] }); }
export { RegisteredPullRequestThumbnail };
