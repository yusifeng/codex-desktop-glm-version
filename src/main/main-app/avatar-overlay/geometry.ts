// avatar overlay 几何/磁吸（原版 15,271-15,673 区段 + 18,090-18,167 的
// 窗口/显示辅助函数）。
//
// 职责：
//   - 光标跟踪（CursorTracker，原 cle/lle）：cursorSource（native/renderer）、
//     跨屏判定、渲染器 throw 抑制；
//   - dock 磁吸物理（原 Hu/sle）；
//   - 布局计算（原 mle 及其闭包子函数 Qu/$u/hle/gle/ed/td/nd/_le/vle/yle/
//     ble/rd/id/ad/od）：视口、tray、吉祥物相对坐标与 native draw 窗口边界；
//   - 显示/窗口辅助（原 bd/xd/Sd/Cd/Ule/wd/Wle/Gle/Td/Kle/Ed/Dd/Od/kd/qle/
//     Jle/Ad/Yle/jd/Xu/Zu/sd/cd）。
//
// 模块加载期副作用：无（纯函数 + 纯类）。

import { screen } from "electron";
import {
  DOCK_ACCELERATION_RADIUS_PX,
  DOCK_DISTANCE_PX,
  DOCK_MAX_ACCELERATION,
  DOCK_COSINE_THRESHOLD,
  GLASS_MARGINS,
  CAPTION_GAP_PX,
  ELEMENT_GAP_PX,
  DOCKED_PIP_STACK_GAP_PX,
  CAPTION_RESERVE_PX,
  NATIVE_INSET_PX,
  SPRING_MARGIN_FACTOR,
  LEGACY_VIEWPORT_SIZE,
  NATIVE_VIEWPORT_SIZE,
  PET_CONTROL_ROW_HEIGHT_PX,
  LEGACY_TRAY_SIZE,
  MASCOT_MIN_WIDTH_PX,
  MASCOT_MAX_WIDTH_PX,
  MASCOT_ASPECT_RATIO,
  DEFAULT_MASCOT_SIZE,
  DEFAULT_MARGIN_PX,
  QUICK_CHAT_MARGIN_PX,
  DISPLAY_MATCH_TOLERANCE_PX,
} from "./constants";

// ---------------------------------------------------------------------------
// 几何类型
// ---------------------------------------------------------------------------

/** 屏幕矩形。 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 相对窗口的矩形（renderer 消费）。 */
export interface RelativeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 屏幕点位。 */
export interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// dock 磁吸物理（原 Hu/sle，15,275-15,297）
// ---------------------------------------------------------------------------

/**
 * 计算朝向入坞目标的加速度（原 Hu，15,275-15,289）：
 * 距离 ≥ DOCK_ACCELERATION_RADIUS_PX 或行进方向余弦 < 阈值时不加速；
 * shouldDock 由「点−轨迹」最短距离 ≤ DOCK_DISTANCE_PX 判定（原 sle）。
 */
export function computeDockAttraction({
  current,
  next,
  target,
}: {
  current: Point;
  next: Point;
  target: Point;
}): { acceleration: Point; shouldDock: boolean } {
  let dx = target.x - current.x;
  let dy = target.y - current.y;
  let distance = Math.hypot(dx, dy);
  if (distance >= DOCK_ACCELERATION_RADIUS_PX)
    return { acceleration: { x: 0, y: 0 }, shouldDock: false };
  let vx = next.x - current.x;
  let vy = next.y - current.y;
  let speed = Math.hypot(vx, vy);
  if (speed === 0) return { acceleration: { x: 0, y: 0 }, shouldDock: distance <= DOCK_DISTANCE_PX };
  if ((distance === 0 ? 0 : (dx * vx + dy * vy) / (distance * speed)) < DOCK_COSINE_THRESHOLD)
    return { acceleration: { x: 0, y: 0 }, shouldDock: false };
  let magnitude = DOCK_MAX_ACCELERATION * (1 - distance / DOCK_ACCELERATION_RADIUS_PX);
  let scale = distance === 0 ? 0 : magnitude / distance;
  return {
    acceleration: { x: dx * scale, y: dy * scale },
    shouldDock: distanceToSegment(target, current, next) <= DOCK_DISTANCE_PX,
  };
}

/** 点到线段的最短距离（原 sle，15,290-15,297）。 */
function distanceToSegment(point: Point, start: Point, end: Point): number {
  let sx = end.x - start.x;
  let sy = end.y - start.y;
  let lengthSquared = sx * sx + sy * sy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  let t = Math.min(
    1,
    Math.max(0, ((point.x - start.x) * sx + (point.y - start.y) * sy) / lengthSquared),
  );
  return Math.hypot(point.x - (start.x + sx * t), point.y - (start.y + sy * t));
}

