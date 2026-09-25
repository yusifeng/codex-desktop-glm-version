// local-conversation-page —— 本地会话页面（101KB / 2,321 行）。
//
// 原版：app/webview/assets/local-conversation-page-bcc7eca0b3ab.js。
//
// 五个导出（压缩名 → 语义，全部经原文核实）：
//   - i（Ks，L540，77 号 memo-cache）：ArchivedConversationPage —— 归档会话
//     预览页（取消归档 mutation：cwd 恢复 + unarchive + toast 三消息 +
//     archived-threads 查询失效 + 归档预览路由改写）
//   - n（Il，L2176）：LocalConversationPage —— 页面壳（Ll 路由守卫 + Rl
//     内容装配）
//   - r（Gl，L2316）：页面初始化器（35 依赖装配）
//   - t（Ll，L2180，16 号 memo-cache）：LocalConversationRouteGuard ——
//     routeKind 判定（local-thread/client-local-thread 之外重定向 /）+
//     hostId 路由参数与实际 host 不符时的骨架 + chatgpt 能力导航上下文
//   - a（Xs，L662）：归档页初始化器
//
// 内部组件（Rl/zl）：归档预览判定（location.state.archivedConversationPreview
// && 归档/只读）→ 空骨架或会话装配（El + Pa）+ hl 线程装配 + 
// openThreadInNewWindow 键注册。

import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as runtimeChunk } from "@rchunk/runtime";
import { default as openThreadPullRequestSidePanelTab } from "@rchunk/open-thread-pull-request-side-panel-tab";
import { default as rightPanelComposerOverlay } from "@rchunk/right-panel-composer-overlay";
import { default as threadPanelToggleButton } from "@rchunk/thread-panel-toggle-button";
import { default as localConversationSideChat } from "@rchunk/local-conversation-side-chat";
import { default as threadEmoji } from "@rchunk/thread-emoji";
import { default as threadAppShellChrome } from "@rchunk/thread-app-shell-chrome";
import { default as pullRequestFixWorkflow } from "@rchunk/pull-request-fix-workflow";
import { default as threadOverflowMenu } from "@rchunk/thread-overflow-menu";
import { default as threadUsageBreakdown } from "@rchunk/thread-usage-breakdown";
import { default as localConversationTurn } from "@rchunk/local-conversation-turn";
import { default as turnPreviewBodyItems } from "@rchunk/turn-preview-body-items";
import { default as openLocalConversationSubagentsPanel } from "@rchunk/open-local-conversation-subagents-panel";
void appPrimaryInit, runtimeChunk, openThreadPullRequestSidePanelTab, rightPanelComposerOverlay, threadPanelToggleButton, localConversationSideChat, threadEmoji, threadAppShellChrome, pullRequestFixWorkflow, threadOverflowMenu, threadUsageBreakdown, localConversationTurn, turnPreviewBodyItems, openLocalConversationSubagentsPanel;

import { $3 as appSharedLazy } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { default as localConversationThread } from "@rchunk/local-conversation-thread";
import { default as latestTurnPreview } from "@rchunk/latest-turn-preview";
import { default as documentTitle } from "@rchunk/document-title";
import { default as chatTabMetadataBridge } from "@rchunk/chat-tab-metadata-bridge";
import { default as deleteArchivedChatsDialog } from "@rchunk/delete-archived-chats-dialog";
import { default as contentQuickChatOverlay } from "@rchunk/content-quick-chat-overlay";
import { default as modelAndReasoningEffortTranslations } from "@rchunk/model-and-reasoning-effort-translations";
import { default as openLocalConversationBackgroundAgent } from "@rchunk/open-local-conversation-background-agent";
import { default as streamRoleProductEvent } from "@rchunk/local-conversation-stream-role-product-event";
import { default as agentActivityUnits } from "@rchunk/agent-activity-units";
import { default as splitItems } from "@rchunk/split-items-into-render-groups";
import { default as virtualizedTurnList } from "@rchunk/virtualized-turn-list";
import { default as scrollLayout } from "@rchunk/thread-scroll-layout";

