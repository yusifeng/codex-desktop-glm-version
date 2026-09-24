// 自动化线程的 browser-use/node-repl 配置装配（原版 $o，8,322-8,333）。
//
// 职责：
//   - local host 时先经 waitForPendingReconcile（原 Cie）等 connection 上
//     pending 的 browser-use 配置同步收敛，读到上一次同步的
//     {selection, cuaReplEnabled}（读不到为 null）；
//   - availability 在 local host 上读全局状态（Tr()），否则取注入值；
//   - browserUseTinysky 开启时以上次同步结果（a）为选择来源，否则现算
//     （Do）再算线程配置（qo）；
//   - cuaRepl 未启用或配置里没有 mcp_servers.node_repl → 返回
//     {...config, ...CUA_REPL_DISABLED_MCP_SERVER_ENTRY}；否则把 cua_repl
//     surface 环境注入 node_repl（Vi）后返回 config。
//
// 消费方：automations 线程启动（config 基底，9,375 的 $o 调用点）。
//
// 依赖约束：browser-use/thread-config 与 computer-use/native-pipe-service、
// plugins/cua-repl-config（均为并行重写簇）；无模块加载期副作用。

import {
  computeBrowserUseThreadConfig,
  waitForPendingReconcile,
} from "../browser-use/thread-config";
import { computeBrowserUseSelection } from "../computer-use/native-pipe-service";
import {
  CUA_REPL_DISABLED_MCP_SERVER_ENTRY,
  applyCuaReplSurfaceEnv,
} from "../plugins/cua-repl-config";
import { getDesktopFeatureAvailability } from "./availability";

/**
 * 装配线程启动的 browser-use/node-repl 配置覆盖（原 $o，8,322-8,333）。
 * 参数在原文以 rest 展开（`{...e, selection}` / `{...e, desktopFeatureAvailability}`）
 * 透传给 Do/qo，此处按同样的宽松形态透传。
 */
export async function buildThreadStartConfigOverrides(
  options: {
    appServerConnection: any;
    desktopFeatureAvailability?: Record<string, unknown>;
    [key: string]: unknown;
  },
): Promise<Record<string, any>> {
  let { appServerConnection } = options;
  let isLocal = appServerConnection.hostConfig.kind === `local`;
  let lastReconcile = isLocal
    ? ((await waitForPendingReconcile(appServerConnection)) as {
        selection?: any;
        cuaReplEnabled?: boolean;
      } | null)
    : null;
  let availability = isLocal
    ? (getDesktopFeatureAvailability() as Record<string, unknown>)
    : (options.desktopFeatureAvailability as Record<string, unknown>);
  let tinysky = (availability as { browserUseTinysky?: boolean }).browserUseTinysky
    ? lastReconcile
    : null;
  let selection =
    tinysky?.selection ??
    (await computeBrowserUseSelection({
      ...options,
      desktopFeatureAvailability: availability,
    } as never));
  let config = await computeBrowserUseThreadConfig({ ...options, selection } as never);
  return !tinysky?.cuaReplEnabled || config?.[`mcp_servers.node_repl`] == null
    ? { ...config, ...CUA_REPL_DISABLED_MCP_SERVER_ENTRY }
    : (applyCuaReplSurfaceEnv(config[`mcp_servers.node_repl`], selection.cuaReplSurfaces),
      config);
}
