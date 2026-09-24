// 启动变更检测（原版 22833-22850 区段）。
//
// StartupChanges 收集「自上次运行以来环境是否变化」的检查项，供 jO 装配时
// 决定是否跳过/重做某些一次性行为（如协议重注册、runtime 重装）。支持两类：
//   - register(snapshotPromise, sampler)：定期采样并与首帧快照 deep-equal
//     （vendored lodash isEqual，@chunk/shared 的 Ld，原 XC.default）比较，
//     不等即视为有变化；
//   - registerCheck(fn)：自定义布尔检查。
//
// hasChanges(capture)：先跑自定义检查（任一为真即短路），再捕获一次快照
// 交给所有已注册的比较器。

import { Ld as isEqualModule } from "@chunk/shared";

/**
 * vendored lodash isEqual（2 参 deep equal）。
 * `Ld` 是 rolldown 惰性 CJS 模块包装（调用时忽略实参、返回 module.exports），
 * 必须 `Ld()` 取出真正的比较函数——原版 `XC = e.a(n.Ld())`、使用
 * `XC.default`。注意：直接 `import { Ld as isEqual }` 后 `isEqual(a, b)`
 * 得到的是模块导出（恒真值），是比较函数误用的常见坑。
 */
const isEqual = isEqualModule() as (a: unknown, b: unknown) => boolean;

/** 快照捕获函数（由调用方提供，如读取启动配置）。 */
export type SnapshotCapture<T = unknown> = () => Promise<T>;

/** 启动变更检测器。 */
export class StartupChanges {
  private checks: Array<(snapshot: unknown) => Promise<boolean>> = [];
  private customChecks: Array<() => boolean> = [];

  /** 注册自定义布尔检查（优先于快照比较）。 */
  registerCheck(check: () => boolean): void {
    this.customChecks.push(check);
  }

  /**
   * 注册快照比较：startupSnapshot 为启动时的首帧（promise，可能失败——
   * 失败按 false 参与比较），sampler 每次检查时重新采样当前值（可同步或
   * 异步），deep-equal 不等即视为有变化。
   */
  register(startupSnapshot: Promise<unknown>, sampler: (snapshot: unknown) => unknown): void {
    this.checks.push(async (snapshot) => {
      let [initial, current] = await Promise.all([startupSnapshot, sampler(snapshot)]);
      return !isEqual(initial, current);
    });
  }

  /** 是否存在任何启动以来的变化。 */
  async hasChanges(capture: SnapshotCapture): Promise<boolean> {
    if (this.customChecks.some((check) => check())) return true;
    let snapshot = await capture();
    let results = await Promise.all(this.checks.map((check) => check(snapshot)));
    return results.some((changed) => changed);
  }
}
