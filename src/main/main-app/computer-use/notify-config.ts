// computer-use notify 配置注入（原 main-C-Mhak1n.ts 7,779-7,860 行的
// `zo/Bo/rie/iie/aie/oie/sie/Vo/cie/lie/uie/Ho/die`）。
//
// Windows 上 computer-use helper 通过 codex CLI 的 notify 机制接收
// turn-ended 通知：本模块把 `notify = ["<helperPath>", "turn-ended"]` 写入
// codex home 的 config.toml。
//
// 语义细节：
//   - 已存在等价 notify 配置（含 --previous-notify 链）→ status: already-present。
//   - 已有 notify（任意）→ 保留其 --previous-notify 链并前插本条 → repaired；
//     否则 installed。
//   - notify 行插在 config.toml 第一个 `[section]` 之前（顶层键区）。
//   - 解析用 shared 的 TOML 解析器；序列化用 env-toml-stringifier 的
//     TOML 序列化器（原 `Yt`，794-912 行）。
//
// 本模块无模块加载期副作用。

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

// @chunk/shared 的压缩名导出，按语义重命名导入：
//   wi → TOML 解析器（文本 → 对象）
import { wi as parseToml } from "@chunk/shared";
// misc/env-toml-stringifier（3.8 簇，并行重写中）的 TOML 序列化器（原 `Yt`）。
import { stringifyToml } from "../misc/env-toml-stringifier";

/** 旧 notify 链的接续参数（原 `zo`）。 */
const PREVIOUS_NOTIFY_ARG = `--previous-notify`;
/** 本条 notify 的命令参数（原 `Bo`）。 */
const TURN_ENDED_ARG = `turn-ended`;
/** computer-use helper 可执行文件名（原 `rie`）。 */
const HELPER_EXECUTABLE_PATTERN = /^codex-computer-use(?:-arm64)?\.exe$/i;

/** ensure 的结果状态。 */
export type NotifyConfigStatus = `already-present` | `repaired` | `installed`;

/**
 * 确保 codex home 的 config.toml 含 computer-use helper 的 notify 配置
 * （原 `iie`）。
 *
 * 内容未变化时不动文件（already-present）；否则 mkdir -p + 原子性要求不适用
 * （直接 writeFile 全量覆盖）。
 */
export async function ensureComputerUseNotifyConfig({
  codexHome,
  windowsHelperPath,
}: {
  codexHome: string;
  windowsHelperPath: string;
}): Promise<{ status: NotifyConfigStatus }> {
  const configPath = join(codexHome, `config.toml`);
  const existing = await readConfigToml(configPath);
  const updated = computeUpdatedNotifyConfig(existing, windowsHelperPath);
  if (updated.content === existing)
    return { status: `already-present` };
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, updated.content, `utf8`);
  return { status: updated.hadNotify ? `repaired` : `installed` };
}

/**
 * 计算更新后的 config.toml 内容（原 `aie`）。
 * 已有等价 notify（含 --previous-notify 链）时原样返回（hadNotify=true）。
 */
function computeUpdatedNotifyConfig(content: string, windowsHelperPath: string): {
  content: string;
  hadNotify: boolean;
} {
  const existingNotify = parseExistingNotify(content);
  const previousNotify = unwrapPreviousNotifyChain(existingNotify);
  const desiredNotify = [windowsHelperPath, TURN_ENDED_ARG];
  if (previousNotify != null) desiredNotify.push(PREVIOUS_NOTIFY_ARG, JSON.stringify(previousNotify));
  if (notifyArraysEqual(existingNotify, desiredNotify))
    return { content, hadNotify: true };
  return {
    content: insertNotifyLine(content, stringifyToml({ notify: desiredNotify }).trimEnd()),
    hadNotify: existingNotify != null,
  };
}

/** 读 config.toml；ENOENT 视为空配置（原 `oie`）。 */
async function readConfigToml(configPath: string): Promise<string> {
  try {
    return await readFile(configPath, `utf8`);
  } catch (error) {
    if (error instanceof Error && `code` in error && (error as NodeJS.ErrnoException).code === `ENOENT`)
      return ``;
    throw error;
  }
}

/**
 * 从 config.toml 内容解析 notify 数组（原 `sie`）。
 * 空内容或无 notify 键 → null；notify 非 string 数组 → 抛错。
 */
function parseExistingNotify(content: string): string[] | null {
  if (content.trim() === ``) return null;
  const parsed = parseToml(content, { integersAsBigInt: false });
  if (parsed.notify == null) return null;
  if (!isStringArray(parsed.notify))
    throw new Error(`Codex notify config must be a string array`);
  return parsed.notify;
}

/**
 * 剥离 --previous-notify 链的最外层（原 `Vo`）：
 * 若 notify 是本 helper 的 turn-ended 条目，返回其 --previous-notify 参数
 * 解析出的旧数组；否则原样返回。
 */
function unwrapPreviousNotifyChain(notify: string[] | null): string[] | null {
  if (notify == null) return null;
  return isComputerUseHelperNotifyEntry(notify) ? parsePreviousNotify(notify) : notify;
}

/** 判定 notify 条目是否为本 helper 的 turn-ended 条目（原 `cie`）。 */
function isComputerUseHelperNotifyEntry([command, event]: string[]): boolean {
  return (
    event === TURN_ENDED_ARG &&
    HELPER_EXECUTABLE_PATTERN.test(command?.replaceAll(`\\`, `/`).split(`/`).at(-1) ?? ``)
  );
}

/** 解析 --previous-notify 参数中的旧 notify 数组（原 `lie`）。 */
function parsePreviousNotify(notify: string[]): string[] | null {
  const encoded = notify[notify.indexOf(PREVIOUS_NOTIFY_ARG) + 1];
  if (encoded == null) return null;
  try {
    const parsed = JSON.parse(encoded);
    return isStringArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 把 notify 行插入 config.toml 顶层键区（原 `uie`）：
 * - 已有 notify 行被剔除（由新行替代）；
 * - 跨行方括号配对计数决定 notify 行的归属区段；
 * - 新行插在第一个 `[section]` 行之前，整体 trim + 结尾换行。
 */
function insertNotifyLine(content: string, notifyLine: string): string {
  const keptLines: string[] = [];
  let inTopLevel = true;
  let bracketBalance = 0;
  for (const line of content.split(/\r?\n/)) {
    const trimmedStart = line.trimStart();
    const bracketDelta = line.split(`[`).length - line.split(`]`).length;
    if (inTopLevel && bracketBalance === 0 && trimmedStart.startsWith(`[`)) inTopLevel = false;
    if (inTopLevel) {
      if (bracketBalance > 0) bracketBalance += bracketDelta;
      else if (/^notify\s*=/.test(trimmedStart)) bracketBalance = bracketDelta;
      else keptLines.push(line);
    } else keptLines.push(line);
  }
  const firstSectionIndex = keptLines.findIndex((line) => line.trimStart().startsWith(`[`));
  const before = firstSectionIndex === -1 ? keptLines : keptLines.slice(0, firstSectionIndex);
  const after = firstSectionIndex === -1 ? [] : keptLines.slice(firstSectionIndex);
  return `${[...before, notifyLine, ...after].join(`\n`).trim()}\n`;
}

/** string 数组判定（原 `Ho`）。 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === `string`);
}

/** 数组逐元素相等（原 `die`）。 */
function notifyArraysEqual(a: string[] | null, b: string[]): boolean {
  return a != null && a.length === b.length && a.every((item, index) => item === b[index]);
}
