import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/model-picker-chevron-down-sm";
import "@rchunk/writing-block-surface";

const jsxRuntime = getJsxRuntime();

type Listener = () => void;
type SlashCommandId = "checklist" | "columnDelete" | "columnLeft" | "columnRight" | "divider" | "generate" | "heading1" | "heading2" | "heading3" | "orderedList" | "paragraph" | "table" | "unorderedList" | string;

interface TextRange { from: number; to: number; revealAfter?: number; revealFrom?: number; waitForCompletion?: boolean }
interface TextNodeLike { isAtom?: boolean; isText?: boolean; nodeSize: number; text?: string | null }
interface DocumentLike {
  content?: { size: number };
  descendants(callback: (node: TextNodeLike, position: number) => boolean | void): void;
  textContent?: string;
}
interface SelectionLike { empty: boolean; from: number; to: number; link?: { from: number; href: string; to: number } | null }
interface EditorStateLike { doc: DocumentLike; selection: SelectionLike; externalContentKey?: string | null }
interface TransactionLike { setMeta?(key: string, value: unknown): TransactionLike }
interface EditorViewLike {
  dispatch?(transaction: TransactionLike): void;
  focus?(): void;
  hasFocus?(): boolean;
  isDestroyed?: boolean;
  state: EditorStateLike & { tr?: TransactionLike };
}
interface SlashMenuState { anchorPos?: number | null; highlightedOptionId?: string | null; normalizedQuery?: string; query: string; triggerPos?: number | null; visibleOptionIds: string[] }
interface EditorSnapshot {
  docChangeCount: number;
  editorView: EditorViewLike | null;
  generatePluginState: Record<string, unknown> | null;
  historySummary: { canRedo: boolean; canUndo: boolean };
  selectionSummary: { caretLinkHref?: string; isCollapsed: boolean };
  slashMenuState: SlashMenuState;
}
interface EditorStore {
  clearView(view: EditorViewLike): void;
  getSnapshot(): EditorSnapshot;
  restoreStateFromProps(input: { plugins: readonly unknown[]; schema: unknown }): unknown;
  setView(view: EditorViewLike | null): void;
  subscribe(listener: Listener): () => void;
  syncFromState(state: EditorStateLike, transaction?: { docChanged?: boolean }): void;
}
interface RevisionCue { ranges: TextRange[]; text: string }
interface AssistantRevision { changes?: RevisionCue | null; dismissed?: "edit" | string; expiresAt?: number | null; isStreaming?: boolean }
interface WritingBlockEditorHandle { focus(): void; getMarkdown(): string; readonly view: EditorViewLike | null }
interface EditorController { destroy(): void; getMarkdown(): string; setEditable?(editable: boolean): void; setMarkdown(markdown: string): boolean | void; view: EditorViewLike & { dom?: { addEventListener?(type: string, listener: Listener): void; removeEventListener?(type: string, listener: Listener): void } } }
interface WritingBlockEditorProps {
  ariaLabel?: string;
  className?: string;
  createEditor?(options: Record<string, unknown>): EditorController;
  editable?: boolean;
  editorClassName?: string;
  editorKey: string;
  markdown?: string;
  newlineSelectionAppearance?: "default" | "native" | string;
  onBlur?(): void;
  onChange?(markdown: string): void;
  placeholder?: string;
  proseMirrorStore?: EditorStore;
  tableSelectionAppearance?: "default" | "native" | string;
}
interface SlashMenuProps { editorView: EditorViewLike; onExecute(commandId: string, query: string): void; state?: SlashMenuState | null }
interface SelectionActionsProps { editable?: boolean; editorView: EditorViewLike; selection?: SelectionLike | null; trailingActions?: unknown; onAskForChanges?(view: EditorViewLike): void; onEditSelection?(instruction: string, range: TextRange): Promise<boolean> }

const emptySlashMenuState: SlashMenuState = { query: "", visibleOptionIds: [] };
const initialSnapshot = (): EditorSnapshot => ({ editorView: null, slashMenuState: emptySlashMenuState, generatePluginState: null, selectionSummary: { isCollapsed: true }, historySummary: { canUndo: false, canRedo: false }, docChangeCount: 0 });

