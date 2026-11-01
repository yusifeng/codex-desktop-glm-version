import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

type Callable = (...args: unknown[]) => unknown;
export interface ConversationFilesRequest {
  accountId?: string | null; conversationId?: string | null; serverConversationId?: string | null;
  userId?: string | null; onClose?(): void; onOpenMessage?(messageId: string): void; [key: string]: unknown;
}
export interface ConversationFilesHost {
  accountId?: string | null; userId?: string | null;
  openPanel?(panel: { id: string; kind: string; props: ConversationFilesRequest; target: "right"; title: string }): void;
}
interface RemoteFile { file_id: string; file_name: string; file_size_bytes?: number | null; gizmo_id?: string | null; id?: string | null; is_project?: boolean; library_artifact_type?: string | null; mime_type?: string | null; origination_message_id?: string | null; origination_thread_id?: string | null }
interface MessageFile { downloadTarget?: unknown; fileId?: string | null; key?: string; libraryFileId?: string | null; messageId?: string; mimeType?: string | null; name: string; sandboxPath?: string | null; sizeBytes?: number | null }
interface FileItem { file: MessageFile; gizmoId?: string | null; libraryArtifactType?: string | null }
interface Scope { get<T>(signal: unknown, parameter?: unknown): T }

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const PANEL_KIND = "chatgpt-conversation-files";
let jsx: JsxRuntime;
let filesQuery: unknown;
let fileItems: unknown;
let panelDefinition: unknown;

function invoke<T>(value: unknown, ...args: unknown[]): T { return (value as Callable)(...args) as T; }
async function fetchConversationFiles(serverConversationId: string, accountId: string, signal: AbortSignal): Promise<RemoteFile[]> {
  const files = new Map<string, RemoteFile>(); const cursors = new Set<string>(); let cursor: string | undefined;
  do {
    signal.throwIfAborted();
    const apiClient = initial.rJt as { safeGet: unknown };
    const page = await invoke<Promise<{ cursor?: string | null; items: RemoteFile[] }>>(apiClient.safeGet,
      "/conversations/{conversation_id}/files", { parameters: { path: { conversation_id: serverConversationId }, query: { limit: 200, cursor } },
        additionalHeaders: { "ChatGPT-Account-ID": accountId }, expectedErrorStatuses: [401, 403, 404], signal });
    signal.throwIfAborted();
    for (const file of page.items) if (!files.has(file.file_id)) files.set(file.file_id, file);
    cursor = page.cursor ?? undefined; if (cursor == null || cursors.has(cursor)) break; cursors.add(cursor);
  } while (cursor != null);
  return [...files.values()];
}
function visibleMessages(messages: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return messages.filter((message) => {
    const author = message.author as { role?: string } | undefined; const metadata = message.metadata as Record<string, unknown> | undefined;
    const content = message.content as { content_type?: string } | undefined;
    return content?.content_type !== "gizmo_instructions_context" && !["system", "developer", "tool"].includes(author?.role ?? "") &&
      message.recipient === "all" && (!metadata?.is_visually_hidden_from_conversation || Boolean(metadata?.targeted_reply_label));
  });
}
function messageAttachments(messages: Array<Record<string, unknown>>): MessageFile[] {
  if (typeof initial.$kt === "function") {
    const extracted = invoke<{ inputs?: MessageFile[]; outputs?: MessageFile[] }>(initial.$kt, messages);
    return [...(extracted.inputs ?? []), ...(extracted.outputs ?? [])];
  }
  return messages.flatMap((message) => {
    const metadata = message.metadata as { attachments?: Array<Record<string, unknown>> } | undefined;
    return (metadata?.attachments ?? []).flatMap((attachment) => typeof attachment.name === "string" ? [{ fileId: attachment.file_id as string | undefined,
      key: String(attachment.file_id ?? `${message.id}:${attachment.name}`), messageId: String(message.id ?? ""), mimeType: attachment.mime_type as string | undefined,
      name: attachment.name, sizeBytes: attachment.size as number | undefined }] : []);
  });
}
function collectFiles(messages: Array<Record<string, unknown>>, remoteFiles: RemoteFile[] | undefined, serverConversationId: string): FileItem[] {
  const visible = visibleMessages(messages); const visibleMessageIds = new Set(visible.map((message) => String(message.id ?? "")));
  const attachments = messageAttachments(visible); const byFileId = new Map(attachments.flatMap((file) => file.fileId == null ? [] : [[file.fileId, file]]));
  const output = new Map<string, FileItem>();
  for (const remote of remoteFiles ?? []) {
    const attachment = byFileId.get(remote.file_id); const originatedHere = remote.origination_thread_id === serverConversationId;
    const originatedInVisibleMessage = remote.origination_message_id != null && visibleMessageIds.has(remote.origination_message_id);
    if ((remote.gizmo_id != null || remote.is_project === true) && !originatedHere && attachment == null && !originatedInVisibleMessage) continue;
    const downloadTarget = attachment?.downloadTarget ?? (typeof initial.EGt === "function" ? invoke(initial.EGt,
      { file_id: remote.file_id, library_file_id: remote.id, mime_type: remote.mime_type }, { fileName: remote.file_name }) : { type: "file-id", fileId: remote.file_id });
    output.set(remote.file_id, { file: { downloadTarget, fileId: remote.file_id, key: remote.file_id, libraryFileId: remote.id,
      messageId: attachment?.messageId ?? (originatedHere || originatedInVisibleMessage ? (remote.origination_message_id ?? "") : ""),
      mimeType: remote.mime_type ?? attachment?.mimeType ?? null, name: remote.file_name, sandboxPath: attachment?.sandboxPath ?? null,
      sizeBytes: remote.file_size_bytes ?? attachment?.sizeBytes ?? null }, gizmoId: remote.gizmo_id, libraryArtifactType: remote.library_artifact_type });
  }
  for (const file of attachments) { const key = file.fileId ?? `${file.messageId}:${file.name}`; if (!output.has(key)) output.set(key, { file: { ...file, key: file.key ?? key } }); }
  return [...output.values()];
}

