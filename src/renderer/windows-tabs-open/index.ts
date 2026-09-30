import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import * as ThreadRuntimeChunk from "@rchunk/thread-shell-runtime";

type Placement = "bottom" | "right";
type Target = { type: "file"; path: string; line?: number } | { type: "browser"; tabId?: string; url?: string } | { type: "terminal"; sessionId?: string } | { type: "review"; baseBranch?: string; path?: string; view?: "branch" | "last-turn" | "staged" | "unstaged" } | { type: "page" };
interface OpenRequest { placement?: Placement; target: Target; threadId?: string }
interface RouteValue { clientThreadId?: string; conversationId?: string; routeKind: "chatgpt-thread" | "client-local-thread" | "home" | "local-thread" | "new-thread-panel" | "other" | "remote-thread"; taskId?: string }
interface Scope { value: RouteValue; get<T>(key: unknown): T; set?(key: unknown, value: unknown): void }
interface Context { scope?: Scope | null; sourceHostId?: string; sourceThreadId?: string }
interface OpenResult { placement?: Placement; status: "existing" | "opened" | "superseded"; tabId?: string; threadId: string; type: Target["type"] | "review" }
interface InitialApi { DDt?(url: string, threadId: string): { kind: "error"; message: string } | { kind: "pullRequestReview"; target: unknown } | { kind: "threadReview"; target: { reviewDiffFilter?: "branch" | "last-turn" | "staged" | "unstaged"; reviewPath?: string } } | null; Dyt: unknown; atn: unknown; jR?(scope: Scope, path: string, input: { hostId?: string; line?: number; target: Placement }): { placement?: Placement; status?: "existing" | "opened"; tabId?: string } | null; fgt?(scope: Scope): Array<{ browserTabId: string }>; ilt?(scope: Scope, input: { browserTabId?: string; hostId?: string; initialUrl?: string; target: Placement }): string | null; dgt?(scope: Scope, tabId: string): { target?: Placement } | null; gvt?(scope: Scope, tabId: string): Placement | null; Pi?(scope: Scope, open: boolean, placement: Placement): boolean; fvt?(scope: Scope, placement: Placement, tabId: string): boolean; pk: unknown; fk?(scope: Scope, value: unknown): void; rtn?(value: RouteValue): string; IO?(scope: Scope, threadId: string, baseBranch: string): void; PE?(scope: Scope, path: string): void }

const initial = InitialChunk as unknown as InitialApi;
const terminal = ThreadRuntimeChunk as unknown as { l(scope: Scope): Placement; r(scope: Scope, sessionId?: string, panel?: Placement): string | null; t(scope: Scope): boolean };
void RuntimeChunk; void SharedChunk;

function visibleThreadId(value: RouteValue): string | null {
  if (value.routeKind === "client-local-thread") return value.clientThreadId ?? null;
  if (value.routeKind === "local-thread" || value.routeKind === "chatgpt-thread") return value.conversationId ?? null;
  if (value.routeKind === "remote-thread") return value.taskId ?? null;
  return null;
}

async function runWindowsTabsOpen(request: OpenRequest, context: Context): Promise<OpenResult> {
  const scope = context.scope;
  if (scope == null) throw new Error("windows.tabs.open requires an app view");
  if (scope.get<boolean>(initial.atn)) throw new Error("Panels are unavailable in archived previews");
  const visible = visibleThreadId(scope.value);
  const threadId = request.threadId ?? context.sourceThreadId ?? visible;
  if (threadId == null || visible == null) throw new Error("windows.tabs.open requires a visible thread");
  if (threadId !== visible) throw new Error(`Thread ${threadId} is not visible in the targeted main window (showing ${visible})`);
  const hostId = context.sourceThreadId === threadId && context.sourceHostId != null ? context.sourceHostId : scope.get<string | undefined>(initial.Dyt);
  const target = request.target;
  const reviewLink = target.type === "browser" && target.url != null ? initial.DDt?.(target.url, threadId) : null;
  if (reviewLink?.kind === "error") throw new Error(reviewLink.message);
  if (reviewLink?.kind === "pullRequestReview") {
    const module = await import("@rchunk/open-review-link") as { openReviewLink(scope: Scope, input: { hostId?: string; target: unknown }, placement?: Placement): Promise<Partial<OpenResult>> };
    const opened = await module.openReviewLink(scope, { hostId, target: reviewLink.target }, request.placement);
    return { threadId, type: "review", status: "superseded", ...opened };
  }
  if (reviewLink?.kind === "threadReview") return runWindowsTabsOpen({ ...request, target: { type: "review", view: reviewLink.target.reviewDiffFilter, path: reviewLink.target.reviewPath } }, context);
  if (target.type === "page") throw new Error("Page tabs are unavailable");
  if (target.type === "file") { const placement = request.placement ?? "right"; const opened = initial.jR?.(scope, target.path, { hostId, line: target.line, target: placement }); if (opened == null) throw new Error("File tab could not be opened"); return { threadId, type: "file", placement: opened.placement ?? placement, status: opened.status ?? "opened", tabId: opened.tabId }; }
  if (target.type === "browser") { const placement = request.placement ?? "right"; const before = initial.fgt?.(scope) ?? []; const tabId = initial.ilt?.(scope, { browserTabId: target.tabId, hostId, initialUrl: target.url, target: placement }); if (tabId == null) throw new Error("Browser tab could not be opened"); return { threadId, type: "browser", placement: initial.dgt?.(scope, tabId)?.target ?? placement, status: before.some(tab => tab.browserTabId === tabId) ? "existing" : "opened", tabId }; }
  if (target.type === "terminal") { if (!terminal.t(scope)) throw new Error("Terminal tab is unavailable for this thread"); const placement = request.placement ?? terminal.l(scope); const existing = scope.get<readonly string[]>(Symbol.for("terminal-tab-ids")) ?? []; const sessionId = terminal.r(scope, target.sessionId, placement); if (sessionId == null) throw new Error("Terminal tab could not be opened"); const tabId = `terminal:${sessionId}`; return { threadId, type: "terminal", placement: initial.gvt?.(scope, tabId) ?? placement, status: existing.includes(tabId) ? "existing" : "opened", tabId }; }
  const placement = request.placement ?? "right"; const existingPlacement = initial.gvt?.(scope, "diff"); if (target.baseBranch != null) initial.IO?.(scope, initial.rtn?.(scope.value) ?? threadId, target.baseBranch); else if (target.view === "last-turn") initial.fk?.(scope, null); if (target.path != null) initial.PE?.(scope, target.path); if (!(existingPlacement == null ? initial.Pi?.(scope, true, placement) : initial.fvt?.(scope, existingPlacement, "diff"))) throw new Error("Review tab could not be opened"); return { threadId, type: "review", placement: initial.gvt?.(scope, "diff") ?? placement, status: existingPlacement == null ? "opened" : "existing", tabId: "diff" };
}

export { runWindowsTabsOpen };
