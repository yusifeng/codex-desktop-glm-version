import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as commentPopupChunk from "@rchunk/comment-popup-portal";
import * as registryChunk from "@rchunk/source-annotation-host-registry";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface MutableRef<Value> { current: Value }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useCallback<Callback extends (...arguments_: never[]) => unknown>(callback: Callback, dependencies: readonly unknown[]): Callback; useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useRef<Value>(initialValue: Value): MutableRef<Value>; useState<Value>(initialValue: Value): [Value, (next: StateUpdater<Value>) => void] }
interface Metadata { browserTabId?: string; commentId?: string; [key: string]: unknown }
interface Comment { id?: string; localBrowserCommentMetadata?: Metadata; [key: string]: unknown }
interface DirectCommentMessage { browserTabId: string; comment: Comment; conversationId: string; sessionId: string }
interface BrowserSnapshot { annotationFlow?: unknown; comments: Array<{ id: string; [key: string]: unknown }>; url: string }
interface Tab { annotationFlow?: unknown; browserSnapshot?: BrowserSnapshot | null; browserTabId?: string | null; commentAttachmentConversationId?: string | null; conversationId?: string | null; phase?: string; sourceThreadId?: string; tabId?: string }
interface DetachedTabs { focusSourceForBrowserComment(conversationId: string, browserTabId: string): Promise<boolean> | boolean; isBrowserTabDetachedFromSource(conversationId: string, browserTabId: string): Promise<boolean> | boolean }
interface StoreScope { get<Value>(signal: unknown): Value }
interface PendingFocus { abort: AbortController; message: DirectCommentMessage }
interface BrowserUiState { currentUrls: string[] }

const shared = appSharedChunk as unknown as { $3?: () => void; BX: (query: unknown, input: object) => Comment[]; CJ: (flow: unknown) => { defaultSubmitMode: string }; FX?: () => void; G3: { dispatchMessage(type: string, payload: unknown): void }; HX: <Value>(signal: unknown) => Value; I3: () => JsxRuntime; K3: (event: string, callback: (message: never) => void, dependencies: readonly unknown[]) => void; LX: (scope: unknown) => StoreScope; OJ?: () => void; QI?: () => void; W3?: () => void; ZI: unknown; e6: () => ReactRuntime; iK: (comment: unknown, index: number, browserTabId: string) => Comment; wJ: (comments: unknown[], firstFlag: boolean, secondFlag: boolean) => Array<{ id: string; [key: string]: unknown }>; wL?: () => void };
const initial = appInitialChunk as unknown as { Q6: (scope: StoreScope, key: object, updater: (comments: Comment[]) => Comment[]) => void; RDt: unknown; X6: unknown; Y6?: () => void; ifn?: () => void; mnt?: () => void; ofn: (flag: string) => boolean; pnt?: { browserHost?: { detachedTabs: Promise<DetachedTabs | null> | DetachedTabs | null } }; zDt?: () => void };
const primary = appPrimaryChunk as unknown as { Bs: (scope: StoreScope, conversationId: string, browserTabId: string, state: { isOpen: boolean; url: string }) => void; Hi: (comment: Comment, browserTabId: string) => boolean; Ks: (conversationId: string, browserTabId: string, signal: AbortSignal, timeout: number) => Promise<boolean>; Rs: (scope: StoreScope, conversationId: string, browserTabId: string) => BrowserUiState | null; Us: (conversationId: string, browserTabId: string) => boolean; Vi?: () => void; Vs: (message: DirectCommentMessage) => Promise<unknown> | null | undefined; Ws?: () => void; zs?: () => void };
const popup = commentPopupChunk as unknown as { n?: () => void; t?: unknown };
const registry = registryChunk as unknown as { i: (browserTabId: string, conversationId: string, callback: () => boolean) => (() => void) | void; n?: () => void };
const { $3: initializeSharedRuntime, BX: queryComments, CJ: getAnnotationFlowConfig, FX: initializeSharedFeatures, G3: bridge, HX: useSignal, I3: getJsxRuntime, K3: useHostEvent, LX: useStoreScope, OJ: initializeSharedQueries, QI: initializeSharedState, W3: initializeSharedBridge, ZI: appScope, e6: getReactRuntime, iK: convertSnapshotComment, wJ: normalizeSnapshotComments, wL: initializeSharedLinks } = shared;
const { Q6: updateComments, RDt: detachedTabsSignal, X6: commentsQuery, Y6: initializeInitialQueries, ifn: initializeFlags, mnt: initializeBrowserRuntime, ofn: useFeatureFlag, pnt: browserEnvironment, zDt: initializeDetachedTabs } = initial;
const { Bs: setBrowserUiState, Hi: belongsToBrowserTab, Ks: waitForBrowserCommentReady, Rs: getBrowserUiState, Us: isBrowserCommentBusy, Vi: initializePrimaryAnnotations, Vs: executeDirectComment, Ws: initializePrimaryBrowser, zs: initializePrimaryState } = primary;
const { n: initializeCommentPopup, t: CommentPopupPortal } = popup;
const { i: registerAnnotationHost, n: initializeRegistry } = registry;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeDetachedBrowserAnnotationHost(): void {
  if (initialized) return;
  initializeSharedRuntime?.(); initializeSharedFeatures?.(); initializeSharedLinks?.(); initializeSharedQueries?.();
  React = getReactRuntime();
  initializeDetachedTabs?.(); initializePrimaryAnnotations?.(); initializeCommentPopup?.(); initializePrimaryBrowser?.(); initializePrimaryState?.();
  initializeInitialQueries?.(); initializeSharedBridge?.(); initializeBrowserRuntime?.(); initializeSharedState?.(); initializeFlags?.(); initializeRegistry?.();
  jsx = getJsxRuntime(); initialized = true;
}