// ---------------------------------------------------------------------------
// 光标跟踪（原 cle/lle，15,298-15,329）
// ---------------------------------------------------------------------------

/** 拖动状态（startDrag/moveDrag/endDrag 消费的游标语义）。 */
export class CursorTracker {
  private cursorSource: `native` | `renderer`;
  /** 指针相对吉祥物热点的偏移（pointerAnchorX/Y 原字段）。 */
  pointerAnchorX: number;
  pointerAnchorY: number;
  private crossedDisplay = false;
  private hasMovementIntent = false;
  private hasMoved = false;
  private displayBounds: Rect;

  constructor(
    cursorSource: `native` | `renderer`,
    pointerAnchorX: number,
    pointerAnchorY: number,
    displayBounds: Rect,
  ) {
    this.cursorSource = cursorSource;
    this.pointerAnchorX = pointerAnchorX;
    this.pointerAnchorY = pointerAnchorY;
    this.displayBounds = displayBounds;
  }

  /** 按 cursorSource 选择点位（原 getCursorPointForSource）。 */
  getCursorPointForSource({ native, renderer }: { native: Point | null; renderer: Point | null }) {
    return this.cursorSource === `native` ? native : renderer;
  }

  /** 记录移动（原 recordMove）。 */
  recordMove(displayBounds: Rect): void {
    this.hasMovementIntent = true;
    this.hasMoved = true;
    this.updateDisplayBounds(displayBounds);
  }

  /** 记录移动意图（原 recordMovementIntent）。 */
  recordMovementIntent(): void {
    this.hasMovementIntent = true;
  }

  /** 更新 display 边界并标记跨屏（原 updateDisplayBounds）。 */
  updateDisplayBounds(displayBounds: Rect): void {
    this.crossedDisplay ||= !sameBounds(this.displayBounds, displayBounds);
    this.displayBounds = displayBounds;
  }

  /** 是否抑制渲染器 throw（原 shouldSuppressRendererThrow）。 */
  shouldSuppressRendererThrow(): boolean {
    return this.cursorSource === `native` && (!this.hasMoved || this.crossedDisplay);
  }

  /** 是否发生过移动意图（window-manager 消费）。 */
  get didHaveMovementIntent(): boolean {
    return this.hasMovementIntent;
  }
}

