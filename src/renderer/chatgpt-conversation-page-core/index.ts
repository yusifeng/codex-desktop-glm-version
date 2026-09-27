// ChatGPT 会话页面核心：路由页、共享页、主体、标题栏与分享动作。
// 原版：chatgpt-conversation-page-5973e560922b.js。

import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  Yh as Button,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/conversation-screen";
import "@rchunk/lock";
import "@rchunk/banner";
import "@rchunk/open-automation-side-panel-tab";
import "@rchunk/scroll-to-match";
import "@rchunk/conversation-summary";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/document-title";
import "@rchunk/latest-turn-preview";
import "@rchunk/chat-tab-metadata-bridge";
import "@rchunk/right-panel-composer-overlay";
import "@rchunk/thread-panel-toggle-button";
import "@rchunk/thread-emoji";
import "@rchunk/virtualized-turn-list";
import "@rchunk/thread-scroll-layout";
import "@rchunk/thread-bridge";
import "@rchunk/timestamp-separator";
import "@rchunk/conversation-source";
import "@rchunk/turn-preview-body-items";
import "@rchunk/conversation-navigation-state";
import "@rchunk/browser-composer-disclaimer-core";
import "@rchunk/archived-conversation-preview-footer";
import "@rchunk/conversation-ui";
import "@rchunk/artifact-viewer";
import "@rchunk/composer-provider";
import "@rchunk/chatgpt-sources-message";
import "@rchunk/chatgpt-gizmo-header";
import "@rchunk/chatgpt-temporary-chat-ui";
import "@rchunk/cloud-browser-preview";
import "@rchunk/conversation-move-menu-items";
import "@rchunk/chatgpt-sources-side-panel-tab";
import "@rchunk/create-output-menu";
import "@rchunk/add-source-menu";
import "@rchunk/open-audio-summary-dialog";
import "@rchunk/open-conversation-files";
import "@rchunk/codex-thread-report-dialog-entry";
import "@rchunk/chatgpt-entity-side-panel-tab";

export interface ChatGptProject {
  id: string;
  name: string;
  icon?: unknown;
  shared?: boolean;
}

export interface ConversationTurn {
  id: string;
  role: "assistant" | "system" | "user";
  text?: string;
  pending?: boolean;
  [key: string]: unknown;
}

export interface ConversationHeaderProps {
  breadcrumbHeader?: unknown;
  isCloudTask?: boolean;
  isTemporaryChat?: boolean;
  project?: ChatGptProject | null;
  startActions?: unknown;
  title?: string | null;
  workTitle?: string | null;
}

export interface HeaderToolbarProps {
  allowsThreadContentOverlap?: boolean;
  project?: ChatGptProject | null;
  startActions?: unknown;
  workTitle?: string | null;
}

export interface ConversationLayoutProps {
  children?: unknown;
  conversationId: string;
  header?: unknown;
  isArchivedPreview?: boolean;
  rightPanel?: unknown;
  title?: string | null;
}

export interface ConversationContentProps {
  archivedPreviewFooter?: unknown;
  composer?: unknown;
  conversationId: string;
  emptyState?: unknown;
  error?: string | null;
  header?: unknown;
  isArchivedPreview?: boolean;
  isCloudTask?: boolean;
  isLoading?: boolean;
  isReadOnly?: boolean;
  isRestricted?: boolean;
  isStreaming?: boolean;
  isTemporaryChat?: boolean;
  onAddFiles?(files: readonly File[]): void;
  onRetry?(): void;
  project?: ChatGptProject | null;
  rightPanel?: unknown;
  sharedConversationId?: string | null;
  title?: string | null;
  turns?: readonly ConversationTurn[];
}

export interface ChatGptConversationPageProps
  extends Omit<ConversationContentProps, "conversationId"> {
  conversationId?: string | null;
  redirectTo?: string;
}

