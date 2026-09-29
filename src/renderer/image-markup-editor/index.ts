import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { n as initializeImageEditSizeControl, t as ImageEditSizeControl } from "@rchunk/image-edit-size-control";
import { n as UnsavedChangesDialog, r as initializeComposerHost } from "@rchunk/composer-host";
import {
  d as commentsIn,
  l as useSketchEditor,
  n as createSketchEditor,
  o as SketchSurface,
  t as initializeSketch,
  type Bounds,
  type SketchDocument,
  type SketchEditor,
  type SketchObject,
  type SketchTool,
} from "@rchunk/sketch";
import { i as initializeImageExport, r as fitImageToEditor } from "@rchunk/image-export";

interface ImageSize {
  height: number;
  width: number;
}

interface CommentDraft {
  bounds: Bounds;
  id?: string;
  text: string;
}

interface NativeMarkupSession {
  alt?: string;
  imageSize: ImageSize;
  isReady(): boolean;
  onAccepted(): void;
  onDiscard(): void;
  readDocument(): SketchDocument | null;
  sourceImage?: unknown;
  src: string;
  tabId: string;
}

interface ImageMarkupEditorHandle {
  commitComment(): void;
  editor: SketchEditor;
  isReadOnly: boolean;
  requestClose(source?: "editor" | "tab"): void;
}

interface KeyboardLikeEvent {
  defaultPrevented?: boolean;
  key: string;
  nativeEvent?: { isComposing?: boolean };
  preventDefault(): void;
  stopPropagation(): void;
}

interface ImageMarkupEditorProps {
  alt?: string;
  clipboardScope?: unknown;
  imageSize: ImageSize;
  isSubmitting?: boolean;
  isUnifiedViewerEnabled?: boolean;
  onCancel(): void;
  prepareNativeMarkup?(session: NativeMarkupSession): void | (() => void);
  ref?: unknown;
  renderToolbar?(toolbar: unknown): unknown;
  showCommentTool?: boolean;
  sizeControlContainer?: unknown;
  sourceImage?: unknown;
  src: string;
  tabId?: string;
  viewport?: unknown;
}

interface ToolbarProps {
  disabled: boolean;
  editor: SketchEditor;
  hasPendingComment: boolean;
  isUnifiedViewerEnabled: boolean;
  onCancel(): void;
  onCommitComment(): void;
  showCommentTool: boolean;
  snapshot: ReturnType<SketchEditor["getSnapshot"]>;
}

interface ReactRuntimeWithImperativeHandle extends ReactRuntime {
  useImperativeHandle<T>(ref: unknown, create: () => T, dependencies: readonly unknown[]): void;
}

let jsxRuntime: JsxRuntime | undefined;
let React: ReactRuntimeWithImperativeHandle | undefined;

function jsx(): JsxRuntime {
  jsxRuntime ??= getJsxRuntime();
  return jsxRuntime;
}

function react(): ReactRuntimeWithImperativeHandle {
  React ??= getReactRuntime() as unknown as ReactRuntimeWithImperativeHandle;
  return React;
}

function hasVisibleMarkup(objects: readonly SketchObject[]): boolean {
  return objects.some((object) => object.kind !== "eraser");
}

function createEditor(): SketchEditor {
  return createSketchEditor({
    drawingWidthPx: 4,
    style: { color: "#dc2626", width: 8 },
    textSizePx: 24,
    tool: "pen",
  });
}

function toolButton(
  editor: SketchEditor,
  activeTool: SketchTool,
  tool: SketchTool,
  label: string,
  disabled: boolean,
  beforeChange: () => void,
): unknown {
  return jsx().jsx("button", {
    "aria-label": label,
    "aria-pressed": activeTool === tool,
    disabled,
    onClick: () => {
      beforeChange();
      editor.commitPendingTextEdit();
      editor.setTool(tool);
    },
    type: "button",
    children: label,
  });
}

