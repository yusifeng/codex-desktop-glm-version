// assert-never —— 穷尽性检查辅助。
//
// 原版：app/webview/assets/assert-never-a6e685100dc6.js（197B）。
// 两个导出：n=空初始化器；t=assertNever（Unexpected value 抛错）。

/** assertNever（原 `t`）。 */
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

/** 空初始化器（原 `n`）。 */
function initializeAssertNever(): void {}

export { initializeAssertNever as n, assertNever as t };
