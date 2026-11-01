// virtualized-turn-list —— 会话流的虚拟化渲染主件（859 行原 chunk）。
//
// 原版：app/webview/assets/virtualized-turn-list-a260a21e3c40.js。
//
// 分层结构（压缩名 → 语义，全部经原文核实）：
//   ── 侧面板内容位移层（floating panel 展开时主内容让位）──
//   - Y  → displayModeForWidth：内容宽 → overlay/shift/gutter 三态
//          （(width-736)/2：<180 overlay，<400 shift，否则 gutter）
//   - Ie → panelSurfaceState：displayMode/isPinned/isPopoverOpen →
//          {shouldShow, visibleSurface: inline|popover|null,
//           shouldHideInlineImmediately}
//   - X  → contentShiftFor：shift+pinned → -158px，否则 0
//   - Z  → useThreadPanelContentShift：内容位移动画（316px 目标宽度 +
//          弹簧动画 Je；contentShiftResetKey 变化 → 批处理 set，否则 jump）
//   - We → useThreadPanelWidthEffects：宽度变化 → 更新面板 displayMode
//          （ze atom，Ge 关闭 popover）
//   ── 虚拟化主件 ──
//   - Ze → VirtualizedTurnList：核心组件。布局计算（thread-virtualizer 的
//          Ae=computeTurnLayout）+ 恢复状态（et）+ 可见范围（Ee）+
//          行高测量（ResizeObserver 循环）+ 顶部保留行（retainedTopPx 绝对
//          定位）+ 最新 turn footer + 机器人 API 回调
//   - $e → VirtualizedTurnRow：单行渲染（data-turn-key + content-visibility +
//          高度/marginTop/minHeight/top 内联样式）
//   ── 恢复状态（热重载/会话切换时保持滚动位置）──
//   - et → computeRestoreState：entries + 测量高度 + 当前滚动 →
//          {distanceFromBottomPx, renderedRange, turnKeys, viewportHeightPx}
//   - tt → reconcileRestoreState：范围包含性 + 键序等价 → 复用旧状态对象
//   - rt → findRestoreAnchorTurn：视口内首个已测量的非 gap turn
//          （负距离时取最后一个）
//   - ct → pickRestoreMeasurements：保留集内的测量高度 + 渲染窗口
//   ── 滚动目标 ──
//   - ut → scrollDistanceForTurn：align top（底部偏移 - 10px）/ center
//   - dt → scrollDistanceForTargetElement：对齐 turn 内的目标元素（元素顶
//          部偏移 + 高度换算，zoom 感知 b）
//   - lt → turnBottomDistanceToScrollBottom
//   ── 组件层 ──
//   - G  → DynamicIsleContent：dynamic-isle 变体容器（select-none）
//   - Me/Ne → DynamicIslePaginatedList/ViewMorePagination：分页展开
//          （View less / View {count} more）
//   - He → attachFallbackUrl：附件 URL 兜底
//   常量：ht=12（默认间距 gt 通道）、gt=800（恢复视口高）、_t=2（overscan）、
//   vt=10（顶部对齐留白）、yt={}（空测量表）、bt=memo($e)。
//
// 依赖（保持与原版一致的 import 集合）：
//   - thread-virtualizer（已重写）：Ae/Ee/Te → computeTurnLayout/
//     computeVisibleRange/rangeForAnchor
//   - thread-scroll-controller-context-value（已重写）：we（scroll controller）
//   - app-shared / app-initial 的压缩导出（React 运行时、i18n、面板 atoms、
//     弹簧动画、ResizeObserver 工具等）经 @rchunk 别名保持契约。

import {
  $3 as runtimeLazy,
  BX as appSharedLazyInit,
  C_ as iconRuntimeInit,
  FQ as panelPresetInit,
  FX as panelWidthAtomInit,
  HX as createQuerySubscriberStore,
  I3 as jsxRuntime,
  IQ as createAtomApi,
  JQ as atomWriteApi,
  K2 as springRuntimeInit,
  LX as usePanelWidthContext,
  P3 as clsxRuntimeInit,
  QI as i18nInit,
  S_ as IconAsset,
  Xi as panelIsPinnedAtomInit,
  Y2 as FormattedMessage,
  Yi as panelIsPinnedFamilyInit,
  ZI as usePanelSurfaceApi,
  __ as useScopeAtomHook,
  b_ as reactUse,
  e6 as React,
  fk as setPanelDisplayModeEffect,
  g_ as iconScaleContextInit,
  h4 as intlContextInit,
  i$ as subscribeAtomSignal,
  lk as toastRuntimeInit,
  m4 as intlMessage,
  n$ as readAtomSignal,
  pZ as createDerivedFamily,
  qQ as dropdownMenuInit,
  qm as compactMenuInit,
  r$ as writeAtomSignal,
  rZ as createSignalFamily,
  t$ as effectApi,
  x_ as useIconScaleContext,
  y_ as iconScaleInit,
} from "@rchunk/app-shared";
import {
  a as rangeForAnchor,
  i as computeVisibleRange,
  n as distanceForAnchor,
  o as threadVirtualizerInit,
  r as centerDistanceForTurn,
  t as computeTurnLayout,
} from "@rchunk/thread-virtualizer";
import { n as threadScrollContextInit, r as useThreadScrollController } from "@rchunk/thread-scroll-controller-context-value";
import { $en as panelLayerLazy, bS as panelContentSurface, CS as panelComponentLazy } from "@rchunk/app-initial";
import * as initialChunk from "@rchunk/app-initial";

let reactRuntime: any;
let jsx: any;
let MemoizedVirtualizedTurnRow: any;
let virtualizedTurnListInitialized = false;
function callInitializer(value: unknown): void { if (typeof value === "function") value(); }
function stable<T extends (...args: any[]) => any>(callback: T): T { return (useScopeAtomHook as unknown as (value: T) => T)(callback); }
function resizeEntryBounds(entry: ResizeObserverEntry): { height: number } { return (initialChunk as any).jat(entry); }

// ---------------------------------------------------------------------------
// 常量（原 `xt` 初始化器）
// ---------------------------------------------------------------------------

/** 默认行间距（原 `ht`）。 */
const DEFAULT_GAP_PX = 12;
/** 恢复状态计算用的视口高（原 `gt`）。 */
const RESTORE_VIEWPORT_HEIGHT_PX = 800;
/** 可见范围 overscan 行数（原 `_t`）。 */
const OVERSCAN_COUNT = 2;
/** 顶部对齐留白（原 `vt`）。 */
const TOP_ALIGN_PADDING_PX = 10;
/** 空测量表（原 `yt`）。 */
const EMPTY_MEASUREMENTS: Record<string, number> = {};
/** 面板展开时的内容位移弹簧目标宽度。 */
const PANEL_WIDTH_PX = 316;
/** shift 模式下 pinned 面板的位移量（原 `X`）。 */
const SHIFT_PINNED_OFFSET_PX = -158;

// ---------------------------------------------------------------------------
// 侧面板内容位移层（原 `Y`/`Ie`/`X`/`Z`/`We`/`Ge`/`Ke`/`qe`/`Je`）
// ---------------------------------------------------------------------------

/** 内容宽 → 面板呈现形态（原 `Y`）。 */
function displayModeForWidth(mainContentTargetWidth: number): "overlay" | "shift" | "gutter" {
  const margin = (mainContentTargetWidth - 736) / 2;
  return margin < 180 ? "overlay" : margin < 400 ? "shift" : "gutter";
}

/** 面板表面状态（原 `Ie`）。 */
interface PanelSurfaceState {
  displayMode: "overlay" | "shift" | "gutter";
  shouldHideInlineImmediately: boolean;
  shouldShow: boolean;
  visibleSurface: "inline" | "popover" | null;
}

function panelSurfaceState({ displayMode, isPinned, isPopoverOpen }: { displayMode: string; isPinned: boolean; isPopoverOpen: boolean }): PanelSurfaceState {
  const shouldShowInline = isPinned && displayMode !== "overlay";
  let visibleSurface: "inline" | "popover" | null = null;
  if (shouldShowInline) visibleSurface = "inline";
  else if (displayMode === "overlay" && isPopoverOpen) visibleSurface = "popover";
  return {
    displayMode: displayMode as PanelSurfaceState["displayMode"],
    shouldHideInlineImmediately: displayMode === "overlay" && isPopoverOpen,
    shouldShow: shouldShowInline,
    visibleSurface,
  };
}

