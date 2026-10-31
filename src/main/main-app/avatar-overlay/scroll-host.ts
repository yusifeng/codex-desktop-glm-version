// Avatar overlay 的原生滚动宿主服务 + 更新能力门面。
//
// 对应 main-C-Mhak1n.ts 68,306-68,426：
//   - IOe UpdateCapabilityService（68,306-68,317）：仅 primary window 的
//     origin 才转发 capability 更新
//   - LOe subscribeMacSwipeEvents（68,318-68,352）：objc-js 的 NSEvent
//     本地监视器（scrollWheel mask 2^22），窗口坐标换算（isFlipped /
//     zoomFactor），返回 removeMonitor
//   - zOe AvatarOverlayScrollHostService（68,369-68,413）：RPC 订阅 →
//     原生 swipe 事件 → using-scope 推送；destroyed/onRpcBroken 双清理
//   - BOe StopHandle（68,415-68,426）
import { BrowserWindow } from "electron";
import { Uf as EventEmitterBase, Wr as disposableBag } from "@chunk/shared";
import { createTaggedLogger } from "@chunk/logger";
import { en as usingScopeHelper } from "@chunk/bootstrap";

// ---------------------------------------------------------------------------
// UpdateCapabilityService（原 `IOe`）
// ---------------------------------------------------------------------------

/** primary window 匹配时才转发 capability 更新（原 `IOe`）。 */
class UpdateCapabilityService extends (EventEmitterBase as new () => {}) {
  origin: { id: number };
  windowManager: { getPrimaryWindow(): { webContents: { id: number } } | null };
  updateCapability: (capability: unknown) => void;

  constructor(origin: { id: number }, windowManager: UpdateCapabilityService["windowManager"], updateCapability: (capability: unknown) => void) {
    super();
    this.origin = origin;
    this.windowManager = windowManager;
    this.updateCapability = updateCapability;
  }

  setCapability(capability: unknown) {
    if (this.windowManager.getPrimaryWindow()?.webContents.id === this.origin.id)
      this.updateCapability(capability);
  }
}

/** Renderer-facing avatar overlay controls scoped to one WebContents origin. */
class AvatarOverlayService extends (EventEmitterBase as new () => {}) {
  constructor(
    private readonly manager: {
      setPointerRegions(originId: number, regions: unknown, activeRegion: unknown): void;
      setQuickChatStashed(originId: number, stashed: unknown): void;
      completeQuickChatFocus(originId: number, requestId: unknown, focused: unknown): unknown;
    },
    private readonly origin: { id: number },
  ) {
    super();
  }

  setPointerRegions(regions: unknown, activeRegion: unknown) {
    this.manager.setPointerRegions(this.origin.id, regions, activeRegion);
  }

  setQuickChatStashed(stashed: unknown) {
    this.manager.setQuickChatStashed(this.origin.id, stashed);
  }

  completeQuickChatFocus(requestId: unknown, focused: unknown) {
    return this.manager.completeQuickChatFocus(this.origin.id, requestId, focused);
  }
}

// ---------------------------------------------------------------------------
// mac 原生 swipe 事件（原 `LOe`）
// ---------------------------------------------------------------------------

interface SwipeEvent {
  deltaX: number;
  deltaY: number;
  directionInvertedFromDevice: boolean;
  hasPreciseDeltas: boolean;
  momentumPhase: unknown;
  phase: unknown;
  pressedMouseButtons: number;
  timestampMs: number;
  x: number;
  y: number;
  zoomFactor: number;
}

