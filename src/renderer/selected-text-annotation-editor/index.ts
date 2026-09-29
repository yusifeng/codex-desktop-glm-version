import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as annotationCardChunk from "@rchunk/annotation-comment-editor-card";
import * as lightDismissChunk from "@rchunk/comment-light-dismiss";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface MutableRef<Value> { current: Value }
interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useRef<Value>(initialValue: Value): MutableRef<Value>; useState<Value>(initialValue: Value): [Value, (next: StateUpdater<Value>) => void] }
interface IntlShape { formatMessage(descriptor: Record<string, unknown>): string }
interface EditorResult { body: string }
interface Focusable { focus(): void }
interface BlurTarget { contains(value: unknown): boolean; ownerDocument: { defaultView?: { requestAnimationFrame(callback: () => void): void } | null }; querySelector(selector: string): Focusable | null }
interface BlurEvent { currentTarget: BlurTarget; relatedTarget: unknown }
interface EditAnnotation { body?: string | null; id: string; onDelete?(): void }
interface EditorSize { height: number }
interface Props { draftBody?: string; editAnnotation?: EditAnnotation | null; onBodyChange?(body: string): void; onCancel(): void; onDirectSubmit(body: string): Promise<unknown> | unknown; onEscape?(): void; onLightDismissibilityChange?(dismissible: boolean): void; onSubmit(body: string): unknown }

const shared = appSharedChunk as unknown as { $3?: () => void; I3: () => JsxRuntime; K2?: () => void; b_?: (value: number, maximum: number) => number; e6: () => ReactRuntime; n4: () => IntlShape; wL?: () => void; x_?: () => number; y_?: () => void };
const annotationCard = annotationCardChunk as unknown as { n?: () => void; t?: unknown };
const lightDismiss = lightDismissChunk as unknown as { i: (ref: MutableRef<unknown>) => { shake(): void }; r?: () => void; t: (state: { isLightDismissArmed: boolean; isLightDismissible: boolean }) => "dismiss" | string };
const { $3: initializeSharedRuntime, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, b_: clampHeight, e6: getReactRuntime, n4: useIntl, wL: initializeSharedLinks, x_: useMaximumEditorHeight, y_: initializeSharedTheme } = shared;
const { n: initializeAnnotationCard, t: AnnotationCommentEditorCard } = annotationCard;
const { i: useShake, r: initializeLightDismiss, t: decideLightDismiss } = lightDismiss;

let jsx: JsxRuntime;
let React: ReactRuntime;
let initialized = false;
function initializeSelectedTextAnnotationEditor(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  initializeSharedLinks?.();
  React = getReactRuntime();
  initializeReactCompilerRuntime?.();
  initializeSharedTheme?.();
  initializeAnnotationCard?.();
  initializeLightDismiss?.();
  jsx = getJsxRuntime();
  initialized = true;
}

function SelectedTextAnnotationEditor({ draftBody, editAnnotation, onBodyChange, onCancel, onDirectSubmit, onEscape, onLightDismissibilityChange, onSubmit }: Props): unknown {
  initializeSelectedTextAnnotationEditor();
  const intl = useIntl();
  const maximumHeight = useMaximumEditorHeight?.() ?? 480;
  const lightDismissArmed = React.useRef(false);
  const lightDismissible = React.useRef(true);
  const dictationBusy = React.useRef(false);
  const directSubmitBusy = React.useRef(false);
  const editorRef = React.useRef<unknown>(null);
  const { shake } = useShake(editorRef);
  const [height, setHeight] = React.useState(editAnnotation == null ? 44 : 120);
  const trayHeight = editAnnotation == null ? 0 : 88;
  const sessionId = editAnnotation == null ? "response-text-annotation" : `response-text-annotation-${editAnnotation.id}`;
  const target = editAnnotation == null ? { mode: "create" } : { mode: "edit", commentId: editAnnotation.id };
  const session = { sessionId, target, body: editAnnotation?.body ?? "", draftBody, cwd: null, previewAlignment: "end", surfaceMode: "editor" };
  const attemptDismiss = (): boolean => {
    const decision = dictationBusy.current ? "shake" : decideLightDismiss({ isLightDismissArmed: lightDismissArmed.current, isLightDismissible: lightDismissible.current });
    if (decision === "dismiss") return true;
    lightDismissArmed.current = true;
    shake();
    return false;
  };
  const handleBlur = (event: BlurEvent): void => {
    if (directSubmitBusy.current || event.currentTarget.contains(event.relatedTarget)) return;
    if (attemptDismiss()) { onCancel(); return; }
    const input = event.currentTarget.querySelector(`[contenteditable="true"], input, textarea`);
    event.currentTarget.ownerDocument.defaultView?.requestAnimationFrame(() => input?.focus());
  };
  const handleDirectSubmit = ({ body }: EditorResult): void => {
    if (directSubmitBusy.current) return;
    directSubmitBusy.current = true;
    void Promise.resolve(onDirectSubmit(body)).finally(() => { directSubmitBusy.current = false; });
  };
  const card = jsx.jsx(AnnotationCommentEditorCard ?? "div", {
    allowImageAttachments: false, allowEmptySubmit: true, defaultCreateSubmitMode: "saved",
    inputAriaLabel: intl.formatMessage({ id: "selectedTextAnnotationEditor.noteAriaLabel", defaultMessage: "Note", description: "Accessible label for a note attached to selected response text" }),
    keyboardEventTarget: globalThis, placeholder: intl.formatMessage({ id: "selectedTextAnnotationEditor.placeholder", defaultMessage: "Add an optional comment…", description: "Placeholder for a note attached to selected response text" }),
    session, showAdjustEntry: false, windowHeight: 120 + trayHeight, onBodyChange, onCancel, onDelete: () => editAnnotation?.onDelete?.(), onEscape,
    onDictationBusyChange: (busy: boolean) => { dictationBusy.current = busy; lightDismissArmed.current = false; },
    onDirectSubmit: handleDirectSubmit,
    onLightDismissibilityChange: (dismissible: boolean) => { lightDismissible.current = dismissible; lightDismissArmed.current = false; onLightDismissibilityChange?.(dismissible); },
    onMounted: (_element: unknown, size: EditorSize | null) => { if (size != null && size.height > 0) setHeight(clampHeight?.(size.height, maximumHeight) ?? Math.min(size.height, maximumHeight)); },
    onSubmit: ({ body }: EditorResult) => onSubmit(body),
  });
  return jsx.jsxs("div", { "data-selected-text-annotation-editor": true, className: "group/annotation-editor pointer-events-auto relative max-w-full overflow-visible", style: { width: 294 }, onBlur: handleBlur, children: [
    jsx.jsx("div", { className: "hidden group-has-[[data-browser-comment-editor-tray-surface]]/annotation-editor:block", style: { height: trayHeight } }),
    jsx.jsx("div", { ref: editorRef, className: "relative w-full", style: { height, top: -trayHeight }, children: card }),
  ] });
}

initializeSelectedTextAnnotationEditor();
export { SelectedTextAnnotationEditor };
