// codex-app-tools MCP 配置同步（原 main-C-Mhak1n.ts 8,466-8,522 行的
// `Xie/Zie`；`as/Jie/Yie/os/ss/cs` 已由 misc/codex-app-tools-config.ts 实现，
// 此处转发其导出面）。
//
// `syncCodexAppToolsMcpConfig`（原 `Zie`）：local host 上把 codex_app server
// 定义重写进 bundled 插件安装目录的 .mcp.json（原子写：tmp + rename），随后
// 触发一次空 batchWrite（reloadUserConfig=true）让 app-server 重载用户配置。
// 非 WSL 平台上把 command 相对化到安装目录、cwd 改为安装目录、剥离
// CODEX_MCP_NODE_PATH；WSL host 上路径经 n.ji 转为 WSL 视角路径。
//
// `resolveCodexAppEnabledOverride`（原 `Xie`）：local host 的
// `plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled=<bool>`
// 配置覆盖键（探测 codex_app server 是否可用）。
//
// 本模块无模块加载期副作用。

import { readFile, rename, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { randomUUID } from "node:crypto";

// @chunk/shared 的压缩名导出，按语义重命名导入：
//   Bo → getBundledPluginCachePath（插件安装目录解析）
//   zi → shouldUseWslPathsForHostConfig（hostConfig → WSL 判定）
//   ji → 本地路径 → WSL 路径转换（distro 可选）
//   Vl → 默认 marketplace 名、Nl → codex-app-tools 插件名
import {
  Bo as getBundledPluginCachePath,
  ji as convertPathForWsl,
  Nl as CODEX_APP_TOOLS_PLUGIN_NAME,
  Vl as DEFAULT_MARKETPLACE_NAME,
  zi as shouldUseWslPathsForHostConfig,
} from "@chunk/shared";
// plugins/marketplace（3.3 簇）的 Ai（bundled marketplace 插件查找）与 Di
// （listPlugins 过滤参数）。
import { findBundledPlugin, LOCAL_MARKETPLACE_LIST_FILTER } from "../plugins/marketplace";
// codex_app server 定义解析（原 ss，8,523-8,564）。
import { resolveCodexAppServer } from "../misc/codex-app-tools-config";

export {
  CODEX_APP_TOOLS_PIPE_PATH,
  resolveCodexAppMcpOverrides,
  resolveCodexAppServer,
} from "../misc/codex-app-tools-config";

/** app-server 连接的最小面。 */
interface AppServerConnectionLike {
  hostConfig: { kind: string };
  listPlugins(filter: unknown): Promise<{ marketplaces: any[] }>;
  codexHome(): Promise<string>;
  sendAppServerRequest(method: string, params: unknown): Promise<unknown>;
}

/**
 * codex_app enabled 覆盖键（原 `Xie`，8,466-8,472）：
 * local host 时探测 codex_app server 可用性并生成插件配置覆盖键。
 */
export async function resolveCodexAppEnabledOverride({
  hostConfig,
  resourcesPath = process.resourcesPath,
}: {
  hostConfig: { kind: string };
  resourcesPath?: string;
}): Promise<string[]> {
  return hostConfig.kind === `local`
    ? [
        `plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled=${(await resolveCodexAppServer({ hostConfig, resourcesPath })) != null}`,
      ]
    : [];
}

/**
 * 同步 bundled 插件安装目录的 .mcp.json（原 `Zie`，8,483-8,522）。
 *
 * 仅 local host；插件未安装或 server 不可用（resolveCodexAppServer 为 null）
 * 时无操作。内容未变化时跳过写入；写入后触发空 batchWrite 重载用户配置。
 */
export async function syncCodexAppToolsMcpConfig({
  appServerConnection,
  resourcesPath = process.resourcesPath,
}: {
  appServerConnection: AppServerConnectionLike;
  resourcesPath?: string;
}): Promise<void> {
  const connection = appServerConnection;
  if (connection.hostConfig.kind !== `local`) return;
  const [{ marketplaces }, codexHome, server] = await Promise.all([
    connection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER),
    connection.codexHome(),
    resolveCodexAppServer({ hostConfig: connection.hostConfig, resourcesPath }),
  ]);
  const found = findBundledPlugin({
    marketplaceName: DEFAULT_MARKETPLACE_NAME,
    marketplaces,
    pluginName: CODEX_APP_TOOLS_PLUGIN_NAME,
  });
  if (!found?.plugin.installed || server == null) return;
  const pluginInstallPath = getBundledPluginCachePath({
    codexHome,
    localVersion: found.plugin.localVersion,
    marketplaceName: found.marketplace.name,
    pluginName: found.plugin.name,
  });
  const useWslPaths = shouldUseWslPathsForHostConfig(connection.hostConfig);
  const installPath = useWslPaths ? convertPathForWsl(pluginInstallPath) : pluginInstallPath;
  if (!useWslPaths) {
    if (process.platform !== `win32`)
      server.command = join(installPath, relative(server.cwd, server.command));
    server.cwd = installPath;
    delete server.env?.CODEX_MCP_NODE_PATH;
  }
  const mcpJsonPath = join(installPath, `.mcp.json`);
  const content = `${JSON.stringify({ mcpServers: { codex_app: server } }, null, 2)}\n`;
  const existing = await readFile(mcpJsonPath, `utf8`).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === `ENOENT`) return null;
    throw error;
  });
  if (existing == null || content === existing) return;
  const tmpPath = `${mcpJsonPath}.tmp-${randomUUID()}`;
  await writeFile(tmpPath, content);
  await rename(tmpPath, mcpJsonPath);
  await connection.sendAppServerRequest(`config/batchWrite`, {
    edits: [],
    expectedVersion: null,
    filePath: null,
    reloadUserConfig: true,
  });
}
