import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/arrow-rotate-ccw";
import "@rchunk/design-editor-state";
import "@rchunk/wheel-swipe-gesture";

export type AnnotationSubmitMode = "saved" | "direct";
export interface AnnotationEditorSession {
  body?: string;
  originalBody?: string | null;
  sessionId: string;
  surfaceMode: "composer" | "edit" | "preview";
}
export interface AnnotationCommentEditorCardProps {
  allowDirectSubmit?: boolean;
  allowDirectSubmitOnEdit?: boolean;
  allowEmptySubmit?: boolean;
  allowImageAttachments?: boolean;
  annotationSelectionAnchors?: readonly unknown[];
  autoFocus?: boolean;
  browserTabId?: string | null;
  createSubmitButtonSize?: "composer" | "small";
  defaultCreateSubmitMode?: AnnotationSubmitMode;
  defaultDesignEditorOpen?: boolean;
  defaultExpandedSpacingGroups?: readonly string[];
  inputAriaLabel?: string;
  isVisible?: boolean;
  keyboardEventTarget?: EventTarget | null;
  maxSurfaceHeight?: number;
  maxSurfaceWidth?: number;
  metadataAnchor?: unknown;
  onAttachmentPreviewOpenChange?(open: boolean): void;
  onBodyChange?(body: string): void;
  onCancel?(): void;
  onDelete?(): void;
  onDesignChangeDelete?(id: string): void;
  onDesignChangeUpdate?(change: unknown): void;
  onDesignScrubPropertyChange?(change: unknown): void;
  onDictationBusyChange?(busy: boolean): void;
  onDirectSubmit?(body: string): Promise<void> | void;
  onEscape?(): void;
  onLightDismissibilityChange?(dismissible: boolean): void;
  onMounted?(): void;
  onRepositionInteractionChange?(active: boolean): void;
  onSubmit?(body: string, mode: AnnotationSubmitMode): Promise<void> | void;
  onTweaksEditorOpenChange?(open: boolean): void;
  placeholder?: string;
  reservedTrayHeight?: number;
  session: AnnotationEditorSession;
  showAdjustEntry?: boolean;
  windowHeight?: number;
  windowWidth?: number;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function AnnotationCommentEditorCard(props: AnnotationCommentEditorCardProps): unknown {
  const body = props.session.body ?? "";
  props.onMounted?.();
  if (props.session.surfaceMode === "preview") {
    return jsx().jsxs("article", { "data-annotation-preview": true, "data-session-id": props.session.sessionId, children: [jsx().jsx("p", { children: body }), props.showAdjustEntry !== false ? jsx().jsx("button", { onClick: () => props.onTweaksEditorOpenChange?.(true), type: "button", children: "Adjust" }) : null] });
  }
  const canSubmit = props.allowEmptySubmit === true || body.trim().length > 0;
  const mode = props.defaultCreateSubmitMode ?? "saved";
  const submit = async (): Promise<boolean> => {
    if (!canSubmit) return false;
    if (mode === "direct" && props.allowDirectSubmit !== false) await props.onDirectSubmit?.(body);
    else await props.onSubmit?.(body, mode);
    return true;
  };
  return jsx().jsxs("form", {
    "data-annotation-editor": props.session.surfaceMode,
    "data-design-editor-open": props.defaultDesignEditorOpen ?? false,
    "data-visible": props.isVisible ?? true,
    onSubmit: (event: { preventDefault?(): void }) => { event.preventDefault?.(); void submit(); },
    children: [
      jsx().jsx("textarea", { "aria-label": props.inputAriaLabel ?? "Annotation", autoFocus: props.autoFocus ?? true, placeholder: props.placeholder, value: body, onChange: (event: { currentTarget: { value: string } }) => props.onBodyChange?.(event.currentTarget.value) }),
      props.allowImageAttachments !== false ? jsx().jsx("button", { onClick: () => props.onAttachmentPreviewOpenChange?.(true), type: "button", children: "Attach image" }) : null,
      props.session.surfaceMode === "edit" && props.onDelete ? jsx().jsx("button", { onClick: props.onDelete, type: "button", children: "Delete" }) : null,
      jsx().jsx("button", { onClick: props.onCancel, type: "button", children: "Cancel" }),
      jsx().jsx("button", { disabled: !canSubmit, onClick: submit, type: "submit", children: mode === "direct" ? "Send" : "Save" }),
    ],
  });
}

function initializeAnnotationCommentEditorCard(): void { void jsx(); }
export { initializeAnnotationCommentEditorCard as n, AnnotationCommentEditorCard as t };
