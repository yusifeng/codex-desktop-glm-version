// Terminal/session integration for local thread shells.  The public exports
// intentionally match the release chunk: c/l/u are reactive signals, while
// a/f/i/m/o/p/r/s/t are scope operations.

import * as shared from "@rchunk/app-shared";
import * as initial from "@rchunk/app-initial";
import * as workspaceWarning from "@rchunk/terminal-workspace-warning-state";

export type TerminalPanel = "bottom" | "right";
export interface ThreadTerminalContext { conversationId: string; conversationTitle?: string | null; cwd?: string | null; hostId?: string }
export interface TerminalSession { context: ThreadTerminalContext; id: string; panel: TerminalPanel; snapshot?: unknown }
export interface TerminalScope {
  activePanel?: TerminalPanel;
  context?: ThreadTerminalContext | null;
  defaultTerminalLocation?: TerminalPanel;
  sessions: TerminalSession[];
  terminalHidden?: boolean;
}
interface AppScope {
  value: { routeKind?: string; clientThreadId?: string; conversationId?: string };
  get<T = unknown>(signal: unknown, ...args: unknown[]): T;
  set?(signal: unknown, ...values: unknown[]): void;
  watch?(listener: (scope: AppScope) => void): () => void;
}
interface OpenOptions { revealAndFocus?: boolean; cwd?: string | null; hostId?: string; insertPosition?: unknown; snapshot?: unknown }
interface TerminalManager {
  addSessionForConversation?(conversationId: string, sessionId?: string, options?: { activate?: boolean }): string;
  attachExistingForConversation?(conversationId: string, sessionId: string, snapshot: unknown, options?: unknown): Promise<boolean>;
  canTransferSessionToConversation?(from: string, to: string, sessionId: string): boolean;
  claimPreloadedSessionForConversation?(conversationId: string, sessionId: string): void;
  closeSessionForConversation?(conversationId: string, sessionId: string): void;
  getConversationSnapshot?(conversationId: string): { activeSessionId?: string; cwdBySessionId?: Record<string, string>; sessionIds: string[]; tabTitlesBySessionId?: Record<string, string> } | null;
  getSnapshot?(sessionId: string): unknown;
  getWorkspaceBinding?(sessionId: string): { hostId?: string; workspaceRoot?: string } | null;
  seedSessionForConversation?(conversationId: string, sessionId: string, snapshot: unknown, cwd?: string | null): void;
  setActiveSessionForConversation?(conversationId: string, sessionId: string): void;
  subscribeToConversation?(conversationId: string, listener: () => void): () => void;
  transferSessionOwnership?(from: string, to: string, sessionId: string, options?: unknown): unknown;
}
interface PanelController {
  activeTab$?: unknown;
  tabs$?: unknown;
  activateTab?(scope: AppScope, tabId: string): void;
  closeTab?(scope: AppScope, tabId: string, options?: { recordCloseUndo?: boolean }): void;
  updateTab?(scope: AppScope, tabId: string, patch: Record<string, unknown>): void;
}

const init = initial as Record<string, unknown>;
const sh = shared as Record<string, unknown>;
let sequence = 0;
let bottomTerminalActiveSignal: unknown;
let rightTerminalActiveSignal: unknown;
let defaultTerminalLocationSignal: unknown;
let terminalEntityController: Record<string, unknown>;
let initialized = false;
const subscriptions = new Map<string, { panels: Set<TerminalPanel>; target: ThreadTerminalContext; unsubscribe(): void }>();
const closingSessions = new Set<string>();
const fallbackDeferredSignal = Symbol("deferred-terminal");

