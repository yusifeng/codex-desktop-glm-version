// avatar overlay 实时语音控制器（原版 15,036-15,270 区段）。
//
// 职责（RealtimeVoiceController，原 rle）：
//   - 实时语音会话的「预约」生命周期：pendingStart / startInFlight / hasSession
//     三态互斥，代数（sessionGeneration）贯穿防错乱；
//   - starter 注册（renderer 提供的 start/cancelStart RPC 句柄，WeakMap 键
//     控生命周期：窗口销毁即解引用）；
//   - 启动超时（主窗口 30s / starter 挂接后 10s）→ resetSession(`failed`)；
//   - presentation 准备（overlay 显示等待 pendingPresentation deferred）；
//   - launch 状态发布（main-thread / global-overlay 两种 surface）。
//
// WeakMap 键控生命周期（深析 §7）：`Ru`（模块级 WeakMap，window → controller）
// ——窗口对象 GC 即自动解注册，不新增显式 dispose 语义。
//
// 模块加载期副作用：仅 WeakMap 构造。

import { memoizedTaggedLogger } from "@chunk/logger";
import { Ac as createDeferred, Zo as errorMessage } from "@chunk/shared";
import { REALTIME_LAUNCH_TIMEOUT_MS, REALTIME_CONNECTED_TIMEOUT_MS } from "./constants";

/** 启动请求描述（requestStart 的 request）。 */
export interface RealtimeStartRequest {
  source: string;
  preferredPresentationSurface?: string | null;
  [key: string]: unknown;
}

/** launch 状态发布参数。 */
export interface RealtimeLaunch {
  launchId: string;
  origin: { id: number | string; [key: string]: unknown };
}

/** renderer 侧 starter 的 RPC 句柄形态（with onRpcBroken + Symbol.dispose）。 */
export interface StarterRpcHandle {
  (request?: RealtimeStartRequest): Promise<unknown> | unknown;
  onRpcBroken(handler: () => void): unknown;
  [Symbol.dispose](): void;
}

/** 已注册的 starter（原 registerStarter 的载荷）。 */
export interface RealtimeStarter {
  canCreateNewThread: boolean;
  cancelStart: StarterRpcHandle & ((reason: string) => Promise<unknown>);
  rendererId: number;
  start: StarterRpcHandle;
  stopSessionIfActive?: (() => boolean) | null;
}

/** 控制器宿主注入面（原 options）。 */
export interface RealtimeVoiceControllerOptions {
  clearPresentation(): void;
  getRendererId(): number | null;
  isOpen(): boolean;
  isOpening(): boolean;
  isPresentationPending(): boolean;
  preparePresentation(origin: unknown, useGlobalOverlay: boolean): Promise<unknown>;
  publishLaunchState(
    origin: { id: number | string },
    phase: string,
    launchId: string,
    error?: string,
  ): void;
}

/** 窗口 → 控制器注册表（原 Ru，15,035）。 */
const controllerRegistry = new WeakMap<object, RealtimeVoiceController>();

/** 注册控制器（原 ile，15,263-15,265）。 */
export function registerVoiceController(window: object, controller: RealtimeVoiceController): void {
  controllerRegistry.set(window, controller);
}

/** 取控制器（原 zu，15,266-15,270）：缺失抛错（消费方在 160,030/174,310）。 */
export function getVoiceController(window: object): RealtimeVoiceController {
  let controller = controllerRegistry.get(window);
  if (controller == null) throw Error(`Avatar overlay voice controller is unavailable`);
  return controller;
}

/** 实时语音控制器（原 rle，15,036-15,261）。 */
export class RealtimeVoiceController {
  private options: RealtimeVoiceControllerOptions;
  private logger = memoizedTaggedLogger(`avatar-overlay-realtime`);
  private sessionReservationListeners = new Set<(reserved: boolean) => void>();
  private pendingStart: RealtimeStartRequest | null = null;
  private sessionGeneration = 0;
  private hasSession = false;
  private sessionStartSource: string | null = null;
  private launchTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingPresentation: { promise: Promise<void>; resolve: (value: void) => void } | null =
    null;
  private launch: RealtimeLaunch | null = null;
  private starter: RealtimeStarter | null = null;
  private startInFlight: Promise<void> | null = null;

  constructor(options: RealtimeVoiceControllerOptions) {
    this.options = options;
  }

  /** 会话或启动预约中（原 isSessionReserved）。 */
  isSessionReserved(): boolean {
    return this.pendingStart != null || this.startInFlight != null || this.hasSession;
  }

  /** 订阅预约状态变化（原 subscribeSessionReservationChanges）：立即回调一次。 */
  subscribeSessionReservationChanges(listener: (reserved: boolean) => void): () => void {
    this.sessionReservationListeners.add(listener);
    listener(this.isSessionReserved());
    return () => {
      this.sessionReservationListeners.delete(listener);
    };
  }

  /** 全局热键会话预约中（原 isGlobalHotkeySessionReserved）。 */
  isGlobalHotkeySessionReserved(): boolean {
    return this.isSessionReserved() && this.sessionStartSource === `global_hotkey_new_thread`;
  }

