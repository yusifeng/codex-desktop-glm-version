// Themed pie chart with legend, tooltip, value labels, and slice dimming.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as i18nChartChunk from "@rchunk/i18n";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime {
  useCallback<Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result, dependencies: readonly unknown[]): (...arguments_: Arguments) => Result;
  useId(): string;
  useLayoutEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useMemo<Value>(factory: () => Value, dependencies: readonly unknown[]): Value;
  useState<Value>(initialValue: Value): [Value, (next: StateUpdater<Value>) => void];
}
interface IntlShape { formatNumber(value: number, options?: Record<string, unknown>): string }
interface Series { color?: unknown; dataKey: string; label?: string; [key: string]: unknown }
interface Slice { [key: string]: unknown; fill?: unknown; stroke?: unknown; __sliceId?: string; __sliceLabel?: string }
interface Axis { dataKey?: string; labels?: Record<string, string> }
interface PieChartProps {
  data?: Slice[];
  series?: Series[];
  xAxis?: string | Axis;
  showLegend?: boolean;
  legendMaxRows?: number;
  dimInactiveSlices?: boolean;
  showTooltip?: boolean;
  tooltipOffset?: number;
  tooltipAnimationDuration?: number;
  tooltipAllowEscapeViewBox?: unknown;
  showValueLabels?: boolean;
  showLabelLines?: boolean;
  disableAnimation?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  cornerRadius?: number;
  sliceStrokeWidth?: number;
  tooltipValueMode?: "value" | "percent";
  minHeight?: number;
  height?: number;
  aspectRatio?: number;
  tooltipValueFormatter?: Record<string, unknown>;
  children?: unknown;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as { I3: () => JsxRuntime; K2?: () => void; e6: () => ReactRuntime; n4: () => IntlShape };
const charts = i18nChartChunk as unknown as {
  C?: () => { theme: unknown; isPrimarilyTouchDevice: boolean };
  S?: () => void;
  _?: (value: string) => boolean;
  b?: <Value>(value: Value) => Value;
  c?: unknown;
  d?: unknown;
  f?: unknown;
  g?: () => void;
  h?: (intl: IntlShape, value: unknown, series: Series) => string | null;
  l?: unknown;
  m?: (...classes: Array<string | false | undefined>) => string;
  p?: unknown;
  s?: unknown;
  u?: unknown;
  v?: (theme: unknown, color: unknown) => string | undefined;
  y?: () => (expression: unknown, context: Record<string, unknown>) => unknown;
};
const { I3: getJsxRuntime, K2: initializeReactCompilerRuntime, e6: getReactRuntime, n4: useIntl } = shared;
const { C: useChartEnvironment, S: initializeCharts, _: isPaletteToken, b: normalizeProps, c: Cell, d: RechartsPieChart, f: ResponsiveContainer, g: initializeChartRuntime, h: formatSeriesValue, l: Legend, m: classNames, p: Tooltip, s: ChartContainer, u: Pie, v: resolveColor, y: useTooltipExpression } = charts;

let jsx: JsxRuntime;
let React: ReactRuntime;
let initialized = false;
const defaultSeries: Series = { dataKey: "" };
const paletteWeights = [400, 500, 600, 300, 200];
const activeShape = { opacity: 1 };
const inactiveShape = { opacity: 0.5 };

function initializePieChart(): void {
  if (initialized) return;
  initializeChartRuntime?.();
  initializeCharts?.();
  React = getReactRuntime();
  initializeReactCompilerRuntime?.();
  jsx = getJsxRuntime();
  initialized = true;
}

function pickAccessibilityProps(props: PieChartProps): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) if (key === "role" || key === "id" || key.startsWith("data-") || key.startsWith("aria-")) result[key] = value;
  return result;
}

