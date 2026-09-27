// quick-chat-window —— 独立/浮动 Quick Chat 会话窗口。

import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/chatgpt-conversation-transcript";
import "@rchunk/chatgpt-image-lightbox";
import "@rchunk/composer-provider";
import "@rchunk/quick-chat-frame";
import "@rchunk/quick-chat-obstacles";
import "@rchunk/thread-scroll-layout";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { I3: jsxRuntimeExport } = appSharedChunk as unknown as {
  I3: JsxRuntime | (() => JsxRuntime);
};

interface RecentConversation {
  conversationId: string;
  recencyAt: number;
  title?: string | null;
}

interface QuickChatSession {
  contextSourceThread?: unknown;
  conversationId: string;
  hasConversation?: boolean;
  initialScrollMode?: string;
  projectId?: string | null;
  projectName?: string | null;
  recentConversations?: readonly RecentConversation[];
  title?: string | null;
}

export interface QuickChatWindowProps {
  canPopOut?: boolean;
  onAddToComposer?(conversationId: string): void;
  onClose?(): void;
  onConversationSelect?(conversationId: string): void;
  onPopOut?(): void;
  onViewAll?(): void;
  session: QuickChatSession;
  variant?: "floating" | "window";
}

let jsx: JsxRuntime;

function recentConversations(
  conversations: readonly RecentConversation[] = [],
  limit = 3,
): RecentConversation[] {
  return [...conversations]
    .sort((left, right) => right.recencyAt - left.recencyAt)
    .slice(0, limit);
}

function QuickChatWindow({
  canPopOut = false,
  onAddToComposer,
  onClose,
  onConversationSelect,
  onPopOut,
  onViewAll,
  session,
  variant = "floating",
}: QuickChatWindowProps): unknown {
  initializeQuickChatWindow();
  const conversations = recentConversations(session.recentConversations);
  const title = session.title?.trim() || "Quick Chat";
  const empty = session.hasConversation !== true;
  return jsx.jsxs("section", {
    "aria-label": title,
    "aria-modal": true,
    "data-conversation-id": session.conversationId,
    "data-quick-chat-variant": variant,
    className: `quick-chat-window quick-chat-window--${variant}`,
    role: "dialog",
    tabIndex: -1,
    children: [
      jsx.jsxs("header", {
        "data-quick-chat-drag-handle": variant === "floating" || undefined,
        children: [
          jsx.jsx("div", {
            className: "quick-chat-window__title",
            children:
              session.projectName == null
                ? title
                : `${session.projectName} / ${title}`,
          }),
          jsx.jsxs("div", {
            className: "quick-chat-window__actions",
            children: [
              onAddToComposer == null
                ? null
                : jsx.jsx("button", {
                    onClick: () => onAddToComposer(session.conversationId),
                    type: "button",
                    children: "Add to composer",
                  }),
              canPopOut && variant === "floating"
                ? jsx.jsx("button", {
                    onClick: onPopOut,
                    type: "button",
                    children: "Open in window",
                  })
                : null,
              jsx.jsx("button", {
                "aria-label": "Close Quick Chat",
                onClick: onClose,
                type: "button",
                children: "×",
              }),
            ],
          }),
        ],
      }),
      empty
        ? jsx.jsxs("div", {
            className: "quick-chat-window__empty",
            children: [
              jsx.jsx("h2", { children: "How can I help?" }),
              conversations.length === 0
                ? jsx.jsx("p", {
                    children: "Start a new chat or pick up a recent conversation.",
                  })
                : jsx.jsxs("section", {
                    "aria-labelledby": "quick-chat-recent-heading",
                    children: [
                      jsx.jsx("h3", {
                        id: "quick-chat-recent-heading",
                        children: "Recent chats",
                      }),
                      ...conversations.map((conversation) =>
                        jsx.jsx(
                          "button",
                          {
                            onClick: () =>
                              onConversationSelect?.(
                                conversation.conversationId,
                              ),
                            type: "button",
                            children: conversation.title?.trim() || "New chat",
                          },
                          conversation.conversationId,
                        ),
                      ),
                      jsx.jsx("button", {
                        onClick: onViewAll,
                        type: "button",
                        children: "See all",
                      }),
                    ],
                  }),
            ],
          })
        : jsx.jsx("div", {
            className: "quick-chat-window__conversation",
            "data-scroll-mode": session.initialScrollMode,
            children: `Conversation ${session.conversationId}`,
          }),
    ],
  });
}

function initializeQuickChatWindow(): void {
  if (jsx != null) return;
  jsx =
    typeof jsxRuntimeExport === "function"
      ? jsxRuntimeExport()
      : jsxRuntimeExport;
}

initializeQuickChatWindow();
export { initializeQuickChatWindow as n, QuickChatWindow as t };
