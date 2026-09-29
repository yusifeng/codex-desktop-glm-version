// Composer dialog for editing an attached annotation comment.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as annotationCardChunk from "@rchunk/annotation-comment-editor-card";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useContext<Value>(context: unknown): Value; useState<Value>(initialValue: Value): [Value, (next: StateUpdater<Value>) => void] }
interface IntlShape { formatMessage(descriptor: Record<string, unknown>): string }
interface Annotation { localBrowserAttachedImages?: unknown[]; localBrowserDesignChange?: { group?: { declarations: unknown[]; text?: string | null; annotationControlChanges?: unknown[]; comment?: string | null } }; [key: string]: unknown }
interface EditorResult { body: string }

const shared = appSharedChunk as unknown as { $3?: () => void; I3: () => JsxRuntime; Ih?: unknown; K2?: () => void; Rh?: unknown; Y2?: unknown; b_?: (value: number, maximum: number) => number; e6: () => ReactRuntime; n4: () => IntlShape; wL?: () => void; x_?: () => unknown; y_?: () => void; zh?: () => void };
const initial = appInitialChunk as unknown as { E7?: () => void; Lpn?: (annotation: Annotation) => string; Rpn?: () => number; T7?: unknown };
const annotationCard = annotationCardChunk as unknown as { n?: () => void; t?: unknown };
const { $3: initializeSharedRuntime, I3: getJsxRuntime, Ih: Dialog, K2: initializeReactCompilerRuntime, Rh: VisuallyHidden, Y2: FormattedMessage, b_: clampHeight, e6: getReactRuntime, n4: useIntl, wL: initializeSharedLinks, x_: useModifierState, y_: initializeSharedTheme, zh: initializeIcons } = shared;
const { E7: initializeAnnotationRuntime, Lpn: getAnnotationComment, Rpn: getMaximumEditorHeight, T7: portalContainerContext } = initial;
const { n: initializeAnnotationCard, t: AnnotationCommentEditorCard } = annotationCard;

let jsx: JsxRuntime;
let React: ReactRuntime;
let maximumEditorHeight = 480;
let initialized = false;

function initializeComposerAnnotationEditor(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  initializeSharedLinks?.();
  const configuredMaximum = getMaximumEditorHeight?.();
  if (typeof configuredMaximum === "number") maximumEditorHeight = configuredMaximum;
  React = getReactRuntime();
  initializeReactCompilerRuntime?.();
  initializeAnnotationRuntime?.();
  initializeSharedTheme?.();
  initializeAnnotationCard?.();
  initializeIcons?.();
  jsx = getJsxRuntime();
  initialized = true;
}

function ComposerAnnotationEditor({ annotation, cwd, onClose, onRemove, onSave }: { annotation: Annotation; cwd?: string | null; onClose(): void; onRemove(): void; onSave(body: string): unknown }): unknown {
  initializeComposerAnnotationEditor();
  const intl = useIntl();
  const portalContainer = React.useContext<unknown>(portalContainerContext);
  useModifierState?.();
  const [height, setHeight] = React.useState(120);
  const [lightDismissible, setLightDismissible] = React.useState(true);
  const group = annotation.localBrowserDesignChange?.group;
  const allowEmptySubmit = group != null && (group.declarations.length > 0 || group.text != null || (group.annotationControlChanges?.length ?? 0) > 0);
  const body = group == null ? getAnnotationComment?.(annotation) ?? "" : group.comment ?? "";
  const session = { sessionId: "composer-annotation-edit", target: { mode: "edit", commentId: "composer-annotation" }, body, attachedImages: annotation.localBrowserAttachedImages, cwd, previewAlignment: "center", surfaceMode: "editor" };
  const submit = ({ body: nextBody }: EditorResult) => onSave(nextBody);
  const card = jsx.jsx(AnnotationCommentEditorCard ?? "div", { allowDirectSubmit: false, allowEmptySubmit, allowImageAttachments: false, inputAriaLabel: intl.formatMessage({ id: "composer.annotationEditor.comment", defaultMessage: "Annotation comment" }), session, showAdjustEntry: false, windowHeight: 120, onCancel: onClose, onDelete: onRemove, onDirectSubmit: submit, onEscape: onClose, onLightDismissibilityChange: setLightDismissible, onMounted: (_element: unknown, size: { height: number } | null) => { if (size != null) setHeight(clampHeight?.(size.height, maximumEditorHeight) ?? Math.min(size.height, maximumEditorHeight)); }, onSubmit: submit });
  const title = jsx.jsx(VisuallyHidden ?? "span", { className: "sr-only", children: jsx.jsx(FormattedMessage ?? "span", { id: "composer.annotationEditor.title", defaultMessage: "Edit annotation" }) });
  return jsx.jsxs(Dialog ?? "dialog", { open: true, contentClassName: "top-toolbar inset-x-4 mt-4", contentPosition: "anchored", contentProps: { "aria-describedby": undefined, style: { maxWidth: 294 } }, portalContainer, showDialogClose: false, shouldIgnoreClickOutside: !lightDismissible, unstyledContent: true, onOpenChange: (open: boolean) => { if (!open) onClose(); }, children: [title, jsx.jsx("div", { className: "relative max-w-full", style: { height }, children: card })] });
}

initializeComposerAnnotationEditor();
export { ComposerAnnotationEditor };
