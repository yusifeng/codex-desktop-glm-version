// codex-app-tools MCP 配置（原版 8,457-8,573 区段：as/Jie/Yie/Xie/os/Zie/ss/cs）。
//
// 职责：
//   - 解析 bundled codex-app 插件的 `.mcp.json` → codex_app MCP server 定义，
//     并做平台适配（win32/WSL：经 /bin/sh + wslpath 启动 bundled Windows
//     runtime，env 经 WSLENV 转发）；
//   - resolveCodexAppMcpOverrides（原 os）：app-server 支持
//     pluginMcpConfigOverrides 时不注入（由插件系统接管）；否则把 codex_app
//     定义展平为 `mcp_servers.codex_app.*` 配置覆盖键（enabled=false，由
//     探测决定真值——见原文 Xie）。
//
// 消费方：automations 线程启动（config 覆盖注入，9,398）与 97,646 的本地
// Core 启动装配。
//
// 模块加载期副作用：仅 logger 创建。

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createTaggedLogger } from "@chunk/logger";
import {
  wf as zObject,
  Of as zString,
  Ef as zRecordStringString,
  yf as zAny,
  Wu as appServerSupports,
  zi as shouldUseWslPaths,
  Ln as executionHostNodePath,
  Bn as detectWindowsWsl,
  Ai as buildWslEnvDirective,
  Vl as DEFAULT_MARKETPLACE_NAME,
  Nl as CODEX_APP_TOOLS_PLUGIN_NAME,
} from "@chunk/shared";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { findBundledPluginRoot } from "../plugins/marketplace";

/** codex_app 管道路径环境变量（原 as，8,457）。 */
export const CODEX_APP_TOOLS_PIPE_PATH = `CODEX_APP_TOOLS_PIPE_PATH`;

/** codex-app-tools 具名 logger（原 Yie = r.r("codex-app-tools-mcp")）。 */
const logger = createTaggedLogger(`codex-app-tools-mcp`);

/** .mcp.json 的 codex_app server schema（原 Jie，8,458-8,463）。 */
const codexAppServerSchema = zObject({
  mcpServers: zObject({
    codex_app: zObject({
      command: zString(),
      cwd: zString(),
      env: zRecordStringString(zString(), zString()).optional(),
    }).catchall(zAny()),
  }),
});

/**
 * codex_app 配置覆盖键（原 os，8,473-8,482）：
 * - 非 local host 或 app-server 已支持 pluginMcpConfigOverrides → `{}`；
 * - 插件不可用时注入 `{command:"", enabled:false}`（禁用占位）；
 * - 可用时注入定义 + `enabled:true`。
 */
export async function resolveCodexAppMcpOverrides({
  hostConfig,
  appServerVersion,
  resourcesPath = process.resourcesPath,
}: {
  hostConfig: { kind: string };
  appServerVersion: string | null;
  resourcesPath?: string;
}): Promise<Record<string, unknown>> {
  if (hostConfig.kind !== `local` || appServerSupports(appServerVersion, `pluginMcpConfigOverrides`))
    return {};
  let server = await resolveCodexAppServer({ hostConfig, resourcesPath });
  return Object.fromEntries(
    Object.entries(server == null ? { command: ``, enabled: false } : { ...server, enabled: true }).map(
      ([key, value]) => [`mcp_servers.codex_app.${key}`, value],
    ),
  );
}

/**
 * 解析 bundled codex_app server 定义（原 ss，8,523-8,564）：
 * - 无管道环境变量 / 插件缺失 / 定义缺失 / WSL 缺 runtime → null（cs 告警）；
 * - WSL host 上改写为 /bin/sh 包装（wslpath 启动 Windows node）。
 */
export async function resolveCodexAppServer({
  hostConfig,
  resourcesPath = process.resourcesPath,
}: {
  hostConfig: unknown;
  resourcesPath?: string;
}): Promise<Record<string, any> | null> {
  if (!process.env.CODEX_APP_TOOLS_PIPE_PATH) return unavailable(`missing-pipe`);
  let useWsl = shouldUseWslPaths(hostConfig);
  let pluginRoot = await findBundledPluginRoot({
    marketplaceName: DEFAULT_MARKETPLACE_NAME,
    pluginName: CODEX_APP_TOOLS_PLUGIN_NAME,
    resourcesPath,
  });
  if (pluginRoot == null) return unavailable(`missing-plugin`);
  let mcpJson = await readFile(join(pluginRoot.path, `.mcp.json`), `utf8`).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === `ENOENT`) return null;
    throw error;
  });
  if (mcpJson == null) return unavailable(`missing-definition`);
  let {
    mcpServers: { codex_app: server },
  } = codexAppServerSchema.safeParse(JSON.parse(mcpJson)).data as {
    mcpServers: { codex_app: Record<string, any> };
  };
  let env = { ...server.env };
  let nodePath = executionHostNodePath(
    resolveElectronResourcesPath({ env: process.env, resourcesPath }),
  );
  if (detectWindowsWsl() != null && nodePath == null) return unavailable(`missing-core-node`);
  if (nodePath != null) env.CODEX_MCP_NODE_PATH = nodePath;
  if (useWsl) {
    if (nodePath == null) return unavailable(`missing-windows-runtime`);
    server.command = `/bin/sh`;
    server.args = [
      `-c`,
      `trap 'echo "Codex app tools could not start the bundled Windows runtime. Check that WSL interoperability is enabled." >&2' 0
exec "$(/usr/bin/wslpath -u "$1")" "$2"`,
      `codex-app-tools`,
      nodePath,
      join(pluginRoot.path, `server.mjs`),
    ];
    server.env_vars = [`WSL_INTEROP`, CODEX_APP_TOOLS_PIPE_PATH];
    env.WSLENV = buildWslEnvDirective([{ name: CODEX_APP_TOOLS_PIPE_PATH, type: `windows-only` }]);
  }
  return {
    ...server,
    command: process.platform === `win32` ? server.command : join(pluginRoot.path, server.command),
    cwd: useWsl ? `/` : pluginRoot.path,
    enabled: false,
    env,
  };
}

/** 不可用原因 → null + 告警（原 cs，8,565-8,573）。 */
function unavailable(reason: string): null {
  logger.warning(`Codex app tools unavailable for this Core launch`, {
    safe: { reason },
    sensitive: {},
  });
  return null;
}
