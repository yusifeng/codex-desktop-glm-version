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
import { app, BrowserWindow, powerMonitor, screen } from "electron";
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
  ANIMATION_FRAME_MS,
  AVATAR_OVERLAY_HOST_ID,
  AVATAR_OVERLAY_ROUTE,
  BOUNCE_FACTOR,
  DEFAULT_MASCOT_SIZE,
  DEFAULT_PET_CONTROLS_APPEARANCE,
  DETACHED_DISPLAY_REMEMBER_MS,
  DISMISSED_WINDOW_CLEANUP_DELAY_MS,
  FADE_DURATION_MS,
  FADE_START_OPACITY,
  HIDE_FADE_DURATION_MS,
  LEGACY_TRAY_SIZE,
  MAX_FRAME_DELTA_MS,
  MOMENTUM_DECAY_FRAME_MS,
  MOMENTUM_FRAME_DECAY,
  MOMENTUM_MAX_DURATION_MS,
  MOMENTUM_MIN_SPEED,
  MOVED_WINDOW_PERSIST_DELAY_MS,
  MOVEMENT_SPRING,
  NATIVE_DRAG_POLL_INTERVAL_MS,
  NATIVE_VIEWPORT_SIZE,
  NATIVE_TRAY_SIZE,
  PROXIMITY_POLL_INTERVAL_MS,
  QUICK_CHAT_MIN_SNAP_WIDTH_PX,
  SNAP_DISTANCE_THRESHOLD_PX,
  SNAP_SETTLE_MAX_DURATION_MS,
  SNAP_SPEED_THRESHOLD_PX,
  SNAP_SPRING_DAMPING,
  SNAP_SPRING_STIFFNESS,
  quickChatRestingWidth,
} from "./constants";
import {
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
  relativeRect,
  rendererLayoutSubset,
  resolutionKeyForBounds,
  sameSize,
  storedPlacementForDisplay,
} from "./geometry";

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
  private supportsInputShape = (BrowserWindow as unknown as { isInputShapeSupported?(): boolean }).isInputShapeSupported?.() ?? false;

  private window: BrowserWindow | null = null;
  private nonactivatingPanelBridge: unknown = null;
  private nativeAppearanceBridge: { fromPointer(handle: Buffer): { window(): { respondsToSelector$(selector: string): boolean; _setForceActiveControls$(v: boolean): unknown; setNativeGlassForcesActiveAppearance$(v: boolean): unknown; _sendForcedWindowChangedKeyState(): unknown; isKeyWindow(): boolean; resignKeyWindow(): unknown; makeKeyAndOrderFront$(v: unknown): unknown } } } | null = null;
  private closingWindow: BrowserWindow | null = null;
  private openingWindowPromise: Promise<BrowserWindow | null> | null = null;
  private anchor: Rect = defaultAnchorForDisplay({ x: 0, y: 0, width: 0, height: 0 }, DEFAULT_MASCOT_SIZE);
  private displayBounds: Rect | null = null;
  private displayId: number | null = null;
  private detachedDisplay: { bounds: Rect; id: number } | null = null;
  private detachedDisplayRestoreTimer: ReturnType<typeof setTimeout> | null = null;
  private dragState: CursorTracker | null = null;
  private nativeWindowDragStart: { pointerScreenX: number; pointerScreenY: number } | null = null;
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
    this.remoteHostedPIPContentLayoutState = getRemoteHostedPIPContentLayoutState() as RemoteHostedPIPContentLayoutState | null;
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
    let frontmost: Promise<{ bundleIdentifier: string } | null> = this.quickChatKeyboardInteractionActive
      ? (this.previousQuickChatApplication ??
        (getFrontmostWindow() as Promise<{ bundleIdentifier: string } | null>))
      : (getFrontmostWindow() as Promise<{ bundleIdentifier: string } | null>);
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
      else
        this.previousQuickChatApplication ??=
          getFrontmostWindow() as Promise<{ bundleIdentifier: string } | null>;
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
            sensitive: {},
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
      sensitive: {},
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
      (this.nonactivatingPanelBridge as { fromPointer?(handle: Buffer): { window(): { isKeyWindow(): boolean; resignKeyWindow(): unknown; makeKeyAndOrderFront$(v: unknown): unknown } } } | null)
        ?.fromPointer?.(window.getNativeWindowHandle())
        .window() ?? null;
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
      sensitive: {},
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
        nativeStart as unknown as Record<string, unknown>,
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
        sensitive: {},
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
    let nativeResult = (wasNativeDrag ? finishWindowDrag(window) : null) as { bounds?: Rect; altKey?: boolean } | null;
    let nativeBounds = nativeResult?.bounds;
    let shouldDock = wasNativeDrag ? nativeResult?.altKey === true : altKey;
    if (wasNativeDrag) {
      this.handleNativeWindowDragMove(window, nativeBounds);
      this.logger().info(`Native pet window drag finished`, { safe: { reason }, sensitive: {} });
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
    let layoutInvalidating =
      mode !== this.layoutMode ||
      presentationSwitched ||
      !sameSize(sizes.mascot, this.mascotSize) ||
      (sizes.realtimeCaptionAboveMascotPx ?? 0) !== this.realtimeCaptionAboveMascotPx ||
      (sizes.showsPetControls ?? false) !== this.showsPetControls ||
      (trayChanged && (!this.isQuickChatPresentation || sizes.quickChat?.isActivityVisible === true));
    if (layoutInvalidating) this.cancelMomentum();
    this.layoutMode = mode;
    this.isQuickChatPresentation = sizes.presentation === `quick-chat`;
    this.quickChatControls = sizes.quickChat;
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
      this.logger().info(`Quick Chat ignored stash against Dock`, { safe: { edge }, sensitive: {} });
      return;
    }
    let nearestEdge = this.getLayoutForDisplay(display).quickChat?.nearestStashEdge;
    if (edge != null && nearestEdge != null && edge !== nearestEdge) {
      this.logger().info(`Quick Chat ignored opposite-edge stash`, {
        safe: { edge, nearestEdge },
        sensitive: {},
      });
      return;
    }
    let position = this.quickChatPosition ?? positionFromPoint(anchorCenter(this.anchor), display.workArea);
    this.quickChatStashedEdge = edge;
    this.quickChatResizeDrawAnchor = null;
    if (edge != null) this.setKeyboardInteraction(webContentsId, false, true);
    this.logger().info(`Quick Chat stash changed`, { safe: { edge }, sensitive: {} });
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

  /** 宠物控件邻近追踪（原 updateCssPetControlsProximityTracking，16,775-16,818）。 */
  updateCssPetControlsProximityTracking(): void {
    let window = this.window;
    if (
      !this.shouldPresentWindow() ||
      window == null ||
      window.isDestroyed() ||
      !window.isVisible() ||
      this.hiddenForApplicationHide ||
      (process.platform === `darwin` && app.isHidden()) ||
      this.layoutMode !== `native` ||
      !this.showsPetControls ||
      this.isQuickChatPresentation
    ) {
      if (this.petControlsProximityTimer != null) {
        clearInterval(this.petControlsProximityTimer);
        this.petControlsProximityTimer = null;
        this.logger().debug(`Stopped pet controls proximity tracking`);
      }
      this.setPetPointerProximity(false);
      return;
    }
    if (this.petControlsProximityTimer == null) {
      this.logger().debug(`Started pet controls proximity tracking`);
      this.petControlsProximityTimer = setInterval(() => {
        let currentWindow = this.window;
        let mascot = this.layout?.mascot;
        if (currentWindow == null || currentWindow.isDestroyed() || mascot == null) {
          this.setPetPointerProximity(false);
          return;
        }
        let contentBounds = currentWindow.getContentBounds();
        let cursor = screen.getCursorScreenPoint();
        let radius = this.pointerNearPet
          ? this.petControlsAppearance.proximityExitDistance
          : this.petControlsAppearance.proximityEnterDistance;
        this.setPetPointerProximity(
          [mascot, ...this.petControlsProximityRects].some((rect) => {
            let dx = Math.max(contentBounds.x + rect.left - cursor.x, 0, cursor.x - contentBounds.x - rect.left - rect.width);
            let dy = Math.max(contentBounds.y + rect.top - cursor.y, 0, cursor.y - contentBounds.y - rect.top - rect.height);
            return dx ** 2 + dy ** 2 <= radius ** 2;
          }),
        );
      }, PROXIMITY_POLL_INTERVAL_MS);
      this.petControlsProximityTimer.unref?.();
    }
  }

  /** 邻近状态变化（原 setPetPointerProximity）。 */
  private setPetPointerProximity(near: boolean): void {
    if (this.pointerNearPet === near) return;
    this.pointerNearPet = near;
    this.logger().debug(`Pet controls pointer proximity changed`, {
      safe: { isNear: near, regionCount: this.petControlsProximityRects.length },
      sensitive: {},
    });
    let window = this.window;
    if (window != null && !window.isDestroyed()) {
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `avatar-overlay-action`,
        action: { type: `pet-pointer-proximity-changed`, isNear: near },
      });
    }
  }

  /** 发布 remote-hosted PIP 内容宿主（原 publishRemoteHostedPIPContentHost，16,833-16,879）。 */
  publishRemoteHostedPIPContentHost(): void {
    let window = this.window;
    let mascot = this.layout?.mascot;
    if (!this.isRemoteHostedPIPEnabled() || window == null || window.isDestroyed()) {
      this.remoteHostedPIPContentHostAlignment = null;
      if (this.remoteHostedPIPContentHostRegistered) {
        this.remoteHostedPIPContentHostRegistered = false;
        unregisterRemoteHostedPIPContentHost(AVATAR_OVERLAY_HOST_ID);
      }
      return;
    }
    if (mascot == null) return;
    let hostRect = mascot;
    let motionTarget = this.remoteHostedPIPContentHostMotionTarget;
    if (motionTarget != null) {
      let contentBounds = window.getContentBounds();
      hostRect = {
        left: motionTarget.x - contentBounds.x,
        top: motionTarget.y - contentBounds.y,
        width: motionTarget.width,
        height: motionTarget.height,
      };
    }
    let alignment: string;
    switch (this.placement) {
      case `top-start`:
        alignment = this.isQuickChatPresentation ? `bottom-center` : `bottom-left`;
        break;
      case `top-end`:
        alignment = this.isQuickChatPresentation ? `bottom-center` : `bottom-right`;
        break;
      case `bottom-start`:
        alignment = this.isQuickChatPresentation ? `top-center` : `top-left`;
        break;
      case `bottom-end`:
        alignment = this.isQuickChatPresentation ? `top-center` : `top-right`;
        break;
    }
    let anchorY = hostRect.top + hostRect.height / 2;
    if (this.isQuickChatPresentation)
      anchorY = alignment === `top-center` ? hostRect.top + hostRect.height + 8 : hostRect.top - 8;
    let alignmentChanged =
      this.remoteHostedPIPContentHostAlignment != null &&
      this.remoteHostedPIPContentHostAlignment !== alignment;
    let registered = registerRemoteHostedPIPContentHost(AVATAR_OVERLAY_HOST_ID, window, {
      anchorRect: { x: hostRect.left, y: hostRect.top, width: hostRect.width, height: hostRect.height },
      anchors: [{ alignment, point: { x: hostRect.left + hostRect.width / 2, y: anchorY } }],
      animated: alignmentChanged,
      animationSpring: MOVEMENT_SPRING,
      isCodexHomeAvailable: false,
      interactionPassthroughRect: { x: mascot.left, y: mascot.top, width: mascot.width, height: mascot.height },
      presentationScope: `all`,
    });
    if (registered) {
      this.remoteHostedPIPContentHostAlignment = alignment;
      this.remoteHostedPIPContentHostRegistered = true;
    }
  }

  /** 确保窗口存在（原 ensureWindow，16,880-16,903）。 */
  private async ensureWindow(sequence: number): Promise<BrowserWindow | null> {
    if (this.isAppQuitting) return null;
    let closing = this.closingWindow;
    if (closing != null && !closing.isDestroyed()) {
      await new Promise<void>((resolve) => {
        closing.once(`closed`, resolve);
      });
      if (
        this.isAppQuitting ||
        (sequence !== this.windowVisibilitySequence && !this.realtimeController.isSessionReserved())
      )
        return null;
    }
    let current = this.window;
    if (current != null && !current.isDestroyed()) return current;
    if (this.openingWindowPromise == null) {
      this.realtimeController.prepareForWindowCreation();
      this.openingWindowPromise = this.createWindow().finally(() => {
        this.openingWindowPromise = null;
      });
    }
    return this.openingWindowPromise;
  }

  /** 刷新原生激活外观（原 refreshNativeActiveAppearance，16,904-16,922）。 */
  private refreshNativeActiveAppearance(window: BrowserWindow): void {
    let bridge = this.nativeAppearanceBridge;
    if (bridge == null) return;
    try {
      let nativeWindow = bridge.fromPointer(window.getNativeWindowHandle()).window();
      if (nativeWindow.respondsToSelector$(`_setForceActiveControls:`)) {
        nativeWindow._setForceActiveControls$(true);
        if (nativeWindow.respondsToSelector$(`setNativeGlassForcesActiveAppearance:`))
          nativeWindow.setNativeGlassForcesActiveAppearance$(true);
        if (nativeWindow.respondsToSelector$(`_sendForcedWindowChangedKeyState`))
          nativeWindow._sendForcedWindowChangedKeyState();
      } else {
        this.logger().debug(`Mini's active appearance selector is unavailable`);
      }
    } catch (error) {
      this.logger().debug(`Could not set Mini's active appearance`, {
        safe: {},
        sensitive: { error },
      });
    }
  }

  /** 创建窗口（原 createWindow，16,923-16,098 的完整装配）。 */
  private async createWindow(): Promise<BrowserWindow | null> {
    let objcJs =
      process.platform === `darwin`
        ? await import(`objc-js`).catch((error) => {
            this.logger().debug(`Could not load Mini's active appearance bridge`, {
              safe: {},
              sensitive: { error },
            });
            return null;
          })
        : null;
    if (this.isAppQuitting) return null;
    let window = await this.windowManager.createWindow({
      title: app.getName(),
      width: 356,
      height: 320,
      appearance: `avatarOverlay`,
      supportsWindowTiling: false,
      focusable: false,
      show: false,
      initialRoute: AVATAR_OVERLAY_ROUTE,
    });
    this.nonactivatingPanelBridge = null;
    if (objcJs != null) {
      try {
        let nativeWindow = objcJs.fromPointer(window.getNativeWindowHandle()).window();
        if (nativeWindow.respondsToSelector$(`_setPreventsActivation:`)) {
          nativeWindow._setPreventsActivation$(true);
          this.nonactivatingPanelBridge = objcJs;
        }
      } catch (error) {
        this.logger().debug(`Could not configure pet nonactivating focus`, {
          safe: {},
          sensitive: { error },
        });
      }
    }
    this.nativeAppearanceBridge = objcJs;
    this.refreshNativeActiveAppearance(window);
    let webContentsId = window.webContents.id;
    this.window = window;
    this.nativeWindowDragTargetRegistered = setWindowDragTarget(window);
    this.lastSentRendererState = null;
    this.rendererReady = this.windowManager.isWebContentsReady(webContentsId);
    this.updateRendererBackgroundThrottling();
    this.clearDetachedDisplayRestore();
    this.displayBounds = null;
    this.displayId = null;
    this.dragState = null;
    this.nativeWindowDragStart = null;
    this.nativeWindowDragActive = false;
    this.hasDeferredLayout = false;
    this.layout = null;
    this.layoutMode = `legacy`;
    this.isQuickChatPresentation = false;
    this.quickChatControls = undefined;
    this.petControlsAppearance = DEFAULT_PET_CONTROLS_APPEARANCE;
    this.showsPetControls = false;
    this.initialPresentationState = `waiting-for-layout`;
    this.hiddenForApplicationHide = false;
    this.mascotSize = DEFAULT_MASCOT_SIZE;
    this.isSuspended = false;
    this.mousePassthroughMode = `disabled`;
    this.inputShape = null;
    this.petControlsProximityRects = [];
    this.placement = `top-end`;
    this.pointerInteractive = false;
    this.applyPointerInteractivityPolicy();
    this.resolutionKey = null;
    this.realtimeCaptionAboveMascotPx = 0;
    this.traySize = null;
    if (process.platform === `darwin`) {
      window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true,
      });
    } else {
      window.setVisibleOnAllWorkspaces(true);
    }
    window.setAlwaysOnTop(true, `floating`);
    window.setMenuBarVisibility(false);
    this.addDisplayChangeListeners();
    this.addApplicationLifecycleListeners();
    this.addPowerMonitorListeners();
    window.once(`ready-to-show`, () => {
      this.showWindowIfReady(window);
    });
    window.on(`close`, () => {
      if (this.window === window) {
        this.cancelMomentum();
        this.clearMovedWindowPersist();
        this.unregisterNativeWindowDragTarget(`closed`);
        this.persistWindowBounds(window);
      }
    });
    window.on(`move`, () => {
      if (this.nativeWindowDragActive) {
        this.handleNativeWindowDragMove(window);
        return;
      }
      if (this.dragState == null) {
        if (this.presentationMotionTarget != null || (this.isQuickChatPresentation && this.isSettingWindowBounds)) {
          if (this.presentationMotionTarget == null)
            this.logger().debug(`Ignored Quick Chat layout move`);
          return;
        }
        this.publishRemoteHostedPIPContentHost();
        if (this.layoutMode === `native`) this.rememberMovedWindow(window);
      }
    });
    window.on(`will-move`, () => {
      if (!this.momentumActive) {
        this.cancelMomentum();
        this.clearDetachedDisplayRestore();
      }
    });
    window.on(`show`, () => {
      if (this.window === window) {
        this.nativeWindowDragTargetRegistered = setWindowDragTarget(window);
        this.applyPointerInteractivityPolicy();
        this.updateCssPetControlsProximityTracking();
      }
    });
    window.on(`hide`, () => {
      if (this.window === window) {
        this.unregisterNativeWindowDragTarget(`hidden`);
        this.applyPointerInteractivityPolicy();
        this.updateCssPetControlsProximityTracking();
      }
      if (
        process.platform === `darwin` &&
        this.window === window &&
        this.shouldPresentWindow() &&
        !this.hiddenForApplicationHide &&
        app.isHidden()
      ) {
        this.hiddenForApplicationHide = true;
        return;
      }
      if (
        this.window === window &&
        (this.presentationVisibility ?? this.startupPresentationVisibility) === true
      )
        this.reconcileWindowVisibility();
    });
    window.on(`closed`, () => {
      if (this.window !== window) return;
      this.cancelPresentationFade(window, false);
      this.clearDismissedWindowCleanup();
      let hadPresentationVisibility =
        this.presentationVisibility != null || this.startupPresentationVisibility != null;
      let wasClosing = this.closingWindow === window;
      this.cancelMomentum();
      this.clearMovedWindowPersist();
      this.unregisterNativeWindowDragTarget(`closed`);
      this.window = null;
      this.isQuickChatPresentation = false;
      this.quickChatControls = undefined;
      this.resetQuickChatKeyboardInteraction();
      this.removeDisplayChangeListeners();
      this.removeApplicationLifecycleListeners();
      this.removePowerMonitorListeners();
      this.displayBounds = null;
      this.displayId = null;
      this.dragState = null;
      this.clearDetachedDisplayRestore();
      this.hasDeferredLayout = false;
      this.layout = null;
      this.isSuspended = false;
      if (!wasClosing) this.realtimeController.handleWindowClosed(webContentsId);
      this.closingWindow = null;
      this.rendererReady = false;
      this.awaitingRealtimeVoicePresentation = false;
      this.lastSentRendererState = null;
      this.isDismissedWindowRetained = false;
      if (!hadPresentationVisibility && !wasClosing) this.petOpenIntent = false;
      this.hiddenForApplicationHide = false;
      this.pointerInteractive = false;
      this.mousePassthroughMode = `disabled`;
      this.updateCssPetControlsProximityTracking();
      this.publishRemoteHostedPIPContentHost();
      this.broadcastOpenState();
      if (!(wasClosing && (this.petOpenIntent || hadPresentationVisibility)))
        this.reconcileWindowVisibility();
    });
    return window;
  }

  // -------------------------------------------------------------------------
  // 位置与 display 切换
  // -------------------------------------------------------------------------

  /** 定位窗口（原 positionWindow，16,099-17,111）。 */
  private positionWindow(window: BrowserWindow, origin: unknown): void {
    if (window.isDestroyed()) return;
    let stored = this.globalState.get(AVATAR_OVERLAY_BOUNDS_KEY);
    let display = this.getInitialDisplay(window, origin, stored);
    let placement = storedPlacementForDisplay(stored, display);
    if (placement != null) {
      this.restoreBoundsForDisplay(placement, display);
      this.applyLayout(window, display);
      if (stored?.byDisplayId == null || stored.byResolution == null)
        this.persistWindowBounds(window, display);
      return;
    }
    this.resetToDefaultAnchor(display);
    this.applyLayout(window, display);
  }

  /** 初始 display（原 getInitialDisplay，17,112-17,127）。 */
  private getInitialDisplay(window: BrowserWindow, origin: unknown, stored: any): Electron.Display {
    let storedDisplayId = stored?.displayId;
    if (storedDisplayId != null) {
      let display = displayById(storedDisplayId);
      if (display != null) return display;
    }
    let storedBounds = stored?.displayBounds;
    if (storedBounds != null) {
      let display = screen.getDisplayMatching(storedBounds);
      if (boundsEqual(display.bounds, storedBounds)) return display;
    }
    let originWindow = origin == null ? null : BrowserWindow.fromWebContents(origin as Electron.WebContents);
    return originWindow == null || originWindow.isDestroyed() || originWindow === window
      ? screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
      : screen.getDisplayMatching(originWindow.getBounds());
  }

  /** 从持久化记录恢复（原 restoreBoundsForDisplay，17,128-17,142）。 */
  private restoreBoundsForDisplay(placement: any, display: Electron.Display): void {
    let anchor = anchorFromStoredPlacement(placement, display.bounds);
    this.anchor = {
      ...this.mascotSize,
      x: anchor.x - this.presentationOffset.x,
      y: anchor.y - this.presentationOffset.y,
    };
    this.placement = placement.placement ?? this.placement;
    this.isFreelyPositioned = placement.isFreelyPositioned ?? false;
    this.quickChatPosition = null;
    if (this.isQuickChatPresentation && !this.isFreelyPositioned)
      this.quickChatPosition = positionFromPoint(anchorCenter(this.anchor), display.workArea);
    this.restoreQuickChatFromOccupiedEdge(display);
  }

  /** 重置到默认锚点（原 resetToDefaultAnchor，17,143-17,152）。 */
  private resetToDefaultAnchor(display: Electron.Display): void {
    this.isFreelyPositioned = false;
    this.quickChatPosition = null;
    let bounds = this.layoutMode === `native` ? display.workArea : display.bounds;
    let anchor = defaultAnchorForDisplay(bounds, this.mascotSize);
    this.anchor = {
      ...anchor,
      x: anchor.x - this.presentationOffset.x,
      y: anchor.y - this.presentationOffset.y,
    };
    this.restoreQuickChatFromOccupiedEdge(display);
  }

  /** 被占边的恢复（原 restoreQuickChatFromOccupiedEdge，17,153-17,162）。 */
  private restoreQuickChatFromOccupiedEdge(display: Electron.Display): void {
    if (
      (this.quickChatStashedEdge === `left` && display.workArea.x > display.bounds.x) ||
      (this.quickChatStashedEdge === `right` &&
        display.workArea.x + display.workArea.width < display.bounds.x + display.bounds.width)
    ) {
      this.logger().info(`Quick Chat restored from occupied display edge`, {
        safe: { edge: this.quickChatStashedEdge },
        sensitive: {},
      });
      this.quickChatStashedEdge = null;
      this.quickChatResizeDrawAnchor = null;
    }
  }

  /** 切换 display（原 switchToDisplay，17,163-17,177）。 */
  private switchToDisplay(window: BrowserWindow, display: Electron.Display, animated = false): void {
    let placement = storedPlacementForDisplay(this.globalState.get(AVATAR_OVERLAY_BOUNDS_KEY), display);
    if (placement == null) this.resetToDefaultAnchor(display);
    else this.restoreBoundsForDisplay(placement, display);
    if (this.isQuickChatPresentation && !this.isFreelyPositioned) {
      this.snapQuickChatToPosition(
        display,
        this.quickChatPosition ?? positionFromPoint(anchorCenter(this.anchor), display.workArea),
        animated,
      );
      return;
    }
    this.applyLayout(window, display, animated);
  }

  /** 当前 display（原 getCurrentDisplay）。 */
  private getCurrentDisplay(): Electron.Display {
    if (this.displayId != null) {
      let display = displayById(this.displayId);
      if (display != null) return display;
    }
    return screen.getDisplayNearestPoint(anchorCenter(this.anchor));
  }

  // -------------------------------------------------------------------------
  // 事件监听
  // -------------------------------------------------------------------------

  private addDisplayChangeListeners(): void {
    screen.on(`display-added`, this.handleDisplayChanged);
    screen.on(`display-removed`, this.handleDisplayChanged);
    screen.on(`display-metrics-changed`, this.handleDisplayChanged);
  }

  private removeDisplayChangeListeners(): void {
    screen.off(`display-added`, this.handleDisplayChanged);
    screen.off(`display-removed`, this.handleDisplayChanged);
    screen.off(`display-metrics-changed`, this.handleDisplayChanged);
  }

  private addPowerMonitorListeners(): void {
    powerMonitor.on(`suspend`, this.handleSuspend);
    powerMonitor.on(`resume`, this.handleResume);
  }

  private removePowerMonitorListeners(): void {
    powerMonitor.off(`suspend`, this.handleSuspend);
    powerMonitor.off(`resume`, this.handleResume);
  }

  private addApplicationLifecycleListeners(): void {
    if (this.applicationLifecycleListenersRegistered) return;
    this.applicationLifecycleListenersRegistered = true;
    app.on(`did-resign-active`, this.handleApplicationDidResignActive);
    app.on(`did-become-active`, this.handleApplicationDidBecomeActive);
  }

  private removeApplicationLifecycleListeners(): void {
    if (!this.applicationLifecycleListenersRegistered) return;
    this.applicationLifecycleListenersRegistered = false;
    app.off(`did-resign-active`, this.handleApplicationDidResignActive);
    app.off(`did-become-active`, this.handleApplicationDidBecomeActive);
    this.clearApplicationHideCheck();
  }

  private clearApplicationHideCheck(): void {
    if (this.applicationHideCheckTimer != null) {
      clearTimeout(this.applicationHideCheckTimer);
      this.applicationHideCheckTimer = null;
    }
  }

  /** 失活 → 检查应用隐藏（原 handleApplicationDidResignActive）。 */
  private handleApplicationDidResignActive = () => {
    this.clearApplicationHideCheck();
    this.applicationHideCheckTimer = setTimeout(() => {
      this.applicationHideCheckTimer = null;
      let window = this.window;
      if (
        app.isHidden() &&
        !this.hiddenForApplicationHide &&
        window != null &&
        !window.isDestroyed() &&
        this.shouldPresentWindow()
      ) {
        this.hiddenForApplicationHide = true;
        this.updateCssPetControlsProximityTracking();
      }
    }, 0);
  };

  /** 激活 → 恢复隐藏窗口（原 handleApplicationDidBecomeActive）。 */
  private handleApplicationDidBecomeActive = () => {
    this.clearApplicationHideCheck();
    if (!this.hiddenForApplicationHide) return;
    this.hiddenForApplicationHide = false;
    let window = this.window;
    if (window != null && !window.isDestroyed() && this.shouldPresentWindow()) {
      if (this.pendingQuickChatFocus != null) {
        this.lastSentRendererState = null;
        this.sendLayoutToRenderer(window);
      }
      this.presentWindow(window);
    }
  };

  /** display 变更（原 handleDisplayChanged，17,244-17,279）。 */
  private handleDisplayChanged = () => {
    if (this.isSuspended) return;
    if (this.dragState != null) {
      this.dragState.updateDisplayBounds(
        screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds,
      );
      return;
    }
    this.cancelMomentum();
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      (this.movedWindowPersistTimer != null &&
        this.logger().info(`Discarding pending pet move for display change`),
      this.clearMovedWindowPersist(),
      (this.hasDeferredLayout = false),
      this.restoreDetachedDisplay(window))
    )
      return;
    this.rememberDetachedDisplay();
    let display = this.getCurrentDisplay();
    if (
      resolutionKeyForBounds(display.bounds) !== this.resolutionKey ||
      this.displayBounds == null ||
      !boundsEqual(display.bounds, this.displayBounds)
    ) {
      this.switchToDisplay(window, display, true);
      this.persistWindowBounds(window, display);
      return;
    }
    this.restoreQuickChatFromOccupiedEdge(display);
    this.reclampWindowToVisibleDisplay({ shouldPersist: true });
    if (this.isQuickChatPresentation && this.quickChatPosition != null)
      this.snapQuickChatToPosition(display, this.quickChatPosition, false);
  };

  /** 系统休眠（原 handleSuspend）。 */
  private handleSuspend = () => {
    let window = this.window;
    if (window == null || window.isDestroyed() || this.displayBounds == null) return;
    this.cancelMomentum();
    this.isSuspended = true;
    let display = this.getCurrentDisplay();
    this.persistWindowBounds(window, display);
  };

  /** 系统恢复（原 handleResume，17,287-17,308）。 */
  private handleResume = () => {
    this.isSuspended = false;
    let window = this.window;
    if (
      window == null ||
      window.isDestroyed() ||
      (this.clearMovedWindowPersist(),
      (this.hasDeferredLayout = false),
      this.restoreDetachedDisplay(window))
    )
      return;
    let displayId = this.displayId;
    if (displayId == null) return;
    let display = displayById(displayId);
    if (display == null) {
      this.rememberDetachedDisplay();
      let currentDisplay = this.getCurrentDisplay();
      this.switchToDisplay(window, currentDisplay, true);
      this.persistWindowBounds(window, currentDisplay);
      return;
    }
    this.switchToDisplay(window, display, true);
    this.persistWindowBounds(window, display);
  };

  /** 记忆脱离的 display（原 rememberDetachedDisplay）。 */
  private rememberDetachedDisplay(): void {
    let displayId = this.displayId;
    let displayBounds = this.displayBounds;
    if (
      displayId != null &&
      displayBounds != null &&
      displayById(displayId) == null &&
      this.detachedDisplay?.id !== displayId
    ) {
      this.detachedDisplay = { bounds: displayBounds, id: displayId };
      if (this.detachedDisplayRestoreTimer != null)
        clearTimeout(this.detachedDisplayRestoreTimer);
      this.detachedDisplayRestoreTimer = setTimeout(() => {
        this.detachedDisplay = null;
        this.detachedDisplayRestoreTimer = null;
      }, DETACHED_DISPLAY_REMEMBER_MS);
    }
  }

  /** 恢复脱离的 display（原 restoreDetachedDisplay，17,322-17,336）。 */
  private restoreDetachedDisplay(window: BrowserWindow): boolean {
    let detached = this.detachedDisplay;
    if (detached == null) return false;
    let display = displayById(detached.id) ?? displayMatchingBounds(detached.bounds);
    if (display == null) return false;
    let placement = this.globalState.get(AVATAR_OVERLAY_BOUNDS_KEY)?.byDisplayId?.[String(detached.id)];
    this.clearDetachedDisplayRestore();
    if (placement == null) this.switchToDisplay(window, display, true);
    else {
      this.restoreBoundsForDisplay(placement, display);
      this.applyLayout(window, display, true);
    }
    this.persistWindowBounds(window, display);
    return true;
  }

  private clearDetachedDisplayRestore(): void {
    if (this.detachedDisplayRestoreTimer != null) {
      clearTimeout(this.detachedDisplayRestoreTimer);
      this.detachedDisplayRestoreTimer = null;
    }
    this.detachedDisplay = null;
  }

  /** 夹回可见 display（原 reclampWindowToVisibleDisplay）。 */
  private reclampWindowToVisibleDisplay({ shouldPersist }: { shouldPersist: boolean }): void {
    let window = this.window;
    if (window == null || window.isDestroyed()) return;
    let display = this.getCurrentDisplay();
    this.applyLayout(window, display);
    if (shouldPersist) this.persistWindowBounds(window, display);
  }

  /** 拖动指针跟随（原 moveDragToPointer，17,348-17,366）。 */
  private moveDragToPointer(window: BrowserWindow, point: Point): void {
    let dragState = this.dragState;
    if (dragState == null) return;
    let targetBounds = boundsForDragTarget(point, dragState.displayBounds);
    let display = screen.getDisplayMatching(targetBounds);
    dragState.recordMove(display.bounds);
    this.anchor = {
      ...this.anchor,
      x:
        this.quickChatStashedEdge == null
          ? point.x - dragState.pointerAnchorX
          : display.workArea.x +
            (this.quickChatStashedEdge === `left` ? 13 : display.workArea.width - 13) -
            this.mascotSize.width / 2,
      y: point.y - dragState.pointerAnchorY,
    };
    if (this.layoutMode === `native`) this.placement = preferredPlacementFor(this.anchor, display.workArea);
    this.applyLayout(window, display);
  }

  /** 呈现定位到起点（原 positionPresentationAtOrigin）。 */
  private positionPresentationAtOrigin(window: BrowserWindow, origin: unknown): void {
    this.anchor = anchorForDockTarget(origin as { centerX: number; centerY: number }, this.mascotSize, this.presentationOffset);
    this.applyLayout(window, screen.getDisplayNearestPoint(anchorCenter(this.anchor)));
  }

  /** Quick Chat 静置宽度（原 getQuickChatRestingWidth）。 */
  private getQuickChatRestingWidth(): number {
    let base = quickChatRestingWidth(this.quickChatControls?.hasNotifications ?? false);
    return this.quickChatControls?.isActivityVisible
      ? Math.max(base, this.traySize?.width ?? base)
      : base;
  }

  /** Quick Chat 吸附（原 snapQuickChatToPosition，17,375-17,430）。 */
  private snapQuickChatToPosition(
    display: Electron.Display,
    position: string,
    animated: boolean,
    fromStash = false,
  ): Rect | null {
    let window = this.window;
    if (window == null || window.isDestroyed()) return null;
    this.isFreelyPositioned = false;
    this.quickChatPosition = position;
    let restingWidth = this.getQuickChatRestingWidth();
    let widthWithPip = Math.max(
      restingWidth,
      this.remoteHostedPIPContentLayoutState?.currentHostID === AVATAR_OVERLAY_HOST_ID
        ? Math.max(0, this.remoteHostedPIPContentLayoutState.stackDisplayWidth)
        : 0,
    );
    let snapTarget = placeQuickChatAtPosition(position, display, this.mascotSize, {
      width: widthWithPip,
      height: 40,
    });
    if (this.quickChatStashedEdge != null) {
      snapTarget.x =
        display.workArea.x +
        (this.quickChatStashedEdge === `left` ? 13 : display.workArea.width - 13) -
        this.mascotSize.width / 2;
    }
    this.logger().info(`Quick Chat snap target selected`, {
      safe: {
        position,
        animated,
        restingWidth,
        hasVisibleActivity: this.quickChatControls?.isActivityVisible ?? false,
      },
      sensitive: {},
    });
    if (animated) {
      if (fromStash && this.layout != null) {
        let contentBounds = window.getContentBounds();
        let centerX = snapTarget.x + snapTarget.width / 2;
        let halfWidth = Math.max(QUICK_CHAT_MIN_SNAP_WIDTH_PX, restingWidth) / 2;
        if (centerX - halfWidth >= contentBounds.x && centerX + halfWidth <= contentBounds.x + contentBounds.width) {
          this.quickChatResizeDrawAnchor = {
            ...this.layout.anchor,
            x: this.layout.anchor.x + this.quickChatDrawOffset.x,
            y: this.layout.anchor.y + this.quickChatDrawOffset.y,
          };
        }
      }
      this.animatePresentationTo(
        snapTarget,
        { x: 0, y: 0 },
        () => {
          if (this.quickChatStashedEdge == null) this.persistWindowBounds(window, display);
        },
        this.quickChatResizeDrawAnchor,
        true,
      );
    } else {
      this.anchor = snapTarget;
      this.applyLayout(window, display);
      this.quickChatResizeDrawAnchor = null;
      if (this.quickChatStashedEdge == null) this.persistWindowBounds(window, display);
    }
    return snapTarget;
  }

  /** 吸附动画（原 animatePresentationTo，17,431-17,494）。 */
  private animatePresentationTo(
    target: Rect,
    velocity: Point,
    onSettled?: () => void,
    resizeDrawAnchor: Rect | null = null,
    pacedByDisplayFrequency = false,
  ): void {
    let window = this.window;
    if (window == null || window.isDestroyed()) {
      onSettled?.();
      return;
    }
    this.cancelMomentum();
    this.quickChatResizeDrawAnchor = resizeDrawAnchor;
    this.presentationMotionTarget = target;
    this.momentumActive = true;
    let vx = velocity.x;
    let vy = velocity.y;
    let webContentsId = window.webContents.id;
    let frameInterval = pacedByDisplayFrequency
      ? 1000 / (screen.getDisplayNearestPoint(anchorCenter(target)).displayFrequency || 60)
      : ANIMATION_FRAME_MS;
    let startTime = Date.now();
    let lastFrameTime = startTime;
    let nextPacedFrameAt = startTime + frameInterval;
    let step = () => {
      let currentWindow = this.window;
      if (currentWindow == null || currentWindow.isDestroyed() || currentWindow.webContents.id !== webContentsId) {
        this.cancelMomentum();
        return;
      }
      this.momentumTimer = null;
      let now = Date.now();
      let dt = Math.min(Math.max(0, now - lastFrameTime), MAX_FRAME_DELTA_MS) / 1000;
      lastFrameTime = now;
      let ax = SNAP_SPRING_STIFFNESS * (target.x - this.anchor.x) - SNAP_SPRING_DAMPING * vx;
      let ay = SNAP_SPRING_STIFFNESS * (target.y - this.anchor.y) - SNAP_SPRING_DAMPING * vy;
      vx += ax * dt;
      vy += ay * dt;
      let next = { ...this.anchor, x: this.anchor.x + vx * dt, y: this.anchor.y + vy * dt };
      this.anchor = next;
      this.applyLayout(currentWindow, screen.getDisplayNearestPoint(anchorCenter(this.anchor)));
      if (pacedByDisplayFrequency) this.anchor = next;
      if (
        now - startTime >= (pacedByDisplayFrequency ? 1000 : SNAP_SETTLE_MAX_DURATION_MS) ||
        (Math.hypot(target.x - this.anchor.x, target.y - this.anchor.y) <=
          (pacedByDisplayFrequency ? 0.5 : SNAP_DISTANCE_THRESHOLD_PX) &&
          Math.hypot(vx, vy) < (pacedByDisplayFrequency ? 10 : SNAP_SPEED_THRESHOLD_PX))
      ) {
        if (pacedByDisplayFrequency) {
          this.logger().debug(`Mini snap motion settled`, {
            safe: {
              durationMs: now - startTime,
              frameIntervalMs: frameInterval,
              remainingDistancePx: Math.hypot(target.x - this.anchor.x, target.y - this.anchor.y),
              nativeWindowX: currentWindow.getContentBounds().x,
              rendererWindowX: this.layout?.windowBounds.x,
            },
            sensitive: {},
          });
        }
        this.anchor = target;
        if (this.remoteHostedPIPContentHostMotionTarget === target)
          this.remoteHostedPIPContentHostMotionTarget = null;
        this.applyLayout(currentWindow, screen.getDisplayNearestPoint(anchorCenter(target)));
        this.momentumActive = false;
        this.presentationMotionTarget = null;
        this.quickChatResizeDrawAnchor = null;
        onSettled?.();
        return;
      }
      if (pacedByDisplayFrequency) {
        nextPacedFrameAt += frameInterval;
        if (nextPacedFrameAt <= now) nextPacedFrameAt = now + frameInterval;
      }
      this.momentumTimer = setTimeout(
        step,
        pacedByDisplayFrequency ? Math.max(0, nextPacedFrameAt - Date.now()) : frameInterval,
      );
    };
    this.momentumTimer = setTimeout(step, frameInterval);
  }

  /** 恢复入坞锚点（原 restoreDockAnchor）。 */
  private restoreDockAnchor(): void {
    let restoreAnchor = this.dockRestoreAnchor;
    if (restoreAnchor == null) return;
    this.cancelMomentum();
    this.dockRestoreAnchor = null;
    this.anchor = restoreAnchor;
    let window = this.window;
    if (window != null && !window.isDestroyed())
      this.applyLayout(window, screen.getDisplayNearestPoint(anchorCenter(restoreAnchor)));
  }

  /** 取消动量（原 cancelMomentum）。 */
  private cancelMomentum(): void {
    if (this.momentumTimer != null) {
      clearTimeout(this.momentumTimer);
      this.momentumTimer = null;
    }
    this.remoteHostedPIPContentHostMotionTarget = null;
    this.presentationMotionTarget = null;
    this.momentumActive = false;
    this.quickChatResizeDrawAnchor = null;
  }

  /** 附件可见性（原 setPresentationAccessoriesVisible）。 */
  private setPresentationAccessoriesVisible(visible: boolean): void {
    this.arePresentationAccessoriesVisible = visible;
    let window = this.window;
    if (window != null && !window.isDestroyed()) this.sendLayoutToRenderer(window);
  }

  private clearMovedWindowPersist(): void {
    if (this.movedWindowPersistTimer != null) {
      clearTimeout(this.movedWindowPersistTimer);
      this.movedWindowPersistTimer = null;
    }
  }

  /** 原生拖动移动（原 handleNativeWindowDragMove，17,519-17,551）。 */
  private handleNativeWindowDragMove(window: BrowserWindow, nativeBounds?: Rect): void {
    let layout = this.layout;
    if (window.isDestroyed() || layout == null) return;
    let bounds = nativeBounds ?? window.getContentBounds();
    this.anchor = { ...this.anchor, x: bounds.x + layout.mascot.left, y: bounds.y + layout.mascot.top };
    let display = screen.getDisplayNearestPoint(anchorCenter(this.anchor));
    this.dragState?.recordMove(display.bounds);
    this.displayBounds = display.bounds;
    this.displayId = display.id;
    this.resolutionKey = resolutionKeyForBounds(display.bounds);
    this.placement = preferredPlacementFor(this.anchor, display.workArea);
    let computed = this.getLayoutForDisplay(display);
    this.layout = {
      ...computed,
      anchor: this.anchor,
      mascot: layout.mascot,
      quickChat:
        computed.quickChat == null
          ? undefined
          : { ...computed.quickChat, workArea: intersectBounds(bounds, display.workArea) },
      tray:
        computed.tray == null
          ? null
          : {
              ...computed.tray,
              left: computed.windowBounds.x + computed.tray.left - bounds.x,
              top: computed.windowBounds.y + computed.tray.top - bounds.y,
            },
      viewport: { width: bounds.width, height: bounds.height },
      visibleBounds: intersectBounds(bounds, displayDrawBounds(display, this.layoutMode)),
      windowBounds: bounds,
    };
    this.placement = computed.placement;
    this.publishRemoteHostedPIPContentHost();
    this.sendLayoutToRenderer(window);
  }

  private clearNativeWindowDragCompletionTimer(): void {
    if (this.nativeWindowDragCompletionTimer != null) {
      clearInterval(this.nativeWindowDragCompletionTimer);
      this.nativeWindowDragCompletionTimer = null;
    }
  }

  /** 注销原生拖动（原 unregisterNativeWindowDragTarget，17,557-17,574）。 */
  private unregisterNativeWindowDragTarget(reason: string): void {
    try {
      if (this.nativeWindowDragActive && this.window != null) {
        if (!this.window.isDestroyed())
          this.handleNativeWindowDragMove(
            this.window,
            (finishWindowDrag(this.window) as { bounds?: Rect } | null)?.bounds,
          );
        this.suppressNextRendererThrow = true;
        this.logger().info(`Native pet window drag finished`, {
          safe: { reason },
          sensitive: {},
        });
      }
    } finally {
      setWindowDragTarget(null);
      this.clearNativeWindowDragCompletionTimer();
      this.dragState = null;
      this.hasDeferredLayout = false;
      this.nativeWindowDragTargetRegistered = false;
      this.nativeWindowDragStart = null;
      this.nativeWindowDragActive = false;
    }
  }

  /** 记忆被移动的窗口（原 rememberMovedWindow，17,575-17,599）。 */
  private rememberMovedWindow(window: BrowserWindow, nativeBounds?: Rect): void {
    if (window.isDestroyed() || this.layout == null) return;
    let bounds = nativeBounds ?? window.getContentBounds();
    this.anchor = {
      ...this.anchor,
      x: bounds.x + this.layout.mascot.left,
      y: bounds.y + this.layout.mascot.top,
    };
    let display = screen.getDisplayNearestPoint(anchorCenter(this.anchor));
    this.displayBounds = display.bounds;
    this.displayId = display.id;
    this.resolutionKey = resolutionKeyForBounds(display.bounds);
    if (this.isOverlayWindowPointerDragActive()) this.clearDetachedDisplayRestore();
    this.clearMovedWindowPersist();
    this.movedWindowPersistTimer = setTimeout(() => {
      this.movedWindowPersistTimer = null;
      if (this.isOverlayWindowPointerDragActive()) {
        this.rememberMovedWindow(window);
        return;
      }
      if (this.hasDeferredLayout) {
        this.hasDeferredLayout = false;
        this.applyLatestElementSizes(window);
      }
      this.applyPointerInteractivityPolicy();
      this.reclampWindowToVisibleDisplay({ shouldPersist: true });
    }, MOVED_WINDOW_PERSIST_DELAY_MS);
  }

  /** 指针拖动是否活跃（原 isOverlayWindowPointerDragActive）。 */
  private isOverlayWindowPointerDragActive(): boolean {
    let window = this.window;
    if (window == null || window.isDestroyed() || !this.pointerInteractive || this.dragState == null)
      return false;
    return pointInBounds(screen.getCursorScreenPoint(), window.getContentBounds());
  }

  /** 尺寸变更后的锚点重定（原 applyLatestElementSizes）。 */
  private applyLatestElementSizes(window: BrowserWindow): void {
    if (!this.isQuickChatPresentation) {
      this.anchor = {
        ...this.anchor,
        x: this.anchor.x + Math.round(this.anchor.width / 2) - Math.round(this.mascotSize.width / 2),
        y: this.anchor.y + Math.round(this.anchor.height / 2) - Math.round(this.mascotSize.height / 2),
      };
    }
    this.anchor = { ...this.anchor, ...this.mascotSize };
    this.applyLayout(window, this.getCurrentDisplay());
  }

  /** 应用布局（原 applyLayout，17,622-17,649）。 */
  private applyLayout(window: BrowserWindow, display: Electron.Display = this.getCurrentDisplay(), animated = false): void {
    if (window.isDestroyed()) return;
    if (this.nativeWindowDragActive || this.movedWindowPersistTimer != null) {
      this.hasDeferredLayout = true;
      this.handleNativeWindowDragMove(window);
      return;
    }
    let layout = this.getLayoutForDisplay(display);
    if (this.quickChatResizeDrawAnchor != null) {
      this.quickChatDrawOffset = {
        x: this.quickChatResizeDrawAnchor.x - layout.anchor.x,
        y: this.quickChatResizeDrawAnchor.y - layout.anchor.y,
      };
    }
    this.displayId = display.id;
    this.resolutionKey = resolutionKeyForBounds(display.bounds);
    this.displayBounds = display.bounds;
    this.anchor = {
      ...layout.anchor,
      y: this.realtimeCaptionAboveMascotPx > 0 ? this.anchor.y : layout.anchor.y,
    };
    this.layout = layout;
    this.placement = layout.placement;
    this.setWindowBounds(window, layout.windowBounds, animated);
    this.publishRemoteHostedPIPContentHost();
    this.sendLayoutToRenderer(window);
    if (this.computerUseCursorLocation != null && this.dragState == null)
      this.sendComputerUseCursorLocationToRenderer(window);
  }

  /** 计算某 display 的布局（原 getLayoutForDisplay，17,650-17,714）。 */
  private getLayoutForDisplay(display: Electron.Display, anchor: Rect = this.anchor): AvatarOverlayLayout {
    let workingAnchor = anchor;
    let stashOrMomentum =
      this.isQuickChatPresentation && (this.quickChatStashedEdge != null || this.momentumActive);
    let drawBounds = displayDrawBounds(display, this.layoutMode);
    let pipState = this.remoteHostedPIPContentLayoutState;
    let pipHostingOverlay = pipState?.currentHostID === AVATAR_OVERLAY_HOST_ID;
    let pipStackHeight = pipHostingOverlay ? Math.max(0, pipState.stackDisplayHeight) : undefined;
    let pipStackWidth = pipHostingOverlay ? Math.max(0, pipState.stackDisplayWidth) : undefined;
    if (this.layoutMode === `native` && this.isQuickChatPresentation && !stashOrMomentum) {
      let margin =
        (Math.max(quickChatRestingWidth(this.quickChatControls?.hasNotifications ?? false), pipStackWidth ?? 0) -
          this.mascotSize.width) /
          2 +
        16;
      workingAnchor = {
        ...workingAnchor,
        x: Math.max(
          drawBounds.x + margin,
          Math.min(workingAnchor.x, drawBounds.x + drawBounds.width - this.mascotSize.width - margin),
        ),
      };
    }
    let allDisplays = screen.getAllDisplays();
    let layout = computeAvatarOverlayLayout({
      anchor: workingAnchor,
      constrainNativeDrawWindowToDisplay:
        process.platform === `win32` ||
        (process.platform === `darwin` && this.isQuickChatPresentation && allDisplays.length > 1),
      displayBounds: drawBounds,
      dockedPIPStackDisplayHeight: pipStackHeight,
      mode: this.layoutMode,
      mascotSize: this.mascotSize,
      nativeDrawAnchor: this.isQuickChatPresentation
        ? (this.quickChatResizeDrawAnchor ?? {
            ...workingAnchor,
            x: Math.round(workingAnchor.x) + this.quickChatDrawOffset.x,
            y: Math.round(workingAnchor.y) + this.quickChatDrawOffset.y,
          })
        : undefined,
      nativeDrawMascotSize: this.isQuickChatPresentation ? undefined : { width: 80, height: 87 },
      nativeDrawDisplayHeightPx: Math.max(
        ...allDisplays.map((d) => displayDrawBounds(d, this.layoutMode).height),
      ),
      previousPlacement: this.placement,
      realtimeCaptionAboveMascotPx: this.realtimeCaptionAboveMascotPx,
      showsPetControls: this.showsPetControls,
      petControlRowHeight: this.quickChatControls == null ? undefined : 40,
      traySize: this.traySize ?? (this.layoutMode === `native` ? NATIVE_TRAY_SIZE : LEGACY_TRAY_SIZE),
      viewportSize:
        this.layoutMode === `native` && this.isQuickChatPresentation
          ? { width: QUICK_CHAT_MIN_SNAP_WIDTH_PX + 56, height: NATIVE_VIEWPORT_SIZE.height }
          : undefined,
    });
    if (this.isQuickChatPresentation) {
      if (stashOrMomentum) {
        layout.mascot.left += anchor.x - layout.anchor.x;
        layout.anchor.x = anchor.x;
      }
      let offsetFromCenter =
        workingAnchor.x + workingAnchor.width / 2 - (display.bounds.x + display.bounds.width / 2);
      let nearestStashEdge: string | undefined;
      if (offsetFromCenter < -0.5) nearestStashEdge = `left`;
      else if (offsetFromCenter > 0.5) nearestStashEdge = `right`;
      layout.quickChat = {
        restingWidth: this.getQuickChatRestingWidth(),
        hasOrbPicker: this.quickChatControls?.hasOrbPicker,
        nearestStashEdge,
        stashedEdge: this.quickChatStashedEdge ?? undefined,
        workArea: intersectBounds(layout.windowBounds, display.workArea),
      };
    }
    return layout;
  }

  /** remote PIP 布局状态更新（原 setRemoteHostedPIPContentLayoutState，17,715-17,756）。 */
  setRemoteHostedPIPContentLayoutState(state: RemoteHostedPIPContentLayoutState): void {
    if (deepEqual(this.remoteHostedPIPContentLayoutState, state)) return;
    let wasHosting = this.remoteHostedPIPContentLayoutState?.currentHostID === AVATAR_OVERLAY_HOST_ID;
    let previousStackWidth = wasHosting
      ? Math.max(0, this.remoteHostedPIPContentLayoutState?.stackDisplayWidth ?? 0)
      : undefined;
    this.remoteHostedPIPContentLayoutState = state;
    this.windowManager.sendMessageToAllWindows({
      state,
      type: `remote-hosted-pip-content-layout-state-changed`,
    });
    let nowHosting = state.currentHostID === AVATAR_OVERLAY_HOST_ID;
    let nextStackHeight = nowHosting ? Math.max(0, state.stackDisplayHeight) : undefined;
    let widthChanged =
      previousStackWidth !== (nowHosting ? Math.max(0, state.stackDisplayWidth) : undefined);
    if (previousStackWidth === nextStackHeight && !widthChanged) return;
    let window = this.window;
    if (window != null && !window.isDestroyed()) {
      if (!wasHosting && nowHosting) {
        this.windowManager.sendMessageToWebContents(window.webContents, {
          type: `avatar-overlay-action`,
          action: { type: `hide-activity-pills`, automatic: true },
        });
      }
      if (this.isQuickChatPresentation && this.dragState == null && !this.isFreelyPositioned && widthChanged) {
        let display = this.getCurrentDisplay();
        let snapTarget = this.snapQuickChatToPosition(
          display,
          this.quickChatPosition ?? positionFromPoint(anchorCenter(this.anchor), display.workArea),
          true,
        );
        if (nowHosting && snapTarget != null) {
          this.remoteHostedPIPContentHostMotionTarget = snapTarget;
          this.publishRemoteHostedPIPContentHost();
        }
      } else {
        this.applyLayout(window);
      }
    }
  }

  /** 取布局（懒计算，原 getLayout）。 */
  private getLayout(window: BrowserWindow): AvatarOverlayLayout {
    if (this.layout == null) this.applyLayout(window);
    if (this.layout == null) throw Error(`Expected avatar overlay layout`);
    return this.layout;
  }

  /** 设置窗口 bounds（原 setWindowBounds）。 */
  private setWindowBounds(window: BrowserWindow, bounds: Rect, animated: boolean): void {
    if (!window.isDestroyed() && !boundsEqual(window.getContentBounds(), bounds)) {
      this.isSettingWindowBounds = true;
      try {
        window.setContentBounds(bounds, animated);
      } finally {
        this.isSettingWindowBounds = false;
      }
    }
  }

  /** 发送布局到 renderer（原 sendLayoutToRenderer，17,772-17,808）。 */
  private sendLayoutToRenderer(window: BrowserWindow): void {
    if (window.isDestroyed() || this.layout == null || !this.rendererReady) return;
    let layout = rendererLayoutSubset(this.layout);
    let isGlobalRealtimeVoicePresentation = this.realtimeController.isGlobalHotkeySessionReserved();
    let isVisible = this.shouldPresentWindow() || this.windowHideAnimation === `running`;
    let quickChatFocusRequestId = this.pendingQuickChatFocus?.hasLayout
      ? this.pendingQuickChatFocus.requestId
      : undefined;
    let unchanged =
      this.lastSentRendererState != null &&
      deepEqual(layout, (this.lastSentRendererState as { layout: unknown }).layout) &&
      this.petOpenIntent === this.lastSentRendererState.petOpenIntent &&
      this.arePresentationAccessoriesVisible ===
        this.lastSentRendererState.arePresentationAccessoriesVisible &&
      isVisible === this.lastSentRendererState.isVisible &&
      isGlobalRealtimeVoicePresentation ===
        this.lastSentRendererState.isGlobalRealtimeVoicePresentation &&
      quickChatFocusRequestId === this.lastSentRendererState.quickChatFocusRequestId;
    if (unchanged) return;
    this.lastSentRendererState = {
      isGlobalRealtimeVoicePresentation,
      isVisible,
      layout,
      petOpenIntent: this.petOpenIntent,
      arePresentationAccessoriesVisible: this.arePresentationAccessoriesVisible,
      quickChatFocusRequestId,
    };
    this.windowManager.sendMessageToWebContents(
      window.webContents,
      {
        type: `avatar-overlay-layout-changed`,
        layoutRevision: ++this.layoutRevision,
        quickChatFocusRequestId,
        isGlobalRealtimeVoicePresentation,
        isVisible,
        layout,
        petOpenIntent: this.petOpenIntent,
        arePresentationAccessoriesVisible: this.arePresentationAccessoriesVisible,
      },
      { priority: `critical` },
    );
  }

  /** 持久化窗口位置（原 persistWindowBounds，17,809-17,829）。 */
  private persistWindowBounds(window: BrowserWindow, display: Electron.Display = this.getCurrentDisplay()): void {
    if (window.isDestroyed()) return;
    let displayBounds = display.bounds;
    let placement = {
      x: this.anchor.x + this.presentationOffset.x,
      y: this.anchor.y + this.presentationOffset.y,
      displayBounds,
      displayId: display.id,
      placement: this.placement,
      isFreelyPositioned: this.isFreelyPositioned,
    };
    let stored = this.globalState.get(AVATAR_OVERLAY_BOUNDS_KEY);
    let resolutionKey = resolutionKeyForBounds(displayBounds);
    this.displayId = display.id;
    this.resolutionKey = resolutionKey;
    let next = {
      ...placement,
      byDisplayId: { ...stored?.byDisplayId, [String(display.id)]: placement },
      byResolution: { ...stored?.byResolution, [resolutionKey]: placement },
    };
    if (!deepEqual(stored, next)) this.globalState.set(AVATAR_OVERLAY_BOUNDS_KEY, next);
  }

  /** 显示窗口（原 showWindow，17,830-17,851）。 */
  private showWindow(window: BrowserWindow): void {
    if (window.isDestroyed()) return;
    let wasOpen = this.isOpen();
    window.moveTop();
    window.showInactive();
    this.updateCssPetControlsProximityTracking();
    if (this.presentationFadeInPending) {
      this.presentationFadeInPending = false;
      this.fadeInPresentation(window);
    }
    this.publishRemoteHostedPIPContentHost();
    if (!wasOpen && this.isOpen()) {
      this.realtimeController.handlePresented();
      this.broadcastOpenState();
    }
    let pending = this.pendingPresentation;
    if (pending != null) {
      this.pendingPresentation = null;
      if (pending.velocity == null) {
        this.dockRestoreAnchor = pending.target;
        this.animatePresentationTo(pending.target, dockingVelocity(this.anchor, pending.target), () => {
          if (this.dockRestoreAnchor === pending.target) this.dockRestoreAnchor = null;
        });
      } else {
        this.startMomentum(pending.velocity.x, pending.velocity.y, true);
      }
    }
  }

  /** 可见性对账（原 reconcileWindowVisibility，17,852-17,869）。 */
  private reconcileWindowVisibility(): void {
    if (this.isAppQuitting) return;
    if (!this.shouldPresentWindow()) {
      this.hideWindow();
      return;
    }
    let window = this.window;
    if (window != null && window !== this.closingWindow && !window.isDestroyed()) {
      this.presentWindow(window);
      return;
    }
    this.open(null, { persistPetIntent: false }).catch((error) => {
      this.logger().warning(`Failed to show avatar overlay presentation`, {
        safe: {},
        sensitive: { error },
      });
    });
  }

  /** 隐藏窗口（原 hideWindow，17,870-17,907）。 */
  private hideWindow(): void {
    if (this.windowHideAnimation === `running`) return;
    let animated = this.windowHideAnimation === `pending`;
    let window = this.window;
    this.windowVisibilitySequence += 1;
    this.cancelQuickChatFocus();
    this.cancelPresentationFade(window, false);
    let hideNow = () => {
      if (window !== this.window) {
        this.windowHideAnimation = null;
        this.updateCssPetControlsProximityTracking();
        this.resetQuickChatKeyboardInteraction();
        this.broadcastOpenState();
        this.scheduleDismissedWindowCleanup();
        return;
      }
      this.windowHideAnimation = null;
      this.updateCssPetControlsProximityTracking();
      if (window != null && !window.isDestroyed()) {
        this.updateRendererBackgroundThrottling();
        window.hide();
        if (animated || !this.hiddenForApplicationHide) window.setOpacity(1);
        if (this.isQuickChatPresentation) {
          window.setFocusable(false);
          this.refreshNativeActiveAppearance(window);
        }
        this.restoreDockAnchor();
        this.sendLayoutToRenderer(window);
      }
      this.resetQuickChatKeyboardInteraction();
      this.broadcastOpenState();
      this.scheduleDismissedWindowCleanup();
    };
    if (
      animated &&
      !this.isAppQuitting &&
      !this.hiddenForApplicationHide &&
      window != null &&
      !window.isDestroyed() &&
      window.isVisible()
    ) {
      this.fadePresentation(window, window.getOpacity(), 0, hideNow, HIDE_FADE_DURATION_MS);
      this.windowHideAnimation = `running`;
      return;
    }
    hideNow();
  }

  /** 调度销毁保留窗口（原 scheduleDismissedWindowCleanup，17,908-17,929）。 */
  private scheduleDismissedWindowCleanup(): void {
    this.clearDismissedWindowCleanup();
    let window = this.window;
    if (
      !this.isDismissedWindowRetained ||
      this.isAppQuitting ||
      this.shouldPresentWindow() ||
      this.realtimeController.isSessionReserved() ||
      window == null ||
      window.isDestroyed() ||
      window.isVisible()
    )
      return;
    this.dismissedWindowCleanupTimer = setTimeout(() => {
      this.dismissedWindowCleanupTimer = null;
      let currentWindow = this.window;
      if (
        this.shouldPresentWindow() ||
        this.realtimeController.isSessionReserved() ||
        currentWindow == null ||
        currentWindow.isDestroyed() ||
        currentWindow.isVisible()
      )
        return;
      this.destroyHiddenWindow();
    }, DISMISSED_WINDOW_CLEANUP_DELAY_MS);
    this.dismissedWindowCleanupTimer.unref?.();
  }

  private clearDismissedWindowCleanup(): void {
    if (this.dismissedWindowCleanupTimer != null) {
      clearTimeout(this.dismissedWindowCleanupTimer);
      this.dismissedWindowCleanupTimer = null;
    }
  }

  /** 销毁隐藏窗口（原 destroyHiddenWindow）。 */
  private destroyHiddenWindow(): void {
    this.clearDismissedWindowCleanup();
    if (this.shouldPresentWindow()) return;
    let window = this.window;
    if (window != null && this.closingWindow !== window) {
      this.isDismissedWindowRetained = false;
      this.realtimeController.unregisterStarter(window.webContents.id);
      this.closingWindow = window;
      window.close();
    }
  }

  /** 就绪则显示（原 showWindowIfReady）。 */
  private showWindowIfReady(window: BrowserWindow): void {
    if (
      this.shouldPresentWindow() &&
      !this.hiddenForApplicationHide &&
      this.rendererReady &&
      this.initialPresentationState === `ready` &&
      this.pendingQuickChatFocus == null &&
      !this.awaitingRealtimeVoicePresentation
    ) {
      this.showWindow(window);
      this.applyPointerInteractivityPolicy();
    }
  }

  /** 淡入（原 fadeInPresentation）。 */
  private fadeInPresentation(window: BrowserWindow): void {
    this.fadePresentation(window, FADE_START_OPACITY, 1);
  }

  /** 淡出/淡入动画（原 fadePresentation，17,956-17,974）。 */
  private fadePresentation(
    window: BrowserWindow,
    fromOpacity: number,
    toOpacity: number,
    onDone?: () => void,
    durationMs = FADE_DURATION_MS,
  ): void {
    this.cancelPresentationFade(window, false);
    let startTime = Date.now();
    let step = () => {
      if (window.isDestroyed() || !window.isVisible()) {
        this.presentationFadeTimer = null;
        onDone?.();
        return;
      }
      let progress = Math.min(1, (Date.now() - startTime) / durationMs);
      let eased = 1 - (1 - progress) ** 3;
      window.setOpacity(progress === 1 ? toOpacity : fromOpacity + (toOpacity - fromOpacity) * eased);
      if (progress === 1) {
        this.presentationFadeTimer = null;
        onDone?.();
        return;
      }
      this.presentationFadeTimer = setTimeout(
        step,
        Math.min(ANIMATION_FRAME_MS, durationMs - (Date.now() - startTime)),
      );
      this.presentationFadeTimer.unref?.();
    };
    step();
  }

  /** 取消淡出（原 cancelPresentationFade）。 */
  private cancelPresentationFade(window: BrowserWindow = this.window, resetOpacity = true): void {
    this.windowHideAnimation = null;
    this.presentationFadeInPending = false;
    if (this.presentationFadeTimer != null) {
      clearTimeout(this.presentationFadeTimer);
      this.presentationFadeTimer = null;
    }
    if (resetOpacity && window != null && !window.isDestroyed()) window.setOpacity(1);
  }

  /** 是否应呈现（原 shouldPresentWindow）。 */
  private shouldPresentWindow(): boolean {
    return (
      (this.presentationVisibility ?? this.startupPresentationVisibility ?? this.petOpenIntent) ===
      true
    );
  }

  /** renderer 节流（原 updateRendererBackgroundThrottling）。 */
  private updateRendererBackgroundThrottling(): void {
    let window = this.window;
    if (window == null || window.isDestroyed() || !this.rendererReady) return;
    window.webContents.setBackgroundThrottling(
      !this.shouldPresentWindow() && !this.realtimeController.isSessionReserved(),
    );
  }

  /** 广播打开状态（原 broadcastOpenState）。 */
  private broadcastOpenState(): void {
    this.windowManager.sendMessageToAllRegisteredWindows({
      type: `avatar-overlay-open-state-changed`,
      isOpen: this.isOpen(),
    });
  }

  /** 鼠标穿透策略（原 applyPointerInteractivityPolicy，18,002-18,025）。 */
  private applyPointerInteractivityPolicy(): void {
    let window = this.window;
    if (window == null || window.isDestroyed()) {
      this.mousePassthroughMode = `disabled`;
      return;
    }
    let inputShapeApplied = this.applyInputShape(window);
    if (!window.isVisible()) {
      if (process.platform === `win32` && this.mousePassthroughMode === `disabled`) return;
      if (this.mousePassthroughMode !== `without-forwarding`) {
        window.setIgnoreMouseEvents(true, { forward: false });
        this.mousePassthroughMode = `without-forwarding`;
      }
      return;
    }
    if (inputShapeApplied) return;
    let nextMode: `disabled` | `forwarding` = this.pointerInteractive ? `disabled` : `forwarding`;
    if (this.mousePassthroughMode !== nextMode) {
      this.mousePassthroughMode = nextMode;
      if (nextMode === `forwarding`) {
        window.setIgnoreMouseEvents(true, { forward: true });
        return;
      }
      window.setIgnoreMouseEvents(false);
      this.refreshCursorAtCurrentMousePosition(window);
    }
  }

  /** 应用输入形状（原 applyInputShape，18,026-18,039）。 */
  private applyInputShape(window: BrowserWindow): boolean {
    if (!this.supportsInputShape || this.inputShape == null) return false;
    if (this.mousePassthroughMode !== `disabled`) {
      window.setIgnoreMouseEvents(false);
      this.mousePassthroughMode = `disabled`;
    }
    let applied = (
      window as unknown as {
        setInputShape(rects: Array<{ height: number; width: number; x: number; y: number }>): boolean;
      }
    ).setInputShape(
      this.inputShape.map(({ height, left, top, width }) => ({
        height,
        width,
        x: left,
        y: top,
      })),
    );
    if (applied) this.mousePassthroughMode = `disabled`;
    return applied;
  }

  /** computer-use 光标位置（原 setComputerUseCursorLocation，18,040-18,055）。 */
  private setComputerUseCursorLocation(location: ComputerUseCursorLocation): void {
    this.computerUseCursorLocation = location;
    this.computerUseCursorPoint = location.isActive ? { x: location.x, y: location.y } : null;
    let window = this.window;
    if (window == null || window.isDestroyed()) return;
    this.sendComputerUseCursorLocationToRenderer(window);
    if (this.dragState != null) return;
    if (this.computerUseCursorPoint != null) {
      this.sendCursorPointToAvatarOverlay(window, this.computerUseCursorPoint, true);
      return;
    }
    if (!this.refreshCursorAtCurrentMousePosition(window))
      window.webContents.sendInputEvent({ type: `mouseLeave`, x: -1, y: -1 });
  }

  /** 光标位置下发（原 sendComputerUseCursorLocationToRenderer）。 */
  private sendComputerUseCursorLocationToRenderer(window: BrowserWindow): void {
    if (window.isDestroyed() || !this.rendererReady) return;
    let contentBounds = window.getContentBounds();
    this.windowManager.sendMessageToWebContents(window.webContents, {
      type: `avatar-overlay-computer-use-cursor-changed`,
      point:
        this.computerUseCursorPoint == null
          ? null
          : {
              x: this.computerUseCursorPoint.x - contentBounds.x,
              y: this.computerUseCursorPoint.y - contentBounds.y,
            },
    });
  }

  /** 刷新光标到当前位置（原 refreshCursorAtCurrentMousePosition）。 */
  private refreshCursorAtCurrentMousePosition(window: BrowserWindow): boolean {
    if (window.isDestroyed()) return false;
    if (this.computerUseCursorPoint != null)
      return this.sendCursorPointToAvatarOverlay(window, this.computerUseCursorPoint, true);
    let cursor = screen.getCursorScreenPoint();
    return this.sendCursorPointToAvatarOverlay(window, cursor, false);
  }

  /** 光标合成事件（原 sendCursorPointToAvatarOverlay）。 */
  private sendCursorPointToAvatarOverlay(window: BrowserWindow, point: Point, force: boolean): boolean {
    let contentBounds = window.getContentBounds();
    let x = point.x - contentBounds.x;
    let y = point.y - contentBounds.y;
    if (!force && (x < 0 || y < 0 || x > contentBounds.width || y > contentBounds.height))
      return false;
    window.webContents.sendInputEvent({
      type: `mouseMove`,
      x,
      y,
      movementX: 0,
      movementY: 0,
    });
    return true;
  }
}


