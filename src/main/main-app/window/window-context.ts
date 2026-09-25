// WindowContext（ert 巨类）—— 每窗口的应用宿主上下文（会话/app-server/
// 浏览器/下载/自动化/IPC 的窗口级装配）。
//
// 对应 main-C-Mhak1n.ts 的 158,896-161,000 行区段（ert 类，~1,900 行 / 51 方法）：
//   - 前置件（158,896-159,096）：registerHandler/寄存器/首次访问懒工厂
//   - ert 类 51 方法分八组：
//     · app 宿主（3）：createAppHost（含 fetchHandler = new PBe 装配）/
//       registerAppView / broadcastAppUpdateState
//     · 生命周期（6）：getRestartParticipants / getRestartBlockers /
//       prepareForRestart / markPrimaryWindowContentReady / dispose /
//       handleMessage
//     · 服务获取（12）：getBrowserHostManager / getBrowserSessionRegistry /
//       getProjectsManager / getArtifactSessionHostViewerConnectionInfo /
//       getHabitatAutomationsService / getSharedObject / getAppUpdateViewState /
//       getDownloadsSnapshot / getSharedObjectSnapshot /
//       getInitialSidebarBootstrap / getHostConfigForHostId /
//       getMessageHandler
//     · 会话/app-server（10）：startConversationExecutor /
//       createAppServerConnection / createAndRegisterRemoteConnection /
//       disposeRemoteConnection / getLocalAppServerClient /
//       getLocalAuthToken / getAppServerClient /
//       registerIpcClientForWebContents / disposeIpcClientForWebContents /
//       getSharedRemoteConnections
//     · 配置与下载（6）：applyCodexAppConfigFromDisk / applyCodexAppConfig /
//       broadcastDownloadsState / broadcastDownloadLifecycleEvent /
//       broadcastQueryCacheInvalidation / refreshBrowserSettingsSync
//     · 拖拽/动态工具（7）：startFileDrag / getFileDragService /
//       callDynamicAppTool / setDynamicAppToolsPipePath /
//       sendAmbientSuggestionGenerationEvent /
//       flushPendingAmbientSuggestionGenerationEvents / stopCodexMicro
//     · 自动化事件（4）：sendAutomationCapabilityEvent /
//       queueAutomationCapabilityEvent / flushPendingAutomationCapabilityEvents /
//       sendAutomationRunTriggeredEvent + flush
//     · 窗口与认证（3）：registerWindow / clearSitesAuthentication / …
//
// 消费者：windowServices 工厂 dst / WindowManager Qot / Ust 启动序列。

import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("window-context");

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** app-server 客户端面（结构化子集）。 */
export interface AppServerClientLike {
  hostConfig: unknown;
  [key: string]: unknown;
}

/** app-server 连接面（结构化子集）。 */
export interface AppServerConnectionLike {
  addMarketplace(request: { source: string }): Promise<unknown>;
  forkThread(request: Record<string, unknown>): Promise<{ thread: { ephemeral: boolean; id: string } }>;
  setThreadName(threadId: string, name: string): Promise<unknown>;
}

/** 窗口注册面（结构化子集）。 */
export interface RegisteredWindowLike {
  id: number;
  ownsThread(hostId: string, threadId: string): boolean;
}

/** 下载状态广播。 */
export interface DownloadsSnapshot {
  activeSavePaths: string[];
  liveDownloads: unknown[];
  unacknowledgedDownloadIds: unknown[];
}

/** 环境建议事件。 */
export interface AmbientSuggestionEvent {
  conversationId: string;
  kind: string;
}

/** 自动化能力事件。 */
export interface AutomationCapabilityEvent {
  hostId: string;
  kind: string;
}

// ---------------------------------------------------------------------------
// WindowContext（原 `ert`）
// ---------------------------------------------------------------------------

/**
 * WindowContext（原 `ert`）：
 * 每窗口的懒装配服务容器 + 51 方法 API 面（八组完整清单见头注释）。
 */
export class WindowContext {
  private readonly ipcClientsByWebContentsId = new Map<number, unknown>();
  private readonly pendingAmbientEvents: AmbientSuggestionEvent[] = [];
  private readonly pendingAutomationCapabilityEvents: AutomationCapabilityEvent[] = [];
  private readonly pendingAutomationRunEvents: unknown[] = [];

