// Thread overflow actions.  The release component derives actions from the
// current app scope; callers provide thread identity/context, not callbacks.

import * as shared from "@rchunk/app-shared";
import * as initial from "@rchunk/app-initial";
import * as automationPanel from "@rchunk/open-automation-side-panel-tab";
import * as targetApps from "@rchunk/use-target-apps";
import * as sideChat from "@rchunk/local-conversation-side-chat";
import * as pinBridge from "@rchunk/thread-pin-shortcut-bridge";

interface ThreadOverflowMenuProps {
  archiveNavigation?: "home" | string;
  archiveSource?: string;
  canPin?: boolean;
  conversationId?: string | null;
  cwd?: string;
  dropdownAlign?: "start" | "center" | "end";
  getConversationMarkdown?: (() => Promise<string> | string) | null;
  hostId?: string;
  isWorktreeThread?: boolean;
  leadingItems?: unknown[];
  markdownParentConversationId?: string | null;
  onRenamePendingWorktree?(title: string): void;
  pendingClientThreadId?: string | null;
  pendingWorktreeId?: string | null;
  sideChatTab?: unknown;
  title?: string;
  triggerButtonClassName?: string;
  triggerButtonColor?: string;
  triggerButtonSize?: string;
  triggerIconClassName?: string;
}
interface ThreadActions {
  archiveThread?(input: Record<string, unknown>): void;
  copyAppLink?(conversationId: string): void;
  copyConversationMarkdown?(input: Record<string, unknown>): void;
  copyWorkingDirectory?(cwd?: string): void;
  markThreadAsUnread?(input: Record<string, unknown>): void;
  renameThread?(input: Record<string, unknown>): Promise<void> | void;
}

const sh = shared as Record<string, unknown>;
const init = initial as Record<string, unknown>;
const automation = automationPanel as Record<string, unknown>;
const apps = targetApps as Record<string, unknown>;
const chat = sideChat as Record<string, unknown>;
const pin = pinBridge as Record<string, unknown>;
let jsx: { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown };
let react: { useState<T>(initial: T): [T, (next: T | ((current: T) => T)) => void] };
let initialized = false;

function useScope(): { value: Record<string, unknown>; get<T = unknown>(signal: unknown, ...args: unknown[]): T; query?: { getOrFetch?(signal: unknown): Promise<unknown> } } | null {
  const hook = sh.LX;
  if (typeof hook !== "function") return null;
  try { return (hook as (signal: unknown) => ReturnType<typeof useScope>)(init.$en); } catch { return null; }
}
function useSignal<T>(signal: unknown, fallback: T, ...args: unknown[]): T {
  const hook = sh.BX ?? sh.HX;
  if (typeof hook !== "function" || signal == null) return fallback;
  try { return (hook as (...values: unknown[]) => T)(signal, ...args); } catch { return fallback; }
}
function useThreadActions(): ThreadActions {
  const hook = init.vlt;
  if (typeof hook !== "function") return {};
  try { return (hook as () => ThreadActions)(); } catch { return {}; }
}
function useNavigation(): ((path: string, options?: unknown) => void) | null {
  const hook = init.o_n;
  if (typeof hook !== "function") return null;
  try { return (hook as () => (path: string, options?: unknown) => void)(); } catch { return null; }
}
function usePinState(conversationId: string | null | undefined, canPin: boolean): { isPinned: boolean; togglePin(): void } {
  const hook = init._lt;
  if (typeof hook !== "function") return { isPinned: false, togglePin() {} };
  try { return (hook as (id: string | null | undefined, options: { canPin: boolean }) => { isPinned: boolean; togglePin(): void })(conversationId, { canPin }); }
  catch { return { isPinned: false, togglePin() {} }; }
}
function registerShortcut(action: string, handler: () => void, enabled = true): void {
  const hook = init.pEt;
  if (typeof hook === "function") (hook as (...args: unknown[]) => void)(action, handler, { enabled });
}