  /** 窗口重建前清理 starter（原 prepareForWindowCreation）。 */
  prepareForWindowCreation(): void {
    this.clearStarter();
  }

  /** overlay 已呈现（原 handlePresented）。 */
  handlePresented(): void {
    this.startIfReady();
    this.pendingPresentation?.resolve(void 0);
    this.pendingPresentation = null;
  }

  /** 窗口关闭（原 handleWindowClosed）。 */
  handleWindowClosed(rendererId?: number): void {
    this.resetSession();
    this.clearStarter(rendererId);
  }

  /** 重置会话（原 resetSession，15,078-15,091）。 */
  resetSession(phase = `idle`, error?: string): void {
    let launch = this.launch;
    this.clearLaunchTimeout();
    this.sessionGeneration += 1;
    this.pendingStart = null;
    this.hasSession = false;
    this.sessionStartSource = null;
    this.startInFlight = null;
    this.launch = null;
    this.notifySessionReservationChanges();
    this.handlePresented();
    this.options.clearPresentation();
    if (launch != null) this.publishLaunchState(launch, phase, error);
  }

  /** 注册 starter（原 registerStarter，15,092-15,109）。 */
  registerStarter(
    rendererId: number,
    start: RealtimeStarter["start"],
    cancelStart: RealtimeStarter["cancelStart"],
    canCreateNewThread: boolean,
    stopSessionIfActive: (() => boolean) | null,
  ): void {
    let currentRendererId = this.options.getRendererId();
    if (
      (currentRendererId == null && !this.options.isOpening()) ||
      (currentRendererId != null && currentRendererId !== rendererId)
    )
      return;
    this.clearStarter();
    let startHandle = start as StarterRpcHandle;
    let cancelHandle = cancelStart as unknown as StarterRpcHandle;
    this.starter = {
      canCreateNewThread,
      cancelStart: cancelStart as RealtimeStarter["cancelStart"],
      rendererId,
      start,
      stopSessionIfActive,
    };
    let onBroken = () => {
      if (this.starter?.start === start) this.clearStarter(rendererId);
    };
    startHandle.onRpcBroken(onBroken);
    cancelHandle.onRpcBroken(onBroken);
    this.startIfReady();
  }

  /** 注销 starter（原 unregisterStarter）。 */
  unregisterStarter(rendererId: number): void {
    if (this.options.getRendererId() === rendererId) this.clearStarter(rendererId);
  }

  /** 取消启动（原 cancelStart，15,113-15,117）。 */
  async cancelStart(origin: { id: number | string }): Promise<void> {
    if (this.options.getRendererId() !== origin.id && this.launch?.origin.id !== origin.id) return;
    let cancel = this.starter?.cancelStart;
    this.resetSession();
    await cancel?.(`user_cancelled`);
  }

  /** 会话完成（原 completeSession）。 */
  completeSession(rendererId: number): void {
    if (this.options.getRendererId() === rendererId && this.hasSession) this.resetSession();
  }

  /** 请求启动（原 requestStart，15,121-15,176）。 */
  async requestStart(origin: unknown, request: RealtimeStartRequest, launchId?: string): Promise<void> {
    let isMainWindowLaunch =
      request.source === `composer_button_new_thread` ||
      request.source === `composer_button_existing_thread`;
    let launch: RealtimeLaunch | null = null;
    if (isMainWindowLaunch) {
      if (launchId == null || origin == null)
        throw Error(`Main-window voice launches require a launch ID`);
      launch = { launchId, origin: origin as RealtimeLaunch[`origin`] };
    }
    let isSameOrigin = launch != null && this.launch?.origin.id === launch.origin.id;
    let allowSupersede =
      request.source === `composer_button_existing_thread`
        ? this.pendingStart?.source !== `composer_button_existing_thread` || isSameOrigin
        : request.source === `composer_button_new_thread` &&
          this.pendingStart?.source === `composer_button_new_thread` &&
          isSameOrigin;
    if (this.startInFlight != null || (this.pendingStart != null && !allowSupersede)) {
      let message = `Voice chat is already starting`;
      this.logger().warning(message, { safe: {}, sensitive: { request } });
      if (launch != null) this.publishLaunchState(launch, `failed`, message);
      return;
    }
    if (this.pendingStart != null) {
      this.clearLaunchTimeout();
      this.handlePresented();
      let previousLaunch = this.launch;
      this.launch = null;
      if (previousLaunch != null && previousLaunch.origin.id !== launch?.origin.id)
        this.publishLaunchState(previousLaunch, `idle`);
    }
    let surface = isMainWindowLaunch ? `main-thread` : `global-overlay`;
    if (request.source === `composer_button_existing_thread`)
      surface = (request.preferredPresentationSurface as string) ?? `main-thread`;
    let useGlobalOverlay = surface === `global-overlay`;
    let generation = ++this.sessionGeneration;
    this.launch = launch;
    this.sessionStartSource = request.source;
    this.pendingStart = { ...request, preferredPresentationSurface: surface };
    this.notifySessionReservationChanges();
    if (launch != null) {
      this.publishLaunchState(launch, `starting`);
      this.setLaunchTimeout(generation, REALTIME_LAUNCH_TIMEOUT_MS);
    }
    let prepared = this.options.preparePresentation(origin, useGlobalOverlay);
    this.startIfReady();
    try {
      await prepared;
    } catch (error) {
      if (generation !== this.sessionGeneration) return;
      this.logger().error(`Failed to prepare realtime voice presentation`, {
        safe: {},
        sensitive: { error },
      });
      this.resetSession(launch == null ? `idle` : `failed`, errorMessage(error));
      throw error;
    }
    if (
      generation === this.sessionGeneration &&
      (this.startIfReady(), useGlobalOverlay && this.isSessionReserved())
    )
      await this.waitForPresentation();
  }