function terminalTabId(sessionId: string): string {
  const formatter = init.Gst;
  return typeof formatter === "function" ? String((formatter as (id: string) => unknown)(sessionId)) : `terminal:${sessionId}`;
}
function sessionIdFromTab(tabId: string | null | undefined): string | null {
  if (tabId == null) return null;
  const prefix = typeof init.Wst === "string" ? init.Wst : "terminal:";
  return tabId.startsWith(prefix) ? tabId.slice(prefix.length) : null;
}
function isAppScope(scope: AppScope | TerminalScope): scope is AppScope {
  return typeof (scope as AppScope).get === "function" && (scope as AppScope).value != null;
}
function getSignal<T>(scope: AppScope, alias: string, fallback: T, ...args: unknown[]): T {
  const signal = init[alias];
  if (signal == null) return fallback;
  try { return scope.get<T>(signal, ...args); } catch { return fallback; }
}
function call<T>(alias: string, ...args: unknown[]): T | undefined {
  const fn = init[alias];
  if (typeof fn !== "function") return undefined;
  return (fn as (...values: unknown[]) => T)(...args);
}
function manager(): TerminalManager {
  return (init.Rgn ?? {}) as TerminalManager;
}
function controller(panel: TerminalPanel): PanelController {
  return (panel === "bottom" ? init.Vvt : init.qvt) as PanelController ?? {};
}
function panelTabs(scope: AppScope, panel: TerminalPanel): Array<{ tabId: string; props?: Record<string, unknown>; title?: string }> {
  const signal = controller(panel).tabs$;
  if (signal == null) return [];
  try { return scope.get(signal) as Array<{ tabId: string; props?: Record<string, unknown>; title?: string }>; } catch { return []; }
}
function activeTabId(scope: AppScope, panel: TerminalPanel): string | null {
  const signal = controller(panel).activeTab$;
  if (signal == null) return null;
  try { return (scope.get(signal) as { tabId?: string } | null)?.tabId ?? null; } catch { return null; }
}

function terminalContext(scope: AppScope | TerminalScope): ThreadTerminalContext | null {
  if (!isAppScope(scope)) return scope.terminalHidden ? null : scope.context ?? null;
  if (getSignal(scope, "atn", false)) return null;
  const cwd = getSignal<string | null>(scope, "Syt", null);
  const hostId = getSignal<string | undefined>(scope, "Dyt", undefined);
  if (scope.value.routeKind === "home" && scope.value.clientThreadId != null) {
    return { conversationId: scope.value.clientThreadId, conversationTitle: null, cwd, hostId };
  }
  if (scope.value.routeKind === "local-thread" && scope.value.conversationId != null) {
    const resolveConversationId = init.AD;
    const conversationId = typeof resolveConversationId === "function"
      ? String((resolveConversationId as (scope: AppScope, id: string) => unknown)(scope, scope.value.conversationId))
      : scope.value.conversationId;
    return { conversationId, conversationTitle: getSignal<string | null>(scope, "RCt", null, scope.value.conversationId), cwd, hostId };
  }
  return null;
}

function hasTerminalContext(scope: AppScope | TerminalScope): boolean {
  return terminalContext(scope) != null;
}
function defaultTerminalLocation(scope: AppScope | TerminalScope): TerminalPanel {
  if (!isAppScope(scope)) return scope.defaultTerminalLocation ?? "bottom";
  if (defaultTerminalLocationSignal != null) {
    try { return scope.get<TerminalPanel>(defaultTerminalLocationSignal); } catch { /* fall through */ }
  }
  return getSignal<boolean>(scope, "pbt", true) === false ? "right" : "bottom";
}
function existingPanel(scope: AppScope, sessionId: string, fallback: TerminalPanel): TerminalPanel {
  const tabId = terminalTabId(sessionId);
  if (panelTabs(scope, "bottom").some((tab) => tab.tabId === tabId)) return "bottom";
  if (panelTabs(scope, "right").some((tab) => tab.tabId === tabId)) return "right";
  return fallback;
}