/** 位移量（原 `X`）。 */
function contentShiftFor({ displayMode, isPinned }: { displayMode: string; isPinned: boolean }): number {
  return isPinned && displayMode === "shift" ? SHIFT_PINNED_OFFSET_PX : 0;
}

/** 位移计算入口（原 `Ke`）。 */
function contentShiftForPanel({ isPinned, mainContentTargetWidth }: { isPinned: boolean; mainContentTargetWidth: number }): number {
  return contentShiftFor({ displayMode: displayModeForWidth(mainContentTargetWidth), isPinned });
}

/** 弹簧动画（原 `Je`：无动画器时直接 set）。 */
function animateContentShift(atom: { set(value: number): void }, target: number, animator: unknown): { stop(): void } | null {
  if (animator) {
    atom.set(target);
    return null;
  }
  return (atom as unknown as { spring(target: number): { stop(): void } }).spring?.(target) ?? null;
}

/** 关闭 popover（原 `Ge`）。 */
function closePopoverState(state: { displayMode: string; isPopoverOpen: boolean }): { displayMode: string; isPopoverOpen: boolean } {
  return state.isPopoverOpen ? { ...state, isPopoverOpen: false } : state;
}
void closePopoverState;

/** 宽度变化 → 更新面板形态（原 `qe`）。 */
function setPanelDisplayMode(widthAtom: { set(key: unknown, updater: (state: { displayMode: string; isPopoverOpen: boolean }) => { displayMode: string; isPopoverOpen: boolean }): void }, displayModeAtomKey: unknown, mainContentTargetWidth: number): void {
  const displayMode = displayModeForWidth(mainContentTargetWidth);
  widthAtom.set(displayModeAtomKey, (state) => {
    const keepPopover = displayMode === "overlay" && state.isPopoverOpen;
    return state.displayMode === displayMode && state.isPopoverOpen === keepPopover ? state : { displayMode, isPopoverOpen: keepPopover };
  });
}

// ---------------------------------------------------------------------------
// 恢复状态（原 `et`/`tt`/`nt`/`rt`/`it`/`ct`）
// ---------------------------------------------------------------------------

/** 恢复状态。 */
interface RestoreState {
  distanceFromBottomPx: number;
  renderedRange: { startIndex: number; endIndex: number };
  turnKeys: string[];
  viewportHeightPx: number;
}

/** 计算恢复状态（原 `et`）。 */
function computeRestoreState(
  entries: Array<{ turnKey: string; type: string; gapBeforePx?: number; estimatedHeightPx?: number; minHeightPx?: number }>,
  lastScrollDistanceFromBottomPx: number,
  gapPx: number,
  collapseEmptyRows: boolean,
  initialState: { renderedWindow?: { anchorKey: string; count: number }; turnHeightsByKey?: Record<string, number> } | null,
  pixelScale: number,
): RestoreState {
  const layout = computeTurnLayout({
    collapseEmptyRows,
    entries,
    gapPx,
    measuredHeightsByKey: initialState?.turnHeightsByKey ?? EMPTY_MEASUREMENTS,
    pixelScale,
  });
  const clampedDistance = Math.min(lastScrollDistanceFromBottomPx, layout.totalHeightPx);
  const visibleRange = computeVisibleRange({ distanceFromBottomPx: clampedDistance, layout, overscanCount: OVERSCAN_COUNT, viewportHeightPx: RESTORE_VIEWPORT_HEIGHT_PX });
  return {
    distanceFromBottomPx: clampedDistance,
    renderedRange:
      initialState?.renderedWindow == null
        ? visibleRange
        : rangeForAnchor({
            anchorKey: initialState.renderedWindow.anchorKey,
            layout,
            previousRange: { startIndex: 0, endIndex: Math.min(initialState.renderedWindow.count, visibleRange.endIndex - visibleRange.startIndex) },
          }) ?? visibleRange,
    turnKeys: layout.turnKeys,
    viewportHeightPx: RESTORE_VIEWPORT_HEIGHT_PX,
  };
}

/** 范围包含性（原 `nt`）。 */
function rangeContains(outer: { startIndex: number; endIndex: number }, inner: { startIndex: number; endIndex: number }): boolean {
  return outer.startIndex <= inner.startIndex && outer.endIndex >= inner.endIndex;
}

/** 键序等价（原 `it`）。 */
function turnKeysEqual(a: string[], b: string[]): boolean {
  return a === b || (a.length === b.length && a.every((key, index) => key === b[index]));
}

/** 状态和解（原 `tt`）：可复用则复用旧对象（引用稳定）。 */
function reconcileRestoreState({ current, distanceFromBottomPx, layout, viewportHeightPx }: { current: RestoreState; distanceFromBottomPx: number; layout: ReturnType<typeof computeTurnLayout>; viewportHeightPx: number }): RestoreState {
  const clamped = Math.min(distanceFromBottomPx, layout.totalHeightPx);
  const nextRange = computeVisibleRange({ distanceFromBottomPx: clamped, layout, overscanCount: OVERSCAN_COUNT, viewportHeightPx });
  const effectiveRange = rangeContains(current.renderedRange, nextRange) ? current.renderedRange : nextRange;
  return current.distanceFromBottomPx === clamped &&
    current.viewportHeightPx === viewportHeightPx &&
    current.renderedRange.startIndex === effectiveRange.startIndex &&
    current.renderedRange.endIndex === effectiveRange.endIndex &&
    turnKeysEqual(current.turnKeys, layout.turnKeys)
    ? current
    : { distanceFromBottomPx: clamped, renderedRange: effectiveRange, turnKeys: layout.turnKeys, viewportHeightPx };
}

/** 恢复锚定 turn（原 `rt`）。 */
function findRestoreAnchorTurn({
  distanceFromBottomPx,
  layout,
  measuredHeightsByKey,
  nextLayout,
  viewportHeightPx,
}: {
  distanceFromBottomPx: number;
  layout: ReturnType<typeof computeTurnLayout>;
  measuredHeightsByKey: Record<string, number | undefined>;
  nextLayout: ReturnType<typeof computeTurnLayout>;
  viewportHeightPx: number;
}): string | null {
  const range = computeVisibleRange({
    distanceFromBottomPx,
    layout,
    overscanCount: 0,
    viewportHeightPx: Math.max(0, viewportHeightPx + Math.min(0, distanceFromBottomPx)),
  });
  let fallback: string | null = null;
  for (let index = range.startIndex; index < range.endIndex; index += 1) {
    const turnKey = layout.turnKeys[index];
    if (turnKey != null && !layout.gapKeys.has(turnKey) && (!layout.collapseEmptyRows || (layout.heightsPx[index] ?? 0) > 0) && measuredHeightsByKey[turnKey] != null && nextLayout.turnIndexByKey.has(turnKey)) {
      if (distanceFromBottomPx >= 0) return turnKey;
      fallback = turnKey;
    }
  }
  return fallback;
}

/** 保留集测量（原 `ct`）。 */
function pickRestoreMeasurements(measuredHeightsByKey: Record<string, number | undefined>, retainedTurnKeys: string[], range: { startIndex: number; endIndex: number }): { renderedWindow: { anchorKey: string; count: number }; turnHeightsByKey: Record<string, number> } | null {
  const heights: Record<string, number> = {};
  for (const key of retainedTurnKeys) {
    const height = measuredHeightsByKey[key];
    if (height != null) heights[key] = height;
  }
  // 锚定键：首个保留键（原版从 range.startIndex 起的保留集序）。
  const anchorKey = retainedTurnKeys[range.startIndex];
  return Object.keys(heights).length === 0 || anchorKey == null
    ? null
    : { renderedWindow: { anchorKey, count: range.endIndex - range.startIndex }, turnHeightsByKey: heights };
}

// ---------------------------------------------------------------------------
// 滚动目标（原 `ut`/`dt`/`lt` + zoom 换算 `b`）
// ---------------------------------------------------------------------------

