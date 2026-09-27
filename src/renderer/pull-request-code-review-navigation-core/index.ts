import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/virtualized-file-diff-line-position";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-revision-queries-core";
interface Store { get(key: unknown, params?: unknown): unknown; set(key: unknown, params: unknown, value?: unknown): void }
const selectedFile = Symbol("selectedFile"); const searchQuery = Symbol("searchQuery"); const fileTreeCollapsed = Symbol("fileTreeCollapsed"); const scrollOffset = Symbol("scrollOffset"); const comments = Symbol("comments"); const submissions = Symbol("submissions"); const reviewData = Symbol("reviewData"); const revisionData = Symbol("revisionData"); const diffFiles = Symbol("diffFiles"); const filteredFiles = Symbol("filteredFiles"); const activeFile = Symbol("activeFile"); const threadMap = Symbol("threadMap"); const threadById = Symbol("threadById"); const commentsByFile = Symbol("commentsByFile"); const commentCounts = Symbol("commentCounts"); const pendingCommentKeys = Symbol("pendingCommentKeys"); const submissionErrors = Symbol("submissionErrors");
function normalizePath(path: string): string { return path.replaceAll("\\", "/"); }
function selectFile(store: Store, request: unknown, path: string): void { store.set(selectedFile, request, normalizePath(path)); }
function setSearchQuery(store: Store, request: unknown, query: string): void { store.set(searchQuery, request, query); }
function setFileTreeCollapsed(store: Store, request: unknown, collapsed: boolean): void { store.set(fileTreeCollapsed, request, collapsed); }
function setScrollOffset(store: Store, request: unknown, offset: number): void { store.set(scrollOffset, request, offset); }
function replaceComments(store: Store, request: unknown, path: string, nextComments: unknown[]): void { store.set(comments, { path: normalizePath(path), request }, nextComments); }
function retryComment(store: Store, request: unknown, submission: { commentKey: string }): void { const current = (store.get(submissions, { path: "", request }) as Array<{ commentKey: string }> | undefined) ?? []; store.set(submissions, { path: "", request }, current.filter(item => item.commentKey !== submission.commentKey)); }
function fileElementId(scope: { value?: { pathname?: string } }, request: Record<string, unknown>, path: string): string { return `pull-request-file-${encodeURIComponent(JSON.stringify([scope.value?.pathname, request.account, request.pullRequest, path]))}`; }
function navigateToPosition(store: Store, request: unknown, position: { path: string; line?: number; side?: string }): void { selectFile(store, request, position.path); if (typeof document !== "undefined") document.getElementById(fileElementId({ value: { pathname: location.pathname } }, request as Record<string, unknown>, normalizePath(position.path)))?.scrollIntoView({ block: "center" }); }
function initializeNavigationSignals(): void {}
function initializePullRequestNavigation(): void { initializeNavigationSignals(); }
export { replaceComments as C, setFileTreeCollapsed as S, filteredFiles as _, commentCounts as a, selectFile as b, searchQuery as c, commentsByFile as d, activeFile as f, pendingCommentKeys as g, submissionErrors as h, initializeNavigationSignals as i, fileTreeCollapsed as l, scrollOffset as m, initializePullRequestNavigation as n, revisionData as o, threadById as p, navigateToPosition as r, comments as s, fileElementId as t, diffFiles as u, retryComment as v, setSearchQuery as x, setScrollOffset as y };
