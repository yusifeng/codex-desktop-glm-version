import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/model-and-reasoning-effort-translations";

export interface UsageGroup { amount: number; dimension: "model" | "reasoning_effort" | "speed"; value?: string | null }
export interface ThreadUsage { balanceUnit?: "credits" | "usd"; costUsd?: number | null; creditsUsed: number; groups?: UsageGroup[] }
let jsx: JsxRuntime;
function ThreadUsageBreakdown({ usage, title, showCostUsd = true }: { usage: ThreadUsage; title?: unknown; showCostUsd?: boolean }): unknown { const runtime = ensureJsx(); const total = usage.balanceUnit === "usd" ? formatUsd(usage.costUsd) : showCostUsd && usage.costUsd != null ? `${formatNumber(usage.creditsUsed)} credits · ${formatUsd(usage.costUsd)}` : `${formatNumber(usage.creditsUsed)} credits`; return runtime.jsxs("section", { className: "thread-usage-breakdown", children: [runtime.jsxs("header", { children: [runtime.jsx("strong", { children: title ?? "Usage in this chat" }), runtime.jsx("span", { children: total })] }), ["model", "reasoning_effort", "speed"].map((dimension) => runtime.jsx("div", { "data-dimension": dimension, children: (usage.groups ?? []).filter((group) => group.dimension === dimension).map((group) => runtime.jsxs("span", { children: [usageDimensionLabel({ dimension: group.dimension, value: group.value }), ` ${group.amount}`] }, `${dimension}:${group.value}`)) }, dimension))] }); }
function usageDimensionLabel({ dimension, value }: { dimension: UsageGroup["dimension"]; value?: string | null }): string { if (value == null) return "Other"; if (dimension === "speed") return value === "fast" ? "Fast mode" : value === "ultrafast" ? "Ultrafast" : value === "standard" ? "Standard" : value; return value; }
const formatUsd = (value?: number | null): string => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(value) < 0.01 ? 6 : 2 }).format(value);
const formatNumber = (value: number): string => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { ThreadUsageBreakdown as n, initialize as r, usageDimensionLabel as t };
