import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as translationsChunk from "@rchunk/model-and-reasoning-effort-translations";

type UsageDimension = "model" | "reasoning_effort" | "speed";

export interface UsageGroup {
  amount?: number;
  amountMicros?: number;
  cachedInputTokens?: number | null;
  dimension: UsageDimension;
  netNewInputTokens?: number | null;
  outputTokens?: number | null;
  value?: string | null;
}

export interface ThreadUsage {
  balanceUnit?: "credits" | "usd";
  costUsd?: number | null;
  creditsUsed: number;
  groups?: readonly UsageGroup[];
}

interface NormalizedUsageGroup extends UsageGroup { amountMicros: number }

const shared = sharedChunk as unknown as Record<string, any>;
const initial = initialChunk as unknown as Record<string, any>;
const translations = translationsChunk as unknown as Record<string, any>;
const DIMENSIONS: readonly UsageDimension[] = ["model", "reasoning_effort", "speed"];
const FALLBACK_COLORS = ["#10a37f", "#6d5ce7", "#d97706", "#0284c7", "#db2777", "#65a30d"];
let React: any;
let jsx: any;
let initialized = false;

function call(value: unknown): void { if (typeof value === "function") value(); }
function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", options).format(value);
}
function formatUsd(value?: number | null, maximumFractionDigits?: number): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: maximumFractionDigits ?? (Math.abs(value) < 0.01 ? 6 : 2) }).format(value);
}
function modelLabel(value: string): string { return typeof initial.X5 === "function" ? initial.X5(value) : value; }

function usageDimensionLabel({ dimension, value }: { dimension: UsageDimension; value?: string | null }): unknown {
  if (value == null) return "Other";
  if (dimension === "model") return modelLabel(value);
  if (dimension === "speed") {
    if (value === "fast") return "Fast mode";
    if (value === "ultrafast") return "Ultrafast";
    if (value === "standard") return "Standard";
    return value;
  }
  if (typeof initial.N0t === "function" && initial.N0t(value) && typeof translations.t === "function") return jsx.jsx(translations.t, { effort: value });
  return value;
}

function normalizeGroups(usage: ThreadUsage, dimension: UsageDimension): NormalizedUsageGroup[] {
  if (typeof initial.gS === "function") {
    const aggregated = initial.gS(usage.groups ?? [], dimension, usage.balanceUnit);
    if (Array.isArray(aggregated)) return aggregated.filter((entry) => Number(entry?.amountMicros) > 0);
  }
  const combined = new Map<string | null, NormalizedUsageGroup>();
  for (const group of usage.groups ?? []) {
    if (group.dimension !== dimension) continue;
    const amountMicros = Number(group.amountMicros ?? group.amount ?? 0);
    if (!(amountMicros > 0)) continue;
    const key = group.value ?? null;
    const current = combined.get(key);
    if (current == null) combined.set(key, { ...group, value: key, amountMicros });
    else {
      current.amountMicros += amountMicros;
      for (const field of ["netNewInputTokens", "cachedInputTokens", "outputTokens"] as const) {
        if (group[field] != null) current[field] = (current[field] ?? 0) + group[field]!;
      }
    }
  }
  return [...combined.values()];
}

function dimensionTitle(dimension: UsageDimension): string { return dimension === "model" ? "Models" : dimension === "reasoning_effort" ? "Reasoning" : "Speed"; }
function percentageLabel(dimension: UsageDimension, value: string | null | undefined, percentage: number): string {
  const label = usageDimensionLabel({ dimension, value });
  return `${typeof label === "string" ? label : value ?? "Other"}: ${percentage}%`;
}

function TooltipContent({ dimension, entry, percentage }: { dimension: UsageDimension; entry: NormalizedUsageGroup; percentage: number }): unknown {
  const tokenRows = dimension === "model" ? [
    ["Uncached input tokens", entry.netNewInputTokens],
    ["Cached input tokens", entry.cachedInputTokens],
    ["Output tokens", entry.outputTokens],
  ] as const : [];
  return jsx.jsxs("div", { className: "flex flex-col gap-0.5 text-xs", children: [
    jsx.jsx("span", { className: "font-medium", children: percentageLabel(dimension, entry.value, percentage) }),
    ...tokenRows.filter(([, value]) => value != null).map(([label, value]) => jsx.jsx("span", { children: `${label}: ${formatNumber(value!)}` }, label)),
  ] });
}

