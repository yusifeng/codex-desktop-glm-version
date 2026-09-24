// Chromium 命令行开关（原 bootstrap-C4dRql4x.ts 23965-23983 行的 `wk`）。
//
// 仅 Dev flavor 下读取 `CODEX_ELECTRON_CHROMIUM_SWITCHES` 环境变量：
// 值必须是一个 JSON object（switch 名 → string 值或 null），
// 解析结果由主流程在 app ready 之前逐条 `app.commandLine.appendSwitch`。
// JSON 非法 / 不是 object / switch 名为空 / 值不是 string|null 都直接抛错
// （启动期 fail-fast，不做静默降级）。

import { BuildFlavor } from "../build-info/build-flavor";

/** `wk` 的入参：build flavor 与进程环境。 */
export interface ChromiumSwitchesInput {
  buildFlavor: string;
  env: Record<string, string | undefined>;
}

/** 一条 Chromium 命令行开关；无 value 表示布尔型开关。 */
export interface ChromiumSwitch {
  name: string;
  value?: string;
}

/**
 * 解析 `CODEX_ELECTRON_CHROMIUM_SWITCHES`（原 `wk`）。
 * Dev flavor 且变量非空时解析 JSON object 并映射为开关列表，否则返回空数组。
 */
export function chromiumSwitches({ buildFlavor, env }: ChromiumSwitchesInput): ChromiumSwitch[] {
  const raw = env.CODEX_ELECTRON_CHROMIUM_SWITCHES?.trim();
  if (buildFlavor !== BuildFlavor.Dev || !raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw Error(`CODEX_ELECTRON_CHROMIUM_SWITCHES must be valid JSON`);
  }
  if (typeof parsed != `object` || !parsed || Array.isArray(parsed))
    throw Error(`CODEX_ELECTRON_CHROMIUM_SWITCHES must be a JSON object`);
  return Object.entries(parsed as Record<string, unknown>).map(([name, value]) => {
    if (name.length === 0)
      throw Error(`CODEX_ELECTRON_CHROMIUM_SWITCHES contains an empty switch name`);
    if (value != null && typeof value != `string`)
      throw Error(
        `CODEX_ELECTRON_CHROMIUM_SWITCHES value for ${name} must be a string or null`,
      );
    return value == null ? { name } : { name, value: value as string };
  });
}