function sameSlashMenu(left: SlashMenuState, right: SlashMenuState): boolean {
  return left === right || left.triggerPos === right.triggerPos && left.anchorPos === right.anchorPos && left.query === right.query && left.normalizedQuery === right.normalizedQuery && left.highlightedOptionId === right.highlightedOptionId && left.visibleOptionIds.length === right.visibleOptionIds.length && left.visibleOptionIds.every((id, index) => id === right.visibleOptionIds[index]);
}
function sameSnapshot(left: EditorSnapshot, right: EditorSnapshot): boolean {
  return left.editorView === right.editorView && sameSlashMenu(left.slashMenuState, right.slashMenuState) && left.generatePluginState === right.generatePluginState && left.selectionSummary.isCollapsed === right.selectionSummary.isCollapsed && left.selectionSummary.caretLinkHref === right.selectionSummary.caretLinkHref && left.historySummary.canUndo === right.historySummary.canUndo && left.historySummary.canRedo === right.historySummary.canRedo && left.docChangeCount === right.docChangeCount;
}
function createEditorStore(): EditorStore {
  let snapshot = initialSnapshot();
  let retainedState: (EditorStateLike & { reconfigure?(input: { plugins: readonly unknown[] }): unknown; schema?: unknown }) | null = null;
  const listeners = new Set<Listener>();
  const update = (patch: Partial<EditorSnapshot>) => { const next = { ...snapshot, ...patch }; if (!sameSnapshot(snapshot, next)) { snapshot = next; listeners.forEach(listener => listener()); } };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setView(view) { if (view == null) update(initialSnapshot()); else update({ editorView: view }); },
    clearView(view) { if (snapshot.editorView === view) update(initialSnapshot()); },
    restoreStateFromProps({ schema, plugins }) { return retainedState?.schema === schema ? retainedState.reconfigure?.({ plugins }) ?? null : null; },
    syncFromState(state, transaction) {
      retainedState = state;
      const link = state.selection.link;
      update({ selectionSummary: { isCollapsed: state.selection.empty, ...(link?.href == null ? {} : { caretLinkHref: link.href }) }, docChangeCount: snapshot.docChangeCount + Number(Boolean(transaction?.docChanged)) });
    },
  };
}
function useEditorStore(store: EditorStore): EditorSnapshot { return store.getSnapshot(); }

const editorStyles = Object.freeze({ content: "_content_1qalx_892", root: "_editor_1qalx_8", tableFloatingUi: "_tableFloatingUi_1qalx_135" });
function initializeEditorStore(): void {}
function initializeEditorStyles(): void {}
function initializeWritingBlockEditor(): void {}
function initializeFloatingActions(): void {}
function initializeEditorFeatures(): void {}
function initializeRevisionRuntime(): void {}
function initializeFloatingSlashMenu(): void {}
function initializeSlashMenuRuntime(): void {}
function initializeRevisionPlugin(): void {}
function initializeExternalContentPlugin(): void {}

function documentText(document: DocumentLike): string { return typeof document.textContent === "string" ? document.textContent : flattenDocumentText(document).text; }
function externalContentChangeStatus(store: EditorStore, update: { key?: string | null } | null | undefined, markdown: string): "changed" | "unchanged" | null {
  const view = store.getSnapshot().editorView;
  if (update?.key == null || view == null || view.isDestroyed) return null;
  if (view.state.externalContentKey === update.key) return null;
  return documentText(view.state.doc) === markdown ? "unchanged" : "changed";
}

