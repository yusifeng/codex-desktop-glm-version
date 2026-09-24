// 远程托管画中画（remote-hosted PIP）管理器（原版 18,171-18,701 区段）。
//
// 职责：
//   - PipTaskVisibilityStore（原 sue，18,221-18,272）：按会话 id 的任务可见
//     性账本（global-state 键 `electron-remote-hosted-pip-task-visibility-state`
//     持久化 + revision 计数）；
//   - createPipNativeVideoMultiplexer（原 oue，18,181-18,220）：threadId →
//     原生视频就绪的引用计数多路复用（sky addon 的 nativeVideoEnabled/
//     VideoFrameHandler 接线）；
//   - createRemoteHostedPipManager（原 lue，18,274-18,701）：大工厂——
//     任务可见性与活动（browser-use/computer-use 两类）、宿主呈现注册
//     （hostId → window）、聚焦线程对账、locale/尺寸/唤醒回调、消息
//     下发（task/browser-frame 状态）。
//
// 懒求值/时序保持点：
//   - 原生 PIP 宿主（startRemoteHostedPIPContentHost）只在 macOS + 启用 +
//     首个任务活动时启动；dispose 后（N）全部早退；
//   - `ce`（抑制线程集合）与 `ee`（任务状态推送）在每次对账时 diff；
//   - WSL/宿主路径等原文行为透传 sky addon 包装函数（native-app-icons）。
//
// 模块加载期副作用：仅常量。

import { BrowserWindow } from "electron";
import { Q as PIP_TASK_VISIBILITY_STATE_KEY, Z as PIP_CONTENT_MAX_DISPLAY_SIZE_KEY } from "@chunk/bootstrap";
import {
  startRemoteHostedPIPContentHost,
  stopRemoteHostedPIPContentHost,
  connectRemoteHostedPIPContentHost,
  setRemoteHostedPIPContentActiveThreadID,
  setRemoteHostedPIPContentSuppressedThreadIDs,
  setRemoteHostedPIPContentShouldShowTaskHandler,
  setRemoteHostedPIPContentVideoFrameHandler,
  setRemoteHostedPIPContentNativeVideoEnabled,
  setRemoteHostedPIPContentNativeVideoReady,
  setRemoteHostedPIPContentPlacement,
  interactWithRemoteHostedPIPContentPresentation,
  refreshRemoteHostedPIPContentVisibility,
  setRemoteHostedPIPContentMaxDisplaySize,
  setRemoteHostedPIPContentMaxDisplaySizeChangedHandler,
  hasRemoteHostedPIPContentAnyPresentation,
  getRemoteHostedPIPContentActiveTaskIDs,
  setRemoteHostedPIPContentPetWakeRequestHandler,
  setRemoteHostedPIPContentVisibilityRequestHandler,
  registerRemoteHostedPIPContentHost,
  unregisterRemoteHostedPIPContentHost,
} from "../windows/native-app-icons";
import {
  PIP_CLOSE_CONTROL_TOOLTIP_MESSAGE,
  PIP_CLOSE_CONTROL_TOOLTIP_DEFAULT,
  PIP_HIDE_CONTROL_MESSAGE,
  PIP_HIDE_CONTROL_DEFAULT,
  PIP_HIDE_FOR_TASK_MESSAGE,
  PIP_HIDE_FOR_TASK_DEFAULT,
  PIP_HIDE_FOR_ALL_ACTIVE_TASKS_MESSAGE,
  PIP_HIDE_FOR_ALL_ACTIVE_TASKS_DEFAULT,
  PIP_SEND_TO_PET_CONTROL_TOOLTIP_MESSAGE,
  PIP_SEND_TO_PET_CONTROL_TOOLTIP_DEFAULT,
} from "./constants";

/** nativeIntl 的最小面。 */
export interface NativeIntlLike {
  formatMessage(message: { messageId: string; defaultMessage: string }): string;
}

// ---------------------------------------------------------------------------
// PipTaskVisibilityStore（原 sue，18,221-18,272）
// ---------------------------------------------------------------------------

/** 任务可见性状态（消息载荷形态）。 */
export interface PipTaskVisibilityState {
  activeTaskIds: string[];
  globalHidden: boolean;
  revision: number;
  taskVisibilities: Record<string, `hidden` | `shown`>;
}

/** globalState 的最小面。 */
export interface StateStoreLike {
  get(key: unknown): any;
  getStored(key: unknown): any;
  set(key: unknown, value: unknown): void;
}

/**
 * 任务可见性账本（原 sue）：
 * - captureDefaults：为无记录的会话补默认可见性并持久化；
 * - setTaskVisibilities / deleteTask / importLegacyHiddenTaskIds；
 * - markGlobalHiddenChanged / markEphemeralStateChanged 只递增 revision。
 */
export class PipTaskVisibilityStore {
  private stateStore: StateStoreLike;
  private getGlobalHidden: () => boolean;
  private entries: Record<string, `hidden` | `shown`>;
  revision = 0;

  constructor(stateStore: StateStoreLike, getGlobalHidden: () => boolean) {
    this.stateStore = stateStore;
    this.getGlobalHidden = getGlobalHidden;
    this.entries = { ...stateStore.getStored(PIP_TASK_VISIBILITY_STATE_KEY) };
  }

  /** 补默认可见性（原 captureDefaults）。 */
  captureDefaults(
    conversationIds: string[],
    defaultVisibility: `hidden` | `shown`,
  ): { changedConversationIds: string[]; state: PipTaskVisibilityState } {
    let changed: string[] = [];
    for (let id of new Set(conversationIds)) {
      if (this.entries[id] == null) {
        this.entries[id] = defaultVisibility;
        changed.push(id);
      }
    }
    if (changed.length > 0) this.commit();
    return { changedConversationIds: changed, state: this.getState() };
  }

