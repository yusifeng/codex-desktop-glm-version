import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/writing-block-floating-slash-menu";
import "@rchunk/chatgpt-writing-block-ai-tools";
import "@rchunk/slides-outline-template-picker";
import type { EditableWritingBlockProps, EmailMetadata } from "@rchunk/editable-writing-block";

export interface WritingBlockAppCapabilitiesProps extends EditableWritingBlockProps { conversationId?: string; context?: Record<string, unknown>; enableAiTools?: boolean; isExpanded?: boolean; isReadOnly?: boolean; librarySaveControls?: unknown; isStreaming?: boolean; messageId?: string; onAskForChanges?(content: string): void; onBeforeDocumentExport?(): Promise<void> | void; onEmailMetadataChange?(metadata: EmailMetadata): void; onOpenVersionHistory?(): void; onSuggestedFollowup?(prompt: string): void; renderFrame?(content: unknown): unknown; serverConversationId?: string; showMagicEditAction?: boolean; suggestedFollowupIneligibilityReason?: string | null; userEditedWritingBlock?: boolean; writingBlockId?: string; writingBlockIndex?: number }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function WritingBlockAppCapabilities(props: WritingBlockAppCapabilitiesProps): unknown {
  const readOnly = props.isReadOnly ?? false;
  const frame = jsx().jsxs("section", { "data-writing-block-id": props.writingBlockId, "data-writing-block-index": props.writingBlockIndex, "data-conversation-id": props.conversationId, "data-read-only": readOnly, children: [
    props.title ? jsx().jsx("h3", { children: props.title }) : null,
    jsx().jsxs("div", { "data-writing-block-actions": true, children: [props.enableAiTools && props.onAskForChanges ? jsx().jsx("button", { disabled: props.isStreaming, onClick: () => props.onAskForChanges?.(props.content ?? ""), type: "button", children: "Ask for changes" }) : null, props.onOpenVersionHistory ? jsx().jsx("button", { onClick: props.onOpenVersionHistory, type: "button", children: "Version history" }) : null, props.onBeforeDocumentExport ? jsx().jsx("button", { onClick: props.onBeforeDocumentExport, type: "button", children: "Export" }) : null, props.librarySaveControls] }),
    props.onSuggestedFollowup && !props.suggestedFollowupIneligibilityReason ? jsx().jsx("button", { onClick: () => props.onSuggestedFollowup?.("Improve this writing"), type: "button", children: "Improve this writing" }) : null,
  ] });
  return props.renderFrame?.(frame) ?? frame;
}
function initializeWritingBlockAppCapabilities(): void { void jsx(); }
export { initializeWritingBlockAppCapabilities as n, WritingBlockAppCapabilities as t };