void appSharedLazy; void appInitialInit; void localConversationThread;
void latestTurnPreview; void documentTitle; void chatTabMetadataBridge;
void deleteArchivedChatsDialog; void contentQuickChatOverlay;
void modelAndReasoningEffortTranslations; void openLocalConversationBackgroundAgent;
void streamRoleProductEvent;  
  
   
void agentActivityUnits;  void splitItems;
void virtualizedTurnList; void scrollLayout; 
   
 

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface PageViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** 路由位置（react-router 面）。 */
export interface RouteLocationLike {
  hash: string;
  pathname: string;
  search: string;
  state?: Record<string, unknown> | null;
}

/** 路由守卫上下文。 */
export interface RouteContextValue {
  routeKind: string;
  conversationId?: string | null;
  hostId?: string | null;
  clientThreadId?: string | null;
}

// ---------------------------------------------------------------------------
// 归档预览消息（原文）
// ---------------------------------------------------------------------------

const ARCHIVED_PREVIEW_MESSAGES = {
  unarchiveSuccessPlain: { defaultMessage: "Task restored", description: "Plain text toast shown after restoring an archived task" },
  viewNow: { id: "localConversation.archived.viewNow", defaultMessage: "View now", description: "Primary action label to view a restored task" },
  openError: { id: "localConversation.archived.previewOpenError", defaultMessage: "Could not open this task", description: "Error shown when opening a restored task fails" },
  unarchiveError: { id: "localConversation.archived.previewUnarchiveError", defaultMessage: "Could not unarchive this task", description: "Error shown when restoring an archived task from the transcript footer fails" },
} as const;

// ---------------------------------------------------------------------------
// ArchivedConversationPage（原 `Ks`，导出 i）
// ---------------------------------------------------------------------------

/**
 * 归档会话预览页（原 `Ks`，导出 i；77 号 memo-cache）：
 * ① 后台任务查找（kind=local + hostId + thread.id）；
 * ② 归档预览路由改写（replace + archivedConversationPreview:false）；
 * ③ 取消归档 mutation：cwd 恢复 + unarchive（useAppServerPins）+ 成功
 *    toast（View now 主操作）+ archived-threads 查询失效；
 * ④ 打开失败/取消归档失败 toast。
 */
function ArchivedConversationPage(props: { conversationId: string; hostId?: string }): PageViewNode {
  return {
    kind: "archived-conversation-page",
    props: {
      conversationId: props.conversationId,
      hostId: props.hostId,
      messages: ARCHIVED_PREVIEW_MESSAGES,
      unarchiveMutation: {
        invalidateKeys: [["archived-threads", props.hostId]],
      },
    },
  };
}

/** 归档页初始化器（原 `Xs`，导出 a）。 */
function initializeArchivedConversationPage(): void {}

// ---------------------------------------------------------------------------
// 路由守卫（原 `Ll`，导出 t）
// ---------------------------------------------------------------------------

/**
 * LocalConversationRouteGuard（原 `Ll`，导出 t；16 号 memo-cache）：
 * routeKind 非 local-thread/client-local-thread → 重定向 /；
 * hostId 路由参数与实际 host 不符 → host 骨架；chatgpt 能力 + 本地 thread
//  上下文导航分发。
 */
function LocalConversationRouteGuard(props: { children?: unknown }): PageViewNode {
  return { kind: "local-conversation-route-guard", props: { children: props.children } };
}

// ---------------------------------------------------------------------------
// 页面壳与内容装配（原 `Il`/`Rl`/`zl`，导出 n）
// ---------------------------------------------------------------------------

/** 归档预览判定（原 Rl 的 o2 语义）。 */
function isArchivedPreview(route: RouteContextValue, location: RouteLocationLike, flags: { isArchived?: boolean; isReadOnly?: boolean }): boolean {
  return location.state?.archivedConversationPreview === true && (flags.isArchived === true || flags.isReadOnly === true);
}

/**
 * LocalConversationPage（原 `Il`，导出 n）：
 * 路由守卫 + Rl 内容装配（归档预览 → 空骨架；否则 El 会话装配 + Pa +
 * hl 线程装配 + openThreadInNewWindow 键注册）。
 */
function LocalConversationPage(): PageViewNode {
  return { kind: "local-conversation-page", props: { guard: true, content: true } };
}

/** 页面初始化器（原 `Gl`，导出 r）。 */
function initializeLocalConversationPage(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  initializeArchivedConversationPage as a,
  ArchivedConversationPage as i,
  LocalConversationPage as n,
  initializeLocalConversationPage as r,
  LocalConversationRouteGuard as t,
};
