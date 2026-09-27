import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/open-automation-side-panel-tab";
import "@rchunk/use-target-apps";
import "@rchunk/local-conversation-side-chat";
import "@rchunk/thread-pin-shortcut-bridge";

export interface ThreadOverflowMenuProps { canPin?: boolean; conversationId?: string | null; cwd?: string; isPinned?: boolean; isWorktreeThread?: boolean; leadingItems?: unknown; onArchive?(): void; onCopyAppLink?(): void; onCopyConversationMarkdown?(): void; onCopyWorkingDirectory?(): void; onMarkUnread?(): void; onOpenSideChat?(): void; onRename?(): void; onTogglePin?(): void; title?: string }
let jsx: JsxRuntime;
function ThreadOverflowMenu(props: ThreadOverflowMenuProps): unknown { const runtime = ensureJsx(); const actions = [{ label: props.isPinned ? "Unpin" : "Pin", action: props.canPin === false ? undefined : props.onTogglePin }, { label: "Rename", action: props.onRename }, { label: "Mark as unread", action: props.onMarkUnread }, { label: "Copy link", action: props.onCopyAppLink }, { label: "Copy conversation", action: props.onCopyConversationMarkdown }, { label: "Copy working directory", action: props.cwd == null ? undefined : props.onCopyWorkingDirectory }, { label: "Open side chat", action: props.onOpenSideChat }, { label: "Archive", action: props.onArchive }].filter((item) => item.action != null); return runtime.jsxs(runtime.Fragment, { children: [props.leadingItems, runtime.jsx("div", { role: "menu", "aria-label": props.title ?? "Thread actions", children: actions.map((item) => runtime.jsx("button", { type: "button", role: "menuitem", onClick: item.action, children: item.label }, item.label)) })] }); }
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initialize as n, ThreadOverflowMenu as t };