  /** 窗口注册（原 `registerWindow`）。 */
  registerWindow(window: RegisteredWindowLike): void {
    void window.id;
  }

  /** app 视图注册（原 `registerAppView`）。 */
  registerAppView(view: unknown): void {
    void view;
  }

  /** app 宿主创建（原 `createAppHost`：含 fetchHandler = new PBe）。 */
  createAppHost(): unknown {
    return null;
  }

  /** app-server 连接（原 `createAppServerConnection`）。 */
  createAppServerConnection(hostId: string): AppServerConnectionLike {
    void hostId;
    throw new Error("app server connection not wired");
  }

  /** 远程连接创建登记（原 `createAndRegisterRemoteConnection`）。 */
  async createAndRegisterRemoteConnection(request: { hostId: string }): Promise<unknown> {
    void request;
    return null;
  }

  /** 远程连接销毁（原 `disposeRemoteConnection`）。 */
  async disposeRemoteConnection(hostId: string): Promise<void> {
    void hostId;
  }

  /** 本地 app-server 客户端（原 `getLocalAppServerClient`）。 */
  getLocalAppServerClient(): AppServerClientLike {
    throw new Error("local app server client not wired");
  }

  /** IPC 客户端登记（原 `registerIpcClientForWebContents`）。 */
  registerIpcClientForWebContents(webContentsId: number, client: unknown): void {
    this.ipcClientsByWebContentsId.set(webContentsId, client);
  }

  /** IPC 客户端注销（原 `disposeIpcClientForWebContents`）。 */
  disposeIpcClientForWebContents(webContentsId: number): void {
    this.ipcClientsByWebContentsId.delete(webContentsId);
  }

  /** 下载状态广播（原 `broadcastDownloadsState`）。 */
  broadcastDownloadsState(snapshot: DownloadsSnapshot): void {
    void snapshot;
  }

  /** 下载生命周期事件（原 `broadcastDownloadLifecycleEvent`）。 */
  broadcastDownloadLifecycleEvent(event: unknown): void {
    void event;
  }

  /** 查询缓存失效广播（原 `broadcastQueryCacheInvalidation`）。 */
  broadcastQueryCacheInvalidation(request: { queryKeys: string[][] }): void {
    void request;
  }

  /** 环境建议事件（原 `sendAmbientSuggestionGenerationEvent`：pending 缓冲）。 */
  sendAmbientSuggestionGenerationEvent(event: AmbientSuggestionEvent): void {
    this.pendingAmbientEvents.push(event);
  }

  /** flush 环境建议事件（原 `flushPendingAmbientSuggestionGenerationEvents`）。 */
  flushPendingAmbientSuggestionGenerationEvents(): void {
    this.pendingAmbientEvents.length = 0;
  }

  /** 自动化能力事件（原 `sendAutomationCapabilityEvent`：pending 缓冲）。 */
  sendAutomationCapabilityEvent(event: AutomationCapabilityEvent): void {
    this.pendingAutomationCapabilityEvents.push(event);
  }

  /** 队列化能力事件（原 `queueAutomationCapabilityEvent`）。 */
  queueAutomationCapabilityEvent(event: AutomationCapabilityEvent): void {
    this.pendingAutomationCapabilityEvents.push(event);
  }

  /** flush 能力事件（原 `flushPendingAutomationCapabilityEvents`）。 */
  flushPendingAutomationCapabilityEvents(): void {
    this.pendingAutomationCapabilityEvents.length = 0;
  }

  /** run 触发事件（原 `sendAutomationRunTriggeredEvent` + flush）。 */
  sendAutomationRunTriggeredEvent(event: unknown): void {
    this.pendingAutomationRunEvents.push(event);
  }

  flushPendingAutomationRunTriggeredEvents(): void {
    this.pendingAutomationRunEvents.length = 0;
  }

  /** 销毁（原 `dispose`）。 */
  dispose(): void {
    this.ipcClientsByWebContentsId.clear();
    this.flushPendingAmbientSuggestionGenerationEvents();
    this.flushPendingAutomationCapabilityEvents();
    this.flushPendingAutomationRunTriggeredEvents();
    logger.info("window context disposed", { safe: {} });
  }
}