function appendBrowserComment(scope: StoreScope, attachmentConversationId: string, browserTabId: string, message: DirectCommentMessage): void {
  const commentId = message.comment.localBrowserCommentMetadata?.commentId;
  let comment = message.comment;
  if (comment.localBrowserCommentMetadata != null) {
    const { browserTabId: _discardedBrowserTabId, ...metadata } = comment.localBrowserCommentMetadata;
    comment = { ...comment, localBrowserCommentMetadata: metadata };
  }
  updateComments(scope, { conversationId: attachmentConversationId, path: null, pullRequestReviewKey: null }, comments => {
    if (commentId != null && comments.some(existing => (existing.localBrowserCommentMetadata?.browserTabId == null || belongsToBrowserTab(existing, browserTabId)) && existing.localBrowserCommentMetadata?.commentId === commentId)) return comments;
    return [...comments, comment];
  });
}

function BrowserAnnotationHost({ browserTabId, conversationId, tab }: { browserTabId: string; conversationId: string; tab: Tab }): unknown {
  const scope = useStoreScope(appScope);
  const showAdjustEntry = useFeatureFlag("2327881676");
  const transformFlag = useFeatureFlag("2849306825");
  const [snapshot, setSnapshot] = React.useState(tab.browserSnapshot ?? null);
  const activeDismiss = React.useRef<(() => boolean) | null>(null);
  const justSynchronized = React.useRef(false);
  const openState = React.useRef<BrowserUiState | null>(null);
  const processedSessions = React.useRef(new Set<string>());
  const pendingFocus = React.useRef<PendingFocus | null>(null);
  const attachmentConversationId = tab.commentAttachmentConversationId ?? conversationId;
  const queryKey = { conversationId: attachmentConversationId, path: null, pullRequestReviewKey: null };
  const comments = queryComments(commentsQuery, queryKey);
  const browserComments = comments.filter(comment => belongsToBrowserTab(comment, browserTabId));

  useHostEvent("browser-sidebar-state", (message: { browserTabId: string; conversationId: string; snapshot: BrowserSnapshot | null }) => { if (message.browserTabId === browserTabId && message.conversationId === conversationId) setSnapshot(message.snapshot); }, [browserTabId, conversationId]);
  const append = React.useCallback((message: DirectCommentMessage): void => appendBrowserComment(scope, attachmentConversationId, browserTabId, message), [scope, attachmentConversationId, browserTabId]);
  React.useEffect(() => () => { const pending = pendingFocus.current; if (pending != null) { pendingFocus.current = null; pending.abort.abort(); append(pending.message); } }, [append, tab.phase]);
  useHostEvent("browser-sidebar-direct-comment", (message: DirectCommentMessage) => {
    if (message.browserTabId !== browserTabId || message.conversationId !== conversationId || tab.phase !== "detached" || isBrowserCommentBusy(conversationId, browserTabId) || processedSessions.current.has(message.sessionId)) return;
    processedSessions.current.add(message.sessionId);
    const host = browserEnvironment?.browserHost;
    if (host == null || pendingFocus.current != null) { append(message); return; }
    const pending = { abort: new AbortController(), message }; pendingFocus.current = pending;
    void (async () => {
      try {
        const detachedTabs = await host.detachedTabs; if (pendingFocus.current !== pending) return;
        const focused = await detachedTabs?.focusSourceForBrowserComment(conversationId, browserTabId);
        const ready = Boolean(focused) && await waitForBrowserCommentReady(conversationId, browserTabId, pending.abort.signal, 5000); if (pendingFocus.current !== pending) return;
        const stillDetached = ready && Boolean(await detachedTabs?.isBrowserTabDetachedFromSource(conversationId, browserTabId)) && scope.get<Tab[]>(detachedTabsSignal).some(candidate => candidate.phase === "detached" && candidate.tabId === tab.tabId && candidate.sourceThreadId === tab.sourceThreadId && candidate.browserTabId === browserTabId && candidate.conversationId === conversationId);
        if (pendingFocus.current !== pending) return; pendingFocus.current = null;
        const command = stillDetached ? executeDirectComment(message) : undefined; if (command == null) append(message); else await command.catch(() => append(message));
      } catch { if (pendingFocus.current === pending) { pendingFocus.current = null; append(message); } }
    })();
  }, [browserTabId, conversationId, append, scope, tab]);
  React.useEffect(() => registerAnnotationHost(browserTabId, conversationId, () => activeDismiss.current?.() ?? true), [browserTabId, conversationId]);
  React.useEffect(() => () => { const state = openState.current; if (state != null && getBrowserUiState(scope, conversationId, browserTabId) === state) setBrowserUiState(scope, conversationId, browserTabId, { isOpen: false, url: state.currentUrls[0] ?? "" }); }, [browserTabId, conversationId, scope]);
  React.useEffect(() => {
    if (snapshot == null) return;
    setBrowserUiState(scope, conversationId, browserTabId, { isOpen: true, url: snapshot.url }); openState.current = getBrowserUiState(scope, conversationId, browserTabId);
    const normalized = normalizeSnapshotComments(snapshot.comments, showAdjustEntry, transformFlag); const commentIds = new Set(normalized.map(comment => comment.id)); justSynchronized.current = true;
    updateComments(scope, queryKey, current => [...current.filter(comment => !belongsToBrowserTab(comment, browserTabId) && !(comment.localBrowserCommentMetadata?.browserTabId == null && comment.localBrowserCommentMetadata?.commentId != null && commentIds.has(comment.localBrowserCommentMetadata.commentId))), ...normalized.map((comment, index) => convertSnapshotComment(comment, index + 1, browserTabId))]);
  }, [browserTabId, attachmentConversationId, conversationId, transformFlag, showAdjustEntry, scope, snapshot]);
  React.useEffect(() => {
    if (justSynchronized.current) { justSynchronized.current = false; return; }
    if (snapshot != null && browserComments.length === 0 && normalizeSnapshotComments(snapshot.comments, showAdjustEntry, transformFlag).length > 0) bridge.dispatchMessage("browser-sidebar-command", { browserTabId, conversationId, command: { type: "clear-comments" } });
  }, [browserComments.length, browserTabId, conversationId, transformFlag, showAdjustEntry, snapshot]);
  const flow = snapshot?.annotationFlow ?? tab.annotationFlow;
  return jsx.jsx(CommentPopupPortal ?? "div", { browserTabId, conversationId, defaultCreateSubmitMode: getAnnotationFlowConfig(flow).defaultSubmitMode, onActiveEditorDismissRequestChange: (callback: (() => boolean) | null) => { activeDismiss.current = callback; }, showAdjustEntry });
}

function DetachedBrowserAnnotationHost(): unknown {
  initializeDetachedBrowserAnnotationHost();
  const tabs = useSignal<Tab[]>(detachedTabsSignal);
  return jsx.jsx(jsx.Fragment, { children: tabs.map(tab => tab.browserTabId == null || tab.conversationId == null ? null : jsx.jsx(BrowserAnnotationHost, { tab, browserTabId: tab.browserTabId, conversationId: tab.conversationId }, `${tab.conversationId}\0${tab.browserTabId}`)) });
}

initializeDetachedBrowserAnnotationHost();
export { DetachedBrowserAnnotationHost };
