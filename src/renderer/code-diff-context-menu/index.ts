import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pdf-preview-diff";
import "@rchunk/surface";
import "@rchunk/binary-preview-source";

interface ContextMenuItem { enabled?: boolean; id: string; label: string; onSelect?(): Promise<void> | void }
interface ContextMenuProps { children?: unknown; disableNative?: boolean; getItems?(): ContextMenuItem[] | Promise<ContextMenuItem[]>; getPriorityItems?(): ContextMenuItem[] | null | undefined; selection?: string; onCopy?(value: string): Promise<void> | void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const r = { key: "preferred-open-target" } as const;
function a(input: { path?: string; lineEnd?: number; lineStart?: number; side?: string }) { return { path: input.path ?? null, lineEnd: input.lineEnd ?? input.lineStart ?? null, lineStart: input.lineStart ?? null, side: input.side ?? "unified" }; }
async function writeClipboard(value: string): Promise<void> { await globalThis.navigator?.clipboard?.writeText(value); }
async function c(value: unknown): Promise<void> { await writeClipboard(String(value ?? "")); }
async function i(input: { path?: string; target?: string }): Promise<{ path: string | null; target: string }> { return { path: input.path ?? null, target: input.target ?? "editor" }; }
async function s(input: { selection?: string; onCopy?(value: string): Promise<void> | void }): Promise<void> { const value = input.selection ?? ""; if (input.onCopy != null) await input.onCopy(value); else await writeClipboard(value); }
function menu({ children = null, disableNative = false, getItems, getPriorityItems, selection = "", onCopy }: ContextMenuProps): unknown { const open = async (event: { preventDefault(): void }) => { if (disableNative) event.preventDefault(); const priority = getPriorityItems?.(); const items = priority != null && priority.length > 0 ? priority : await getItems?.() ?? []; return items.map(item => item.id === "copy-selection" ? { ...item, enabled: selection !== "", onSelect: () => s({ selection, onCopy }) } : item); }; return jsx().jsx("div", { onContextMenu: open, children }); }
const d = menu;
const l = menu;
const p = menu;
const t = menu;
function f(): void {}
function m(): void {}
function n(): void {}
function o(): void {}
function u(): void {}
export { a, c, d, f, i, l, m, n, o, p, r, s, t, u };
