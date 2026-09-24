// userData 路径与 .app bundle 路径解析（原 bootstrap-C4dRql4x.ts 23984-24000 行的
// `Tk` / `Ek`）。
//
// `Tk`（resolveUserDataPath）：主流程在 `app.setName` 之后立即用它的返回值
// `app.setPath("userData", …)`，必须发生在任何 `getPath("userData")` 调用之前。
// 优先级：`CODEX_ELECTRON_USER_DATA_PATH` 覆盖 > `Codex` / `Codex (flavor)` >
// agent flavor 且带 `CODEX_ELECTRON_AGENT_RUN_ID` 时追加 `agent/<runId>` 隔离目录。
//
// `Ek`（appBundlePath）：从 process.execPath 逐级向上找 `.app` 后缀的目录，
// 找不到（如直接跑 Electron 二进制）时返回 execPath 本身。DMG 安装 gate 用它
// 判断当前是否从 /Volumes 下的 DMG 运行。

import { dirname, extname, join, resolve } from "node:path";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   Ro → build flavor → userData 目录后缀名（内部符号 MD：Dev/Agent/Nightly/Alpha/Beta，Prod 为 null）
import { Ro as flavorDirectoryName } from "@chunk/shared";

/** `Tk` 的入参：appData 根目录、build flavor 与进程环境。 */
export interface UserDataPathInput {
  appDataPath: string;
  buildFlavor: string;
  env: Record<string, string | undefined>;
}

/**
 * 解析 userData 目录（原 `Tk`）。语义见文件头；flavor 后缀为 null（Prod）时
 * 目录名为 `Codex`，否则 `Codex (<后缀>)`。
 */
export function resolveUserDataPath({ appDataPath, buildFlavor, env }: UserDataPathInput): string {
  const override = env.CODEX_ELECTRON_USER_DATA_PATH?.trim();
  if (override) return resolve(override);
  const flavorName = flavorDirectoryName(buildFlavor) as string | null;
  const basePath = join(appDataPath, flavorName == null ? `Codex` : `Codex (${flavorName})`);
  const agentRunId = env.CODEX_ELECTRON_AGENT_RUN_ID?.trim() || null;
  return buildFlavor === `agent` && agentRunId != null
    ? join(basePath, `agent`, agentRunId)
    : basePath;
}

/**
 * 当前进程所属的 .app bundle 路径（原 `Ek`）：从 execPath 向上逐级找
 * extname 为 `.app` 的目录；到根仍未命中则返回 execPath 原值。
 */
export function appBundlePath(): string {
  let path = process.execPath;
  for (;;) {
    if (extname(path) === `.app`) return path;
    const parent = dirname(path);
    if (parent === path) return process.execPath;
    path = parent;
  }
}
