// App-shell chrome for local/new/remote threads.  This component contributes
// panel outlets and header actions to the shared app-shell registries; it is
// not a page wrapper and intentionally does not accept arbitrary children.

import * as shared from "@rchunk/app-shared";
import * as initial from "@rchunk/app-initial";
import * as threadRuntime from "@rchunk/thread-shell-runtime";
import * as panelToggle from "@rchunk/thread-panel-toggle-button";

export interface ThreadAppShellChromeProps {
  conversationId?: string;
  showReviewTab?: boolean;
  showSidePanelToggle?: boolean;
  threadType: "local" | "new" | "remote";
}

const sh = shared as Record<string, unknown>;
const init = initial as Record<string, unknown>;
const runtime = threadRuntime as Record<string, unknown>;
const toggles = panelToggle as Record<string, unknown>;
let jsx: { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown };
let react: { useEffect(effect: () => void | (() => void), dependencies: unknown[]): void; useRef<T>(initial: T): { current: T } };
let initialized = false;

function useSignal<T>(signal: unknown, fallback: T): T {
  const hook = sh.HX;
  if (typeof hook !== "function" || signal == null) return fallback;
  try { return (hook as (value: unknown) => T)(signal); } catch { return fallback; }
}
function useScope(): { get<T = unknown>(signal: unknown): T; value?: unknown } | null {
  const hook = sh.LX;
  if (typeof hook !== "function") return null;
  try { return (hook as (route: unknown) => { get<T = unknown>(signal: unknown): T })(init.$en); } catch { return null; }
}
function call(alias: string, ...args: unknown[]): unknown {
  const fn = init[alias];
  return typeof fn === "function" ? (fn as (...values: unknown[]) => unknown)(...args) : undefined;
}
function registerAction(action: string, handler: () => void, enabled: boolean): void {
  const hook = init.pEt;
  if (typeof hook === "function") (hook as (...args: unknown[]) => void)(action, handler, { enabled });
}
function registerCommand(command: string, handler: () => void, dependencies: unknown[]): void {
  const hook = sh.K3;
  if (typeof hook === "function") (hook as (...args: unknown[]) => void)(command, handler, dependencies);
}
function appShellComponent(name: string, props: Record<string, unknown>): unknown {
  const registry = init.f7 as Record<string, unknown> | undefined;
  const component = registry?.[name];
  return component == null ? null : jsx.jsx(component, props);
}