export interface ChatGptSharedConversationPageProps
  extends Omit<ConversationContentProps, "conversationId" | "sharedConversationId"> {
  conversationId?: string | null;
  onReport?(conversationId: string): void;
  sharedConversationId?: string | null;
}

export interface ShareConversationButtonProps {
  conversationId: string;
  isReady?: boolean;
  isRestricted?: boolean;
  isStreaming?: boolean;
  onShare?(conversationId: string): void;
}

let jsxRuntime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;

function jsx(): JsxRuntime {
  jsxRuntime ??= getJsxRuntime();
  return jsxRuntime;
}

function react(): ReactRuntime {
  React ??= getReactRuntime();
  return React;
}

function renderProjectBreadcrumb(project: ChatGptProject, title?: string | null): unknown {
  const runtime = jsx();
  return runtime.jsxs("nav", {
    "aria-label": "Breadcrumb",
    className: "flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap",
    children: [
      runtime.jsx("a", {
        className: "flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1",
        href: `/g/${project.id}`,
        children: runtime.jsxs("span", {
          children: [
            project.icon ?? runtime.jsx("span", { "aria-hidden": true, children: project.shared ? "◇" : "◆" }),
            runtime.jsx("span", { className: "truncate", children: project.name }),
          ],
        }),
      }),
      title == null || title === "" ? null : runtime.jsxs(runtime.Fragment, {
        children: [
          runtime.jsx("span", { "aria-hidden": true, className: "text-tertiary", children: "/" }),
          runtime.jsx("span", { "aria-current": "page", className: "truncate", children: title }),
        ],
      }),
    ],
  });
}

/** 原 op（导出 p）：普通会话及 Work 项目的顶部标题栏。 */
function ConversationHeaderToolbar({
  allowsThreadContentOverlap = false,
  project,
  startActions,
  workTitle,
}: HeaderToolbarProps): unknown {
  const runtime = jsx();
  const title = project == null && workTitle
    ? runtime.jsx("span", { className: "min-w-0 truncate", children: workTitle })
    : null;
  const breadcrumb = project == null ? null : renderProjectBreadcrumb(project, workTitle);
  const workLabel = workTitle == null
    ? null
    : runtime.jsxs("span", { className: "shrink-0 text-tertiary", children: ["·", " Work"] });
  return runtime.jsx("header", {
    className: `thread-header-toolbar${allowsThreadContentOverlap ? " thread-header-toolbar--overlap" : ""}`,
    "data-app-shell-thread-content-overlap": allowsThreadContentOverlap || undefined,
    children: runtime.jsxs("div", {
      className: "flex min-w-0 flex-1 items-center gap-2",
      children: [title, breadcrumb, workLabel, startActions],
    }),
  });
}

/** 原 yp（导出 d）：共享会话的隐私提示与举报入口。 */
function SharedConversationDisclaimer(props: {
  conversationId?: string;
  onReport?(conversationId: string): void;
} = {}): unknown {
  const runtime = jsx();
  const canReport = props.conversationId != null && props.onReport != null;
  return runtime.jsxs("div", {
    className: "flex flex-col items-center gap-1 text-center text-xs",
    children: [
      runtime.jsx("p", { children: "This is a copy of a shared ChatGPT chat. It won't be added to memory." }),
      canReport
        ? runtime.jsx(Button, {
            color: "ghostActive",
            type: "button",
            onClick: () => props.onReport?.(props.conversationId ?? ""),
            children: "Report conversation",
          })
        : null,
    ],
  });
}

/** 原 Op（导出 l）：共享帖动作只在 ChatGPT 访问可用时出现。 */
function SharedConversationHeaderAction(props: {
  authMethod?: string;
  chatGptAccessStatus?: string;
  children?: unknown;
  isWorkOnlyChatDisabled?: boolean;
} = {}): unknown {
  if (
    props.authMethod != null &&
    (props.authMethod !== "chatgpt" || props.chatGptAccessStatus !== "allowed" || props.isWorkOnlyChatDisabled === true)
  ) return null;
  const runtime = jsx();
  return runtime.jsx("div", {
    className: "chatgpt-shared-post-actions flex items-center gap-2 rounded-lg bg-surface/60 backdrop-blur-xl",
    "data-header-action-id": "chatgpt-shared-post-actions",
    children: props.children,
  });
}

