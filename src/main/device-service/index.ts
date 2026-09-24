// CodexMicroService —— Codex Micro / Creator Micro V2 设备服务。
//
// 职责（主进程侧，单实例）：
//   - HID 拓扑监听 + 周期扫描发现设备（原生插件优先，30s 轮询兜底；
//     拓扑变化后 250ms/1s/3s 阶梯「沉降重试」）；
//   - 与首选设备建立连接（USB 优先），处理 USB ↔ 蓝牙传输切换
//     （transport-handoff）与断连/超时后的阶梯重连；
//   - 灯效写入（键盘/环境灯 + 6 线程槽位），含去重、输入静默合并写、
//     选中高亮 4s 窗口、语音状态灯、无操作自动熄灭与活动恢复；
//   - 电池状态轮询（60s，RPC 失败按错误码决定重连或恢复）；
//   - HID 按键/摇杆事件转发给主窗口。
//
// 并发模型：所有连接状态变更经由 connectionAttemptId 单调递增的「尝试代」
// 校验（isCurrentConnectionAttempt），灯效写入串行排队
// （enqueueLightingWrite），设备 RPC 带 abort/超时竞速（runDeviceRpc）与
// 超时重试（retryDeviceRpc，Timeout 错误重试一次）。

import { createTaggedLogger } from "@chunk/logger";
import { findDevices, modelForDevice, transportForDevice } from "./discovery";
import {
  ConnectionEventType,
  RPCApiOAI,
  WLDeviceCommImpl,
  WLDeviceError,
  WLDeviceErrorCode,
} from "./device-kit";
import { watchHidTopology } from "./native-binding";
import {
  EMPTY_LIGHTING_MODEL,
  LIGHTING_OFF,
  lightingConfigForModel,
  threadLightingForSlots,
} from "./lighting";
import type {
  ClearTimer,
  CodexMicroDeviceState,
  CodexMicroServiceOptions,
  DeviceApi,
  DeviceComm,
  DeviceErrorSource,
  DeviceHidKeyEvent,
  DeviceKitLogger,
  DeviceRpcResult,
  DeviceStateCause,
  DiscoveredDevice,
  ForwardedHidEvent,
  HidTopologyWatcher,
  JoystickEvent,
  LightingModel,
  ScheduleTimer,
} from "./types";

const logger = createTaggedLogger("CodexMicroService");

// ---------------------------------------------------------------------------
// 常量（时间单位均为毫秒）
// ---------------------------------------------------------------------------

/** 连接失败后的重连延迟阶梯（transport 重连 / 灯效恢复共用）。 */
const RECONNECT_DELAY_STEPS_MS = [1_000, 2_000, 5_000, 10_000];
/** HID 拓扑变化后的沉降重试延迟阶梯（等设备在新拓扑下稳定）。 */
const TOPOLOGY_SETTLE_DELAY_STEPS_MS = [250, 1_000, 3_000];
/** 原生拓扑监听不可用时的轮询扫描间隔。 */
const TOPOLOGY_FALLBACK_SCAN_INTERVAL_MS = 30_000;
/** 电池状态轮询间隔。 */
const BATTERY_REFRESH_INTERVAL_MS = 60_000;
/** 单个设备 RPC 的超时时间。 */
const DEVICE_RPC_TIMEOUT_MS = 15_000;
/** stop() 时等待在途设备 RPC 收敛的最长时间。 */
const PENDING_RPC_DRAIN_TIMEOUT_MS = 10_000;
/** 初始灯效 RPC 期间标记控制面不可用前的等待（见 retryDeviceRpc）。 */
const INITIAL_LIGHTING_UNAVAILABLE_DELAY_MS = 50;
/** 选中高亮窗口（新选中线程时键盘跟随环境灯颜色）持续时间。 */
const SELECTION_LIGHTING_DURATION_MS = 4_000;
/** HID/摇杆输入静默窗口：输入停止后合并写入挂起的灯效/电池刷新。 */
const INPUT_QUIET_DELAY_MS = 100;
/** 摇杆死区（distance ≤ 0.05 不转发）。 */
const JOYSTICK_DEAD_ZONE = 0.05;
/** 摇杆触发「灯效活动」（阻止无操作熄灭）的最小距离。 */
const JOYSTICK_LIGHTING_ACTIVITY_THRESHOLD = 0.1;
/** AG0..AG5 物理键 → 线程槽位号的正则。 */
const AGENT_KEY_SLOT_PATTERN = /^AG0([0-5])$/;

// ---------------------------------------------------------------------------
// 错误分类
// ---------------------------------------------------------------------------

/**
 * 设备 RPC 超时错误（内部信号）：与 WLDeviceError 同源、code 固定为 Timeout，
 * retryDeviceRpc 用 instanceof 识别「两次连续超时」以判定传输失效。
 */
class DeviceRpcTimeoutError extends WLDeviceError {
  constructor() {
    super(WLDeviceErrorCode.Timeout, "Request timed out");
  }
}

/** 传输已不可用（设备断开或 HID 句柄失效）→ 需要断开重连。 */
function isTransportUnavailableError(error: unknown): boolean {
  return (
    error instanceof WLDeviceError &&
    (error.code === WLDeviceErrorCode.DeviceDisconnected ||
      error.code === WLDeviceErrorCode.HidUnavailable)
  );
}

/** 错误是否需要立即断开当前连接（WriteFailed / HidUnavailable / DeviceDisconnected）。 */
function isConnectionFatalError(error: unknown): boolean {
  if (!(error instanceof WLDeviceError)) return false;
  switch (error.code) {
    case WLDeviceErrorCode.WriteFailed:
    case WLDeviceErrorCode.HidUnavailable:
    case WLDeviceErrorCode.DeviceDisconnected:
      return true;
    case WLDeviceErrorCode.Timeout:
    case WLDeviceErrorCode.AlreadyConnected:
    case WLDeviceErrorCode.RpcError:
    case WLDeviceErrorCode.InvalidResponse:
    case WLDeviceErrorCode.Aborted:
    case WLDeviceErrorCode.Unknown:
      return false;
  }
}

/** Work Louder SDK 要求注入的结构化日志（转发到本 chunk 的 logger）。 */
function createDeviceKitLogger(): DeviceKitLogger {
  return {
    debug: (...args: unknown[]) => {
      logger.debug("Work Louder debug", { safe: {}, sensitive: { args } });
    },
    error: (...args: unknown[]) => {
      logger.error("Work Louder error", { safe: {}, sensitive: { args } });
    },
    info: (...args: unknown[]) => {
      logger.info("Work Louder info", { safe: {}, sensitive: { args } });
    },
    warn: (...args: unknown[]) => {
      logger.warning("Work Louder warning", { safe: {}, sensitive: { args } });
    },
  };
}

/** 全字段的「未检测到」状态（各处复用）。 */
function notDetectedState(): CodexMicroDeviceState {
  return { status: "not-detected", transport: null, model: null, error: null, battery: null };
}

/**
 * Codex Micro 设备服务。见文件头注释。
 *
 * 生命周期：start() → connected/detected/not-detected 之间流转 → stop()。
 * stop() 会等待在途 RPC（≤10s）、把设备灯效复位为全灭、断开连接。
 */