function FilesPanel(props: ConversationFilesRequest & { isActive?: boolean }): unknown {
  const accountId = invoke<string | null>(shared.HX, initial.mun); const userId = invoke<string | null>(shared.HX, initial._un);
  if (!props.isActive || props.accountId !== accountId || props.userId !== userId || props.conversationId == null || props.serverConversationId == null) return null;
  const key = { accountId, userId, conversationId: props.conversationId, serverConversationId: props.serverConversationId };
  const query = invoke<{ isError?: boolean; isFetching?: boolean; isPending?: boolean; refetch(): Promise<unknown> }>(shared.BX, filesQuery, key);
  const items = invoke<FileItem[]>(shared.BX, fileItems, key);
  const scope = invoke<Scope>(shared.LX, initial.$en);
  const open = (item: FileItem) => {
    const target = item.file.downloadTarget;
    if (target == null) { if (item.file.messageId) { props.onClose?.(); props.onOpenMessage?.(item.file.messageId); } return; }
    props.onClose?.();
    if (typeof initial.OR === "function") void invoke<Promise<unknown>>(initial.OR, scope, { conversationId: props.serverConversationId,
      fileName: item.file.name, gizmoId: item.gizmoId, target, tabKey: item.file.key, browserPreview: true, openHtmlInBrowser: false });
  };
  if (query.isPending) return jsx.jsx("div", { className: "px-4 py-4 text-sm text-codex-description", role: "status", children: "Loading files…" });
  if (query.isError) return jsx.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-4 text-sm text-codex-description", role: "alert", children: ["Couldn’t load files", jsx.jsx("button", { type: "button", disabled: query.isFetching, onClick: () => void query.refetch(), children: "Try again" })] });
  if (items.length === 0) return jsx.jsx("div", { className: "px-4 py-4 text-sm text-codex-description", children: "No files referenced yet" });
  return jsx.jsx("ul", { "aria-label": "Files in chat", className: "flex flex-col", children: items.map((item) => jsx.jsx("li", { children:
    jsx.jsx("button", { type: "button", disabled: item.file.downloadTarget == null && !item.file.messageId, onClick: () => open(item), children:
      jsx.jsxs("span", { children: [jsx.jsx("strong", { children: item.file.name }), item.file.mimeType == null ? null : jsx.jsx("small", { children: item.file.mimeType })] }) }) }, item.file.key)) });
}

