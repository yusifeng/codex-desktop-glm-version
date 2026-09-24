// avatar overlay 窗口管理器（原版 15,706-18,089 区段的 Hle 类）。
//
// 职责（AvatarOverlayWindowManager）：
//   - overlay BrowserWindow 的创建/显示/隐藏/销毁生命周期（objc-js 的
//     nonactivatingPanelBridge / nativeAppearanceBridge，macOS 专属）；
//   - Quick Chat 展示面：键盘交互焦点保持（osascript JXA 恢复前应用焦点）、
//     隐藏 focus 恢复（wasHidden 补发）；
//   - 布局引擎：applyLayout / getLayoutForDisplay（磁吸几何在 geometry.ts），
//     setWindowBounds 去重、lastSentRendererState 去重；
//   - 拖动：renderer 拖动 + native AppKit 拖动接管（sky addon，isQuickChat
//     多屏时禁用接管）、动量（弹簧衰减 + 撞边反弹）、dock 磁吸；
//   - display 变更/断连恢复（detachedDisplay 记忆 10s）、suspend/resume；
//   - 鼠标穿透策略：setIgnoreMouseEvents 三态（disabled/forwarding/
//     without-forwarding）+ setInputShape 输入形状；
//   - remote-hosted PIP 内容宿主注册（按吉祥物矩形对齐）；
//   - realtime 语音控制器的宿主接线（构造注入，Electron ready 后才构造——
//     深析 §7：BrowserWindow.isInputShapeSupported() 在构造器求值）。
//
// 构造注入（深析 §7）：本类不得做成模块级单例——`supportsInputShape` 在字段
// 初始化时读 `BrowserWindow.isInputShapeSupported()`，app ready 前实例化会
// 失败；由启动装配区（17 万区 Ust）在 whenReady 后 new。
//
// 模块加载期副作用：无（类定义 + 常量）。

import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { app, BrowserWindow, screen } from "electron";
import deepEqual from "@chunk/main-shared";
import {
  F as AVATAR_OVERLAY_OPEN_KEY,
  P as AVATAR_OVERLAY_BOUNDS_KEY,
  Q as PIP_TASK_VISIBILITY_STATE_KEY,
  Z as PIP_CONTENT_MAX_DISPLAY_SIZE_KEY,
} from "@chunk/bootstrap";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  performWindowDrag,
  isWindowDragActive,
  finishWindowDrag,
  getFrontmostWindow,
  setWindowDragTarget,
  registerRemoteHostedPIPContentHost,
  unregisterRemoteHostedPIPContentHost,
  getRemoteHostedPIPContentLayoutState,
  setRemoteHostedPIPContentLayoutStateChangedHandler,
  setRemoteHostedPIPContentComputerUseCursorLocationHandler,
} from "../windows/native-app-icons";
import { getDesktopFeatureAvailability } from "../misc/availability";
import {
  RealtimeVoiceController,
  registerVoiceController,
} from "./realtime";
import { CursorTracker, computeAvatarOverlayLayout } from "./geometry";
import type { AvatarOverlayLayout, OverlayLayoutMode, OverlayPlacement, Point, Rect } from "./geometry";
import {
  AVATAR_OVERLAY_HOST_ID,
  AVATAR_OVERLAY_ROUTE,
  DEFAULT_MASCOT_SIZE,
  DEFAULT_PET_CONTROLS_APPEARANCE,
  DETACHED_DISPLAY_REMEMBER_MS,
  DISMISSED_WINDOW_CLEANUP_DELAY_MS,
  FADE_DURATION_MS,
  FADE_START_OPACITY,
  HIDE_FADE_DURATION_MS,
  LEGACY_TRAY_SIZE,
  MOMENTUM_DECAY_FRAME_MS,
  MOMENTUM_FRAME_DECAY,
  MOMENTUM_MAX_DURATION_MS,
  MOMENTUM_MIN_SPEED,
  BOUNCE_FACTOR,
  MAX_FRAME_DELTA_MS,
  MOVED_WINDOW_PERSIST_DELAY_MS,
  NATIVE_DRAG_POLL_INTERVAL_MS,
  NATIVE_TRAY_SIZE,
  QUICK_CHAT_MIN_SNAP_WIDTH_PX,
  SNAP_DISTANCE_THRESHOLD_PX,
  SNAP_SPEED_THRESHOLD_PX,
  SNAP_SETTLE_MAX_DURATION_MS,
  SNAP_SPRING_STIFFNESS,
  SNAP_SPRING_DAMPING,
  ANIMATION_FRAME_MS,
  PROXIMITY_POLL_INTERVAL_MS,
  computeDockAttraction,
  displayById,
  displayDrawBounds,
  displayMatchingBounds,
  anchorCenter,
  anchorForDockTarget,
  anchorFromStoredPlacement,
  boundsEqual,
  boundsForDragTarget,
  dockingVelocity,
  defaultAnchorForDisplay,
  intersectBounds,
  mascotSizeForWidth,
  offsetAnchorCenter,
  offsetPoint,
  placeQuickChatAtPosition,
  pointInBounds,
  positionFromPoint,
  preferredPlacementFor,
  quickChatRestingWidth,
  relativeRect,
  rendererLayoutSubset,
  resolutionKeyForBounds,
  sameSize,
  storedPlacementForDisplay,
} from "./geometry";
export * from "./geometry";
import { MOVEMENT_SPRING } from "./constants";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 窗口管理器宿主面（windowManager 注入）。 */
export interface OverlayWindowManagerHost {
  createWindow(options: Record<string, unknown>): Promise<BrowserWindow>;
  sendMessageToWebContents(webContents: Electron.WebContents, message: unknown, opts?: unknown): void;
  sendMessageToAllWindows(message: unknown): void;
  sendMessageToAllRegisteredWindows(message: unknown): void;
  isWebContentsReady(webContentsId: number): boolean;
  setPendingAuxiliaryActivationTarget(window: BrowserWindow): void;
}

/** globalState 的最小面。 */
export interface GlobalStateLike {
  get(key: unknown): any;
  set(key: unknown, value: unknown): void;
}

/** renderer 布局状态（setElementSizes 的入参，原 16,630-16,645）。 */
export interface RendererElementSizes {
  quickChatFocusRequestId?: number | null;
  isQuickChatLoading?: boolean;
  isGlobalRealtimeVoiceTransitioning?: boolean;
  isTrayVisible?: boolean | null;
  mascot: { width: number; height: number };
  petControlsAppearance?: typeof DEFAULT_PET_CONTROLS_APPEARANCE;
  presentation?: string | null;
  quickChat?: {
    hasNotifications?: boolean;
    hasOrbPicker?: boolean;
    isActivityVisible?: boolean;
  } | null;
  realtimeCaptionAboveMascotPx?: number;
  showsPetControls?: boolean;
  tray?: { width: number; height: number } | null;
}

/** renderer 上报的输入形状区域（setPointerRegions）。 */
export interface InputShapeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Quick Chat 控件状态（renderer 上报）。 */
export interface QuickChatControls {
  hasNotifications?: boolean;
  hasOrbPicker?: boolean;
  isActivityVisible?: boolean;
}

/** computer-use 光标位置（sky addon 回调载荷）。 */
export interface ComputerUseCursorLocation {
  isActive: boolean;
  x: number;
  y: number;
}

/** remote-hosted PIP 布局状态（sky addon）。 */
export interface RemoteHostedPIPContentLayoutState {
  currentHostID: string | null;
  stackDisplayHeight: number;
  stackDisplayWidth: number;
}

