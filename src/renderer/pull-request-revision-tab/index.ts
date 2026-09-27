import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pull-request-revision-queries-core";
import "@rchunk/pull-request-code-review-navigation-core";
import "@rchunk/pull-request-code-review-core";
import "@rchunk/revision-review-unavailable-message";
const jsx = getJsxRuntime();
function PullRequestRevisionTab({ request, title, unavailableReason }: { request?: unknown; title?: string; unavailableReason?: string }): unknown { return jsx.jsxs("section", { "data-testid": "pull-request-revision-tab", children: [jsx.jsx("h1", { children: title ?? "Pull request review" }), unavailableReason ? jsx.jsx("p", { role: "alert", children: unavailableReason }) : jsx.jsx("div", { "data-review-request": JSON.stringify(request ?? null), children: "Review changes" })] }); }
export { PullRequestRevisionTab };
