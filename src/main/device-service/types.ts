// device-service chunk 的公共类型声明。
//
// 本 chunk 封装 @worklouder/device-kit-oai（Work Louder 设备套件，HID 传输 +
// JSON-RPC 灯效控制），管理 Codex Micro / Creator Micro V2 设备的发现、连接、
// 灯效与电池轮询。device-kit 自带类型（dist/*.d.ts），但本 chunk 以
// createRequire(__filename) 动态加载它，因此这里按实际用到的面手写最小类型，
// 字段语义以 device-kit 的 d.ts 为准（HIDKey.act/agent 是 number）。

/** device-kit 的原生枚举在本 chunk 里只用值，不做类型导入（动态 require）。 */
export type DeviceKitModule = {
  ConnectionEventType: { CONNECTED: number; DISCONNECTED: number; ERROR: number };
  ConnectionType: { hid: number; serial: number };
  DeviceType: { CodexMicro: string; CreatorMicroV2: string };
  DeviceLayoutType: { universal: string };
  OAILightingEffect: { off: number; solid: number; snake: number; breath: number };
  WLDeviceError: new (code: string, message?: string, details?: unknown) => WLDeviceError;
  WLDeviceErrorCode: Record<
    | "AlreadyConnected"
    | "Timeout"
    | "WriteFailed"
    | "HidUnavailable"
    | "DeviceDisconnected"
    | "RpcError"
    | "InvalidResponse"
    | "Aborted"
    | "Unknown",
    string
  >;
  WLDeviceCommImpl: new (logger?: DeviceKitLogger) => DeviceComm;
  RPCApiOAI: new (comm: DeviceComm, logger?: DeviceKitLogger) => DeviceApi;
};