function ThreadAppShellChrome(props: ThreadAppShellChromeProps): unknown {
  ensureInitialized();
  const scope = useScope();
  const environment = useSignal<Record<string, unknown>>(init.mdt, {});
  const workspaceRoots = useSignal<string[]>(init.ddt, []);
  const workspaceStatus = useSignal<string>(init.T_t, "ready");
  const sidePanelOpen = useSignal<boolean>(init._bt, false);
  const sidePanelController = init.qvt as { activeTab$?: unknown; tabs$?: unknown } | undefined;
  const bottomPanelController = init.Vvt as { tabs$?: unknown } | undefined;
  const activeSideTab = useSignal<{ tabId?: string } | null>(sidePanelController?.activeTab$, null);
  const sidePanelTabs = useSignal<unknown[]>(sidePanelController?.tabs$, []);
  const bottomPanelTabs = useSignal<unknown[]>(bottomPanelController?.tabs$, []);
  const previousActiveTab = react.useRef<string | null>(null);
  const ready = workspaceStatus === "ready";
  const canReview = ready && (props.threadType === "remote" ? props.showReviewTab === true : environment.kind === "git");
  const actionPrefix = `thread-${props.threadType}`;

  react.useEffect(() => {
    if (scope == null) return;
    const tabId = activeSideTab?.tabId ?? null;
    if (!sidePanelOpen) { previousActiveTab.current = tabId; return; }
    const reasonResolver = init.$vt;
    const reason = tabId == null || typeof reasonResolver !== "function" ? null : (reasonResolver as (...args: unknown[]) => unknown)(scope, tabId);
    if (previousActiveTab.current !== tabId || reason != null) {
      previousActiveTab.current = tabId;
      call("tyt", scope, activeSideTab, reason ?? "manual");
    }
  }, [activeSideTab, scope, sidePanelOpen]);

  const openReview = (): void => { if (scope != null) call("Pi", scope); };
  const toggleReview = (): void => { if (scope != null) call("Ii", scope); };
  registerAction("openReviewTab", openReview, canReview);
  registerAction("toggleReviewTab", toggleReview, canReview);
  const toggleFileTree = (): void => {
    const root = workspaceRoots[0];
    if (scope != null && ready && props.threadType !== "remote" && root != null) call("ect", scope, null, { hostId: scope.get(init.Dyt), workspaceRoot: root });
  };
  registerCommand("toggle-file-tree-panel", toggleFileTree, [environment.id, props.threadType, ready, scope, workspaceRoots[0]]);

  const toggleSidePanel = (): void => { if (scope != null) call("Ict", scope); };
  const toggleBottomPanel = (): void => {
    if (scope == null) return;
    if (bottomPanelTabs.length === 0 && typeof runtime.f === "function") (runtime.f as (scope: unknown) => void)(scope);
    else call("pvt", scope, "bottom", { activateFallbackTab: true, allowEmpty: true });
  };
  registerAction("toggleSidePanel", toggleSidePanel, true);
  registerAction("toggleBottomPanel", toggleBottomPanel, true);

  const bottomOutlet = appShellComponent("BottomPanelOutlet", { children: appShellComponent("BottomPanelTabs", {}) });
  const rightOutlet = appShellComponent("RightPanelOutlet", { children: appShellComponent("RightPanelTabs", {}) });
  const sideToggle = props.showSidePanelToggle === false ? null : headerAction(`${actionPrefix}-panel-toggles`, 300, "Toggle side panel", sidePanelOpen, toggleSidePanel, sidePanelTabs.length === 0 && props.threadType === "remote" && !props.showReviewTab);
  const reviewToggle = canReview ? headerAction(`${actionPrefix}-review-toggle`, 250, "Review", false, openReview, false) : null;
  const bottomToggle = headerAction(`${actionPrefix}-bottom-panel-toggle`, 200, "Toggle bottom panel", bottomPanelTabs.length > 0, toggleBottomPanel, !ready);
  const dependencyBottomChrome = typeof toggles.y === "function" ? jsx.jsx(toggles.y, {}) : null;
  const dependencyRightChrome = typeof toggles.r === "function" ? jsx.jsx(toggles.r, {}) : null;

  return jsx.jsxs(jsx.Fragment, {
    children: [
      dependencyBottomChrome,
      bottomOutlet,
      rightOutlet,
      bottomToggle,
      reviewToggle,
      sideToggle,
      dependencyRightChrome,
    ],
  });
}

function headerAction(actionId: string, order: number, label: string, pressed: boolean, onClick: () => void, disabled: boolean): unknown {
  const button = typeof toggles.t === "function"
    ? jsx.jsx(toggles.t, { label, pressed, disabled, onClick, children: jsx.jsx("span", { "aria-hidden": true, children: pressed ? "◀" : "▶" }) })
    : jsx.jsx("button", { type: "button", "aria-label": label, "aria-pressed": pressed, disabled, onClick, children: label });
  return appShellComponent("HeaderAction", { actionId, align: "end", order, slotPosition: "right", children: button }) ?? button;
}

function initializeThreadAppShellChrome(): void {
  if (initialized) return;
  initialized = true;
  const getJsx = sh.I3;
  const getReact = sh.e6;
  if (typeof getJsx !== "function" || typeof getReact !== "function") throw new Error("Thread app shell requires the renderer JSX and React runtimes");
  jsx = (getJsx as () => typeof jsx)();
  react = (getReact as () => typeof react)();
  for (const value of [runtime.n, toggles.n]) if (typeof value === "function") (value as () => void)();
}
function ensureInitialized(): void { if (!initialized) initializeThreadAppShellChrome(); }

export { initializeThreadAppShellChrome as n, ThreadAppShellChrome as t };
