import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/file-preview-version-history";
interface LazyVersionHistoryProps { children?: unknown; loader?: () => Promise<unknown>; variant?: "chatgpt" | "library" }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function component(variant: "chatgpt" | "library") { return (props: LazyVersionHistoryProps): unknown => jsx().jsx("div", { "data-version-history": variant, onLoad: props.loader, children: props.children ?? "Loading version history…" }); }
const t = component("chatgpt");
const n = component("library");
function r(): void {}
export { n, r, t };