function flattenDocumentText(document: DocumentLike, ranges: readonly TextRange[] = []): { nodes: Array<{ from: number; length: number; offset: number }>; ranges: TextRange[]; text: string } {
  const result: { nodes: Array<{ from: number; length: number; offset: number }>; ranges: TextRange[]; text: string } = { text: "", nodes: [], ranges: [] };
  document.descendants((node, position) => {
    if (node.isText && node.text != null) {
      const offset = result.text.length;
      const end = position + node.nodeSize;
      result.text += node.text;
      result.nodes.push({ from: position, offset, length: node.nodeSize });
      for (const range of ranges) if (range.to > position && range.from < end) result.ranges.push({ ...range, from: offset + Math.max(position, range.from) - position, to: offset + Math.min(end, range.to) - position });
    }
    return !node.isAtom;
  });
  const mapPosition = (position: number): number => { const node = result.nodes.find(item => position <= item.from + item.length); return node == null ? result.text.length : node.offset + Math.max(0, position - node.from); };
  for (const range of result.ranges) { if (range.revealAfter != null) range.revealAfter = mapPosition(range.revealAfter); if (range.revealFrom != null) range.revealFrom = mapPosition(range.revealFrom); }
  return result;
}
function computeAssistantRevisionCue({ previousDoc, receivedDoc, isStreaming, endsAtWordBoundary }: { endsAtWordBoundary: boolean; isStreaming: boolean; previousDoc: DocumentLike; receivedDoc: DocumentLike }): RevisionCue | null {
  const previous = documentText(previousDoc); const received = flattenDocumentText(receivedDoc).text;
  if (previous === received) return null;
  let prefix = 0; while (prefix < previous.length && prefix < received.length && previous[prefix] === received[prefix]) prefix++;
  let previousEnd = previous.length; let receivedEnd = received.length;
  while (previousEnd > prefix && receivedEnd > prefix && previous[previousEnd - 1] === received[receivedEnd - 1]) { previousEnd--; receivedEnd--; }
  let visibleEnd = received.length;
  if (isStreaming && !endsAtWordBoundary) { const partial = received.slice(prefix).match(/\S+$/u); if (partial?.index != null) visibleEnd = prefix + partial.index; }
  const from = Math.min(prefix, visibleEnd); const to = Math.min(receivedEnd, visibleEnd);
  return { text: received.slice(0, visibleEnd), ranges: from < to ? [{ from, to, ...(previousEnd > prefix && to === from ? { waitForCompletion: true } : {}) }] : [] };
}
function streamingRevealDuration(text: string, mode: "5s" | "10s" | "length-dependent" | string): number | null {
  if (mode === "5s") return 5000; if (mode === "10s") return 10000; if (mode !== "length-dependent") return null;
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’]*/gu)?.length ?? 0;
  return Math.min(30000, 5000 + words * 10);
}

const MAX_WRITING_BLOCK_LENGTH = 20000;
const revisionCueState = new WeakMap<EditorViewLike, { cue: AssistantRevision; id: string }>();
function applyAssistantRevisionCue(view: EditorViewLike, id: string, cue: AssistantRevision): void { if (!view.isDestroyed) { revisionCueState.set(view, { id, cue }); view.dispatch?.(view.state.tr?.setMeta?.("writingBlockAssistantRevision", { id, cue }) ?? view.state.tr ?? {}); } }
function clearAssistantRevisionCue(view: EditorViewLike): void { if (!view.isDestroyed && revisionCueState.has(view)) { revisionCueState.delete(view); view.dispatch?.(view.state.tr?.setMeta?.("writingBlockAssistantRevision", "clear") ?? view.state.tr ?? {}); } }

function selectionLinkRange(selection: SelectionLike | null | undefined): { from: number; href: string; to: number } | null { return selection?.link?.href ? { ...selection.link } : null; }
function canShowFloatingEditorControls(view: EditorViewLike): boolean { return !view.isDestroyed && Boolean(view.hasFocus?.()) && view.state.selection.empty; }
function executeSlashMenuCommand({ commandId, query, view }: { commandId: SlashCommandId; query: string; view: EditorViewLike }, resetGeneratePrompt: () => void = () => {}): void {
  if (view.isDestroyed) return;
  if (commandId === "generate") resetGeneratePrompt();
  view.dispatch?.(view.state.tr?.setMeta?.("writingBlockSlashMenuCommand", { commandId, query }) ?? view.state.tr ?? {});
  view.focus?.();
}
function createWritingBlockEditor(options: Record<string, unknown>): EditorController {
  const supplied = options.createBaseEditor;
  if (typeof supplied !== "function") throw new TypeError("createBaseEditor is required");
  const controller = (supplied as (input: Record<string, unknown>) => EditorController)({ ...options, maxLength: options.collaboration == null ? MAX_WRITING_BLOCK_LENGTH : null, slashMenu: true, tables: true, taskLists: true });
  return controller;
}