function ThreadOverflowMenu(props: ThreadOverflowMenuProps): unknown {
  ensureInitialized();
  const scope = useScope();
  const actions = useThreadActions();
  const navigate = useNavigation();
  const canPin = props.canPin !== false;
  const isWorktreeThread = props.isWorktreeThread === true;
  const { isPinned, togglePin } = usePinState(props.conversationId, canPin);
  const [renameDraft, setRenameDraft] = react.useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = react.useState(false);
  const resolvedHostId = props.hostId ?? useSignal<string | undefined>(init.wQt, undefined, props.conversationId);
  const threadBusy = useSignal<boolean>(init.JZt, false, props.conversationId) || useSignal<boolean>(init.OY, false, props.conversationId);
  const collaborationMode = useSignal<string | null>(init.rQt, null, props.conversationId);
  const activeOperation = useSignal<{ type?: string } | null>(init.JQt, null, props.conversationId);
  const hasAutomation = activeOperation?.type === "active";
  const routeIsCurrent = scope?.value.routeKind === "local-thread" && scope.value.conversationId === props.conversationId;
  const canOpenSideChat = props.conversationId != null && !threadBusy && props.sideChatTab != null;

  if (props.conversationId == null && props.pendingWorktreeId == null) return null;

  const onPin = (): void => { if (canPin && !threadBusy) togglePin(); };
  const onRename = (): void => { if (!threadBusy) setRenameDraft(props.title ?? ""); };
  const onMarkUnread = (): void => {
    if (props.conversationId != null) actions.markThreadAsUnread?.({ conversationId: props.conversationId, hostId: resolvedHostId });
  };
  const onCopyLink = (): void => { if (props.conversationId != null) actions.copyAppLink?.(props.conversationId); };
  const onCopyMarkdown = (): void => {
    if (props.conversationId != null && props.getConversationMarkdown != null) actions.copyConversationMarkdown?.({ conversationId: props.conversationId, parentConversationId: props.markdownParentConversationId ?? null, getMarkdown: props.getConversationMarkdown });
  };
  const onCopyCwd = (): void => { actions.copyWorkingDirectory?.(props.cwd); };
  const onOpenSideChat = (): void => {
    if (scope == null || props.conversationId == null || props.sideChatTab == null || typeof chat.r !== "function") return;
    Promise.resolve((chat.r as (...args: unknown[]) => unknown)(scope, props.sideChatTab, { sourceConversationId: props.conversationId, cwd: props.cwd, hostId: resolvedHostId, collaborationMode })).catch(() => undefined);
  };
  const archive = (): void => {
    if (props.conversationId == null || threadBusy) return;
    actions.archiveThread?.({
      conversationId: props.conversationId,
      hostId: resolvedHostId,
      source: props.archiveSource ?? "thread_overflow_menu",
      onArchiveStart: props.archiveNavigation === "home" && navigate != null ? () => navigate("/", { replace: true, state: { focusComposerNonce: Date.now() } }) : undefined,
    });
    setArchiveConfirmation(false);
  };
  const onArchive = (): void => {
    if (hasAutomation) setArchiveConfirmation(true); else archive();
  };
  const onSchedule = (): void => {
    if (scope == null || typeof automation.r !== "function") return;
    (automation.r as (input: Record<string, unknown>) => void)({
      scope,
      seed: { directiveKey: `thread-overflow-${props.conversationId}`, kind: "heartbeat", name: props.title ?? "", prompt: "", targetThreadId: props.conversationId, status: "ACTIVE" },
      title: props.title ?? "New scheduled task",
    });
  };
  const onForkLocal = (): void => { if (scope != null && typeof init.Qln === "function" && props.conversationId != null) void (init.Qln as (...args: unknown[]) => unknown)(scope, { sourceConversationId: props.conversationId, sourceWorkspaceRoot: props.cwd }); };
  const onForkWorktree = (): void => { if (scope != null && typeof init.flt === "function" && props.conversationId != null) void (init.flt as (...args: unknown[]) => unknown)(scope, { sourceConversationId: props.conversationId, sourceWorkspaceRoot: props.cwd }); };

  registerShortcut("toggleThreadPin", onPin, canPin && !threadBusy);
  registerShortcut("renameThread", onRename, !threadBusy);
  registerShortcut("archiveThread", onArchive, !threadBusy);
  registerShortcut("copyWorkingDirectory", onCopyCwd, props.cwd != null);
  registerShortcut("copyDeeplink", onCopyLink, props.conversationId != null);
  registerShortcut("copyConversationMarkdown", onCopyMarkdown, props.conversationId != null && props.getConversationMarkdown != null);
  registerShortcut("openSideChat", onOpenSideChat, canOpenSideChat);

  const items = [
    ...(props.leadingItems ?? []),
    menuItem(isPinned ? "Unpin" : "Pin", onPin, !canPin || threadBusy),
    menuItem("Rename", onRename, threadBusy),
    routeIsCurrent ? menuItem("Mark as unread", onMarkUnread, false) : null,
    menuItem("Copy link", onCopyLink, props.conversationId == null),
    menuItem("Copy conversation", onCopyMarkdown, props.getConversationMarkdown == null),
    menuItem("Copy working directory", onCopyCwd, props.cwd == null),
    menuItem("Open side chat", onOpenSideChat, !canOpenSideChat),
    menuItem("Schedule task", onSchedule, props.conversationId == null),
    menuItem(isWorktreeThread ? "Fork locally" : "Fork in this worktree", onForkLocal, props.conversationId == null),
    menuItem("Fork into new worktree", onForkWorktree, props.conversationId == null),
    menuItem("Archive", onArchive, threadBusy),
  ].filter((item): item is unknown => item != null);

  const trigger = jsx.jsx("button", {
    type: "button",
    className: props.triggerButtonClassName,
    "aria-label": "More actions",
    "data-color": props.triggerButtonColor ?? "ghost",
    "data-size": props.triggerButtonSize ?? "icon",
    children: jsx.jsx("span", { className: props.triggerIconClassName ?? "icon-sm", "aria-hidden": true, children: "•••" }),
  });
  const dropdown = jsx.jsxs("details", {
    className: "thread-overflow-menu",
    "data-align": props.dropdownAlign ?? "start",
    children: [jsx.jsx("summary", { children: trigger }), jsx.jsx("div", { role: "menu", "aria-label": "Thread actions", children: items })],
  });

  return jsx.jsxs(jsx.Fragment, {
    children: [
      dropdown,
      renameDraft == null ? null : renameDialog(renameDraft, setRenameDraft, props, actions),
      archiveConfirmation ? confirmationDialog("Archive this chat and its scheduled task?", archive, () => setArchiveConfirmation(false)) : null,
    ],
  });
}