class CodexMicroService {
  private readonly options: CodexMicroServiceOptions;
  private readonly findDevices: () => Promise<DiscoveredDevice[]>;
  private readonly watchHidTopology: (onChanged: () => void) => HidTopologyWatcher;
  private readonly createComm: () => DeviceComm;
  private readonly createApi: (comm: DeviceComm) => DeviceApi;
  private readonly schedule: ScheduleTimer;
  private readonly clearScheduled: ClearTimer;

  // 当前活跃连接
  private comm: DeviceComm | null = null;
  private api: DeviceApi | null = null;
  private unsubscribeConnectionEvent: (() => void) | null = null;
  private unsubscribeHid: (() => void) | null = null;
  private unsubscribeJoystick: (() => void) | null = null;

  // 定时器
  private hidTopologyWatcher: HidTopologyWatcher | null = null;
  private reconnectTimer: unknown = null;
  private topologySettleTimer: unknown = null;
  private topologyFallbackTimer: unknown = null;
  private batteryRefreshTimer: unknown = null;
  private lightingRecoveryTimer: unknown = null;
  private selectionLightingTimer: unknown = null;
  private inputQuietTimer: unknown = null;
  private inactivityLightingTimer: unknown = null;

  // 连接编排
  private connectPromise: Promise<void> | null = null;
  private connectionCleanupPromise: Promise<void> | null = null;
  private topologyReconciliationPromise: Promise<void> | null = null;
  private connectionAbortController: AbortController | null = null;
  /** 在途 RPC 归零时回调（stop() 等待收敛用）。 */
  private resolvePendingDeviceRpcs: (() => void) | null = null;

  // 灯效状态
  /** 灯效写入串行队列（每次写入接在队列尾部）。 */
  private lightingWritePromise: Promise<unknown> = Promise.resolve();
  /** 无操作熄灭后的恢复写入（避免并发重复恢复）。 */
  private lightingRestorePromise: Promise<boolean> | null = null;

  // 重试/活动计数
  private connectionAttemptId = 0;
  private topologyReconciliationPending = false;
  private topologySettleRetryIndex = 0;
  private transportReconnectAttempt = 0;
  private lightingRecoveryAttempt = 0;
  /** 在途设备 RPC 数量（stop() 等待收敛的依据）。 */
  private pendingDeviceRpcCount = 0;
  /** 灯效活动代（每次输入活动 +1，使旧的活动回调失效）。 */
  private lightingActivityId = 0;
  private joystickInDeadZone = false;
  /** 连接建立后初始灯效是否仍在写入中。 */
  private initialLightingPending = false;

  // 选中槽位/无操作熄灭
  private lifecycleState: "initial" | "started" | "stopped" = "initial";
  private selectedSlotId: number | null = null;
  private selectionLightingVisible = false;
  private lightingOffForInactivity = false;

  // 灯效模型快照
  /** 最新收到的灯效模型（含挂起未写入的）。 */
  private lastLightingModel: LightingModel = EMPTY_LIGHTING_MODEL;
  /** 已成功写入设备的灯效模型。 */
  private displayedLightingModel: LightingModel = EMPTY_LIGHTING_MODEL;
  /** 已写入的 OAILightingConfig 的 JSON key（去重写入用）。 */
  private appliedLightingConfigKey: string | null = null;
  /** 已写入的 ThreadLighting 的 JSON key（去重写入用）。 */
  private appliedThreadLightingKey: string | null = null;
  /** 输入静默期间挂起的灯效模型。 */
  private deferredLightingModel: LightingModel | null = null;
  private batteryRefreshPending = false;
  private connectedDevicePortPath: string | null = null;

  // 对外状态
  private deviceStateCause: DeviceStateCause = "device-lifecycle";
  private deviceState: CodexMicroDeviceState = notDetectedState();

