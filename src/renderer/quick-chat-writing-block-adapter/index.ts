import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as floatingSlashMenuChunk from "@rchunk/writing-block-floating-slash-menu";
import * as writingBlockSurfaceChunk from "@rchunk/writing-block-surface";
import * as editableWritingBlockChunk from "@rchunk/editable-writing-block";
import * as appCapabilitiesChunk from "@rchunk/writing-block-app-capabilities";
import * as writingBlockChunk from "@rchunk/writing-block";
import * as contentUpdateChunk from "@rchunk/writing-block-content-update";
import * as directiveRendererChunk from "@rchunk/writing-block-directive-renderer";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useCallback<Callback extends (...arguments_: never[]) => unknown>(callback: Callback, dependencies: readonly unknown[]): Callback; useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useState<Value>(initialValue: Value | (() => Value)): [Value, (next: StateUpdater<Value>) => void] }
interface StoreScope { get<Value>(signal: unknown, key?: unknown): Value; set?(signal: unknown, key: unknown, value: unknown): void }
interface IntlShape { formatMessage(descriptor: Record<string, unknown>): string }
interface ToneSection { content: string; id: string; tone: string; [key: string]: unknown }
interface EmailMetadata { bcc?: string | null; cc?: string | null; recipient?: string | null; subject?: string | null }
interface WritingBlockData { content: string; edited?: boolean; id?: string; index?: number; library_file_id?: string; locallyEdited?: boolean; metadata?: Record<string, unknown>; title?: string; variant?: string; [key: string]: unknown }
interface Directive { bodyContent: string; content: string; emailMetadata: EmailMetadata; id?: string; metadata?: Record<string, unknown>; title?: string; toneSections?: ToneSection[] | null; variant?: string }
interface TurnContext { contentReferences?: readonly unknown[]; conversationId: string; conversationOrigin?: string; isStreaming: boolean; isTemporaryChat?: boolean; mapping?: unknown; messageId?: string; turnId?: string; writingBlockIndexes?: Record<string, number>; writingBlockMessageIds?: Record<string, string>; writingBlockSources?: Record<string, { index?: number; messageId?: string }>; [key: string]: unknown }
interface QuickChatProps { directive: Directive; id: string; index: number; isLastNodeInMessage?: boolean; readOnly?: boolean; sourceMessageId?: string; turnContext: TurnContext }
interface DirectiveRendererProps { isLastBlock?: boolean; [key: string]: unknown }
interface ToneController { activeToneSectionId?: string; displayedToneSections: readonly ToneSection[]; selectToneSection(id: string): void }
interface MessageRecord { message?: { metadata?: unknown } }
interface PersistUpdate { content?: string; locallyEdited?: boolean; metadata?: Record<string, unknown> }

