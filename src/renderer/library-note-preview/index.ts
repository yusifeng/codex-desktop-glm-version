import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, n4 as useIntl, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { n as initializeRightPanelComposerOverlay, t as RightPanelComposerOverlay } from "@rchunk/right-panel-composer-overlay";
import { i as initializeWritingBlockSurface, t as WritingBlockEditorRegion } from "@rchunk/writing-block-surface";
import { n as initializeEditableWritingBlock, t as EditableWritingBlock } from "@rchunk/editable-writing-block";
import { t as initializeWritingBlockAiTools } from "@rchunk/chatgpt-writing-block-ai-tools";
import { r as initializeLibraryCloudFilePreview, t as LibraryFilePreviewComposer } from "@rchunk/library-cloud-file-preview";
import { n as initializePreviewLayout, t as PreviewLayout } from "@rchunk/preview-layout";
import { t as initializeOpenLibraryItem } from "@rchunk/open-library-item";

interface LibraryFile { file_id?: string; file_size_bytes?: number; gizmo_id?: string; id: string; library_file_category?: string; mime_type?: string; name: string }
interface LibraryEntry { node: LibraryFile }
interface SavedNote { content?: string; file: LibraryFile }
interface SaveInput { accountId: string; analyticsContext?: unknown; content: string; directoryId: string | null; file: LibraryFile | null; fileName: string; noteId: string; userId: string | null }
interface LibraryNoteRequest { analyticsContext?: unknown; content?: string; directoryId?: string | null; entry?: LibraryEntry | null; loadContent?(file: LibraryFile): Promise<string>; noteId: string; onCopy?(file: LibraryFile): void; saveNote?(input: SaveInput): Promise<SavedNote> }
interface LibraryNotePreviewProps { accountId: string; onClose(): void; request: LibraryNoteRequest; userId: string | null }
interface NoteState { content: string; failure: "save" | "size" | "storage" | null; file: LibraryFile | null; fileName: string; savedContent: string; saving: boolean }
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }): string }
interface StatusError { code?: string; httpStatus?: number; status?: number }
type LoadState = "error" | "loading" | "ready";