  /** 删除会话记录（原 deleteTask）。 */
  deleteTask(conversationId: string): { changedConversationIds: string[]; state: PipTaskVisibilityState } {
    return this.entries[conversationId] == null
      ? { changedConversationIds: [], state: this.getState() }
      : (delete this.entries[conversationId],
        this.commit(),
        { changedConversationIds: [conversationId], state: this.getState() });
  }

  /** 当前状态快照（原 getState）。 */
  getState(): PipTaskVisibilityState {
    return {
      activeTaskIds: [],
      globalHidden: this.getGlobalHidden(),
      revision: this.revision,
      taskVisibilities: { ...this.entries },
    };
  }

  /** 单会话可见性（原 getVisibility）。 */
  getVisibility(conversationId: string): `hidden` | `shown` | undefined {
    return this.entries[conversationId];
  }

  /** 导入 legacy 隐藏列表（原 importLegacyHiddenTaskIds）。 */
  importLegacyHiddenTaskIds(conversationIds: string[]): { changedConversationIds: string[]; state: PipTaskVisibilityState } {
    return this.setTaskVisibilities(conversationIds, `hidden`);
  }

  /** 全局隐藏变化（原 markGlobalHiddenChanged）。 */
  markGlobalHiddenChanged(): PipTaskVisibilityState {
    this.revision += 1;
    return this.getState();
  }

  /** 临时状态变化（原 markEphemeralStateChanged）。 */
  markEphemeralStateChanged(): PipTaskVisibilityState {
    this.revision += 1;
    return this.getState();
  }

  /** 设置单会话（原 setTaskVisibility）。 */
  setTaskVisibility(conversationId: string, visibility: `hidden` | `shown`): { changedConversationIds: string[]; state: PipTaskVisibilityState } {
    return this.setTaskVisibilities([conversationId], visibility);
  }

  /** 批量设置（原 setTaskVisibilities）。 */
  setTaskVisibilities(
    conversationIds: string[],
    visibility: `hidden` | `shown`,
  ): { changedConversationIds: string[]; state: PipTaskVisibilityState } {
    let changed: string[] = [];
    for (let id of new Set(conversationIds)) {
      if (this.entries[id] !== visibility) {
        this.entries[id] = visibility;
        changed.push(id);
      }
    }
    if (changed.length > 0) this.commit();
    return { changedConversationIds: changed, state: this.getState() };
  }

  /** 提交到 global-state（原 commit）。 */
  private commit(): void {
    this.stateStore.set(PIP_TASK_VISIBILITY_STATE_KEY, this.entries);
    this.revision += 1;
  }
}

/** 状态消息更新节流（ms，原 cue = 200）。 */
const STATE_MESSAGE_COALESCE_MS = 200;

// ---------------------------------------------------------------------------
// 原生视频多路复用（原 oue，18,181-18,220）
// ---------------------------------------------------------------------------

/**
 * threadId → 原生视频通道的多路复用（原 oue）：
 * start 引用计数，stop 减一；归零后卸载 VideoFrameHandler。
 * webContents 消费 bootstrap 频道 `remote-hosted-pip-video-frame`（a.qt）。
 */
