import "@rchunk/app-shared";
import {
  n as initializeConversationThumbnail,
  t as ConversationThumbnail,
} from "@rchunk/registered-conversation-thumbnail-core";

initializeConversationThumbnail();

export { ConversationThumbnail as RegisteredConversationThumbnail };
