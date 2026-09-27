import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/terminal-workspace-warning-state";
export type TerminalPanel = "bottom" | "right";
export interface ThreadTerminalContext { conversationId: string; conversationTitle?: string; cwd?: string | null; hostId?: string }
export interface TerminalSession { context: ThreadTerminalContext; id: string; panel: TerminalPanel; snapshot?: unknown }
export interface TerminalScope { activePanel?: TerminalPanel; context?: ThreadTerminalContext | null; defaultTerminalLocation?: TerminalPanel; sessions: TerminalSession[]; terminalHidden?: boolean }
let sequence = 0;
function terminalTabId(sessionId: string): string { return `terminal:${sessionId}`; }
function hasTerminalContext(scope: TerminalScope): boolean { return scope.context != null; }
function openTerminal(scope: TerminalScope, sessionId?: string, panel: TerminalPanel = scope.defaultTerminalLocation ?? "bottom", options: { snapshot?: unknown } = {}): string | null { if (scope.context == null) return null; const id = sessionId ?? `terminal-${++sequence}`; const existing = scope.sessions.find(session => session.id === id); if (existing == null) scope.sessions.push({ context: scope.context, id, panel, snapshot: options.snapshot }); else { existing.panel = panel; existing.snapshot = options.snapshot ?? existing.snapshot; } scope.activePanel = panel; scope.terminalHidden = false; return id; }
function openBottomTerminal(scope: TerminalScope): void { void openTerminal(scope, undefined, "bottom"); }
function openNewTerminal(scope: TerminalScope, panel: TerminalPanel, replaceTabId?: string): void { if (replaceTabId != null) { const id = replaceTabId.replace(/^terminal:/, ""); scope.sessions = scope.sessions.filter(session => session.id !== id); } void openTerminal(scope, undefined, panel); }
function seedTerminalSession(scope: TerminalScope, input: { panel: TerminalPanel; sessionId: string; snapshot: unknown }): void { void openTerminal(scope, input.sessionId, input.panel, { snapshot: input.snapshot }); }
function ensureBottomTerminal(scope: TerminalScope): void { if (!scope.terminalHidden) openBottomTerminal(scope); }
function revealTerminal(scope: TerminalScope, panel: TerminalPanel = scope.defaultTerminalLocation ?? "bottom"): void { if (scope.terminalHidden) return; if (scope.sessions.some(session => session.panel === panel)) scope.activePanel = panel; else void openTerminal(scope, undefined, panel); }
function requestDeferredTerminal(scope: TerminalScope): void { if (scope.sessions.length === 0) openBottomTerminal(scope); }
function watchDeferredTerminal(scope: TerminalScope): () => void { requestDeferredTerminal(scope); return () => {}; }
function isBottomTerminalActive(scope: TerminalScope): boolean { return scope.activePanel === "bottom" && scope.sessions.some(session => session.panel === "bottom"); }
function isRightTerminalActive(scope: TerminalScope): boolean { return scope.activePanel === "right" && scope.sessions.some(session => session.panel === "right"); }
function defaultTerminalLocation(scope: TerminalScope): TerminalPanel { return scope.defaultTerminalLocation ?? "bottom"; }
const terminalEntityController = { getId: (session: TerminalSession) => terminalTabId(session.id), getTitle: (session: TerminalSession) => session.context.conversationTitle?.trim() || session.context.cwd?.split("/").filter(Boolean).at(-1) || "Terminal", open: openTerminal, preloadExisting(scope: TerminalScope, sessionId: string, snapshot: unknown): Promise<boolean> { return Promise.resolve(openTerminal(scope, sessionId, defaultTerminalLocation(scope), { snapshot }) != null); } };
function initializeThreadShellRuntime(): void {}
export { openBottomTerminal as a, isBottomTerminalActive as c, terminalEntityController as d, ensureBottomTerminal as f, seedTerminalSession as i, defaultTerminalLocation as l, watchDeferredTerminal as m, initializeThreadShellRuntime as n, openNewTerminal as o, revealTerminal as p, openTerminal as r, requestDeferredTerminal as s, hasTerminalContext as t, isRightTerminalActive as u };
