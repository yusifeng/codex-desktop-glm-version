import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
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
export interface TextFileEditorProps { content?: string; editor: { kind: "pierre" | "code" | string }; filePath: string; isActive?: boolean; language?: string; onDraftChange?(content: string): void; onSaveChange?(saved: boolean): void; onUnsavedChangesChange?(unsaved: boolean): void; readOnly?: boolean; tabId: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function editorStorageKey(environmentId: string, cwd: string): string { return `text-editor:${environmentId}:${cwd}`; }
function TextFileEditorTabContent(props: TextFileEditorProps): unknown { const update = (value: string) => { props.onDraftChange?.(value); props.onUnsavedChangesChange?.(value !== (props.content ?? "")); }; return jsx().jsxs("section", { "data-editor-kind": props.editor.kind, "data-file-path": props.filePath, "data-tab-id": props.tabId, hidden: props.isActive === false, children: [jsx().jsx("header", { children: props.filePath }), jsx().jsx("textarea", { defaultValue: props.content ?? "", "data-language": props.language, readOnly: props.readOnly ?? false, onChange: (event: { currentTarget: { value: string } }) => update(event.currentTarget.value), onKeyDown: (event: { key: string; metaKey?: boolean; ctrlKey?: boolean; currentTarget: { value: string }; preventDefault(): void }) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); props.onSaveChange?.(true); props.onUnsavedChangesChange?.(false); } } })] }); }
function initializeEditorStorage(): void {}
function initializeTextFileEditor(): void { void jsx(); }
export { initializeEditorStorage as i, initializeTextFileEditor as n, editorStorageKey as r, TextFileEditorTabContent as t };