/** 原 Hp（导出 a）：会话主布局、标题栏和右侧面板出口。 */
function ConversationLayout({
  children,
  conversationId,
  header,
  isArchivedPreview = false,
  rightPanel,
  title,
}: ConversationLayoutProps): unknown {
  const runtime = jsx();
  return runtime.jsxs(runtime.Fragment, {
    children: [
      isArchivedPreview ? null : runtime.jsx("div", { className: "conversation-document-title", children: title }),
      header == null ? null : runtime.jsx("div", { className: "conversation-header", children: header }),
      runtime.jsx("main", {
        className: "conversation-main-content",
        "data-conversation-id": conversationId,
        "data-layout": "thread-edge-scroll",
        children,
      }),
      runtime.jsx("aside", { className: "conversation-right-panel", children: rightPanel }),
    ],
  });
}

/** 原 Up（导出 n）：临时聊天、云任务和普通会话标题的统一分派。 */
function ConversationHeader({
  breadcrumbHeader,
  isCloudTask = false,
  isTemporaryChat = false,
  project,
  startActions,
  title,
  workTitle,
}: ConversationHeaderProps): unknown {
  const runtime = jsx();
  if (isTemporaryChat) {
    return runtime.jsx("div", {
      className: "temporary-chat-indicator",
      "aria-label": "Temporary chat",
      children: "Temporary chat",
    });
  }
  const cloudIndicator = isCloudTask
    ? runtime.jsx("span", {
        "aria-label": "Cloud chat",
        className: "cloud-chat-indicator",
        title: "This chat was started in the cloud",
        children: "☁",
      })
    : null;
  const toolbar = runtime.jsx(ConversationHeaderToolbar, {
    project,
    startActions: runtime.jsxs(runtime.Fragment, { children: [startActions, cloudIndicator] }),
    workTitle: workTitle ?? title,
  });
  return breadcrumbHeader == null
    ? toolbar
    : runtime.jsxs(runtime.Fragment, { children: [breadcrumbHeader, toolbar] });
}

/** 原 Wp（导出 r）：右侧标题动作的重叠背景容器。 */
function ConversationHeaderActions({ children }: { children?: unknown }): unknown {
  return jsx().jsx("div", {
    className: "flex items-center gap-2 rounded-lg bg-surface/60 backdrop-blur-xl",
    "data-header-action-id": "chatgpt-conversation-actions",
    children,
  });
}

function renderTurns(turns: readonly ConversationTurn[], emptyState: unknown): unknown {
  const runtime = jsx();
  if (turns.length === 0) return emptyState ?? null;
  return runtime.jsx("div", {
    className: "chatgpt-conversation-transcript",
    children: turns.map((turn) => runtime.jsx("article", {
      className: `conversation-turn conversation-turn--${turn.role}`,
      "data-pending": turn.pending || undefined,
      "data-turn-id": turn.id,
      children: turn.text,
    }, turn.id)),
  });
}