function openTerminal(scope: AppScope | TerminalScope, sessionId?: string, panel: TerminalPanel = defaultTerminalLocation(scope), options: OpenOptions = {}): string | null {
  const context = terminalContext(scope);
  if (context == null) return null;
  const targetPanel = sessionId == null || !isAppScope(scope) ? panel : existingPanel(scope, sessionId, panel);
  if (!isAppScope(scope)) {
    const id = sessionId ?? `terminal-${++sequence}`;
    const existing = scope.sessions.find((session) => session.id === id);
    if (existing == null) scope.sessions.push({ context: { ...context, cwd: options.cwd ?? context.cwd, hostId: options.hostId ?? context.hostId }, id, panel: targetPanel, snapshot: options.snapshot });
    else { existing.panel = targetPanel; existing.snapshot = options.snapshot ?? existing.snapshot; }
    scope.activePanel = targetPanel;
    scope.terminalHidden = false;
    return id;
  }
  const terminalManager = manager();
  const revealAndFocus = options.revealAndFocus !== false;
  const snapshot = terminalManager.getConversationSnapshot?.(context.conversationId);
  if (sessionId != null && !snapshot?.sessionIds.includes(sessionId)) terminalManager.addSessionForConversation?.(context.conversationId, sessionId, { activate: revealAndFocus });
  const id = sessionId ?? pickExistingSession(scope, targetPanel, snapshot?.sessionIds ?? []) ?? terminalManager.addSessionForConversation?.(context.conversationId, undefined, { activate: revealAndFocus }) ?? `terminal-${++sequence}`;
  terminalManager.claimPreloadedSessionForConversation?.(context.conversationId, id);
  if (revealAndFocus) terminalManager.setActiveSessionForConversation?.(context.conversationId, id);
  const target = { ...context, cwd: options.cwd === undefined ? context.cwd : options.cwd, hostId: options.hostId === undefined ? context.hostId : options.hostId };
  subscribe(scope, target, targetPanel);
  syncPanel(scope, target, targetPanel, id, revealAndFocus, id, options.insertPosition);
  return id;
}

function pickExistingSession(scope: AppScope, panel: TerminalPanel, sessionIds: string[]): string | null {
  const available = new Set(sessionIds);
  const active = sessionIdFromTab(activeTabId(scope, panel));
  if (active != null && available.has(active)) return active;
  for (const tab of panelTabs(scope, panel)) {
    const id = sessionIdFromTab(tab.tabId);
    if (id != null && available.has(id)) return id;
  }
  return null;
}

function orderedPanelSessions(scope: AppScope, panel: TerminalPanel, sessionIds: string[], addedSessionId?: string): string[] {
  const available = new Set(sessionIds);
  const ordered = panelTabs(scope, panel).flatMap((tab) => {
    const id = sessionIdFromTab(tab.tabId);
    return id != null && available.has(id) ? [id] : [];
  });
  return addedSessionId == null || !available.has(addedSessionId) || ordered.includes(addedSessionId) ? ordered : [...ordered, addedSessionId];
}

function sessionTitle(scope: AppScope, context: ThreadTerminalContext, sessionId: string, index: number, count: number): string {
  const snapshot = manager().getConversationSnapshot?.(context.conversationId);
  const explicit = snapshot?.tabTitlesBySessionId?.[sessionId]?.trim();
  if (explicit) return explicit;
  const binding = manager().getWorkspaceBinding?.(sessionId);
  const cwd = snapshot?.cwdBySessionId?.[sessionId] || binding?.workspaceRoot || context.cwd;
  if (cwd?.trim()) {
    const base = cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;
    return count > 1 ? `${base} ${index + 1}` : base;
  }
  const intl = getSignal<{ formatMessage?(descriptor: unknown, values: { index: number }): string } | null>(scope, "mpn", null);
  return intl?.formatMessage?.({}, { index: index + 1 }) ?? `Terminal ${index + 1}`;
}

