import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
export interface WritingBlockCopyButtonProps { className?: string; isDisabled?: boolean; onCopy?(): boolean | Promise<boolean> | void }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function WritingBlockCopyButton(props: WritingBlockCopyButtonProps): unknown { return jsx().jsx("button", { "aria-label": "Copy", className: props.className, disabled: props.isDisabled, onClick: async () => { if (!props.isDisabled) await props.onCopy?.(); }, type: "button", children: jsx().jsx("span", { "aria-hidden": true, children: "Copy" }) }); }
function initializeWritingBlockCopyButton(): void { void jsx(); }
export { initializeWritingBlockCopyButton as n, WritingBlockCopyButton as t };