  constructor(options: CodexMicroServiceOptions) {
    this.options = options;
    const deviceKitLogger = createDeviceKitLogger();
    this.findDevices = options.findDevices ?? findDevices;
    this.watchHidTopology = options.watchHidTopology ?? watchHidTopology;
    this.createComm = options.createComm ?? (() => new WLDeviceCommImpl(deviceKitLogger));
    this.createApi = options.createApi ?? ((comm) => new RPCApiOAI(comm, deviceKitLogger));
    this.schedule = options.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs));
    this.clearScheduled = options.clearScheduled ?? (handle => clearTimeout(handle as ReturnType<typeof setTimeout>));
  }

  /** 当前设备状态（主进程缓存并转发给渲染进程）。 */
  getState(): CodexMicroDeviceState {
    return this.deviceState;
  }

  /** 启动服务：安装 HID 拓扑监听并触发首次连接（重复调用无副作用）。 */
  start(): void {
    if (this.lifecycleState === "started") return;
    this.lifecycleState = "started";
    this.resolvePendingDeviceRpcs?.();
    this.transportReconnectAttempt = 0;
    try {
      this.hidTopologyWatcher = this.watchHidTopology(() => {
        this.handleHidTopologyChanged();
      });
    } catch (error) {
      logger.warning("Failed to watch HID topology", { safe: {}, sensitive: { error } });
      this.scheduleTopologyFallbackScan();
    }
    void this.ensureConnected();
  }

  /**
   * 应用一版灯效模型（渲染进程调用）。返回是否成功写入设备。
   * 未连接/控制面不可用返回 false；输入静默期间会挂起合并写入并返回 true。
   */
  async updateLighting(model: LightingModel): Promise<boolean> {
    this.lastLightingModel = model;
    if (this.lifecycleState === "stopped") return false;

    if (!model.preserveSelectionLighting) {
      // 选中槽位变化时重置 4s 选中高亮窗口（弹出导航打开时由
      // preserveSelectionLighting 保持现状不动）。
      const selectedSlotId = model.slots.find((slot) => slot.selected && slot.status !== "off")?.id ?? null;
      if (selectedSlotId !== this.selectedSlotId) {
        this.selectedSlotId = selectedSlotId;
        this.clearSelectionLightingTimer();
        this.selectionLightingVisible = selectedSlotId != null;
        if (
          !this.initialLightingPending &&
          this.deviceState.controlPlaneStatus !== "unavailable"
        ) {
          this.scheduleSelectionLightingTimer();
        }
      }
    }

    if (this.deviceState.controlPlaneStatus === "unavailable") return false;

    const wasLightingOffForInactivity = this.lightingOffForInactivity;
    const activityId = this.resetInactivityLighting();

    // 未启动则先启动（幂等），随后等待在途的连接尝试结束再写入。
    if (this.lifecycleState !== "started") this.start();
    await this.connectPromise;
    if (
      this.api == null ||
      this.getState().controlPlaneStatus === "unavailable" ||
      !(await this.applyLighting(model))
    ) {
      return false;
    }

    // 输入已静默且电池刷新被挂起时顺带补一次（弹出导航关闭后的补偿路径）。
    const shouldFlushBatteryRefresh =
      !model.suspendDeviceStatusRefresh &&
      this.inputQuietTimer == null &&
      this.batteryRefreshPending;
    this.finishLightingUpdate(activityId, wasLightingOffForInactivity, true);
    if (shouldFlushBatteryRefresh) {
      this.batteryRefreshPending = false;
      void this.refreshBatteryStatus();
    }
    return true;
  }

  /** 停止服务：复位设备灯效、断开连接、清理全部定时器与状态。 */
  async stop(): Promise<void> {
    this.lifecycleState = "stopped";
    const attemptIdAtStop = this.connectionAttemptId;
    const cleanupPromiseAtStop = this.connectionCleanupPromise;

    this.topologyReconciliationPending = false;
    this.hidTopologyWatcher?.dispose();
    this.hidTopologyWatcher = null;
    if (this.reconnectTimer != null) {
      this.clearScheduled(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearTopologySettleRetry();
    this.transportReconnectAttempt = 0;
    if (this.topologyFallbackTimer != null) {
      this.clearScheduled(this.topologyFallbackTimer);
      this.topologyFallbackTimer = null;
    }

    const api = this.api;
    const comm = this.comm;

    // 控制面可用且有在途 RPC 时，等待收敛（≤10s）避免半途断开。
    if (
      this.deviceState.controlPlaneStatus !== "unavailable" &&
      this.pendingDeviceRpcCount !== 0
    ) {
      const drained = Promise.withResolvers<void>();
      const resolveDrained = () => {
        drained.resolve();
      };
      this.resolvePendingDeviceRpcs = resolveDrained;
      const drainTimeout = this.schedule(resolveDrained, PENDING_RPC_DRAIN_TIMEOUT_MS);
      try {
        await drained.promise;
      } finally {
        this.clearScheduled(drainTimeout);
        if (this.resolvePendingDeviceRpcs === resolveDrained) {
          this.resolvePendingDeviceRpcs = null;
        }
      }
    }

    // 等待期间被重新 start()（或发生了新的连接尝试）则中止停止流程。
    if (this.lifecycleState !== "stopped" || this.connectionAttemptId !== attemptIdAtStop) return;
    this.connectionAttemptId += 1;
    const stoppedAttemptId = this.connectionAttemptId;
    this.clearConnectionSubscriptions();
    const canSendLightsOff =
      this.deviceState.controlPlaneStatus !== "unavailable" && this.pendingDeviceRpcCount === 0;

    this.connectionAbortController?.abort();
    this.connectionAbortController = null;
    this.pendingDeviceRpcCount = 0;
    this.initialLightingPending = false;
    this.lightingWritePromise = Promise.resolve();
    this.comm = null;
    this.api = null;
    this.connectedDevicePortPath = null;
    if (this.batteryRefreshTimer != null) {
      this.clearScheduled(this.batteryRefreshTimer);
      this.batteryRefreshTimer = null;
    }
    this.clearLightingRecovery();
    this.clearSelectionLightingTimer();
    this.clearInputQuietState();
    this.resetInactivityLighting();
    this.selectedSlotId = null;
    this.selectionLightingVisible = false;
    this.lightingOffForInactivity = false;
    this.lightingRestorePromise = null;

    // 设备灯效复位为全灭（尽力而为，allSettled 不抛错）。
    await this.enqueueLightingWrite(async () => {
      if (api != null && canSendLightsOff) {
        await Promise.allSettled([
          api.sendLightingConfig(LIGHTING_OFF),
          api.sendThreadsLighting(threadLightingForSlots(EMPTY_LIGHTING_MODEL.slots, 0)),
        ]);
      }
    });
    await comm?.disconnect();
    await cleanupPromiseAtStop;
    this.appliedLightingConfigKey = null;
    this.appliedThreadLightingKey = null;

    if (this.lifecycleState !== "stopped" || this.connectionAttemptId !== stoppedAttemptId) {
      // 停止流程被新的连接尝试打断：恢复连接（服务已重新 start）。
      if (this.isCurrentConnectionAttempt(stoppedAttemptId) && this.api == null) {
        void this.ensureConnected();
      }
      return;
    }

    this.displayedLightingModel = EMPTY_LIGHTING_MODEL;
    this.setDeviceState(notDetectedState(), "service-stop");
  }

  /** stop() 的别名（Manager 侧统一调用 dispose）。 */
  dispose(): Promise<void> {
    return this.stop();
  }

  /** 确保已连接（有在途清理/连接时先等待再递归重入）。 */
  private async ensureConnected(cause: DeviceStateCause = "device-lifecycle"): Promise<void> {
    if (this.lifecycleState !== "started") return;
    const cleanupPromise = this.connectionCleanupPromise;
    if (cleanupPromise != null) {
      await cleanupPromise;
      await this.ensureConnected(cause);
      return;
    }
    if (this.api != null || this.reconnectTimer != null) return;
    if (this.connectPromise != null) {
      await this.connectPromise;
      await this.ensureConnected(cause);
      return;
    }
    const attemptId = this.connectionAttemptId;
    this.connectPromise = this.connect(attemptId, cause).finally(() => {
      this.connectPromise = null;
    });
    await this.connectPromise;
  }

  /**
   * 连接流程：发现设备 → 按优先级逐个尝试 comm.connect + 初始灯效写入。
   * 全部失败时按错误类型上报 transport-unavailable / connection-failed
   * 并安排阶梯重连。
   */
  private async connect(attemptId: number, cause: DeviceStateCause): Promise<void> {
    // 上次失败若为 transport-unavailable，发现失败时保留该错误展示。
    const previousError =
      this.deviceState.status === "error" && this.deviceState.error === "transport-unavailable"
        ? this.deviceState.error
        : null;

    let devices: DiscoveredDevice[];
    try {
      devices = await this.findDevices();
    } catch (error) {
      if (!this.isCurrentConnectionAttempt(attemptId)) return;
      logger.warning("Codex Micro discovery failed", { safe: {}, sensitive: { error } });
      this.setDeviceState({
        status: "error",
        transport: previousError == null ? null : this.deviceState.transport,
        model: previousError == null ? null : this.deviceState.model,
        error: previousError ?? "discovery-failed",
        battery: null,
      });
      this.scheduleTopologySettleRetry();
      return;
    }

    if (!this.isCurrentConnectionAttempt(attemptId)) return;

    const [firstDevice] = devices;
    if (firstDevice == null) {
      // 未发现设备：设备可能只是短暂离线（蓝牙休眠），不重连，等拓扑事件/沉降扫描。
      this.transportReconnectAttempt = 0;
      this.setDeviceState(notDetectedState());
      return;
    }

    let fallbackTransport = transportForDevice(firstDevice);
    let fallbackModel = modelForDevice(firstDevice);
    let sawTransportUnavailable = previousError != null;

    this.clearTopologySettleRetry();
    if (previousError == null) {
      this.setDeviceState(
        { status: "detected", transport: fallbackTransport, model: fallbackModel, error: null, battery: null },
        cause,
      );
    }

    for (const device of devices) {
      const deviceTransport = transportForDevice(device);
      const deviceModel = modelForDevice(device);
      fallbackTransport = deviceTransport;
      fallbackModel = deviceModel;

      const comm = this.createComm();
      let candidateFailed = false;
      let candidateActive = false;
      let candidateError: Error | undefined;
      let unsubscribeConnectionEvent: () => void;

      unsubscribeConnectionEvent = comm.onConnectionEvent((event) => {
        if (!this.isCurrentConnectionAttempt(attemptId)) return;
        const isCurrentComm = this.comm === comm;
        switch (event.type) {
          case ConnectionEventType.CONNECTED:
            break;
          case ConnectionEventType.DISCONNECTED:
          case ConnectionEventType.ERROR: {
            const eventError =
              event.type === ConnectionEventType.ERROR && (event as { error?: unknown }).error instanceof Error
                ? ((event as { error: Error }).error)
                : undefined;
            if (isCurrentComm && candidateActive && !this.initialLightingPending) {
              // 已激活的连接断开：作废当前连接（断开 + 阶梯重连）。
              void this.invalidateActiveConnection(
                comm,
                event.type === ConnectionEventType.DISCONNECTED ? "sdk-disconnected" : "sdk-error",
                eventError,
              );
            } else {
              // 连接建立前/初始灯效期间失败：中止本次 RPC，走本地失败路径。
              candidateFailed = true;
              candidateError = eventError;
              if (isCurrentComm) this.connectionAbortController?.abort();
            }
            break;
          }
        }
      });

      try {
        await comm.connect(device);
        if (candidateFailed) throw candidateError ?? Error("Codex Micro connection failed");
        if (!this.isCurrentConnectionAttempt(attemptId)) {
          this.clearConnectionCandidateRuntime(comm, unsubscribeConnectionEvent);
          await this.disconnectConnectionCandidate(comm);
          return;
        }

        const api = this.createApi(comm);
        this.comm = comm;
        this.api = api;
        this.connectionAbortController = new AbortController();
        this.pendingDeviceRpcCount = 0;
        this.initialLightingPending = true;
        this.joystickInDeadZone = false;
        this.unsubscribeConnectionEvent = unsubscribeConnectionEvent;
        this.connectedDevicePortPath = device.portPath;
        this.appliedLightingConfigKey = null;
        this.appliedThreadLightingKey = null;
        // 无操作熄灭从「连接建立」起算（首次灯效写入前先视为已熄灭）。
        this.lightingOffForInactivity = true;
        this.unsubscribeHid = api.onHidReceived((event) => {
          this.handleHidEvent(event);
        });
        this.unsubscribeJoystick = api.onJoystickMove((event) => {
          this.handleJoystickEvent(event);
        });
        candidateActive = true;
        this.setDeviceState(
          { status: "connected", transport: deviceTransport, model: deviceModel, error: null, battery: null },
          cause,
        );

        const activityId = this.lightingActivityId;
        const lightingApplied = await this.applyLatestLighting(api, comm);
        if (candidateFailed) throw candidateError ?? Error("Codex Micro connection failed");
        if (!this.isCurrentConnectionAttempt(attemptId) || this.comm !== comm || this.api !== api) {
          return;
        }
        if (!lightingApplied) {
          // 初始灯效写入失败：标记控制面不可用，安排传输重连（会走
          // retryInitialLighting 尝试恢复）。
          this.markInitialLightingUnavailable(api, comm);
          this.initialLightingPending = false;
          this.scheduleTransportReconnect();
          return;
        }

        this.initialLightingPending = false;
        this.scheduleSelectionLightingTimer();
        this.finishLightingUpdate(activityId, true, lightingApplied);
        this.setDeviceState(
          { status: "connected", transport: deviceTransport, model: deviceModel, error: null, battery: null },
          cause,
        );
        await this.refreshBatteryStatus();
        if (this.comm === comm && this.api === api) this.transportReconnectAttempt = 0;
        return;
      } catch (error) {
        if (!this.isCurrentConnectionAttempt(attemptId)) {
          this.clearConnectionCandidateRuntime(comm, unsubscribeConnectionEvent);
          await this.disconnectConnectionCandidate(comm);
          return;
        }
        logger.warning("Codex Micro connection failed", { safe: {}, sensitive: { error } });
        if (isTransportUnavailableError(error)) sawTransportUnavailable = true;
        this.clearConnectionCandidateRuntime(comm, unsubscribeConnectionEvent);
        // 已上报 connected 又失败时降级回 detected（设备还在）。
        if (this.deviceState.status === "connected") {
          this.setDeviceState(
            { status: "detected", transport: deviceTransport, model: deviceModel, error: null, battery: null },
            cause,
          );
        }
        await this.disconnectConnectionCandidate(comm);
      }
    }

    this.setDeviceState({
      status: "error",
      transport: fallbackTransport,
      model: fallbackModel,
      error: sawTransportUnavailable ? "transport-unavailable" : "connection-failed",
      battery: null,
    });
    this.scheduleTransportReconnect();
  }

  // -------------------------------------------------------------------------
  // HID 拓扑协调
  // -------------------------------------------------------------------------

  /** 请求一次拓扑协调（串行去重：已在跑则只置 pending 标志）。 */
  private requestTopologyReconciliation(): void {
    if (this.lifecycleState !== "started") return;
    this.topologyReconciliationPending = true;
    if (this.topologyReconciliationPromise != null) return;
    const reconciliation = this.reconcilePendingTopologyChanges().catch((error) => {
      logger.warning("Failed to reconcile HID topology", { safe: {}, sensitive: { error } });
    });
    this.topologyReconciliationPromise = reconciliation;
    void reconciliation.finally(() => {
      this.topologyReconciliationPromise = null;
      if (this.topologyReconciliationPending) this.requestTopologyReconciliation();
    });
  }

  /** 循环消费 pending 标志直到清空（每轮做一次完整拓扑协调）。 */
  private async reconcilePendingTopologyChanges(): Promise<void> {
    for (; this.lifecycleState === "started" && this.topologyReconciliationPending; ) {
      this.topologyReconciliationPending = false;
      await this.reconcileTopology();
    }
  }

  /**
   * 一次拓扑协调：重新枚举设备，若当前连接的端口已不可用（或已无任何
   * USB 连接）则断开重连（可能是 USB ↔ 蓝牙切换，transport-handoff）。
   */
  private async reconcileTopology(): Promise<void> {
    const cleanupPromise = this.connectionCleanupPromise;
    if (cleanupPromise != null) {
      await cleanupPromise;
      if (this.lifecycleState !== "started") return;
    }
    if (this.api == null) {
      // 未连接：清掉待重连定时器，立即尝试连接。
      if (this.reconnectTimer != null) {
        this.clearScheduled(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      await this.ensureConnected();
      return;
    }

    const attemptId = this.connectionAttemptId;
    const devices = await this.findDevices();
    if (
      !this.isCurrentConnectionAttempt(attemptId) ||
      devices.some(
        ({ isUsbConnection, portPath }) =>
          portPath === this.connectedDevicePortPath &&
          (isUsbConnection || devices.every((device) => !device.isUsbConnection)),
      )
    ) {
      return;
    }

    // 当前端口已失效：作废连接（传输可能切换），重新发现连接。
    this.connectionAttemptId += 1;
    const newAttemptId = this.connectionAttemptId;
    const comm = this.clearConnectedDeviceRuntime();
    await comm?.disconnect();
    if (!this.isCurrentConnectionAttempt(newAttemptId)) return;

    const cause: DeviceStateCause = devices.length === 0 ? "device-lifecycle" : "transport-handoff";
    this.setDeviceState(notDetectedState(), cause);
    await this.ensureConnected(cause);
  }

  /** 拓扑监听回调：重置重试计数、请求协调、安排沉降重试。 */
  private handleHidTopologyChanged(): void {
    this.clearTopologySettleRetry();
    this.transportReconnectAttempt = 0;
    this.requestTopologyReconciliation();
    this.scheduleTopologySettleRetry();
  }

  // -------------------------------------------------------------------------
  // 灯效写入
  // -------------------------------------------------------------------------

  /**
   * 写入一版灯效模型（串行排队 + 去重 + 输入静默挂起）。
   * 返回是否成功写完两通道（keys/ambient 与 threads）。
   */
  private applyLighting(model: LightingModel): Promise<boolean> {
    return this.enqueueLightingWrite(async () => {
      const api = this.api;
      if (this.lifecycleState !== "started" || api == null || this.lightingRecoveryTimer != null) {
        return false;
      }
      // 输入静默窗口内：只挂起模型，立即返回 true（静默后统一写入）。
      if (this.deferLightingUntilInputQuiet(model)) return true;

      const lightingConfig = lightingConfigForModel(
        model.slots,
        model.voiceState,
        this.selectionLightingVisible,
        model.brightness,
        model.snakingAmbientStatus,
      );
      const lightingConfigKey = JSON.stringify(lightingConfig);
      if (lightingConfigKey !== this.appliedLightingConfigKey) {
        if (!(await this.writeLightingRpc(api, () => api.sendLightingConfig(lightingConfig)))) {
          return false;
        }
        if (this.api === api) this.appliedLightingConfigKey = lightingConfigKey;
      }

      if (this.lifecycleState !== "started" || this.api !== api) return false;
      if (this.deferLightingUntilInputQuiet(model)) return true;

      const threadLighting = threadLightingForSlots(model.slots, model.brightness);
      const threadLightingKey = JSON.stringify(threadLighting);
      if (threadLightingKey !== this.appliedThreadLightingKey) {
        if (!(await this.writeLightingRpc(api, () => api.sendThreadsLighting(threadLighting)))) {
          return false;
        }
        if (this.api === api) this.appliedThreadLightingKey = threadLightingKey;
      }

      if (this.api === api) {
        this.displayedLightingModel = model;
        this.lightingRecoveryAttempt = 0;
      }
      return true;
    });
  }

  /**
   * 循环应用最新灯效模型直到写入期间没有新模型到达
   * （连接建立后的初始灯效 / 恢复路径）。
   */
  private async applyLatestLighting(api: DeviceApi, comm: DeviceComm): Promise<boolean> {
    for (; this.api === api && this.comm === comm; ) {
      const model = this.lastLightingModel;
      if (!(await this.applyLighting(model))) return false;
      if (this.lastLightingModel === model) return true;
    }
    return false;
  }

  /** HID 输入静默调度 + 灯效活动记录 + 解析槽位号转发事件。 */
  private handleHidEvent(event: DeviceHidKeyEvent): void {
    if (this.lifecycleState !== "started") return;
    this.scheduleInputQuietFlush();
    this.handleLightingActivity();

    const slotMatch = AGENT_KEY_SLOT_PATTERN.exec(event.key);
    const slot = slotMatch == null ? null : Number(slotMatch[1]);
    // 初始灯效未完成/控制面不可用时用 lastLightingModel（含挂起的模型），
    // 否则用已写入设备的 displayedLightingModel。
    const model =
      this.initialLightingPending || this.deviceState.controlPlaneStatus === "unavailable"
        ? this.lastLightingModel
        : this.displayedLightingModel;
    this.options.onHidEvent({
      key: event.key,
      act: event.act ?? null,
      agent: event.agent ?? null,
      slot,
      threadKey: slot == null ? null : (model.slots[slot]?.threadKey ?? null),
    });
  }

  /** 摇杆事件：死区内不转发；超过死区时转发并按距离处理灯效活动。 */
  private handleJoystickEvent(event: JoystickEvent): void {
    if (this.lifecycleState !== "started") return;
    if (event.distance <= JOYSTICK_DEAD_ZONE) {
      if (!this.joystickInDeadZone) {
        this.joystickInDeadZone = true;
        this.options.onJoystickEvent({ angle: 0, distance: 0 });
      }
      return;
    }
    this.joystickInDeadZone = false;
    this.scheduleInputQuietFlush();
    if (event.distance > JOYSTICK_LIGHTING_ACTIVITY_THRESHOLD) this.handleLightingActivity();
    this.options.onJoystickEvent(event);
  }

  /** 执行一次灯效 RPC（失败按场景分流到恢复/作废/标记不可用）。 */
  private async writeLightingRpc(
    api: DeviceApi,
    operation: () => Promise<DeviceRpcResult<void>>,
  ): Promise<boolean> {
    const comm = this.comm;
    if (comm == null || this.api !== api) return false;
    try {
      await this.retryDeviceRpc(api, comm, operation, "lighting-rpc");
      return true;
    } catch (error) {
      // 初始灯效期间的传输不可用错误上抛（connect 里据此走重连）。
      if (this.initialLightingPending && this.api === api && isTransportUnavailableError(error)) {
        throw error;
      }
      await this.handleLightingRpcFailure(api, error instanceof Error ? error : undefined);
    }
    return false;
  }

  /**
   * 执行一次设备 RPC：Timeout 错误重试一次；初始灯效期间安排 50ms 后标记
   * 控制面不可用（若重试成功则取消）；两次连续超时且非初始灯效时作废连接。
   */
  private async retryDeviceRpc<T>(
    api: DeviceApi,
    comm: DeviceComm,
    operation: () => Promise<DeviceRpcResult<T>>,
    source: DeviceErrorSource,
  ): Promise<T> {
    const attemptOnce = async () => {
      const result = await this.runDeviceRpc(operation);
      if (result.ok === false) {
        throw new WLDeviceError(result.error.code, result.error.message, result.error.details);
      }
      return result.value;
    };
    const attemptWithInitialLightingGuard = async () => {
      const markUnavailableTimer = this.initialLightingPending
        ? this.schedule(() => this.markInitialLightingUnavailable(api, comm), INITIAL_LIGHTING_UNAVAILABLE_DELAY_MS)
        : null;
      try {
        return await attemptOnce();
      } finally {
        if (markUnavailableTimer != null) this.clearScheduled(markUnavailableTimer);
      }
    };
    try {
      return await attemptOnce();
    } catch (firstError) {
      if (
        firstError instanceof WLDeviceError &&
        firstError.code === WLDeviceErrorCode.Timeout &&
        this.lifecycleState === "started" &&
        this.api === api &&
        this.comm === comm
      ) {
        try {
          return await attemptWithInitialLightingGuard();
        } catch (secondError) {
          if (
            firstError instanceof DeviceRpcTimeoutError &&
            secondError instanceof DeviceRpcTimeoutError &&
            !this.initialLightingPending &&
            this.api === api &&
            this.comm === comm
          ) {
            await this.invalidateActiveConnection(comm, source, secondError);
          }
          throw secondError;
        }
      }
      throw firstError;
    }
  }

  /**
   * 设备 RPC 执行器：与「连接 abort」和「15s 超时」竞速；统计在途 RPC
   * 数量（归零时通知 resolvePendingDeviceRpcs）。
   */
  private async runDeviceRpc<T>(operation: () => Promise<DeviceRpcResult<T>>): Promise<DeviceRpcResult<T>> {
    const abortController = this.connectionAbortController;
    if (abortController == null || abortController.signal.aborted) {
      throw new WLDeviceError(WLDeviceErrorCode.DeviceDisconnected, "Device disconnected");
    }
    const abortSignal = abortController.signal;
    const timeout = Promise.withResolvers<never>();
    const onAbort = () => {
      timeout.reject(new WLDeviceError(WLDeviceErrorCode.DeviceDisconnected, "Device disconnected"));
    };
    abortSignal.addEventListener("abort", onAbort, { once: true });
    const timeoutTimer = this.schedule(() => {
      timeout.reject(new DeviceRpcTimeoutError());
    }, DEVICE_RPC_TIMEOUT_MS);
    try {
      const rpcPromise = operation();
      this.pendingDeviceRpcCount += 1;
      const onSettled = () => {
        if (this.connectionAbortController === abortController) {
          --this.pendingDeviceRpcCount;
          if (this.pendingDeviceRpcCount === 0) this.resolvePendingDeviceRpcs?.();
        }
      };
      rpcPromise.then(onSettled, onSettled);
      return await Promise.race([rpcPromise, timeout.promise]);
    } finally {
      this.clearScheduled(timeoutTimer);
      abortSignal.removeEventListener("abort", onAbort);
    }
  }

  /** 灯效 RPC 失败分流：传输不可用 → 作废；初始灯效 → 标记不可用；
   *  致命错误 → 作废；其余 → 阶梯延迟恢复。 */
  private async handleLightingRpcFailure(api: DeviceApi, error: Error | undefined): Promise<void> {
    const comm = this.comm;
    if (comm != null && this.api === api && isTransportUnavailableError(error)) {
      await this.invalidateActiveConnection(comm, "lighting-rpc", error);
      return;
    }
    if (comm != null && this.initialLightingPending) {
      this.markInitialLightingUnavailable(api, comm);
      return;
    }
    if (
      this.deviceState.status === "connected" &&
      this.deviceState.controlPlaneStatus !== "unavailable" &&
      this.api === api &&
      comm != null
    ) {
      if (isConnectionFatalError(error)) {
        await this.invalidateActiveConnection(comm, "lighting-rpc", error);
        return;
      }
      this.scheduleLightingRecovery(api, comm, error);
    }
  }

  /** 初始灯效写入失败：状态降级为 connected + controlPlaneStatus=unavailable。 */
  private markInitialLightingUnavailable(api: DeviceApi, comm: DeviceComm): void {
    if (
      this.initialLightingPending &&
      this.api === api &&
      this.comm === comm &&
      this.deviceState.status === "connected"
    ) {
      this.setDeviceState({
        status: "connected",
        transport: this.deviceState.transport,
        model: this.deviceState.model,
        error: null,
        battery: null,
        controlPlaneStatus: "unavailable",
      });
    }
  }

  /** 灯效暂时不可用（非致命 RPC 错误）：阶梯延迟后重写最新模型。 */
  private scheduleLightingRecovery(api: DeviceApi, comm: DeviceComm, error: Error | undefined): void {
    if (
      this.lifecycleState !== "started" ||
      this.api !== api ||
      this.comm !== comm ||
      this.lightingRecoveryTimer != null
    ) {
      return;
    }
    // 清空去重 key，恢复时强制全量写入。
    this.appliedLightingConfigKey = null;
    this.appliedThreadLightingKey = null;

    const retryDelayMs = RECONNECT_DELAY_STEPS_MS[
      Math.min(this.lightingRecoveryAttempt, RECONNECT_DELAY_STEPS_MS.length - 1)
    ];
    if (this.lightingRecoveryAttempt === 0) {
      logger.warning("Codex Micro lighting temporarily unavailable", {
        safe: { code: error instanceof WLDeviceError ? error.code : null, retryDelayMs },
        sensitive: { error },
      });
    }
    this.lightingRecoveryAttempt += 1;

    const activityId = this.lightingActivityId;
    this.lightingRecoveryTimer = this.schedule(() => {
      this.lightingRecoveryTimer = null;
      if (this.lifecycleState === "started" && this.api === api && this.comm === comm) {
        // 恢复期间无新活动且已因无操作熄灭：直接保持熄灭。
        if (this.lightingOffForInactivity && this.lightingActivityId === activityId) {
          void this.applyInactivityLightingOff(activityId);
          return;
        }
        void this.updateLighting(this.lastLightingModel);
      }
    }, retryDelayMs);
  }

  // -------------------------------------------------------------------------
  // 连接作废与清理
  // -------------------------------------------------------------------------

  /**
   * 作废当前活跃连接：立即清空运行时状态、断开 comm、安排阶梯重连。
   * 状态置为 error/transport-unavailable。返回断开+重连调度的 promise。
   */
  private invalidateActiveConnection(
    comm: DeviceComm,
    source: DeviceErrorSource,
    error: Error | undefined,
  ): Promise<void> {
    if (this.lifecycleState !== "started" || this.comm !== comm) return Promise.resolve();
    const previousTransport = this.deviceState.transport;
    if (this.deviceState.controlPlaneStatus === "unavailable") {
      // 控制面已不可用说明之前已经失败过一轮，重连计数清零重新开始。
      this.transportReconnectAttempt = 0;
    }
    this.connectionAttemptId += 1;
    const invalidationAttemptId = this.connectionAttemptId;
    this.clearConnectedDeviceRuntime();

    const cleanup = Promise.resolve()
      .then(() => comm.disconnect())
      .catch((error: unknown) => {
        logger.warning("Failed to disconnect Codex Micro", { safe: {}, sensitive: { error } });
      })
      .then(() => {
        if (this.isCurrentConnectionAttempt(invalidationAttemptId)) this.scheduleTransportReconnect();
      })
      .finally(() => {
        if (this.connectionCleanupPromise === cleanup) this.connectionCleanupPromise = null;
      });
    this.connectionCleanupPromise = cleanup;

    this.setDeviceState({
      status: "error",
      transport: previousTransport,
      model: this.deviceState.model,
      error: "transport-unavailable",
      battery: null,
    });
    logger.warning("Codex Micro connection invalidated", {
      safe: {
        code: error instanceof WLDeviceError ? error.code : null,
        reason: "transport-unavailable",
        source,
      },
      sensitive: { error },
    });
    return cleanup;
  }

  /** 清空已连接设备的全部运行时状态（订阅/定时器/模型快照），返回旧 comm。 */
  private clearConnectedDeviceRuntime(): DeviceComm | null {
    this.connectionAbortController?.abort();
    this.connectionAbortController = null;
    this.pendingDeviceRpcCount = 0;
    this.resolvePendingDeviceRpcs?.();
    this.initialLightingPending = false;
    this.lightingWritePromise = Promise.resolve();
    if (this.reconnectTimer != null) {
      this.clearScheduled(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.batteryRefreshTimer != null) {
      this.clearScheduled(this.batteryRefreshTimer);
      this.batteryRefreshTimer = null;
    }
    this.clearLightingRecovery();
    this.clearSelectionLightingTimer();
    this.clearInputQuietState();
    this.resetInactivityLighting();
    this.selectionLightingVisible = false;
    this.lightingOffForInactivity = false;
    this.lightingRestorePromise = null;
    this.clearConnectionSubscriptions();
    const comm = this.comm;
    this.comm = null;
    this.api = null;
    this.connectedDevicePortPath = null;
    this.displayedLightingModel = EMPTY_LIGHTING_MODEL;
    this.appliedLightingConfigKey = null;
    this.appliedThreadLightingKey = null;
    return comm;
  }

  /** 清理连接候选的运行时：已成为当前连接则整体清空，否则只退订连接事件。 */
  private clearConnectionCandidateRuntime(comm: DeviceComm, unsubscribe: () => void): void {
    if (this.comm === comm) {
      this.clearConnectedDeviceRuntime();
    } else {
      unsubscribe();
    }
  }

  /** 断开一个连接候选（connect 循环内的失败/过期候选），失败只记日志。 */
  private async disconnectConnectionCandidate(comm: DeviceComm): Promise<void> {
    try {
      await comm.disconnect();
    } catch (error) {
      logger.warning("Failed to disconnect Codex Micro connection candidate", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  /** 控制面不可用后的传输重连回调：重试初始灯效（而非重新连接）。 */
  private async retryInitialLighting(api: DeviceApi, comm: DeviceComm): Promise<void> {
    if (
      this.lifecycleState !== "started" ||
      this.deviceState.status !== "connected" ||
      this.deviceState.controlPlaneStatus !== "unavailable" ||
      this.api !== api ||
      this.comm !== comm
    ) {
      return;
    }
    const activityId = this.lightingActivityId;
    const lightingApplied = await this.applyLatestLighting(api, comm);
    if (this.lifecycleState === "started" && this.api === api && this.comm === comm) {
      if (!lightingApplied) {
        this.scheduleTransportReconnect();
        return;
      }
      this.scheduleSelectionLightingTimer();
      this.finishLightingUpdate(activityId, true, lightingApplied);
      this.setDeviceState({
        status: "connected",
        transport: this.deviceState.transport,
        model: this.deviceState.model,
        error: null,
        battery: null,
      });
      await this.refreshBatteryStatus();
      if (this.api === api && this.comm === comm) this.transportReconnectAttempt = 0;
    }
  }

  /** 阶梯延迟重连：已有连接则重试初始灯效（恢复控制面），否则重新连接。 */
  private scheduleTransportReconnect(): void {
    if (this.lifecycleState !== "started" || this.reconnectTimer != null) return;
    const delayMs = RECONNECT_DELAY_STEPS_MS[
      Math.min(this.transportReconnectAttempt, RECONNECT_DELAY_STEPS_MS.length - 1)
    ];
    this.transportReconnectAttempt += 1;
    this.reconnectTimer = this.schedule(() => {
      this.reconnectTimer = null;
      const api = this.api;
      const comm = this.comm;
      if (api != null && comm != null) {
        void this.retryInitialLighting(api, comm);
        return;
      }
      void this.ensureConnected();
    }, delayMs);
  }

  // -------------------------------------------------------------------------
  // 定时器辅助
  // -------------------------------------------------------------------------

  /** 拓扑沉降重试：拓扑事件后按阶梯延迟再协调（设备在新拓扑下稳定需要时间）。 */
  private scheduleTopologySettleRetry(): void {
    const delayMs = TOPOLOGY_SETTLE_DELAY_STEPS_MS[this.topologySettleRetryIndex];
    if (
      this.lifecycleState === "started" &&
      this.topologySettleTimer == null &&
      delayMs != null
    ) {
      this.topologySettleRetryIndex += 1;
      this.topologySettleTimer = this.schedule(() => {
        this.topologySettleTimer = null;
        this.requestTopologyReconciliation();
        this.scheduleTopologySettleRetry();
      }, delayMs);
    }
  }

  /** 清除拓扑沉降重试定时器并重置阶梯索引。 */
  private clearTopologySettleRetry(): void {
    if (this.topologySettleTimer != null) {
      this.clearScheduled(this.topologySettleTimer);
      this.topologySettleTimer = null;
    }
    this.topologySettleRetryIndex = 0;
  }

  /** 原生拓扑监听不可用时的 30s 轮询扫描。 */
  private scheduleTopologyFallbackScan(): void {
    if (
      this.lifecycleState === "started" &&
      this.hidTopologyWatcher == null &&
      this.topologyFallbackTimer == null
    ) {
      this.topologyFallbackTimer = this.schedule(() => {
        this.topologyFallbackTimer = null;
        this.requestTopologyReconciliation();
        this.scheduleTopologyFallbackScan();
      }, TOPOLOGY_FALLBACK_SCAN_INTERVAL_MS);
    }
  }

  /** 退订全部设备侧订阅（连接事件/HID/摇杆）。 */
  private clearConnectionSubscriptions(): void {
    this.unsubscribeConnectionEvent?.();
    this.unsubscribeHid?.();
    this.unsubscribeJoystick?.();
    this.unsubscribeConnectionEvent = null;
    this.unsubscribeHid = null;
    this.unsubscribeJoystick = null;
  }

  /** 清除灯效恢复定时器并重置阶梯计数。 */
  private clearLightingRecovery(): void {
    if (this.lightingRecoveryTimer != null) {
      this.clearScheduled(this.lightingRecoveryTimer);
      this.lightingRecoveryTimer = null;
    }
    this.lightingRecoveryAttempt = 0;
  }

  /** 安排选中高亮窗口的 4s 到期（到期后按最新模型关掉键盘跟随色）。 */
  private scheduleSelectionLightingTimer(): void {
    if (this.selectionLightingVisible && this.selectionLightingTimer == null) {
      this.selectionLightingTimer = this.schedule(() => {
        this.selectionLightingTimer = null;
        this.selectionLightingVisible = false;
        if (this.deviceState.controlPlaneStatus !== "unavailable") {
          void this.applyLighting(this.lastLightingModel);
        }
      }, SELECTION_LIGHTING_DURATION_MS);
    }
  }

  /** 清除选中高亮窗口定时器。 */
  private clearSelectionLightingTimer(): void {
    if (this.selectionLightingTimer != null) {
      this.clearScheduled(this.selectionLightingTimer);
      this.selectionLightingTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // 输入静默（写入合并）
  // -------------------------------------------------------------------------

  /** HID/摇杆输入后安排 100ms 静默窗口（期间灯效/电池写入挂起）。 */
  private scheduleInputQuietFlush(): void {
    if (
      this.initialLightingPending ||
      this.deviceState.status !== "connected" ||
      this.deviceState.controlPlaneStatus === "unavailable"
    ) {
      return;
    }
    if (this.inputQuietTimer != null) this.clearScheduled(this.inputQuietTimer);
    this.inputQuietTimer = this.schedule(() => {
      this.inputQuietTimer = null;
      const deferredModel = this.deferredLightingModel;
      this.deferredLightingModel = null;
      const batteryRefreshPending = this.batteryRefreshPending;
      this.batteryRefreshPending = false;
      void this.flushDeferredDeviceWrites(deferredModel, batteryRefreshPending);
    }, INPUT_QUIET_DELAY_MS);
  }

  /** 静默窗口内挂起灯效模型（返回是否已挂起）。 */
  private deferLightingUntilInputQuiet(model: LightingModel): boolean {
    return this.inputQuietTimer != null && ((this.deferredLightingModel = model), true);
  }

  /** 清空输入静默状态（静默定时器、挂起模型、挂起的电池刷新）。 */
  private clearInputQuietState(): void {
    if (this.inputQuietTimer != null) {
      this.clearScheduled(this.inputQuietTimer);
      this.inputQuietTimer = null;
    }
    this.deferredLightingModel = null;
    this.batteryRefreshPending = false;
  }

  /** 静默结束后写入挂起的灯效模型/电池刷新。 */
  private async flushDeferredDeviceWrites(
    model: LightingModel | null,
    batteryRefreshPending: boolean,
  ): Promise<void> {
    if (model != null) await this.applyLighting(model);
    if (batteryRefreshPending) await this.refreshBatteryStatus();
  }

  // -------------------------------------------------------------------------
  // 无操作熄灭
  // -------------------------------------------------------------------------

  /** 重置无操作熄灭状态（活动代 +1），返回新的活动代。 */
  private resetInactivityLighting(): number {
    this.clearInactivityLightingTimer();
    this.lightingActivityId += 1;
    return this.lightingActivityId;
  }

  /** 输入活动：若已熄灭则恢复灯效，否则重新安排熄灭计时。 */
  private handleLightingActivity(): void {
    if (
      this.initialLightingPending ||
      this.deviceState.status !== "connected" ||
      this.deviceState.controlPlaneStatus === "unavailable"
    ) {
      return;
    }
    const activityId = this.resetInactivityLighting();
    if (!this.lightingOffForInactivity) {
      this.scheduleInactivityLightingOff(activityId);
      return;
    }
    // 从熄灭中恢复：复用/创建恢复写入，完成后安排下一轮熄灭计时。
    const restorePromise = this.lightingRestorePromise ?? this.applyLighting(this.lastLightingModel);
    this.lightingRestorePromise = restorePromise;
    const onRestoreSettled = (restored: boolean) => {
      if (this.lightingRestorePromise === restorePromise) this.lightingRestorePromise = null;
      this.finishLightingUpdate(activityId, true, restored);
    };
    restorePromise.then(onRestoreSettled, () => {
      onRestoreSettled(false);
    });
  }

  /** 灯效写入结果回调：失败（或未恢复）时安排熄灭，成功时清熄灭标志。 */
  private finishLightingUpdate(activityId: number, wasLightingOffForInactivity: boolean, restored: boolean): void {
    if (activityId !== this.lightingActivityId) return;
    if (wasLightingOffForInactivity && !restored) {
      this.scheduleInactivityLightingOff(activityId);
      return;
    }
    this.lightingOffForInactivity = false;
    this.scheduleInactivityLightingOff(activityId);
  }

  /** 安排无操作熄灭计时（inactivityTimeoutMs 为 null 时不安排）。 */
  private scheduleInactivityLightingOff(activityId: number): void {
    const inactivityTimeoutMs = this.lastLightingModel.inactivityTimeoutMs;
    if (
      inactivityTimeoutMs != null &&
      this.lifecycleState === "started" &&
      this.api != null &&
      activityId === this.lightingActivityId
    ) {
      this.clearInactivityLightingTimer();
      this.inactivityLightingTimer = this.schedule(() => {
        this.inactivityLightingTimer = null;
        if (activityId !== this.lightingActivityId) return;
        this.lightingOffForInactivity = true;
        const onOffSettled = (applied: boolean) => {
          if (
            activityId === this.lightingActivityId &&
            this.lightingOffForInactivity &&
            !applied
          ) {
            this.scheduleInactivityLightingOff(activityId);
          }
        };
        this.applyInactivityLightingOff(activityId).then(onOffSettled, () => onOffSettled(false));
      }, inactivityTimeoutMs);
    }
  }

  /** 清除无操作熄灭定时器。 */
  private clearInactivityLightingTimer(): void {
    if (this.inactivityLightingTimer != null) {
      this.clearScheduled(this.inactivityLightingTimer);
      this.inactivityLightingTimer = null;
    }
  }

  /** 写入全灭灯效（无操作熄灭；清空去重 key 强制写入）。 */
  private applyInactivityLightingOff(activityId: number): Promise<boolean> {
    return this.enqueueLightingWrite(async () => {
      const api = this.api;
      return this.lifecycleState !== "started" ||
        api == null ||
        activityId !== this.lightingActivityId ||
        !this.lightingOffForInactivity ||
        ((this.appliedLightingConfigKey = null),
        (this.appliedThreadLightingKey = null),
        !(await this.writeLightingRpc(api, () => api.sendLightingConfig(LIGHTING_OFF)))) ||
        this.lifecycleState !== "started" ||
        this.api !== api ||
        activityId !== this.lightingActivityId ||
        !this.lightingOffForInactivity
        ? false
        : this.writeLightingRpc(api, () =>
            api.sendThreadsLighting(threadLightingForSlots(EMPTY_LIGHTING_MODEL.slots, 0)),
          );
    });
  }

  /** 把一次灯效写入接在串行队列尾部（前序失败不影响后续）。 */
  private enqueueLightingWrite<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.lightingWritePromise.then(operation, operation);
    this.lightingWritePromise = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  // -------------------------------------------------------------------------
  // 电池状态
  // -------------------------------------------------------------------------

  /** 查询并上报电池状态；输入静默/挂起刷新时置 pending 标志延后处理。 */
  private async refreshBatteryStatus(): Promise<void> {
    const api = this.api;
    const comm = this.comm;
    if (
      this.lifecycleState !== "started" ||
      this.deviceState.controlPlaneStatus === "unavailable" ||
      api == null ||
      comm == null
    ) {
      return;
    }
    if (this.inputQuietTimer != null || this.lastLightingModel.suspendDeviceStatusRefresh) {
      this.batteryRefreshPending = true;
      return;
    }
    try {
      const status = await this.retryDeviceRpc(api, comm, () => api.getDeviceStatus(), "battery-rpc");
      if (this.api !== api || this.comm !== comm) return;
      this.setDeviceState({
        status: "connected",
        transport: this.deviceState.transport,
        model: this.deviceState.model,
        error: null,
        battery:
          status.batteryPercentage == null
            ? null
            : { percentage: status.batteryPercentage, isCharging: status.isCharging ?? null },
      });
    } catch (error) {
      if (isConnectionFatalError(error)) {
        await this.invalidateActiveConnection(
          comm,
          "battery-rpc",
          error instanceof Error ? error : undefined,
        );
        return;
      }
      if (this.api !== api || this.comm !== comm) return;
      // 电池读不到不算连接故障：清空电池字段，保持 connected。
      this.setDeviceState({
        status: "connected",
        transport: this.deviceState.transport,
        model: this.deviceState.model,
        error: null,
        battery: null,
      });
    }
    if (
      this.lifecycleState === "started" &&
      this.api === api &&
      this.comm === comm &&
      this.batteryRefreshTimer == null
    ) {
      this.batteryRefreshTimer = this.schedule(() => {
        this.batteryRefreshTimer = null;
        void this.refreshBatteryStatus();
      }, BATTERY_REFRESH_INTERVAL_MS);
    }
  }

  // -------------------------------------------------------------------------
  // 状态上报
  // -------------------------------------------------------------------------

  /** 状态变化时才回调 onDeviceStateChanged（携带变化原因 cause）。 */
  private setDeviceState(nextState: CodexMicroDeviceState, cause: DeviceStateCause = "device-lifecycle"): void {
    if (
      this.deviceStateCause !== cause ||
      this.deviceState.status !== nextState.status ||
      this.deviceState.transport !== nextState.transport ||
      this.deviceState.model !== nextState.model ||
      this.deviceState.error !== nextState.error ||
      this.deviceState.controlPlaneStatus !== nextState.controlPlaneStatus ||
      this.deviceState.battery?.percentage !== nextState.battery?.percentage ||
      this.deviceState.battery?.isCharging !== nextState.battery?.isCharging
    ) {
      this.deviceStateCause = cause;
      this.deviceState = nextState;
      this.options.onDeviceStateChanged(nextState, cause);
    }
  }

  /** 连接尝试代校验：服务已停止或已换代则当前尝试全部作废。 */
  private isCurrentConnectionAttempt(attemptId: number): boolean {
    return this.lifecycleState === "started" && this.connectionAttemptId === attemptId;
  }
}

export { CodexMicroService };