function syncPanel(scope: AppScope, context: ThreadTerminalContext, panel: TerminalPanel, activeSessionId?: string, revealAndFocus = false, addedSessionId?: string, insertPosition?: unknown, replaceTabId?: string): void {
  const terminalManager = manager();
  const snapshot = terminalManager.getConversationSnapshot?.(context.conversationId);
  const sessionIds = snapshot?.sessionIds ?? [];
  removeStaleTabs(scope, panel, sessionIds);
  const ordered = orderedPanelSessions(scope, panel, sessionIds, addedSessionId);
  const tabs = new Map(panelTabs(scope, panel).map((tab) => [tab.tabId, tab]));
  ordered.forEach((sessionId, index) => {
    const tabId = terminalTabId(sessionId);
    const binding = terminalManager.getWorkspaceBinding?.(sessionId);
    const props = { ...context, cwd: snapshot?.cwdBySessionId?.[sessionId] || binding?.workspaceRoot || context.cwd, hostId: binding?.hostId ?? context.hostId, onNewTerminalTab: panel === "bottom" ? openBottomTerminal : openRightTerminal, sessionId };
    const title = sessionTitle(scope, context, sessionId, index, ordered.length);
    const existing = tabs.get(tabId);
    if (existing != null) {
      if (existing.title !== title) controller(panel).updateTab?.(scope, tabId, { props, title });
      return;
    }
    const register = init.Gvt;
    if (typeof register === "function") {
      let closedSnapshot: unknown = null;
      (register as (...args: unknown[]) => unknown)(scope, terminalEntityController, {
        revealAndFocus: false, insertPosition, target: panel, replaceTabId, requiresWorkspaceReady: false, props,
        onActivate: (current: AppScope) => activateTerminal(current, context, sessionId, panel),
        onClose: (current: AppScope) => {
          closedSnapshot = terminalManager.getSnapshot?.(sessionId) ?? null;
          closingSessions.add(sessionId);
          try { terminalManager.closeSessionForConversation?.(context.conversationId, sessionId); }
          finally { closingSessions.delete(sessionId); }
          current.set?.((workspaceWarning as Record<string, unknown>).r, sessionId, null);
        },
        onUndoClose: (current: AppScope, movedPanel: TerminalPanel) => {
          if (closedSnapshot != null) terminalManager.seedSessionForConversation?.(context.conversationId, sessionId, closedSnapshot, props.cwd);
          subscribe(current, context, movedPanel);
        },
        onMove: (current: AppScope, move: { panelId?: string }) => {
          if (move.panelId !== "bottom" && move.panelId !== "right") return undefined;
          const movedPanel = move.panelId;
          subscribe(current, context, movedPanel);
          return {
            onActivate: (nextScope: AppScope) => activateTerminal(nextScope, context, sessionId, movedPanel),
            props: { ...props, onNewTerminalTab: movedPanel === "bottom" ? openBottomTerminal : openRightTerminal },
          };
        },
      });
    }
  });
  if (revealAndFocus && activeSessionId != null) {
    controller(panel).activateTab?.(scope, terminalTabId(activeSessionId));
    call("vvt", scope, panel);
  }
}

function removeStaleTabs(scope: AppScope, panel: TerminalPanel, sessionIds: string[]): void {
  const live = new Set(sessionIds);
  for (const tab of panelTabs(scope, panel)) {
    const sessionId = sessionIdFromTab(tab.tabId);
    if (sessionId != null && !live.has(sessionId) && !closingSessions.has(sessionId)) {
      scope.set?.((workspaceWarning as Record<string, unknown>).r, sessionId, null);
      controller(panel).closeTab?.(scope, tab.tabId, { recordCloseUndo: false });
    }
  }
}

function subscribe(scope: AppScope, context: ThreadTerminalContext, panel: TerminalPanel): void {
  const key = String(context.conversationId);
  const existing = subscriptions.get(key);
  if (existing != null) { existing.panels.add(panel); existing.target = context; return; }
  const unsubscribe = manager().subscribeToConversation?.(context.conversationId, () => {
    const subscription = subscriptions.get(key);
    const snapshot = manager().getConversationSnapshot?.(context.conversationId);
    if (subscription == null) return;
    if (snapshot == null) {
      for (const currentPanel of subscription.panels) removeStaleTabs(scope, currentPanel, []);
      subscription.unsubscribe();
      subscriptions.delete(key);
      return;
    }
    subscription.target = terminalContext(scope) ?? subscription.target;
    for (const currentPanel of subscription.panels) syncPanel(scope, subscription.target, currentPanel, snapshot.activeSessionId, false);
  }) ?? (() => {});
  subscriptions.set(key, { panels: new Set([panel]), target: context, unsubscribe });
}

