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

import { memoizedTaggedLogger } from "@chunk/logger";
import { ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER } from "./iab-api.js";
import { BrowserUseClient } from "./rpc-client";
import { PipeFrameLimitError } from "../native-pipe/protocol";
import { createNativePipeServer } from "../native-pipe/server";

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
  tabId: number;
  toolName: string;
  turn_id: string;
  parentCallId?: string;
}

/** CDP 事件形态。 */
export interface NativePipeCdpEvent {
  method: string;
  params?: unknown;
  sessionId?: string;
}

/** 帧超限错误（R2 的 `Bl`，此处声明消费形态）。 */
export class NativePipeFrameTooLargeError extends PipeFrameLimitError {
  constructor(
    public maxFrameBytes: number,
    public messageBytes: number,
  ) {
    super(messageBytes, maxFrameBytes);
    this.name = "NativePipeFrameTooLargeError";
  }
}

/** IAB API 面（pipe 后端转发的目标——见 iab-api.ts）。 */
export interface NativePipeApiImpl {
  moveMouse(params: unknown): unknown;
  addCdpEventListener(listener: (event: NativePipeCdpEvent) => void): () => void;
  addCdpDetachListener(listener: (event: { tabId: string }) => void): () => void;
  addPageEventListener(listener: (event: { type: string; [key: string]: unknown }) => void): () => void;
  notifyWebMcpToolInvoked(invocation: WebMcpToolInvocation): void;
  dispose(): void;
  [key: string]: any;
  [key: symbol]: unknown;
}

/** 协议实例面（R2 的 `ite` 类消费面）。 */
export interface NativePipeProtocol {
  sendCdpEvent(event: NativePipeCdpEvent): void;
  sendCdpDetach(event: { tabId: string }): void;
  sendPageEvent(event: { type: string; [key: string]: unknown }): void;
  sendDownloadChange(change: { path: string; tabId: string }): void;
}

const logger = memoizedTaggedLogger(`browser-use-native-pipe-server`);

function parseWebMcpToolInvocation(value: unknown): WebMcpToolInvocation | null {
  if (typeof value !== `object` || value == null || Array.isArray(value)) return null;
  const invocation = value as Record<string, unknown>;
  if (
    typeof invocation.session_id !== `string` || invocation.session_id.length === 0 ||
    typeof invocation.turn_id !== `string` || invocation.turn_id.length === 0 ||
    typeof invocation.tabId !== `number` || !Number.isInteger(invocation.tabId) || invocation.tabId <= 0 ||
    typeof invocation.toolName !== `string` || invocation.toolName.length === 0 ||
    (invocation.parentCallId != null && typeof invocation.parentCallId !== `string`)
  ) return null;
  return invocation as unknown as WebMcpToolInvocation;
}

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
  nativePipeDirectory,
  maxOutgoingFrameBytes = MAX_OUTGOING_FRAME_BYTES,
  pipePath: requestedPipePath,
  socketPeerAuthorizer,
}: {
  /** 测试/嵌入方可替换管道工厂；生产默认使用完整 native-pipe owner。 */
  createPipe?: (options: Record<string, unknown>) => Promise<any>;
  /** 测试/嵌入方可替换协议；生产默认使用 BrowserUseClient。 */
  createProtocol?: (
    pipe: any,
    api: NativePipeApiImpl,
    callbacks: {
      onMoveMouseError(error: unknown, context: { tabId: string }): void;
      onWebMcpToolInvoked(invocation: unknown): void;
    },
  ) => NativePipeProtocol;
  apiImpl: NativePipeApiImpl;
  nativePipeDirectory?: string;
  maxOutgoingFrameBytes?: number;
  pipePath?: string;
  socketPeerAuthorizer: (socket: unknown) => { authorized: boolean; reason?: string };
}): Promise<{ dispose(): Promise<void>; pipePath: string }> {
  let pipe: any;
  try {
    pipe = await (createPipe ?? createNativePipeServer)({
      nativePipeDirectory,
      maxIncomingFrameBytes: MAX_INCOMING_FRAME_BYTES,
      maxOutgoingFrameBytes,
      pipePath: requestedPipePath,
      socketPeerAuthorizer,
      events: {
        onListening(pipePath: string) {
          logger().info(`browser-use native pipe listening`, { safe: {}, sensitive: { pipePath } });
        },
        onAuthorizationError(error: unknown) {
          logger().warning(`browser-use native pipe peer authorization failed`, { safe: {}, sensitive: { error } });
        },
        onRejectedSocket(result: { reason?: string }) {
          logger().warning(`browser-use native pipe rejected socket peer`, {
            safe: { reason: result.reason ?? `unauthorized` },
            sensitive: {},
          });
        },
        onSocketError(error: unknown) {
          logger().warning(`browser-use native pipe socket error`, { safe: {}, sensitive: { error } });
        },
      },
    });
  } catch (error) {
    apiImpl.dispose();
    throw error;
  }
  const protocol = (
    createProtocol ?? ((transport, handler, options) => new BrowserUseClient(transport, handler, options))
  )(pipe, apiImpl, {
    onMoveMouseError(error, context) {
      logger().warning(`IAB_LIFECYCLE failed to move browser use cursor`, {
        safe: { tabId: context.tabId },
        sensitive: { error },
      });
    },
    onWebMcpToolInvoked(invocation) {
      const parsed = parseWebMcpToolInvocation(invocation);
      if (parsed != null) apiImpl.notifyWebMcpToolInvoked(parsed);
    },
  });
  const unsubscribes: Array<() => void> = [];
  unsubscribes.push(
    apiImpl.addCdpEventListener((event) => {
      try {
        protocol.sendCdpEvent(event);
      } catch (error) {
        if (!(error instanceof PipeFrameLimitError)) throw error;
        logger().warning(`browser-use native pipe skipped oversized CDP event`, {
          safe: {
            cdpMethod: event.method,
            maxFrameBytes: error.maxFrameBytes,
            messageBytes: error.messageBytes,
          },
          sensitive: {},
        });
      }
    }),
  );
  unsubscribes.push(apiImpl.addCdpDetachListener((event) => protocol.sendCdpDetach(event)));
  unsubscribes.push(apiImpl.addPageEventListener((event) => protocol.sendPageEvent(event)));
  const addDownloadListener = apiImpl[ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER];
  if (typeof addDownloadListener === "function") {
    unsubscribes.push(
      (addDownloadListener as (listener: (change: { path: string; tabId: string }) => void) => () => void)((change) =>
        protocol.sendDownloadChange(change),
      ),
    );
  }
  return {
    async dispose() {
      for (const unsubscribe of unsubscribes) unsubscribe();
      apiImpl.dispose();
      if (typeof pipe.close === `function`) await pipe.close();
      else await pipe.dispose?.();
    },
    pipePath: pipe.pipePath,
  };
}
