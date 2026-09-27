import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface ConversationFilesRequest { accountId?: string | null; conversationId?: string | null; userId?: string | null; [key: string]: unknown }
export interface ConversationFilesHost { accountId?: string | null; userId?: string | null; openPanel?(panel: { id: string; kind: string; props: ConversationFilesRequest; target: "right"; title: string }): void }
function openConversationFiles(host: ConversationFilesHost, request: ConversationFilesRequest = {}): void {
  const accountId = request.accountId ?? host.accountId;
  const userId = request.userId ?? host.userId;
  if (accountId == null || userId == null) return;
  host.openPanel?.({ id: "chatgpt-conversation-files", kind: "chatgpt-conversation-files", props: { ...request, accountId, userId }, target: "right", title: "Files in chat" });
}
export { openConversationFiles };