/** 原 Pp（导出 t）：加载、错误、只读/归档与编辑器状态的会话主体。 */
function ConversationContent(props: ConversationContentProps): unknown {
  const runtime = jsx();
  const turns = props.turns ?? [];
  let body: unknown;
  if (props.isLoading) {
    body = runtime.jsx("div", { role: "status", children: "Loading conversation…" });
  } else if (props.error != null) {
    body = runtime.jsxs("div", {
      role: "alert",
      children: [
        runtime.jsx("p", { children: props.error }),
        props.onRetry == null ? null : runtime.jsx(Button, { type: "button", onClick: props.onRetry, children: "Retry" }),
      ],
    });
  } else {
    body = renderTurns(turns, props.emptyState);
  }
  const composerDisabled = props.isReadOnly === true || props.isArchivedPreview === true || props.isRestricted === true;
  return runtime.jsx(ConversationLayout, {
    conversationId: props.conversationId,
    header: props.header ?? runtime.jsx(ConversationHeader, {
      isCloudTask: props.isCloudTask,
      isTemporaryChat: props.isTemporaryChat,
      project: props.project,
      title: props.title,
    }),
    isArchivedPreview: props.isArchivedPreview,
    rightPanel: props.rightPanel,
    title: props.title,
    children: runtime.jsxs("section", {
      className: "flex h-full min-h-0 flex-col",
      "data-shared-conversation-id": props.sharedConversationId,
      children: [
        runtime.jsx("div", { className: "min-h-0 flex-1", children: body }),
        props.archivedPreviewFooter,
        runtime.jsx("div", {
          className: "conversation-composer",
          "aria-disabled": composerDisabled,
          children: props.composer,
        }),
      ],
    }),
  });
}

/** 原 Mp（导出 i）：普通会话路由页。 */
function ChatGptConversationPage(props: ChatGptConversationPageProps = {}): unknown {
  const runtime = jsx();
  if (props.conversationId == null || props.conversationId === "") {
    return runtime.jsx("a", { "data-redirect": true, href: props.redirectTo ?? "/", children: "Return home" });
  }
  return runtime.jsx(ConversationContent, { ...props, conversationId: props.conversationId, sharedConversationId: null });
}

/** 原 Np（导出 s）：共享会话路由页。 */
function ChatGptSharedConversationPage(props: ChatGptSharedConversationPageProps = {}): unknown {
  const runtime = jsx();
  const sharedId = props.sharedConversationId ?? props.conversationId;
  if (sharedId == null || sharedId === "") {
    return runtime.jsx("a", { "data-redirect": true, href: "/", children: "Return home" });
  }
  const conversationId = props.conversationId ?? sharedId;
  return runtime.jsx(ConversationContent, {
    ...props,
    conversationId,
    isReadOnly: true,
    sharedConversationId: sharedId,
    archivedPreviewFooter: runtime.jsx(SharedConversationDisclaimer, {
      conversationId: sharedId,
      onReport: props.onReport,
    }),
  });
}

/** 原 tm（导出 o）：会话分享按钮及三种禁用原因。 */
function ShareConversationButton({
  conversationId,
  isReady = true,
  isRestricted = false,
  isStreaming = false,
  onShare,
}: ShareConversationButtonProps): unknown {
  const disabledReason = isRestricted
    ? "Sharing isn't available for this chat"
    : isStreaming
      ? "Wait for ChatGPT to finish responding"
      : !isReady
        ? "Load the conversation before sharing"
        : null;
  return jsx().jsx(Button, {
    "aria-label": "Share",
    color: "ghostActive",
    disabled: disabledReason != null,
    radius: "large",
    size: "toolbar",
    title: disabledReason ?? "Share",
    type: "button",
    onClick: () => onShare?.(conversationId),
    children: "Share",
  });
}

/** 原 cp/Ep/jp/um：保持各子图可独立、幂等地初始化。 */
function initializeConversationHeaderToolbar(): void { jsx(); }
function initializeSharedConversationDisclaimer(): void { jsx(); react(); }
function initializeSharedConversationHeaderAction(): void { jsx(); }
function initializeChatGptConversationPage(): void { jsx(); react(); }

export {
  ConversationLayout as a,
  initializeChatGptConversationPage as c,
  SharedConversationDisclaimer as d,
  initializeSharedConversationDisclaimer as f,
  ChatGptConversationPage as i,
  SharedConversationHeaderAction as l,
  initializeConversationHeaderToolbar as m,
  ConversationHeader as n,
  ShareConversationButton as o,
  ConversationHeaderToolbar as p,
  ConversationHeaderActions as r,
  ChatGptSharedConversationPage as s,
  ConversationContent as t,
  initializeSharedConversationHeaderAction as u,
};
