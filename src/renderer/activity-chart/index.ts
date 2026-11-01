// Activity-chart runtime reconstructed from the published analytics surface.
// The release chunk embedded a partial Recharts build together with the actual
// product chart.  This owner keeps the product contract local and renders the
// small chart vocabulary directly, avoiding a second charting runtime.

import "@rchunk/rolldown-runtime";
// Preserve release dependency edges used by the chunk loader/cache. The
// implementations are compiled from reviewed TypeScript preserved sources.
import "@exact-chunk/linear-51abf1a86c3b.js";
import "@exact-chunk/line-5171f1d885cc.js";
import "@exact-chunk/area-76377dfd01aa.js";
import "@exact-chunk/step-cc59eba019a7.js";
import "@exact-chunk/monotone-68fb4f84bd88.js";
import "@rchunk/app-initial";
import "@exact-chunk/BarChart-2010e7d67e4a.js";
import "@exact-chunk/queries-a53713419c4d.js";
import "@rchunk/animated-segmented-toggle";
import "@rchunk/usd";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";

export type ActivityChartUnit =
  | "calls"
  | "credits"
  | "issues"
  | "lines"
  | "percent"
  | "reactions"
  | "reviews"
  | "tokens"
  | "turns"
  | "usd"
  | "uses";

export interface ActivitySeries {
  color?: string;
  key: string;
  name?: string;
  total?: number;
  tooltip?: unknown;
}

export interface ActivityPoint {
  date: string;
  total?: number;
  values?: Record<string, number | null | undefined>;
  [key: string]: unknown;
}

export interface ActivityChartData {
  data: ActivityPoint[];
  dataFreshnessTimestamp?: string | null;
  series: ActivitySeries[];
  total?: number;
}

export interface ActivityChartStatus {
  animateDataChanges?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isUpdating?: boolean;
  onAnimationEnd?(): void;
  onRetry?(): void;
  preserveEmptyLayout?: boolean;
  reduceMotion?: boolean;
}

export interface ActivityChartProps {
  actions?: unknown;
  ariaLabel?: string;
  breakdown?: string;
  chartKey?: string;
  consumerAnalytics?: boolean;
  data?: ActivityChartData | null;
  emptyMessage?: unknown;
  hideTotal?: boolean;
  preservePopulatedCardLayout?: boolean;
  scope?: "business" | "consumer" | "workspace";
  status?: ActivityChartStatus;
  title?: unknown;
  totalLabel?: unknown;
  unit?: ActivityChartUnit;
  visualization?: "area" | "bar" | "stacked-bar";
}

const COLORS = [
  "var(--color-chart-red, #ef4444)",
  "var(--color-chart-yellow, #eab308)",
  "var(--color-chart-blue, #3b82f6)",
  "var(--color-chart-purple, #8b5cf6)",
  "var(--color-text-tertiary, #71717a)",
] as const;
const WIDTH = 720;
const HEIGHT = 224;
const PADDING = { top: 18, right: 16, bottom: 34, left: 42 } as const;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeActivityChart(): void {
  if (initialized) return;
  initialized = true;
  React = typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = getJsxRuntime();
}

function initializeDateRangeControl(): void {
  initializeActivityChart();
}

function numericValue(point: ActivityPoint, key: string): number {
  const fromValues = point.values?.[key];
  const raw = fromValues ?? point[key];
  return typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, raw) : 0;
}

function chartTotal(data: ActivityChartData | null | undefined): number {
  if (typeof data?.total === "number" && Number.isFinite(data.total)) return data.total;
  return (data?.series ?? []).reduce((sum, series) => {
    if (typeof series.total === "number" && Number.isFinite(series.total)) return sum + series.total;
    return sum;
  }, 0);
}

function hasActivity(data: ActivityChartData | null | undefined): boolean {
  if (chartTotal(data) > 0) return true;
  return Boolean(data?.data.some((point) => data.series.some((series) => numericValue(point, series.key) > 0)));
}