/** zoom 换算（原 `b`）。 */
function scalePx(value: number, windowZoom: number): number {
  return windowZoom === 1 ? value : value / windowZoom;
}

/** turn 的滚动距离（原 `ut`）。 */
function scrollDistanceForTurn({ align, layout, turnKey, viewportHeightPx }: { align: "top" | "center"; layout: ReturnType<typeof computeTurnLayout>; turnKey: string; viewportHeightPx: number }): number | null {
  if (align === "center") return centerDistanceForTurn({ layout, turnKey, viewportHeightPx });
  const index = layout.turnIndexByKey.get(turnKey);
  return index == null
    ? null
    : Math.max(0, (layout.bottomOffsetsPx[index] ?? 0) + (layout.heightsPx[index] ?? 0) - TOP_ALIGN_PADDING_PX);
}

/** turn 底部距滚动底（原 `lt`）。 */
function turnBottomDistanceToScrollBottom({ scrollElement, turnElement, windowZoom }: { scrollElement: Element | null; turnElement: Element | null; windowZoom: number }): number {
  return scrollElement == null || turnElement == null ? 0 : scalePx(turnElement.getBoundingClientRect().bottom - scrollElement.getBoundingClientRect().bottom, windowZoom);
}

/** 目标元素的滚动距离（原 `dt`）。 */
function scrollDistanceForTargetElement({
  align,
  layout,
  targetElement,
  turnElement,
  turnKey,
  windowZoom,
  viewportHeightPx,
}: {
  align: "top" | "center";
  layout: ReturnType<typeof computeTurnLayout>;
  targetElement: Element;
  turnElement: Element;
  turnKey: string;
  windowZoom: number;
  viewportHeightPx: number;
}): number | null {
  const index = layout.turnIndexByKey.get(turnKey);
  if (index == null) return null;
  const scrollRect = turnElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const targetTop = scalePx(targetRect.top - scrollRect.top, windowZoom);
  const targetHeight = scalePx(targetRect.height, windowZoom);
  const turnBottom = (layout.bottomOffsetsPx[index] ?? 0) + (layout.heightsPx[index] ?? 0) - targetTop;
  return align === "top" ? Math.max(0, turnBottom - TOP_ALIGN_PADDING_PX) : Math.max(0, turnBottom - targetHeight / 2 - viewportHeightPx / 2);
}

// ---------------------------------------------------------------------------
// 行渲染（原 `$e`）
// ---------------------------------------------------------------------------

/** 行渲染器（原 `$e`，原版经 memo 缓存）。 */
function VirtualizedTurnRow({
  entry,
  gapBeforePx,
  latestTurnFollowContentRef,
  latestTurnFooter,
  RowComponent,
  constrainedHeightPx,
  measuredHeightPx,
  retainedTopPx,
  observeTurnElement,
}: {
  entry: { turnKey: string; minHeightPx?: number };
  gapBeforePx: number;
  latestTurnFollowContentRef: unknown;
  latestTurnFooter: unknown;
  RowComponent: unknown;
  constrainedHeightPx?: number;
  measuredHeightPx?: number;
  retainedTopPx?: number;
  observeTurnElement: (turnKey: string, element: Element | null) => void;
}): unknown {
  const { turnKey } = entry;
  const rowRef = stable((element: Element | null) => observeTurnElement(turnKey, element));
  const isRetained = retainedTopPx != null;
  const classNames = [isRetained && "absolute inset-x-0", constrainedHeightPx != null && "overflow-hidden"].filter(Boolean).join(" ");
  const height = measuredHeightPx ?? constrainedHeightPx;
  const marginTop = retainedTopPx == null ? gapBeforePx : 0;
  const minHeight = measuredHeightPx == null ? entry.minHeightPx : undefined;
  const style: Record<string, unknown> = { height, marginTop, minHeight, top: retainedTopPx };
  const content = jsx.jsx(RowComponent, { entry, latestTurnFooter, latestTurnFollowContentRef });
  const inner = jsx.jsx("div", {
    ref: rowRef,
    className: "[&_[data-virtualized-turn-content]]:[content-visibility:visible]",
    "data-turn-key": turnKey,
    children: content,
  });
  return jsx.jsx("div", { className: classNames, style, children: inner });
}

// ---------------------------------------------------------------------------
// 懒初始化器与兼容导出
// ---------------------------------------------------------------------------

/** 懒初始化器（原 `xt`）：装配常量（幂等；常量已是模块级）。 */
function initializeVirtualizedTurnList(): void {
  if (virtualizedTurnListInitialized) return;
  virtualizedTurnListInitialized = true;
  callInitializer(runtimeLazy);
  callInitializer(intlContextInit);
  reactRuntime = React();
  callInitializer(clsxRuntimeInit);
  callInitializer(iconScaleInit);
  callInitializer(threadScrollContextInit);
  callInitializer(iconScaleContextInit);
  callInitializer(threadVirtualizerInit);
  jsx = jsxRuntime();
  MemoizedVirtualizedTurnRow = reactRuntime.memo(VirtualizedTurnRow);
}

// ---------------------------------------------------------------------------
// 虚拟化主件（原 `Ze`，导出 t）
// ---------------------------------------------------------------------------

/** Ze 的 props（859 行原组件的完整装配面）。 */
interface VirtualizedTurnListProps {
  collapseEmptyRows?: boolean;
  entries: Array<{ turnKey: string; type: "turn" | "gap"; gapBeforePx?: number; estimatedHeightPx?: number; minHeightPx?: number }>;
  RowComponent: unknown;
  onApiChange?: (api: unknown) => void;
  onVisibleContentReady?: () => void;
  className?: string;
  gapPx?: number;
  getBottomScrollPaddingPx?: () => number;
  onLatestTurnHeightChange?: (change: unknown) => void;
  preserveMeasuredTurnViewport?: boolean;
  getPendingRestoreScrollDistanceFromBottomPx?: () => number | null;
  restoreScrollDistanceFromBottomPx?: (() => void) | null;
  initialRestoreState?: { renderedWindow?: { anchorKey: string; count: number }; turnHeightsByKey?: Record<string, number> } | null;
  latestTurnFooter?: unknown;
  latestTurnFooterKey?: string | null;
  onRestoreStateChange?: (state: unknown) => void;
  onViewportChange?: (viewport: unknown) => void;
  latestTurnSynchronousMeasurementKey?: unknown;
  synchronousMeasurementTurnKey?: unknown;
  retainedTurnKeys?: string[];
}

/**
 * VirtualizedTurnList（原 `Ze`，导出 t）：
 * 布局（computeTurnLayout）+ 恢复状态（computeRestoreState/reconcile）+
 * 可见范围（computeVisibleRange）+ 行高测量循环 + 顶部保留行 + 最新 turn
 * footer + onApiChange 回调。
 * 本骨架承载 props 装配与布局管线；React Compiler memo-cache 槽位与测量
 * ResizeObserver 循环在 chunk 级联调时接入。
 */
