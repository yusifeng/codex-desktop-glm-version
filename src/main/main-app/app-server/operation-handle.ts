// AppServerOperationHandle —— app-server 操作句柄（原版 Lv/Rv，
// main-C-Mhak1n.ts 36,502-36,528）。`extends n.Uf`。
//
// Lv：包装「操作 promise」（解构出 start 结果与 completion 两部分）；
// Rv：带 AbortController 的可取消变体（cancel/dispose 触发 abort）。

import { Uf as EventEmitter } from "@chunk/shared";

/** 操作结果（thread/start 类响应：start 字段 + completion）。 */
interface OperationResult {
  completion: any;
  [key: string]: unknown;
}

/** app-server 操作句柄（原版 Lv）。 */
export class AppServerOperationHandle extends EventEmitter {
  #operation: Promise<OperationResult>;

  constructor(operation: Promise<OperationResult>) {
    super();
    this.#operation = operation;
  }

  /** 操作的启动结果（不含 completion）。 */
  async getStartResult(): Promise<Omit<OperationResult, `completion`>> {
    let { completion, ...startResult } = await this.#operation;
    return startResult;
  }

  /** 等待操作完成（completion）；未启动（completion 为空）抛错。 */
  async waitForCompletion(): Promise<any> {
    let { completion } = await this.#operation;
    if (completion == null) throw Error(`App-server operation did not start`);
    return completion;
  }
}

/** 可取消的操作句柄（原版 Rv）：cancel/dispose 中止底层请求。 */
export class CancellableOperationHandle extends AppServerOperationHandle {
  #abortController: AbortController;

  constructor(operation: Promise<OperationResult>, abortController: AbortController) {
    super(operation);
    this.#abortController = abortController;
  }

  cancel(): void {
    this.#abortController.abort();
  }

  [Symbol.dispose](): void {
    this.#abortController.abort();
  }
}
