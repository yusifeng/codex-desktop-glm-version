// shared chunk：RPC 桩/连接核心（Electron 经 MessagePort 的 RPC 家族）。
//
// 对应 src-DldfpmrL.ts 的 L40-330 + L2183-2210 区段（RPC 基础设施）：
//   - D（= E ? E.RpcTarget : class{}）：RpcTarget 基类（dist-wQAv1pJP.js
//     的 RpcTarget，无则空类）
//   - se = RpcStub（L244）：Proxy 包装的 RPC 桩——hook + pathIfPromise；
//     dup/onRpcBroken/map（sendMap）；原型锁定（setPrototypeOf 抛错）
//   - ce = RpcPromise（then/catch/finally 委托 me() 的 Promise 桥）
//   - Ge = RpcConnection（L2183）：MessagePort 双端连接——
//     getRemoteMain/getStats/drain；构造 = We（通道）+ se（主对象桩）
//   - Ke = connectRpc（L2207）：new Ge(new qe(port), mainObject).getRemoteMain()
//   - mt = AbortableFetchDispatcher（L2691，extends dt）：#e Map<url,
//     AbortController> + #t fetch 实现；fetch 三参（url/options/signal）+
//     response body TransformStream 包装（pt：响应体消费完触发 onDone）+
//     cancel + Symbol.dispose
//   - tn = ABORTED（L3350）：Object.freeze({ status: 'aborted' })
//
// 这是 shared 692 导出的地基族（Uf/Hf/Vf/Wf/Bf/zf 六个别名被
// 145+ 个 main-app 模块 import）。

/** RPC 目标基类（原 `D`：dist chunk 的 RpcTarget 或空类）。 */
export declare class RpcTarget {
  [key: string]: unknown;
}

/** RPC 桩（原 `se`）。 */
export interface RpcStubLike<T = unknown> {
  dup(): RpcStubLike<T>;
  map<U>(mapper: (value: T) => U): RpcStubLike<U>;
  onRpcBroken(handler: () => void): void;
}

/** RPC 连接（原 `Ge`）。 */
export interface RpcConnectionLike {
  drain(): Promise<void> | void;
  getRemoteMain(): RpcStubLike;
  getStats(): unknown;
}

/** MessagePort 连接（原 `Ke` 工厂 + qe 通道适配）。 */
export function connectRpc(
  port: { start(): void; addEventListener(type: string, listener: (event: unknown) => void): void; postMessage(data: unknown): void },
  mainObject: unknown,
  options: Record<string, unknown> = {},
): RpcStubLike {
  void port;
  void mainObject;
  void options;
  throw new Error("not wired: RPC wire protocol in shared chunk");
}

/** 可中止的 fetch 分发器（原 `mt`，extends RpcTarget）。 */
export class AbortableFetchDispatcher {
  private readonly controllers = new Map<string, AbortController>();

  constructor(
    private readonly fetchImpl: (
      url: string,
      options: Record<string, unknown>,
      signal: AbortSignal,
      context: unknown,
    ) => Promise<{ response?: Response } | Record<string, unknown>>,
  ) {}

  async fetch(url: string, options: Record<string, unknown>, context: unknown): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    this.controllers.set(url, controller);
    let onBodyComplete: () => void = () => this.controllers.delete(url);
    try {
      const result = await this.fetchImpl(url, options, controller.signal, context);
      if ("response" in result && result.response != null && result.response.body != null) {
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

// 兼容导出（shared chunk 的压缩名，main-app 模块以 `Uf as EventEmitterBase`
// 等别名 import）：
//   Uf = dt（RpcTarget 基类）、Hf = lt（RpcStub）、Vf = ut（RpcConnection）、
//   Wf = ft（connectRpc）、Bf = mt（AbortableFetchDispatcher）、zf = tn（ABORTED）
export {
  RpcTarget as Uf,
  type RpcStubLike as Hf,
  type RpcConnectionLike as Vf,
  connectRpc as Wf,
  AbortableFetchDispatcher as Bf,
  ABORTED as zf,
};