function VirtualizedTurnList(props: VirtualizedTurnListProps): unknown {
  initializeVirtualizedTurnList();
  const collapseEmptyRows = props.collapseEmptyRows === true;
  const gapPx = props.gapPx ?? DEFAULT_GAP_PX;
  const preserveViewport = props.preserveMeasuredTurnViewport === true;
  const controller = useThreadScrollController() as any;
  const windowZoom = (useIconScaleContext as unknown as () => number)();
  const pixelScale = windowZoom * (globalThis.devicePixelRatio ?? 1);
  const initialHeights = props.initialRestoreState?.turnHeightsByKey ?? EMPTY_MEASUREMENTS;
  const [measuredHeights, setMeasuredHeights] = reactRuntime.useState(initialHeights);
  const [containerElement, setContainerElementState] = reactRuntime.useState(null);
  const createInitialRestoreState = () => computeRestoreState(
    props.entries,
    Math.max(0, controller.getLastScrollDistanceFromBottomPx() - Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0)),
    gapPx,
    collapseEmptyRows,
    props.initialRestoreState ?? null,
    pixelScale,
  );
  const [restoreState, setRestoreState] = reactRuntime.useState(createInitialRestoreState);
  const [pendingTarget, setPendingTarget] = reactRuntime.useState(null);
  const pendingTargetRef = reactRuntime.useRef(null);
  const containerRef = reactRuntime.useRef(null);
  const measuredRef = reactRuntime.useRef(measuredHeights);
  const restoreRef = reactRuntime.useRef(restoreState);
  const observedElements = reactRuntime.useRef(new Map());
  const turnElements = reactRuntime.useRef(new Map());
  const pendingSyncElements = reactRuntime.useRef(new Map());
  const followContentHeights = reactRuntime.useRef(new Map());
  const pendingMeasurement = reactRuntime.useRef(null);
  const resizeObserverRef = reactRuntime.useRef(null);
  const visibleReady = reactRuntime.useRef(false);
  const visibleReadyFrame = reactRuntime.useRef(null);
  const layout = computeTurnLayout({ collapseEmptyRows, entries: props.entries, gapPx, measuredHeightsByKey: measuredHeights, pixelScale });
  const layoutRef = reactRuntime.useRef(layout);
  const effectiveLayoutRef = reactRuntime.useRef(layout);
  const previousLayoutRef = reactRuntime.useRef(layout);
  const layoutBeforeMeasurements = reactRuntime.useRef(null);

  reactRuntime.useLayoutEffect(() => {
    if (measuredHeights !== measuredRef.current) setMeasuredHeights(measuredRef.current);
  }, [props.entries, gapPx, measuredHeights]);
  const setContainerElement = stable((element: HTMLElement | null) => {
    containerRef.current = element;
    setContainerElementState(element);
  });
  const getEffectiveLayout = stable(() => {
    if (layoutRef.current !== layout) {
      layoutRef.current = layout;
      effectiveLayoutRef.current = computeTurnLayout({
        collapseEmptyRows, entries: props.entries, gapPx,
        measuredHeightsByKey: measuredRef.current, pixelScale,
      });
      if (containerRef.current != null) containerRef.current.style.height = `${effectiveLayoutRef.current.totalHeightPx}px`;
    }
    return effectiveLayoutRef.current;
  });

  let renderedRange = restoreState.renderedRange;
  if (pendingTarget != null) {
    const centered = centerDistanceForTurn({ layout, turnKey: pendingTarget.turnKey, viewportHeightPx: restoreState.viewportHeightPx });
    if (centered != null) renderedRange = computeVisibleRange({ distanceFromBottomPx: centered, layout, overscanCount: OVERSCAN_COUNT, viewportHeightPx: restoreState.viewportHeightPx });
  } else if (!turnKeysEqual(restoreState.turnKeys, layout.turnKeys)) {
    const anchor = restoreState.turnKeys[restoreState.renderedRange.startIndex];
    if (anchor != null) renderedRange = rangeForAnchor({ anchorKey: anchor, layout, previousRange: renderedRange }) ?? renderedRange;
  }

  const finishRestore = stable(() => { if (pendingMeasurement.current == null) props.restoreScrollDistanceFromBottomPx?.(); });
  const scheduleVisibleReady = stable(() => {
    if (props.onVisibleContentReady == null || visibleReady.current || visibleReadyFrame.current != null ||
        containerRef.current == null || (props.entries.length > 0 && turnElements.current.size === 0)) return;
    visibleReadyFrame.current = window.requestAnimationFrame(() => {
      visibleReadyFrame.current = window.requestAnimationFrame(() => {
        visibleReadyFrame.current = null;
        if (!visibleReady.current && containerRef.current != null && (props.entries.length === 0 || turnElements.current.size > 0)) {
          visibleReady.current = true; finishRestore(); props.onVisibleContentReady?.();
        }
      });
    });
  });
  const applyMeasurementResult = stable((result: any) => {
    if (result.latestTurnHeightChange != null) props.onLatestTurnHeightChange?.(result.latestTurnHeightChange);
    if (result.restoreScrollDistanceFromBottom) finishRestore();
    else if (result.scrollDistanceFromBottomPx != null) controller.compensateScrollToDistanceFromBottomPx(result.scrollDistanceFromBottomPx);
  });
  const reconcileRange = stable((distance: number, viewportHeight: number) => {
    if (pendingMeasurement.current != null) return;
    const current = restoreRef.current;
    const next = reconcileRestoreState({ current, distanceFromBottomPx: distance, layout: getEffectiveLayout(), viewportHeightPx: viewportHeight });
    if (next !== current) {
      restoreRef.current = next;
      if (next.renderedRange.startIndex !== current.renderedRange.startIndex ||
          next.renderedRange.endIndex !== current.renderedRange.endIndex ||
          !turnKeysEqual(next.turnKeys, current.turnKeys)) setRestoreState(next);
    }
  });
  const reportViewport = stable((distance: number, viewportHeight: number) => {
    if (props.onViewportChange == null) return;
    const currentLayout = getEffectiveLayout();
    const end = Math.max(0, Math.min(currentLayout.totalHeightPx, currentLayout.totalHeightPx - distance));
    props.onViewportChange({ viewportEndPx: end, viewportStartPx: Math.max(0, end - viewportHeight) });
  });
  const completeTarget = stable((target: any) => {
    queueMicrotask(() => {
      if (pendingTargetRef.current === target) {
        target.complete(); pendingTargetRef.current = null;
      }
      setPendingTarget((current: any) => current === target ? null : current);
    });
  });
  const scrollToKey = stable((turnKey: string, getTargetElement?: (element: HTMLElement) => HTMLElement | null, options?: { align?: "top" | "center"; signal?: AbortSignal }) => {
    if (options?.signal?.aborted) return Promise.resolve();
    pendingTargetRef.current?.complete();
    return new Promise<void>(resolve => {
      let target: any;
      const abort = () => {
        if (pendingTargetRef.current === target) {
          pendingTargetRef.current = null;
          setPendingTarget((current: any) => current === target ? null : current);
          target.complete();
        }
      };
      target = {
        align: options?.align ?? "center", getTargetElement, turnKey,
        complete() { options?.signal?.removeEventListener("abort", abort); resolve(); },
      };
      pendingTargetRef.current = target;
      setRestoreState(restoreRef.current);
      setPendingTarget(target);
      options?.signal?.addEventListener("abort", abort, { once: true });
    });
  });
  const getEntryGeometry = stable((turnKey: string) => {
    const current = getEffectiveLayout();
    const index = current.turnIndexByKey.get(turnKey);
    if (index == null) return null;
    const start = current.topOffsetsPx[index], height = current.heightsPx[index];
    return start == null || height == null ? null : { endPx: start + height, startPx: start };
  });
  const reportFollowContent = stable(() => {
    let followContentHeightPx = 0;
    let lastElement: Element | null = null;
    for (const [element, height] of followContentHeights.current) {
      followContentHeightPx += height;
      if (lastElement == null || lastElement.compareDocumentPosition(element) === Node.DOCUMENT_POSITION_FOLLOWING) lastElement = element;
    }
    if (lastElement != null) props.onLatestTurnHeightChange?.({
      heightDeltaPx: null, heightPx: null,
      bottomViewportOverflowPx: turnBottomDistanceToScrollBottom({ scrollElement: controller.getScrollElement(), turnElement: lastElement, windowZoom }),
      turnElement: lastElement, followContentHeightPx,
    });
  });

  const updateMeasurements = stable((updates: Map<string, { element: HTMLElement; heightPx: number }>, flush = true) => {
    const currentLayout = getEffectiveLayout();
    const pending = pendingMeasurement.current;
    const previousHeights = measuredRef.current;
    let nextHeights = previousHeights;
    let latestHeightDelta = 0;
    let latestChanged = false;
    let latestElement: HTMLElement | null = null;
    let viewportDelta = 0;
    let collapsedGapChanged = false;
    const rawDistance = controller.getLastScrollDistanceFromBottomPx();
    const padding = Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0);
    const adjustedDistance = Math.max(0, rawDistance - padding);
    const pendingRestoreDistance = preserveViewport ? null : (props.getPendingRestoreScrollDistanceFromBottomPx?.() ?? null);
    const anchorDistance = pending == null ? adjustedDistance : restoreRef.current.distanceFromBottomPx;
    let compensationAnchor = anchorDistance;
    if (preserveViewport && pendingTargetRef.current == null && props.getPendingRestoreScrollDistanceFromBottomPx?.() == null) {
      const anchorKey = findRestoreAnchorTurn({
        distanceFromBottomPx: (pending?.scrollDistanceFromBottomPx ?? rawDistance) - padding,
        layout: currentLayout, measuredHeightsByKey: previousHeights, nextLayout: currentLayout,
        viewportHeightPx: restoreRef.current.viewportHeightPx,
      });
      const anchorIndex = anchorKey == null ? null : currentLayout.turnIndexByKey.get(anchorKey);
      if (anchorIndex != null) compensationAnchor = currentLayout.bottomOffsetsPx[anchorIndex] ?? anchorDistance;
    }
    for (const [turnKey, update] of updates) {
      if (turnElements.current.get(turnKey) !== update.element) continue;
      const measured = Math.max(+!collapseEmptyRows, update.heightPx);
      const previous = previousHeights[turnKey];
      if (previous === measured) continue;
      if (nextHeights === previousHeights) nextHeights = { ...previousHeights };
      nextHeights[turnKey] = measured;
      const index = currentLayout.turnIndexByKey.get(turnKey);
      if (index == null) continue;
      const isLatest = index === currentLayout.turnKeys.length - 1;
      const constrained = Math.round(Math.max(props.entries[index]?.minHeightPx ?? 0, measured) * pixelScale) / pixelScale;
      const delta = constrained - (currentLayout.heightsPx[index] ?? constrained);
      if (isLatest) {
        latestChanged = true; latestHeightDelta += previous == null ? 0 : delta; latestElement = update.element;
      }
      if (collapseEmptyRows && (constrained === 0 || currentLayout.heightsPx[index] === 0)) collapsedGapChanged = true;
      const bottomOffset = currentLayout.bottomOffsetsPx[index] ?? 0;
      if (delta !== 0 && bottomOffset <= compensationAnchor && (preserveViewport || (props.getPendingRestoreScrollDistanceFromBottomPx != null && !isLatest))) viewportDelta += delta;
    }
    if (nextHeights === previousHeights) return false;
    const nextLayout = computeTurnLayout({ collapseEmptyRows, entries: props.entries, gapPx, measuredHeightsByKey: nextHeights, pixelScale });
    if (collapsedGapChanged) {
      for (let index = 0; index < nextLayout.gapsBeforePx.length; index++) {
        const gapDelta = (nextLayout.gapsBeforePx[index] ?? 0) - (currentLayout.gapsBeforePx[index] ?? 0);
        if (gapDelta !== 0 &&
            (currentLayout.bottomOffsetsPx[index] ?? 0) + (currentLayout.heightsPx[index] ?? 0) <= compensationAnchor &&
            (preserveViewport || (props.getPendingRestoreScrollDistanceFromBottomPx != null && index !== currentLayout.turnKeys.length - 1))) viewportDelta += gapDelta;
      }
    }
    const nearBottom = preserveViewport && rawDistance <= (padding > 0 ? 0 : 24);
    const restoreDistance = pending?.restoreScrollDistanceFromBottom || pendingRestoreDistance != null;
    let compensatedDistance: number | null = null;
    if (!restoreDistance) {
      compensatedDistance = nearBottom ? 0 : viewportDelta === 0
        ? (pending?.scrollDistanceFromBottomPx ?? null)
        : (pending?.scrollDistanceFromBottomPx ?? controller.getUnroundedScrollDistanceFromBottomPx(rawDistance)) + viewportDelta;
    }
    let stateDistance = restoreRef.current.distanceFromBottomPx;
    if (restoreDistance) stateDistance = pendingRestoreDistance ?? stateDistance;
    else if (compensatedDistance != null) stateDistance = Math.max(0, compensatedDistance - padding);
    const nextRestoreState = reconcileRestoreState({
      current: restoreRef.current, distanceFromBottomPx: stateDistance,
      layout: nextLayout, viewportHeightPx: restoreRef.current.viewportHeightPx,
    });
    const priorLatest = pending?.latestTurnHeightChange;
    const turnElement = latestElement ?? priorLatest?.turnElement ?? null;
    const result = {
      latestTurnHeightChange: latestChanged || priorLatest != null ? {
        heightDeltaPx: (priorLatest?.heightDeltaPx ?? 0) + latestHeightDelta,
        heightPx: nextLayout.heightsPx.at(-1) ?? null,
        bottomViewportOverflowPx: turnBottomDistanceToScrollBottom({ scrollElement: controller.getScrollElement(), turnElement, windowZoom }),
        turnElement, followContentHeightPx: null,
      } : null,
      restoreScrollDistanceFromBottom: restoreDistance,
      scrollDistanceFromBottomPx: compensatedDistance,
      turnHeightsByKey: nextHeights,
    };
    const container = containerRef.current;
    if (latestChanged && updates.size === 1 && pending == null && nextRestoreState === restoreRef.current &&
        nextLayout.gapsBeforePx.at(-1) === currentLayout.gapsBeforePx.at(-1) && container != null) {
      measuredRef.current = nextHeights;
      effectiveLayoutRef.current = nextLayout;
      previousLayoutRef.current = nextLayout;
      if (latestElement?.parentElement != null) {
        latestElement.parentElement.style.height = `${nextLayout.heightsPx.at(-1)}px`;
        latestElement.parentElement.style.minHeight = "";
      }
      container.style.height = `${nextLayout.totalHeightPx}px`;
      applyMeasurementResult(result);
      return true;
    }
    layoutBeforeMeasurements.current ??= currentLayout;
    const commit = () => {
      measuredRef.current = nextHeights; effectiveLayoutRef.current = nextLayout;
      setMeasuredHeights(nextHeights);
      if (nextRestoreState !== restoreRef.current) { restoreRef.current = nextRestoreState; setRestoreState(nextRestoreState); }
    };
    pendingMeasurement.current = result;
    if (preserveViewport && nextLayout.totalHeightPx !== currentLayout.totalHeightPx && viewportDelta === 0 && !nearBottom && !restoreDistance) {
      controller.preserveScrollPositionForNextLayout();
    }
    if (flush) (clsxRuntimeInit as unknown as () => { flushSync(callback: () => void): void })().flushSync(commit); else commit();
    return true;
  });

  const getResizeObserver = stable(() => {
    if (resizeObserverRef.current != null) return resizeObserverRef.current;
    const observer = new ResizeObserver(entries => {
      const updates = new Map();
      let followChanged = false;
      for (const entry of entries) {
        const observed = observedElements.current.get(entry.target);
        if (observed == null) continue;
        const height = resizeEntryBounds(entry).height;
        if (observed.kind === "turn") updates.set(observed.turnKey, { element: entry.target, heightPx: height });
        else { followContentHeights.current.set(observed.element, height); followChanged = true; }
      }
      updateMeasurements(updates);
      if (followChanged) reportFollowContent();
    });
    resizeObserverRef.current = observer;
    return observer;
  });
  const observeTurnElement = stable((turnKey: string, element: HTMLElement | null) => {
    if (element == null) return;
    observedElements.current.set(element, { kind: "turn", turnKey });
    turnElements.current.set(turnKey, element);
    pendingSyncElements.current.set(turnKey, element);
    const observer = getResizeObserver();
    observer.observe(element);
    scheduleVisibleReady();
    return () => {
      observer.unobserve(element); observedElements.current.delete(element);
      if (pendingSyncElements.current.get(turnKey) === element) pendingSyncElements.current.delete(turnKey);
      if (turnElements.current.get(turnKey) === element) turnElements.current.delete(turnKey);
    };
  });
  const measureSynchronousTurn = stable(() => {
    const turnKey = props.synchronousMeasurementTurnKey ?? props.entries.at(-1)?.turnKey;
    if (turnKey == null) return;
    const element = turnElements.current.get(turnKey);
    if (element == null) return;
    const height = scalePx(element.getBoundingClientRect().height, windowZoom);
    if (height > 0) updateMeasurements(new Map<string, { element: HTMLElement; heightPx: number }>([[turnKey as string, { element: element as HTMLElement, heightPx: height }]]), false);
  });
  const observeFollowContent = stable((element: HTMLElement | null) => {
    if (element == null) return;
    observedElements.current.set(element, { element, kind: "latest-turn-follow-content" });
    followContentHeights.current.set(element, 0);
    const observer = getResizeObserver(); observer.observe(element);
    return () => { observer.unobserve(element); observedElements.current.delete(element); followContentHeights.current.delete(element); };
  });
  reactRuntime.useLayoutEffect(() => {
    const pending = pendingSyncElements.current;
    if (pending.size === 0) return;
    pendingSyncElements.current = new Map();
    const updates = new Map();
    for (const [turnKey, element] of pending) {
      if (turnElements.current.get(turnKey) !== element) continue;
      const height = scalePx(element.getBoundingClientRect().height, windowZoom);
      if (height > 0) updates.set(turnKey, { element, heightPx: height });
    }
    if (updates.size > 0 && updateMeasurements(updates, false)) {
      for (const [turnKey, element] of pending) if (turnElements.current.get(turnKey) === element) pendingSyncElements.current.set(turnKey, element);
    }
  });
  reactRuntime.useLayoutEffect(() => { if (props.latestTurnSynchronousMeasurementKey != null) measureSynchronousTurn(); }, [props.latestTurnSynchronousMeasurementKey, measureSynchronousTurn]);
  reactRuntime.useLayoutEffect(() => {
    const result = pendingMeasurement.current;
    if (result != null && result.turnHeightsByKey === measuredHeights) {
      pendingMeasurement.current = null; applyMeasurementResult(result);
    }
  }, [applyMeasurementResult, measuredHeights]);
  reactRuntime.useEffect(() => {
    props.onApiChange?.({ getEntryGeometry, scrollToKey });
    return () => props.onApiChange?.(null);
  }, [getEntryGeometry, props.onApiChange, scrollToKey]);
  reactRuntime.useEffect(() => {
    scheduleVisibleReady();
    return () => { if (visibleReadyFrame.current != null) window.cancelAnimationFrame(visibleReadyFrame.current); visibleReadyFrame.current = null; };
  }, [props.entries.length, props.onVisibleContentReady, scheduleVisibleReady, containerElement]);
  reactRuntime.useEffect(() => () => {
    resizeObserverRef.current?.disconnect(); resizeObserverRef.current = null;
    observedElements.current.clear(); turnElements.current.clear(); pendingSyncElements.current.clear(); followContentHeights.current.clear();
    pendingMeasurement.current = null; pendingTargetRef.current?.complete(); pendingTargetRef.current = null;
  }, []);
  reactRuntime.useLayoutEffect(() => {
    if (props.onRestoreStateChange != null) return () => props.onRestoreStateChange?.(
      pickRestoreMeasurements(measuredRef.current, restoreRef.current.turnKeys, restoreRef.current.renderedRange),
    );
  }, [props.onRestoreStateChange]);

  reactRuntime.useLayoutEffect(() => {
    const element = controller.getScrollElement();
    if (element == null) return;
    const viewportHeight = () => element.clientHeight || restoreRef.current.viewportHeightPx || RESTORE_VIEWPORT_HEIGHT_PX;
    const removeScroll = controller.addScrollListener((distance: number) => reconcileRange(
      Math.max(0, distance - Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0)), viewportHeight(),
    ));
    const removeUser = controller.addUserScrollListener((distance: number) => reportViewport(
      Math.max(0, distance - Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0)), viewportHeight(),
    ));
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]; if (entry == null) return;
      const height = resizeEntryBounds(entry).height;
      reconcileRange(restoreRef.current.distanceFromBottomPx, height); finishRestore();
    });
    observer.observe(element);
    return () => { removeScroll(); removeUser(); observer.disconnect(); };
  }, [controller.addScrollListener, controller.addUserScrollListener, controller.getScrollElement, finishRestore, props.getBottomScrollPaddingPx, reportViewport, reconcileRange, containerElement]);

  reactRuntime.useLayoutEffect(() => {
    const target = pendingTarget;
    if (target == null || pendingTargetRef.current !== target) return;
    const scrollElement = controller.getScrollElement(); if (scrollElement == null) return;
    const updates = new Map();
    for (const [turnKey, element] of turnElements.current) {
      const height = scalePx(element.getBoundingClientRect().height, windowZoom);
      if (height > 0) updates.set(turnKey, { element, heightPx: height });
    }
    if (updateMeasurements(updates, false) || pendingMeasurement.current != null) return;
    const turnElement = turnElements.current.get(target.turnKey);
    const targetElement = turnElement == null ? null : (target.getTargetElement?.(turnElement) ?? turnElement);
    const distance = turnElement == null || targetElement == null
      ? scrollDistanceForTurn({ align: target.align, layout, turnKey: target.turnKey, viewportHeightPx: scrollElement.clientHeight })
      : scrollDistanceForTargetElement({ align: target.align, layout, targetElement, turnElement, turnKey: target.turnKey, viewportHeightPx: scrollElement.clientHeight, windowZoom });
    if (distance == null) { completeTarget(target); return; }
    const padding = Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0);
    controller.scrollToDistanceFromBottomPx(distance + padding, "instant", "user");
    reconcileRange(distance, scrollElement.clientHeight);
    completeTarget(target);
  }, [completeTarget, controller, layout, pendingTarget, props.getBottomScrollPaddingPx, reconcileRange, updateMeasurements, windowZoom]);

  reactRuntime.useLayoutEffect(() => {
    if (pendingMeasurement.current != null) return;
    const previousLayout = previousLayoutRef.current;
    const currentLayout = getEffectiveLayout();
    const nextLayout = layoutBeforeMeasurements.current ?? currentLayout;
    layoutBeforeMeasurements.current = null;
    previousLayoutRef.current = currentLayout;
    if (!preserveViewport || pendingTarget != null || previousLayout === nextLayout) return;
    const padding = Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0);
    const rawDistance = controller.getLastScrollDistanceFromBottomPx();
    const adjusted = Math.max(0, rawDistance - padding);
    if ((props.getPendingRestoreScrollDistanceFromBottomPx?.() ?? null) != null || rawDistance <= (padding > 0 ? 0 : 24)) return;
    const anchor = findRestoreAnchorTurn({
      distanceFromBottomPx: rawDistance - padding, layout: previousLayout,
      measuredHeightsByKey: measuredRef.current, nextLayout, viewportHeightPx: restoreRef.current.viewportHeightPx,
    });
    if (anchor == null) return;
    const nextDistance = distanceForAnchor({ anchorKey: anchor, distanceFromBottomPx: adjusted, nextLayout, previousLayout });
    if (nextDistance != null && nextDistance !== adjusted) {
      reconcileRange(nextDistance, restoreRef.current.viewportHeightPx);
      controller.compensateScrollToDistanceFromBottomPx(controller.getUnroundedScrollDistanceFromBottomPx(rawDistance) + nextDistance - adjusted);
    }
  }, [controller, getEffectiveLayout, pendingTarget, preserveViewport, props.getBottomScrollPaddingPx, props.getPendingRestoreScrollDistanceFromBottomPx, reconcileRange, layout]);
  reactRuntime.useLayoutEffect(() => {
    if (pendingTarget == null && pendingMeasurement.current == null) {
      reconcileRange(restoreRef.current.distanceFromBottomPx, restoreRef.current.viewportHeightPx);
      finishRestore();
      reportViewport(restoreRef.current.distanceFromBottomPx, restoreRef.current.viewportHeightPx);
    }
  }, [finishRestore, layout, pendingTarget, reconcileRange, reportViewport]);

  const latestFooterKey = props.latestTurnFooterKey ?? props.entries.at(-1)?.turnKey;
  const rows = props.entries.slice(renderedRange.startIndex, renderedRange.endIndex)
    .map((entry, offset) => ({ entry, turnIndex: renderedRange.startIndex + offset }));
  for (const turnKey of new Set(props.retainedTurnKeys ?? [])) {
    const index = layout.turnIndexByKey.get(turnKey);
    if (index == null || (index >= renderedRange.startIndex && index < renderedRange.endIndex)) continue;
    const entry = props.entries[index]; if (entry != null) rows.push({ entry, turnIndex: index });
  }
  rows.sort((left, right) => left.turnIndex - right.turnIndex);
  const className = intlMessage("relative shrink-0", props.className);
  const outerStyle = { height: layout.totalHeightPx };
  const innerStyle = { marginTop: `${layout.topOffsetsPx[renderedRange.startIndex] ?? 0}px` };
  const rowNodes = rows.map(({ entry, turnIndex }) => jsx.jsx(MemoizedVirtualizedTurnRow, {
    entry,
    gapBeforePx: turnIndex === renderedRange.startIndex ? 0 : (layout.gapsBeforePx[turnIndex] ?? 0),
    retainedTopPx: turnIndex < renderedRange.startIndex || turnIndex >= renderedRange.endIndex ? layout.topOffsetsPx[turnIndex] : undefined,
    latestTurnFollowContentRef: turnIndex === props.entries.length - 1 && props.onLatestTurnHeightChange != null ? observeFollowContent : undefined,
    latestTurnFooter: entry.turnKey === latestFooterKey ? props.latestTurnFooter : undefined,
    RowComponent: props.RowComponent,
    measuredHeightPx: measuredHeights[entry.turnKey] == null ? undefined : layout.heightsPx[turnIndex],
    constrainedHeightPx: turnIndex !== props.entries.length - 1 && pendingTarget?.turnKey !== entry.turnKey && measuredHeights[entry.turnKey] == null ? layout.heightsPx[turnIndex] : undefined,
    observeTurnElement,
  }, entry.turnKey));
  return jsx.jsx("div", {
    ref: setContainerElement, className, style: outerStyle,
    children: jsx.jsx("div", { className: "flex flex-col", style: innerStyle, children: rowNodes }),
  });
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约，14 个全部对齐）
// ---------------------------------------------------------------------------

