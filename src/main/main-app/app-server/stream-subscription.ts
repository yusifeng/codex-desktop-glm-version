// ConversationStreamSubscription —— app-server 会话流订阅包装。
//
// 原版 main-C-Mhak1n.ts 27,880-27,983（Sm + Cm）。
//
// Sm（`extends n.Uf`）：把 app-server 的 conversation 通知流订阅成可释放
// 的句柄。两个静态工厂：
//   - subscribeConversation：带背压合并——通知处理器（onNotification）抛错
//     时清空待处理队列、丢弃当前消息并「重置」（调用 reset 拉取当前快照）；
//     队列超过 262,144 字节同样重置；相邻 changes 通知串接；串行消费（一次
//     只有一个 m 在跑）；
//   - subscribe：直通订阅（每条通知立即回调）。
// 两者的连接对象支持 dup()（Cm 判定）时才走包装路径——dup 出独立游标，
// 订阅释放/dispose 或 RPC 断开（onRpcBroken）时自动退订。原版的
// `a.en()` using-scope 降级（TS await using）重写为原生 using。

import { Uf as EventEmitter } from "@chunk/shared";

/** 流通知连接面（app-server conversation stream 连接）。 */
export interface ConversationStreamConnection {
  /** 复制出独立游标的订阅连接（不支持 dup 的连接走直通订阅）。 */
  dup?(): {
    (notification: ConversationStreamNotification): Promise<any> & Disposable;
    onRpcBroken(callback: () => void): void;
    [Symbol.dispose](): void;
  };
  [key: string]: unknown;
}

/** 是否支持 dup（原版 Cm）。 */
function supportsDup(connection: ConversationStreamConnection): boolean {
  return `dup` in connection;
}

/** 会话流通知的宽松类型（changes/reset/started…）。 */
export interface ConversationStreamNotification {
  type: string;
  changes?: any[];
  [key: string]: unknown;
}

/** 背压队列上限（字节，原版 262,144）。 */
const MAX_QUEUED_NOTIFICATION_BYTES = 262_144;

/**
 * 会话流订阅句柄（原版 Sm）。unsubscribe/dispose 幂等。
 */
export class ConversationStreamSubscription extends EventEmitter {
  private cleanup: (() => void) | null;

  constructor(cleanup: () => void) {
    super();
    this.cleanup = cleanup;
  }

  /**
   * 订阅会话流（带背压合并，原版 subscribeConversation）。
   *
   * @param connection 流连接（支持 dup）
   * @param subscribe 订阅函数（回调接收通知；返回反订阅函数）
   * @param reset 错误重置后的快照拉取函数
   */
  static subscribeConversation(
    connection: ConversationStreamConnection,
    subscribe: (onNotification: (notification: ConversationStreamNotification) => void) => () => void,
    reset: () => ConversationStreamNotification | null,
  ): ConversationStreamSubscription {
    if (!supportsDup(connection)) return subscribe(connection as any) as any;
    let stream = connection.dup!();
    let queued: ConversationStreamNotification[] = [];
    let queuedBytes = 0;
    let needsReset = false;
    let consuming = false;
    let active = true;
    let resetUsingDispose: (Promise<any> & Disposable) | null = null;
    let unsubscribeSource: (() => void) | null = null;
    let subscription = new ConversationStreamSubscription(() => {
      active = false;
      queued.length = 0;
      unsubscribeSource?.();
      resetUsingDispose?.[Symbol.dispose]();
      stream[Symbol.dispose]();
    });
    let consume = async (initial: ConversationStreamNotification | null) => {
      consuming = true;
      let notification = initial;
      try {
        for (; active && notification != null; ) {
          try {
            let scope = createUsingScope();
            try {
              let ack = scope.using(stream(notification));
              resetUsingDispose = ack;
              await ack;
            } catch (error) {
              scope.setError(error);
            } finally {
              scope.dispose();
            }
          } catch (error) {
            if (!active || notification.type === `reset`) throw error;
            // 处理失败：丢弃积压，改为拉取快照重放。
            queued.length = 0;
            queuedBytes = 0;
            needsReset = true;
          }
          resetUsingDispose = void 0;
          if (!active) break;
          if (needsReset) {
            needsReset = false;
            notification = reset();
          } else {
            notification = queued.shift();
            if (queued.length === 0) queuedBytes = 0;
          }
        }
      } catch {
        subscription.unsubscribe();
      } finally {
        consuming = false;
      }
    };
    try {
      unsubscribeSource = subscribe((notification) => {
        if (!active || needsReset) return;
        if (!consuming) {
          void consume(notification);
          return;
        }
        // 背压：超限即丢弃积压并改为快照重置。
        let size = JSON.stringify(notification).length;
        if (queuedBytes + size > MAX_QUEUED_NOTIFICATION_BYTES) {
          queued.length = 0;
          queuedBytes = 0;
          needsReset = true;
          return;
        }
        let last = queued.at(-1);
        if (last?.type === `changes` && notification.type === `changes`)
          last.changes!.push(...notification.changes!);
        else
          queued.push(
            notification.type === `changes`
              ? { type: `changes`, changes: [...notification.changes!] }
              : notification,
          );
        queuedBytes += size;
      });
    } catch (error) {
      subscription.unsubscribe();
      throw error;
    }
    stream.onRpcBroken(() => subscription.unsubscribe());
    return subscription;
  }

