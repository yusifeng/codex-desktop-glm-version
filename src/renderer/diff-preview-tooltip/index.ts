import {
  $3 as getCompilerRuntime,
  H3 as initializePreloadRuntime,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  V3 as preload,
  c_ as initializeTooltip,
  e6 as getReactRuntime,
  o_ as Tooltip,
  qm as initializeQueryRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

interface DiffPreviewTooltipProps {
  children?: unknown;
  diff: { metadata?: unknown };
  disabled?: boolean;
  displayPath?: string;
  linesAdded?: number;
  linesRemoved?: number;
  onOpen?(): void;
}
interface CompilerRuntime { c(size: number): unknown[] }
interface ReactRuntime { useState<T>(value: T): [T, (next: T | ((current: T) => T)) => void] }

let compiler: CompilerRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let DiffHighlightPreloader: (props: { fileDiff: unknown }) => unknown;
let DiffPreviewContent: (props: DiffPreviewTooltipProps) => unknown;
let delayDuration: number;
let tooltipMaxWidth: string;

const dependencies = [
  "@rchunk/diff-preview-content", "@rchunk/rolldown-runtime", "@rchunk/app-shared",
  "./app-shared-fa570b9eb9dd.css", "@rchunk/app-initial", "./app-initial-e8ceb32eb626.css",
  "@rchunk/register-pierre-themes", "@rchunk/file-diff", "@rchunk/file-diff-presentation",
  "@rchunk/codex-diff-css", "@rchunk/virtualized-file-diff-line-position",
];

function DiffPreviewTooltip({ children, diff, disabled = false, displayPath, linesAdded, linesRemoved, onOpen }: DiffPreviewTooltipProps): unknown {
  const cache = compiler.c(18);
  const [entered, setEntered] = React.useState(false);
  let preloader: unknown;
  if (cache[0] !== diff || cache[1] !== entered) {
    preloader = entered ? jsx.jsx(DiffHighlightPreloader, { fileDiff: diff.metadata }) : null;
    cache[0] = diff; cache[1] = entered; cache[2] = preloader;
  } else preloader = cache[2];
  const stateKey = disabled ? "disabled" : "enabled";
  let onPointerEnter: () => void;
  if (cache[3] === Symbol.for("react.memo_cache_sentinel")) {
    onPointerEnter = () => setEntered(true);
    cache[3] = onPointerEnter;
  } else onPointerEnter = cache[3] as typeof onPointerEnter;
  let tooltipContent: unknown;
  if (cache[4] !== diff || cache[5] !== displayPath || cache[6] !== linesAdded || cache[7] !== linesRemoved || cache[8] !== onOpen) {
    tooltipContent = jsx.jsx(DiffPreviewContent, { diff, displayPath, linesAdded, linesRemoved, onOpen });
    cache[4] = diff; cache[5] = displayPath; cache[6] = linesAdded; cache[7] = linesRemoved; cache[8] = onOpen; cache[9] = tooltipContent;
  } else tooltipContent = cache[9];
  let tooltip: unknown;
  if (cache[10] !== children || cache[11] !== disabled || cache[12] !== stateKey || cache[13] !== tooltipContent) {
    tooltip = jsx.jsx(Tooltip, {
      align: "center", closeOnTriggerBlur: false, delayDuration, disabled, interactive: true,
      onPointerEnter, side: "top", sideOffset: 0, skipDelayKey: "diff-preview",
      tooltipBodyClassName: "h-full",
      tooltipClassName: "group/diff-preview pointer-events-none flex h-[min(420px,var(--radix-tooltip-content-available-height,420px),calc(100vh-16px))] flex-col justify-end overflow-visible data-[side]:w-[clamp(0px,calc(var(--radix-tooltip-trigger-width,0px)-64px),var(--radix-tooltip-content-available-width,100vw))] data-[side=bottom]:justify-start",
      tooltipMaxWidth, variant: "unstyled", tooltipContent, children,
    }, stateKey);
    cache[10] = children; cache[11] = disabled; cache[12] = stateKey; cache[13] = tooltipContent; cache[14] = tooltip;
  } else tooltip = cache[14];
  let result: unknown;
  if (cache[15] !== preloader || cache[16] !== tooltip) {
    result = jsx.jsxs(jsx.Fragment, { children: [preloader, tooltip] });
    cache[15] = preloader; cache[16] = tooltip; cache[17] = result;
  } else result = cache[17];
  return result;
}

function initializeDiffPreviewTooltip(): void {
  compiler = getCompilerRuntime() as CompilerRuntime;
  React = getReactRuntime() as ReactRuntime;
  initializeQueryRuntime();
  initializeTooltip();
  jsx = getJsxRuntime();
  initializePreloadRuntime();
  DiffHighlightPreloader = createLazyComponent(async () => (
    await preload(async () => ({ DiffHighlightPreloader: (await import("@rchunk/diff-preview-content")).DiffHighlightPreloader }), dependencies, import.meta.url)
  ).DiffHighlightPreloader);
  DiffPreviewContent = createLazyComponent(async () => (
    await preload(async () => ({ DiffPreviewContent: (await import("@rchunk/diff-preview-content")).DiffPreviewContent }), dependencies, import.meta.url)
  ).DiffPreviewContent) as typeof DiffPreviewContent;
  delayDuration = 800;
  tooltipMaxWidth = "clamp(0px, calc(var(--radix-tooltip-trigger-width) - 64px), var(--radix-tooltip-content-available-width))";
}

export { initializeDiffPreviewTooltip as n, DiffPreviewTooltip as t };