function EditorToolbar({
  disabled,
  editor,
  hasPendingComment,
  isUnifiedViewerEnabled,
  onCancel,
  onCommitComment,
  showCommentTool,
  snapshot,
}: ToolbarProps): unknown {
  const beforeChange = (): void => {
    if (hasPendingComment) onCommitComment();
  };
  const tools: unknown[] = [
    toolButton(editor, snapshot.activeTool, "select", "Select", disabled, beforeChange),
    toolButton(editor, snapshot.activeTool, "pen", "Draw", disabled, beforeChange),
    toolButton(editor, snapshot.activeTool, "text", "Text", disabled, beforeChange),
    toolButton(editor, snapshot.activeTool, "rectangle", "Shape", disabled, beforeChange),
  ];
  if (showCommentTool) {
    tools.push(toolButton(editor, snapshot.activeTool, "comment", "Add comment", disabled, beforeChange));
  }
  tools.push(
    jsx().jsx("label", {
      children: [
        "Color",
        jsx().jsx("input", {
          "aria-label": "Color",
          disabled,
          onChange: (event: { target: { value: string } }) => {
            beforeChange();
            editor.setStyle({ color: event.target.value });
          },
          type: "color",
          value: snapshot.style.color,
        }),
      ],
    }),
    toolButton(editor, snapshot.activeTool, "eraser", "Eraser", disabled, beforeChange),
    jsx().jsx("button", {
      "aria-label": "Undo",
      disabled: disabled || (!snapshot.canUndo && !hasPendingComment),
      onClick: () => {
        beforeChange();
        editor.commitPendingTextEdit();
        editor.undo();
      },
      type: "button",
      children: "Undo",
    }),
    jsx().jsx("button", {
      "aria-label": "Redo",
      disabled: disabled || !snapshot.canRedo,
      onClick: () => {
        beforeChange();
        editor.commitPendingTextEdit();
        editor.redo();
      },
      type: "button",
      children: "Redo",
    }),
    jsx().jsx("button", {
      "aria-label": "Cancel markup",
      onClick: onCancel,
      type: "button",
      children: "Cancel",
    }),
  );
  return jsx().jsx("div", {
    "aria-label": "Image markup tools",
    "data-unified-viewer": isUnifiedViewerEnabled ? "true" : "false",
    role: "toolbar",
    children: tools,
  });
}

