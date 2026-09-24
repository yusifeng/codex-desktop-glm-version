// in-app browser 可用性探测 —— 原 main-C-Mhak1n.ts 13,988-14,017 行
// （`Kse`→插件名、`qse`→分页大小、`Jse`→注册探测、`Yse`→分页读取实现）。
//
// 职责：从 app-server 的 experimentalFeature/list 分页读取 `in_app_browser`
// 实验开关的启用状态。`registerInAppBrowserAvailabilityProbe` 返回一个
// async 读取器，同时把 Deferred promise 注册进启动任务注册表（首读失败
// 时回落 true 并 warning）。启动装配区在原 176,199 行消费：
// `Fe = Jse(m, (e) => Pe().sendAppServerRequest("experimentalFeature/list", e))`。

import { Ac as createDeferred } from "@chunk/shared";
import { getLogger } from "@chunk/logger";

/** 实验开关名（原 `Kse`）。 */
const IN_APP_BROWSER_FEATURE_NAME = `in_app_browser`;
/** 分页大小（原 `qse`）。 */
const FEATURE_LIST_PAGE_SIZE = 100;

/**
 * 注册 in-app browser 可用性探测（原 `Jse`）。
 * 返回 async 读取器；读取失败时回落 `true` 并经根 logger warning。
 */
export function registerInAppBrowserAvailabilityProbe(
  registry: { register(promise: Promise<unknown>, read: () => Promise<boolean>): unknown },
  listFeatures: (options: { cursor: string | null; limit: number }) => Promise<{
    data: { name: string; enabled: boolean }[];
    nextCursor: string | null;
  }>,
): () => Promise<boolean> {
  let deferred = createDeferred(),
    read = () => readInAppBrowserAvailability(listFeatures);
  return (
    registry.register(deferred.promise, read),
    async () => {
      let enabled = await read().catch(
        (error) => (
          getLogger().warning(`Failed to read in-app browser availability`, {
            safe: {},
            sensitive: { error },
          }),
          !0
        ),
      );
      return (deferred.resolve(enabled), enabled);
    }
  );
}

/** 分页读取 in_app_browser 开关（原 `Yse`）。 */
async function readInAppBrowserAvailability(
  listFeatures: (options: { cursor: string | null; limit: number }) => Promise<{
    data: { name: string; enabled: boolean }[];
    nextCursor: string | null;
  }>,
): Promise<boolean> {
  let readPage = async (cursor: string | null): Promise<boolean> => {
    let page = await listFeatures({ cursor, limit: FEATURE_LIST_PAGE_SIZE }),
      entry = page.data.find((feature) => feature.name === IN_APP_BROWSER_FEATURE_NAME);
    return entry == null
      ? page.nextCursor == null || readPage(page.nextCursor)
      : entry.enabled;
  };
  return readPage(null);
}