function activateTerminal(scope: AppScope, context: ThreadTerminalContext, sessionId: string, panel: TerminalPanel): void {
  const snapshot = manager().getConversationSnapshot?.(context.conversationId);
  if (!snapshot?.sessionIds.includes(sessionId)) {
    controller(panel).closeTab?.(scope, terminalTabId(sessionId), { recordCloseUndo: false });
    return;
  }
  manager().setActiveSessionForConversation?.(context.conversationId, sessionId);
  syncPanel(scope, context, panel, sessionId, false);
}

function openBottomTerminal(scope: AppScope | TerminalScope): void { openNewTerminal(scope, "bottom"); }
function openRightTerminal(scope: AppScope | TerminalScope): void { openNewTerminal(scope, "right"); }
function openNewTerminal(scope: AppScope | TerminalScope, panel: TerminalPanel, replaceTabId?: string): void {
  if (!isAppScope(scope)) {
    if (replaceTabId != null) scope.sessions = scope.sessions.filter((session) => terminalTabId(session.id) !== replaceTabId);
    void openTerminal(scope, undefined, panel);
    return;
  }
  const context = terminalContext(scope);
  if (context == null) return;
  const id = manager().addSessionForConversation?.(context.conversationId) ?? `terminal-${++sequence}`;
  subscribe(scope, context, panel);
  syncPanel(scope, context, panel, id, true, id, undefined, replaceTabId);
}
function seedTerminalSession(scope: AppScope | TerminalScope, { panel, sessionId, snapshot }: { panel: TerminalPanel; sessionId: string; snapshot: unknown }): void {
  if (!isAppScope(scope)) { void openTerminal(scope, sessionId, panel, { snapshot, revealAndFocus: false }); return; }
  const context = terminalContext(scope);
  if (context == null) return;
  manager().seedSessionForConversation?.(context.conversationId, sessionId, snapshot, context.cwd);
  subscribe(scope, context, panel);
  syncPanel(scope, context, panel, sessionId, false, sessionId);
}
function ensureBottomTerminal(scope: AppScope | TerminalScope): void {
  if (!isAppScope(scope)) { if (!scope.terminalHidden) void openTerminal(scope, undefined, "bottom"); return; }
  if (getSignal(scope, "atn", false)) return;
  if (isSignalActive(scope, bottomTerminalActiveSignal, "bottom")) call("pvt", scope, "bottom");
  else void openTerminal(scope, undefined, "bottom");
}
function revealTerminal(scope: AppScope | TerminalScope, panel: TerminalPanel = defaultTerminalLocation(scope)): void {
  if (!isAppScope(scope)) { if (!scope.terminalHidden) { const existing = scope.sessions.some((session) => session.panel === panel); if (existing) scope.activePanel = panel; else void openTerminal(scope, undefined, panel); } return; }
  if (getSignal(scope, "atn", false)) return;
  const signal = panel === "bottom" ? bottomTerminalActiveSignal : rightTerminalActiveSignal;
  if (isSignalActive(scope, signal, panel)) call("pvt", scope, panel);
  else void openTerminal(scope, undefined, panel);
}
function isSignalActive(scope: AppScope, signal: unknown, panel: TerminalPanel): boolean {
  if (signal != null) { try { return Boolean(scope.get(signal)); } catch { /* fall through */ } }
  return activeTabId(scope, panel)?.startsWith("terminal:") === true;
}
function requestDeferredTerminal(scope: AppScope | TerminalScope): void {
  if (!isAppScope(scope)) { if (scope.sessions.length === 0) openBottomTerminal(scope); return; }
  const signal = init.wtn ?? fallbackDeferredSignal;
  if (!isSignalActive(scope, bottomTerminalActiveSignal, "bottom")) scope.set?.(signal, true);
}
function watchDeferredTerminal(scope: AppScope | TerminalScope): () => void {
  if (!isAppScope(scope) || scope.watch == null) { requestDeferredTerminal(scope); return () => {}; }
  const signal = init.wtn ?? fallbackDeferredSignal;
  return scope.watch((current) => {
    if (!current.get<boolean>(signal)) return;
    const workspaceState = getSignal<string>(current, "T_t", "ready");
    if (getSignal(current, "mbt", false) === false || panelTabs(current, "bottom").length > 0 || workspaceState === "failed") {
      current.set?.(signal, false);
      return;
    }
    if (getSignal(current, "Lbt", false) && hasTerminalContext(current)) { current.set?.(signal, false); openBottomTerminal(current); }
  });
}

