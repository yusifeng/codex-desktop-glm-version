// cua_repl 插件 .mcp.json 配置 —— 原 main-C-Mhak1n.ts 4,790-4,836 行
// （`Bi`→禁用态 mcp_servers 条目、`xne`→.mcp.json schema、`Vi`→按 surface 注入
// node-repl 环境变量、`Sne`→写 cua_repl 的 .mcp.json）。
//
// 职责：browser-use 线程配置（Tie/Qo）在本地宿主上安装 cua_repl MCP 服务时：
//   - 读取已安装 cua_repl 插件缓存目录下的 `.mcp.json`；
//   - 按 surfaces（browser/computer）装配 env（服务入口表、可用后端、
//     node-repl 路径与启动参数），无 nodeRepl 或无 surface 时整体禁用；
//   - 临时文件 + rename 原子写回（内容不变则跳过写入）。

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  $l as CODEX_PLUGIN_SERVICES_KEY,
  Bo as getBundledPluginCachePath,
  Jl as NODE_REPL_COMMAND_ENV_KEY,
  Kl as COMPUTER_USE_MCP_SERVER_NAME,
  ql as NODE_REPL_MODULE_DIR_ENV_KEY,
  Rl as CUA_REPL_PLUGIN_NAME,
  xf as zRecord,
} from "@chunk/shared";
import { BROWSER_USE_AVAILABLE_BACKENDS } from "../browser-use/rpc-client";
import { findBundledPlugin } from "./marketplace";
import {
  NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER,
  NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME,
} from "../browser-use/thread-config";
import { NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE } from "../computer-use/app-resolution";

/**
 * cua_repl MCP 服务器的「禁用」条目（原 `Bi`）：config/batchWrite 写入
 * `mcp_servers.<computer-use-mcp-name>` 的占位（指向本进程、enabled=false）。
 */
export const CUA_REPL_DISABLED_MCP_SERVER_ENTRY = {
  [`mcp_servers.${COMPUTER_USE_MCP_SERVER_NAME}`]: { command: process.execPath, enabled: !1 },
};

/** cua_repl .mcp.json 的形状校验 schema（原 `xne`）。 */
const cuaReplMcpConfigSchema = zRecord({
  mcpServers: zRecord({ cua_repl: zRecord({}) }),
});

/** cua_repl .mcp.json 的形状。 */
export interface CuaReplMcpConfig {
  mcpServers: {
    cua_repl: {
      command?: string;
      args?: string[];
      enabled?: boolean;
      env?: Record<string, unknown>;
      env_vars?: unknown[];
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

/**
 * 按 cua_repl surfaces 给 node_repl 的 MCP 条目追加指令用例环境变量
 * （原 `Vi`）：browser surface 置空 browser/chrome 用例键、computer surface
 * 置空 computer-use 用例键（置空即「跟随本条目」）。
 */
export function applyCuaReplSurfaceEnv(
  nodeReplConfig: { env: Record<string, string> },
  surfaces: string[],
) {
  surfaces.includes(`browser`) &&
    ((nodeReplConfig.env[NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER] = ``),
    (nodeReplConfig.env[NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME] = ``)),
    surfaces.includes(`computer`) &&
      (nodeReplConfig.env[NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE] = ``);
}

/**
 * 同步 cua_repl 插件缓存目录的 `.mcp.json`（原 `Sne`）。
 * 返回 cua_repl 是否启用（有 nodeRepl 且 surfaces 非空）。
 */
export async function syncCuaReplMcpConfig(options: {
  browserBackends: string[];
  codexHome: string;
  marketplaceName: string;
  marketplaces: any[];
  nodeRepl: {
    command?: string;
    env: Record<string, string | undefined>;
    env_vars?: unknown[];
  } | null;
  surfaces: string[];
}): Promise<boolean> {
  let installed = findBundledPlugin({
    marketplaceName: options.marketplaceName,
    marketplaces: options.marketplaces,
    pluginName: CUA_REPL_PLUGIN_NAME,
  });
  if (!installed?.plugin.installed) return !1;
  let enabled = options.nodeRepl != null && options.surfaces.length > 0,
    pluginCachePath = getBundledPluginCachePath({
      codexHome: options.codexHome,
      localVersion: installed.plugin.localVersion,
      marketplaceName: installed.marketplace.name,
      pluginName: installed.plugin.name,
    }),
    configPath = path.join(pluginCachePath, `.mcp.json`),
    existing = await fs.readFile(configPath, `utf8`),
    parsed = cuaReplMcpConfigSchema.parse(JSON.parse(existing)) as CuaReplMcpConfig,
    cuaRepl = parsed.mcpServers.cua_repl,
    services: Record<string, string> = {};
  options.surfaces.includes(`browser`) && (services.browser = `@oai/browser-desktop/service`),
    options.surfaces.includes(`computer`) && (services.sky = `@oai/sky/service`),
    (cuaRepl.enabled = enabled),
    (cuaRepl.env_vars = options.nodeRepl?.env_vars ?? []),
    (cuaRepl.env = {
      ...options.nodeRepl?.env,
      CUA_REPL_NODE_REPL_PATH: options.nodeRepl?.command,
      CUA_REPL_ENABLED_SURFACES: options.surfaces.join(`,`),
      [CODEX_PLUGIN_SERVICES_KEY]: JSON.stringify(services),
      [BROWSER_USE_AVAILABLE_BACKENDS]: options.browserBackends.join(`,`),
    }),
    options.nodeRepl != null &&
      ((cuaRepl.command = options.nodeRepl.env[NODE_REPL_COMMAND_ENV_KEY]),
      (cuaRepl.args = [
        path.join(
          options.nodeRepl.env[NODE_REPL_MODULE_DIR_ENV_KEY]!,
          `@oai/cua-repl/bin/cua-repl.mjs`,
        ),
      ]));
  let updated = `${JSON.stringify(parsed, null, 2)}\n`;
  if (updated !== existing) {
    let tempPath = `${configPath}.tmp-${randomUUID()}`;
    await fs.writeFile(tempPath, updated), await fs.rename(tempPath, configPath);
  }
  return enabled;
}
