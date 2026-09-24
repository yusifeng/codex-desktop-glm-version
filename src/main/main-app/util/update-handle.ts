// UpdateHandle —— 一次性回调更新句柄（原版 qhe，29,516-29,528）。
//
// `extends n.Uf`（shared chunk 的 EventEmitter 基类）。持有单个 update
// 回调：update(value) 转发当前值；Symbol.dispose 释放（此后 update 为
// no-op，并以 null 通知最后一次）。用于「注册窗口活跃性 / 订阅可更新
// 句柄」这类需要显式生命周期 + 结构化释放的场景（Yge.registerWindowActivity
// 等消费）。

import { Uf as EventEmitter } from "@chunk/shared";

export class UpdateHandle extends EventEmitter {
  #update: ((value: unknown) => void) | null;

  constructor(update: (value: unknown) => void) {
    super();
    this.#update = update;
  }

  /** 转发更新；已释放后为 no-op。 */
  update(value: unknown): void {
    this.#update?.(value);
  }

  [Symbol.dispose](): void {
    let update = this.#update;
    this.#update = null;
    update?.(null);
  }
}