const shared = appSharedChunk as unknown as { $3?: () => void; BX: <Value>(signal: unknown, key?: unknown) => Value; FX?: () => void; HX: <Value>(signal: unknown) => Value; I3: () => JsxRuntime; K2?: () => void; LX: (scope: unknown) => StoreScope; QI?: () => void; Y2?: unknown; ZI: unknown; __?: <Callback extends (...arguments_: never[]) => unknown>(callback: Callback) => Callback; cy?: unknown; e6: () => ReactRuntime; g_?: () => void; h4?: () => void; lk?: () => void; lw?: () => void; m4?: (...values: Array<string | false | null | undefined | string[]>) => string; n4: () => IntlShape; oZ?: (scope: unknown, initializer: (value: unknown) => boolean) => unknown; pk?: unknown };
const initial = appInitialChunk as unknown as { AJt?: (sections: readonly ToneSection[] | null | undefined) => Record<string, unknown>; APt?: (input: { scope: StoreScope; blockId: string; conversationId: string; fallbackWritingBlock: WritingBlockData; messageId: string; update: PersistUpdate }) => WritingBlockData | null; EHt?: () => void; FYt?: (block: WritingBlockData, context: TurnContext) => WritingBlockData; Lat?: unknown; MJt?: () => void; OJt?: () => void; OPt?: unknown; PJt?: string; RIt?: () => void; RVt?: unknown; Rat?: () => void; Sdn?: new (...arguments_: never[]) => Error; WJt?: () => void; _it?: () => TurnContext | null; cJt?: () => void; eIt?: unknown; git?: () => void; jIt?: unknown; jPt?: () => void; jVt?: unknown; kJt?: (metadata: unknown) => Record<string, WritingBlockData>; kPt?: unknown; pIt?: () => void; qJt?: (metadata: Record<string, unknown> | undefined, selection: { id: string; index: number }, content: string) => Record<string, unknown>; rJt?: { safePost(path: string, input: unknown): Promise<unknown>; safeGet?(path: string, input: unknown): Promise<unknown> }; uHt?: () => void; wVt?: unknown; wdn?: () => void; xpn?: (scope: StoreScope, key: unknown, value: unknown) => void; ypn?: () => void };
const primary = appPrimaryChunk as unknown as { $l?: () => void; Bd?: () => void; Cs?: unknown; Gd?: (scope: StoreScope, conversationId: string) => Promise<unknown>; Kd?: () => void; Ld?: (metadata: Record<string, unknown>, key: string) => string | undefined; Ou?: (input: Record<string, unknown>) => string | null; Rd?: (input: { metadata?: Record<string, unknown>; title?: string }, active?: ToneSection) => string; Ss?: () => void; bs?: unknown; bu?: (content: string) => string; eu?: (scope: StoreScope, input: Record<string, unknown>) => unknown; qd?: (...arguments_: unknown[]) => void; vu?: () => void; xs?: () => void; xu?: () => void; yu?: (...arguments_: unknown[]) => unknown; zd?: (metadata: Record<string, unknown>, active: ToneSection | undefined, subject: string) => Record<string, unknown> };
const floatingSlashMenu = floatingSlashMenuChunk as unknown as { C?: () => void; E?: () => void; T?: () => unknown; w?: { root: string } };
const writingBlockSurface = writingBlockSurfaceChunk as unknown as { i?: () => void; n?: unknown };
const editable = editableWritingBlockChunk as unknown as { a?: { get(key: string): { dismiss(reason: string): void } }; i?: () => void; n?: () => void; r?: (scope: StoreScope, key: string) => void; t?: unknown };
const capabilities = appCapabilitiesChunk as unknown as { n?: () => void; t?: unknown };
const writingBlock = writingBlockChunk as unknown as { i?: () => void; n?: () => void; r?: unknown; t?: unknown };
const contentUpdate = contentUpdateChunk as unknown as { a?: () => void; i?: () => void; n?: (metadata: Record<string, unknown>, sections: readonly ToneSection[] | null | undefined) => Record<string, unknown>; o: (input: { isPersistenceReady: boolean; isStreaming: boolean; metadata?: Record<string, unknown>; onPersistSelection?(id: string): void; toneSections?: readonly ToneSection[] | null }) => ToneController; r?: (sections: readonly ToneSection[], id?: string) => ToneSection | undefined; t: (input: { nextContent: string; toneSectionId?: string; toneSections?: readonly ToneSection[] | null }) => { activeToneSectionId?: string; content: string; toneSections?: readonly ToneSection[] | null } };
const directiveRenderer = directiveRendererChunk as unknown as { a: <Value extends WritingBlockData>(block: Value, context: { contentReferences?: readonly unknown[]; isStreaming?: boolean }) => Value; c: (input: { content: string; metadata?: Record<string, unknown>; preserveEmptySections?: boolean }) => ToneSection[] | undefined; i: (metadata: Record<string, unknown> | undefined, context: { contentReferences?: readonly unknown[]; isStreaming?: boolean }) => Record<string, unknown> | undefined; l?: () => void; n?: () => void; o?: () => void; r?: (content: string, context: { contentReferences?: readonly unknown[]; isStreaming?: boolean }) => string; t?: unknown };