/** We（导出 a）：useThreadPanelWidthEffects——宽度变化同步面板形态。 */
function useThreadPanelWidthEffects(panelScope: unknown, mainContentTargetWidth: unknown): void {
  initializePanelLayer();
  initializePanelWidthEffects();
  const useSignal = createQuerySubscriberStore as unknown as (signal: unknown) => any;
  const layoutDependency = useSignal((initialChunk as any)._bt);
  const widthDependency = useSignal((initialChunk as any).ybt);
  const context = reactRuntime.useContext((initialChunk as any).uxt);
  const createSignal = readAtomSignal as unknown as (value: number) => { get(): number };
  const fallback = createSignal(0);
  const widthSignal = (mainContentTargetWidth as any) ?? context?.mainContentTargetWidth ?? fallback;
  const update = stable((width: number) => setPanelDisplayMode(panelScope as any, panelDisplayModeAtom, width));
  (subscribeAtomSignal as unknown as (signal: unknown, event: string, listener: (value: number) => void) => void)(widthSignal, "change", update);
  reactRuntime.useLayoutEffect(() => {
    setPanelDisplayMode(panelScope as any, panelDisplayModeAtom, widthSignal.get());
  }, [layoutDependency, widthDependency, widthSignal, panelScope]);
  reactRuntime.useLayoutEffect(() => () => {
    (panelScope as any).set(panelDisplayModeAtom, closePopoverState);
  }, [panelScope]);
}

