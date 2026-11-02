import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/codemirror-state-runtime";
import "@rchunk/codemirror-view-runtime";
import "@rchunk/codemirror-commands-runtime";
import "@rchunk/codemirror-language-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-diff-css";
import "@rchunk/file-diff-presentation-core";
import "@rchunk/render-file-children";
import "@rchunk/register-pierre-themes";
import "@rchunk/artifact-preview-header";
import "@rchunk/review-preferences-model";
import "@rchunk/surface";
import "@rchunk/file-diff-alt";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/review-file-source-breadcrumb";
import "@rchunk/text-file-storage";
import "@rchunk/text-editor-merge-runtime";
import "@rchunk/code-editor-runtime";
import "@rchunk/read-saved-plan-content";
export interface TextFileEditorProps {
  content?: string;
  cwd?: string | null;
  editor: { kind: "markdown" | "pierre" | "code" | string; language?: string };
  error?: unknown;
  externalContent?: string | null;
  filePath?: string;
  headerActions?: unknown;
  hideFileNavigation?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  language?: string;
  onContentChange?(content: string): void;
  onDiscardChange?(): void;
  onDraftChange?(content: string): void;
  onLoadError?(): void;
  onModeChange?(mode: "preview" | "source"): void;
  onSave?(content: string): boolean | Promise<boolean> | void;
  onSaveChange?(saved: boolean): void;
  onSelectFile?(path: string, options?: { isPreview?: boolean }): void;
  onUnsavedChangesChange?(unsaved: boolean): void;
  path?: string;
  readOnly?: boolean;
  renderSlots?(slots: { content: unknown; headerRows: unknown[]; sidePane?: unknown }): unknown;
  sidePane?: unknown;
  tabId: string;
  workspaceRoot?: string | null;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function editorStorageKey(environmentId: string, cwd: string): string { return `text-editor:${environmentId}:${cwd}`; }
function fileDisplayPath(path: string, workspaceRoot: string | null | undefined): string {
  if (workspaceRoot == null || path === workspaceRoot || path.startsWith(`${workspaceRoot.replace(/\/$/u, "")}/`)) return path;
  return `${workspaceRoot.replace(/\/$/u, "")}/${path.replace(/^\//u, "")}`;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function renderMarkdown(content: string): unknown {
  const blocks = content.split(/\n{2,}/u);
  return jsx().jsx("div", {
    "data-markdown-preview": true,
    children: blocks.map((block, index) => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/u);
      if (heading != null) {
        const level = Math.min(6, heading[1].length);
        return jsx().jsx(`h${level}`, { children: heading[2] }, index);
      }
      return jsx().jsx("p", { children: block }, index);
    }),
  });
}
function TextFileEditorTabContent(props: TextFileEditorProps): unknown {
  initializeTextFileEditor();
  const filePath = props.filePath ?? props.path ?? "";
  const originalContent = props.content ?? "";
  const [draft, setDraft] = ReactRuntime.useState(originalContent);
  const [savedContent, setSavedContent] = ReactRuntime.useState(originalContent);
  const [mode, setMode] = ReactRuntime.useState<"preview" | "source">(props.editor.kind === "markdown" ? "preview" : "source");
  if (props.isLoading) return jsx().jsx("div", { role: "status", children: "Loading file" });
  if (props.error != null) {
    props.onLoadError?.();
    return jsx().jsx("div", { role: "alert", children: errorMessage(props.error) });
  }
  if (filePath.length === 0) return jsx().jsx("div", { children: "Select a file" });

  const dirty = draft !== savedContent;
  const reportDraft = (value: string) => {
    setDraft(value);
    props.onDraftChange?.(value);
    props.onContentChange?.(value);
    props.onUnsavedChangesChange?.(value !== savedContent);
  };
  const finishSave = (saved: boolean, value: string) => {
    props.onSaveChange?.(saved);
    if (saved) {
      setSavedContent(value);
      props.onUnsavedChangesChange?.(false);
    }
    return saved;
  };
  const save = (value = draft): boolean | Promise<boolean> => {
    const result = props.onSave?.(value);
    return result != null && typeof (result as Promise<boolean>).then === "function"
      ? Promise.resolve(result).then((saved) => finishSave(saved !== false, value))
      : finishSave(result !== false, value);
  };
  const discard = () => {
    setDraft(originalContent);
    setSavedContent(originalContent);
    props.onDraftChange?.(originalContent);
    props.onContentChange?.(originalContent);
    props.onUnsavedChangesChange?.(false);
    props.onDiscardChange?.();
  };
  const switchMode = () => {
    const next = mode === "preview" ? "source" : "preview";
    setMode(next);
    props.onModeChange?.(next);
  };
  const editor = jsx().jsx("textarea", {
    "aria-label": "File contents",
    value: draft,
    "data-language": props.language ?? props.editor.language,
    readOnly: props.readOnly ?? false,
    onChange: (event: { currentTarget: { value: string } }) => reportDraft(event.currentTarget.value),
    onKeyDown: (event: { key: string; metaKey?: boolean; ctrlKey?: boolean; currentTarget: { value: string }; preventDefault(): void }) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setDraft(event.currentTarget.value);
        save(event.currentTarget.value);
      }
    },
  });
  const externalConflict = props.externalContent == null || props.externalContent === originalContent
    ? null
    : jsx().jsxs("div", {
        role: "alert",
        "data-external-change": true,
        children: [
          jsx().jsx("p", { children: "This file changed on disk." }),
          jsx().jsx("button", { onClick: discard, type: "button", children: "Use disk version" }),
          jsx().jsx("button", { onClick: () => save(draft), type: "button", children: "Keep my version" }),
        ],
      });
  const header = props.hideFileNavigation
    ? null
    : jsx().jsxs("header", {
        children: [
          jsx().jsx("button", {
            onClick: () => props.onSelectFile?.(filePath, { isPreview: true }),
            type: "button",
            children: fileDisplayPath(filePath, props.workspaceRoot),
          }),
          props.headerActions,
          props.editor.kind === "markdown"
            ? jsx().jsx("button", { onClick: switchMode, type: "button", children: mode === "preview" ? "View source" : "View preview" })
            : null,
          props.readOnly ? null : jsx().jsx("button", { onClick: () => save(draft), type: "button", children: "Save" }),
          props.readOnly ? null : jsx().jsx("button", { disabled: !dirty, onClick: discard, type: "button", children: "Discard" }),
        ],
      });
  const content = jsx().jsxs("section", {
    "data-editor-kind": props.editor.kind,
    "data-file-path": filePath,
    "data-tab-id": props.tabId,
    hidden: props.isActive === false,
    children: [header, externalConflict, props.editor.kind === "markdown" && mode === "preview" ? renderMarkdown(draft) : editor, props.sidePane],
  });
  return props.renderSlots?.({ content, headerRows: header == null ? [] : [header], sidePane: props.sidePane }) ?? content;
}
let storageInitialized = false;
let editorInitialized = false;
function initializeEditorStorage(): void { storageInitialized = true; }
function initializeTextFileEditor(): void {
  if (editorInitialized) return;
  editorInitialized = true;
  initializeEditorStorage();
  void jsx();
}
export { initializeEditorStorage as i, initializeTextFileEditor as n, editorStorageKey as r, TextFileEditorTabContent as t };
