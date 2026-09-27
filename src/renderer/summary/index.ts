import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
export interface WritingBlockEditResult { summary?: string | null }
export interface WritingBlockSummaryProps { onView?(): void; result?: WritingBlockEditResult | null; title?: string | null }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function WritingBlockSummary({ onView, result, title }: WritingBlockSummaryProps): unknown { const label = result == null ? `Created ${title ?? "Document"}` : (result.summary ?? "Edited"); return jsx().jsxs("div", { "data-writing-block-summary": true, children: [jsx().jsx("span", { children: label }), onView ? jsx().jsxs("span", { children: [jsx().jsx("span", { "aria-hidden": true, children: "•" }), jsx().jsx("button", { onClick: onView, type: "button", children: "View" })] }) : null] }); }
function initializeWritingBlockSummary(): void { void jsx(); }
export { initializeWritingBlockSummary as n, WritingBlockSummary as t };
