// callback-utility —— 延迟执行回调、限制等待时间并隔离遥测失败。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
void runtimeChunk;

interface CallbackTelemetry {
  log(level: "warn", message: string, context: { error: unknown }): void;
  stats: { increment(metric: "callback_error"): void };
}

function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Promise timed out")),
      timeoutMs,
    );
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch(reject);
  });
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function runDeferredCallback<
  T extends CallbackTelemetry | null | undefined,
>(
  telemetry: T,
  callback: (telemetry: T) => unknown | PromiseLike<unknown>,
  delayMs: number,
): Promise<T> {
  await delay(delayMs);
  try {
    await withTimeout(Promise.resolve(callback(telemetry)), 1_000);
  } catch (error) {
    telemetry?.log("warn", "Callback Error", { error });
    telemetry?.stats.increment("callback_error");
  }
  return telemetry;
}

function initializeCallbackUtility(): void {}

export {
  runDeferredCallback as n,
  withTimeout as r,
  initializeCallbackUtility as t,
};
