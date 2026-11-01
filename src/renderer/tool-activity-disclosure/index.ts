import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  Xf as disclosureTransition,
  a$ as motion,
  e6 as getReactRuntime,
  o$ as initializeMotion,
  tp as initializeSharedUi,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  Ait as ActivityDisclosureFrame,
  Dit as initializeActivityDisclosureFrame,
  Eit as ActivityDisclosureBody,
  Sat as initializeResizeMeasurement,
  Vat as initializeActivityDisclosureUi,
  jit as initializeActivityDisclosureBody,
  wat as useResizeObserverRef,
  zat as ActiveSummary,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

interface ToolActivityDisclosureProps {
  children?: unknown;
  defaultExpanded?: boolean;
  icon?: unknown;
  indentContent?: boolean;
  onExpand?(): void;
  status?: "complete" | "error" | "running";
  summary: unknown;
}
interface ReactRuntime { useState<T>(value: T): [T, (next: T | ((current: T) => T)) => void] }
interface CompilerRuntime { c(size: number): unknown[] }

let measurementCompiler: CompilerRuntime;
let disclosureCompiler: CompilerRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;

function resizeEntryHeight(entry: ResizeObserverEntry): number {
  return entry.borderBoxSize
    ? ((Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize)?.blockSize ?? entry.contentRect.height)
    : entry.contentRect.height;
}

function useMeasuredElement(): { elementHeightPx: number; elementRef(element: HTMLElement | null): void } {
  const cache = measurementCompiler.c(7);
  const [height, setHeight] = React.useState(0);
  let updateHeight: (height: number) => void;
  if (cache[0] === Symbol.for("react.memo_cache_sentinel")) {
    updateHeight = (next) => setHeight((current) => current === next ? current : next);
    cache[0] = updateHeight;
  } else updateHeight = cache[0] as typeof updateHeight;
  let onResize: (entry: ResizeObserverEntry) => void;
  if (cache[1] === Symbol.for("react.memo_cache_sentinel")) {
    onResize = (entry) => updateHeight(resizeEntryHeight(entry));
    cache[1] = onResize;
  } else onResize = cache[1] as typeof onResize;
  const observedRef = useResizeObserverRef(onResize);
  let elementRef: (element: HTMLElement | null) => void;
  if (cache[2] === observedRef) elementRef = cache[3] as typeof elementRef;
  else {
    elementRef = (element) => { if (element != null) updateHeight(element.scrollHeight); observedRef(element); };
    cache[2] = observedRef; cache[3] = elementRef;
  }
  let result: { elementHeightPx: number; elementRef(element: HTMLElement | null): void };
  if (cache[4] !== height || cache[5] !== elementRef) {
    result = { elementHeightPx: height, elementRef };
    cache[4] = height; cache[5] = elementRef; cache[6] = result;
  } else result = cache[6] as typeof result;
  return result;
}

function initializeMeasurement(): void {
  measurementCompiler = getCompilerRuntime() as CompilerRuntime;
  React = getReactRuntime() as ReactRuntime;
  initializeResizeMeasurement();
}

function ToolActivityDisclosure({ children, defaultExpanded = false, icon, indentContent = true, onExpand, status, summary }: ToolActivityDisclosureProps): unknown {
  const cache = disclosureCompiler.c(25);
  const [runningExpanded, setRunningExpanded] = React.useState(false);
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const { elementHeightPx, elementRef } = useMeasuredElement();
  const active = status === "running";
  const hasChildren = children != null;
  const open = hasChildren && (active ? !runningExpanded : expanded);
  let toggle: () => void;
  if (cache[0] !== runningExpanded || cache[1] !== expanded || cache[2] !== open || cache[3] !== active || cache[4] !== onExpand) {
    toggle = () => { if (open || onExpand?.(), active) setRunningExpanded(!runningExpanded); else setExpanded(!expanded); };
    cache[0] = runningExpanded; cache[1] = expanded; cache[2] = open; cache[3] = active; cache[4] = onExpand; cache[5] = toggle;
  } else toggle = cache[5] as typeof toggle;
  let summaryNode: unknown;
  if (cache[6] !== active || cache[7] !== summary) {
    summaryNode = jsx.jsx(ActiveSummary, { active, className: "min-w-0 truncate text-size-chat text-text-tertiary/90 group-hover/activity-header:text-default", children: summary });
    cache[6] = active; cache[7] = summary; cache[8] = summaryNode;
  } else summaryNode = cache[8];
  let disclosure: { expanded: boolean; onToggle(): void } | undefined;
  if (cache[9] !== toggle || cache[10] !== hasChildren || cache[11] !== open) {
    disclosure = hasChildren ? { expanded: open, onToggle: toggle } : undefined;
    cache[9] = toggle; cache[10] = hasChildren; cache[11] = open; cache[12] = disclosure;
  } else disclosure = cache[12] as typeof disclosure;
  let body: unknown;
  if (cache[13] !== children || cache[14] !== elementHeightPx || cache[15] !== elementRef || cache[16] !== indentContent || cache[17] !== hasChildren || cache[18] !== open) {
    body = hasChildren ? jsx.jsx((motion as unknown as { div: unknown }).div, {
      initial: false,
      animate: { height: open ? elementHeightPx : 0, opacity: +!!open },
      "aria-hidden": !open,
      inert: !open,
      className: open ? "overflow-visible" : "overflow-hidden",
      style: { pointerEvents: open ? "auto" : "none" },
      transition: disclosureTransition,
      children: jsx.jsx(ActivityDisclosureBody, { ref: elementRef, indent: indentContent, children }),
    }) : null;
    cache[13] = children; cache[14] = elementHeightPx; cache[15] = elementRef; cache[16] = indentContent; cache[17] = hasChildren; cache[18] = open; cache[19] = body;
  } else body = cache[19];
  let result: unknown;
  if (cache[20] !== body || cache[21] !== disclosure || cache[22] !== icon || cache[23] !== summaryNode) {
    result = jsx.jsx(ActivityDisclosureFrame, { body, disclosure, icon, summary: summaryNode });
    cache[20] = body; cache[21] = disclosure; cache[22] = icon; cache[23] = summaryNode; cache[24] = result;
  } else result = cache[24];
  return result;
}

function initializeToolActivityDisclosure(): void {
  disclosureCompiler = getCompilerRuntime() as CompilerRuntime;
  (initializeMotion as unknown as () => void)();
  React = getReactRuntime() as ReactRuntime;
  initializeSharedUi();
  initializeMeasurement();
  initializeActivityDisclosureBody();
  initializeActivityDisclosureUi();
  initializeActivityDisclosureFrame();
  jsx = getJsxRuntime();
}

export { useMeasuredElement as i, initializeToolActivityDisclosure as n, initializeMeasurement as r, ToolActivityDisclosure as t };
