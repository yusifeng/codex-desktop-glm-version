import "@rchunk/rolldown-runtime";
import {
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  ZI as appScope,
  oZ as createSignalFamily,
  type ScopedSignalFamily,
} from "@rchunk/app-shared";
import { HZt as initializeConversationModel } from "@rchunk/app-initial";
import { n as initializeConversationThumbnailUi, t as ConversationThumbnail } from "@rchunk/conversation-thumbnail-ui";

interface ConversationThumbnailProps {
  conversationId: string;
  draft?: string;
  hostId?: string;
  title: string;
}
interface ConversationThumbnailState extends Record<string, unknown> {
  requestExcerpt?: string | null;
  responseExcerpt?: string | null;
  statusState: { type: "error" | "idle" | "loading"; unread?: boolean; unreadCount?: number };
  waitingFor?: "waitingOnApproval" | "waitingOnUserInput" | null;
}

let conversationThumbnailSignal: ScopedSignalFamily<
  Record<string, unknown>,
  { conversationId: string; hostId?: string },
  ConversationThumbnailState | null
>;

function RegisteredConversationThumbnail(props: ConversationThumbnailProps): unknown {
  const preview = useSignalFamilyValue(conversationThumbnailSignal, {
    conversationId: props.conversationId,
    hostId: props.hostId,
  }) as ConversationThumbnailState | null;
  if (preview == null) return null;
  return getJsxRuntime().jsx(ConversationThumbnail, {
    ...preview,
    draft: props.draft,
    title: props.title,
  });
}

let initialized = false;
function initializeRegisteredConversationThumbnail(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime();
  initializeConversationModel();
  initializeConversationThumbnailUi();
  conversationThumbnailSignal = createSignalFamily(appScope, () => null);
  getJsxRuntime();
}

initializeRegisteredConversationThumbnail();
export { initializeRegisteredConversationThumbnail as n, RegisteredConversationThumbnail as t };