const { $3: initializeSharedRuntime, BX: useStoreValue, FX: initializeSharedFeatures, HX: useSignal, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, LX: useStoreScope, QI: initializeSharedState, ZI: appScope, e6: getReactRuntime, g_: initializeSharedToast, h4: initializeSharedEditor, lk: initializeSharedPersistence, lw: initializeSharedAnalytics, n4: useIntl } = shared;
const { AJt: serializeToneSections, APt: updateLocalWritingBlock, FYt: transformStoredWritingBlock, MJt: initializeWritingBlockRuntime, OJt: initializeWritingBlockQueries, OPt: revisionFeatureSignal, PJt: selectedToneMetadataKey, RIt: initializeWritingBlockStore, RVt: conversationMessagesSignal, Rat: initializeWritingBlockPersistence, WJt: initializeWritingBlockSchema, _it: useTurnContext, cJt: initializeWritingBlockDirectives, eIt: editorKeySignal, git: initializeWritingBlockMessages, jIt: selectedModelSignal, jPt: initializeWritingBlockFollowups, jVt: currentMessageIdSignal, kJt: extractWritingBlocks, kPt: changeFeatureSignal, pIt: initializeEarlierVersion, qJt: attachToneSelection, uHt: initializeWritingBlockApi, wVt: serverConversationIdSignal, wdn: initializeConversationMessages, ypn: initializeWritingBlockTracking } = initial;
const { $l: initializePrimaryWritingBlocks, Bd: initializePrimaryLibrary, Gd: flushConversation, Kd: initializePrimaryState, Ld: getMetadataString, Ou: getSuggestedFollowupIneligibility, Rd: createEmailSubject, Ss: initializePrimarySuggestions, bu: createWritingBlockTitle, eu: submitSuggestedFollowup, vu: initializePrimaryEditor, xs: initializePrimaryRevisions, xu: initializePrimaryCopy, zd: updateEmailSubjectMetadata } = primary;
const { C: initializeFloatingStyles, E: initializeFloatingSlashMenu, T: createEditorStore } = floatingSlashMenu;
const { i: initializeWritingBlockSurface } = writingBlockSurface;
const { a: writingBlockChangeState, i: initializeEditableChangeState, n: initializeEditableWritingBlock, r: dismissTransientChanges, t: EditableWritingBlock } = editable;
const { n: initializeAppCapabilities, t: WritingBlockAppCapabilities } = capabilities;
const { i: initializeWritingBlock, n: initializeInlineWritingBlock, r: WritingBlockFrame, t: InlineWritingBlock } = writingBlock;
const { a: initializeContentUpdate, i: initializeContentMetadata, n: attachToneSections, o: createToneSectionController, r: getToneSection, t: applyContentUpdate } = contentUpdate;
const { a: transformWritingBlockReferences, c: parseToneSections, i: transformMetadataReferences, l: initializeWritingBlockParsing, n: initializeDirectiveRenderer, o: initializeWritingBlockDirectiveSchema, r: applyContentReferences, t: WritingBlockDirectiveRenderer } = directiveRenderer;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeQuickChatWritingBlockAdapter(): void {
  if (initialized) return;
  initializeSharedRuntime?.(); initializeWritingBlockRuntime?.(); initializePrimaryLibrary?.(); initializeWritingBlockSchema?.(); initializeWritingBlockQueries?.(); initializeFloatingSlashMenu?.(); initializeSharedFeatures?.();
  React = getReactRuntime(); initializeReactCompilerRuntime?.(); initializeWritingBlockStore?.(); initializePrimaryWritingBlocks?.(); initializeWritingBlockApi?.(); initializeWritingBlockMessages?.(); initializeSharedPersistence?.(); initializeWritingBlockPersistence?.(); initializeSharedState?.(); initializeSharedToast?.(); initializeConversationMessages?.();
  initializeEditableWritingBlock?.(); initializeWritingBlock?.(); initializeContentUpdate?.(); initializeContentMetadata?.(); initializeWritingBlockParsing?.(); initializeDirectiveRenderer?.(); initializePrimaryState?.(); initializeWritingBlockDirectiveSchema?.(); initializePrimarySuggestions?.(); initializePrimaryCopy?.(); initializeWritingBlockDirectives?.(); initializeWritingBlockSurface?.(); initializeFloatingStyles?.(); initializeWritingBlockTracking?.(); initializeInlineWritingBlock?.(); initializePrimaryRevisions?.();
  initializeEarlierVersion?.(); initializePrimaryEditor?.(); initializeEditableChangeState?.(); initializeAppCapabilities?.(); jsx = getJsxRuntime(); initialized = true;
}