function formatValue(value: number, unit: ActivityChartUnit = "turns"): string {
  if (unit === "usd")
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: value < 0.01 ? 6 : 2 }).format(value);
  if (unit === "percent")
    return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(value > 1 ? value / 100 : value);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: unit === "credits" ? 2 : 0 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(`${value}${value.includes("T") ? "" : "T00:00:00Z"}`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function seriesColor(series: ActivitySeries, index: number): string {
  return series.color ?? COLORS[index % COLORS.length];
}

function visibleMaximum(data: ActivityChartData, hidden: ReadonlySet<string>, stacked: boolean): number {
  let maximum = 0;
  for (const point of data.data) {
    if (stacked) {
      const total = data.series.reduce((sum, series) => hidden.has(series.key) ? sum : sum + numericValue(point, series.key), 0);
      maximum = Math.max(maximum, total);
    } else {
      for (const series of data.series) if (!hidden.has(series.key)) maximum = Math.max(maximum, numericValue(point, series.key));
    }
  }
  return maximum || 1;
}

function pointX(index: number, length: number): number {
  const usable = WIDTH - PADDING.left - PADDING.right;
  return PADDING.left + (length <= 1 ? usable / 2 : (index / (length - 1)) * usable);
}

function pointY(value: number, maximum: number): number {
  const usable = HEIGHT - PADDING.top - PADDING.bottom;
  return PADDING.top + usable - (value / maximum) * usable;
}

function linePath(points: ActivityPoint[], key: string, maximum: number): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${pointX(index, points.length)} ${pointY(numericValue(point, key), maximum)}`).join(" ");
}

function areaPath(points: ActivityPoint[], key: string, maximum: number): string {
  if (points.length === 0) return "";
  const baseline = HEIGHT - PADDING.bottom;
  return `${linePath(points, key, maximum)} L${pointX(points.length - 1, points.length)} ${baseline} L${pointX(0, points.length)} ${baseline} Z`;
}

function DateRangeControl({ ariaLabel = "Usage time range", days, onChange }: { ariaLabel?: string; days: number; onChange(days: number): void }): unknown {
  initializeActivityChart();
  return jsx.jsx("div", {
    "aria-label": ariaLabel,
    className: "inline-flex rounded-lg bg-secondary p-0.5",
    role: "group",
    children: [7, 30].map((value) => jsx.jsx("button", {
      "aria-pressed": days === value,
      className: days === value ? "rounded-md bg-primary px-2 py-1 text-sm shadow-sm" : "rounded-md px-2 py-1 text-sm text-secondary",
      onClick: () => onChange(value),
      type: "button",
      children: `${value}d`,
    }, value)),
  });
}

function ChartLegend({ hidden, onToggle, series }: { hidden: ReadonlySet<string>; onToggle(key: string): void; series: ActivitySeries[] }): unknown {
  return jsx.jsx("div", {
    className: "flex flex-wrap gap-x-4 gap-y-2",
    children: series.map((item, index) => jsx.jsxs("button", {
      "aria-pressed": !hidden.has(item.key),
      className: hidden.has(item.key) ? "flex items-center gap-1.5 text-sm text-tertiary opacity-50" : "flex items-center gap-1.5 text-sm text-secondary",
      onClick: () => onToggle(item.key),
      title: hidden.size === series.length - 1 && !hidden.has(item.key) ? "Show all series" : `Show only ${item.name ?? item.key}`,
      type: "button",
      children: [
        jsx.jsx("span", { "aria-hidden": true, className: "size-2 rounded-full", style: { backgroundColor: seriesColor(item, index) } }),
        item.name ?? item.key,
      ],
    }, item.key)),
  });
}

function ChartTooltip({ data, index, unit }: { data: ActivityChartData; index: number; unit: ActivityChartUnit }): unknown {
  const point = data.data[index];
  if (!point) return null;
  return jsx.jsxs("div", {
    className: "pointer-events-none absolute z-10 min-w-40 rounded-lg border border-primary bg-primary p-2 text-sm shadow-lg",
    role: "status",
    style: { left: `${Math.min(82, Math.max(4, (index / Math.max(1, data.data.length - 1)) * 90))}%`, top: 8 },
    children: [
      jsx.jsx("div", { className: "mb-1 font-medium", children: formatDate(point.date) }),
      data.series.map((series, seriesIndex) => jsx.jsxs("div", { className: "flex justify-between gap-4", children: [
        jsx.jsxs("span", { children: [jsx.jsx("span", { "aria-hidden": true, className: "mr-1 inline-block size-2 rounded-full", style: { backgroundColor: seriesColor(series, seriesIndex) } }), series.name ?? series.key] }),
        jsx.jsx("span", { className: "tabular-nums", children: formatValue(numericValue(point, series.key), unit) }),
      ] }, series.key)),
    ],
  });
}

function SvgChart({ data, hidden, onActive, unit, visualization }: { data: ActivityChartData; hidden: ReadonlySet<string>; onActive(index: number | null): void; unit: ActivityChartUnit; visualization: NonNullable<ActivityChartProps["visualization"]> }): unknown {
  const stacked = visualization === "stacked-bar";
  const maximum = visibleMaximum(data, hidden, stacked);
  const usableWidth = WIDTH - PADDING.left - PADDING.right;
  const barGroupWidth = Math.max(4, usableWidth / Math.max(1, data.data.length));
  const visibleSeries = data.series.filter((series) => !hidden.has(series.key));
  const marks: unknown[] = [];
  if (visualization === "area") {
    visibleSeries.forEach((series) => {
      const index = data.series.indexOf(series);
      marks.push(jsx.jsx("path", { d: areaPath(data.data, series.key, maximum), fill: seriesColor(series, index), fillOpacity: 0.12, stroke: "none" }, `${series.key}-area`));
      marks.push(jsx.jsx("path", { d: linePath(data.data, series.key, maximum), fill: "none", stroke: seriesColor(series, index), strokeWidth: 2 }, `${series.key}-line`));
    });
  } else {
    data.data.forEach((point, pointIndex) => {
      let stackedValue = 0;
      visibleSeries.forEach((series, visibleIndex) => {
        const value = numericValue(point, series.key);
        const seriesIndex = data.series.indexOf(series);
        const width = stacked ? Math.min(22, barGroupWidth * 0.58) : Math.max(2, Math.min(16, barGroupWidth * 0.72 / Math.max(1, visibleSeries.length)));
        const x = pointX(pointIndex, data.data.length) - (stacked ? width / 2 : (width * visibleSeries.length) / 2 - visibleIndex * width);
        const topValue = stackedValue + value;
        const y = pointY(topValue, maximum);
        const base = pointY(stackedValue, maximum);
        marks.push(jsx.jsx("rect", { fill: seriesColor(series, seriesIndex), height: Math.max(0, base - y), rx: 2, width, x, y }, `${point.date}-${series.key}`));
        if (stacked) stackedValue = topValue;
      });
    });
  }
  return jsx.jsxs("svg", {
    "aria-label": "Usage over time",
    className: "h-56 w-full overflow-visible",
    onMouseLeave: () => onActive(null),
    preserveAspectRatio: "none",
    role: "img",
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    children: [
      [0, 0.5, 1].map((ratio) => jsx.jsxs("g", { children: [
        jsx.jsx("line", { stroke: "var(--border-light, #d4d4d8)", strokeDasharray: "3 4", x1: PADDING.left, x2: WIDTH - PADDING.right, y1: pointY(maximum * ratio, maximum), y2: pointY(maximum * ratio, maximum) }),
        jsx.jsx("text", { fill: "currentColor", fontSize: 11, textAnchor: "end", x: PADDING.left - 7, y: pointY(maximum * ratio, maximum) + 4, children: formatValue(maximum * ratio, unit) }),
      ] }, ratio)),
      marks,
      data.data.map((point, index) => jsx.jsxs("g", {
        onFocus: () => onActive(index), onMouseEnter: () => onActive(index), tabIndex: 0,
        children: [
          jsx.jsx("rect", { fill: "transparent", height: HEIGHT - PADDING.top - PADDING.bottom, width: Math.max(12, usableWidth / Math.max(1, data.data.length)), x: pointX(index, data.data.length) - Math.max(6, usableWidth / Math.max(2, data.data.length * 2)), y: PADDING.top }),
          (index === 0 || index === data.data.length - 1 || index === Math.floor(data.data.length / 2)) ? jsx.jsx("text", { fill: "currentColor", fontSize: 11, textAnchor: index === 0 ? "start" : index === data.data.length - 1 ? "end" : "middle", x: pointX(index, data.data.length), y: HEIGHT - 10, children: formatDate(point.date) }) : null,
        ],
      }, point.date)),
    ],
  });
}

function ActivityChart(props: ActivityChartProps): unknown {
  initializeActivityChart();
  const {
    actions, ariaLabel = typeof props.title === "string" ? props.title : "Usage chart", data,
    emptyMessage = "No usage recorded during this period", hideTotal = false,
    status = {}, title, totalLabel, unit = "turns", visualization = "area",
  } = props;
  const [hiddenKeys, setHiddenKeys] = React.useState<Set<string>>(() => new Set());
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const toggle = (key: string) => setHiddenKeys((current) => {
    if (!data) return current;
    if (!current.has(key) && current.size === data.series.length - 1) return new Set();
    if (!current.has(key)) return new Set(data.series.filter((series) => series.key !== key).map((series) => series.key));
    const next = new Set(current); next.delete(key); return next;
  });
  let body: unknown;
  if (status.isLoading && data == null) body = jsx.jsx("div", { className: "flex h-56 items-center justify-center text-secondary", role: "status", children: "Loading usage…" });
  else if (status.isError && data == null) body = jsx.jsxs("div", { className: "flex h-56 flex-col items-center justify-center gap-2", role: "alert", children: ["Could not load usage", status.onRetry ? jsx.jsx("button", { className: "rounded-md border px-2 py-1", onClick: status.onRetry, type: "button", children: "Retry" }) : null] });
  else if (data == null || !hasActivity(data)) body = jsx.jsx("div", { className: "flex h-56 items-center justify-center text-secondary", children: emptyMessage });
  else body = jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx("div", { className: "relative", children: [jsx.jsx(SvgChart, { data, hidden: hiddenKeys, onActive: setActiveIndex, unit, visualization }), activeIndex == null ? null : jsx.jsx(ChartTooltip, { data, index: activeIndex, unit })] }),
    jsx.jsx(ChartLegend, { hidden: hiddenKeys, onToggle: toggle, series: data.series }),
  ] });
  return jsx.jsxs("section", {
    "aria-busy": status.isLoading || status.isUpdating,
    "aria-label": ariaLabel,
    className: "rounded-xl border border-primary bg-primary p-4",
    children: [
      jsx.jsxs("header", { className: "mb-3 flex items-start justify-between gap-3", children: [
        jsx.jsxs("div", { children: [jsx.jsx("h3", { className: "font-medium", children: title }), hideTotal ? null : jsx.jsx("div", { className: "mt-1 text-2xl font-semibold tabular-nums", children: totalLabel ?? formatValue(chartTotal(data), unit) })] }),
        actions,
      ] }),
      body,
    ],
  });
}

// Published short-export ABI.  Descriptive aliases above are the maintained
// API; the aliases below keep untouched release consumers link-compatible.
export {
  areaPath as A,
  ChartLegend as B,
  chartTotal as C,
  formatDate as D,
  visibleMaximum as E,
  formatValue as F,
  DateRangeControl as H,
  ActivityChart as I,
  linePath as L,
  numericValue as M,
  pointX as N,
  pointY as O,
  seriesColor as P,
  ChartTooltip as R,
  SvgChart as S,
  COLORS as T,
  initializeDateRangeControl as U,
  hasActivity as V,
  ActivityChart as _,
  DateRangeControl as a,
  formatValue as b,
  formatDate as c,
  chartTotal as d,
  visibleMaximum as f,
  numericValue as g,
  seriesColor as h,
  linePath as i,
  areaPath as j,
  pointX as k,
  pointY as l,
  ChartLegend as m,
  initializeActivityChart as n,
  ChartTooltip as o,
  SvgChart as p,
  hasActivity as r,
  COLORS as s,
  ActivityChart as t,
  DateRangeControl as u,
  chartTotal as v,
  numericValue as w,
  formatValue as x,
  formatDate as y,
  visibleMaximum as z,
};

initializeActivityChart();