// ---------------------------------------------------------------------------
// 窗口管理器
// ---------------------------------------------------------------------------

/** avatar overlay 窗口管理器（原 Hle，15,706-18,089）。 */
export class AvatarOverlayWindowManager {
  private windowManager: OverlayWindowManagerHost;
  private globalState: GlobalStateLike;
  private isRemoteHostedPIPEnabled: () => boolean;
  private logger = memoizedTaggedLogger(`avatar-overlay`);
  /** Electron 能力探测（构造期求值——必须在 app ready 后构造）。 */
  private supportsInputShape = BrowserWindow.isInputShapeSupported();

  private window: BrowserWindow | null = null;
  private nonactivatingPanelBridge: typeof import("objc-js") | null = null;
  private nativeAppearanceBridge: typeof import("objc-js") | null = null;
  private closingWindow: BrowserWindow | null = null;
  private openingWindowPromise: Promise<BrowserWindow | null> | null = null;
  private anchor: Rect = defaultAnchorForDisplay({ x: 0, y: 0, width: 0, height: 0 }, DEFAULT_MASCOT_SIZE);
  private displayBounds: Rect | null = null;
  private displayId: number | null = null;
  private detachedDisplay: { bounds: Rect; id: number } | null = null;
  private detachedDisplayRestoreTimer: ReturnType<typeof setTimeout> | null = null;
  private dragState: CursorTracker | null = null;
  private nativeWindowDragStart: Point | null = null;
  private nativeWindowDragActive = false;
  private nativeWindowDragCompletionTimer: ReturnType<typeof setInterval> | null = null;
  private nativeWindowDragTargetRegistered = false;
  private layout: AvatarOverlayLayout | null = null;
  private layoutMode: OverlayLayoutMode = `legacy`;
  private isQuickChatPresentation = false;
  private quickChatControls: QuickChatControls | null | undefined;
  private quickChatPosition: string | null = null;
  private isFreelyPositioned = false;
  private quickChatStashedEdge: string | null = null;
  private quickChatDrawOffset: Point = { x: 0, y: 0 };
  private quickChatResizeDrawAnchor: Rect | null = null;
  private applicationLifecycleListenersRegistered = false;
  private quickChatKeyboardInteractionActive = false;
  private pendingQuickChatFocus: { requestId: number; hasLayout: boolean } | null = null;
  private previousQuickChatApplication: Promise<{ bundleIdentifier: string } | null> | null = null;
  private previousQuickChatWindow: BrowserWindow | null = null;
  private hasDeferredLayout = false;
  private isSettingWindowBounds = false;
  private mascotSize: { width: number; height: number } = DEFAULT_MASCOT_SIZE;
  private momentumActive = false;
  private momentumTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPresentation: { origin: unknown; target: Rect; velocity: Point | null } | null = null;
  private presentationOffset: Point = { x: 0, y: 0 };
  private presentationMotionTarget: Rect | null = null;
  private presentationFadeInPending = false;
  private presentationFadeTimer: ReturnType<typeof setTimeout> | null = null;
  private windowHideAnimation: `pending` | `running` | null = null;
  private arePresentationAccessoriesVisible = true;
  private presentationVisibility: boolean | null = null;
  private startupPresentationVisibility: boolean | null = null;
  private dockRestoreAnchor: Rect | null = null;
  private dockTarget: { anchor: { centerX: number; centerY: number }; onDock: () => void } | null = null;
  private suppressNextRendererThrow = false;
  private movedWindowPersistTimer: ReturnType<typeof setTimeout> | null = null;
  private mousePassthroughMode: `disabled` | `forwarding` | `without-forwarding` = `disabled`;
  private inputShape: InputShapeRect[] | null = null;
  private petControlsProximityRects: InputShapeRect[] = [];
  private placement: OverlayPlacement = `top-end`;
  private pointerInteractive = false;
  private rendererReady = false;
  private lastSentRendererState: {
    isGlobalRealtimeVoicePresentation: boolean;
    isVisible: boolean;
    layout: unknown;
    petOpenIntent: boolean;
    arePresentationAccessoriesVisible: boolean;
    quickChatFocusRequestId?: number;
  } | null = null;
  private layoutRevision = 0;
  private feedbackDiagnosticsEnabled = false;
  private computerUseCursorLocation: ComputerUseCursorLocation | null = null;
  private remoteHostedPIPContentLayoutState: RemoteHostedPIPContentLayoutState | null = null;
  private computerUseCursorPoint: Point | null = null;
  private isSuspended = false;
  private isAppQuitting = false;
  private isDismissedWindowRetained = false;
  private dismissedWindowCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private applicationHideCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private hiddenForApplicationHide = false;
  private initialPresentationState: `waiting-for-layout` | `ready` = `waiting-for-layout`;
  private petOpenIntent = false;
  private awaitingRealtimeVoicePresentation = false;
  private windowVisibilitySequence = 0;
  private resolutionKey: string | null = null;
  private realtimeCaptionAboveMascotPx = 0;
  private traySize: { width: number; height: number } | null = null;
  private petControlsProximityTimer: ReturnType<typeof setInterval> | null = null;
  private pointerNearPet = false;
  private remoteHostedPIPContentHostAlignment: string | null = null;
  private remoteHostedPIPContentHostMotionTarget: Rect | null = null;
  private remoteHostedPIPContentHostRegistered = false;
  private petControlsAppearance: Record<string, number> = DEFAULT_PET_CONTROLS_APPEARANCE;
  private showsPetControls = false;
  private realtimeController: RealtimeVoiceController;

  constructor(
    windowManager: OverlayWindowManagerHost,
    globalState: GlobalStateLike,
    isRemoteHostedPIPEnabled: () => boolean = () =>
      (getDesktopFeatureAvailability().cuaPIP as boolean) === true,
  ) {
    this.windowManager = windowManager;
    this.globalState = globalState;
    this.isRemoteHostedPIPEnabled = isRemoteHostedPIPEnabled;
    setRemoteHostedPIPContentComputerUseCursorLocationHandler((location: ComputerUseCursorLocation) => {
      this.setComputerUseCursorLocation(location);
    });
    this.remoteHostedPIPContentLayoutState = getRemoteHostedPIPContentLayoutState();
    setRemoteHostedPIPContentLayoutStateChangedHandler((state: RemoteHostedPIPContentLayoutState) => {
      this.setRemoteHostedPIPContentLayoutState(state);
    });
    let controller = new RealtimeVoiceController({
      clearPresentation: () => {
        this.awaitingRealtimeVoicePresentation = false;
        this.startupPresentationVisibility = null;
        this.updatePresentationOffset({ x: 0, y: 0 });
        if (
          !(
            this.closingWindow != null &&
            this.petOpenIntent &&
            this.presentationVisibility == null
          ) &&
          this.window != null
        ) {
          this.sendLayoutToRenderer(this.window);
          this.reconcileWindowVisibility();
        }
      },
      getRendererId: () => {
        let window = this.window;
        return window == null || window.isDestroyed() ? null : window.webContents.id;
      },
      isOpen: () => this.isOpen(),
      isOpening: () => this.openingWindowPromise != null,
      isPresentationPending: () => this.awaitingRealtimeVoicePresentation,
      preparePresentation: (origin, useGlobalOverlay) =>
        this.prepareRealtimePresentation(origin, useGlobalOverlay),
      publishLaunchState: (origin, phase, launchId, error) => {
        this.windowManager.sendMessageToWebContents(origin as Electron.WebContents, {
          type: `realtime-voice-launch-state-changed`,
          error,
          launchId,
          phase,
        });
      },
    });
    this.realtimeController = controller;
    controller.subscribeSessionReservationChanges(() => {
      this.updateRendererBackgroundThrottling();
      this.scheduleDismissedWindowCleanup();
    });
    registerVoiceController(this, controller);
  }