export function createPipNativeVideoMultiplexer({
  getWebContentsForThreadID,
  isMacOS,
  messageChannel,
}: {
  getWebContentsForThreadID(threadId: string): Electron.WebContents[];
  isMacOS: boolean;
  messageChannel: string;
}) {
  let refCounts = new Map<string, number>();
  let frameHandlerInstalled = false;

  let sendFrame = (frame: { threadID: string; stopped?: boolean; [key: string]: unknown }) => {
    if (refCounts.has(frame.threadID)) {
      for (let webContents of getWebContentsForThreadID(frame.threadID)) {
        if (!webContents.isDestroyed())
          webContents.send(messageChannel, frame as never);
      }
    }
  };
  let stopThread = (threadId: string) => {
    setRemoteHostedPIPContentNativeVideoEnabled([threadId], false);
    for (let webContents of getWebContentsForThreadID(threadId)) {
      if (!webContents.isDestroyed())
        webContents.send(messageChannel, { stopped: true, threadID: threadId } as never);
    }
  };

  return {
    dispose: () => {
      for (let threadId of refCounts.keys()) stopThread(threadId);
      refCounts.clear();
      if (frameHandlerInstalled) {
        setRemoteHostedPIPContentVideoFrameHandler(null);
        frameHandlerInstalled = false;
      }
    },
    setReady: (threadId: string, ready: boolean) => {
      if (refCounts.has(threadId))
        setRemoteHostedPIPContentNativeVideoReady([threadId], ready);
    },
    start: (threadId: string) => {
      if (!isMacOS || threadId.length === 0) return;
      let count = refCounts.get(threadId);
      if (count != null) {
        refCounts.set(threadId, count + 1);
        return;
      }
      let installed = frameHandlerInstalled || setRemoteHostedPIPContentVideoFrameHandler(sendFrame);
      if (installed) {
        frameHandlerInstalled = true;
        refCounts.set(threadId, 1);
        if (!setRemoteHostedPIPContentNativeVideoEnabled([threadId], true)) {
          refCounts.delete(threadId);
          if (refCounts.size === 0) {
            setRemoteHostedPIPContentVideoFrameHandler(null);
            frameHandlerInstalled = false;
          }
        }
      }
    },
    stop: (threadId: string) => {
      let count = refCounts.get(threadId);
      if (count != null) {
        if (count > 1) {
          refCounts.set(threadId, count - 1);
          return;
        }
        refCounts.delete(threadId);
        stopThread(threadId);
        if (refCounts.size === 0) {
          setRemoteHostedPIPContentVideoFrameHandler(null);
          frameHandlerInstalled = false;
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// PIP 管理器（原 lue，18,274-18,701）
// ---------------------------------------------------------------------------

/** 浏览器帧描述（upsertBrowserFrame 载荷）。 */
export interface PipBrowserFrame {
  backend: string;
  imageDataURL: string;
  presentationID: string;
  tabID: string;
  threadID: string;
}

/** 宿主布局描述（setHostLayoutForWebContents 载荷，原文 hostLayout）。 */
export interface PipHostLayout {
  hostId: string;
  anchors: Array<{ alignment: string; point: { x: number; y: number } }>;
  anchorRect: { x: number; y: number; width: number; height: number } | null;
  animated?: boolean;
  homeSurfaceWidth?: number | null;
  isCodexHomeAvailable?: boolean;
  interactionPassthroughRect?: { x: number; y: number; width: number; height: number } | null;
  presentationScope?: string;
}

/** 管理器工厂入参（原 lue 的 options）。 */
export interface RemoteHostedPipManagerOptions {
  getAlwaysHidePictureInPicture: () => boolean;
  isEnabled: () => boolean;
  isMacOS: boolean;
  nativeIntl: NativeIntlLike;
  preferenceStore: { getStored(key: string): unknown; set(key: string, value: unknown): void };
  setAlwaysHidePictureInPicture: (hidden: boolean) => void;
  stateStore: StateStoreLike;
  /** bootstrap 的 remote-hosted-pip-video-frame 频道名（原 a.qt）。 */
  videoFrameChannel: string;
}

/** 管理器句柄（原 lue 的返回值方法面）。 */
export interface RemoteHostedPipManager {
  completeTurn(turn: { threadId: string; turnId: string }, status?: string): void;
  deleteTaskState(conversationId: string): void;
  dispose(): void;
  getBrowserFrameState(): { frames: PipBrowserFrame[]; revision: number };
  getTaskState(): PipTaskVisibilityState;
  handleGlobalHiddenChanged(): void;
  hideAllActiveTasks(): PipTaskVisibilityState;
  hideTask(conversationId: string): PipTaskVisibilityState;
  importLegacyHiddenTaskIds(conversationIds: string[]): PipTaskVisibilityState;
  interactWithPresentation(hostId: string, point: { x: number; y: number }, interaction: unknown): void;
  onContentHostStarted(listener: () => void): () => void;
  reconcileContentHostLifecycle(): void;
  refreshLocale(): void;
  removeBrowserFrame(presentationId: string): void;
  setTaskActivity(surface: string, conversationId: string, active: boolean): void;
  showTask(conversationId: string, opts?: { initialMaxDisplaySize?: number }): PipTaskVisibilityState;
  registerWindow(window: BrowserWindow): void;
  setPlacement(hostId: string, placement: unknown): void;
  setNativeVideoReady(threadId: string, ready: boolean): void;
  startNativeVideo(threadId: string): void;
  stopNativeVideo(threadId: string): void;
  syncActiveThreadForFocusedWindow(): void;
  setThreadSuppressionPredicate(
    predicate: (window: BrowserWindow, threadId: string | null) => boolean,
  ): void;
  setServiceProcessIdentifier(identifier: number | null): void;
  setActiveThreadForWebContents(webContents: Electron.WebContents, threadId: string | null): void;
  setHostLayoutForWebContents(webContents: Electron.WebContents, layout: PipHostLayout): void;
  setPetWakeRequestHandler(handler: (() => void) | null): void;
  setWindowMessageSender(
    sender: (message: { state: unknown; type: string }) => void,
  ): void;
  upsertBrowserFrame(frame: PipBrowserFrame): void;
}

/**
 * 创建远程托管 PIP 管理器（原 lue，18,274-18,701）。
 * 结构：闭包工厂——内部状态（window→thread、thread→layout、host 注册表、
 * 活动任务集合、聚焦追踪、抑制集合）全部私有，返回方法面。
 */
export function createRemoteHostedPipManager(options: RemoteHostedPipManagerOptions): RemoteHostedPipManager {
  let {
    getAlwaysHidePictureInPicture,
    isEnabled,
    isMacOS,
    nativeIntl,
    preferenceStore,
    setAlwaysHidePictureInPicture,
    stateStore,
    videoFrameChannel,
  } = options;

  let controlTooltips = () => ({
    closeTooltip: nativeIntl.formatMessage({
      messageId: PIP_CLOSE_CONTROL_TOOLTIP_MESSAGE,
      defaultMessage: PIP_CLOSE_CONTROL_TOOLTIP_DEFAULT,
    }),
    hide: nativeIntl.formatMessage({
      messageId: PIP_HIDE_CONTROL_MESSAGE,
      defaultMessage: PIP_HIDE_CONTROL_DEFAULT,
    }),
    hideForAllActiveTasks: nativeIntl.formatMessage({
      messageId: PIP_HIDE_FOR_ALL_ACTIVE_TASKS_MESSAGE,
      defaultMessage: PIP_HIDE_FOR_ALL_ACTIVE_TASKS_DEFAULT,
    }),
    hideForTask: nativeIntl.formatMessage({
      messageId: PIP_HIDE_FOR_TASK_MESSAGE,
      defaultMessage: PIP_HIDE_FOR_TASK_DEFAULT,
    }),
    placementTooltip: nativeIntl.formatMessage({
      messageId: PIP_SEND_TO_PET_CONTROL_TOOLTIP_MESSAGE,
      defaultMessage: PIP_SEND_TO_PET_CONTROL_TOOLTIP_DEFAULT,
    }),
  });

  /** windowId → threadId（原 u）。 */
  let threadByWindowId = new Map<number, string | null>();
  let videoMultiplexer = createPipNativeVideoMultiplexer({
    getWebContentsForThreadID: (threadId) =>
      BrowserWindow.getAllWindows()
        .filter((window) => threadByWindowId.get(window.id) === threadId)
        .map((window) => window.webContents),
    isMacOS,
    messageChannel: videoFrameChannel,
  });
  /** windowId → hostLayout 描述（原 f 的值部分）。 */
  let windowLayouts = new Map<number, PipHostLayout>();
  /** windowId → hostId（原 f 的键值映射，用于 host 换绑检测）。 */
  let layoutByWindowId = new Map<number, string>();
  /** 持有 hostLayout 的 windowId 集合（原 m）。 */
  let windowsWithLayout = new Set<number>();
  /** hostId → windowId（原 h）。 */
  let windowIdByHostId = new Map<string, number>();
  /** surface → 活动会话集合（原 g：browser-use/computer-use）。 */
  let activeTasksBySurface = new Map<string, Set<string>>([
    [`browser-use`, new Set()],
    [`computer-use`, new Set()],
  ]);
  /** presentationId → 帧描述（原 _）。 */
  let browserFrames = new Map<string, PipBrowserFrame>();
  let taskVisibilityStore = new PipTaskVisibilityStore(stateStore, getAlwaysHidePictureInPicture);
  /** 内容宿主启动监听器（原 y）。 */
  let contentHostStartedListeners = new Set<() => void>();
  /** 原生宿主是否已启动（原 b）。 */
  let nativeHostStarted = false;
  /** 上次聚焦窗口 id（原 x）。 */
  let lastFocusedWindowId: number | null = null;
  /** 全局隐藏基线（原 S）。 */
  let globalHiddenBaseline = getAlwaysHidePictureInPicture();
  /** 窗口消息下发器（原 O）。 */
  let sendWindowMessage: ((message: { state: unknown; type: string }) => void) | null = null;
  /** 当前聚焦宿主的 hostId（原 w）。 */
  let focusedHostId: string | null = null;
  /** 抑制线程 id 列表缓存（原 E）。 */
  let suppressedThreadIds: string[] = [];
  /** 活动任务 id 缓存（原 D，onServiceConnectionLost 等）。 */
  let petWakeRequestHandler: (() => void) | null = null;
  /** 服务进程 id（原 C）。 */
  let serviceProcessIdentifier: number | null = null;
  /** 上次下发的活动集合（原 k）。 */
  let lastPublishedActiveIds = new Set<string>();
  let shouldShowTaskHandlerInstalled = false;
  let visibilityRequestHandlerInstalled = false;
  let wakeRequestHandlerInstalled = false;
  let maxDisplaySizeHandlerInstalled = false;
  let maxDisplaySizeInitialized = false;
  /** 抑制谓词（原 F）。 */
  let suppressThread: (window: BrowserWindow, threadId: string | null) => boolean = () => false;
  let disposed = false;
  let initialMaxDisplaySizeSet = false;
  let suppressRestoreApplied = false;
  /** homeSurface 宽度（原 j）。 */
  let homeSurfaceWidth: number | null = null;
  /** 最大显示尺寸（原 M；初值即原文的 cue 常量 200，由偏好/宿主宽度刷新）。 */
  let maxDisplaySize: number = STATE_MESSAGE_COALESCE_MS;
  let browserFrameRevision = 0;
  let knownActiveTaskIds = new Set<string>();

  /** 全部活动任务 id（原 B，18,330-18,332）。 */
  let allActiveTaskIds = () => {
    let ids = new Set<string>(
      nativeHostStarted && !disposed
        ? (getRemoteHostedPIPContentActiveTaskIDs() as string[])
        : [],
    );
    for (let set of activeTasksBySurface.values()) for (let id of set) ids.add(id);
    return ids;
  };
  /** 任务状态（原 V）。 */
  let taskState = (): PipTaskVisibilityState => ({
    ...taskVisibilityStore.getState(),
    activeTaskIds: Array.from(allActiveTaskIds()).sort(),
  });
  /** 推送任务状态（原 ee）。 */
  let publishTaskState = () => {
    let state = taskState();
    knownActiveTaskIds = new Set(state.activeTaskIds);
    sendWindowMessage?.({ state, type: `remote-hosted-pip-task-state-changed` });
  };
  /** 浏览器帧状态（原 te）。 */
  let browserFrameState = () => ({
    frames: Array.from(browserFrames.values()).sort((a, b) =>
      a.presentationID.localeCompare(b.presentationID),
    ),
    revision: browserFrameRevision,
  });
  /** 推送帧状态（原 ne）。 */
  let publishBrowserFrameState = () => {
    sendWindowMessage?.({
      state: browserFrameState(),
      type: `remote-hosted-pip-browser-frame-state-changed`,
    });
  };
  /** 可见性变化后的状态推送 + 原生刷新（原 H）。 */
  let notifyVisibilityChanged = (changed: string[]) => {
    if (changed.length !== 0) {
      publishTaskState();
      if (nativeHostStarted) refreshRemoteHostedPIPContentVisibility(null);
    }
  };
  /** 活动集合的默认可见性补录（原 re）。 */
  let captureDefaultsFor = (conversationIds: string[]) => {
    let { changedConversationIds } = taskVisibilityStore.captureDefaults(
      conversationIds,
      getAlwaysHidePictureInPicture() ? `hidden` : `shown`,
    );
    return changedConversationIds;
  };
  /** 全量补录 + 推送（原 U）。 */
  let reconcileAllVisibility = () => {
    if (isEnabled()) notifyVisibilityChanged(captureDefaultsFor([...allActiveTaskIds()]));
  };
  /** should-show 回调（原 ie，18,359-18,371）。 */
  let handleShouldShowTask = (conversationId: string) => {
    if (disposed || !isMacOS || !isEnabled() || conversationId.length === 0) return false;
    let changed = captureDefaultsFor([conversationId]);
    let ephemeralShow =
      nativeHostStarted &&
      !knownActiveTaskIds.has(conversationId) &&
      (getRemoteHostedPIPContentActiveTaskIDs() as string[]).includes(conversationId);
    if (ephemeralShow && changed.length === 0) taskVisibilityStore.markEphemeralStateChanged();
    if (changed.length > 0 || ephemeralShow) {
      queueMicrotask(() => {
        if (!disposed) publishTaskState();
      });
    }
    return !getAlwaysHidePictureInPicture() && taskVisibilityStore.getVisibility(conversationId) === `shown`;
  };
  /** surface 活动变化（原 ae，18,372-18,378）。 */
  let setSurfaceTaskActivity = (surface: string, conversationId: string, active: boolean) => {
    let set = activeTasksBySurface.get(surface);
    if (set == null || (active ? !set.has(conversationId) : set.has(conversationId))) return;
    if (active) set.add(conversationId);
    else set.delete(conversationId);
    let changed = active && isEnabled() ? captureDefaultsFor([conversationId]) : [];
    if (changed.length > 0) notifyVisibilityChanged(changed);
    else {
      taskVisibilityStore.markEphemeralStateChanged();
      publishTaskState();
    }
  };
  /** 启动原生宿主（原 oe，18,379-18,397）。 */
  let startNativeHost = () => {
    if (disposed || nativeHostStarted || !isMacOS || !isEnabled()) return;
    installShouldShowHandler();
    nativeHostStarted = startRemoteHostedPIPContentHost({
      controlTooltips: controlTooltips(),
      onServiceConnectionLost: () => {
        serviceProcessIdentifier = null;
      },
    });
    if (nativeHostStarted) {
      if (serviceProcessIdentifier != null) connectRemoteHostedPIPContentHost(serviceProcessIdentifier);
      installWakeRequestHandler();
      installVisibilityRequestHandler();
      installMaxDisplaySizeHandler();
      initializeMaxDisplaySize();
      syncFocusedThread();
      for (let listener of contentHostStartedListeners) listener();
    }
  };
  /** 设置聚焦 hostId（原 se）。 */
  let setActiveThreadId = (threadId: string | null) => {
    if (isMacOS) {
      focusedHostId = threadId;
      if (nativeHostStarted && focusedHostId !== threadId) {
        setRemoteHostedPIPContentActiveThreadID(threadId);
      }
    }
  };
  /** 推送抑制集合（原 ce）。 */
  let publishSuppressedThreadIds = (threadIds: Set<string>) => {
    let sorted = Array.from(threadIds).sort();
    if (!isMacOS || !nativeHostStarted) return;
    if (suppressedThreadIds.length === sorted.length && suppressedThreadIds.every((id, index) => id === sorted[index]))
      return;
    suppressedThreadIds = sorted;
    setRemoteHostedPIPContentSuppressedThreadIDs(sorted);
  };
  /** 批量隐藏（原 le）。 */
  let hideTasks = (conversationIds: string[]) => {
    let ids = Array.from(new Set(conversationIds)).sort();
    if (ids.length === 0) return;
    let { changedConversationIds } = taskVisibilityStore.setTaskVisibilities(ids, `hidden`);
    notifyVisibilityChanged(changedConversationIds);
  };
  /** 隐藏全部（原 ue，18,411-18,419）。 */
  let hideAllActiveTasks = (extraIds: string[] = []) => {
    let wasHidden = getAlwaysHidePictureInPicture();
    if (!wasHidden) {
      globalHiddenBaseline = true;
      setAlwaysHidePictureInPicture(true);
    }
    let { changedConversationIds } = taskVisibilityStore.setTaskVisibilities(
      [...allActiveTaskIds(), ...(getRemoteHostedPIPContentActiveTaskIDs() as string[]), ...extraIds],
      `hidden`,
    );
    if (!wasHidden) taskVisibilityStore.markGlobalHiddenChanged();
    if (!wasHidden || changedConversationIds.length > 0) {
      publishTaskState();
      if (nativeHostStarted) refreshRemoteHostedPIPContentVisibility(null);
    }
    return taskState();
  };

  // ----- 原生 handler 安装（原 de/fe/W/G/pe，18,420-18,457） -----
  let installShouldShowHandler = () => {
    if (!shouldShowTaskHandlerInstalled && isMacOS) {
      shouldShowTaskHandlerInstalled = setRemoteHostedPIPContentShouldShowTaskHandler(
        (action: string, conversationId: string) => {
          switch (action) {
            case `hide-for-all-active-tasks`:
              hideAllActiveTasks([conversationId]);
              return;
            case `hide-for-task`:
              hideTasks([conversationId]);
              return;
          }
        },
      );
    }
  };
  let installVisibilityRequestHandler = () => {
    if (!visibilityRequestHandlerInstalled && isMacOS) {
      visibilityRequestHandlerInstalled = setRemoteHostedPIPContentVisibilityRequestHandler(
        handleShouldShowTask,
      );
    }
  };
  let installWakeRequestHandler = () => {
    if (!wakeRequestHandlerInstalled && isMacOS && petWakeRequestHandler != null) {
      wakeRequestHandlerInstalled = setRemoteHostedPIPContentPetWakeRequestHandler(() => {
        petWakeRequestHandler?.();
      });
    }
  };
  let installMaxDisplaySizeHandler = () => {
    if (!maxDisplaySizeHandlerInstalled && isMacOS) {
      maxDisplaySizeHandlerInstalled = setRemoteHostedPIPContentMaxDisplaySizeChangedHandler((size: number) => {
        maxDisplaySize = size;
        preferenceStore.set(PIP_CONTENT_MAX_DISPLAY_SIZE_KEY, size);
      });
    }
  };
  let initializeMaxDisplaySize = () => {
    if (maxDisplaySizeInitialized || !isMacOS) return;
    maxDisplaySizeInitialized = true;
    let stored = preferenceStore.getStored(PIP_CONTENT_MAX_DISPLAY_SIZE_KEY);
    if (stored != null) {
      maxDisplaySize = stored as number;
      setRemoteHostedPIPContentMaxDisplaySize(maxDisplaySize);
    }
  };

  // ----- host 注册表维护（原 me/he/ge，18,458-18,480） -----
  let unregisterWindowHost = (windowId: number) => {
    let hostId = layoutByWindowId.get(windowId);
    if (hostId != null && windowIdByHostId.get(hostId) === windowId) {
      unregisterRemoteHostedPIPContentHost(hostId);
      windowIdByHostId.delete(hostId);
    }
  };
  let forgetWindow = (windowId: number) => {
    unregisterWindowHost(windowId);
    windowLayouts.delete(windowId);
    layoutByWindowId.delete(windowId);
    threadByWindowId.delete(windowId);
    windowsWithLayout.delete(windowId);
  };
  /** 关闭原生宿主（原 ge，18,465-18,480）。 */
  let stopNativeHost = () => {
    if ((visibilityRequestHandlerInstalled &&= (setRemoteHostedPIPContentVisibilityRequestHandler(null), false)), nativeHostStarted) {
      for (let hostId of windowIdByHostId.keys()) unregisterRemoteHostedPIPContentHost(hostId);
      windowIdByHostId.clear();
      unregisterRemoteHostedPIPContentHost(`avatar-overlay`);
      if (wakeRequestHandlerInstalled) {
        setRemoteHostedPIPContentPetWakeRequestHandler(null);
        wakeRequestHandlerInstalled = false;
      }
      if (shouldShowTaskHandlerInstalled) {
        setRemoteHostedPIPContentShouldShowTaskHandler(null);
        shouldShowTaskHandlerInstalled = false;
      }
      if (maxDisplaySizeHandlerInstalled) {
        setRemoteHostedPIPContentMaxDisplaySizeChangedHandler(null);
        maxDisplaySizeHandlerInstalled = false;
      }
      stopRemoteHostedPIPContentHost();
      nativeHostStarted = false;
      focusedHostId = null;
      homeSurfaceWidth = undefined as never;
      suppressedThreadIds = [];
      maxDisplaySizeInitialized = false;
    }
  };
  /** 宿主生命周期对账（原 _e，18,481-18,489）。 */
  let reconcileContentHost = () => {
    if (disposed) return;
    reconcileAllVisibility();
    if (isMacOS && isEnabled()) {
      startNativeHost();
      syncFocusedThread();
      return;
    }
    stopNativeHost();
  };
  /** 注册/更新宿主呈现（原 ve，18,490-18,505）。 */
  let updateHostPresentation = (window: BrowserWindow, layout: PipHostLayout) => {
    if (!isEnabled() || layout.anchorRect == null) return;
    let existingHostId = layoutByWindowId.get(window.id);
    if (existingHostId != null && existingHostId !== layout.hostId) {
      unregisterWindowHost(window.id);
      layoutByWindowId.delete(window.id);
    }
    if (!nativeHostStarted) return;
    layoutByWindowId.set(window.id, layout.hostId);
    let animated = layout.animated === true && hasRemoteHostedPIPContentAnyPresentation();
    if (homeSurfaceWidth !== layout.homeSurfaceWidth) {
      homeSurfaceWidth = layout.homeSurfaceWidth ?? null;
      setRemoteHostedPIPContentMaxDisplaySize(homeSurfaceWidth ?? maxDisplaySize);
    }
    let registered = registerRemoteHostedPIPContentHost(layout.hostId, window, {
      anchors: layout.anchors,
      anchorRect: layout.anchorRect,
      animated,
      isCodexHomeAvailable: layout.isCodexHomeAvailable,
      interactionPassthroughRect: layout.interactionPassthroughRect,
      presentationScope: layout.presentationScope,
    });
    if (registered) windowIdByHostId.set(layout.hostId, window.id);
  };
  /** 聚焦窗口解析（原 ye，18,506-18,516）。 */
  let focusedPipWindow = (): BrowserWindow | null => {
    let focused = BrowserWindow.getFocusedWindow();
    if (focused != null && threadByWindowId.get(focused.id) != null) {
      lastFocusedWindowId = focused.id;
      return focused;
    }
    let allWindows = BrowserWindow.getAllWindows();
    if (lastFocusedWindowId != null) {
      let remembered = allWindows.find((window) => window.id === lastFocusedWindowId);
      if (remembered != null && threadByWindowId.get(remembered.id) != null) return remembered;
    }
    let pipWindows = allWindows.filter((window) => threadByWindowId.get(window.id) != null);
    return pipWindows.length === 1 ? pipWindows[0] : null;
  };
  let isFocusedPipWindow = (window: BrowserWindow): boolean =>
    window.isFocused()
      ? (threadByWindowId.get(window.id) != null && (lastFocusedWindowId = window.id), true)
      : window.id === focusedPipWindow()?.id;
  /** 聚焦线程对账（原 xe，18,518-18,535）。 */
  let syncFocusedThread = () => {
    if (disposed) return;
    let visibleThreadIds = new Set<string>();
    for (let window of BrowserWindow.getAllWindows()) {
      let threadId = threadByWindowId.get(window.id);
      if (threadId != null && suppressThread(window, threadId)) visibleThreadIds.add(threadId);
    }
    publishSuppressedThreadIds(visibleThreadIds);
    let window = focusedPipWindow();
    if (window == null) return;
    let threadId = threadByWindowId.get(window.id);
    if (threadId === undefined) return;
    let layout = windowLayouts.get(window.id);
    let needsReapply =
      layout != null &&
      windowsWithLayout.has(window.id) &&
      windowIdByHostId.get(layout.hostId) !== window.id;
    let visible = threadId != null && visibleThreadIds.has(threadId);
    let activeThread = windowsWithLayout.has(window.id) && !visible ? threadId : null;
    if (needsReapply) {
      setActiveThreadId(null);
      updateHostPresentation(window, layout);
    }
    setActiveThreadId(activeThread);
  };
  /** window → thread 登记（原 Se，18,536-18,546）。 */
  let setActiveThreadForWebContents = (
    webContents: Electron.WebContents,
    threadId: string | null,
  ) => {
    if (disposed) return;
    let window = BrowserWindow.fromWebContents(webContents);
    if (window == null || !isMacOS) return;
    if (isAvatarOverlayUrl(webContents.getURL())) {
      threadByWindowId.delete(window.id);
      return;
    }
    threadByWindowId.set(window.id, threadId);
    if (threadId == null && lastFocusedWindowId === window.id) lastFocusedWindowId = null;
    if (isFocusedPipWindow(window)) syncFocusedThread();
  };
  /** hostLayout 登记（原 Ce，18,547-18,555）。 */
  let setHostLayoutForWindow = (window: BrowserWindow, layout: PipHostLayout) => {
    windowLayouts.set(window.id, layout);
    layoutByWindowId.set(window.id, layout.hostId);
    let focused = isFocusedPipWindow(window);
    if (layout.anchorRect == null) {
      forgetWindow(window.id);
      if (focused) syncFocusedThread();
      return;
    }
    windowsWithLayout.add(window.id);
    if (nativeHostStarted && (focused || windowIdByHostId.get(layout.hostId) === window.id))
      updateHostPresentation(window, layout);
    if (focused) syncFocusedThread();
  };
  /** URL 是否 avatar overlay 路由（原 Md，18,711-18,719）。 */
  let isAvatarOverlayUrl = (url: string): boolean => {
    try {
      let parsed = new URL(url);
      return (
        parsed.pathname === `/avatar-overlay` ||
        parsed.searchParams.get(`initialRoute`) === `/avatar-overlay`
      );
    } catch {
      return false;
    }
  };

  return {
    completeTurn: ({ threadId, turnId }, status) => {
      if (disposed) return;
      if (status === `completed`) setSurfaceTaskActivity(`computer-use`, threadId, false);
      else setSurfaceTaskActivity(`computer-use`, threadId, true);
      reconcileContentHost();
    },
    deleteTaskState: (conversationId) => {
      if (disposed) return;
      let { changedConversationIds } = taskVisibilityStore.deleteTask(conversationId);
      if (changedConversationIds.length > 0) publishTaskState();
      let framesChanged = false;
      for (let [presentationId, frame] of browserFrames) {
        if (frame.threadID === conversationId) {
          browserFrames.delete(presentationId);
          framesChanged = true;
        }
      }
      if (framesChanged) {
        browserFrameRevision += 1;
        publishBrowserFrameState();
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      videoMultiplexer.dispose();
      stopNativeHost();
      contentHostStartedListeners.clear();
    },
    getBrowserFrameState: browserFrameState,
    getTaskState: taskState,
    handleGlobalHiddenChanged: () => {
      if (disposed) return;
      let hidden = getAlwaysHidePictureInPicture();
      if (hidden !== globalHiddenBaseline) {
        globalHiddenBaseline = hidden;
        taskVisibilityStore.markGlobalHiddenChanged();
        publishTaskState();
        if (nativeHostStarted) refreshRemoteHostedPIPContentVisibility(null);
      }
    },
    hideAllActiveTasks: () => (disposed ? taskState() : hideAllActiveTasks()),
    hideTask: (conversationId) => {
      if (!disposed) hideTasks([conversationId]);
      return taskState();
    },
    importLegacyHiddenTaskIds: (conversationIds) => {
      if (disposed) return taskState();
      let { changedConversationIds } = taskVisibilityStore.importLegacyHiddenTaskIds(conversationIds);
      notifyVisibilityChanged(changedConversationIds);
      return taskState();
    },
    interactWithPresentation: (hostId, point, interaction) => {
      if (!disposed && nativeHostStarted && focusedHostId === hostId)
        interactWithRemoteHostedPIPContentPresentation([hostId], [0], interaction);
    },
    onContentHostStarted: (listener) =>
      disposed
        ? () => {}
        : (contentHostStartedListeners.add(listener),
          nativeHostStarted && listener(),
          () => {
            contentHostStartedListeners.delete(listener);
          }),
    reconcileContentHostLifecycle: () => {
      reconcileContentHost();
    },
    refreshLocale: () => {
      if (!disposed && isMacOS && isEnabled() && nativeHostStarted) {
        stopNativeHost();
        startNativeHost();
        for (let window of BrowserWindow.getAllWindows()) {
          let layout = windowLayouts.get(window.id);
          if (layout != null) setHostLayoutForWindow(window, layout);
        }
        syncFocusedThread();
      }
    },
    removeBrowserFrame: (presentationId) => {
      if (!disposed && browserFrames.delete(presentationId)) {
        browserFrameRevision += 1;
        publishBrowserFrameState();
      }
    },
    setTaskActivity: (surface, conversationId, active) => {
      if (!disposed) {
        setSurfaceTaskActivity(surface, conversationId, active);
        reconcileContentHost();
      }
    },
    showTask: (conversationId, opts) => {
      if (disposed) return taskState();
      if (opts?.initialMaxDisplaySize != null && preferenceStore.getStored(PIP_CONTENT_MAX_DISPLAY_SIZE_KEY) == null) {
        maxDisplaySize = opts.initialMaxDisplaySize;
        setRemoteHostedPIPContentMaxDisplaySize(homeSurfaceWidth ?? maxDisplaySize);
      }
      let wasHidden = getAlwaysHidePictureInPicture();
      if (wasHidden) {
        globalHiddenBaseline = false;
        setAlwaysHidePictureInPicture(false);
      }
      let { changedConversationIds } = taskVisibilityStore.setTaskVisibility(conversationId, `shown`);
      if (wasHidden) taskVisibilityStore.markGlobalHiddenChanged();
      if (wasHidden || changedConversationIds.length > 0) {
        publishTaskState();
        if (nativeHostStarted)
          refreshRemoteHostedPIPContentVisibility(wasHidden ? null : conversationId);
      }
      return taskState();
    },
    registerWindow: (window) => {
      if (disposed || !isMacOS) return;
      let updateThread = (url: string) => {
        if (isAvatarOverlayUrl(url)) {
          threadByWindowId.delete(window.id);
          return;
        }
        let threadId = threadIdFromUrl(url);
        threadByWindowId.set(window.id, threadId);
        if (threadId == null && lastFocusedWindowId === window.id) lastFocusedWindowId = null;
        if (isFocusedPipWindow(window)) syncFocusedThread();
      };
      let onDidNavigate = (_event: unknown, url: string) => {
        updateThread(url);
      };
      let onDidNavigateInPage = (_event: unknown, url: string, isMainFrame: boolean) => {
        if (isMainThreadNavigation(isMainFrame)) updateThread(url);
      };
      let { webContents } = window;
      webContents.on(`did-navigate`, onDidNavigate);
      webContents.on(`did-navigate-in-page`, onDidNavigateInPage);
      window.on(`focus`, () => {
        if (threadByWindowId.get(window.id) != null) lastFocusedWindowId = window.id;
        syncFocusedThread();
      });
      window.on(`closed`, () => {
        threadByWindowId.delete(window.id);
        forgetWindow(window.id);
        if (lastFocusedWindowId === window.id) lastFocusedWindowId = null;
        webContents.off(`did-navigate`, onDidNavigate);
        webContents.off(`did-navigate-in-page`, onDidNavigateInPage);
        syncFocusedThread();
      });
      updateThread(webContents.getURL());
    },
    setPlacement: (hostId, placement) => {
      if (!disposed && nativeHostStarted && focusedHostId === hostId)
        setRemoteHostedPIPContentPlacement([hostId], placement);
    },
    setNativeVideoReady: (threadId, ready) => {
      if (!disposed && nativeHostStarted) videoMultiplexer.setReady(threadId, ready);
    },
    startNativeVideo: (threadId) => {
      if (!disposed && nativeHostStarted) videoMultiplexer.start(threadId);
    },
    stopNativeVideo: (threadId) => {
      if (!disposed) videoMultiplexer.stop(threadId);
    },
    syncActiveThreadForFocusedWindow: syncFocusedThread,
    setThreadSuppressionPredicate: (predicate) => {
      if (disposed) return;
      suppressThread = predicate;
      syncFocusedThread();
    },
    setServiceProcessIdentifier: (identifier) => {
      serviceProcessIdentifier = identifier;
      if (nativeHostStarted) connectRemoteHostedPIPContentHost(identifier!);
    },
    setActiveThreadForWebContents,
    setHostLayoutForWebContents: (webContents, layout) => {
      if (disposed) return;
      let window = BrowserWindow.fromWebContents(webContents);
      if (window != null && isMacOS) setHostLayoutForWindow(window, layout);
    },
    setPetWakeRequestHandler: (handler) => {
      if (disposed) return;
      petWakeRequestHandler = handler;
      if (handler == null) {
        if (wakeRequestHandlerInstalled) {
          setRemoteHostedPIPContentPetWakeRequestHandler(null);
          wakeRequestHandlerInstalled = false;
        }
      } else if (nativeHostStarted) {
        installWakeRequestHandler();
      }
    },
    setWindowMessageSender: (sender) => {
      if (disposed) return;
      sendWindowMessage = sender;
      publishTaskState();
      publishBrowserFrameState();
    },
    upsertBrowserFrame: (frame) => {
      if (disposed) return;
      let existing = browserFrames.get(frame.presentationID);
      if (
        existing?.backend !== frame.backend ||
        existing.imageDataURL !== frame.imageDataURL ||
        existing.tabID !== frame.tabID ||
        existing.threadID !== frame.threadID
      ) {
        browserFrames.set(frame.presentationID, frame);
        browserFrameRevision += 1;
        publishBrowserFrameState();
      }
    },
  };
}

/** did-navigate-in-page 的主帧导航判定（原文 `i = (e,n,r) => { r && t(n) }`）。 */
function isMainThreadNavigation(isMainFrame: unknown): boolean {
  return isMainFrame === true;
}

/** URL → 线程 id（原 uue + Nd，18,703-18,710 + 18,720-18,728）。 */
function threadIdFromUrl(url: string): string | null {
  try {
    let parsed = new URL(url);
    return (
      threadIdFromPath(parsed.pathname) ??
      threadIdFromPath(parsed.searchParams.get(`initialRoute`))
    );
  } catch {
    return null;
  }
}

/** /local/<id> 路径 → 线程 id（原 Nd）。 */
function threadIdFromPath(path: string | null): string | null {
  let match = path?.match(/^\/local\/([^/?#]+)/);
  if (match == null) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
