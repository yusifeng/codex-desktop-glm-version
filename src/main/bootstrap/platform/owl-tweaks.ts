// Owl 专属开关与 Dock tile 修复（原 bootstrap-C4dRql4x.ts 24591-24625 行的
// `uA/dA/fA` 与 `pA/mA/hA/gA`）。
//
// `fA`（owlUserAgentSwitches）：packaged 构建下追加两条 Owl shell 开关——
// 对 openai.com/chatgpt.com/chatgpt.site/chatgpt-team.site 生效的
// scoped user-agent 附加主机列表 + `CodexBrowser` UA 前缀。主流程在
// app ready 之前逐条 appendSwitch。
//
// `mA`（repairDockTile）：macOS 上 app bundle 被 rename（典型：DMG 安装 gate
// 把旧版改名腾位）后，Dock 里的图标会失效。通过 native/launch-services-helper
// 探测并修复；修复期间临时把激活策略降为 accessory 隐藏闪烁。
// 仅 packaged 的 darwin 生效，返回是否执行了修复。

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

import { app } from "electron";

/** 附加 scoped user-agent 的主机列表开关名（原 `uA`）。 */
const OWL_SCOPED_USER_AGENT_ADDITIONAL_HOSTS_SWITCH = `owl-scoped-user-agent-additional-hosts`;
/** scoped user-agent 前缀开关名（原 `dA`）。 */
const OWL_SCOPED_USER_AGENT_PREFIX_SWITCH = `owl-scoped-user-agent-prefix`;
/** launch-services-helper 的执行超时毫秒（原 `pA`）。 */
const LAUNCH_SERVICES_HELPER_TIMEOUT_MS = 1e4;

/** Owl 开关（与 Chromium 开关同形）。 */
export interface OwlSwitch {
  name: string;
  value: string;
}

/**
 * Owl scoped user-agent 开关（原 `fA`）：packaged 时返回两条开关，否则空数组。
 */
export function owlUserAgentSwitches({ isPackaged }: { isPackaged: boolean }): OwlSwitch[] {
  return isPackaged
    ? [
        {
          name: OWL_SCOPED_USER_AGENT_ADDITIONAL_HOSTS_SWITCH,
          value: `openai.com,chatgpt.com,chatgpt.site,chatgpt-team.site`,
        },
        { name: OWL_SCOPED_USER_AGENT_PREFIX_SWITCH, value: `CodexBrowser` },
      ]
    : [];
}

/**
 * 修复被 rename 的 Dock tile（原 `mA`）。返回 true 表示执行了修复
 * （主流程会记 "Repaired renamed Dock tile"）。
 */
export function repairDockTile(): boolean {
  if (process.platform !== `darwin` || !app.isPackaged) return false;
  const bundlePath = parentAppBundlePath();
  const helperPath = join(process.resourcesPath, `native`, `launch-services-helper`);
  if (
    bundlePath == null ||
    !existsSync(helperPath) ||
    !runLaunchServicesHelper(helperPath, [`needs-renamed-dock-tile-repair`, bundlePath])
  )
    return false;
  try {
    app.setActivationPolicy(`accessory`);
    return runLaunchServicesHelper(helperPath, [`repair-renamed-dock-tile`, bundlePath]);
  } finally {
    app.setActivationPolicy(`regular`);
  }
}

/** 运行 launch-services-helper，输出 trim 后为 `true` 才算成功（原 `hA`）。 */
function runLaunchServicesHelper(helperPath: string, args: string[]): boolean {
  try {
    return (
      execFileSync(helperPath, args, { encoding: `utf8`, timeout: LAUNCH_SERVICES_HELPER_TIMEOUT_MS }).trim() ===
      `true`
    );
  } catch {
    return false;
  }
}

/** 向上两级取 .app bundle 目录（原 `gA`）：execPath 位于 Contents/MacOS 下。 */
function parentAppBundlePath(): string | null {
  const executableDirectory = dirname(dirname(process.execPath));
  const bundlePath = dirname(executableDirectory);
  return bundlePath.endsWith(`.app`) ? bundlePath : null;
}