/** Ve（导出 c）：面板状态初始化器。 */
let panelSurfaceInitialized = false;
let panelDisplayModeAtom: any;
let panelIsVisibleFamily: any;
function initializePanelSurfaceState(): void {
  if (panelSurfaceInitialized) return;
  panelSurfaceInitialized = true;
  callInitializer(panelWidthAtomInit);
  callInitializer((initialChunk as any).Ebt);
  callInitializer(i18nInit);
  callInitializer((initialChunk as any).itn);
  callInitializer((initialChunk as any).iyt);
  const defaultState = { displayMode: "overlay", isPopoverOpen: false };
  panelDisplayModeAtom = (createDerivedFamily as unknown as (root: unknown, value: unknown) => unknown)(usePanelSurfaceApi, defaultState);
  panelIsVisibleFamily = (createSignalFamily as unknown as (root: unknown, derive: Function) => unknown)(
    panelLayerLazy,
    (key: unknown, { get }: { get(signal: unknown, parameter?: unknown): any }) => {
      if (get((initialChunk as any).uyt)) return false;
      const normalize = (initialChunk as any).wbt as (value: unknown, key: unknown) => boolean;
      const pinned = normalize(key === true ? get((initialChunk as any).Fbt) : get((initialChunk as any).Dbt, key), key);
      const state = get(panelDisplayModeAtom);
      return panelSurfaceState({
        displayMode: state.displayMode,
        isPinned: pinned,
        isPopoverOpen: state.isPopoverOpen || (typeof key !== "boolean" && pinned),
      }).visibleSurface != null;
    },
  );
}