function PieChart(input: PieChartProps): unknown {
  initializePieChart();
  const props = normalizeProps?.(input) ?? input;
  const { data = [], series = [defaultSeries], xAxis, showLegend = true, legendMaxRows, dimInactiveSlices = false, showTooltip = true, tooltipOffset = 6, tooltipAnimationDuration = 600, tooltipAllowEscapeViewBox, showValueLabels = false, showLabelLines = false, disableAnimation = false, animationBegin = 400, animationDuration = 1500, innerRadius, outerRadius = "80%", startAngle = 90, endAngle = -270, paddingAngle, cornerRadius, sliceStrokeWidth = 2, tooltipValueMode = "value", minHeight, height, aspectRatio, tooltipValueFormatter, children, ...rest } = props;
  const accessibility = pickAccessibilityProps(input);
  const intl = useIntl();
  const environment = useChartEnvironment?.() ?? { theme: null, isPrimarilyTouchDevice: false };
  const evaluateExpression = useTooltipExpression?.() ?? (() => null);
  const instanceId = React.useId();
  const [activeSliceId, setActiveSliceId] = React.useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const calculatedAspectRatio = aspectRatio ?? (height || minHeight ? undefined : 4 / 3);
  const maxRows = typeof legendMaxRows === "number" && Number.isFinite(legendMaxRows) && legendMaxRows > 0 ? Math.floor(legendMaxRows) : undefined;
  const primarySeries = series[0] ?? defaultSeries;
  const axis = typeof xAxis === "string" ? null : xAxis;
  const labelKey = typeof xAxis === "string" ? xAxis : axis?.dataKey ?? "";
  const labels = axis?.labels ?? {};
  const resolvedSeriesColor = resolveColor?.(environment.theme, primarySeries.color);
  const palette = React.useMemo(() => {
    if (resolvedSeriesColor != null && isPaletteToken?.(resolvedSeriesColor)) return paletteWeights.map((weight) => "var(--" + resolvedSeriesColor + "-" + weight + ")");
    return resolvedSeriesColor ? [resolvedSeriesColor] : createDefaultPalette();
  }, [resolvedSeriesColor]);
  const getLabel = React.useCallback((slice: Slice, index: number) => { const value = slice[labelKey]; if (value == null) return "Slice " + (index + 1); const text = String(value); return labels[text] ?? text; }, [labelKey, labels]);
  const slices = React.useMemo(() => data.map((slice, index) => ({ ...slice, fill: resolveSliceColor(environment.theme, slice.fill) ?? palette[index % Math.max(1, palette.length)], stroke: resolveSliceColor(environment.theme, slice.stroke) ?? "var(--color-surface)", __sliceId: instanceId + "-" + index, __sliceLabel: getLabel(slice, index) })), [data, environment.theme, getLabel, instanceId, palette]);
  React.useLayoutEffect(() => { setActiveSliceId(null); setHasInteracted(false); }, [data]);
  const legendPayload = React.useMemo(() => slices.map((slice) => ({ color: slice.fill, dataKey: primarySeries.dataKey, payload: { value: slice.__sliceLabel, __sliceId: slice.__sliceId }, type: "square", value: slice.__sliceLabel })), [slices, primarySeries.dataKey]);
  const total = slices.reduce((sum, slice) => { const value = slice[primarySeries.dataKey]; return typeof value === "number" && Number.isFinite(value) ? sum + value : sum; }, 0);
  const formatValue = React.useCallback((value: unknown, payload: unknown) => formattedValue(payload) ?? formatSeriesValue?.(intl, value, primarySeries) ?? null, [intl, primarySeries]);
  const dismiss = React.useCallback(() => setActiveSliceId(null), []);
  const activate = React.useCallback((sliceId: string) => { setHasInteracted(true); setActiveSliceId(sliceId); }, []);
  const activateByIndex = React.useCallback((_event: unknown, index: number) => { const slice = slices[index]; if (slice != null) activate(slice.__sliceId ?? ""); }, [activate, slices]);
  const pieChildren = slices.map((slice) => jsx.jsx(Cell, { fill: slice.fill, opacity: activeSliceId == null || activeSliceId === slice.__sliceId ? undefined : 0.5, stroke: slice.stroke, strokeWidth: sliceStrokeWidth }, slice.__sliceId));
  return jsx.jsx(ChartContainer ?? "div", { ...accessibility, ...rest, className: classNames?.("PieChart_Chart") ?? "PieChart_Chart", "data-w-component": "pie-chart", aspectRatio: calculatedAspectRatio, height, minHeight, children: jsx.jsx(ResponsiveContainer ?? "div", { children: jsx.jsxs(RechartsPieChart ?? "div", { onMouseLeave: dimInactiveSlices && !environment.isPrimarilyTouchDevice ? dismiss : undefined, children: [showTooltip ? jsx.jsx(Tooltip ?? "div", { offset: tooltipOffset, animationDuration: tooltipAnimationDuration, isAnimationActive: tooltipAnimationDuration > 0, allowEscapeViewBox: tooltipAllowEscapeViewBox, content: (tooltipProps: Record<string, unknown>) => renderTooltip(tooltipProps, primarySeries, total, tooltipValueMode, tooltipValueFormatter, evaluateExpression, formatValue, dismiss, intl) }) : null, showLegend ? jsx.jsx(Legend ?? "div", { payload: legendPayload, content: (legendProps: Record<string, unknown>) => renderLegend(legendProps, activeSliceId, maxRows, activate, dismiss) }) : null, jsx.jsx(Pie ?? "div", { data: slices, dataKey: primarySeries.dataKey, nameKey: "__sliceLabel", cx: "50%", cy: "50%", innerRadius, outerRadius, startAngle, endAngle, paddingAngle, cornerRadius, isAnimationActive: !disableAnimation && !hasInteracted, animationBegin, animationDuration, activeShape: dimInactiveSlices ? activeShape : undefined, inactiveShape: dimInactiveSlices ? inactiveShape : undefined, onMouseEnter: dimInactiveSlices ? activateByIndex : undefined, onMouseLeave: dimInactiveSlices ? dismiss : undefined, onClick: dimInactiveSlices ? activateByIndex : undefined, label: showValueLabels ? ({ value, payload }: { value: unknown; payload: unknown }) => formatValue(value, payload) : false, labelLine: showValueLabels ? showLabelLines : false, children: pieChildren })] }) }) });
}