function emailMetadata(directive: Directive): EmailMetadata & { writingBlockMetadata?: Record<string, unknown> } { return { ...directive.emailMetadata, writingBlockMetadata: directive.metadata }; }

function QuickChatWritingBlockDirectiveRenderer(props: DirectiveRendererProps): unknown {
  initializeQuickChatWritingBlockAdapter();
  const turnContext = useTurnContext?.();
  const renderExtension = (directive: Directive) => (context: Record<string, unknown>) => jsx.jsx(WritingBlockFrame ?? "div", { context, emailMetadata: emailMetadata(directive), editorKey: undefined, isStreaming: turnContext?.isStreaming ?? false, title: directive.title, variant: directive.variant });
  const renderPersisted = (directive: Directive): unknown => {
    const id = directive.id;
    let index = id == null ? undefined : turnContext?.writingBlockIndexes?.[id];
    if (id != null && turnContext?.writingBlockMessageIds?.[id] == null) index = turnContext?.writingBlockSources?.[id]?.index ?? index;
    return turnContext == null || id == null || index == null ? null : jsx.jsx(QuickChatWritingBlock, { directive, id, index, isLastNodeInMessage: props.isLastBlock ?? true, turnContext });
  };
  return jsx.jsx(WritingBlockDirectiveRenderer ?? "div", { ...props, contentReferences: turnContext?.contentReferences, isStreaming: turnContext?.isStreaming ?? false, renderExtension, renderPersisted, testId: "chatgpt-writing-block" });
}