const MAX_TITLE_GRAPHEMES = 50;
let jsxRuntime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;
function jsx(): JsxRuntime { jsxRuntime ??= getJsxRuntime(); return jsxRuntime; }
function react(): ReactRuntime { React ??= getReactRuntime(); return React; }
function graphemes(value: string): string[] { return typeof Intl.Segmenter === "function" ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), item => item.segment) : Array.from(value); }
function firstReadableLine(content: string): string | null { for (const line of content.split(/\r\n?|\n/)) { const cleaned = line.replace(/<!--.*?-->/g, "").replace(/<\/?[A-Za-z][^>]*>/g, "").replace(/^\s{0,3}(?:#{1,6}|>|[-*+]\s+|\d+[.)]\s+)\s*/, "").replace(/^\[[ xX]\]\s+/, "").replace(/[*_\x60~]/g, "").replace(/\s+/g, " ").trim(); if (cleaned !== "") return cleaned; } return null; }
function truncateTitle(value: string): string { const parts = graphemes(value); if (parts.length <= MAX_TITLE_GRAPHEMES) return value; const prefix = parts.slice(0, MAX_TITLE_GRAPHEMES).join(""); if (parts[MAX_TITLE_GRAPHEMES] === " ") return prefix; const space = prefix.lastIndexOf(" "); return space < 0 ? prefix : prefix.slice(0, space); }
function fileNameFromContent(content: string): string { const title = firstReadableLine(content); if (title == null) return "Untitled.md"; const safe = truncateTitle(title).replace(/[\/]/g, "-").trim(); return safe === "" ? "Untitled.md" : safe + ".md"; }
function failureFrom(error: unknown): NoteState["failure"] { const candidate = error as StatusError | null; if (candidate?.code === "storage_full" || candidate?.httpStatus === 409 || candidate?.status === 409) return "storage"; if (candidate?.httpStatus === 413 || candidate?.status === 413) return "size"; return "save"; }
function failureMessage(failure: NoteState["failure"]): string { if (failure === "storage") return "Your Library storage is full. Free up space and retry"; if (failure === "size") return "This note is too large. Shorten it and retry"; return "Your edits haven’t been saved. Try again"; }

function LibraryNotePreview({ accountId, userId, request, onClose }: LibraryNotePreviewProps): unknown {
  const hooks = react();
  const intl = useIntl() as IntlRuntime;
  const entryFile = request.entry?.node ?? null;
  const initialContent = request.content;
  const [loadState, setLoadState] = hooks.useState<LoadState>(entryFile != null && initialContent == null ? "loading" : "ready");
  const [state, setState] = hooks.useState<NoteState>(() => ({ content: initialContent ?? "", failure: null, file: entryFile, fileName: entryFile?.name ?? "Untitled.md", savedContent: initialContent ?? "", saving: false }));
  const timerRef = hooks.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = hooks.useRef<Promise<boolean> | null>(null);
  const mountedRef = hooks.useRef(true);
  const stateRef = hooks.useRef(state);
  stateRef.current = state;
  hooks.useEffect(() => () => { mountedRef.current = false; if (timerRef.current != null) clearTimeout(timerRef.current); }, []);
  const load = hooks.useCallback(async (): Promise<void> => { if (entryFile == null || initialContent != null) return; setLoadState("loading"); try { const content = request.loadContent == null ? "" : await request.loadContent(entryFile); if (!mountedRef.current) return; setState({ content, failure: null, file: entryFile, fileName: entryFile.name, savedContent: content, saving: false }); setLoadState("ready"); } catch { if (mountedRef.current) setLoadState("error"); } }, [entryFile, initialContent, request.loadContent]);
  hooks.useEffect(() => { void load(); }, [load]);
  const flush = hooks.useCallback(async (): Promise<boolean> => {
    if (timerRef.current != null) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (savePromiseRef.current != null) return savePromiseRef.current;
    const current = stateRef.current;
    if (current.file != null && current.content === current.savedContent && current.fileName === current.file.name) return true;
    if (current.file == null && current.content.trim() === "") return true;
    const operation = (async (): Promise<boolean> => {
      setState(value => ({ ...value, failure: null, saving: true }));
      try {
        const saved = request.saveNote == null ? { content: current.content, file: current.file ?? { id: request.noteId, name: current.fileName } } : await request.saveNote({ accountId, analyticsContext: request.analyticsContext, content: current.content || "\n", directoryId: request.entry == null ? request.directoryId ?? null : null, file: current.file, fileName: current.fileName, noteId: request.noteId, userId });
        if (mountedRef.current) setState(value => ({ ...value, failure: null, file: saved.file, fileName: value.fileName === current.fileName ? saved.file.name : value.fileName, savedContent: saved.content ?? current.content, saving: false }));
        return true;
      } catch (error) { if (mountedRef.current) setState(value => ({ ...value, failure: failureFrom(error), saving: false })); return false; }
      finally { savePromiseRef.current = null; }
    })();
    savePromiseRef.current = operation;
    return operation;
  }, [accountId, request.analyticsContext, request.directoryId, request.entry, request.noteId, request.saveNote, userId]);
  const edit = hooks.useCallback((content: string): void => { setState(value => ({ ...value, content, failure: null, fileName: value.file == null ? fileNameFromContent(content) : value.fileName })); if (timerRef.current != null) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => { void flush(); }, 500); }, [flush]);
  const close = hooks.useCallback(async (): Promise<void> => { if (await flush()) onClose(); }, [flush, onClose]);
  const title = state.fileName.replace(/\.md$/i, "") || "Untitled";
  const assetName = jsx().jsxs("div", { className: "library-note-breadcrumb", children: [jsx().jsx("button", { onClick: () => void close(), type: "button", children: "Library" }), jsx().jsx("span", { "aria-hidden": true, children: " / " }), jsx().jsx("span", { "aria-current": "page", title, children: title })] });
  if (loadState !== "ready") return jsx().jsx(PreviewLayout, { assetName, headerVariant: "document", onClose, children: loadState === "error" ? jsx().jsx("button", { onClick: () => void load(), type: "button", children: "Retry loading note" }) : jsx().jsx("div", { role: "status", children: "Loading note" }) });
  const bottomContent = state.file == null ? null : jsx().jsx(RightPanelComposerOverlay, { children: jsx().jsx(LibraryFilePreviewComposer, { file: { id: state.file.id, file_id: state.file.file_id ?? state.file.id, file_name: state.file.name, file_size_bytes: state.file.file_size_bytes, gizmo_id: state.file.gizmo_id, library_file_category: state.file.library_file_category ?? "text", mime_type: state.file.mime_type }, imageDataUrl: null, onClose, submitDisabled: state.content !== state.savedContent || state.saving || state.failure != null }) });
  return jsx().jsx(EditableWritingBlock, {
    content: state.content, editorKey: request.noteId, isEditable: true, libraryFileId: state.file?.id, onBlur: () => void flush(), onContentChange: edit, onCopy: () => { if (state.file != null) request.onCopy?.(state.file); }, placeholder: intl.formatMessage({ id: "libraryNext.note.editor.placeholder", defaultMessage: "Write or type '/' for commands…", description: "Placeholder in the Library note editor" }), testId: "library-note-editor",
    render: ({ renderView }: { renderView(props?: Record<string, unknown>): unknown }) => jsx().jsx(PreviewLayout, { assetName, bottomContent, headerVariant: "document", onClose: () => void close(), endContent: state.saving && state.failure == null ? jsx().jsx("div", { role: "status", children: "Saving…" }) : null, children: jsx().jsx(WritingBlockEditorRegion, { className: "min-h-0 flex-1 overflow-y-auto", children: jsx().jsxs("div", { children: [state.failure == null ? null : jsx().jsxs("div", { role: "alert", children: [failureMessage(state.failure), jsx().jsx("button", { onClick: () => void flush(), type: "button", children: "Retry" })] }), renderView()] }) }) }),
  });
}

initializeRightPanelComposerOverlay();
initializeWritingBlockSurface();
initializeEditableWritingBlock();
initializeWritingBlockAiTools();
initializeLibraryCloudFilePreview();
initializePreviewLayout();
initializeOpenLibraryItem();

export { LibraryNotePreview };