function renderTooltip(props: Record<string, unknown>, series: Series, total: number, mode: string, formatter: Record<string, unknown> | undefined, evaluate: (expression: unknown, context: Record<string, unknown>) => unknown, formatValue: (value: unknown, payload: unknown) => string | null, dismiss: () => void, intl: IntlShape): unknown {
  const active = props.active === true;
  const payload = Array.isArray(props.payload) ? props.payload : [];
  React.useLayoutEffect(() => { if (!active || payload.length === 0) dismiss(); }, [active, dismiss, payload.length]);
  if (!active || payload.length === 0) return null;
  const entry = payload[0] as Record<string, unknown>;
  const slice = asRecord(entry.payload);
  const label = typeof slice?.__sliceLabel === "string" ? slice.__sliceLabel : entry.name == null ? "" : String(entry.name);
  const expressionValue = formatter?.type === "expression" ? evaluate(formatter.expression, { value: entry.value, dataKey: entry.dataKey, name: entry.name, payload: entry.payload, color: entry.color, seriesLabel: series.label, xAxisLabel: label }) : formatter?.type === "xAxisLabel" ? label : null;
  const percent = mode === "percent" && typeof entry.value === "number" && total !== 0 ? intl.formatNumber(entry.value / total, { maximumFractionDigits: 1, style: "percent" }) : null;
  const value = expressionValue ?? percent ?? formatValue(entry.value, entry.payload) ?? "";
  return jsx.jsxs("div", { className: "PieChart_ChartTooltip", children: [label ? jsx.jsx("div", { className: "PieChart_TooltipHeader", children: label }) : null, jsx.jsx("span", { className: "PieChart_TooltipValue", children: value })] });
}

function renderLegend(props: Record<string, unknown>, activeSliceId: string | null, maxRows: number | undefined, activate: (sliceId: string) => void, dismiss: () => void): unknown {
  const payload = Array.isArray(props.payload) ? props.payload : [];
  if (payload.length === 0) return null;
  return jsx.jsx("div", { className: "PieChart_Legend", style: maxRows == null ? undefined : { maxHeight: maxRows * 28 + Math.max(0, maxRows - 1) * 6 + 12 + "px" }, onPointerLeave: (event: { pointerType: string }) => { if (event.pointerType !== "touch") dismiss(); }, children: payload.map((entry) => { const item = entry as Record<string, unknown>; const details = asRecord(item.payload); const sliceId = typeof details?.__sliceId === "string" ? details.__sliceId : null; return jsx.jsx("button", { "data-w-dimmed": activeSliceId != null && activeSliceId !== sliceId ? "" : undefined, onPointerEnter: (event: { pointerType: string }) => { if (sliceId != null && event.pointerType !== "touch") activate(sliceId); }, children: String(item.value ?? "") }, String(item.value ?? "")); }) });
}

function createDefaultPalette(): string[] { return paletteWeights.flatMap((weight) => ["blue","purple","orange","green","red","yellow","pink"].map((color) => "var(--" + color + "-" + weight + ")")); }
function resolveSliceColor(theme: unknown, color: unknown): string | undefined { return typeof color === "string" && color !== "" || isDualColor(color) ? resolveColor?.(theme, color) : undefined; }
function isDualColor(value: unknown): boolean { return typeof value === "object" && value != null && "light" in value && "dark" in value; }
function asRecord(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value != null ? value as Record<string, unknown> : null; }
function formattedValue(value: unknown): string | null { const record = asRecord(value); return typeof record?.formatted === "string" ? record.formatted : null; }

initializePieChart();
export { initializePieChart as n, PieChart as t };
