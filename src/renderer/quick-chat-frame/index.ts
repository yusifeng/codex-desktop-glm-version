import {
  $3 as getCompilerRuntime,
  $f as motionEasing,
  Eh as initializeSurfaceRuntime,
  I3 as getJsxRuntime,
  a$ as initializeMotion,
  h4 as initializeClassNames,
  m4 as classNames,
  o$ as motion,
  tp as initializeSharedUi,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  $g as defaultQuickChatSize,
  AS as QuickChatSurface,
  MS as quickChatStyles,
  NS as initializeQuickChatStyles,
  Qat as mergeRefs,
  Zat as initializeMergedRefs,
  i_ as initializeQuickChatSurface,
  jS as initializeQuickChatRuntime,
} from "@rchunk/app-initial";
import { i as resizeHandleRef, o as QuickChatResizeHandles, r as initializeResizeHandles, s as initializeQuickChatObstacles } from "@rchunk/quick-chat-obstacles";
import "@rchunk/rolldown-runtime";

interface Size { height: number; width: number }
interface Bounds { bottom: number; left: number; right: number; top: number }
interface Props {
  animateSurface?: boolean; background?: "panel" | "window"; children?: unknown; currentSize?: Size;
  heightLabel?: string; isCompact?: boolean; isCompactChromeRevealed?: boolean; isMinimized?: boolean;
  keepSurfaceInset?: boolean; maximumSize?: Size; minimizedContent?: unknown; minimizedSurfaceBounds?: Bounds | null;
  minimumSize?: Size; onResize?(size: Size): void; onResizeEnd?(size: Size): void; onResizingChange?(resizing: boolean): void;
  prefersCompactPresentation?: boolean; sectionProps?: Record<string, unknown> & { ref?: unknown }; sectionRef?: unknown;
  shouldReduceMotion?: boolean; variant?: "floating" | "panel" | "window"; verticalResizeEdge?: string; widthLabel?: string;
}
interface CompilerRuntime { c(size: number): unknown[] }
let compiler: CompilerRuntime;
let jsx: JsxRuntime;
let zoomedViewportClass: string;

