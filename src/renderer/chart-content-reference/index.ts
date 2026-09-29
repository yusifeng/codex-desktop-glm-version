import "@rchunk/rolldown-runtime";
import {
  $3 as initializeLazyRuntime,
  H3 as initializeLazyComponents,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  Qh as LoadingSpinner,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { a as initializeBarSizing, n as getVerticalBarChartStyle } from "@rchunk/bar-sizing";

type ChartType = "bar" | "line" | "pie" | "scatter";
type ChartView = "chart" | "table";
type ValueFormat = "compact" | "integer" | "raw";

interface ChartSeries {
  dataKey: string;
  label: string;
  stack?: string;
  valueFormat: ValueFormat;
  valuePrefix: string;
  valueSuffix: string;
}

interface ChartMeta {
  description?: string;
  footer?: string;
  title?: string;
}

interface ChartSpec {
  axes?: unknown;
  chartType: ChartType;
  data: Array<Record<string, unknown>>;
  layout?: "horizontal" | "vertical";
  meta?: ChartMeta;
  nameKey: string;
  series: ChartSeries[];
  valueKey: string;
  xAxisScale?: "linear";
  xKey: string;
}

interface ChartTable {
  columns: string[];
  rows: unknown[][];
}

interface ContentReference {
  data: { content: unknown };
  matched_text?: string;
}

export interface ChatGptChartContentReferenceProps {
  contentReferenceIndex: number;
  initialView?: ChartView;
  isStreaming?: boolean;
  reference: unknown;
  widgetRefSeenAtMs?: number;
}

interface ChartWidgetProps extends Record<string, unknown> {
  ariaLabel: string;
  chart: ChartSpec;
  onReady(): void;
  theme?: "dark" | "light";
}

interface DomToBlobOptions {
  backgroundColor?: string;
  filter?(element: Element): boolean;
  scale?: number;
}

type ChartWidgetComponent = (props: ChartWidgetProps) => unknown;

const SUPPORTED_CHART_TYPES = new Set<ChartType>(["bar", "line", "pie", "scatter"]);
const FORMULA_PREFIX = /^[=+\-@]/;
const EXCLUDED_DOWNLOAD_CONTENT = "[data-chart-widget-download-exclude], .recharts-tooltip-wrapper, .recharts-tooltip-cursor, .recharts-active-dot";

let jsx: JsxRuntime;
let React: ReactRuntime;

const LazyChartWidget = createLazyComponent<ChartWidgetProps>(
  async () => {
    const chartModule = await import("@rchunk/chart");
    const { ChartWidget } = chartModule;
    return ChartWidget as unknown as ChartWidgetComponent;
  },
  { propagateLoadError: true },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function parseReference(reference: unknown): ContentReference | null {
  if (!isRecord(reference) || !isRecord(reference.data) || !("content" in reference.data)) return null;
  return {
    data: { content: reference.data.content },
    matched_text: typeof reference.matched_text === "string" ? reference.matched_text : undefined,
  };
}

function nonEmptyString(value: unknown, fallback?: string): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function firstStringKey(data: Array<Record<string, unknown>>): string {
  const first = data[0];
  if (first == null) return "name";
  for (const [key, value] of Object.entries(first)) if (typeof value === "string") return key;
  return Object.keys(first)[0] ?? "name";
}

function firstValueKey(data: Array<Record<string, unknown>>, xKey: string): string {
  const first = data[0];
  if (first == null) return "value";
  for (const [key, value] of Object.entries(first)) if (key !== xKey && typeof value === "number") return key;
  return Object.keys(first).find((key) => key !== xKey) ?? "value";
}

function normalizeSeries(value: unknown, valueKey: string, root: Record<string, unknown>): ChartSeries[] {
  const defaultFormat = root.valueFormat === "integer" || root.valueFormat === "raw" ? root.valueFormat : "compact";
  const defaultPrefix = nonEmptyString(root.valuePrefix, "") ?? "";
  const defaultSuffix = nonEmptyString(root.valueSuffix, "") ?? "";
  const series: ChartSeries[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isRecord(item)) continue;
      const dataKey = nonEmptyString(item.dataKey);
      if (dataKey == null) continue;
      const valueFormat = item.valueFormat === "integer" || item.valueFormat === "raw" ? item.valueFormat : defaultFormat;
      series.push({
        dataKey,
        label: nonEmptyString(item.label, dataKey) ?? dataKey,
        stack: nonEmptyString(item.stack),
        valueFormat,
        valuePrefix: nonEmptyString(item.valuePrefix, defaultPrefix) ?? defaultPrefix,
        valueSuffix: nonEmptyString(item.valueSuffix, defaultSuffix) ?? defaultSuffix,
      });
    }
  }
  return series.length > 0 ? series : [{ dataKey: valueKey, label: valueKey, valueFormat: defaultFormat, valuePrefix: defaultPrefix, valueSuffix: defaultSuffix }];
}