function ImageMarkupEditor(props: ImageMarkupEditorProps): unknown {
  const hooks = react();
  const [editor] = hooks.useState(createEditor);
  const snapshot = useSketchEditor(editor);
  const [draft, setDraft] = hooks.useState<CommentDraft | null>(null);
  const [closeSource, setCloseSource] = hooks.useState<"editor" | "tab" | null>(null);
  const acceptedRef = hooks.useRef(false);
  const isReadOnly = props.isSubmitting === true || closeSource != null;
  const dirty =
    hasVisibleMarkup(snapshot.effectiveDocument.objects) ||
    snapshot.hasPendingTextEdit ||
    snapshot.hasActiveGesture ||
    draft != null;

  const commitComment = hooks.useCallback((): void => {
    if (draft == null) return;
    const text = draft.text.trim();
    if (draft.id == null) {
      if (text !== "") editor.insertComment({ bounds: draft.bounds, text });
    } else if (text === "") {
      editor.deleteObject(draft.id);
    } else {
      editor.updateComment(draft.id, text);
    }
    setDraft(null);
  }, [draft, editor]);

  const requestClose = hooks.useCallback((source: "editor" | "tab" = "editor"): void => {
    if (props.isSubmitting === true) return;
    if (dirty) setCloseSource(source);
    else props.onCancel();
  }, [dirty, props.isSubmitting, props.onCancel]);

  hooks.useImperativeHandle(props.ref, () => ({
    commitComment,
    editor,
    isReadOnly,
    requestClose,
  } satisfies ImageMarkupEditorHandle), [commitComment, editor, isReadOnly, requestClose]);

  hooks.useEffect(() => {
    if (props.prepareNativeMarkup == null || props.tabId == null) return;
    return props.prepareNativeMarkup({
      alt: props.alt,
      imageSize: props.imageSize,
      isReady: () => !snapshot.hasActiveGesture && draft == null && closeSource == null,
      onAccepted: () => {
        acceptedRef.current = true;
        props.onCancel();
      },
      onDiscard: () => requestClose(),
      readDocument: () => {
        const current = editor.getSnapshot();
        return current.hasActiveGesture || draft != null || closeSource != null ? null : current.effectiveDocument;
      },
      sourceImage: props.sourceImage,
      src: props.src,
      tabId: props.tabId,
    });
  }, [
    closeSource,
    draft,
    editor,
    props.alt,
    props.imageSize,
    props.onCancel,
    props.prepareNativeMarkup,
    props.sourceImage,
    props.src,
    props.tabId,
    requestClose,
    snapshot.hasActiveGesture,
  ]);

  const onKeyDown = hooks.useCallback((event: KeyboardLikeEvent): void => {
    if (event.defaultPrevented || event.nativeEvent?.isComposing || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (isReadOnly) return;
    if (draft == null) requestClose();
    else setDraft(null);
  }, [draft, isReadOnly, requestClose]);

  const surfaceSize = fitImageToEditor(props.imageSize) as ImageSize;
  const comments = commentsIn(snapshot.document) as Array<SketchObject & { bounds: Bounds; text: string }>;
  const toolbar = EditorToolbar({
    disabled: isReadOnly,
    editor,
    hasPendingComment: draft?.text.trim() !== "",
    isUnifiedViewerEnabled: props.isUnifiedViewerEnabled === true,
    onCancel: () => requestClose(),
    onCommitComment: commitComment,
    showCommentTool: props.showCommentTool === true,
    snapshot,
  });
  const toolbarView = props.renderToolbar == null
    ? jsx().jsx("div", { className: "image-markup-toolbar", children: toolbar })
    : props.renderToolbar(toolbar);
  const commentEditor = draft == null
    ? null
    : jsx().jsxs("form", {
        "data-comment-draft": draft.id ?? "new",
        onSubmit: (event: { preventDefault(): void }) => {
          event.preventDefault();
          commitComment();
        },
        children: [
          jsx().jsx("textarea", {
            "aria-label": "Comment",
            autoFocus: true,
            disabled: isReadOnly,
            onChange: (event: { target: { value: string } }) => setDraft({ ...draft, text: event.target.value }),
            value: draft.text,
          }),
          jsx().jsx("button", { disabled: isReadOnly || draft.text.trim() === "", type: "submit", children: "Save" }),
          jsx().jsx("button", { onClick: () => setDraft(null), type: "button", children: "Cancel" }),
        ],
      });
  const commentPins = comments.map((comment) => jsx().jsx("button", {
    "aria-label": `Edit comment ${comment.id}`,
    disabled: isReadOnly,
    onClick: () => {
      if (draft?.id !== comment.id) commitComment();
      setDraft({ bounds: comment.bounds, id: comment.id, text: comment.text });
    },
    type: "button",
    children: comment.text,
  }, comment.id));
  const canvas = jsx().jsxs("div", {
    className: "image-markup-canvas",
    children: [
      jsx().jsx(SketchSurface, {
        "aria-label": props.alt ?? "Image markup canvas",
        clipboardScope: props.clipboardScope,
        editor,
        onCommentPlace: (bounds: Bounds) => {
          if (!isReadOnly && snapshot.activeTool === "comment") setDraft({ bounds, text: "" });
        },
        onInteractionStart: commitComment,
        readOnly: isReadOnly,
        sourceImage: props.src,
        surfaceSize,
        viewport: props.viewport,
      }),
      jsx().jsx(ImageEditSizeControl, {
        container: props.sizeControlContainer,
        zoom: 1,
        children: jsx().jsx("span", { children: `${Math.round(surfaceSize.width)} × ${Math.round(surfaceSize.height)}` }),
      }),
      ...commentPins,
      commentEditor,
    ],
  });
  const dialog = closeSource == null
    ? null
    : jsx().jsx(UnsavedChangesDialog, {
        onDiscard: () => {
          acceptedRef.current = closeSource === "tab";
          props.onCancel();
        },
        onKeepEditing: () => setCloseSource(null),
      });

  return jsx().jsxs("div", {
    "aria-busy": props.isSubmitting === true,
    "data-native-markup-accepted": acceptedRef.current ? "true" : "false",
    className: "relative h-full min-h-0 w-full",
    onKeyDown,
    role: "presentation",
    children: [canvas, toolbarView, dialog],
  });
}

initializeImageEditSizeControl();
initializeComposerHost();
initializeSketch();
initializeImageExport();

export { ImageMarkupEditor };