function QuickChatFrame(props: Props): unknown {
  const cache = compiler.c(45);
  const {
    animateSurface = true, background, children, currentSize, heightLabel, isCompact, isCompactChromeRevealed,
    isMinimized, keepSurfaceInset, maximumSize, minimizedContent, minimizedSurfaceBounds, minimumSize,
    onResize, onResizeEnd, onResizingChange, prefersCompactPresentation, sectionProps = {}, sectionRef,
    shouldReduceMotion, variant, verticalResizeEdge, widthLabel,
  } = props;
  const inset = !isMinimized && (keepSurfaceInset || (isCompact && !isCompactChromeRevealed)) ? 6 : 0;
  let surfaceBounds: Bounds;
  if (cache[0] !== isMinimized || cache[1] !== minimizedSurfaceBounds || cache[2] !== inset) {
    surfaceBounds = isMinimized && minimizedSurfaceBounds != null ? minimizedSurfaceBounds : { top: 0, right: inset, bottom: inset, left: inset };
    cache[0] = isMinimized; cache[1] = minimizedSurfaceBounds; cache[2] = inset; cache[3] = surfaceBounds;
  } else surfaceBounds = cache[3] as Bounds;
  const unstyled = background !== "panel" || prefersCompactPresentation;
  let ref: unknown;
  if (cache[4] !== sectionProps.ref || cache[5] !== sectionRef) {
    ref = mergeRefs(sectionRef, sectionProps.ref, resizeHandleRef);
    cache[4] = sectionProps.ref; cache[5] = sectionRef; cache[6] = ref;
  } else ref = cache[6];
  let sectionClassName: string;
  if (cache[7] !== background || cache[8] !== keepSurfaceInset || cache[9] !== minimizedSurfaceBounds || cache[10] !== prefersCompactPresentation || cache[11] !== variant) {
    sectionClassName = classNames(
      "flex flex-col text-default",
      background === "window" && "bg-surface-tertiary/55",
      minimizedSurfaceBounds == null ? "pointer-events-auto" : "pointer-events-none",
      variant !== "window" && classNames(
        prefersCompactPresentation && quickChatStyles.floatingSurface,
        keepSurfaceInset && quickChatStyles.singleLineSurface,
        variant === "floating"
          ? "fixed top-0 left-0 z-30 max-h-[calc(100dvh/var(--codex-window-zoom)-var(--height-toolbar)-2rem)] max-w-[calc(50vw/var(--codex-window-zoom))]"
          : "absolute top-0 left-0 z-30 max-h-full max-w-full",
        prefersCompactPresentation ? "overflow-visible" : "overflow-hidden",
      ),
      variant === "window" && classNames(zoomedViewportClass, "relative overflow-hidden"),
    );
    cache[7] = background; cache[8] = keepSurfaceInset; cache[9] = minimizedSurfaceBounds; cache[10] = prefersCompactPresentation; cache[11] = variant; cache[12] = sectionClassName;
  } else sectionClassName = cache[12] as string;
  let minimizedSurface: unknown;
  if (cache[13] !== animateSurface || cache[14] !== background || cache[15] !== keepSurfaceInset || cache[16] !== minimizedContent || cache[17] !== prefersCompactPresentation || cache[18] !== shouldReduceMotion || cache[19] !== surfaceBounds) {
    minimizedSurface = prefersCompactPresentation ? jsx.jsx(QuickChatSurface, {
      asChild: true, unstyled: background !== "panel", variant: keepSurfaceInset ? "single-line" : "default",
      children: jsx.jsx((motion as unknown as { div: unknown }).div, {
        "aria-hidden": minimizedContent == null || undefined, animate: surfaceBounds, className: "pointer-events-none absolute", initial: false,
        transition: shouldReduceMotion || !animateSurface ? { duration: 0 } : { duration: 0.3, ease: motionEasing }, children: minimizedContent,
      }),
    }) : null;
    cache[13] = animateSurface; cache[14] = background; cache[15] = keepSurfaceInset; cache[16] = minimizedContent; cache[17] = prefersCompactPresentation; cache[18] = shouldReduceMotion; cache[19] = surfaceBounds; cache[20] = minimizedSurface;
  } else minimizedSurface = cache[20];
  let resizeControls: unknown;
  if (cache[21] !== currentSize || cache[22] !== heightLabel || cache[23] !== isCompact || cache[24] !== isMinimized || cache[25] !== maximumSize || cache[26] !== minimumSize || cache[27] !== onResize || cache[28] !== onResizeEnd || cache[29] !== onResizingChange || cache[30] !== surfaceBounds || cache[31] !== variant || cache[32] !== verticalResizeEdge || cache[33] !== widthLabel) {
    resizeControls = variant !== "window" && !isCompact && !isMinimized ? jsx.jsx("div", {
      className: "pointer-events-none absolute", style: surfaceBounds,
      children: jsx.jsx("div", { className: "pointer-events-auto contents", children: jsx.jsx(QuickChatResizeHandles, {
        currentSize, defaultSize: defaultQuickChatSize, extendIntoToolbar: false, heightLabel, maximumSize, minimumSize,
        verticalEdge: verticalResizeEdge, widthLabel, onResize, onResizeEnd, onResizingChange,
      }) }),
    }) : null;
    cache[21] = currentSize; cache[22] = heightLabel; cache[23] = isCompact; cache[24] = isMinimized; cache[25] = maximumSize; cache[26] = minimumSize; cache[27] = onResize; cache[28] = onResizeEnd; cache[29] = onResizingChange; cache[30] = surfaceBounds; cache[31] = variant; cache[32] = verticalResizeEdge; cache[33] = widthLabel; cache[34] = resizeControls;
  } else resizeControls = cache[34];
  let section: unknown;
  if (cache[35] !== children || cache[36] !== sectionProps || cache[37] !== ref || cache[38] !== sectionClassName || cache[39] !== minimizedSurface || cache[40] !== resizeControls) {
    section = jsx.jsxs((motion as unknown as { section: unknown }).section, { ...sectionProps, ref, className: sectionClassName, children: [minimizedSurface, resizeControls, children] });
    cache[35] = children; cache[36] = sectionProps; cache[37] = ref; cache[38] = sectionClassName; cache[39] = minimizedSurface; cache[40] = resizeControls; cache[41] = section;
  } else section = cache[41];
  let result: unknown;
  if (cache[42] !== unstyled || cache[43] !== section) {
    result = jsx.jsx(QuickChatSurface, { asChild: true, unstyled, children: section });
    cache[42] = unstyled; cache[43] = section; cache[44] = result;
  } else result = cache[44];
  return result;
}

function initializeQuickChatFrame(): void {
  compiler = getCompilerRuntime() as CompilerRuntime;
  initializeClassNames(); initializeMotion(); initializeQuickChatObstacles(); initializeQuickChatSurface(); initializeQuickChatRuntime();
  initializeSurfaceRuntime(); initializeSharedUi(); initializeMergedRefs(); initializeResizeHandles(); initializeQuickChatStyles();
  zoomedViewportClass = "_zoomedViewport_19wqa_1";
  jsx = getJsxRuntime();
}

export { initializeQuickChatFrame as n, QuickChatFrame as t };