  // -------------------------------------------------------------------------
  // 状态查询
  // -------------------------------------------------------------------------

  /** overlay 当前可见（原 isOpen）。 */
  isOpen(): boolean {
    let window = this.window;
    return window != null && !window.isDestroyed() && window.isVisible();
  }

  /** Quick Chat 展示面启用（原 usesQuickChatBar）。 */
  get usesQuickChatBar(): boolean {
    return this.isQuickChatPresentation || this.quickChatControls != null;
  }

  /** realtime 控制器（供外部装配注册 starter 等）。 */
  get voiceController(): RealtimeVoiceController {
    return this.realtimeController;
  }

  /** 可见 webContents（原 getVisibleWebContents）。 */
  getVisibleWebContents(): Electron.WebContents | null {
    return this.isOpen() ? (this.window?.webContents ?? null) : null;
  }

  /** 订阅「overlay 是否持有焦点」（原 subscribePresentationFocus）。 */
  subscribePresentationFocus(onChange: (hasFocus: boolean) => void): () => void {
    let check = () => {
      let focused: BrowserWindow | null = BrowserWindow.getFocusedWindow();
      while (focused != null && focused !== this.window) focused = focused.getParentWindow();
      onChange(focused != null);
    };
    app.on(`browser-window-blur`, check);
    app.on(`browser-window-focus`, check);
    check();
    return () => {
      app.off(`browser-window-blur`, check);
      app.off(`browser-window-focus`, check);
    };
  }

  // -------------------------------------------------------------------------
  // Quick Chat 焦点
  // -------------------------------------------------------------------------

