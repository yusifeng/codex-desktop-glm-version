import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface SidePanelStore { value?: { routeKind?: string }; get?(key: unknown): unknown; openTab?(tab: Record<string, unknown>): void; focusPanel?(placement: string): void }
interface CanonicalOptions { request: Record<string, unknown>; repositoryTarget?: { cwd: string; hostId: string; root?: string }; title?: string; url?: string }
function openCanonicalPullRequestTab(store: SidePanelStore, options: CanonicalOptions, { revealAndFocus = true, insertPosition, tabId, target = "right" }: { revealAndFocus?: boolean; insertPosition?: number; tabId?: string; target?: string } = {}): boolean { const id = tabId ?? `pull-request:${encodeURIComponent(String(options.url ?? options.title ?? "review"))}`; store.openTab?.({ id, kind: "pull-request", ...options, insertPosition, target, revealAndFocus }); if (revealAndFocus) store.focusPanel?.(target); return true; }
function openBoardPullRequestTab(store: SidePanelStore, options: CanonicalOptions, revealAndFocus = true, target = "right", extra: { insertPosition?: number; tabId?: string } = {}): boolean { return openCanonicalPullRequestTab(store, options, { revealAndFocus, target, ...extra }); }
async function restorePullRequestTab(store: SidePanelStore, route: { cwd?: string; hostId?: string; url?: string }, options: { revealAndFocus?: boolean; insertPosition?: number; tabId?: string; target?: string }): Promise<boolean> { if (store.value?.routeKind !== "local-thread" || !route.cwd || !route.hostId || !route.url) return false; return openCanonicalPullRequestTab(store, { request: { url: route.url }, title: route.url, url: route.url }, options); }
function initializePullRequestSidePanelTab(): void {}
export { restorePullRequestTab as i, openCanonicalPullRequestTab as n, openBoardPullRequestTab as r, initializePullRequestSidePanelTab as t };