function menuItem(label: string, onSelect: () => void, disabled: boolean): unknown {
  return jsx.jsx("button", { type: "button", role: "menuitem", disabled, onClick: onSelect, children: label }, label);
}
function renameDialog(value: string, setValue: (next: string | null) => void, props: ThreadOverflowMenuProps, actions: ThreadActions): unknown {
  let draft = value;
  const save = (): void => {
    const title = draft.trim();
    if (props.pendingWorktreeId != null) props.onRenamePendingWorktree?.(title);
    else if (props.conversationId != null) void actions.renameThread?.({ conversationId: props.conversationId, previousTitle: props.title ?? "", title });
    setValue(null);
  };
  return jsx.jsxs("div", { role: "dialog", "aria-label": "Rename chat", children: [
    jsx.jsx("input", { defaultValue: value, onChange: (event: { currentTarget: { value: string } }) => { draft = event.currentTarget.value; } }),
    jsx.jsx("button", { type: "button", onClick: save, children: "Save" }),
    jsx.jsx("button", { type: "button", onClick: () => setValue(null), children: "Cancel" }),
  ] });
}
function confirmationDialog(message: string, confirm: () => void, cancel: () => void): unknown {
  return jsx.jsxs("div", { role: "alertdialog", children: [jsx.jsx("p", { children: message }), jsx.jsx("button", { type: "button", onClick: confirm, children: "Archive" }), jsx.jsx("button", { type: "button", onClick: cancel, children: "Cancel" })] });
}

function initializeThreadOverflowMenu(): void {
  if (initialized) return;
  initialized = true;
  if (typeof sh.I3 !== "function" || typeof sh.e6 !== "function") throw new Error("Thread overflow menu requires renderer JSX and React runtimes");
  jsx = (sh.I3 as () => typeof jsx)();
  react = (sh.e6 as () => typeof react)();
  for (const value of [automation.n, apps.n, chat.n, pin.n]) if (typeof value === "function") (value as () => void)();
}
function ensureInitialized(): void { if (!initialized) initializeThreadOverflowMenu(); }

export { initializeThreadOverflowMenu as n, ThreadOverflowMenu as t };