function WritingBlockEditor(props: WritingBlockEditorProps, forwardedRef?: { current?: WritingBlockEditorHandle | null }): unknown {
  let markdown = props.markdown ?? ""; let controller: EditorController | null = null;
  if (props.createEditor != null) controller = props.createEditor({ editable: props.editable ?? true, markdown, onChange: ({ markdown: next }: { markdown: string }) => { markdown = next; props.onChange?.(next); }, placeholder: props.placeholder, proseMirrorStore: props.proseMirrorStore });
  if (forwardedRef != null) forwardedRef.current = { focus: () => controller?.view.focus?.(), getMarkdown: () => controller?.getMarkdown() ?? markdown, get view() { return controller?.view ?? null; } };
  return jsxRuntime.jsx("div", { "aria-label": props.ariaLabel, "aria-multiline": "true", className: [editorStyles.root, "writing-block-editor", props.className].filter(Boolean).join(" "), "data-editor-key": props.editorKey, "data-newline-selection-appearance": props.newlineSelectionAppearance ?? "default", "data-table-selection-appearance": props.tableSelectionAppearance ?? "default", role: "textbox" });
}
function SelectionFloatingActions(props: SelectionActionsProps): unknown {
  const selection = props.selection ?? props.editorView.state.selection;
  if (props.editorView.isDestroyed || selection == null || selection.from === selection.to) return null;
  return jsxRuntime.jsxs("div", { role: "toolbar", children: [jsxRuntime.jsx("button", { type: "button", onClick: () => props.onAskForChanges?.(props.editorView), children: "Ask for changes" }), props.editable === false ? null : jsxRuntime.jsx("button", { type: "button", onClick: () => props.onEditSelection?.("", { from: selection.from, to: selection.to }), children: "Edit" }), props.trailingActions] });
}
const slashLabels: Record<string, string> = { checklist: "Checklist", columnDelete: "Delete column", columnLeft: "Add column left", columnRight: "Add column right", divider: "Divider", generate: "Generate text", heading1: "Heading 1", heading2: "Heading 2", heading3: "Heading 3", orderedList: "Numbered list", paragraph: "Text", table: "Table", unorderedList: "Bulleted list" };
function FloatingSlashMenu({ editorView, state, onExecute }: SlashMenuProps): unknown {
  if (editorView.isDestroyed || state?.anchorPos == null || state.triggerPos == null) return null;
  return jsxRuntime.jsx("div", { "aria-label": "Insert options", role: "menu", children: state.visibleOptionIds.map(id => jsxRuntime.jsx("button", { "data-highlighted": id === state.highlightedOptionId ? "true" : undefined, role: "menuitem", type: "button", onClick: () => onExecute(id, state.query), children: slashLabels[id] ?? id }, id)) });
}

export {
  initializeEditorStyles as C,
  useEditorStore as D,
  initializeEditorStore as E,
  initializeWritingBlockEditor as S,
  createEditorStore as T,
  externalContentChangeStatus as _,
  canShowFloatingEditorControls as a,
  initializeFloatingActions as b,
  initializeEditorFeatures as c,
  applyAssistantRevisionCue as d,
  MAX_WRITING_BLOCK_LENGTH as f,
  flattenDocumentText as g,
  initializeRevisionRuntime as h,
  initializeFloatingSlashMenu as i,
  clearAssistantRevisionCue as l,
  streamingRevealDuration as m,
  initializeSlashMenuRuntime as n,
  createWritingBlockEditor as o,
  computeAssistantRevisionCue as p,
  SelectionFloatingActions as r,
  executeSlashMenuCommand as s,
  FloatingSlashMenu as t,
  initializeRevisionPlugin as u,
  initializeExternalContentPlugin as v,
  editorStyles as w,
  WritingBlockEditor as x,
  selectionLinkRange as y,
};
