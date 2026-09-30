// Responsive chart bar sizing. Release chunk: bar-sizing-fa3b2a70455c.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface Series {
  stack?: string | null;
}
interface ReactRuntime {
  useState<T>(initial: T): [T, (updater: T | ((value: T) => T)) => void];
  useRef<T>(initial: T): { current: T };
}
let React: ReactRuntime;
function seriesGroupCount(series: Series[]): number {
  const stacks = new Set<string>();
  let unstacked = 0;
  for (const item of series)
    item.stack == null ? (unstacked += 1) : stacks.add(item.stack);
  return Math.max(1, stacks.size + unstacked);
}
function categoryGap({
  dataLength,
  defaultGapPx,
}: {
  dataLength: number;
  defaultGapPx: number;
}): number {
  if (dataLength >= 24) return Math.min(defaultGapPx, 3);
  if (dataLength >= 16) return Math.min(defaultGapPx, 6);
  return defaultGapPx;
}
function twoPointMaxSize({
  dataLength,
  isHorizontalBarChart,
  series,
}: {
  dataLength: number;
  isHorizontalBarChart: boolean;
  series: Series[];
}): number | undefined {
  if (dataLength === 2 && seriesGroupCount(series) === 2)
    return isHorizontalBarChart ? 48 : 120;
}
function barRadius({
  containerSize,
  dataLength,
  series,
}: {
  containerSize?: number | null;
  dataLength: number;
  series: Series[];
}): number {
  if (containerSize == null || containerSize <= 0 || dataLength <= 0) return 8;
  const estimated =
    (containerSize / dataLength / seriesGroupCount(series)) * 0.65;
  for (const rule of [
    { min: 56, radius: 8 },
    { min: 36, radius: 6 },
    { min: 16, radius: 4 },
    { min: 0, radius: 2 },
  ])
    if (estimated >= rule.min) return rule.radius;
  return 2;
}
function responsiveGap(width: number): number {
  return width >= 768 ? 12 : 8;
}
function verticalBarChartStyle(chart: {
  chartType: string;
  layout: string;
  data: unknown[];
  series: Series[];
}): { height: string } | undefined {
  if (chart.chartType !== "bar" || chart.layout !== "vertical") return;
  const bars = chart.data.length * seriesGroupCount(chart.series);
  if (bars > 20) return { height: 27 + (bars - 20) * 1.5 + "rem" };
}
function useBarContainerSizing() {
  const [state, setState] = React.useState({
    barCategoryGapPx: 8,
    barContainerHeight: null as number | null,
    barContainerWidth: null as number | null,
  });
  const cleanup = React.useRef<(() => void) | undefined>(undefined);
  const setBarContainer = (element: Element | null) => {
    cleanup.current?.();
    cleanup.current = undefined;
    if (!element) return;
    const update = (width: number, height: number) =>
      setState((previous) => ({
        barCategoryGapPx: responsiveGap(width),
        barContainerHeight: height,
        barContainerWidth: width,
      }));
    const bounds = element.getBoundingClientRect();
    update(bounds.width, bounds.height);
    const observe = (
      appInitialChunk as unknown as {
        OM(options: {
          axis: string;
          initialSize: boolean;
          onChange(size: { width: number; height: number }): void;
          target: Element;
        }): () => void;
      }
    ).OM;
    cleanup.current = observe({
      axis: "both",
      initialSize: false,
      onChange: ({ width, height }) => update(width, height),
      target: element,
    });
  };
  return { ...state, setBarContainer };
}
function initializeBarSizing(): void {
  React = (appSharedChunk as unknown as { e6(): ReactRuntime }).e6();
  const init = (appInitialChunk as unknown as { kM?: () => void }).kM;
  init?.();
}

export {
  initializeBarSizing as a,
  barRadius as i,
  verticalBarChartStyle as n,
  useBarContainerSizing as o,
  categoryGap as r,
  twoPointMaxSize as t,
};
