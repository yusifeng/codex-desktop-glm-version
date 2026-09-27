import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface PreviewLayoutProps { assetName: string; bottomContent?: unknown; children?: unknown; contentOwnsHeader?: boolean; endContent?: unknown; headerVariant?: "default" | "document"; onClose(): void; titleEndContent?: unknown }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PreviewLayout(props: PreviewLayoutProps): unknown { const header = props.contentOwnsHeader ? null : jsx().jsxs("header", { "data-variant": props.headerVariant ?? "default", children: [jsx().jsx("button", { type: "button", "aria-label": "Close preview", onClick: props.onClose, children: "Close" }), jsx().jsx("span", { children: props.assetName }), props.titleEndContent, props.endContent] }); return jsx().jsxs("div", { className: "preview-layout", children: [header, jsx().jsx("main", { children: props.children }), props.bottomContent] }); }
function initialize(): void {}
export { initialize as n, PreviewLayout as t };