function initializeThreadShellRuntime(): void {
  if (initialized) return;
  initialized = true;
  for (const alias of ["qbt", "Wvt", "Jvt", "Ebt", "Evt", "ppn", "LCt", "itn", "byt", "Ftn", "Vcn", "jD", "Lgn", "v_t", "Kst"] as const) {
    const initializer = init[alias];
    if (typeof initializer === "function") (initializer as () => void)();
  }
  const derived = sh.sZ;
  const routeSignal = init.$en;
  if (typeof derived === "function" && routeSignal != null) {
    bottomTerminalActiveSignal = (derived as (root: unknown, read: (input: { get(signal: unknown): unknown }) => unknown) => unknown)(routeSignal, ({ get }) => Boolean(get(init.mbt)) && (get(init.Vvt && (init.Vvt as PanelController).activeTab$) as { tabId?: string } | null)?.tabId?.startsWith("terminal:") === true);
    rightTerminalActiveSignal = (derived as (root: unknown, read: (input: { get(signal: unknown): unknown }) => unknown) => unknown)(routeSignal, ({ get }) => Boolean(get(init.vbt)) && (get(init.qvt && (init.qvt as PanelController).activeTab$) as { tabId?: string } | null)?.tabId?.startsWith("terminal:") === true);
    defaultTerminalLocationSignal = (derived as (root: unknown, read: (input: { get(signal: unknown): unknown; scope?: AppScope }) => unknown) => unknown)(routeSignal, ({ get }) => get(init.pbt) === false ? "right" : "bottom");
  } else {
    bottomTerminalActiveSignal = Symbol("bottom-terminal-active");
    rightTerminalActiveSignal = Symbol("right-terminal-active");
    defaultTerminalLocationSignal = Symbol("default-terminal-location");
  }
  const descriptor = {
    conversationTransfer: {
      canTransfer: (scope: AppScope, source: { conversationId: string; sessionId: string }, target: { threadId: string }) => manager().canTransferSessionToConversation?.(source.conversationId, resolveConversationId(scope, target.threadId), source.sessionId) ?? false,
      start: (scope: AppScope, source: { conversationId: string; sessionId: string }, target: { threadId: string }, options?: unknown) => manager().transferSessionOwnership?.(source.conversationId, resolveConversationId(scope, target.threadId), source.sessionId, options),
    },
    getId: (session: { sessionId?: string; id?: string }) => terminalTabId(session.sessionId ?? session.id ?? ""),
    getTitle: (scope: AppScope, props: ThreadTerminalContext & { sessionId: string }) => sessionTitle(scope, props, props.sessionId, 0, 1),
    open: openTerminal,
    preloadExisting: (scope: AppScope | TerminalScope, sessionId: string, snapshot: unknown, options?: unknown) => {
      const context = terminalContext(scope);
      return context == null ? Promise.resolve(false) : manager().attachExistingForConversation?.(context.conversationId, sessionId, snapshot, options) ?? Promise.resolve(false);
    },
  };
  const factory = init.qst;
  terminalEntityController = typeof factory === "function" ? (factory as (value: unknown) => Record<string, unknown>)(descriptor) : descriptor;
}
function resolveConversationId(scope: AppScope, threadId: string): string {
  const resolver = init.AD;
  return typeof resolver === "function" ? String((resolver as (scope: AppScope, id: string) => unknown)(scope, threadId)) : threadId;
}

export {
  openBottomTerminal as a,
  bottomTerminalActiveSignal as c,
  terminalEntityController as d,
  ensureBottomTerminal as f,
  seedTerminalSession as i,
  defaultTerminalLocationSignal as l,
  watchDeferredTerminal as m,
  initializeThreadShellRuntime as n,
  openNewTerminal as o,
  revealTerminal as p,
  openTerminal as r,
  requestDeferredTerminal as s,
  hasTerminalContext as t,
  rightTerminalActiveSignal as u,
};