function withTooltip(content: unknown, child: unknown, key?: string): unknown {
  const Tooltip = shared.o_;
  return typeof Tooltip === "function" ? jsx.jsx(Tooltip, { color: "inverse", delayDuration: 0, tooltipContent: content, children: child }, key) : jsx.jsx(jsx.Fragment, { children: child }, key);
}

function DimensionBreakdown({ dimension, usage }: { dimension: UsageDimension; usage: ThreadUsage }): unknown {
  const id = typeof React?.useId === "function" ? React.useId() : `usage-${dimension}`;
  const entries = normalizeGroups(usage, dimension);
  const total = entries.reduce((sum, entry) => sum + entry.amountMicros, 0);
  const visible = total > 0 ? entries : [];
  const colors: readonly string[] = Array.isArray(initial.wnt) && initial.wnt.length > 0 ? initial.wnt : FALLBACK_COLORS;
  const percentage = (amount: number): number => total > 0 ? Math.round(amount / total * 100) : 0;
  const legend = visible.map((entry, index) => {
    const share = percentage(entry.amountMicros);
    return withTooltip(jsx.jsx(TooltipContent, { dimension, entry, percentage: share }), jsx.jsxs("button", {
      className: "inline-flex cursor-interaction items-center gap-1.5 rounded-sm py-px focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
      "aria-label": `${percentageLabel(dimension, entry.value, share)} of usage`, type: "button", children: [
        jsx.jsx("span", { className: "size-2.5 shrink-0 rounded-full", style: { backgroundColor: colors[index % colors.length] } }),
        jsx.jsx("span", { children: usageDimensionLabel({ dimension, value: entry.value }) }),
      ],
    }), entry.value ?? "unknown");
  });
  const segments = visible.map((entry, index) => {
    const share = percentage(entry.amountMicros);
    return withTooltip(jsx.jsx(TooltipContent, { dimension, entry, percentage: share }), jsx.jsx("button", {
      className: "h-full min-w-1 basis-0 cursor-interaction", "aria-hidden": true,
      style: { backgroundColor: colors[index % colors.length], flexGrow: entry.amountMicros }, tabIndex: -1, type: "button",
    }), entry.value ?? "unknown");
  });
  return jsx.jsxs("div", { className: "flex flex-col gap-1.5", "aria-labelledby": id, role: "group", "data-dimension": dimension, children: [
    jsx.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      jsx.jsx("span", { id, className: "text-secondary", children: dimensionTitle(dimension) }),
      visible.length === 0 ? jsx.jsx("span", { className: "text-tertiary", children: "Not available" }) : null,
    ] }),
    jsx.jsx("div", { className: "flex h-2 overflow-hidden rounded-full bg-text/10", children: segments }),
    jsx.jsx("div", { className: "flex flex-wrap gap-x-4 gap-y-1.5 text-secondary", children: legend }),
  ] });
}

function totalLabel(usage: ThreadUsage, showCostUsd: boolean): string {
  if (usage.balanceUnit === "usd") return formatUsd(usage.costUsd);
  const credits = `${formatNumber(usage.creditsUsed, { notation: "compact", maximumFractionDigits: 1 })} credits`;
  return !showCostUsd || usage.costUsd == null ? credits : `${credits} · ${formatUsd(usage.costUsd, usage.costUsd < 0.01 ? 4 : 2)}`;
}

function ThreadUsageBreakdown({ usage, title, showCostUsd = true }: { usage: ThreadUsage; title?: unknown; showCostUsd?: boolean }): unknown {
  initializeThreadUsageBreakdown();
  return jsx.jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-3 px-3 py-2 text-xs leading-4 select-none", children: [
    jsx.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      jsx.jsx("span", { className: "min-w-0 truncate font-semibold text-default", children: title ?? "Usage in this chat" }),
      jsx.jsx("span", { className: "shrink-0 text-secondary tabular-nums", children: totalLabel(usage, showCostUsd) }),
    ] }),
    ...DIMENSIONS.map((dimension) => jsx.jsx(DimensionBreakdown, { dimension, usage }, dimension)),
  ] });
}

function initializeThreadUsageBreakdown(): void {
  if (initialized) return;
  initialized = true;
  for (const candidate of [shared.$3, initial.M0t, shared.K2, translations.n, shared.c_, initial.Ent, initial._S]) call(candidate);
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = shared.I3();
}
initializeThreadUsageBreakdown();

export { ThreadUsageBreakdown as n, initializeThreadUsageBreakdown as r, usageDimensionLabel as t };