function parseChartSpec(content: unknown): ChartSpec | null {
  let decoded = content;
  if (typeof content === "string") {
    try {
      decoded = JSON.parse(content);
    } catch {
      return null;
    }
  }
  if (!isRecord(decoded) || !SUPPORTED_CHART_TYPES.has(decoded.chartType as ChartType) || !Array.isArray(decoded.data)) return null;
  const data = decoded.data.filter(isRecord);
  if (data.length !== decoded.data.length) return null;
  const xKey = nonEmptyString(decoded.xKey, firstStringKey(data)) ?? "name";
  const valueKey = nonEmptyString(decoded.valueKey, firstValueKey(data, xKey)) ?? "value";
  const meta = isRecord(decoded.meta) ? {
    title: nonEmptyString(decoded.meta.title),
    description: nonEmptyString(decoded.meta.description),
    footer: nonEmptyString(decoded.meta.footer),
  } : undefined;
  const spec: ChartSpec = {
    chartType: decoded.chartType as ChartType,
    data,
    nameKey: nonEmptyString(decoded.nameKey, xKey) ?? xKey,
    series: normalizeSeries(decoded.series, valueKey, decoded),
    valueKey,
    xKey,
  };
  if (decoded.axes != null) spec.axes = decoded.axes;
  if (decoded.layout === "vertical") spec.layout = "vertical";
  if (meta != null) spec.meta = meta;
  if (spec.chartType === "line" && decoded.xAxisScale === "linear") spec.xAxisScale = "linear";
  return spec;
}

function formatValue(value: number, series: ChartSeries): string {
  let formatted: string;
  if (series.valueFormat === "raw") formatted = String(value);
  else if (series.valueFormat === "integer") formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
  else formatted = new Intl.NumberFormat(undefined, { compactDisplay: "short", maximumFractionDigits: 1, notation: "compact" }).format(value);
  return series.valuePrefix + formatted + series.valueSuffix;
}

function readableValue(value: unknown): string | null {
  if (typeof value === "string") return value.trim().length > 0 ? value.trim() : null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function accessibleRows(chart: ChartSpec): string[] {
  if (chart.chartType === "pie") {
    const series = chart.series[0];
    if (series == null) return [];
    return chart.data.flatMap((row) => {
      const value = row[chart.valueKey];
      const name = readableValue(row[chart.nameKey]);
      return typeof value === "number" && Number.isFinite(value) && name != null ? [name + ": " + formatValue(value, series)] : [];
    });
  }
  return chart.data.flatMap((row) => {
    const xValue = readableValue(row[chart.xKey]);
    if (xValue == null) return [];
    const values = chart.series.flatMap((series) => {
      const value = row[series.dataKey];
      return typeof value === "number" && Number.isFinite(value) ? [series.label + " " + formatValue(value, series)] : [];
    });
    return values.length > 0 ? [xValue + ": " + values.join(", ")] : [];
  });
}

function chartTable(chart: ChartSpec): ChartTable | null {
  if (chart.data.length === 0) return null;
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of chart.data) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns.length === 0 ? null : { columns, rows: chart.data.map((row) => columns.map((column) => row[column] ?? null)) };
}

