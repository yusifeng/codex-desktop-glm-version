import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/workbook-from-csv";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/open-automation-side-panel-tab";
import "@rchunk/open-appgen-share-dialog";
import "@rchunk/app-connect-modal";
import "@rchunk/ecosystem-widget-queries";
import "@rchunk/timestamps";
import "@rchunk/skill-exploration-labels";
import "@rchunk/open-sources-side-panel-tab";
import "@rchunk/conversation-blocks";
import "@rchunk/thread-scroll-controller-context-value";
import "@rchunk/timestamp-separator";
import "@rchunk/user-message";
import "@rchunk/agent-activity-item";
import "@rchunk/mcp-tool-item-content";
import "@rchunk/agent-activity-units";
import "@rchunk/plan-summary-item-content";
import "@rchunk/codex-thread-report-dialog";
import "@rchunk/mcp-tool-approval-message";
import "@rchunk/resume-chatgpt-completion";
import "@rchunk/chatgpt-sites";
import "@rchunk/respond";
import "@rchunk/turn-bibliography";
import "@rchunk/summary";
import "@rchunk/content";
import "@rchunk/chatgpt-sources-message";
import "@rchunk/payload";
import "@rchunk/chatgpt-personalization-route";
import "@rchunk/personalization-state";
import "@rchunk/image-validation-session";
import "@rchunk/chatgpt-generated-image-favorite";
import "@rchunk/analytics-runtime";
import "@rchunk/python-analysis-details";
import "@rchunk/app-info";
import "@rchunk/request-panel";
import "@rchunk/library-writing-block";
import "@rchunk/chatgpt-subagents-panel";
import "@rchunk/registered-chatgpt-subagents-thumbnail";
import "@rchunk/image-gen-loading-games";
import "@rchunk/image-prompt-share-dialog";
import "@rchunk/chatgpt-sources-side-panel-tab";
import "@rchunk/chatgpt-conversation-inline-beacon";
import "@rchunk/work-mode-pet-content";

