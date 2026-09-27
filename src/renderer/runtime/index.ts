import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import { r as terminalWorkspaceWarningState, t as initializeTerminalWorkspaceWarningState } from "@rchunk/terminal-workspace-warning-state";

type TerminalPanel = "bottom" | "right";
interface TerminalSessionSnapshot { cwd?: string; hostId?: string; title?: string; [key: string]: unknown }
interface TerminalTab { panel: TerminalPanel; sessionId: string; title: string }
interface TerminalRoute { clientThreadId?: string; conversationId?: string; conversationTitle?: string | null; cwd?: string; hostId?: string; routeKind: "home" | "local-thread" | "client-local-thread" | "new-thread-panel" | "chatgpt-thread" | "remote-thread" | "other" }
interface TerminalScope {
  route: TerminalRoute;
  defaultTerminalLocation?: TerminalPanel;
  isTerminalDisabled?: boolean;
  isWorkspaceReady?: boolean;
  locale?: { formatMessage(descriptor: { defaultMessage: string }, values: { index: number }): string };
  onTabsChanged?(tabs: readonly TerminalTab[]): void;
}
interface OpenTerminalOptions { cwd?: string; hostId?: string; insertPosition?: number; revealAndFocus?: boolean }
interface SeedTerminalOptions { panel: TerminalPanel; sessionId: string; snapshot: TerminalSessionSnapshot }
interface ConversationTerminalState { activeSessionId: string | null; counter: number; sessions: Map<string, TerminalSessionSnapshot>; tabs: TerminalTab[] }

const states = new WeakMap<TerminalScope, ConversationTerminalState>();
const watchers = new WeakMap<TerminalScope, Set<() => void>>();
function stateFor(scope: TerminalScope): ConversationTerminalState { let state = states.get(scope); if (state == null) { state = { activeSessionId: null, counter: 0, sessions: new Map(), tabs: [] }; states.set(scope, state); } return state; }
function notify(scope: TerminalScope): void { scope.onTabsChanged?.(stateFor(scope).tabs); watchers.get(scope)?.forEach(listener => listener()); }
function conversationId(scope: TerminalScope): string | null { if (scope.isTerminalDisabled) return null; if (scope.route.routeKind === "home") return scope.route.clientThreadId ?? null; if (scope.route.routeKind === "local-thread") return scope.route.conversationId ?? null; return null; }
function terminalTitle(scope: TerminalScope, snapshot: TerminalSessionSnapshot, index: number, count: number): string {
  const explicit = snapshot.title?.trim(); if (explicit) return explicit;
  const cwd = snapshot.cwd?.trim(); if (cwd) { const basename = cwd.replaceAll("\\", "/").split("/").filter(Boolean).at(-1) ?? cwd; return count > 1 ? `${basename} ${index + 1}` : basename; }
  return scope.locale?.formatMessage({ defaultMessage: "Terminal {index}" }, { index: index + 1 }) ?? `Terminal ${index + 1}`;
}
function refreshTabs(scope: TerminalScope): void {
  const state = stateFor(scope); const counts = new Map<TerminalPanel, number>();
  for (const tab of state.tabs) counts.set(tab.panel, (counts.get(tab.panel) ?? 0) + 1);
  state.tabs = state.tabs.map(tab => { const snapshot = state.sessions.get(tab.sessionId) ?? {}; const siblings = state.tabs.filter(item => item.panel === tab.panel); return { ...tab, title: terminalTitle(scope, snapshot, siblings.findIndex(item => item.sessionId === tab.sessionId), counts.get(tab.panel) ?? 1) }; });
  notify(scope);
}
function createSession(scope: TerminalScope, snapshot: TerminalSessionSnapshot = {}): string { const state = stateFor(scope); const id = `terminal-${++state.counter}`; state.sessions.set(id, { ...snapshot, cwd: snapshot.cwd ?? scope.route.cwd, hostId: snapshot.hostId ?? scope.route.hostId }); return id; }
function openTerminal(scope: TerminalScope, requestedSessionId?: string, panel: TerminalPanel = defaultTerminalLocation(scope), options: OpenTerminalOptions = {}): string | null {
  if (conversationId(scope) == null) return null;
  const state = stateFor(scope); let sessionId = requestedSessionId;
  if (sessionId == null) sessionId = state.tabs.find(tab => tab.panel === panel && state.sessions.has(tab.sessionId))?.sessionId ?? createSession(scope, { cwd: options.cwd, hostId: options.hostId });
  else if (!state.sessions.has(sessionId)) state.sessions.set(sessionId, { cwd: options.cwd ?? scope.route.cwd, hostId: options.hostId ?? scope.route.hostId });
  const existing = state.tabs.find(tab => tab.sessionId === sessionId);
  if (existing != null) existing.panel = panel;
  else { const tab: TerminalTab = { panel, sessionId, title: "" }; const position = options.insertPosition; if (position == null || position < 0 || position >= state.tabs.length) state.tabs.push(tab); else state.tabs.splice(position, 0, tab); }
  if (options.revealAndFocus !== false) state.activeSessionId = sessionId;
  refreshTabs(scope); return sessionId;
}
function canOpenTerminal(scope: TerminalScope): boolean { return conversationId(scope) != null; }
function openBottomTerminal(scope: TerminalScope): void { openNewTerminalAt(scope, "bottom"); }
function openNewTerminalAt(scope: TerminalScope, panel: TerminalPanel, replaceSessionId?: string): void { const state = stateFor(scope); if (replaceSessionId != null) { state.tabs = state.tabs.filter(tab => tab.sessionId !== replaceSessionId); state.sessions.delete(replaceSessionId); } const sessionId = createSession(scope); openTerminal(scope, sessionId, panel); }
function showBottomTerminal(scope: TerminalScope): void { if (!bottomPanelHasActiveTerminal(scope)) openTerminal(scope, undefined, "bottom"); }
function showTerminal(scope: TerminalScope, panel: TerminalPanel = defaultTerminalLocation(scope)): void { if (panel === "bottom") showBottomTerminal(scope); else if (!rightPanelHasActiveTerminal(scope)) openTerminal(scope, undefined, "right"); }
function seedTerminalSession(scope: TerminalScope, { panel, sessionId, snapshot }: SeedTerminalOptions): void { stateFor(scope).sessions.set(sessionId, { ...snapshot }); openTerminal(scope, sessionId, panel, { revealAndFocus: false }); }
function defaultTerminalLocation(scope: TerminalScope): TerminalPanel { return scope.defaultTerminalLocation ?? "right"; }
function panelHasActiveTerminal(scope: TerminalScope, panel: TerminalPanel): boolean { const state = stateFor(scope); return state.activeSessionId != null && state.tabs.some(tab => tab.panel === panel && tab.sessionId === state.activeSessionId); }
function bottomPanelHasActiveTerminal(scope: TerminalScope): boolean { return panelHasActiveTerminal(scope, "bottom"); }
function rightPanelHasActiveTerminal(scope: TerminalScope): boolean { return panelHasActiveTerminal(scope, "right"); }
function scheduleTerminalAutoOpen(scope: TerminalScope): void { if (canOpenTerminal(scope) && scope.isWorkspaceReady !== false && stateFor(scope).tabs.length === 0) openBottomTerminal(scope); }
function watchAutoOpenTerminal(scope: TerminalScope): () => void { const listener = () => scheduleTerminalAutoOpen(scope); let listeners = watchers.get(scope); if (listeners == null) { listeners = new Set(); watchers.set(scope, listeners); } listeners.add(listener); scheduleTerminalAutoOpen(scope); return () => listeners?.delete(listener); }