/** Me（导出 d）：DynamicIsle 分页列表。 */
function DynamicIslePaginatedList(props: unknown): unknown {
  initializeDynamicIsleComponents();
  return jsx.jsx(panelComponentLazy, { ...(props as Record<string, unknown>), renderPagination: ViewMorePagination });
}
function ViewMorePagination({ nextRevealCount, isExpanded, onToggle }: { nextRevealCount: number; isExpanded: boolean; onToggle(): void }): unknown {
  const Button = (initialChunk as any).TS;
  const ButtonIcon = (initialChunk as any).DS;
  const ButtonLabel = (initialChunk as any).ES;
  return jsx.jsxs(Button, {
    "aria-expanded": isExpanded, tone: "tertiary", onClick: onToggle,
    children: [
      jsx.jsx(ButtonIcon, { variant: "custom", children: jsx.jsx(IconAsset, { asset: panelIsPinnedAtomInit }) }),
      jsx.jsx(ButtonLabel, { children: isExpanded
        ? jsx.jsx(FormattedMessage, { id: "codex.dynamicIsle.viewLess", defaultMessage: "View less", description: "Collapse a Dynamic Isle section's full list back to its initial rows" })
        : jsx.jsx(FormattedMessage, { id: "codex.dynamicIsle.viewMore", defaultMessage: "View {count, number} more", description: "Expand a Dynamic Isle section to show more items. Count is the number of additional items that the next click will reveal.", values: { count: nextRevealCount } }),
      }),
    ],
  });
}

/** Fe（导出 f）：DynamicIsle 组件初始化器。 */
let dynamicIsleComponentsInitialized = false;
function initializeDynamicIsleComponents(): void {
  if (dynamicIsleComponentsInitialized) return;
  dynamicIsleComponentsInitialized = true;
  callInitializer(runtimeLazy); callInitializer(panelIsPinnedFamilyInit); callInitializer(springRuntimeInit);
  callInitializer(iconRuntimeInit); callInitializer((initialChunk as any).wS); callInitializer((initialChunk as any).OS);
  jsx ??= jsxRuntime();
}

