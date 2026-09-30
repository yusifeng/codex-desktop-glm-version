// immer 缝合层。
//
// 原版在 main-C-Mhak1n.ts 27,983-28,626 内嵌了完整 vendored immer
// （Ihe 类 + Patches 插件），并在 28,623-28,626 创建全局单例：
//   var ph = new Ihe(),
//     mh = ph.produce,                // 全文件 700+ 处调用
//     Rhe = ph.produceWithPatches.bind(ph),
//     zhe = ph.applyPatches.bind(ph);
// 本区（R3）消费：mh（produce）、zhe（applyPatches，Yge follower patch 应用）、
// Rhe（produceWithPatches，T_e 状态 diff）以及 Ohe（= draft[Em].base_，即
// immer 的 original()，Kge 边界合并里读取实体的 pre-draft 基值）。
//
// 重写决策（合同 §vendored 带）：immer 整体引上游 npm 包而非重写 vendored
// 源码。上游 immer 默认导出 produce；produceWithPatches/applyPatches/original
// 为具名导出，行为与 vendored 版本一致（autoFreeze 默认开启，Patches 插件
// 在首次 produceWithPatches/applyPatches 时按需注册）。
//
// 注意：immer 尚未 install（待 micromark/immer/lodash/marked vendored 带统一
// 切换到 npm 依赖时一并处理），故本文件 @ts-nocheck，导出类型为宽松。
// 切换完成后移除 @ts-nocheck 并补精确类型。

// @ts-nocheck
import {
  produce as immerProduce,
  produceWithPatches as immerProduceWithPatches,
  applyPatches as immerApplyPatches,
  original as immerOriginal,
  isDraft as immerIsDraft,
  current as immerCurrent,
  type Draft,
  type Patch,
} from "immer";

/** 原版 mh：全局 immer 单例的 produce（autoFreeze 开启）。 */
export const produce: <T>(base: T, recipe: (draft: Draft<T>) => void) => T = immerProduce;
/** 原版 Rhe：produceWithPatches（状态 diff 计算的入口）。 */
export const produceWithPatches: <T>(
  base: T,
  recipe: (draft: Draft<T>) => void,
) => [T, Patch[], Patch[]] = immerProduceWithPatches;
/** 原版 zhe：applyPatches（follower 端 IPC patch 应用）。 */
export const applyPatches: <T>(base: T, patches: Patch[]) => T = immerApplyPatches;
/** 原版 Ohe（28,047，draft[Em].base_）：读取 draft 的原始基值。 */
export const original: <T>(value: T) => T | undefined = immerOriginal;
/** 原版 Am（28,029）：isDraft。 */
export const isDraft: (value: unknown) => boolean = immerIsDraft;
/** 原版 dh（28,443）：current——把 draft 解为普通对象（未修改时直接返回 base）。 */
export const current: <T>(value: T) => T = immerCurrent;

/**
 * 原版 hh（28,627）：恒等函数。原是 immer 冻结包装的占位（tree-shaking 后
 * 退化为 `e => e`），Kge 边界合并中作为实体写入包装使用。保留为显式语义名。
 */
export function freezeIdentity<T>(value: T): T {
  return value;
}

/** 原压缩导出名兼容。 */
export { freezeIdentity as hh };