/** device-kit 要求注入的结构化日志（debug/error/info/warn 任意参数）。 */
export type DeviceKitLogger = {
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

/** WLDeviceError 的形状（动态 require 无法 instanceof 类型层面的类）。 */
export interface WLDeviceError extends Error {
  code: string;
}

/** 连接生命周期事件（CONNECTED / DISCONNECTED / ERROR 判别联合）。 */
export type ConnectionEvent =
  | { type: number }
  | { type: number; error?: unknown };

/**
 * 设备传输层（WLDeviceCommImpl）：connect/disconnect 与连接事件订阅。
 * connect 的返回值（boolean）在本 chunk 中未被使用。
 */
export interface DeviceComm {
  onConnectionEvent(callback: (event: ConnectionEvent) => void): () => void;
  connect(device: DiscoveredDevice): Promise<unknown>;
  disconnect(): Promise<void>;
}

/** HID 按键事件（device-kit HIDKey：act/agent 为可选数字）。 */
export interface DeviceHidKeyEvent {
  key: string;
  act?: number | null;
  agent?: number | null;
}

/** 摇杆事件（device-kit JoystickPos：angle/distance 均归一化到 0–1）。 */
export interface JoystickEvent {
  angle: number;
  distance: number;
}

/** 单个灯区的灯效参数（effect/brightness/speed/magic/color）。 */
export interface LightingZoneConfig {
  effect: number;
  brightness: number;
  speed: number;
  magic: number;
  color: number;
}

/** 键盘 + 环境灯两区的整体灯效配置（OAILightingConfig）。 */
export interface LightingConfig {
  keys: LightingZoneConfig;
  ambient: LightingZoneConfig;
}

/** 单个线程槽位的灯效（ThreadLighting，id 必填其余可选）。 */
export interface ThreadLightingConfig {
  id: number;
  color: number;
  brightness: number;
  effect: number;
  speed: number;
  syncKeysLighting: boolean;
  syncAmbientLighting: boolean;
}

/** 设备 RPC 结果（WLRPCResult：ok 时带 value，否则带 error）。 */
export type DeviceRpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

/** 设备状态快照里的电池字段（WLDeviceStatus 的子集）。 */
export interface DeviceStatusPayload {
  batteryPercentage?: number | null;
  isCharging?: boolean | null;
}

/** 高层设备 API（RPCApiOAI）：通知订阅 + 灯效/状态 RPC。 */
export interface DeviceApi {
  onHidReceived(callback: (event: DeviceHidKeyEvent) => void): () => void;
  onJoystickMove(callback: (event: JoystickEvent) => void): () => void;
  sendLightingConfig(config: LightingConfig): Promise<DeviceRpcResult<void>>;
  sendThreadsLighting(threads: ThreadLightingConfig[]): Promise<DeviceRpcResult<void>>;
  getDeviceStatus(): Promise<DeviceRpcResult<DeviceStatusPayload>>;
}

/** HID 拓扑发现出来的设备描述（WLDevice 形状）。 */
export interface DiscoveredDevice {
  portPath: string;
  devicePid: string;
  connectionType: number;
  deviceType: string;
  layoutType: string;
  isUsbConnection: boolean;
}

/** HID 原生扫描的原始设备条目（hid-topology-watcher.node / node-hid）。 */
export interface RawHidDevice {
  path: string | null;
  productId: number;
  usagePage?: number;
  transport?: string | null;
  release?: number;
}

/** HID 拓扑监听句柄（watch 返回，dispose 停止监听）。 */
export interface HidTopologyWatcher {
  dispose(): void;
}

// ---------------------------------------------------------------------------
// 对外（主进程）模型类型
// ---------------------------------------------------------------------------

/** 线程槽位状态（shared chunk colorForThreadStatus 的输入枚举）。 */
export type ThreadSlotStatus =
  | "off"
  | "working"
  | "unread"
  | "idle"
  | "awaiting-approval"
  | "awaiting-response"
  | "error";

/** 语音会话状态（驱动环境灯灯效）。 */
export type VoiceState = "idle" | "recording" | "processing" | "completed";

/** 线程槽位的 UI 投影（6 槽之一；pulsing 表示非选中但需要呼吸灯）。 */
export interface ThreadSlot {
  id: number;
  threadKey: string | null;
  title: string | null;
  status: ThreadSlotStatus;
  selected: boolean;
  pulsing?: boolean;
}

/** updateLighting 的完整灯效模型（渲染进程通过 IPC 传入）。 */
export interface LightingModel {
  slots: ThreadSlot[];
  voiceState: VoiceState;
  brightness: number;
  inactivityTimeoutMs: number | null;
  /** 弹出导航打开时保持选中高亮灯不变（不发 selection 灯）。 */
  preserveSelectionLighting?: boolean;
  /** 弹出导航打开时的环境灯「蛇形」状态颜色。 */
  snakingAmbientStatus?: ThreadSlotStatus;
  /** 电池状态刷新挂起（例如弹出导航期间避免设备写入）。 */
  suspendDeviceStatusRefresh?: boolean;
}

/** 转发给主窗口的 HID 事件（附解析出的槽位号与线程 key）。 */
export interface ForwardedHidEvent {
  key: string;
  act: number | null;
  agent: number | null;
  slot: number | null;
  threadKey: string | null;
}

/** 设备传输类型（发现条目推导）。 */
export type DeviceTransport = "usb" | "bluetooth" | "unknown";

/** 设备型号（发现条目推导）。 */
export type DeviceModel = "codex-micro" | "creator-micro-v2";

/** 设备电池状态。 */
export interface DeviceBatteryState {
  percentage: number;
  isCharging: boolean | null;
}

/** 状态上报原因（cause）：设备生命周期 / 传输切换 / 服务停止。 */
export type DeviceStateCause = "device-lifecycle" | "transport-handoff" | "service-stop";

/**
 * 对外设备状态。error 为 null 表示成功路径；"transport-unavailable" /
 * "discovery-failed" / "connection-failed" 表示失败路径。
 * controlPlaneStatus 仅在「已连接但灯效控制面不可用」时为 "unavailable"。
 */
export interface CodexMicroDeviceState {
  status: "not-detected" | "detected" | "connected" | "error";
  transport: DeviceTransport | null;
  model: DeviceModel | null;
  error: string | null;
  battery: DeviceBatteryState | null;
  controlPlaneStatus?: "unavailable";
}

/** 服务生命周期状态。 */
export type ServiceLifecycleState = "initial" | "started" | "stopped";

/** 错误上报里的来源标签（invalidateActiveConnection 的 source 字段）。 */
export type DeviceErrorSource = "lighting-rpc" | "battery-rpc" | "sdk-disconnected" | "sdk-error";

/** 定时器调度抽象（默认 setTimeout/clearTimeout，测试可注入）。 */
export type ScheduleTimer = (callback: () => void, delayMs: number) => unknown;
export type ClearTimer = (handle: unknown) => void;

/** CodexMicroService 构造选项。 */
export interface CodexMicroServiceOptions {
  findDevices?: () => Promise<DiscoveredDevice[]>;
  watchHidTopology?: (onChanged: () => void) => HidTopologyWatcher;
  createComm?: () => DeviceComm;
  createApi?: (comm: DeviceComm) => DeviceApi;
  schedule?: ScheduleTimer;
  clearScheduled?: ClearTimer;
  onDeviceStateChanged: (state: CodexMicroDeviceState, cause: DeviceStateCause) => void;
  onHidEvent: (event: ForwardedHidEvent) => void;
  onJoystickEvent: (event: JoystickEvent) => void;
}