/** Z（导出 i）：useThreadPanelContentShift——内容位移动画 hook。 */
function useThreadPanelContentShift(options?: { contentShiftResetKey?: unknown; isEnabled?: boolean; isFloatingPanelOpen?: boolean; pinStateKey?: unknown }): {
  contentShift: unknown;
  shouldHideInlineImmediately: boolean;
  shouldShow: boolean;
  visibleSurface: "inline" | "popover" | null;
} {
  initializePanelLayer();
  const { contentShiftResetKey, isEnabled = true, isFloatingPanelOpen = false, pinStateKey = true } = options ?? {};
  const useSignal = createQuerySubscriberStore as unknown as (signal: unknown) => any;
  const useKeyedSignal = appSharedLazyInit as unknown as (signal: unknown, key: unknown) => any;
  const scope = (usePanelWidthContext as unknown as (root: unknown) => any)(usePanelSurfaceApi);
  const batch = (createAtomApi as unknown as () => (callback: () => void) => void)();
  const id = reactRuntime.useId();
  const globalPinned = useSignal(pinStateKey === true ? (initialChunk as any).Fbt : null);
  const keyedPinned = useKeyedSignal(pinStateKey === true ? null : (initialChunk as any).Dbt, pinStateKey !== true && pinStateKey);
  const normalize = (initialChunk as any).wbt as (value: unknown, key: unknown) => boolean;
  const isPinned = normalize(pinStateKey === true ? globalPinned : keyedPinned, pinStateKey);
  const sessionChanged = useSignal((initialChunk as any).gbt);
  const routeChanged = useSignal((initialChunk as any).Jbt);
  const layoutDependency = useSignal((initialChunk as any)._bt);
  const hidePanel = useSignal((initialChunk as any).uyt);
  const widthDependency = useSignal((initialChunk as any).ybt);
  const displayState = useSignal(panelDisplayModeAtom);
  const inlinePinned = isEnabled && isPinned;
  const effectivePinned = inlinePinned || isFloatingPanelOpen;
  const popoverOpen = isEnabled && (displayState.isPopoverOpen || (typeof pinStateKey !== "boolean" && isPinned));
  const disableAnimation = useSignal((initialChunk as any).Ukt);
  const context = reactRuntime.useContext((initialChunk as any).uxt);
  const createSignal = readAtomSignal as unknown as (value: number) => any;
  const fallbackWidth = createSignal(0);
  const mainWidth = context?.mainContentTargetWidth ?? fallbackWidth;
  const shift = createSignal(contentShiftForPanel({ isPinned: effectivePinned, mainContentTargetWidth: mainWidth.get() }));
  const animationRef = reactRuntime.useRef(null);
  const lastTarget = reactRuntime.useRef(shift.get());
  const resetKeyRef = reactRuntime.useRef(contentShiftResetKey);
  const sessionRef = reactRuntime.useRef(sessionChanged);
  const routeRef = reactRuntime.useRef(routeChanged);
  const surface = panelSurfaceState({ displayMode: displayState.displayMode, isPinned: inlinePinned, isPopoverOpen: popoverOpen });
  const shouldShow = surface.shouldShow && !hidePanel;
  const panelWidth = createSignal(shouldShow ? PANEL_WIDTH_PX : 0);
  const publishWidth = stable((value: number) => {
    (setPanelDisplayModeEffect as unknown as (scope: unknown, id: string, value: number | null) => void)(scope, id, value);
  });
  (subscribeAtomSignal as unknown as Function)(panelWidth, "change", publishWidth);
  reactRuntime.useLayoutEffect(() => {
    publishWidth(panelWidth.get());
    return () => publishWidth(null as any);
  }, [scope, panelWidth, id]);
  reactRuntime.useEffect(() => {
    const target = shouldShow ? PANEL_WIDTH_PX : 0;
    if (panelWidth.get() === target) return;
    const animation = animatePanelSignal(panelWidth, target, disableAnimation);
    return () => animation?.stop();
  }, [shouldShow, disableAnimation, panelWidth]);
  reactRuntime.useLayoutEffect(() => {
    const sessionDidChange = sessionRef.current !== sessionChanged;
    const routeDidChange = routeRef.current !== routeChanged;
    if (resetKeyRef.current === contentShiftResetKey && !sessionDidChange && !routeDidChange) return;
    resetKeyRef.current = contentShiftResetKey; sessionRef.current = sessionChanged; routeRef.current = routeChanged;
    const target = contentShiftForPanel({ isPinned: effectivePinned, mainContentTargetWidth: mainWidth.get() });
    lastTarget.current = target; animationRef.current?.stop();
    if (sessionDidChange) batch(() => shift.set(target)); else shift.jump(target);
  }, [shift, contentShiftResetKey, routeChanged, effectivePinned, mainWidth, sessionChanged, batch]);
  const updateShift = stable((width: number) => {
    const target = contentShiftForPanel({ isPinned: effectivePinned, mainContentTargetWidth: width });
    if (lastTarget.current !== target) {
      lastTarget.current = target; animationRef.current?.stop();
      animationRef.current = animatePanelSignal(shift, target, disableAnimation);
    }
  });
  (subscribeAtomSignal as unknown as Function)(mainWidth, "change", updateShift);
  reactRuntime.useEffect(() => {
    const target = contentShiftForPanel({ isPinned: effectivePinned, mainContentTargetWidth: mainWidth.get() });
    if (lastTarget.current !== target) {
      lastTarget.current = target; animationRef.current?.stop();
      animationRef.current = animatePanelSignal(shift, target, disableAnimation);
    }
  }, [shift, effectivePinned, layoutDependency, widthDependency, mainWidth, disableAnimation]);
  reactRuntime.useEffect(() => () => animationRef.current?.stop(), []);
  return {
    contentShift: shift,
    shouldHideInlineImmediately: surface.shouldHideInlineImmediately || hidePanel,
    shouldShow,
    visibleSurface: hidePanel ? null : surface.visibleSurface,
  };
}
function animatePanelSignal(signal: any, target: number, disableAnimation: unknown): { stop(): void } | null {
  return disableAnimation ? (signal.set(target), null)
    : (dropdownMenuInit as unknown as (signal: unknown, target: number, preset: unknown) => { stop(): void })(signal, target, (initialChunk as any).lxt);
}

/** Be（导出 l）：面板可见性 signal family。 */

/** q（导出 m）：DynamicIsle 运行时初始化器。 */
let dynamicIsleRuntimeInitialized = false;
function initializeDynamicIsleRuntime(): void {
  if (dynamicIsleRuntimeInitialized) return;
  dynamicIsleRuntimeInitialized = true;
  callInitializer(runtimeLazy); callInitializer(panelWidthAtomInit); callInitializer(compactMenuInit);
  callInitializer((initialChunk as any).gyt); callInitializer((initialChunk as any).xS);
  jsx ??= jsxRuntime();
}

/** He（导出 o）：附件 URL 兜底。 */
function attachFallbackUrl(attachment: { url?: string } & Record<string, unknown>, fallbackUrl: string | null): unknown {
  const url = attachment.url ?? fallbackUrl;
  return url == null ? null : (initialChunk as any).Oin({ ...attachment, url }, fallbackUrl);
}

/** G（导出 p）：DynamicIsleContent 容器。 */
function DynamicIsleContent(props: { children?: unknown }): unknown {
  initializeDynamicIsleRuntime();
  const leadingContent = (createQuerySubscriberStore as unknown as (signal: unknown) => unknown)((initialChunk as any)._yt);
  return jsx.jsxs((panelContentSurface as any).Content, {
    className: "text-default select-none", variant: "dynamic-isle", children: [leadingContent, props.children],
  });
}

/** Xe（导出 r）：面板层初始化器。 */
let panelLayerInitialized = false;
function initializePanelLayer(): void {
  if (panelLayerInitialized) return;
  panelLayerInitialized = true;
  for (const candidate of [runtimeLazy, atomWriteApi, panelPresetInit, effectApi, writeAtomSignal, panelWidthAtomInit]) callInitializer(candidate);
  reactRuntime ??= React();
  for (const candidate of [
    (initialChunk as any).fxt, (initialChunk as any).qbt, (initialChunk as any).Ebt,
    toastRuntimeInit, i18nInit, (initialChunk as any).Hkt, (initialChunk as any).iyt,
  ]) callInitializer(candidate);
  initializePanelSurfaceState();
}

/** Ue（导出 s）：面板宽度效应初始化器。 */
let panelWidthEffectsInitialized = false;
function initializePanelWidthEffects(): void {
  if (panelWidthEffectsInitialized) return;
  panelWidthEffectsInitialized = true;
  callInitializer((initialChunk as any).Ain);
}

export {
  useThreadPanelWidthEffects as a,
  initializePanelSurfaceState as c,
  DynamicIslePaginatedList as d,
  initializeDynamicIsleComponents as f,
  useThreadPanelContentShift as i,
  panelIsVisibleFamily as l,
  initializeDynamicIsleRuntime as m,
  initializeVirtualizedTurnList as n,
  attachFallbackUrl as o,
  DynamicIsleContent as p,
  initializePanelLayer as r,
  initializePanelWidthEffects as s,
  VirtualizedTurnList as t,
  panelDisplayModeAtom as u,
};
