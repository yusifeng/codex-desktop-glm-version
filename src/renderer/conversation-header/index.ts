// Desktop and extension conversation header. Release chunk: header-d5a6f0c17802.js.
import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as dockChunk from "@rchunk/dock";

interface HeaderProps {
  allowInitialRouteBack?: boolean;
  className?: string;
  centerContent?: unknown;
  desktopDeepLinkConversationId?: string | null;
  title?: unknown;
  onBack?(): void;
  trailing?: unknown;
}
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface SharedRuntime { $3(): unknown; C_(): void; FX(): void; G2(messages: Record<string, unknown>): void; I3(): JsxRuntime; If(): void; K2(): void; QI(): void; Y2: unknown; Yh: unknown; Zh(): void; c_(): void; h4(): void; m4(...classes: Array<string | false | null | undefined>): string; wL(): void }
interface InitialRuntime { Dft(): void; M6t(): void; Qgn(): void; Re?: unknown; _Et(action: string, source: string): void; bsn(): void; i_n(): { pathname: string }; uun(): void; v4(): void }
interface DockRuntime { n(): void }
const shared = sharedChunk as unknown as SharedRuntime;
const initial = initialChunk as unknown as InitialRuntime;
const dock = dockChunk as unknown as DockRuntime;
let jsx: JsxRuntime;
let initialized = false;

function dispatchRecentTasksMenu(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("open-recent-tasks-menu"));
}
function startNewConversation(): void { initial._Et("newTask", "header_new_thread"); }
function translated(id: string, defaultMessage: string, description: string): unknown { return jsx.jsx(shared.Y2, { id, defaultMessage, description }); }
function routeFallbackTitle(pathname: string): unknown {
  if (pathname.startsWith("/local/") || pathname.startsWith("/remote/")) return translated("codex.taskRow.title", "New chat", "Default title for a Codex task that doesn't have a title");
  if (pathname.includes("recent") || pathname === "/") return translated("header.recentChats", "Chats", "Header label for recent tasks");
  return null;
}

function Header({ allowInitialRouteBack = false, className, centerContent, title, onBack, trailing }: HeaderProps): unknown {
  initialize();
  const { pathname } = initial.i_n();
  const back = onBack ?? startNewConversation;
  const showBack = allowInitialRouteBack || pathname.startsWith("/local/") || pathname.startsWith("/remote/");
  const resolvedTitle = title ?? routeFallbackTitle(pathname);
  const titleContent = jsx.jsx("div", {
    className: "me-3 line-clamp-1 flex min-w-0 flex-1 items-center gap-1 truncate",
    style: { viewTransitionName: "header-title" },
    children: resolvedTitle == null ? null : jsx.jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-1", children: [
      showBack ? jsx.jsx(shared.Yh, { color: "ghost", type: "button", onClick: back, "aria-label": translated("header.back", "Back", "Back button label for returning to the previous screen"), children: "←" }) : null,
      jsx.jsx(shared.Yh, { color: "ghostActive", type: "button", onClick: dispatchRecentTasksMenu, className: "min-w-0 flex-1 truncate !px-0 !py-0 text-start text-sm text-default hover:!bg-transparent hover:opacity-80 electron:font-medium", children: jsx.jsx("span", { className: "truncate", children: resolvedTitle }) }),
    ] }),
  });
  const toolbar = jsx.jsxs("div", { className: "flex items-center electron:h-toolbar extension:py-row-y justify-between", children: [titleContent, jsx.jsx("div", { className: "flex flex-shrink-0 items-center gap-1", children: trailing })] });
  return jsx.jsxs("div", { className: shared.m4("draggable extension:px-panel", className), children: [toolbar, centerContent == null ? null : jsx.jsx("div", { className: "flex items-center justify-center no-drag extension:pb-row-y", children: centerContent }), null] });
}

function initialize(): void {
  if (initialized) return;
  initialized = true;
  shared.$3(); shared.C_(); shared.FX(); shared.If(); shared.K2(); shared.QI(); shared.Zh(); shared.c_(); shared.h4(); shared.wL();
  initial.bsn(); initial.Dft(); initial.M6t(); initial.Qgn(); initial.uun(); initial.v4(); dock.n();
  shared.G2({ backButton: { id: "header.back", defaultMessage: "Back", description: "Back button label for returning to the previous screen" }, newChatTitle: { id: "header.newChatTitle", defaultMessage: "New chat", description: "Fallback title shown in the Chrome extension side panel header before a task exists" } });
  jsx = shared.I3();
}

initialize();
export { Header };