function QuickChatWritingBlock({ directive, id, index, isLastNodeInMessage = true, readOnly = false, sourceMessageId, turnContext }: QuickChatProps): unknown {
  initializeQuickChatWritingBlockAdapter();
  const scope = useStoreScope(appScope);
  const intl = useIntl();
  const [editorStore] = React.useState(() => createEditorStore?.() ?? {});
  const revisionFeature = useSignal<boolean>(revisionFeatureSignal);
  const changeFeature = useSignal<boolean>(changeFeatureSignal);
  const serverConversationId = useStoreValue<string | null>(serverConversationIdSignal, turnContext.conversationId);
  const messages = useStoreValue<Record<string, MessageRecord> | null>(conversationMessagesSignal, turnContext.conversationId);
  const currentMessageId = useStoreValue<string | null>(currentMessageIdSignal, turnContext.conversationId);
  const messageId = sourceMessageId ?? turnContext.writingBlockMessageIds?.[id] ?? turnContext.writingBlockSources?.[id]?.messageId ?? turnContext.messageId;
  const storedRaw = messageId == null ? undefined : extractWritingBlocks?.(messages?.[messageId]?.message?.metadata)[id];
  const stored = storedRaw == null ? undefined : transformStoredWritingBlock?.(storedRaw, turnContext) ?? storedRaw;
  const referenceContext = { contentReferences: turnContext.contentReferences, isStreaming: turnContext.isStreaming };
  const metadata = stored?.metadata ?? transformMetadataReferences(directive.metadata, referenceContext);
  const content = stored?.content ?? applyContentReferences?.(directive.content, referenceContext) ?? directive.content;
  const toneSections = stored == null ? directive.toneSections?.map(section => ({ ...section, content: applyContentReferences?.(section.content, referenceContext) ?? section.content })) ?? null : parseToneSections({ content, metadata, preserveEmptySections: true }) ?? null;
  const mergedEmail = { ...emailMetadata(directive), ...directive.metadata, ...stored?.metadata };
  const editableKey = readOnly || serverConversationId == null || messageId == null ? undefined : editorKeySignal;
  const persistenceReady = !readOnly && serverConversationId != null && messageId != null && messages?.[messageId]?.message != null;
  const persist = React.useCallback((update: PersistUpdate | ((current: WritingBlockData) => PersistUpdate)): void => {
    if (!persistenceReady || messageId == null || serverConversationId == null) return;
    const fallback: WritingBlockData = { content, id, index, metadata: { ...metadata, ...(directive.variant === "email" ? { bcc: directive.emailMetadata.bcc ?? null, cc: directive.emailMetadata.cc ?? null, recipient: directive.emailMetadata.recipient ?? null, subject: directive.emailMetadata.subject ?? null } : {}), ...(serializeToneSections?.(toneSections) ?? {}) }, title: directive.title, variant: directive.variant ?? "unknown" };
    const current = stored ?? fallback;
    const next = typeof update === "function" ? update(current) : update;
    const result = updateLocalWritingBlock?.({ scope, blockId: id, conversationId: turnContext.conversationId, fallbackWritingBlock: fallback, messageId, update: { ...next, content: next.content ?? current.content, locallyEdited: Boolean(current.locallyEdited || next.content != null || next.locallyEdited), metadata: { ...current.metadata, ...next.metadata } } });
    if (result != null) void flushConversation?.(scope, turnContext.conversationId);
  }, [content, directive, id, index, messageId, metadata, persistenceReady, scope, serverConversationId, stored, toneSections, turnContext.conversationId]);
  const controller = createToneSectionController({ isPersistenceReady: persistenceReady, isStreaming: turnContext.isStreaming, metadata, toneSections, onPersistSelection: selectedId => persist({ metadata: { [selectedToneMetadataKey ?? "active_option_id"]: selectedId } }) });
  const selectedTone = getToneSection?.(controller.displayedToneSections, controller.activeToneSectionId) ?? controller.displayedToneSections.find(section => section.id === controller.activeToneSectionId);
  const updateContent = React.useCallback((nextContent: string, toneSectionId?: string): void => {
    persist(current => {
      const update = applyContentUpdate({ nextContent, toneSectionId, toneSections: parseToneSections({ content: current.content, metadata: current.metadata, preserveEmptySections: true }) });
      if (update.activeToneSectionId == null || update.toneSections == null) return { ...current, content: update.content };
      const selectedIndex = update.toneSections.findIndex(section => section.id === update.activeToneSectionId);
      return { ...current, content: update.content, metadata: { ...(attachToneSections?.(current.metadata ?? {}, update.toneSections) ?? current.metadata), ...(attachToneSelection?.(current.metadata, { id: update.activeToneSectionId, index: selectedIndex }, nextContent) ?? {}), [selectedToneMetadataKey ?? "active_option_id"]: update.activeToneSectionId } };
    });
  }, [persist]);
  const subject = createEmailSubject?.({ metadata: mergedEmail, title: stored?.title ?? directive.title }, selectedTone) ?? directive.emailMetadata.subject ?? "";
  const resolvedEmail = { bcc: getMetadataString?.(mergedEmail, "bcc"), cc: getMetadataString?.(mergedEmail, "cc"), recipient: getMetadataString?.(mergedEmail, "recipient"), subject, writingBlockMetadata: mergedEmail };
  const suggestedFollowup = (prompt: string): unknown => submitSuggestedFollowup?.(scope, { conversationId: turnContext.conversationId, conversationOrigin: turnContext.conversationOrigin, messageMetadata: { followups_v2_followup_clicked: true, followups_v2_followup_source: "writing_block_suggested_followup", suggestion_type: "suggested_followup" }, preserveDraft: true, prompt, selectedModel: scope.get(selectedModelSignal, turnContext.conversationId), submitErrorFallback: intl.formatMessage({ id: "chatgptConversations.writingBlock.followup.error", defaultMessage: "Couldn't send follow-up" }) });
  const capabilities = (context: Record<string, unknown>) => jsx.jsx(WritingBlockAppCapabilities ?? "div", { context, conversationId: turnContext.conversationId, document: readOnly || serverConversationId == null || messageId == null ? null : { conversationId: turnContext.conversationId, editorKey: editableKey, libraryFileId: stored?.library_file_id, messageId, serverConversationId, title: stored?.title ?? directive.title, turnId: turnContext.turnId, writingBlockId: stored?.id ?? id, writingBlockIndex: index }, editorKey: editableKey, emailMetadata: resolvedEmail, isReadOnly: readOnly, isStreaming: turnContext.isStreaming, messageId, onBeforeDocumentExport: () => flushConversation?.(scope, turnContext.conversationId), onSuggestedFollowup: suggestedFollowup, serverConversationId, showMagicEditAction: !readOnly && messageId != null && !turnContext.isStreaming, suggestedFollowupIneligibilityReason: getSuggestedFollowupIneligibility?.({ currentMessageId, isLastNodeInMessage, mapping: messages, messageId: turnContext.messageId, writingBlockIndex: index }), title: directive.title, userEditedWritingBlock: stored != null && stored.edited !== false, variant: directive.variant, writingBlockId: editableKey == null ? undefined : id, writingBlockIndex: index });
  const base = jsx.jsx(EditableWritingBlock ?? "div", { activeToneSectionId: controller.activeToneSectionId, content, editorKey: editableKey, emailMetadata: resolvedEmail, isEditable: editableKey != null && !turnContext.isStreaming, onBlur: editableKey == null ? undefined : () => void flushConversation?.(scope, turnContext.conversationId), onContentChange: editableKey == null ? undefined : (value: string) => { if (changeFeature && writingBlockChangeState != null) writingBlockChangeState.get(`${turnContext.conversationId}\n${messageId ?? ""}\n${id}\n${controller.activeToneSectionId ?? ""}`).dismiss("edit"); updateContent(value, controller.activeToneSectionId); }, onCopySuccess: () => dismissTransientChanges?.(scope, `${turnContext.conversationId}\n${messageId ?? ""}\n${id}\n${controller.activeToneSectionId ?? ""}`), onSubjectChange: editableKey == null ? undefined : (value: string) => persist(current => ({ ...current, metadata: updateEmailSubjectMetadata?.({ ...current, metadata: attachToneSections?.(current.metadata ?? {}, parseToneSections({ content: current.content, metadata: current.metadata, preserveEmptySections: true })) }, selectedTone, value) ?? current.metadata })), onToneSectionSelect: controller.selectToneSection, proseMirrorStore: editorStore, render: capabilities, testId: "chatgpt-writing-block", title: directive.title, toneSections: controller.displayedToneSections, variant: directive.variant });
  if (!readOnly && (directive.variant === "document" || typeof stored?.library_file_id === "string") && messageId != null) return jsx.jsx(InlineWritingBlock ?? "div", { conversationId: turnContext.conversationId, editorKey: editableKey, fallback: base, initialContent: content, initialEditorStore: editorStore, instanceId: stored?.id ?? id, isStreaming: turnContext.isStreaming, messageId, onSuggestedFollowup: suggestedFollowup, refIndex: index, suggestedFollowupIneligibilityReason: null, title: stored?.title ?? directive.title, turnId: turnContext.turnId });
  void revisionFeature; void createWritingBlockTitle;
  return base;
}

initializeQuickChatWritingBlockAdapter();
export { QuickChatWritingBlockDirectiveRenderer as n, initializeQuickChatWritingBlockAdapter as r, QuickChatWritingBlock as t };
