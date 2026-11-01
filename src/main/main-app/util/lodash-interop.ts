// lodash 系工具的 interop 缝合层。
//
// 原版 main-C 通过 shared chunk 的 rolldown 惰性 CJS 模块 + e.a interop 取
// lodash 部件：
//   line 121  `G  = e.a(n.Ld())` → `(0, G.default)(a, b)`    = isEqual（fast-equals 深比较，
//              见 @chunk/main-shared 的 d.ts 注释——并行 agent 已确认来源）
//   line 763  `Ft = e.a(n.Oo())` → `(0, Ft.default)(arr, p)` = findLastIndex
//   line 764  `It = e.a(n.Do())` → `(0, It.default)(arr, p)` = findLast
//   line 24,788 `pp = e.a(n.dr())` → `pp.default(fn, {max, promise})` = memoize
//              （带 {max, promise} 选项的 memoize 库，经 shared 提供）
//
// 本模块把这些调用点收敛为语义名。shared 重写后此层移除。

import { isDeepStrictEqual } from "node:util";
import { Do as requireFindLast, Oo as requireFindLastIndex, dr as requireMemoize } from "@chunk/shared";

/** 原版 G.default：深度相等比较。 */
export const deepEqual: (a: unknown, b: unknown) => boolean = isDeepStrictEqual;

/** 原版 It.default：findLast——取最后一个满足谓词的元素。 */
export const findLast: <T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean,
) => T | undefined = (requireFindLast() as { default: any }).default;

/** 原版 Ft.default：findLastIndex——取最后一个满足谓词的元素下标。 */
export const findLastIndex: <T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean,
) => number = (requireFindLastIndex() as { default: any }).default;

/** 原版 pp.default：memoize（支持 {max, promise} 选项，随 store 实例生命周期）。 */
export const memoize: <T extends (...args: any[]) => any>(
  fn: T,
  options?: { max?: number; promise?: boolean },
) => T = (requireMemoize() as { default: any }).default;

/** lodash cloneDeep 的窄用途兼容层；当前调用点均为可 structured-clone 的状态对象。 */
export function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}

/** lodash omit：浅复制对象并删除指定自有键。 */
export function omit<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Omit<T, K> {
  let result = { ...value };
  for (let key of keys) delete result[key];
  return result;
}

/** lodash uniqBy：保留每个 iteratee key 首次出现的元素。 */
export function uniqBy<T, K>(values: readonly T[], iteratee: (value: T) => K): T[] {
  let seen = new Set<K>();
  let result: T[] = [];
  for (let value of values) {
    let key = iteratee(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