const terminalController = Object.freeze({
  open: openTerminal,
  preloadExisting(scope: TerminalScope, sessionId: string, snapshot: TerminalSessionSnapshot, panel: TerminalPanel = defaultTerminalLocation(scope)): Promise<boolean> { if (!canOpenTerminal(scope)) return Promise.resolve(false); seedTerminalSession(scope, { panel, sessionId, snapshot }); return Promise.resolve(true); },
  close(scope: TerminalScope, sessionId: string): TerminalSessionSnapshot | null { const state = stateFor(scope); const snapshot = state.sessions.get(sessionId) ?? null; state.sessions.delete(sessionId); state.tabs = state.tabs.filter(tab => tab.sessionId !== sessionId); if (state.activeSessionId === sessionId) state.activeSessionId = state.tabs.at(-1)?.sessionId ?? null; refreshTabs(scope); return snapshot; },
  getTabs(scope: TerminalScope): readonly TerminalTab[] { return stateFor(scope).tabs; },
});
function initializeTerminalRuntime(): void { initializeTerminalWorkspaceWarningState(); void terminalWorkspaceWarningState; }

export {
  openBottomTerminal as a,
  bottomPanelHasActiveTerminal as c,
  terminalController as d,
  showBottomTerminal as f,
  seedTerminalSession as i,
  defaultTerminalLocation as l,
  watchAutoOpenTerminal as m,
  initializeTerminalRuntime as n,
  openNewTerminalAt as o,
  showTerminal as p,
  openTerminal as r,
  scheduleTerminalAutoOpen as s,
  canOpenTerminal as t,
  rightPanelHasActiveTerminal as u,
};