export interface ConversationItem { completed?: boolean; id?: string; messageId?: string; status?: string; type: string; [key: string]: unknown }
export interface ConversationTurn { artifacts?: Record<string, unknown>; items: ConversationItem[]; messageIds?: readonly string[]; status?: string; [key: string]: unknown }
export interface RenderedTurn { id: string; timestampTurns?: readonly unknown[] | null; turn: ConversationTurn; [key: string]: unknown }
export interface PendingAttachment { id: string; name: string; previewSrc?: string | null; [key: string]: unknown }
export interface PendingSubmission { attachments: readonly PendingAttachment[]; commentCount?: number; prompt?: string | null; renderMarkdown?: boolean; selectedTextAttachments: readonly { text: string }[] }
export interface RenderConversationInput { conversation?: { conversation_origin?: string; current_node?: string | null; mapping?: Record<string, unknown> } | null; conversationOrigin?: string; isStreaming?: boolean; mode?: string; pendingSubmission?: PendingSubmission | null; threadCurrentNode?: string | null; threadMapping?: Record<string, unknown> | null }
export interface RenderConversationResult { renderedConversation: RenderConversationInput["conversation"] | { conversation_origin?: string; current_node: string | null; mapping: Record<string, unknown> } | null; renderedTurns: RenderedTurn[]; showPendingLoadingMessage: boolean }
export interface DecorateTurnsInput { browserConversationId?: string; conversationId: string; errorMessage?: string | null; isTemporaryChat?: boolean; isWorkConversation?: boolean; renderedTurns: readonly RenderedTurn[]; showPendingLoadingMessage?: boolean; showRequestUserInputStatus?: boolean }
export interface TurnRendererProps { conversationId: string; isMostRecentTurn?: boolean; turn: ConversationTurn; turnId: string; [key: string]: unknown }
export interface SharedImage { height?: number; id?: string; src?: string | null; title?: string; width?: number }
export interface SharedImageViewerProps { conversationId: string; images?: readonly SharedImage[] }
export interface ComparisonVariant { displayLabel?: string; id: string; isComplete?: boolean; isOriginal?: boolean; messageId?: string | null; turns: readonly RenderedTurn[] }
export interface ResponseComparison { treatment?: string; variants: readonly ComparisonVariant[] }
export interface ComparisonViewerProps { compact?: boolean; comparison: ResponseComparison; conversationId: string; onPrefer?(variant: ComparisonVariant): void; onSkip?(variant: ComparisonVariant): void }
export interface PanelScope { openPanel?(panel: { id: string; props: Record<string, unknown>; title: string }): void }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function itemIsPending(item: ConversationItem): boolean {
  if (item.type === "generated-image") return item.status === "in_progress" || item.status === "inProgress";
  if (["assistant-message", "chatgpt-writing-block-patch", "web-search"].includes(item.type)) return item.completed === false;
  if (item.type === "chatgpt-reasoning-group") return item.completed !== true;
  return false;
}
function createPendingTurn(submission: PendingSubmission): RenderedTurn | null {
  const prompt = submission.prompt?.trim();
  if (!prompt) return null;
  return { id: "pending-chatgpt-submit", timestampTurns: [{ role: "user", sentAtMs: null }], turn: { artifacts: { editedFilePaths: [], outputFilePaths: [], referencedFilePaths: [] }, items: [{ attachments: submission.attachments.filter(attachment => attachment.previewSrc == null), commentCount: submission.commentCount ?? 0, images: submission.attachments.flatMap(attachment => attachment.previewSrc == null ? [] : [attachment.previewSrc]), message: prompt, renderMarkdown: submission.renderMarkdown, selectedTextAttachments: submission.selectedTextAttachments.map(item => item.text), sentAtMs: null, type: "user-message" }], messageIds: [], status: "complete" } };
}
function renderConversation(input: RenderConversationInput): RenderConversationResult {
  const renderedConversation = input.threadMapping == null ? (input.conversation ?? null) : { conversation_origin: input.conversationOrigin, current_node: input.threadCurrentNode ?? null, mapping: input.threadMapping };
  const existing = ((renderedConversation as { renderedTurns?: RenderedTurn[] } | null)?.renderedTurns ?? []) as RenderedTurn[];
  const pending = input.pendingSubmission == null ? null : createPendingTurn(input.pendingSubmission);
  const renderedTurns = pending == null ? [...existing] : [...existing, pending];
  const hasPendingItem = renderedTurns.some(rendered => rendered.turn.items.some(itemIsPending));
  return { renderedConversation, renderedTurns, showPendingLoadingMessage: pending != null || Boolean(input.isStreaming && !hasPendingItem) };
}
function decorateRenderedTurns(input: DecorateTurnsInput): Array<RenderedTurn & Record<string, unknown>> {
  return input.renderedTurns.map((rendered, index) => { const isMostRecentTurn = index === input.renderedTurns.length - 1; return { ...rendered, browserConversationId: input.browserConversationId, conversationId: input.conversationId, errorMessage: isMostRecentTurn ? input.errorMessage : null, isMostRecentTurn, isTemporaryChat: input.isTemporaryChat ?? false, isWorkConversation: input.isWorkConversation ?? false, showPendingLoadingMessage: isMostRecentTurn && Boolean(input.showPendingLoadingMessage), showRequestUserInputStatus: isMostRecentTurn && Boolean(input.showRequestUserInputStatus), timestampSeparatorAtMs: null, turnKey: rendered.turn.items.find(item => item.type === "user-message")?.messageId ?? rendered.id } });
}
function openSubagentsPanel(scope: PanelScope, { conversationId, selectedThreadId = null }: { conversationId: string; selectedThreadId?: string | null }): void { scope.openPanel?.({ id: `chatgpt-subagents:${conversationId}`, props: { conversationId, selectedThreadId }, title: "Subagents" }); }
const ConversationTurnContext: { current: TurnRendererProps | null } = { current: null };
const conversationEffectsSignal = { key: "chatgpt-conversation-effects" } as const;
function ConversationTurnRenderer(props: TurnRendererProps): unknown { ConversationTurnContext.current = props; return jsx().jsx("article", { "data-conversation-id": props.conversationId, "data-most-recent": props.isMostRecentTurn ?? false, "data-turn-id": props.turnId, children: props.turn.items.map((item, index) => jsx().jsx("div", { "data-item-type": item.type, children: item.message ?? item.title ?? item.type }, item.id ?? item.messageId ?? `${item.type}-${index}`)) }); }
function SharedImageViewer({ conversationId, images = [] }: SharedImageViewerProps): unknown { return jsx().jsx("section", { "aria-label": "Shared images", "data-conversation-id": conversationId, children: images.map((image, index) => jsx().jsx("img", { alt: image.title ?? `Image ${index + 1}`, height: image.height, src: image.src ?? undefined, width: image.width }, image.id ?? `${index}`)) }); }
function ResponseComparisonViewer({ compact, comparison, conversationId, onPrefer, onSkip }: ComparisonViewerProps): unknown { return jsx().jsx("section", { "data-compact": compact ?? false, "data-conversation-id": conversationId, "data-paragen-root": true, children: comparison.variants.map((variant, index) => jsx().jsxs("article", { children: [jsx().jsx("h2", { children: comparison.treatment === "personalization" ? (variant.isOriginal ? "Original response" : "Without memory") : `Response ${index + 1}${variant.displayLabel ? ` ${variant.displayLabel}` : ""}` }), variant.turns.map(turn => jsx().jsx(ConversationTurnRenderer, { conversationId, isMostRecentTurn: false, turn: turn.turn, turnId: `${variant.id}:${turn.id}` }, turn.id)), jsx().jsx("button", { disabled: !variant.isComplete, onClick: () => onPrefer?.(variant), type: "button", children: "Prefer" }), jsx().jsx("button", { onClick: () => onSkip?.(variant), type: "button", children: "Skip" })] }, variant.id)) }); }
async function attachSharedImage(_scope: unknown, image?: SharedImage | null): Promise<{ height?: number; name: string; src: string; width?: number }> { if (image?.src == null) throw new Error("This shared image is unavailable"); return { height: image.height, name: "image.png", src: image.src, width: image.width }; }
function initializeConversationModel(): void {}
function initializeSharedImageViewer(): void { void jsx(); }
function initializeSharedImageActions(): void { void jsx(); }
function initializeSubagentsPanel(): void {}
function initializeConversationEffects(): void {}
function initializeConversationContext(): void {}
function initializeTurnRenderer(): void { void jsx(); }
function initializeResponseComparison(): void { void jsx(); }

export { initializeConversationModel as _, ConversationTurnContext as a, initializeSharedImageViewer as c, initializeSubagentsPanel as d, openSubagentsPanel as f, decorateRenderedTurns as g, renderConversation as h, initializeTurnRenderer as i, initializeSharedImageActions as l, initializeConversationEffects as m, initializeResponseComparison as n, initializeConversationContext as o, conversationEffectsSignal as p, ConversationTurnRenderer as r, SharedImageViewer as s, ResponseComparisonViewer as t, attachSharedImage as u };
