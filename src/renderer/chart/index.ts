import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/i18n";
import "@rchunk/chart-stores";
import "@rchunk/bar-sizing";
import { n as initializeChartColors, t as getChartColors } from "@rchunk/chart-colors";
import { n as initializePieChart, t as PieChart } from "@rchunk/PieChart";

interface ChartSeries {
  color?: unknown;
  dataKey: string;
  label?: string;
  stack?: string;
  valueFormat?: unknown;
  valuePrefix?: string;
  valueSuffix?: string;
}
interface ChartDefinition {
  chartType: "bar" | "line" | "pie" | "scatter";
  data: Array<Record<string, unknown>>;
  layout?: "horizontal" | "vertical";
  nameKey?: string;
  series: ChartSeries[];
  valueKey?: string;
  xAxisScale?: string;
  xKey: string;
  axes?: Array<{ dimension?: string; domain?: unknown; ticks?: Array<{ label?: string; value: number }> }>;
}
interface ChartWidgetProps { ariaLabel?: string; chart: ChartDefinition; onReady?: () => void; theme?: "dark" | "light" }

let jsx: JsxRuntime;

function normalizeValue(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  return String(value);
}

function chartData(chart: ChartDefinition): Array<Record<string, unknown>> {
  if (chart.data.length > 0) return chart.data.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])));
  const placeholder: Record<string, unknown> = { [chart.xKey]: chart.chartType === "scatter" ? 0 : "" };
  for (const series of chart.series) placeholder[series.dataKey] = null;
  return [placeholder];
}

function seriesConfig(chart: ChartDefinition, colors: readonly string[]): Array<Record<string, unknown>> {
  return chart.series.map((series, index) => ({
    color: colors[index % Math.max(1, colors.length)],
    curveType: chart.chartType === "line" ? "linear" : undefined,
    dataKey: series.dataKey,
    label: series.label,
    stack: series.stack,
    type: chart.chartType === "line" || chart.chartType === "scatter" ? chart.chartType : "bar",
    valueFormat: series.valueFormat,
    valuePrefix: series.valuePrefix,
    valueSuffix: series.valueSuffix,
  }));
}

function axisLabels(chart: ChartDefinition, data: Array<Record<string, unknown>>): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const row of data) {
    const value = row[chart.xKey];
    if (value != null) labels[String(value)] = String(value).replace(/\s+/g, " " ).trim();
  }
  return labels;
}

function renderCartesianChart(props: ChartWidgetProps): unknown {
  const data = chartData(props.chart);
  const colors = getChartColors({ chatTheme: "blue", isDarkMode: props.theme === "dark", colorCount: props.chart.series.length });
  return jsx.jsx("div", {
    role: "img",
    "aria-label": props.ariaLabel,
    className: "box-border flex h-full min-h-0 flex-col px-2 pt-5 pb-[0.375rem]",
    "data-chart-type": props.chart.chartType,
    "data-theme": props.theme,
    chart: props.chart,
    data,
    series: seriesConfig(props.chart, colors),
    xAxis: { axisLine: false, dataKey: props.chart.xKey, labels: axisLabels(props.chart, data), tickMargin: 4 },
    yAxis: createYAxis(props.chart),
  });
}

function createYAxis(chart: ChartDefinition): Record<string, unknown> {
  const axes = chart.axes?.filter((axis) => axis.dimension === "y") ?? [];
  if (axes.length !== 1) return { axisLine: false, tickLine: false, tickMargin: 4, domain: ["auto", "auto"] };
  const axis = axes[0];
  const labels: Record<string, string> = {};
  const ticks = axis.ticks?.filter((tick) => Number.isFinite(tick.value)).map((tick) => { if (tick.label != null) labels[tick.value] = tick.label; return tick.value; });
  return { axisLine: false, tickLine: false, tickMargin: 4, domain: axis.domain ?? ["auto", "auto"], ticks, labels };
}

function renderPieChart(props: ChartWidgetProps): unknown {
  if (props.chart.series.length === 0) return null;
  const colors = getChartColors({ chatTheme: "blue", isDarkMode: props.theme === "dark", colorCount: props.chart.data.length });
  const data = chartData(props.chart).map((row, index) => ({ ...row, fill: colors[index % Math.max(1, colors.length)], stroke: "var(--color-surface)" }));
  const firstSeries = props.chart.series[0];
  return jsx.jsx("div", { role: "img", "aria-label": props.ariaLabel, className: "box-border flex h-full min-h-0 flex-col py-3", "data-theme": props.theme, children: jsx.jsx(PieChart, {
    data,
    disableAnimation: true,
    height: "100%",
    innerRadius: "40%",
    legendMaxRows: 2,
    outerRadius: "78%",
    paddingAngle: 0.5,
    series: [{ dataKey: props.chart.valueKey ?? firstSeries?.dataKey ?? "value", label: firstSeries?.label, valueFormat: firstSeries?.valueFormat, valuePrefix: firstSeries?.valuePrefix, valueSuffix: firstSeries?.valueSuffix }],
    tooltipAllowEscapeViewBox: { x: false, y: true },
    tooltipAnimationDuration: 0,
    tooltipOffset: 10,
    tooltipValueMode: "percent",
    width: "100%",
    xAxis: props.chart.nameKey,
  }) });
}

function ChartWidget(props: ChartWidgetProps): unknown {
  const chart = props.chart.chartType === "pie" ? renderPieChart(props) : renderCartesianChart(props);
  return jsx.jsx("div", { className: "contents", ref: (element: unknown) => { if (element != null) props.onReady?.(); }, children: chart });
}

initializeChartColors();
initializePieChart();
jsx = getJsxRuntime();

export { ChartWidget };