  /** appshot 快捷键（原 handleQuickChatAppshotShortcut，15,864-15,895）。 */
  handleQuickChatAppshotShortcut(threadTarget: unknown = null): boolean {
    let window = this.window;
    if (
      process.platform !== `darwin` ||
      this.globalState.get(`electron-persisted-atom-state`)?.[`has-accepted-appshot-intro`] !==
        true ||
      (BrowserWindow.getFocusedWindow() != null && BrowserWindow.getFocusedWindow() !== window) ||
      !this.isOpen() ||
      (!this.isQuickChatPresentation && this.quickChatControls == null) ||
      window == null ||
      window.isDestroyed()
    )
      return false;
    let frontmost = this.quickChatKeyboardInteractionActive
      ? (this.previousQuickChatApplication ?? getFrontmostWindow())
      : getFrontmostWindow();
    this.previousQuickChatApplication = frontmost;
    frontmost.then((appInfo) => {
      if (
        appInfo == null ||
        window.isDestroyed() ||
        this.window !== window ||
        (!this.isQuickChatPresentation && this.quickChatControls == null)
      )
        return;
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `appshot-shortcut`,
        target: appInfo,
        threadTarget,
      });
    });
    return true;
  }

  /** 键盘交互开始/结束（原 handleQuickChatKeyboardInteraction，15,896-15,953）。 */
  handleQuickChatKeyboardInteraction(active: boolean, restoreFocus = false): void {
    if (!this.usesQuickChatBar) return;
    if (active) {
      if (this.quickChatKeyboardInteractionActive) return;
      this.quickChatKeyboardInteractionActive = true;
      let focused = BrowserWindow.getFocusedWindow();
      if (focused != null && focused !== this.window) this.previousQuickChatWindow = focused;
      else this.previousQuickChatApplication ??= getFrontmostWindow();
      return;
    }
    if (!this.quickChatKeyboardInteractionActive) return;
    this.quickChatKeyboardInteractionActive = false;
    let previousWindow = this.previousQuickChatWindow;
    let previousApplication = this.previousQuickChatApplication;
    this.previousQuickChatWindow = null;
    this.previousQuickChatApplication = null;
    if (!restoreFocus) return;
    if (previousWindow != null && !previousWindow.isDestroyed()) {
      previousWindow.focus();
      return;
    }
    if (previousApplication != null && process.platform === `darwin`) {
      previousApplication
        .then(async (appInfo) => {
          if (appInfo == null) return;
          let { stdout } = await promisify(execFile)(
            `/usr/bin/osascript`,
            [
              `-l`,
              `JavaScript`,
              `-e`,
              `ObjC.import("AppKit");
function run(argv) {
  const applications = $.NSRunningApplication.runningApplicationsWithBundleIdentifier(argv[0]);
  if (Number(applications.count) === 0) return false;
  // This background helper must request cross-app activation before macOS 14.
  const options = $.NSProcessInfo.processInfo.operatingSystemVersion.majorVersion < 14
    ? $.NSApplicationActivateIgnoringOtherApps
    : 0;
  return applications.objectAtIndex(0).activateWithOptions(options);
}`,
              `--`,
              appInfo.bundleIdentifier,
            ],
            { timeout: 5000 },
          );
          this.logger().debug(`Quick Chat previous application activation`, {
            safe: { activated: stdout.trim() === `true` },
          });
        })
        .catch((error) => {
          this.logger().warning(`Failed to restore previous application focus`, {
            safe: {},
            sensitive: { error },
          });
        });
    }
  }

  /** 重置键盘交互状态（原 resetQuickChatKeyboardInteraction）。 */
  resetQuickChatKeyboardInteraction(): void {
    this.quickChatKeyboardInteractionActive = false;
    this.previousQuickChatApplication = null;
    this.previousQuickChatWindow = null;
  }

  /** 请求 Quick Chat 焦点（原 focusQuickChat，15,959-15,975）。 */
  focusQuickChat(requestId?: number): void {
    let window = this.window;
    if (
      window != null &&
      !window.isDestroyed() &&
      !this.isAppQuitting &&
      this.shouldPresentWindow() &&
      this.usesQuickChatBar
    ) {
      this.setQuickChatStashed(window.webContents.id, null);
      if (requestId == null) this.setKeyboardInteraction(window.webContents.id, true);
      else if (this.pendingQuickChatFocus)
        this.pendingQuickChatFocus.hasLayout = this.pendingQuickChatFocus.hasLayout;
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `avatar-overlay-action`,
        action:
          requestId == null
            ? { type: `focus-quick-chat` }
            : { type: `focus-quick-chat`, requestId, wasHidden: true },
      });
    }
  }

  /** renderer 报告焦点已就绪（原 completeQuickChatFocus，15,976-15,997）。 */
  completeQuickChatFocus(webContentsId: number, requestId: number, layoutRevision: number): boolean {
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      window.webContents.id !== webContentsId ||
      this.pendingQuickChatFocus?.requestId !== requestId ||
      !this.pendingQuickChatFocus.hasLayout ||
      this.windowVisibilitySequence !== requestId ||
      this.layoutRevision !== layoutRevision ||
      this.isAppQuitting ||
      !this.usesQuickChatBar ||
      !this.shouldPresentWindow() ||
      this.hiddenForApplicationHide ||
      !this.rendererReady ||
      this.initialPresentationState !== `ready` ||
      this.awaitingRealtimeVoicePresentation
    )
      return false;
    this.pendingQuickChatFocus = null;
    this.showWindowIfReady(window);
    this.setKeyboardInteraction(webContentsId, true);
    return true;
  }

  /** 取消焦点请求（原 cancelQuickChatFocus）。 */
  cancelQuickChatFocus(): void {
    let pending = this.pendingQuickChatFocus;
    this.pendingQuickChatFocus = null;
    let window = this.window;
    if (pending != null && window != null && !window.isDestroyed()) {
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `avatar-overlay-action`,
        action: { type: `cancel-quick-chat-focus`, requestId: pending.requestId },
      });
    }
  }

  // -------------------------------------------------------------------------
  // 呈现控制
  // -------------------------------------------------------------------------

  /** 准备呈现（原 preparePresentation，16,010-16,017）。 */
  preparePresentation(origin: unknown, velocity: Point | null): void {
    this.quickChatStashedEdge = null;
    this.cancelMomentum();
    this.restoreDockAnchor();
    this.pendingPresentation = { origin, target: { ...this.anchor }, velocity };
    let window = this.window;
    if (window != null && !window.isDestroyed())
      this.positionPresentationAtOrigin(window, origin);
  }

  /** 呈现入坞（原 dockPresentation，16,018-16,028）。 */
  dockPresentation(target: { centerX: number; centerY: number }, onDock: () => void, velocity?: Point): void {
    this.pendingPresentation = null;
    let window = this.window;
    if (window == null || window.isDestroyed()) {
      onDock();
      return;
    }
    this.dockRestoreAnchor ??= { ...this.anchor };
    let dockAnchor = anchorForDockTarget(target, this.mascotSize, this.presentationOffset);
    this.animatePresentationTo(dockAnchor, velocity ?? dockingVelocity(this.anchor, dockAnchor), onDock);
  }

  /** 呈现淡出（原 fadeOutPresentation）。 */
  fadeOutPresentation(onDone: () => void): void {
    this.setPresentationAccessoriesVisible(false);
    let window = this.window;
    if (window == null || window.isDestroyed() || !window.isVisible()) {
      onDone();
      return;
    }
    this.fadePresentation(window, window.getOpacity(), FADE_START_OPACITY, onDone);
  }

  /** 准备淡入（原 preparePresentationForFadeIn）。 */
  preparePresentationForFadeIn(): void {
    this.cancelPresentationFade();
    this.cancelMomentum();
    this.restoreDockAnchor();
    this.presentationFadeInPending = true;
    let window = this.window;
    if (window != null && !window.isDestroyed()) window.setOpacity(FADE_START_OPACITY);
  }

  /** 恢复附件可见（原 restorePresentationAccessories）。 */
  restorePresentationAccessories(): void {
    this.setPresentationAccessoriesVisible(true);
  }

  /** 取消呈现入坞（原 cancelPresentationDock，16,049-16,069）。 */
  cancelPresentationDock(): void {
    if (this.windowHideAnimation != null) return;
    this.cancelPresentationFade();
    let pending = this.pendingPresentation;
    this.pendingPresentation = null;
    if (pending != null && this.dockRestoreAnchor == null) {
      this.initialPresentationState = `ready`;
      this.dockRestoreAnchor = pending.target;
      this.restoreDockAnchor();
      this.restorePresentationAccessories();
      return;
    }
    let restoreAnchor = this.dockRestoreAnchor;
    if (restoreAnchor == null) {
      this.restorePresentationAccessories();
      return;
    }
    this.animatePresentationTo(restoreAnchor, dockingVelocity(this.anchor, restoreAnchor), () => {
      if (this.dockRestoreAnchor === restoreAnchor) this.dockRestoreAnchor = null;
      this.restorePresentationAccessories();
    });
  }

  /** 呈现偏移整体迁移（原 updatePresentationOffset，16,070-16,087）。 */
  updatePresentationOffset(offset: Point): void {
    let previous = this.presentationOffset;
    let dx = previous.x - offset.x;
    let dy = previous.y - offset.y;
    if (dx === 0 && dy === 0) return;
    this.presentationOffset = offset;
    let movingTargets = new Set<Rect | null>([
      this.pendingPresentation?.target ?? null,
      this.dockRestoreAnchor,
      this.presentationMotionTarget,
    ]);
    for (let target of movingTargets) {
      if (target != null) {
        target.x += dx;
        target.y += dy;
      }
    }
    let window = this.window;
    if (window == null || window.isDestroyed()) return;
    this.anchor = { ...this.anchor, x: this.anchor.x + dx, y: this.anchor.y + dy };
    this.applyLayout(window, screen.getDisplayNearestPoint(anchorCenter(this.anchor)));
  }

  /** 设置入坞目标（原 setPresentationDockTarget）。 */
  setPresentationDockTarget(anchor: { centerX: number; centerY: number } | null, onDock: (() => void) | null): void {
    this.dockTarget = anchor == null || onDock == null ? null : { anchor, onDock };
  }

  /** 开发模式窗口配置（原 configureDevelopmentWindow）。 */
  configureDevelopmentWindow({ mascotWidth, placement }: { mascotWidth: number; placement: OverlayPlacement }): void {
    let window = this.window;
    if (window == null || window.isDestroyed()) return;
    let display = this.getCurrentDisplay();
    let bounds = this.layoutMode === `native` ? display.workArea : display.bounds;
    let size = mascotSizeForWidth(mascotWidth);
    this.mascotSize = size;
    this.placement = placement;
    this.anchor = {
      x: placement.endsWith(`start`) ? bounds.x + 24 : bounds.x + bounds.width - size.width - 24,
      y: placement.startsWith(`bottom`) ? bounds.y + 24 : bounds.y + bounds.height - size.height - 24,
      ...size,
    };
    this.applyLayout(window, display);
  }

  /** 开发诊断（原 getDevelopmentDiagnostics）。 */
  getDevelopmentDiagnostics(): { layout: unknown } {
    return { layout: this.layout == null ? null : rendererLayoutSubset(this.layout) };
  }

  /** 反馈日志条目（原 getFeedbackLogEntries，16,109-16,166）。 */
  getFeedbackLogEntries(): Array<{ contents: Buffer; name: string }> {
    if (!this.feedbackDiagnosticsEnabled) return [];
    try {
      let window = this.window;
      return [
        {
          contents: Buffer.from(
            JSON.stringify(
              {
                anchor: this.anchor,
                displayBounds: this.displayBounds,
                displayId: this.displayId,
                displays: screen.getAllDisplays().map((display) => ({
                  bounds: display.bounds,
                  id: display.id,
                  rotation: display.rotation,
                  scaleFactor: display.scaleFactor,
                  workArea: display.workArea,
                })),
                initialPresentationState: this.initialPresentationState,
                isSuspended: this.isSuspended,
                layout: this.layout,
                layoutMode: this.layoutMode,
                mascotSize: this.mascotSize,
                rendererReady: this.rendererReady,
                resolutionKey: this.resolutionKey,
                traySize: this.traySize,
                window:
                  window == null
                    ? null
                    : window.isDestroyed()
                      ? { destroyed: true }
                      : {
                          bounds: window.getBounds(),
                          contentBounds: window.getContentBounds(),
                          destroyed: false,
                          visible: window.isVisible(),
                        },
              },
              null,
              2,
            ),
          ),
          name: `native-pet-state.json`,
        },
      ];
    } catch (error) {
      this.logger().warning(`Failed to capture native pet diagnostics`, {
        safe: {},
        sensitive: { error },
      });
      return [];
    }
  }

  /** 开关反馈诊断（原 setFeedbackDiagnosticsEnabled）。 */
  setFeedbackDiagnosticsEnabled(enabled: boolean): void {
    this.feedbackDiagnosticsEnabled = enabled;
  }

  /** 对账 remote-hosted PIP 宿主（原 reconcileRemoteHostedPIPContentHost）。 */
  reconcileRemoteHostedPIPContentHost(): void {
    this.publishRemoteHostedPIPContentHost();
  }

  // -------------------------------------------------------------------------
  // 开关与生命周期入口
  // -------------------------------------------------------------------------

  /** 切换显示（原 toggle，16,173-16,181）。 */
  async toggle(origin: unknown): Promise<void> {
    if (this.realtimeController.isSessionReserved()) return;
    let window = this.window;
    if (window != null && !window.isDestroyed() && this.shouldPresentWindow()) {
      this.dismiss();
      return;
    }
    await this.wake(origin);
  }

  /** 全局热键切换（原 toggleFromHotkey，16,182-16,204）。 */
  async toggleFromHotkey(): Promise<void> {
    if (this.isAppQuitting || this.realtimeController.isSessionReserved()) return;
    this.logger().debug(`Showing pet from global hotkey`, {
      safe: { isOpen: this.isOpen(), usesQuickChatBar: this.usesQuickChatBar },
    });
    if (!this.isOpen() || this.hiddenForApplicationHide || this.windowHideAnimation === `running`) {
      this.resetQuickChatKeyboardInteraction();
      await this.open(null, { forcePetView: true, focusQuickChat: true });
      return;
    }
    let window = this.window;
    if (window != null && BrowserWindow.getFocusedWindow() === window) {
      this.logger().debug(`Toggling Quick Chat focus from global hotkey`);
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `avatar-overlay-action`,
        action: { type: `toggle-quick-chat` },
      });
      return;
    }
    this.focusQuickChat();
  }

  /** 唤醒（原 wake，16,205-16,213）。 */
  async wake(origin: unknown = null): Promise<void> {
    if (this.realtimeController.isSessionReserved()) return;
    let window = this.window;
    if (this.petOpenIntent && window != null && !window.isDestroyed() && this.shouldPresentWindow()) {
      this.publishRemoteHostedPIPContentHost();
      return;
    }
    await this.open(origin, { forcePetView: true });
  }

  /** 关闭（dismiss 语义，原 dismiss，16,214-16,216）。 */
  dismiss(): void {
    this.isDismissedWindowRetained = true;
    this.hide();
    this.realtimeController.resetSession();
  }

  /** 关闭并销毁（原 close，16,217-16,227）。 */
  close(): void {
    this.realtimeController.resetSession();
    this.hide(false);
    if (this.isQuickChatPresentation && !this.isAppQuitting) {
      this.logger().info(`Quick Chat renderer retained after dismissal`);
      return;
    }
    this.destroyHiddenWindow();
  }

  /** 隐藏（原 hide，16,228-16,235）。 */
  hide(animate = true): void {
    if (animate) this.windowHideAnimation = this.windowHideAnimation ?? `pending`;
    else this.cancelPresentationFade();
    this.globalState.set(AVATAR_OVERLAY_OPEN_KEY, false);
    this.petOpenIntent = false;
    this.reconcileWindowVisibility();
  }

  /** 设置呈现可见性（原 setPresentationVisibility）。 */
  setPresentationVisibility(visible: boolean | null): void {
    if (visible == null) {
      this.updatePresentationOffset({ x: 0, y: 0 });
      this.restorePresentationAccessories();
    } else {
      this.startupPresentationVisibility = null;
    }
    this.presentationVisibility = visible;
    this.reconcileWindowVisibility();
  }

  /** 应用退出标记（原 markAppQuitting）。 */
  markAppQuitting(): void {
    this.cancelQuickChatFocus();
    this.cancelPresentationFade();
    this.isAppQuitting = true;
    this.isDismissedWindowRetained = false;
    this.clearDismissedWindowCleanup();
    this.removeApplicationLifecycleListeners();
    this.realtimeController.resetSession();
    this.updatePresentationOffset({ x: 0, y: 0 });
    this.presentationVisibility = null;
    this.startupPresentationVisibility = null;
    this.windowVisibilitySequence += 1;
  }

  /** 打开（原 open，16,256-16,283）。 */
  async open(
    origin: unknown,
    {
      forcePetView = false,
      focusQuickChat = false,
      persistPetIntent = true,
    }: { forcePetView?: boolean; focusQuickChat?: boolean; persistPetIntent?: boolean } = {},
  ): Promise<void> {
    if (this.windowHideAnimation === `pending`) this.windowHideAnimation = null;
    if (persistPetIntent) {
      this.globalState.set(AVATAR_OVERLAY_OPEN_KEY, true);
      this.petOpenIntent = true;
    }
    let sequence = ++this.windowVisibilitySequence;
    this.cancelQuickChatFocus();
    this.pendingQuickChatFocus = focusQuickChat ? { requestId: sequence, hasLayout: false } : null;
    let window = await this.ensureWindow(sequence);
    if (window == null || sequence !== this.windowVisibilitySequence) return;
    if (focusQuickChat) {
      if (this.windowHideAnimation === `running`) window.hide();
      this.clearApplicationHideCheck();
      this.hiddenForApplicationHide = false;
      this.cancelMomentum();
      this.quickChatDrawOffset = { x: 0, y: 0 };
      this.pendingPresentation = null;
      this.cancelPresentationFade(window);
    }
    this.positionWindow(window, origin);
    if (this.pendingPresentation != null) {
      this.pendingPresentation.target = { ...this.anchor };
      this.positionPresentationAtOrigin(window, this.pendingPresentation.origin);
    }
    this.presentWindow(window);
    if (forcePetView) {
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `avatar-overlay-explicit-pet-opened`,
      });
    }
    if (focusQuickChat) this.focusQuickChat(sequence);
  }

  /** 呈现窗口（原 presentWindow，16,284-16,292）。 */
  private presentWindow(window: BrowserWindow): void {
    if (this.windowHideAnimation === `running`) this.cancelPresentationFade(window);
    if (this.petOpenIntent) this.isDismissedWindowRetained = false;
    this.clearDismissedWindowCleanup();
    if (this.hiddenForApplicationHide || this.awaitingRealtimeVoicePresentation) return;
    this.updateRendererBackgroundThrottling();
    this.updateCssPetControlsProximityTracking();
    this.showWindowIfReady(window);
  }

  /** realtime 呈现准备（原 prepareRealtimePresentation，16,293-16,316）。 */
  private async prepareRealtimePresentation(origin: unknown, useGlobalOverlay: boolean): Promise<void> {
    if (this.isAppQuitting) {
      this.realtimeController.resetSession();
      return;
    }
    this.cancelQuickChatFocus();
    if (useGlobalOverlay && this.realtimeController.isGlobalHotkeySessionReserved()) {
      this.awaitingRealtimeVoicePresentation = true;
      let window = this.window;
      if (window != null && !window.isDestroyed()) {
        if (window.isVisible()) window.hide();
        this.sendLayoutToRenderer(window);
      }
    }
    if (this.presentationVisibility == null) this.startupPresentationVisibility = useGlobalOverlay;
    let sequence = ++this.windowVisibilitySequence;
    let window = await this.ensureWindow(sequence);
    if (window == null || sequence !== this.windowVisibilitySequence) return;
    if ((this.presentationVisibility ?? this.startupPresentationVisibility) === true) {
      this.positionWindow(window, origin);
      if (this.pendingPresentation != null) {
        this.pendingPresentation.target = { ...this.anchor };
        this.positionPresentationAtOrigin(window, this.pendingPresentation.origin);
      }
    }
    this.reconcileWindowVisibility();
  }

  /** 恢复打开状态（原 restoreOpenState）。 */
  async restoreOpenState(origin: unknown): Promise<void> {
    if (this.globalState.get(`electron-avatar-overlay-open`) === true) await this.open(origin);
  }

  /** 预热（原 prewarm）。 */
  async prewarm(origin: unknown): Promise<void> {
    if (this.window != null || this.openingWindowPromise != null || this.isAppQuitting) return;
    let sequence = this.windowVisibilitySequence;
    let window = await this.ensureWindow(sequence);
    if (window != null && sequence === this.windowVisibilitySequence)
      this.positionWindow(window, origin);
  }

  /** renderer 就绪（原 handleRendererReady，16,326-16,340）。 */
  handleRendererReady(webContentsId: number): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId) return;
    this.rendererReady = true;
    if (this.pendingQuickChatFocus != null) {
      this.pendingQuickChatFocus.hasLayout = false;
      this.focusQuickChat(this.pendingQuickChatFocus.requestId);
    }
    this.updateRendererBackgroundThrottling();
    this.lastSentRendererState = null;
    this.sendLayoutToRenderer(window);
    this.sendComputerUseCursorLocationToRenderer(window);
    if (this.shouldPresentWindow()) this.presentWindow(window);
  }

  /** 指针交互开关（原 setPointerInteraction）。 */
  setPointerInteraction(webContentsId: number, interactive: boolean): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId) return;
    this.pointerInteractive = interactive;
    if (this.movedWindowPersistTimer == null) this.applyPointerInteractivityPolicy();
  }

  /** 键盘交互开关（原 setKeyboardInteraction，16,349-16,385）。 */
  setKeyboardInteraction(webContentsId: number, active: boolean, restoreFocus = false): void {
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      window.webContents.id !== webContentsId ||
      (active && (!this.shouldPresentWindow() || this.pendingQuickChatFocus != null))
    )
      return;
    this.applyPointerInteractivityPolicy();
    let panelWindow =
      this.nonactivatingPanelBridge?.fromPointer(window.getNativeWindowHandle()).window() ?? null;
    if (!active) {
      if (panelWindow?.isKeyWindow()) panelWindow.resignKeyWindow();
      window.setFocusable(false);
      this.refreshNativeActiveAppearance(window);
      this.handleQuickChatKeyboardInteraction(false, restoreFocus && panelWindow == null);
      return;
    }
    this.handleQuickChatKeyboardInteraction(true);
    window.setFocusable(true);
    this.refreshNativeActiveAppearance(window);
    if (panelWindow == null) {
      this.windowManager.setPendingAuxiliaryActivationTarget(window);
      window.show();
      if (process.platform === `darwin`) app.focus({ steal: true });
      window.focus();
      window.webContents.focus();
    } else {
      window.showInactive();
      panelWindow.makeKeyAndOrderFront$(null);
    }
    this.applyPointerInteractivityPolicy();
    this.logger().debug(`Pet keyboard focus requested`, {
      safe: { nonactivating: panelWindow != null, isKeyWindow: panelWindow?.isKeyWindow() },
    });
    this.windowManager.sendMessageToWebContents(window.webContents, {
      type: `avatar-overlay-keyboard-interaction-ready`,
    });
  }
  // -------------------------------------------------------------------------
  // 拖动
  // -------------------------------------------------------------------------

  /** 开始拖动（原 startDrag，16,386-16,417）。 */
  startDrag(webContentsId: number, pointer: { pointerWindowX: number; pointerWindowY: number; pointerScreenX?: number; pointerScreenY?: number }, disableNativeDrag = false): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId) return;
    if (this.nativeWindowDragActive) this.endDrag(webContentsId, undefined, false, `button-released`);
    this.cancelMomentum();
    this.clearMovedWindowPersist();
    this.clearNativeWindowDragCompletionTimer();
    this.dockRestoreAnchor = null;
    this.nativeWindowDragActive = false;
    this.suppressNextRendererThrow = false;
    this.clearDetachedDisplayRestore();
    let layout = this.getLayout(window);
    let cursorPoint =
      pointer.pointerScreenX != null && pointer.pointerScreenY != null
        ? { x: pointer.pointerScreenX, y: pointer.pointerScreenY }
        : screen.getCursorScreenPoint();
    let anchorX = pointer.pointerWindowX - layout.mascot.left;
    let anchorY = pointer.pointerWindowY - layout.mascot.top;
    this.dragState = new CursorTracker(`renderer`, anchorX, anchorY, screen.getDisplayNearestPoint(cursorPoint).bounds);
    this.nativeWindowDragStart =
      this.layoutMode === `native` &&
      this.nativeWindowDragTargetRegistered &&
      this.quickChatStashedEdge == null &&
      !disableNativeDrag &&
      !(
        process.platform === `darwin` &&
        this.isQuickChatPresentation &&
        screen.getAllDisplays().length > 1
      )
        ? { pointerScreenX: cursorPoint.x, pointerScreenY: cursorPoint.y }
        : null;
  }

  /** 拖动移动（原 moveDrag，16,418-16,477）。 */
  moveDrag(webContentsId: number, pointer: { pointerScreenX?: number; pointerScreenY?: number } | undefined): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId || this.dragState == null)
      return;
    this.cancelMomentum();
    let dragState = this.dragState;
    dragState.recordMovementIntent();
    if (this.quickChatStashedEdge != null) {
      this.quickChatStashedEdge = null;
      this.quickChatPosition = null;
      this.isFreelyPositioned = true;
    }
    if (this.nativeWindowDragActive) return;
    let nativeStart = this.nativeWindowDragStart;
    this.nativeWindowDragStart = null;
    if (nativeStart != null) {
      this.nativeWindowDragActive = true;
      let mascot = this.getLayout(window).mascot;
      let handedOff = performWindowDrag(
        window,
        nativeStart,
        screen.getAllDisplays().map((display) => {
          let drawBounds = displayDrawBounds(display, this.layoutMode);
          let anchorAtOrigin = this.getLayoutForDisplay(display, { ...this.anchor, x: drawBounds.x, y: drawBounds.y }).anchor;
          let anchorAtFarCorner = this.getLayoutForDisplay(display, {
            ...this.anchor,
            x: drawBounds.x + drawBounds.width,
            y: drawBounds.y + drawBounds.height,
          }).anchor;
          return {
            displayBounds: display.bounds,
            windowOriginBounds: {
              x: anchorAtOrigin.x - mascot.left,
              y: anchorAtOrigin.y - mascot.top,
              width: Math.max(0, anchorAtFarCorner.x - anchorAtOrigin.x),
              height: Math.max(0, anchorAtFarCorner.y - anchorAtOrigin.y),
            },
          };
        }),
      );
      this.nativeWindowDragActive = handedOff;
      this.logger().info(`Native pet window drag handoff`, {
        safe: { driver: `appkit-events`, started: handedOff },
      });
      if (handedOff) {
        this.nativeWindowDragCompletionTimer = setInterval(() => {
          if (!isWindowDragActive(window))
            this.endDrag(window.webContents.id, undefined, false, `button-released`);
        }, NATIVE_DRAG_POLL_INTERVAL_MS);
        return;
      }
    }
    let cursor = screen.getCursorScreenPoint();
    let point = dragState.getCursorPointForSource({
      native: null,
      renderer: { x: pointer?.pointerScreenX ?? cursor.x, y: pointer?.pointerScreenY ?? cursor.y },
    });
    if (point != null) this.moveDragToPointer(window, point);
  }

  /** 结束拖动（原 endDrag，16,478-16,547）。 */
  endDrag(
    webContentsId: number,
    pointer: { pointerScreenX?: number; pointerScreenY?: number } | undefined,
    altKey = false,
    reason = `released`,
  ): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId || this.dragState == null)
      return;
    let dragState = this.dragState;
    let wasNativeDrag = this.nativeWindowDragActive;
    let nativeResult = wasNativeDrag ? finishWindowDrag(window) : null;
    let nativeBounds = nativeResult?.bounds;
    let shouldDock = wasNativeDrag ? nativeResult?.altKey === true : altKey;
    if (wasNativeDrag) {
      this.handleNativeWindowDragMove(window, nativeBounds);
      this.logger().info(`Native pet window drag finished`, { safe: { reason } });
    } else if (dragState.didHaveMovementIntent) {
      let cursor = screen.getCursorScreenPoint();
      let point = dragState.getCursorPointForSource({
        native: null,
        renderer: { x: pointer?.pointerScreenX ?? cursor.x, y: pointer?.pointerScreenY ?? cursor.y },
      });
      if (point != null) this.moveDragToPointer(window, point);
    }
    this.suppressNextRendererThrow = wasNativeDrag || dragState.shouldSuppressRendererThrow();
    this.dragState = null;
    this.clearNativeWindowDragCompletionTimer();
    this.nativeWindowDragActive = false;
    this.nativeWindowDragStart = null;
    if (dragState.didHaveMovementIntent) {
      this.isFreelyPositioned = !shouldDock;
      this.quickChatPosition = null;
    }
    if (shouldDock && dragState.didHaveMovementIntent) {
      let cursor = screen.getCursorScreenPoint();
      let dockPoint: Point = cursor;
      if (wasNativeDrag)
        dockPoint = { x: this.anchor.x + dragState.pointerAnchorX, y: this.anchor.y + dragState.pointerAnchorY };
      else if (pointer != null)
        dockPoint = { x: pointer.pointerScreenX!, y: pointer.pointerScreenY! };
      let display = screen.getDisplayNearestPoint(dockPoint);
      let position = positionFromPoint(dockPoint, display.workArea);
      this.clearMovedWindowPersist();
      this.hasDeferredLayout = false;
      this.suppressNextRendererThrow = true;
      if (this.isQuickChatPresentation) {
        this.snapQuickChatToPosition(display, position, true);
      } else {
        let dockAnchor = placeQuickChatAtPosition(position, display, this.mascotSize, this.mascotSize);
        if (position.startsWith(`bottom`) && this.showsPetControls) {
          dockAnchor.y -= Math.max(
            this.petControlsAppearance.hoverOffsetY + this.petControlsAppearance.hoverControlSize,
            this.quickChatControls == null ? 0 : 40,
          );
        }
        this.animatePresentationTo(dockAnchor, { x: 0, y: 0 }, () => this.persistWindowBounds(window, display), null, true);
      }
      return;
    }
    if (wasNativeDrag) {
      this.rememberMovedWindow(window, nativeBounds ?? this.layout?.windowBounds);
      this.persistWindowBounds(window);
    } else {
      this.hasDeferredLayout = false;
      this.reclampWindowToVisibleDisplay({ shouldPersist: true });
    }
    let dockTarget = this.dockTarget;
    let movingCenter = offsetAnchorCenter(this.anchor, this.presentationOffset);
    if (
      dockTarget != null &&
      computeDockAttraction({
        current: movingCenter,
        next: movingCenter,
        target: { x: dockTarget.anchor.centerX, y: dockTarget.anchor.centerY },
      }).shouldDock
    ) {
      this.dockPresentation(dockTarget.anchor, dockTarget.onDock);
    }
  }

  /** renderer throw（原 throwWithVelocity，16,548-16,561）。 */
  throwWithVelocity(webContentsId: number, velocityX: number, velocityY: number, force = false): void {
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      window.webContents.id !== webContentsId ||
      !Number.isFinite(velocityX) ||
      !Number.isFinite(velocityY) ||
      (velocityX === 0 && velocityY === 0)
    )
      return;
    let suppressed = this.suppressNextRendererThrow;
    this.suppressNextRendererThrow = false;
    if (!suppressed || force) this.startMomentum(velocityX, velocityY, force);
  }

  /** 动量运动（原 startMomentum，16,562-16,629）。 */
  startMomentum(velocityX: number, velocityY: number, bounceOffDisplay = false): void {
    let window = this.window;
    if (window == null || window.isDestroyed()) return;
    this.cancelMomentum();
    if (this.dockTarget != null) this.dockRestoreAnchor ??= { ...this.anchor };
    this.momentumActive = true;
    let vx = velocityX;
    let vy = velocityY;
    let webContentsId = window.webContents.id;
    let startTime = Date.now();
    let lastFrameTime = startTime;
    let step = () => {
      let currentWindow = this.window;
      if (currentWindow == null || currentWindow.isDestroyed() || currentWindow.webContents.id !== webContentsId) {
        this.cancelMomentum();
        return;
      }
      this.momentumTimer = null;
      let now = Date.now();
      let clampedDelta = Math.min(Math.max(0, now - lastFrameTime), MAX_FRAME_DELTA_MS);
      lastFrameTime = now;
      let dt = clampedDelta / 1000;
      let center = anchorCenter(this.anchor);
      let position = { x: center.x + vx * dt, y: center.y + vy * dt };
      let dockTarget = this.dockTarget;
      if (dockTarget != null) {
        let dockPoint = { x: dockTarget.anchor.centerX, y: dockTarget.anchor.centerY };
        let attraction = computeDockAttraction({
          current: offsetPoint(center, this.presentationOffset),
          next: offsetPoint(position, this.presentationOffset),
          target: dockPoint,
        });
        vx += attraction.acceleration.x * dt;
        vy += attraction.acceleration.y * dt;
        position = { x: center.x + vx * dt, y: center.y + vy * dt };
        if (
          computeDockAttraction({
            current: offsetPoint(center, this.presentationOffset),
            next: offsetPoint(position, this.presentationOffset),
            target: dockPoint,
          }).shouldDock
        ) {
          this.momentumActive = false;
          this.dockPresentation(dockTarget.anchor, dockTarget.onDock, { x: vx, y: vy });
          return;
        }
      }
      let nextAnchor = {
        ...this.anchor,
        x: position.x - this.anchor.width / 2,
        y: position.y - this.anchor.height / 2,
      };
      let display = bounceOffDisplay
        ? this.getCurrentDisplay()
        : screen.getDisplayNearestPoint(anchorCenter(nextAnchor));
      this.anchor = nextAnchor;
      this.applyLayout(currentWindow, display);
      if (this.anchor.x !== Math.round(nextAnchor.x)) vx = bounceOffDisplay ? -vx * BOUNCE_FACTOR : 0;
      if (this.anchor.y !== Math.round(nextAnchor.y)) vy = bounceOffDisplay ? -vy * BOUNCE_FACTOR : 0;
      let decay = MOMENTUM_FRAME_DECAY ** +(clampedDelta / MOMENTUM_DECAY_FRAME_MS);
      vx *= decay;
      vy *= decay;
      if (now - startTime >= MOMENTUM_MAX_DURATION_MS || Math.hypot(vx, vy) < MOMENTUM_MIN_SPEED) {
        this.momentumActive = false;
        this.dockRestoreAnchor = null;
        this.persistWindowBounds(currentWindow);
        return;
      }
      this.momentumTimer = setTimeout(step, ANIMATION_FRAME_MS);
    };
    this.momentumTimer = setTimeout(step, ANIMATION_FRAME_MS);
  }

  // -------------------------------------------------------------------------
  // renderer 布局驱动
  // -------------------------------------------------------------------------

  /** renderer 上报元素尺寸（原 setElementSizes，16,630-16,731）。 */
  setElementSizes(webContentsId: number, sizes: RendererElementSizes): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId) return;
    let focusRequestId = sizes.quickChatFocusRequestId;
    if (this.pendingQuickChatFocus != null) {
      if (this.pendingQuickChatFocus.requestId === focusRequestId)
        this.pendingQuickChatFocus.hasLayout = true;
      else if (focusRequestId == null) this.pendingQuickChatFocus.hasLayout = false;
    }
    let mode: OverlayLayoutMode = sizes.isTrayVisible == null ? `native` : `legacy`;
    let presentationSwitched = (sizes.presentation === `quick-chat`) !== this.isQuickChatPresentation;
    let trayChanged = !deepEqual(sizes.tray, this.traySize);
    let controlsChanged =
      presentationSwitched ||
      !deepEqual(sizes.quickChat, this.quickChatControls) ||
      (sizes.quickChat?.isActivityVisible === true && trayChanged);
    let resizeDrawAnchor =
      window.isVisible() &&
      this.isQuickChatPresentation &&
      !presentationSwitched &&
      controlsChanged &&
      this.dragState == null &&
      this.layout != null
        ? {
            ...this.layout.anchor,
            x: this.layout.anchor.x + this.quickChatDrawOffset.x,
            y: this.layout.anchor.y + this.quickChatDrawOffset.y,
          }
        : this.quickChatResizeDrawAnchor;
    if (
      (mode !== this.layoutMode ||
        presentationSwitched ||
        !sameSize(sizes.mascot, this.mascotSize) ||
        (sizes.realtimeCaptionAboveMascotPx ?? 0) !== this.realtimeCaptionAboveMascotPx ||
        (sizes.showsPetControls ?? false) !== this.showsPetControls ||
        (trayChanged && (!this.isQuickChatPresentation || sizes.quickChat?.isActivityVisible === true))) &&
      this.cancelMomentum();
    this.layoutMode = mode;
    this.isQuickChatPresentation = sizes.presentation === `quick-chat`;
    this.quickChatControls = sizes.quickChat ?? null;
    if (!this.isQuickChatPresentation) {
      this.quickChatPosition = null;
      this.quickChatStashedEdge = null;
      this.quickChatDrawOffset = { x: 0, y: 0 };
    }
    if (!this.usesQuickChatBar) {
      this.resetQuickChatKeyboardInteraction();
      if (!sizes.isQuickChatLoading) this.cancelQuickChatFocus();
    }
    if (this.pendingQuickChatFocus != null && focusRequestId == null)
      this.focusQuickChat(this.pendingQuickChatFocus.requestId);
    this.realtimeCaptionAboveMascotPx = sizes.realtimeCaptionAboveMascotPx ?? 0;
    this.petControlsAppearance = sizes.petControlsAppearance ?? DEFAULT_PET_CONTROLS_APPEARANCE;
    this.showsPetControls = sizes.showsPetControls ?? false;
    if (
      this.awaitingRealtimeVoicePresentation &&
      sizes.isGlobalRealtimeVoiceTransitioning === true &&
      this.realtimeController.isGlobalHotkeySessionReserved()
    )
      this.awaitingRealtimeVoicePresentation = false;
    if (this.initialPresentationState === `waiting-for-layout` || presentationSwitched) {
      this.anchor = { ...this.anchor, ...sizes.mascot };
      this.initialPresentationState = `ready`;
    }
    this.updateCssPetControlsProximityTracking();
    this.mascotSize = sizes.mascot;
    this.traySize = sizes.tray ?? null;
    if (
      presentationSwitched &&
      !this.isQuickChatPresentation &&
      !this.shouldPresentWindow() &&
      !this.realtimeController.isSessionReserved()
    ) {
      this.close();
      return;
    }
    if (this.nativeWindowDragActive || this.movedWindowPersistTimer != null) {
      this.hasDeferredLayout = true;
      return;
    }
    this.quickChatResizeDrawAnchor =
      window.isVisible() &&
      this.isQuickChatPresentation &&
      (this.quickChatStashedEdge == null || this.momentumActive)
        ? resizeDrawAnchor
        : null;
    this.applyLatestElementSizes(window);
    if (this.isQuickChatPresentation && controlsChanged && !this.isFreelyPositioned && this.dragState == null) {
      let display = this.getCurrentDisplay();
      this.snapQuickChatToPosition(
        display,
        this.quickChatPosition ?? positionFromPoint(anchorCenter(this.anchor), display.workArea),
        !presentationSwitched && window.isVisible(),
      );
    }
    this.showWindowIfReady(window);
  }

  /** Quick Chat 贴边收纳（原 setQuickChatStashed，16,732-16,765）。 */
  setQuickChatStashed(webContentsId: number, edge: string | null): void {
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      window.webContents.id !== webContentsId ||
      !this.isQuickChatPresentation ||
      this.dragState != null ||
      this.quickChatStashedEdge === edge
    )
      return;
    let display = this.getCurrentDisplay();
    if (
      (edge === `left` && display.workArea.x > display.bounds.x) ||
      (edge === `right` && display.workArea.x + display.workArea.width < display.bounds.x + display.bounds.width)
    ) {
      this.logger().info(`Quick Chat ignored stash against Dock`, { safe: { edge } });
      return;
    }
    let nearestEdge = this.getLayoutForDisplay(display).quickChat?.nearestStashEdge;
    if (edge != null && nearestEdge != null && edge !== nearestEdge) {
      this.logger().info(`Quick Chat ignored opposite-edge stash`, {
        safe: { edge, nearestEdge },
      });
      return;
    }
    let position = this.quickChatPosition ?? positionFromPoint(anchorCenter(this.anchor), display.workArea);
    this.quickChatStashedEdge = edge;
    this.quickChatResizeDrawAnchor = null;
    if (edge != null) this.setKeyboardInteraction(webContentsId, false, true);
    this.logger().info(`Quick Chat stash changed`, { safe: { edge } });
    this.snapQuickChatToPosition(display, position, window.isVisible(), true);
    this.applyLayout(window, display);
  }

  /** renderer 上报输入形状与宠物控件邻近区域（原 setPointerRegions）。 */
  setPointerRegions(webContentsId: number, inputShape: InputShapeRect[], proximityRects: InputShapeRect[]): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || window.webContents.id !== webContentsId) return;
    this.inputShape = inputShape;
    this.petControlsProximityRects = proximityRects;
    this.applyPointerInteractivityPolicy();
  }
}
