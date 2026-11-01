// 自动化模型路由解析（原版 Ln，2,970-2,977）。
//
// 职责：从 statsig 动态配置 `codex-app-model-routing` 读取默认自动化模型，
// 读取失败时回落 shared 的默认值（n.Sd）。自动化运行（automations/index.ts）
// 与 82k 一带的 habitat 服务共用。
//
// 依赖约束：@chunk/shared 的动态配置读取器；无副作用。

import { Cd as readDynamicConfig, Sd as DEFAULT_MODELS } from "@chunk/shared";

/** statsig 客户端的最小面（getClient → getDynamicConfig）。 */
export interface StatsigLike {
  getClient?(): {
    getDynamicConfig(key: string): { value: unknown };
  } | null;
}

/**
 * 解析默认自动化模型（原 Ln，2,970-2,977）：statsig 不可用或配置缺失时
 * 返回 shared 的默认模型。
 */
export async function resolveAutomationModelRouting(statsig: StatsigLike | null | undefined) {
  try {
    let client = await statsig?.getClient();
    return readDynamicConfig(client?.getDynamicConfig(`codex-app-model-routing`).value);
  } catch {
    return DEFAULT_MODELS;
  }
}
