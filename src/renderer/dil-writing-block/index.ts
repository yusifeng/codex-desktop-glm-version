// Converts a DIL content reference into a writing-block directive.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as directiveRendererChunk from "@rchunk/writing-block-directive-renderer";
import * as quickChatAdapterChunk from "@rchunk/quick-chat-writing-block-adapter";

interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown }
interface ParseResult { success: boolean; data?: DilData }
interface DilData { id?: string; content?: string; metadata?: Record<string, unknown>; options?: unknown; bcc?: string; cc?: string; recipient?: string; subject?: string; title?: string; variant?: string }
interface TurnContext { messageId?: string; contentReferenceMessageIds?: Array<string | undefined>; contentReferenceMessageStatuses?: Array<string | undefined>; isStreaming: boolean; [key: string]: unknown }
interface ToneSection { content?: string; [key: string]: unknown }

const shared = appSharedChunk as unknown as { $3?: () => void; I3: () => JsxRuntime };
const initial = appInitialChunk as unknown as { CJt?: { safeParse(value: unknown): ParseResult }; WJt?: () => void; _it?: () => TurnContext | null; git?: () => void; wJt?: () => void; zJt?: (metadata: Record<string, unknown>) => Array<{ content?: string }> };
const directive = directiveRendererChunk as unknown as { c?: (input: { content: string; metadata: Record<string, unknown>; preserveEmptySections: boolean }) => ToneSection[] | null; l?: () => void };
const adapter = quickChatAdapterChunk as unknown as { r?: () => void; t?: unknown };
const { $3: initializeSharedRuntime, I3: getJsxRuntime } = shared;
const { CJt: dilSchema, WJt: initializeDilSchema, _it: useTurnContext, git: initializeDilRuntime, wJt: initializeContentReferences, zJt: extractMetadataContent } = initial;
const { c: parseToneSections, l: initializeDirectiveRenderer } = directive;
const { r: initializeQuickChatAdapter, t: QuickChatWritingBlock } = adapter;

let jsx: JsxRuntime;
let initialized = false;

function initializeDilWritingBlock(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  initializeDilSchema?.();
  initializeContentReferences?.();
  initializeDilRuntime?.();
  initializeQuickChatAdapter?.();
  initializeDirectiveRenderer?.();
  jsx = getJsxRuntime();
  initialized = true;
}

function DilWritingBlock({ contentReferenceIndex, data, isStreaming, readOnly = false }: { contentReferenceIndex: number; data: unknown; isStreaming?: boolean; readOnly?: boolean }): unknown {
  initializeDilWritingBlock();
  const turnContext = useTurnContext?.();
  const parsed = dilSchema?.safeParse(data);
  if (turnContext == null || parsed?.success !== true || parsed.data == null) return null;
  const source = parsed.data;
  const metadata = { ...(source.metadata ?? {}) };
  if (source.options != null) metadata.options = source.options;
  const messageIds = turnContext.contentReferenceMessageIds;
  const sourceMessageId = messageIds?.[contentReferenceIndex] ?? turnContext.messageId;
  const index = messageIds == null ? contentReferenceIndex : messageIds.slice(0, contentReferenceIndex).filter((messageId) => messageId === sourceMessageId).length;
  const status = turnContext.contentReferenceMessageStatuses?.[contentReferenceIndex];
  const streaming = isStreaming ?? (status == null ? turnContext.isStreaming : status === "in_progress");
  const id = source.id ?? (sourceMessageId == null ? undefined : sourceMessageId + ":" + index);
  if (id == null) return null;
  const bodyContent = extractMetadataContent?.(metadata)[0]?.content ?? source.content ?? "";
  const toneSections = parseToneSections?.({ content: bodyContent, metadata, preserveEmptySections: !streaming }) ?? null;
  const directiveValue = { id, bodyContent, content: toneSections?.[0]?.content ?? bodyContent, emailMetadata: { bcc: source.bcc, cc: source.cc, recipient: source.recipient, subject: source.subject }, metadata, title: source.title, toneSections, variant: source.variant ?? "standard" };
  return jsx.jsx(QuickChatWritingBlock ?? "div", { id, directive: directiveValue, index, isLastNodeInMessage: false, readOnly, sourceMessageId, turnContext: { ...turnContext, isStreaming: streaming } });
}

initializeDilWritingBlock();
export { DilWritingBlock };