function humanizeColumn(value: string): string {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_./-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.length === 0 || part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function safeSpreadsheetCell(value: unknown): string {
  const text = (value == null ? "" : String(value)).replace(/[\t\r\n]+/g, " ").trim();
  return typeof value === "string" && FORMULA_PREFIX.test(text) ? "'" + text : text;
}

function tableAsTsv(table: ChartTable): string {
  return [table.columns.map(humanizeColumn), ...table.rows].map((row) => row.map(safeSpreadsheetCell).join("\t")).join("\n");
}

function chartFileName(chart: ChartSpec): string {
  const base = chart.meta?.title?.trim() || "chart-" + chart.chartType;
  const safe = base.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").replace(/^\.+/, "").slice(0, 80).trim();
  return (safe || "visualization") + ".png";
}

async function downloadChart(element: HTMLElement, chart: ChartSpec): Promise<void> {
  const { domToBlob } = await import("@rchunk/dom-to-blob") as { domToBlob(node: HTMLElement, options: DomToBlobOptions): Promise<Blob> };
  await document.fonts.ready;
  const previous = element.getAttribute("data-chart-widget-downloading");
  element.setAttribute("data-chart-widget-downloading", "true");
  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const blob = await domToBlob(element, {
      backgroundColor: "var(--background)",
      scale: Math.min(window.devicePixelRatio || 1, 2),
      filter: (candidate) => candidate.closest(EXCLUDED_DOWNLOAD_CONTENT) == null,
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = chartFileName(chart);
    link.click();
    URL.revokeObjectURL(href);
  } finally {
    if (previous == null) element.removeAttribute("data-chart-widget-downloading");
    else element.setAttribute("data-chart-widget-downloading", previous);
  }
}

function AccessibleChartSummary({ chart }: { chart: ChartSpec }): unknown {
  const rows = accessibleRows(chart);
  return rows.length === 0 ? null : jsx.jsx("ul", { className: "sr-only", children: rows.map((row) => jsx.jsx("li", { children: row }, row)) });
}

function ChartDataTable({ table }: { table: ChartTable }): unknown {
  return jsx.jsx("div", { className: "h-full overflow-auto pt-4", children: jsx.jsxs("table", { children: [
    jsx.jsx("caption", { className: "sr-only", children: "Chart data table" }),
    jsx.jsx("thead", { children: jsx.jsx("tr", { children: table.columns.map((column) => jsx.jsx("th", { scope: "col", children: humanizeColumn(column) }, column)) }) }),
    jsx.jsx("tbody", { children: table.rows.map((row, rowIndex) => jsx.jsx("tr", { children: row.map((value, columnIndex) => jsx.jsx("td", { children: value == null ? "" : String(value) }, table.columns[columnIndex])) }, rowIndex)) }),
  ] }) });
}

function ChartContent({ chart, initialView }: { chart: ChartSpec; initialView: ChartView }): unknown {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [view, setView] = React.useState<ChartView>(initialView);
  const [ready, setReady] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const table = chartTable(chart);
  const currentView = table == null ? "chart" : view;
  const title = chart.meta?.title;
  const fallbackTitle = title ?? "Chart";
  const ariaLabel = fallbackTitle + " chart";
  const style = getVerticalBarChartStyle(chart) as Record<string, string> | undefined;
  const copyTable = (): void => {
    if (table != null) void navigator.clipboard?.writeText(tableAsTsv(table));
  };
  const download = (): void => {
    const element = rootRef.current;
    if (element == null || currentView !== "chart" || downloading) return;
    setDownloading(true);
    void downloadChart(element, chart).finally(() => setDownloading(false));
  };
  return jsx.jsxs("div", {
    ref: (element: HTMLElement | null) => { rootRef.current = element; },
    className: "group/app-widget relative my-3 h-[27rem] w-full overflow-visible text-default",
    "data-testid": "chatgpt-chart-content-reference",
    style,
    children: [
      jsx.jsxs("section", { "aria-label": title == null ? ariaLabel : undefined, "aria-labelledby": title == null ? undefined : "chart-title", className: "flex h-full w-full flex-col", children: [
        title == null && chart.meta?.description == null ? null : jsx.jsxs("header", { className: "min-h-[4.5rem] pe-12 pt-5", children: [
          title == null ? null : jsx.jsx("h3", { id: "chart-title", children: title }),
          chart.meta?.description == null ? null : jsx.jsx("p", { children: chart.meta.description }),
        ] }),
        jsx.jsxs("div", { className: "min-h-0 flex-1", children: [
          jsx.jsx("div", { hidden: currentView !== "chart", children: jsx.jsxs(jsx.Fragment, { children: [
            jsx.jsx(LazyChartWidget, { ariaLabel, chart, onReady: () => setReady(true) }),
            jsx.jsx(AccessibleChartSummary, { chart }),
          ] }) }),
          currentView === "table" && table != null ? jsx.jsx(ChartDataTable, { table }) : null,
        ] }),
        chart.meta?.footer == null ? null : jsx.jsx("p", { className: "text-xs text-tertiary", children: chart.meta.footer }),
      ] }),
      jsx.jsxs("div", { "data-chart-widget-download-exclude": true, className: "absolute end-2 top-6 flex gap-1", children: [
        table == null ? null : jsx.jsx("button", { "aria-label": currentView === "chart" ? "View as table" : "View as chart", disabled: downloading, onClick: () => setView(currentView === "chart" ? "table" : "chart"), type: "button", children: currentView === "chart" ? "Table" : "Chart" }),
        currentView === "table" ? jsx.jsx("button", { onClick: copyTable, type: "button", children: "Copy table" }) : jsx.jsx("button", { disabled: !ready || downloading, onClick: download, type: "button", children: downloading ? "Downloading…" : "Download as image" }),
      ] }),
    ],
  });
}

function ChatGptChartContentReference({ initialView = "chart", isStreaming, reference }: ChatGptChartContentReferenceProps): unknown {
  const parsedReference = parseReference(reference);
  if (parsedReference == null) return jsx.jsx("div", { role: "alert", children: "Unsupported chart reference" });
  const matchedText = parsedReference.matched_text;
  const streaming = isStreaming ?? (matchedText?.startsWith("") === true && matchedText.endsWith("") === false);
  if (streaming) return jsx.jsx("div", { role: "status", "aria-label": "Loading chart", className: "my-3 flex h-72 items-center justify-center", children: jsx.jsx(LoadingSpinner, {}) });
  const chart = parseChartSpec(parsedReference.data.content);
  return chart == null ? null : jsx.jsx(ChartContent, { chart, initialView });
}

initializeLazyRuntime();
initializeLazyComponents();
initializeBarSizing();
jsx = getJsxRuntime();
React = getReactRuntime();

export { ChatGptChartContentReference };