  /** 全局热键切换（原 toggleGlobalHotkeySession，15,177-15,185）。 */
  async toggleGlobalHotkeySession(): Promise<void> {
    if (!this.isSessionReserved()) {
      await this.requestStart(null, { source: `global_hotkey_new_thread` }, void 0);
      return;
    }
    if (this.starter?.stopSessionIfActive?.() === true) return;
    let cancel = this.starter?.cancelStart;
    this.resetSession();
    await cancel?.(`user_cancelled`);
  }

  /** 条件齐备时启动（原 startIfReady，15,186-15,221）。 */
  private startIfReady(): void {
    let pendingStart = this.pendingStart;
    let starter = this.starter;
    if (
      pendingStart == null ||
      starter == null ||
      starter.rendererId !== this.options.getRendererId() ||
      (pendingStart.source === `global_hotkey_new_thread` && this.options.isPresentationPending()) ||
      (pendingStart.source !== `composer_button_existing_thread` && !starter.canCreateNewThread)
    )
      return;
    this.pendingStart = null;
    this.hasSession = true;
    let generation = this.sessionGeneration;
    let launch = this.launch;
    if (launch != null) this.setLaunchTimeout(generation, REALTIME_CONNECTED_TIMEOUT_MS);
    let startPromise = Promise.resolve(starter.start(pendingStart) as never).then(
      () => {
        if (
          generation === this.sessionGeneration &&
          launch != null &&
          this.launch === launch
        ) {
          this.clearLaunchTimeout();
          this.publishLaunchState(launch, `connected`);
        }
      },
      (error: unknown) => {
        if (generation === this.sessionGeneration)
          this.resetSession(launch == null ? `idle` : `failed`, errorMessage(error));
        this.logger().error(`Failed to start realtime in the avatar overlay`, {
          safe: {},
          sensitive: { error },
        });
      },
    );
    this.startInFlight = startPromise;
    startPromise.finally(() => {
      if (this.startInFlight === startPromise) this.startInFlight = null;
    });
  }

  /** 通知预约状态（原 notifySessionReservationChanges）。 */
  private notifySessionReservationChanges(): void {
    let reserved = this.isSessionReserved();
    for (let listener of this.sessionReservationListeners) listener(reserved);
  }

  /** 等 overlay 呈现（原 waitForPresentation，15,226-15,230）。 */
  private waitForPresentation(): Promise<void> {
    if (this.options.isOpen()) return Promise.resolve();
    this.pendingPresentation ??= createDeferred();
    return this.pendingPresentation.promise;
  }

  /** 发布 launch 状态（原 publishLaunchState，15,231-15,233）。 */
  private publishLaunchState(launch: RealtimeLaunch, phase: string, error?: string): void {
    this.options.publishLaunchState(launch.origin, phase, launch.launchId, error);
  }

  /** 清理 starter（原 clearStarter，15,234-15,239）：dispose 两个 RPC 句柄。 */
  private clearStarter(rendererId?: number): void {
    let starter = this.starter;
    if (starter == null || (rendererId != null && starter.rendererId !== rendererId)) return;
    this.starter = null;
    (starter.start as StarterRpcHandle)[Symbol.dispose]();
    (starter.cancelStart as unknown as StarterRpcHandle)[Symbol.dispose]();
  }

  /** 设置启动超时（原 setLaunchTimeout，15,240-15,257）。 */
  private setLaunchTimeout(generation: number, timeoutMs: number): void {
    this.clearLaunchTimeout();
    this.launchTimeout = setTimeout(() => {
      if (generation !== this.sessionGeneration) return;
      let cancel = this.starter?.cancelStart;
      let error = Error(`Voice chat took too long to start`);
      this.logger().error(error.message, {
        safe: { timeoutMs, cancellationOrigin: `host_timeout` },
        sensitive: { error },
      });
      this.resetSession(`failed`, error.message);
      cancel?.(`startup_timeout`).catch((cancelError: unknown) => {
        this.logger().error(`Failed to cancel timed out realtime startup`, {
          safe: {},
          sensitive: { error: cancelError },
        });
      });
    }, timeoutMs);
  }

  /** 清除启动超时（原 clearLaunchTimeout）。 */
  private clearLaunchTimeout(): void {
    if (this.launchTimeout != null) {
      clearTimeout(this.launchTimeout);
      this.launchTimeout = null;
    }
  }
}
