import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/writing-block-floating-slash-menu";
import "@rchunk/writing-block-surface";
import "@rchunk/writing-block-copy-button";

export interface EmailMetadata { bcc?: string; cc?: string; recipient?: string; subject?: string }
export interface ToneSection { content: string; id: string; tone: string; [key: string]: unknown }
export interface ExternalContentUpdate { content: string; source?: string }
export interface EditableWritingBlockProps { activeToneSectionId?: string; content?: string; editorKey?: string; emailMetadata?: EmailMetadata; externalContentUpdate?: ExternalContentUpdate | null; isEditable?: boolean; isInteractionDisabled?: boolean; onContentChange?(content: string): void; onEmailMetadataChange?(metadata: EmailMetadata): void; onToneSectionSelect?(id: string): void; proseMirrorStore?: unknown; render?(input: { renderView(props?: Record<string, unknown>): unknown; state: WritingBlockViewState }): unknown; testId?: string; title?: string; toneSections?: readonly ToneSection[] | null; variant?: "document" | "email" | string }
export interface WritingBlockChangeState { changes: { text: string } | null; dismissed?: "copy" | "error"; expiresAt?: number | null; isStreaming: boolean; persistsUntilEdit: boolean }
export interface WritingBlockChangeController { dismiss(reason: "copy" | "error"): void; getState(): WritingBlockChangeState | null; setState(state: WritingBlockChangeState | null): void }
export interface WritingBlockViewState { activeToneSectionId?: string; content: string; isEditable: boolean; selectedToneSection?: ToneSection; toneSections: readonly ToneSection[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const controllers = new Map<string, WritingBlockChangeController>();
function createController(): WritingBlockChangeController { let state: WritingBlockChangeState | null = null; return { dismiss(reason) { if (state) state = { ...state, dismissed: reason }; }, getState() { return state; }, setState(next) { state = next; } }; }
const writingBlockChangeState = { get(key: string): WritingBlockChangeController { let controller = controllers.get(key); if (!controller) { controller = createController(); controllers.set(key, controller); } return controller; }, clear(): void { controllers.clear(); } };
function dismissTransientChanges(_scope: unknown, key: string): void { const controller = writingBlockChangeState.get(key); const state = controller.getState(); if (state && !state.persistsUntilEdit) controller.dismiss("copy"); }
function EditableWritingBlock(props: EditableWritingBlockProps): unknown {
  const toneSections = props.toneSections ?? [];
  const activeToneSectionId = props.activeToneSectionId ?? toneSections[0]?.id;
  const selectedToneSection = toneSections.find(section => section.id === activeToneSectionId);
  const content = props.externalContentUpdate?.content ?? selectedToneSection?.content ?? props.content ?? "";
  const state: WritingBlockViewState = { activeToneSectionId, content, isEditable: props.isEditable ?? false, selectedToneSection, toneSections };
  const renderView = (overrides: Record<string, unknown> = {}) => jsx().jsxs("section", { "data-testid": props.testId, "data-writing-block-variant": props.variant ?? "document", ...overrides, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h2", { children: props.title ?? (props.variant === "email" ? "Email" : "Writing") }), toneSections.length ? jsx().jsx("nav", { "aria-label": "Writing style variants", children: toneSections.map(section => jsx().jsx("button", { "aria-pressed": section.id === activeToneSectionId, disabled: props.isInteractionDisabled, onClick: () => props.onToneSectionSelect?.(section.id), type: "button", children: section.tone }, section.id)) }) : null] }),
    props.variant === "email" ? jsx().jsxs("div", { "data-writing-block-email": true, children: [jsx().jsx("input", { "aria-label": "To recipients", disabled: !props.isEditable, value: props.emailMetadata?.recipient ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onEmailMetadataChange?.({ ...props.emailMetadata, recipient: event.currentTarget.value }) }), jsx().jsx("input", { "aria-label": "Subject", disabled: !props.isEditable, value: props.emailMetadata?.subject ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onEmailMetadataChange?.({ ...props.emailMetadata, subject: event.currentTarget.value }) })] }) : null,
    props.isEditable ? jsx().jsx("textarea", { disabled: props.isInteractionDisabled, value: content, onChange: (event: { currentTarget: { value: string } }) => props.onContentChange?.(event.currentTarget.value) }) : jsx().jsx("div", { "data-writing-block-content": true, children: content }),
  ] });
  return props.render?.({ renderView, state }) ?? renderView();
}
function initializeWritingBlockChangeState(): void { void writingBlockChangeState; }
function initializeEditableWritingBlock(): void { void jsx(); }
export { writingBlockChangeState as a, initializeWritingBlockChangeState as i, initializeEditableWritingBlock as n, dismissTransientChanges as r, EditableWritingBlock as t };
