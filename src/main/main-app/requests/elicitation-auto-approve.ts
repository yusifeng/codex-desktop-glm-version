// elicitation 自动批准流（openai/userVerification 模式）。
//
// 原版 main-C-Mhak1n.ts 37,137-37,248（G_e/K_e/q_e）。`extends n.Uf`。
//
// G_e（AutoApprovedElicitationFlow）：对 app-server 的
// mcpServer/elicitation/request（mode = openai/userVerification）发起
// host.begin → wait → accept 的自动批准流；期间任一失效条件（请求完成/
// 会话移除/turn 中断/stream 角色变 follower/不再 pending）触发 cancel。
// K_e：工厂——判定是否需要自动批准、装配订阅与 complete/release 回调。
// q_e：通用 dispose 句柄。

import { Ac as promiseWithResolvers, Uf as EventEmitter } from "@chunk/shared";
// Gv（elicitation 响应应用）：定义于请求合成簇（36,839-37,136，尚未重写）。
import { Gv as applyMcpServerElicitationCancel } from "./item-synthesis";

/** 自动批准的 host 面（装配注入的 elicitation 端点）。 */
export interface ElicitationHost {
  begin(request: {
    hostId: string;
    conversationId: string;
    requestId: string;
  }): Promise<{
    cancel(): void;
    wait(): Promise<any>;
    accept(): Promise<boolean>;
    [Symbol.dispose](): void;
  }>;
}

/** 自动批准流的宿主参数（K_e 装配）。 */
export interface AutoApproveElicitationParams {
  host: ElicitationHost;
  hostId: string;
  conversationId: string;
  requestId: string;
  isPending(): boolean;
  subscribe(onInvalidated: () => void): () => void;
  complete(action: `accept` | `cancel`): void;
  release(): void;
}

/** 自动批准结果。 */
export type AutoApproveElicitationResult =
  | { status: `accepted` }
  | { status: `cancelled` }
  | { status: `failed`; error: { type: string; reason: string } };

/**
 * 自动批准流（原版 G_e）。构造即启动；wait() 等待终态；cancel/dispose
 * 幂等（重复取消安全）。
 */
export class AutoApprovedElicitationFlow extends EventEmitter {
  #active = true;
  #hostHandle: { cancel(): void; [Symbol.dispose](): void } | null = null;
  #cancelled = promiseWithResolvers();
  #result: Promise<AutoApproveElicitationResult>;
  #params: AutoApproveElicitationParams;
  #unsubscribeInvalidation: () => void;

  constructor(params: AutoApproveElicitationParams) {
    super();
    this.#params = params;
    this.#unsubscribeInvalidation = params.subscribe(() => this.cancel());
    this.#result = Promise.race([this.#run(), this.#cancelled.promise]).finally(() => {
      this.#active = false;
      this.#unsubscribeInvalidation();
      this.#hostHandle?.[Symbol.dispose]();
      params.release();
    });
  }

  wait(): Promise<AutoApproveElicitationResult> {
    return this.#result;
  }

  cancel(): void {
    if (this.#active) {
      this.#active = false;
      this.#hostHandle?.cancel();
      this.#cancelled.resolve({ status: `cancelled` });
    }
  }

  [Symbol.dispose](): void {
    this.cancel();
  }

  async #run(): Promise<AutoApproveElicitationResult> {
    let params = this.#params;
    if (!params.isPending()) return { status: `cancelled` };
    try {
      let hostHandle = await params.host.begin({
        hostId: params.hostId,
        conversationId: params.conversationId,
        requestId: params.requestId,
      });
      this.#hostHandle = hostHandle;
      if (!this.#active || !params.isPending())
        return (hostHandle.cancel(), hostHandle[Symbol.dispose](), { status: `cancelled` });
      let hostResult = await hostHandle.wait();
      if (!this.#active || !params.isPending()) return { status: `cancelled` };
      if (hostResult.status === `failed`) {
        this.#active = false;
        params.complete(`cancel`);
        return hostResult;
      }
      if (!(await hostHandle.accept()) || !this.#active || !params.isPending())
        return { status: `cancelled` };
      this.#active = false;
      params.complete(`accept`);
      return { status: `accepted` };
    } catch {
      if (!this.#active || !params.isPending()) return { status: `cancelled` };
      this.#active = false;
      params.complete(`cancel`);
      return { status: `failed`, error: { type: `failed`, reason: `providerError` } };
    }
  }
}

/**
 * 自动批准工厂（原版 K_e）：仅对 openai/userVerification 模式的
 * mcpServer/elicitation/request 且未在审批表中的请求创建流。
 */
export function createAutoApprovedElicitation({
  context,
  approvals,
  isActive,
  manager,
  host,
  conversationId,
  requestId,
}: {
  context: any;
  approvals: Map<any, AutoApprovedElicitationFlow>;
  isActive(): boolean;
  manager: any;
  host: ElicitationHost;
  conversationId: string;
  requestId: string;
}): AutoApprovedElicitationFlow {
  let request = (context as any).getConversationRequests(conversationId).find((entry: any) => entry.id === requestId);
  let eligible =
    request?.method === `mcpServer/elicitation/request` &&
    request.params.mode === `openai/userVerification` &&
    !approvals.has(request);
  let isPending = () =>
    eligible &&
    isActive() &&
    (context as any).getStreamRole(conversationId)?.role !== `follower` &&
    (context as any).getConversationRequests(conversationId).includes(request);
  let flow = new AutoApprovedElicitationFlow({
    host,
    hostId: (context as any).hostId,
    conversationId,
    requestId,
    isPending,
    subscribe: (onInvalidated: () => void) => {
      let removeCallback = (manager as any).addConversationCallback(conversationId, () => {
        if (!isPending()) onInvalidated();
      });
      let removeRemovedListener = (manager as any).addConversationRemovedListener(
        (removedId: string) => {
          if (removedId === conversationId) onInvalidated();
        },
      );
      let removeInterruptListener = (manager as any).addTurnInterruptStartedListener(
        (interruptedId: string) => {
          if (interruptedId === conversationId) onInvalidated();
        },
      );
      return () => {
        removeCallback();
        removeRemovedListener();
        removeInterruptListener();
      };
    },
    complete: (action: `accept` | `cancel`) => {
      if (
        isPending() &&
        request?.method === `mcpServer/elicitation/request`
      ) {
        if (action === `cancel`)
          applyMcpServerElicitationCancel(context as any, conversationId, requestId, {
            action: `cancel`,
            content: null,
            _meta: null,
          });
        else
          (context as any).applyMcpServerElicitationResponse(
            conversationId,
            requestId,
            request.params,
            `accept`,
          );
      }
    },
    release: () => {
      if (request != null && approvals.get(request) === flow) approvals.delete(request);
    },
  });
  if (eligible) approvals.set(request, flow);
  return flow;
}

/** 通用 dispose 句柄（原版 q_e）。 */
export class DisposableHandle extends EventEmitter {
  #dispose: (() => void) | null;

  constructor(dispose: () => void) {
    super();
    this.#dispose = dispose;
  }

  [Symbol.dispose](): void {
    let dispose = this.#dispose;
    this.#dispose = null;
    dispose?.();
  }
}