  /** 直通订阅（原版 subscribe）：每条通知立即回调。 */
  static subscribe(
    connection: ConversationStreamConnection,
    subscribe: (onNotification: (notification: ConversationStreamNotification) => void) => () => void,
  ): ConversationStreamSubscription {
    if (!supportsDup(connection)) return subscribe(connection as any) as any;
    let stream = connection.dup!();
    let unsubscribeSource: (() => void) | null;
    try {
      unsubscribeSource = subscribe((notification) => {
        let scope = createUsingScope();
        try {
          scope.using(stream(notification));
        } catch (error) {
          scope.setError(error);
        } finally {
          scope.dispose();
        }
      });
    } catch (error) {
      stream[Symbol.dispose]();
      throw error;
    }
    let subscription = new ConversationStreamSubscription(() => {
      unsubscribeSource!();
      stream[Symbol.dispose]();
    });
    stream.onRpcBroken(() => subscription.unsubscribe());
    return subscription;
  }

  unsubscribe(): void {
    let cleanup = this.cleanup;
    this.cleanup = null;
    cleanup?.();
  }

  [Symbol.dispose](): void {
    this.unsubscribe();
  }
}

/**
 * 原版 `a.en()`（bootstrap vendor 的 TS using/await-using 降级 helper tC）
 * 的同步路径等价实现：
 *   - using(resource)：登记 resource 的 Symbol.dispose（无可释放方法抛
 *     TypeError，与 tC 一致）；
 *   - setError(error)：暂存错误；
 *   - dispose()：逆序释放全部已登记资源后，若有暂存错误同步重抛
 *     （tC 的同步 disposable 路径行为）。
 */
interface UsingScope {
  using<T>(resource: T): T;
  setError(error: unknown): void;
  dispose(): void;
}

function createUsingScope(): UsingScope {
  let registered: { resource: any; dispose: () => any }[] = [];
  let stashedError: { error: unknown } | null = null;
  return {
    using<T>(resource: T): T {
      if (resource != null && Object(resource) === resource) {
        let dispose = (resource as any)[Symbol.dispose];
        if (typeof dispose != `function`)
          throw TypeError(`using declarations can only be used with objects, functions, null, or undefined.`);
        registered.push({ resource, dispose });
      }
      return resource;
    },
    setError(error: unknown) {
      stashedError = { error };
    },
    dispose() {
      for (let entry of registered) entry.dispose.call(entry.resource);
      registered.length = 0;
      if (stashedError != null) throw stashedError.error;
    },
  };
}

// ---------------------------------------------------------------------------
// 兼容导出（原版压缩名，供 R4 manager 等按旧名 import；R4 切换语义名后移除）
// ---------------------------------------------------------------------------

export { ConversationStreamSubscription as Sm };
