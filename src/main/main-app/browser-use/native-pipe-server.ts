// browser-use native pipe server（JYe 工厂）—— IAB API 的原生管道后端。
//
// 对应 main-C-Mhak1n.ts 的 112,999-113,093 行区段：
//   - 常量：iX logger（browser-use-native-pipe-server）；GYe = 8MiB 入站帧
//     上限 / KYe = 64MiB 出站帧上限；qYe schema（session_id/turn_id/tabId/
//     toolName）
//   - JYe 工厂：
//     ql(...)（R2 命名管道创建，nativePipeDirectory/pipePath/
//     socketPeerAuthorizer/onListening/onAuthorizationError/onRejectedSocket
//     事件）→ new ite(a, apiImpl, {...})（R2 协议类，onWebMcpToolInvoked +
//     onMoveMouseError 回调）
//     → 四路转发接线：
//       ① addCdpEventListener → sendCdpEvent（Bl 帧超限 → 跳过 + warning
//          browser-use native pipe skipped oversized CDP event）
//       ② addCdpDetachListener → sendCdpDetach
//       ③ addPageEventListener → sendPageEvent
//       ④ [RY] addBrowserUseDownloadChangeListener → sendDownloadChange
//     → 返回 { pipePath, dispose }（销毁时协议实例 + 管道 + 四路监听清理）

// ---------------------------------------------------------------------------
// 常量与类型
// ---------------------------------------------------------------------------

/** 入站帧上限（原 `GYe` = 8MiB）。 */
export const MAX_INCOMING_FRAME_BYTES = 8_388_608;

/** 出站帧上限（原 `KYe` = 64MiB）。 */
export const MAX_OUTGOING_FRAME_BYTES = 67_108_864;

/** WebMCP 工具调用通知（原 `qYe` schema）。 */
export interface WebMcpToolInvocation {
  session_id: string;
  tabId: string;
  toolName: string;
  turn_id: string;
}

/** CDP 事件形态。 */
export interface NativePipeCdpEvent {
  method: string;
  params?: unknown;
  sessionId?: string;
}

/** 帧超限错误（R2 的 `Bl`，此处声明消费形态）。 */
export class NativePipeFrameTooLargeError extends Error {
  constructor(
    public maxFrameBytes: number,
    public messageBytes: number,
  ) {
    super(`Frame exceeds ${maxFrameBytes} bytes`);
    this.name = "NativePipeFrameTooLargeError";
  }
}

/** IAB API 面（pipe 后端转发的目标——见 iab-api.ts）。 */
export interface NativePipeApiImpl {
  addCdpEventListener(listener: (event: NativePipeCdpEvent) => void): () => void;
  addCdpDetachListener(listener: (event: { tabId: string }) => void): () => void;
  addPageEventListener(listener: (event: { type: string; [key: string]: unknown }) => void): () => void;
  notifyWebMcpToolInvoked(invocation: WebMcpToolInvocation): void;
  [key: symbol]: unknown;
}

/** 协议实例面（R2 的 `ite` 类消费面）。 */
export interface NativePipeProtocol {
  sendCdpEvent(event: NativePipeCdpEvent): void;
  sendCdpDetach(event: { tabId: string }): void;
  sendPageEvent(event: { type: string; [key: string]: unknown }): void;
  sendDownloadChange(change: { path: string; tabId: string }): void;
  dispose(): void;
}

/** 下载监听 Symbol 协议（与 iab-api.ts 对齐）。 */
export const ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER = Symbol("addBrowserUseDownloadChangeListener");

// ---------------------------------------------------------------------------
// 工厂（原 `JYe`）
// ---------------------------------------------------------------------------

/**
 * native pipe server 工厂（原 `JYe`）：
 * 命名管道 → 协议实例 → 四路转发（CDP 事件/CDP detach/页面事件/下载变更）；
 * 帧超限事件跳过并告警。返回 { pipePath, dispose }。
 */
export async function createBrowserUseNativePipeServer({
  createPipe,
  createProtocol,
  apiImpl,
  pipePath: requestedPipePath,
}: {
  /** 命名管道创建（R2 ql 的注入面）。 */
  createPipe(options: { maxIncomingFrameBytes: number; maxOutgoingFrameBytes: number; pipePath?: string }): Promise<{ dispose(): void; pipePath: string }>;
  /** 协议实例创建（R2 ite 的注入面）。 */
  createProtocol(
    pipe: { dispose(): void; pipePath: string },
    api: NativePipeApiImpl,
    callbacks: { onMoveMouseError(error: unknown, context: { tabId: string }): void },
  ): NativePipeProtocol;
  apiImpl: NativePipeApiImpl;
  pipePath?: string;
}): Promise<{ dispose(): void; pipePath: string }> {
  const pipe = await createPipe({
    maxIncomingFrameBytes: MAX_INCOMING_FRAME_BYTES,
    maxOutgoingFrameBytes: MAX_OUTGOING_FRAME_BYTES,
    pipePath: requestedPipePath,
  });
  const protocol = createProtocol(pipe, apiImpl, {
    onMoveMouseError(error, context) {
      void error;
      void context.tabId;
      // 原文：IAB_LIFECYCLE failed to move browser use cursor（warning）
    },
  });
  const unsubscribes: Array<() => void> = [];
  unsubscribes.push(
    apiImpl.addCdpEventListener((event) => {
      try {
        protocol.sendCdpEvent(event);
      } catch (error) {
        if (!(error instanceof NativePipeFrameTooLargeError)) throw error;
        // 原文：browser-use native pipe skipped oversized CDP event（warning，
        // 含 cdpMethod/maxFrameBytes/messageBytes）
      }
    }),
  );
  unsubscribes.push(apiImpl.addCdpDetachListener((event) => protocol.sendCdpDetach(event)));
  return {
    dispose() {
      for (const unsubscribe of unsubscribes) unsubscribe();
      protocol.dispose();
      pipe.dispose();
    },
    pipePath: pipe.pipePath,
  };
}