/** 边界相等（原 lle，15,328-15,329）。 */
function sameBounds(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// ---------------------------------------------------------------------------
// 布局计算（原 mle 及子函数，15,357-15,673）
// ---------------------------------------------------------------------------

/** 布局放置角（top/bottom-start/end）。 */
export type OverlayPlacement = `top-start` | `top-end` | `bottom-start` | `bottom-end`;

/** 布局模式。 */
export type OverlayLayoutMode = `legacy` | `native`;

/** 布局产物（原 mle 返回值）。 */
export interface AvatarOverlayLayout {
  anchor: Rect;
  mascot: RelativeRect;
  placement: OverlayPlacement;
  tray: RelativeRect | null;
  visibleBounds: RelativeRect;
  viewport: { width: number; height: number };
  windowBounds: Rect;
  quickChat?: {
    restingWidth: number;
    hasOrbPicker?: boolean;
    nearestStashEdge?: string;
    stashedEdge?: string;
    workArea: RelativeRect;
  };
}

/** mle 的完整入参（原 15,357-15,372）。 */
export interface ComputeLayoutInput {
  anchor: Rect;
  constrainNativeDrawWindowToDisplay?: boolean;
  displayBounds: Rect;
  dockedPIPStackDisplayHeight?: number | null;
  mode?: OverlayLayoutMode;
  mascotSize: { width: number; height: number };
  nativeDrawAnchor?: Rect;
  nativeDrawMascotSize?: { width: number; height: number };
  nativeDrawDisplayHeightPx?: number;
  previousPlacement: OverlayPlacement;
  realtimeCaptionAboveMascotPx?: number;
  showsPetControls?: boolean;
  petControlRowHeight?: number;
  traySize?: { width: number; height: number } | null;
  viewportSize?: { width: number; height: number };
}

/** 计算布局（原 mle，15,357-15,473）。 */
export function computeAvatarOverlayLayout(input: ComputeLayoutInput): AvatarOverlayLayout {
  let dockedStackHeight = (placement: OverlayPlacement) =>
    input.dockedPIPStackDisplayHeight == null
      ? 0
      : dockedPIPStackReserve({
          mascotSize: input.mascotSize,
          placement,
          stackDisplayHeight: input.dockedPIPStackDisplayHeight,
        });
  let maxStackReserve = Math.max(dockedStackHeight(`top-start`), dockedStackHeight(`bottom-start`));
  let viewportBase = input.viewportSize ?? (input.mode === `native` ? NATIVE_VIEWPORT_SIZE : LEGACY_VIEWPORT_SIZE);
  let viewport = {
    width: Math.min(viewportBase.width, input.displayBounds.width),
    height: Math.min(viewportBase.height + maxStackReserve, input.displayBounds.height),
  };
  let isNative = input.mode === `native`;
  let petControlRowReserve = input.showsPetControls && input.dockedPIPStackDisplayHeight == null
    ? (input.petControlRowHeight ?? PET_CONTROL_ROW_HEIGHT_PX)
    : 0;
  let cssControlRowReserve = isNative ? petControlRowReserve : 0;
  let anchor = clampAnchorToDisplay(
    {
      ...input.anchor,
      width: Math.min(input.mascotSize.width, input.displayBounds.width),
      height: Math.min(input.mascotSize.height, input.displayBounds.height),
    },
    input.displayBounds,
    cssControlRowReserve,
  );
  let maxTrayHeight = Math.max(
    0,
    viewport.height -
      anchor.height -
      GLASS_MARGINS.bottom -
      ELEMENT_GAP_PX -
      maxStackReserve -
      (isNative ? GLASS_MARGINS.top + 24 : 0),
  );
  let traySize =
    input.traySize == null
      ? null
      : {
          width: Math.min(
            input.traySize.width,
            Math.max(0, viewport.width - (isNative ? GLASS_MARGINS.left + GLASS_MARGINS.right : 0)),
          ),
          height: Math.min(input.traySize.height, maxTrayHeight),
        };
  let captionReserve =
    (input.realtimeCaptionAboveMascotPx ?? 0) <= 0
      ? 0
      : (input.realtimeCaptionAboveMascotPx ?? 0) + CAPTION_GAP_PX;
  let captionedAnchor =
    captionReserve > 0
      ? {
          ...anchor,
          y: clampValue(anchor.y, input.displayBounds.y + captionReserve, input.displayBounds.y + input.displayBounds.height - anchor.height),
        }
      : anchor;
  let preferredPlacement = preferredPlacementFor(captionedAnchor, input.displayBounds);
  let placement =
    traySize == null
      ? input.previousPlacement
      : chooseTrayPlacement({
          anchor: captionedAnchor,
          displayBounds: input.displayBounds,
          dockedPIPStackDisplayHeight: input.dockedPIPStackDisplayHeight,
          mode: input.mode,
          mascotSize: input.mascotSize,
          maximumTrayHeight: maxTrayHeight,
          preferredPlacement,
          previousPlacement: input.previousPlacement,
          realtimeCaptionAboveMascotPx: input.realtimeCaptionAboveMascotPx ?? 0,
          petControlRowReserve,
          traySize,
        });
  let placementStackReserve = dockedStackHeight(placement);
  let fullViewport = {
    width: viewport.width,
    height: Math.min(viewportBase.height + placementStackReserve, input.displayBounds.height),
  };
  let clampedTray =
    traySize == null
      ? null
      : clampTrayHeight({
          maximumTrayHeight: maxTrayHeight,
          cssControlRowReserve,
          mode: input.mode,
          placement,
          realtimeCaptionAboveMascotPx: input.realtimeCaptionAboveMascotPx ?? 0,
          petControlRowReserve,
          traySize,
        });
  let clampedTrayRect =
    clampedTray == null
      ? null
      : clampRectToDisplay(
          trayRectFor(captionedAnchor, clampedTray, placement, input.mode, input.realtimeCaptionAboveMascotPx ?? 0, petControlRowReserve, placementStackReserve),
          input.displayBounds,
          input.mode,
        );
  let windowBounds: Rect;
  if (isNative) {
    let nativeAnchor = input.nativeDrawAnchor ?? captionedAnchor;
    if (
      input.nativeDrawAnchor == null &&
      input.nativeDrawMascotSize != null
    ) {
      nativeAnchor = {
        ...input.nativeDrawMascotSize,
        x: captionedAnchor.x + Math.round(captionedAnchor.width / 2) - Math.round(input.nativeDrawMascotSize.width / 2),
        y: captionedAnchor.y + Math.round(captionedAnchor.height / 2) - Math.round(input.nativeDrawMascotSize.height / 2),
      };
    }
    windowBounds = computeNativeDrawWindowBounds({
      anchor: nativeAnchor,
      displayBounds: input.displayBounds,
      nativeDrawDisplayHeightPx: input.nativeDrawDisplayHeightPx ?? input.displayBounds.height,
      viewportWidth: viewport.width,
    });
    if (input.constrainNativeDrawWindowToDisplay) {
      let intersection = intersectBounds(windowBounds, input.displayBounds);
      windowBounds = {
        x: windowBounds.x + intersection.left,
        y: windowBounds.y + intersection.top,
        width: intersection.width,
        height: intersection.height,
      };
    }
  } else {
    let legacyWindow = legacyWindowForAnchor({
      anchor: captionedAnchor,
      displayBounds: input.displayBounds,
      mode: input.mode,
      placement,
      bottomReserve: cssControlRowReserve,
      viewport: fullViewport,
    });
    let minY =
      captionReserve > 0
        ? Math.min(legacyWindow.y, Math.max(input.displayBounds.y, captionedAnchor.y - captionReserve))
        : legacyWindow.y;
    windowBounds = { ...legacyWindow, y: minY, height: legacyWindow.height + legacyWindow.y - minY };
  }
  return {
    anchor: captionedAnchor,
    mascot: relativeRect(captionedAnchor, windowBounds),
    placement,
    tray: clampedTrayRect == null ? null : relativeRect(clampedTrayRect, windowBounds),
    visibleBounds: intersectBounds(windowBounds, input.displayBounds),
    viewport: { width: windowBounds.width, height: windowBounds.height },
    windowBounds,
  };
}

/** 首选放置角（原 Qu，15,474-15,476）。 */
export function preferredPlacementFor(anchor: Rect, displayBounds: Rect): OverlayPlacement {
  return `${anchorCenterY(anchor) < anchorCenterY(displayBounds) ? `bottom` : `top`}-${anchorCenterX(anchor) < anchorCenterX(displayBounds) ? `start` : `end`}` as OverlayPlacement;
}

/** 已入坞 PIP 栈的显示预留（原 $u，15,477-15,481）。 */
function dockedPIPStackReserve({
  mascotSize,
  placement,
  stackDisplayHeight,
}: {
  mascotSize: { width: number; height: number };
  placement: OverlayPlacement;
  stackDisplayHeight: number;
}): number {
  let overlap =
    mascotSize.height / 2 + (placement.startsWith(`top`) ? GLASS_MARGINS.top : GLASS_MARGINS.bottom);
  let remaining = Math.max(0, stackDisplayHeight - overlap);
  return remaining === 0 ? 0 : remaining + DOCKED_PIP_STACK_GAP_PX - ELEMENT_GAP_PX;
}

/** native draw 窗口边界（原 hle，15,482-15,503）。 */
function computeNativeDrawWindowBounds({
  anchor,
  displayBounds,
  nativeDrawDisplayHeightPx,
  viewportWidth,
}: {
  anchor: Rect;
  displayBounds: Rect;
  nativeDrawDisplayHeightPx: number;
  viewportWidth: number;
}): Rect {
  let innerWidth = Math.max(0, viewportWidth - GLASS_MARGINS.left - GLASS_MARGINS.right);
  let minShift = Infinity;
  let maxShift = -Infinity;
  for (let width of [0, innerWidth])
    for (let anchorX of [0, displayBounds.width - anchor.width]) {
      let shift =
        clampValue(anchorX + (anchor.width - width) / 2, NATIVE_INSET_PX, displayBounds.width - width - NATIVE_INSET_PX) -
        anchorX;
      minShift = Math.min(minShift, shift);
      maxShift = Math.max(maxShift, shift);
    }
  let margin = Math.ceil((maxShift - minShift) * SPRING_MARGIN_FACTOR);
  let minWindowWidth = Math.min(displayBounds.width, Math.max(188, anchor.width * 2));
  let left = Math.floor(
    Math.min(
      -GLASS_MARGINS.left,
      minShift - innerWidth - margin - 28,
      Math.min((anchor.width - minWindowWidth) / 2, anchor.width - minWindowWidth) - 28,
    ),
  );
  let height = Math.max(nativeDrawDisplayHeightPx, displayBounds.height, anchor.height);
  let top = Math.floor(anchor.height - height - 28);
  let right = Math.ceil(
    Math.max(
      anchor.width + GLASS_MARGINS.right,
      maxShift + innerWidth + margin + 28,
      Math.max((anchor.width + minWindowWidth) / 2, minWindowWidth) + 28,
    ),
  );
  let bottom = Math.ceil(height + 28);
  return {
    x: Math.round(anchor.x + left),
    y: Math.round(anchor.y + top),
    width: right - left,
    height: bottom - top,
  };
}

/** tray 放置角择优（原 gle，15,504-15,559）。 */
function chooseTrayPlacement({
  anchor,
  displayBounds,
  dockedPIPStackDisplayHeight,
  mode,
  mascotSize,
  maximumTrayHeight,
  preferredPlacement,
  previousPlacement,
  realtimeCaptionAboveMascotPx,
  petControlRowReserve,
  traySize,
}: {
  anchor: Rect;
  displayBounds: Rect;
  dockedPIPStackDisplayHeight?: number | null;
  mode?: OverlayLayoutMode;
  mascotSize: { width: number; height: number };
  maximumTrayHeight: number;
  preferredPlacement: OverlayPlacement;
  previousPlacement: OverlayPlacement;
  realtimeCaptionAboveMascotPx: number;
  petControlRowReserve: number;
  traySize: { width: number; height: number };
}): OverlayPlacement {
  let candidates: OverlayPlacement[] =
    mode === `legacy`
      ? [`top-start`, `top-end`, `bottom-start`, `bottom-end`]
      : preferredPlacement.endsWith(`start`)
        ? [`top-start`, `bottom-start`]
        : [`top-end`, `bottom-end`];
  let best = candidates
    .map((candidate) => {
      let sameSide =
        mode === `native`
          ? candidate.startsWith(`top`) === previousPlacement.startsWith(`top`)
          : candidate === previousPlacement;
      return {
        placement: candidate,
        score:
          outOfBoundsPenalty(
            trayRectFor(
              anchor,
              mode === `native`
                ? clampTrayHeight({
                    maximumTrayHeight,
                    cssControlRowReserve: 0,
                    mode,
                    placement: candidate,
                    realtimeCaptionAboveMascotPx,
                    petControlRowReserve,
                    traySize,
                  })
                : traySize,
              candidate,
              mode,
              realtimeCaptionAboveMascotPx,
              petControlRowReserve,
              dockedPIPStackDisplayHeight == null
                ? 0
                : dockedPIPStackReserve({
                    mascotSize,
                    placement: candidate,
                    stackDisplayHeight: dockedPIPStackDisplayHeight,
                  }),
            ),
            displayBounds,
          ) +
          (candidate === preferredPlacement ? 0 : 32) +
          (sameSide ? -96 : 0),
      };
    })
    .sort((a, b) => a.score - b.score)[0];
  if (best == null) throw Error(`Expected avatar overlay placement`);
  return best.placement;
}

/** tray 高度裁剪（原 ed，15,560-15,573）。 */
function clampTrayHeight({
  maximumTrayHeight,
  cssControlRowReserve,
  mode,
  placement,
  realtimeCaptionAboveMascotPx,
  petControlRowReserve,
  traySize,
}: {
  maximumTrayHeight: number;
  cssControlRowReserve: number;
  mode?: OverlayLayoutMode;
  placement: OverlayPlacement;
  realtimeCaptionAboveMascotPx: number;
  petControlRowReserve: number;
  traySize: { width: number; height: number };
}): Rect {
  let captionReserve = captionReservePx(mode, realtimeCaptionAboveMascotPx);
  let topExtra =
    placement.startsWith(`top`)
      ? captionReserve + (captionReserve > 0 && mode === `legacy` ? CAPTION_GAP_PX : 0)
      : 0;
  let bottomReserve =
    mode === `native` && petControlRowReserve
      ? placement.startsWith(`bottom`)
        ? petControlRowReserve
        : cssControlRowReserve
      : 0;
  return {
    ...traySize,
    height: Math.max(0, Math.min(traySize.height, maximumTrayHeight - bottomReserve - topExtra)),
  };
}

/** tray 相对锚点的屏幕矩形（原 td，15,574-15,590）。 */
function trayRectFor(
  anchor: Rect,
  tray: { width: number; height: number },
  placement: OverlayPlacement,
  mode: OverlayLayoutMode | undefined,
  realtimeCaptionAboveMascotPx: number,
  petControlRowReserve: number,
  stackReserve: number,
): Rect {
  let isTop = placement.startsWith(`top`);
  let captionReserve = captionReservePx(mode, realtimeCaptionAboveMascotPx);
  return mode === `legacy`
    ? {
        x: placement.endsWith(`end`) ? anchor.x + anchor.width + GLASS_MARGINS.right - tray.width : anchor.x,
        y: isTop
          ? anchor.y - tray.height - ELEMENT_GAP_PX - captionReserve - stackReserve
          : anchor.y + anchor.height + ELEMENT_GAP_PX + stackReserve,
        width: tray.width,
        height: tray.height,
      }
    : {
        x: anchor.x + (anchor.width - tray.width) / 2,
        y: isTop
          ? anchor.y - GLASS_MARGINS.top - tray.height - ELEMENT_GAP_PX - captionReserve - stackReserve
          : anchor.y + anchor.height + GLASS_MARGINS.bottom + ELEMENT_GAP_PX + petControlRowReserve + stackReserve,
        width: tray.width,
        height: tray.height,
      };
}

/** 字幕的垂直保留（原 nd，15,591-15,594）。 */
function captionReservePx(mode: OverlayLayoutMode | undefined, realtimeCaptionAboveMascotPx: number) {
  let gap = ELEMENT_GAP_PX + (mode === `native` ? GLASS_MARGINS.top : 0);
  return realtimeCaptionAboveMascotPx <= 0
    ? 0
    : Math.max(0, realtimeCaptionAboveMascotPx + CAPTION_RESERVE_PX - gap);
}

/** tray 矩形夹回 display（原 _le，15,595-15,602）。 */
function clampRectToDisplay(rect: Rect, displayBounds: Rect, mode: OverlayLayoutMode | undefined): Rect {
  let inset = mode === `native` ? NATIVE_INSET_PX : 0;
  return {
    ...rect,
    x: clampValue(rect.x, displayBounds.x + inset, displayBounds.x + displayBounds.width - rect.width - inset),
    y: clampValue(rect.y, displayBounds.y + inset, displayBounds.y + displayBounds.height - rect.height - inset),
  };
}

/** 锚点夹回 display（原 vle，15,603-15,609）。 */
function clampAnchorToDisplay(
  anchor: Rect,
  displayBounds: Rect,
  bottomReserve: number,
): Rect {
  return {
    ...anchor,
    x: clampValue(anchor.x, displayBounds.x, displayBounds.x + displayBounds.width - anchor.width),
    y: clampValue(
      anchor.y,
      displayBounds.y,
      displayBounds.y + displayBounds.height - anchor.height - GLASS_MARGINS.bottom - bottomReserve,
    ),
  };
}

/** legacy 模式的窗口矩形（原 yle，15,610-15,632）。 */
function legacyWindowForAnchor({
  anchor,
  displayBounds,
  mode,
  placement,
  bottomReserve,
  viewport,
}: {
  anchor: Rect;
  displayBounds: Rect;
  mode: OverlayLayoutMode;
  placement: OverlayPlacement;
  bottomReserve: number;
  viewport: { width: number; height: number };
}): Rect {
  let x = anchor.x + anchor.width / 2 - viewport.width / 2;
  if (mode === `legacy`)
    x = placement.endsWith(`end`) ? anchor.x + anchor.width + GLASS_MARGINS.right - viewport.width : anchor.x - GLASS_MARGINS.left;
  return {
    x: clampValue(x, displayBounds.x, displayBounds.x + displayBounds.width - viewport.width),
    y: clampValue(
      placement.startsWith(`top`)
        ? anchor.y + anchor.height + GLASS_MARGINS.bottom + bottomReserve - viewport.height
        : anchor.y - GLASS_MARGINS.top,
      displayBounds.y,
      displayBounds.y + displayBounds.height - viewport.height,
    ),
    width: viewport.width,
    height: viewport.height,
  };
}

/** 出界惩罚（原 ble，15,633-15,639）。 */
function outOfBoundsPenalty(rect: Rect, displayBounds: Rect): number {
  let left = Math.max(0, displayBounds.x - rect.x);
  let top = Math.max(0, displayBounds.y - rect.y);
  let right = Math.max(0, rect.x + rect.width - displayBounds.x - displayBounds.width);
  let bottom = Math.max(0, rect.y + rect.height - displayBounds.y - displayBounds.height);
  return left + top + right + bottom + (left + right) * rect.height + (top + bottom) * rect.width;
}

// ---------------------------------------------------------------------------
// 通用几何（原 rd/id/ad/od，15,640-15,656）
// ---------------------------------------------------------------------------

/** 屏幕矩形 → 窗口相对矩形（原 rd，15,640-15,647）。 */
export function relativeRect(rect: Rect, windowBounds: Rect): RelativeRect {
  return {
    left: Math.round(rect.x - windowBounds.x),
    top: Math.round(rect.y - windowBounds.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** 中心 X（原 id，15,648-15,650）。 */
export function anchorCenterX(rect: Rect): number {
  return rect.x + rect.width / 2;
}

/** 中心 Y（原 ad，15,651-15,653）。 */
export function anchorCenterY(rect: Rect): number {
  return rect.y + rect.height / 2;
}

/** 值夹取（原 od，15,654-15,656）：min>max 时取中点。 */
export function clampValue(value: number, min: number, max: number): number {
  return min > max
    ? Math.round((min + max) / 2)
    : Math.min(Math.max(Math.round(value), min), max);
}

/** 点 → 9 宫格位置标签（原 sd，15,657-15,664）：Quick Chat 吸附用。 */
export function positionFromPoint(point: Point, workArea: Rect): string {
  let xRatio = (point.x - workArea.x) / workArea.width;
  let horizontal = `center`;
  if (xRatio < 1 / 3) horizontal = `left`;
  else if (xRatio >= 2 / 3) horizontal = `right`;
  return `${point.y < workArea.y + workArea.height / 2 ? `top` : `bottom`}-${horizontal}`;
}

/** Quick Chat 吸附目标（原 cd，15,665-15,673）。 */
export function placeQuickChatAtPosition(
  position: string,
  display: { bounds: Rect; workArea: Rect },
  size: { width: number; height: number },
  elementSize: { width: number; height: number },
): Rect {
  let clampedWidth = Math.min(elementSize.width, display.workArea.width - 32);
  let centerX = display.bounds.x + display.bounds.width / 2;
  if (position.endsWith(`left`)) centerX = display.workArea.x + 16 + clampedWidth / 2;
  else if (position.endsWith(`right`))
    centerX = display.workArea.x + display.workArea.width - 16 - clampedWidth / 2;
  let centerY = position.startsWith(`top`)
    ? display.workArea.y + 16 + elementSize.height / 2
    : display.workArea.y + display.workArea.height - 16 - elementSize.height / 2;
  return { ...size, x: centerX - size.width / 2, y: centerY - size.height / 2 };
}

// ---------------------------------------------------------------------------
// display / 窗口辅助（原 18,090-18,167 + 15,342-15,356）
// ---------------------------------------------------------------------------

/** 右下角默认锚点（原 bd，18,090-18,097）。 */
export function defaultAnchorForDisplay(displayBounds: Rect, mascotSize: { width: number; height: number }): Rect {
  return {
    x: displayBounds.x + displayBounds.width - mascotSize.width - DEFAULT_MARGIN_PX,
    y: displayBounds.y + displayBounds.height - mascotSize.height - DEFAULT_MARGIN_PX,
    width: mascotSize.width,
    height: mascotSize.height,
  };
}

/** 分辨率键（原 xd，18,098-18,100）。 */
export function resolutionKeyForBounds(bounds: Rect): string {
  return `${bounds.width}x${bounds.height}`;
}

/** layout → renderer 子集（原 Sd，18,101-18,109）。 */
export function rendererLayoutSubset(layout: AvatarOverlayLayout) {
  return {
    mascot: layout.mascot,
    placement: layout.placement,
    quickChat: layout.quickChat,
    tray: layout.tray,
    visibleBounds: layout.visibleBounds,
    viewport: layout.viewport,
  };
}

/** 按 id 找 display（原 Cd，18,111-18,113）。 */
export function displayById(displayId: number): Electron.Display | null {
  return screen.getAllDisplays().find((display) => display.id === displayId) ?? null;
}

/** 匹配 bounds 的 display（原 Ule，18,114-18,117）。 */
export function displayMatchingBounds(bounds: Rect): Electron.Display | null {
  let display = screen.getDisplayMatching(bounds);
  return boundsEqual(display.bounds, bounds) ? display : null;
}

/** native 模式的可用 draw 边界（原 Xu，15,342-15,346）。 */
export function displayDrawBounds(display: Electron.Display, mode: OverlayLayoutMode): Rect {
  return mode === `native`
    ? { ...display.workArea, height: display.bounds.y + display.bounds.height - display.workArea.y }
    : display.bounds;
}

/** 两矩形交集（原 Zu，15,347-15,356）。 */
export function intersectBounds(a: Rect, b: Rect): RelativeRect {
  let x = Math.max(a.x, b.x);
  let y = Math.max(a.y, b.y);
  return {
    left: x - a.x,
    top: y - a.y,
    width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x),
    height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y),
  };
}

/** 持久化的按 display 放置记录（原 wd，18,118-18,124）。 */
export function storedPlacementForDisplay(
  stored: {
    byDisplayId?: Record<string, any>;
    byResolution?: Record<string, any>;
    [key: string]: unknown;
  } | null | undefined,
  display: { id: number; bounds: Rect },
): any {
  if (stored == null) return null;
  return (
    stored.byDisplayId?.[String(display.id)] ??
    stored.byResolution?.[resolutionKeyForBounds(display.bounds)] ??
    (stored.byDisplayId == null && stored.byResolution == null ? stored : null)
  );
}

/** 持久化记录 → 锚点（原 Wle，18,125-18,130）。 */
export function anchorFromStoredPlacement(placement: any, displayBounds: Rect): { x: number; y: number } {
  let mascot = placement.mascot;
  let anchor =
    placement.anchor ??
    (mascot == null ? { x: placement.x, y: placement.y } : { x: placement.x + mascot.left, y: placement.y + mascot.top });
  let storedDisplayBounds = placement.displayBounds;
  return storedDisplayBounds == null
    ? anchor
    : { x: anchor.x + displayBounds.x - storedDisplayBounds.x, y: anchor.y + displayBounds.y - storedDisplayBounds.y };
}

/** 拖动目标的 display 边界（原 Gle，18,131-18,134）。 */
export function boundsForDragTarget(point: Point, currentDisplayBounds: Rect): Rect {
  let nearest = screen.getDisplayNearestPoint(point).bounds;
  if (boundsEqual(nearest, currentDisplayBounds)) return nearest;
  return pointInBounds(point, insetBounds(currentDisplayBounds, DISPLAY_MATCH_TOLERANCE_PX))
    ? currentDisplayBounds
    : nearest;
}

/** 锚点中心（原 Td，18,135-18,137）。 */
export function anchorCenter(anchor: Rect): Point {
  return { x: anchor.x + anchor.width / 2, y: anchor.y + anchor.height / 2 };
}

/** 中心 + presentation 偏移（原 Kle，18,138-18,140）。 */
export function offsetAnchorCenter(anchor: Rect, offset: Point): Point {
  return offsetPoint(anchorCenter(anchor), offset);
}

/** 点平移（原 Ed，18,141-18,143）。 */
export function offsetPoint(point: Point, offset: { x: number; y: number }): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

/** dock 目标 → 锚点（原 Dd，18,144-18,146）。 */
export function anchorForDockTarget(
  target: { centerX: number; centerY: number },
  mascotSize: { width: number; height: number },
  presentationOffset: Point,
): Rect {
  return {
    x: target.centerX - presentationOffset.x - mascotSize.width / 2,
    y: target.centerY - presentationOffset.y - mascotSize.height / 2,
    ...mascotSize,
  };
}

/** 入坞的初始速度（原 Od，18,147-18,151）。 */
export function dockingVelocity(from: Rect, to: Rect): Point {
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  return { x: dx * 2.8 - dy * 0.16, y: dy * 2.8 + dx * 0.16 };
}

/** 点在矩形内（原 kd，18,152-18,154）。 */
export function pointInBounds(point: Point, bounds: Rect): boolean {
  return (
    point.x >= bounds.x &&
    point.x < bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y < bounds.y + bounds.height
  );
}

/** 矩形外扩（原 qle，18,155-18,157）。 */
export function insetBounds(bounds: Rect, inset: number): Rect {
  return { x: bounds.x - inset, y: bounds.y - inset, width: bounds.width + inset * 2, height: bounds.height + inset * 2 };
}

/** 吉祥物宽度夹取（原 Jle，18,158-18,160）。 */
export function clampMascotWidth(width: number): number {
  return Number.isFinite(width)
    ? Math.round(Math.min(MASCOT_MAX_WIDTH_PX, Math.max(MASCOT_MIN_WIDTH_PX, width)))
    : DEFAULT_MASCOT_SIZE.width;
}

/** 宽度 → 吉祥物尺寸（原 Ad，18,161-18,164）。 */
export function mascotSizeForWidth(width: number): { width: number; height: number } {
  let clamped = clampMascotWidth(width);
  return { width: clamped, height: Math.ceil(clamped / MASCOT_ASPECT_RATIO) };
}

/** 尺寸相等（原 Yle，18,165-18,167）。 */
export function sameSize(a: { width: number; height: number }, b: { width: number; height: number }): boolean {
  return a.width === b.width && a.height === b.height;
}

/** bounds 相等（原 jd，18,168-18,170）。 */
export function boundsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// Quick Chat 边距（原 ud）供消费方使用。
export { QUICK_CHAT_MARGIN_PX };
