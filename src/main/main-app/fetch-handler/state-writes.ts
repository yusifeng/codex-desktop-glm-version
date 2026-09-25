// fetch-handler 杂项：bundled skills 根 + global-state 稀疏写 + OS 全局快捷键
// 设置校验。
//
// 对应 main-C-Mhak1n.ts 97,963-97,985：
//   - VBe/eU：OS 全局快捷键的设置写入校验（单键绑定约束；hotkeyWindow/
//     openAvatarOverlay/realtimeVoice 走窗口校验，globalDictation* 走听写校验）
//   - HBe：bundled skills 根（打包 → resources/skills；dev → assets/skills 两级）
//   - UBe/WBe：global-state 稀疏对象写（updateOnly 保留已有键 + maxEntries FIFO
//     驱逐 + maxBytes 从尾部反序逐键累计）
//
// 模块加载期副作用：无。

import { existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import { Ef as recordSchema, Of as stringSchema, Mf as jsonSchema, kt as keymapAcceleratorForCommand } from "@chunk/shared";
import { validateHotkey, validateGlobalDictationHotkey } from "../hotkey/global-shortcut";

// ---------------------------------------------------------------------------
// OS 全局快捷键设置校验（原 `VBe`/`eU`）
// ---------------------------------------------------------------------------

/** 快捷键设置写入形态。 */
export interface HotkeySettingValue {
  accelerator: string;
  type: "append" | "set" | "replace";
}

/**
 * OS 全局快捷键设置校验（原 `VBe`）：
 * 仅 hotkeyWindow/openAvatarOverlay/realtimeVoice/globalDictation* 受理；
 * append 拒绝（OS 全局快捷键只支持单键绑定）；非法 accelerator 抛错。
 */
export function validateGlobalHotkeySetting(commandId: string, value: HotkeySettingValue): void {
  const isWindowHotkey = commandId === "hotkeyWindow" || commandId === "openAvatarOverlay" || commandId === "realtimeVoice";
  if (!isWindowHotkey && commandId !== "globalDictationHold" && commandId !== "globalDictationToggle") return;
  if (value.type === "append") throw new Error("OS-global shortcuts support one keybinding.");
  if (value.type !== "set" && value.type !== "replace") return;
  const failure = isWindowHotkey ? validateHotkey(value.accelerator) : validateGlobalDictationHotkey(value.accelerator);
  if (failure != null) throw new Error(failure);
}

/** keymap 状态下 openAvatarOverlay 的 accelerator（原 `eU`）。 */
export function avatarOverlayAcceleratorFromKeymap(keymapState: unknown): string | null {
  return keymapAcceleratorForCommand({
    commandId: "openAvatarOverlay",
    keymapState,
    isMacOS: process.platform === "darwin",
  });
}

// ---------------------------------------------------------------------------
// bundled skills 根（原 `HBe`）
// ---------------------------------------------------------------------------

/** bundled skills 根（原 `HBe`）：打包 → resources/skills；dev → assets 两级回退。 */
export function bundledSkillsRoot(): string | null {
  const appPath = app.getAppPath();
  if (app.isPackaged) return join(process.resourcesPath, "skills");
  const assetsRoot = join(appPath, "assets", "skills");
  if (existsSync(assetsRoot)) return assetsRoot;
  const siblingAssetsRoot = join(appPath, "..", "assets", "skills");
  return existsSync(siblingAssetsRoot) ? siblingAssetsRoot : null;
}

// ---------------------------------------------------------------------------
// global-state 稀疏对象写（原 `UBe`/`WBe`）
// ---------------------------------------------------------------------------

const sparseEntrySchema = recordSchema(stringSchema(), jsonSchema());

/** 稀疏写条目：null = 删除；updateOnly = 仅更新已有键。 */
export interface SparseStateEntry {
  updateOnly?: boolean;
  value?: unknown;
}

/** 稀疏写选项：maxEntries FIFO 驱逐 + maxBytes 尾部反序累计。 */
export interface SparseStateWriteOptions {
  entries: Record<string, SparseStateEntry | null>;
  maxBytes?: number;
  maxEntries?: number;
}

/**
 * global-state 稀疏对象写（原 `WBe`）：
 * 非对象原值整体重置；null 条目删除；updateOnly 条目仅更新已有键；
 * maxEntries 超限从头驱逐；maxBytes 从尾部反序逐键累计（含逗号开销）。
 */
export function applySparseStateWrite(current: unknown, options: SparseStateWriteOptions): Record<string, unknown> {
  const parsed = (sparseEntrySchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse(current);
  const result: Record<string, unknown> = parsed.success && parsed.data != null ? parsed.data : {};
  for (const [key, entry] of Object.entries(options.entries)) {
    if (entry?.updateOnly) {
      if (!Object.hasOwn(result, key)) continue;
    } else delete result[key];
    if (entry != null) {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: entry.value,
        writable: true,
      });
    }
  }
  if (options.maxEntries != null) {
    const keys = Object.keys(result);
    for (const key of keys.slice(0, Math.max(0, keys.length - options.maxEntries))) delete result[key];
  }
  if (options.maxBytes != null) {
    let totalBytes = 2;
    for (const [key, value] of Object.entries(result).reverse()) {
      const entryBytes = new TextEncoder().encode(JSON.stringify({ [key]: value })).byteLength - 2;
      const nextBytes = totalBytes + entryBytes + Number(totalBytes > 2 && entryBytes > 0);
      if (nextBytes > options.maxBytes) delete result[key];
      else totalBytes = nextBytes;
    }
  }
  return result;
}
