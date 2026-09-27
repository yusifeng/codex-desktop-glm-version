import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, m4 as classNames } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/new-chat-suggestion-source-debug-state";
import "@rchunk/task-announcement-state";
import "@rchunk/avatar-overlay-debug-state";
import "@rchunk/comment-mode-coachmark-state";
import "@rchunk/browser-profile-import-availability";
import "@rchunk/thread-panel-secondary-state";
import "@rchunk/thread-virtualizer";
import "@rchunk/codex-mobile-setup-dialog";
import "@rchunk/sidebar-onboarding-checklist-task-config";
import "@rchunk/browser-session-queries";

interface DebugSection { content: unknown; icon?: unknown; id: string; label: string; }
interface DebugPanelProps {
  conversationIdOverride?: string;
  initialSectionId?: string;
  onClose?(): void;
  onHeaderPointerDown?(event: unknown): void;
  sections?: DebugSection[];
  showHeader?: boolean;
}

const DEFAULT_SECTIONS: DebugSection[] = [
  { id: "conversation", label: "Conversation", content: null },
  { id: "product-events", label: "Product events", content: null },
  { id: "app-server", label: "App server", content: null },
  { id: "project-git", label: "Project Git", content: null },
  { id: "chatgpt-api", label: "ChatGPT API", content: null },
  { id: "maitai", label: "Maitai", content: null },
  { id: "plugins", label: "Plugins", content: null },
  { id: "tabs", label: "Tabs", content: null },
  { id: "browser", label: "Browser", content: null },
];

function DebugPanel(props: DebugPanelProps): unknown {
  const runtime = getJsxRuntime();
  const sections = props.sections ?? DEFAULT_SECTIONS.map((section) => section.id === "conversation"
    ? { ...section, content: props.conversationIdOverride == null ? "No conversation selected" : `Conversation ${props.conversationIdOverride}` }
    : section);
  const selectedId = props.initialSectionId ?? sections[0]?.id;
  const selected = sections.find((section) => section.id === selectedId) ?? sections[0];
  return runtime.jsxs("div", { className: "flex h-full min-h-0 w-full flex-col text-sm", children: [
    props.showHeader === false ? null : runtime.jsxs("div", {
      className: classNames("flex h-toolbar-sm shrink-0 items-center gap-2 border-b border-default px-3", props.onHeaderPointerDown == null ? "draggable" : "cursor-move no-drag"),
      onPointerDown: props.onHeaderPointerDown,
      children: [runtime.jsx("h2", { className: "flex-1 font-medium", children: "Debug" }), runtime.jsx(Button, { "aria-label": "Close debug window", color: "ghost", size: "icon", onClick: props.onClose, children: "×" })],
    }),
    runtime.jsxs("div", { className: "flex min-h-0 flex-1 overflow-hidden", children: [
      runtime.jsx("nav", { "aria-label": "Debug sections", children: runtime.jsx("ul", { children: sections.map((section) => runtime.jsx("li", { children: runtime.jsx("button", { type: "button", "aria-current": section.id === selected?.id ? "page" : undefined, children: section.label }) }, section.id)) }) }),
      runtime.jsx("div", { "data-debug-section": selected?.id, className: "min-h-0 min-w-0 flex-1 overflow-auto", children: selected?.content ?? null }),
    ] }),
  ] });
}

let initialized = false;
function initializeDebugPanel(): void {
  if (initialized) return;
  initialized = true;
  getJsxRuntime();
}

export { initializeDebugPanel as n, DebugPanel as t };
