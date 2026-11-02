// shared chunk：RPC 桩/连接核心（Electron 经 MessagePort 的 RPC 家族）。
//
// 对应 src-DldfpmrL.ts 的 L40-330 + L2183-2210 区段（RPC 基础设施）：
//   - D（= E ? E.RpcTarget : class{}）：RpcTarget 基类（dist-wQAv1pJP.js
//     的 RpcTarget，无则空类）
//   - mt = AbortableFetchDispatcher（L2691，extends dt）：#e Map<url,
//     AbortController> + #t fetch 实现；fetch 三参（url/options/signal）+
//     response body TransformStream 包装（pt：响应体消费完触发 onDone）+
//     cancel + Symbol.dispose
//   - tn = ABORTED（L3350）：Object.freeze({ status: 'aborted' })
//
// Wire protocol is supplied by the same Cap'n Web package used by the release.
import {
  RpcSession,
  RpcStub,
  RpcTarget as CapnWebRpcTarget,
  newMessagePortRpcSession,
} from "capnweb";

/** RPC 目标基类（原 `D`：dist chunk 的 RpcTarget，无则空类回退）。 */
export class RpcTarget extends CapnWebRpcTarget {}

/** 可中止的 fetch 分发器（原 `mt`，extends RpcTarget）。 */
export class AbortableFetchDispatcher {
  private readonly controllers = new Map<string, AbortController>();

  constructor(
    private readonly fetchImpl: (
      url: string,
      options: Record<string, unknown>,
      signal: AbortSignal,
      context: unknown,
    ) => Promise<Record<string, unknown>>,
  ) {}

  async fetch(url: string, options: Record<string, unknown>, context: unknown): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    this.controllers.set(url, controller);
    let onBodyComplete: () => void = () => this.controllers.delete(url);
    try {
      const result = (await this.fetchImpl(url, options, controller.signal, context)) as { response?: Response } & Record<string, unknown>;
      if (result.response != null && result.response.body != null) {
        const { readable, writable } = new TransformStream();
        void result.response.body.pipeTo(writable, { signal: controller.signal }).catch(() => {}).finally(onBodyComplete);
        return { response: new Response(readable, { status: result.response.status, statusText: result.response.statusText, headers: result.response.headers }) };
      }
      onBodyComplete();
      return result;
    } catch (error) {
      onBodyComplete();
      throw error;
    }
  }

  cancel(url: string): void {
    this.controllers.get(url)?.abort();
  }

  [Symbol.dispose](): void {
    for (const controller of this.controllers.values()) controller.abort();
    this.controllers.clear();
  }
}

/** 中止态常量（原 `tn`）。 */
export const ABORTED = Object.freeze({ status: "aborted" } as const);

// 兼容导出：Uf/Bf/zf 可安全独立；Hf/Vf/Wf wire protocol 在
// chunk-modules.d.ts 中直接声明为 preserved shared-chunk exports。
export {
  RpcStub,
  RpcSession,
  newMessagePortRpcSession,
  RpcTarget as Uf,
  AbortableFetchDispatcher as Bf,
  ABORTED as zf,
  RpcStub as Hf,
  RpcSession as Vf,
  newMessagePortRpcSession as Wf,
};
