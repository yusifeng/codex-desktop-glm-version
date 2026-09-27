import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeConversationThumbnailUi, t as ConversationThumbnail } from "@rchunk/conversation-thumbnail-ui";

interface RegisteredChatGptEntityThumbnailProps { conversationId: string; draft?: string; requestExcerpt?: string | null; responseExcerpt?: string | null; statusState?: { type: "error" | "idle" | "loading"; unread?: boolean; unreadCount?: number }; title: string; waitingFor?: "waitingOnApproval" | "waitingOnUserInput" | null }
initializeConversationThumbnailUi();
function RegisteredChatGptEntityThumbnail({ conversationId, ...props }: RegisteredChatGptEntityThumbnailProps): unknown {
  return getJsxRuntime().jsx(ConversationThumbnail, { ...props, "data-conversation-id": conversationId, statusState: props.statusState ?? { type: "idle" } });
}
export { RegisteredChatGptEntityThumbnail };