function initialize(): void {
  if (panelDefinition != null) return;
  for (const value of [initial.Sun, initial.cJt, shared.QI, initial.Wvt, initial.FDt]) if (typeof value === "function") invoke(value);
  jsx = invoke<JsxRuntime>(shared.I3);
  filesQuery = invoke(shared.QX, shared.ZI, (key: { accountId: string; userId: string; serverConversationId: string }, context: { get<T>(signal: unknown): T }) => ({
    enabled: key.accountId === context.get(initial.mun) && key.userId === context.get(initial._un),
    queryKey: ["conversation-files", key.accountId, key.userId, key.serverConversationId],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchConversationFiles(key.serverConversationId, key.accountId, signal), staleTime: 30_000, retry: false,
  }));
  fileItems = invoke(shared.rZ, shared.ZI, (key: { conversationId: string; serverConversationId: string }, context: { get<T>(signal: unknown, parameter?: unknown): T }) => {
    const remote = context.get<{ data?: RemoteFile[] }>(filesQuery, key).data;
    const mapping = context.get<Record<string, unknown> | null>(initial.RVt, key.conversationId);
    const currentNode = context.get(initial.jVt, key.conversationId);
    const messages: Array<Record<string, unknown>> = mapping == null ? [] : (typeof initial.TYt === "function" ? invoke<Array<Record<string, unknown>>>(initial.TYt, { mapping, current_node: currentNode }) : Object.values(mapping) as Array<Record<string, unknown>>);
    return collectFiles(messages, remote, key.serverConversationId);
  });
  panelDefinition = invoke(initial.IDt, PANEL_KIND, FilesPanel, { getId: () => PANEL_KIND,
    isAvailable: (route: { value?: { routeKind?: string }; routeKind?: string }) => (route.value?.routeKind ?? route.routeKind) === "chatgpt-thread",
    open: openConversationFiles, showInNewTabLauncher: false });
}

function openConversationFiles(host: ConversationFilesHost | Scope, request: ConversationFilesRequest = {}): void {
  initialize();
  if (typeof (host as ConversationFilesHost).openPanel === "function") {
    const legacy = host as ConversationFilesHost; const accountId = request.accountId ?? legacy.accountId; const userId = request.userId ?? legacy.userId;
    if (accountId == null || userId == null) return;
    legacy.openPanel?.({ id: PANEL_KIND, kind: PANEL_KIND, props: { ...request, accountId, userId }, target: "right", title: "Files in chat" }); return;
  }
  const scope = host as Scope; const accountId = scope.get<string | null>(initial.mun); const userId = scope.get<string | null>(initial._un);
  if (accountId == null || userId == null) return;
  const formatter = scope.get<{ formatMessage(descriptor: { defaultMessage: string; description: string; id: string }): string }>(initial.mpn);
  invoke(initial.Gvt, scope, panelDefinition, { revealAndFocus: true, id: PANEL_KIND, kind: PANEL_KIND,
    icon: element(shared.Rv, {}), props: { ...request, accountId, userId }, target: invoke(initial.gvt, scope, PANEL_KIND) ?? "right",
    title: formatter.formatMessage({ id: "chatgptConversations.files.title", defaultMessage: "Files in chat", description: "Title of the conversation files side panel" }) });
}
function element(type: unknown, props: Record<string, unknown>): unknown { return jsx.jsx(type as never, props); }

initialize();
export { openConversationFiles };