/** NSEvent 本地监视器订阅原生滚动（仅 darwin，原 `LOe`）。 */
async function subscribeMacSwipeEvents(webContents: Electron.WebContents, onEvent: (event: SwipeEvent) => void): Promise<(() => void) | null> {
  if (process.platform !== "darwin") return null;
  const window = BrowserWindow.fromWebContents(webContents);
  if (window == null) return null;
  const { NobjcLibrary, fromPointer, typedBlock } = (await import("objc-js")) as never as {
    NobjcLibrary: new (path: string) => { NSEvent: never };
    fromPointer: (handle: Buffer) => never;
    typedBlock: (spec: { returns: string; args: string[] }, block: (event: never) => never) => never;
  };
  if (window.isDestroyed()) return null;
  const appKit = new NobjcLibrary("/System/Library/Frameworks/AppKit.framework/AppKit");
  const NSEvent = appKit.NSEvent;
  const view = fromPointer(window.getNativeWindowHandle()) as unknown as {
    window(): { windowNumber(): number };
    convertPoint$fromView$(point: unknown, view: null): { x: number; y: number };
    bounds(): { origin: { x: number; y: number }; size: { height: number } };
    isFlipped(): boolean;
  };
  const windowNumber = view.window().windowNumber();
  const monitor = (NSEvent as unknown as {
    addLocalMonitorForEventsMatchingMask$handler$(mask: number, block: never): never;
  }).addLocalMonitorForEventsMatchingMask$handler$(
    2 ** 22,
    typedBlock({ returns: "@", args: ["@"] }, (event) => {
      if ((event as unknown as { windowNumber(): number }).windowNumber() === windowNumber) {
        const point = (view as unknown as {
          convertPoint$fromView$(point: never, view: null): { x: number; y: number };
        }).convertPoint$fromView$((event as unknown as { locationInWindow(): never }).locationInWindow(), null);
        const bounds = (view as unknown as { bounds(): { origin: { x: number; y: number }; size: { height: number } } }).bounds();
        const zoomFactor = webContents.getZoomFactor();
        onEvent({
          deltaX: (event as unknown as { scrollingDeltaX(): number }).scrollingDeltaX(),
          deltaY: (event as unknown as { scrollingDeltaY(): number }).scrollingDeltaY(),
          directionInvertedFromDevice: (event as unknown as { isDirectionInvertedFromDevice(): boolean }).isDirectionInvertedFromDevice(),
          hasPreciseDeltas: (event as unknown as { hasPreciseScrollingDeltas(): boolean }).hasPreciseScrollingDeltas(),
          momentumPhase: (event as unknown as { momentumPhase(): unknown }).momentumPhase(),
          phase: (event as unknown as { phase(): unknown }).phase(),
          pressedMouseButtons: (NSEvent as unknown as { pressedMouseButtons(): number }).pressedMouseButtons(),
          timestampMs: (event as unknown as { timestamp(): number }).timestamp() * 1e3,
          x: (point.x - bounds.origin.x) / zoomFactor,
          y: ((view as unknown as { isFlipped(): boolean }).isFlipped()
            ? point.y - bounds.origin.y
            : bounds.origin.y + bounds.size.height - point.y) / zoomFactor,
          zoomFactor,
        });
      }
      return event;
    }),
  );
  return () => (NSEvent as unknown as { removeMonitor$(monitor: never): void }).removeMonitor$(monitor);
}

// ---------------------------------------------------------------------------
// StopHandle（原 `BOe`）
// ---------------------------------------------------------------------------

/** 一次性停止句柄（原 `BOe`）。 */
class StopHandle extends (EventEmitterBase as new () => {}) {
  stop: (() => void) | null;

  constructor(stop: () => void) {
    super();
    this.stop = stop;
  }

  unsubscribe() {
    const stop = this.stop;
    this.stop = null;
    stop?.();
  }

  [Symbol.dispose]() {
    this.unsubscribe();
  }
}

// ---------------------------------------------------------------------------
// AvatarOverlayScrollHostService（原 `zOe`）
// ---------------------------------------------------------------------------

interface RpcSubscription {
  dup(): RpcSubscription;
  (event: SwipeEvent): unknown;
  onRpcBroken(cb: () => void): void;
  [Symbol.dispose](): void;
}

/** avatar overlay 的原生滚动订阅服务（原 `zOe`）。 */
class AvatarOverlayScrollHostService extends (EventEmitterBase as new () => {}) {
  origin: Electron.WebContents;
  logger = createTaggedLogger("AvatarOverlayScrollHostService");

  constructor(origin: Electron.WebContents) {
    super();
    this.origin = origin;
  }

  async subscribeScrollEvents(subscription: RpcSubscription): Promise<StopHandle | null> {
    const stream = subscription.dup();
    let stopMonitor: (() => void) | null = null;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      stopMonitor?.();
      this.origin.removeListener("destroyed", close);
      stream[Symbol.dispose]();
    };
    this.origin.once("destroyed", close);
    stream.onRpcBroken(close);
    try {
      stopMonitor = await subscribeMacSwipeEvents(this.origin, (event) => {
        (async () => {
          const scope = usingScopeHelper() as unknown as { u(value: unknown): Promise<unknown>; e: unknown; d(): void };
          try {
            await scope.u(stream(event));
          } catch (error) {
            scope.e = error;
          } finally {
            scope.d();
          }
        })().catch(close);
      });
      if (closed) {
        stopMonitor?.();
        return null;
      }
      if (stopMonitor == null) {
        close();
        return null;
      }
      this.logger.debug("Native swipe input subscribed");
      return new StopHandle(close);
    } catch (error) {
      close();
      this.logger.warning("Native swipe input unavailable", {
        safe: {},
        sensitive: { error },
      });
      return null;
    }
  }
}

export {
  UpdateCapabilityService,
  AvatarOverlayService,
  subscribeMacSwipeEvents,
  StopHandle,
  AvatarOverlayScrollHostService,
  type SwipeEvent,
};
