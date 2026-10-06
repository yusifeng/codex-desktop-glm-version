// 全局快捷键：注册/挂起 + mac 布局重映射 + bare 修饰键监视器 + 听写释放监视。
//
// 对应 main-C-Mhak1n.ts 92,770-93,412：
//   - accelerator-normalize（vze/yze/bze/xze + RV/zV）：修饰键别名归一
//   - bare-modifier-monitor（kV~kze，92,790-93,040）：native helper 子进程
//     （--key/--immediate/--cancellable/--trigger-on-release；stdout 行协议
//     ready/down/up/cancel/permission-denied）；挂起域（MV/NV）下 spawn 延迟
//     与 onCancelled 语义；双修饰键（DoubleOption 等）不请求权限
//   - global-shortcut（HV~Fze，93,041-93,215）：不可重入注册（同
//     registrationHotkey 拒绝）、挂起域引用计数（jze：卸载/恢复全部）、
//     mac 键盘布局变化时按 layout map 重映射（Mze/Fze：注册失败回滚）
//   - dictation-release-watcher（Ize~Uze，93,216-93,412）：win32 PowerShell
//     GetAsyncKeyState 10ms 轮询；darwin 走 bare-modifier 的 release 模式；
//     其余平台抛不支持
import { spawn, spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { globalShortcut, app } from "electron";
import { getLogger, memoizedTaggedLogger } from "@chunk/logger";
import { isGlobalDictationWatchable, remapGlobalShortcutForLayout, validateGlobalShortcut } from "./global-shortcut-policy";

const hotkeyLogger = memoizedTaggedLogger("global-hotkey");

// ---------------------------------------------------------------------------
// 修饰键别名归一（原 `vze`/`yze`/`bze`/`xze`/`RV`/`zV`）
// ---------------------------------------------------------------------------

/** 复合/单修饰键的规范化名（原 `vze`）。 */
const BARE_MODIFIER_ALIASES = new Map<string, string>([
  ["fn", "Fn"],
  ["ctrl+fn", "Ctrl+Fn"],
  ["control+fn", "Ctrl+Fn"],
  ["fn+ctrl", "Ctrl+Fn"],
  ["fn+control", "Ctrl+Fn"],
  ["leftoption", "LeftOption"],
  ["leftalt", "LeftOption"],
  ["rightoption", "RightOption"],
  ["rightalt", "RightOption"],
  ["doubleoption", "DoubleOption"],
  ["doublealt", "DoubleOption"],
  ["leftoption+rightoption", "DoubleOption"],
  ["leftalt+rightalt", "DoubleOption"],
  ["leftcommand", "LeftCommand"],
  ["leftcmd", "LeftCommand"],
  ["leftmeta", "LeftCommand"],
  ["doublecommand", "DoubleCommand"],
  ["leftcommand+rightcommand", "DoubleCommand"],
  ["leftcmd+rightcmd", "DoubleCommand"],
  ["leftmeta+rightmeta", "DoubleCommand"],
  ["rightcommand", "RightCommand"],
  ["rightcmd", "RightCommand"],
  ["rightmeta", "RightCommand"],
  ["leftcontrol", "LeftControl"],
  ["leftctrl", "LeftControl"],
  ["doubleshift", "DoubleShift"],
  ["leftshift+rightshift", "DoubleShift"],
]);

/** 单段修饰键的规范化名（原 `yze`）。 */
const MODIFIER_ALIASES = new Map<string, string>([
  ["ctrl", "Ctrl"],
  ["control", "Ctrl"],
  ["command", "Command"],
  ["cmd", "Command"],
  ["meta", "Command"],
  ["alt", "Alt"],
  ["option", "Alt"],
  ["shift", "Shift"],
  ["fn", "Fn"],
]);

/** 这些别名视为 bare 修饰键但不支持 helper 监视（原 `bze`）。 */
const UNSUPPORTED_BARE_ALIASES = new Set(["rightcontrol", "rightctrl", "leftshift", "rightshift"]);
/** 双修饰键形态（不请求权限，原 `xze`）。 */
const DOUBLE_MODIFIERS = new Set(["DoubleOption", "DoubleCommand", "DoubleShift"]);

/** 去空白/大小写归一（原 `zV`）。 */
function normalizeAccelerator(accelerator: string): string {
  return accelerator.replace(/[\s_-]/g, "").toLowerCase();
}

/** bare 修饰键的规范化名（原 `RV`）：复合表优先，其次按 Ctrl/Command/Alt/Shift/Fn 顺序组合。 */
function bareModifierName(accelerator: string): string | null {
  const normalized = normalizeAccelerator(accelerator);
  const aliased = BARE_MODIFIER_ALIASES.get(normalized);
  if (aliased != null) return aliased;
  const parts = normalized.split("+").map((part) => MODIFIER_ALIASES.get(part));
  return new Set(parts).size < 2 || parts.some((part) => part == null)
    ? null
    : ["Ctrl", "Command", "Alt", "Shift", "Fn"].filter((modifier) => parts.includes(modifier)).join("+");
}

// ---------------------------------------------------------------------------
// bare-modifier-monitor（原 `kV`~`kze`）
// ---------------------------------------------------------------------------

const BARE_MODIFIER_HELPER_NAME = "bare-modifier-monitor";
/** 已注册的 bare 修饰键（原 `AV`）。 */
const registeredBareModifiers = new Set<string>();
/** 挂起状态变更时的 spawn/清理回调（原 `jV`）。 */
const bareModifierListeners = new Set<() => void>();
/** 挂起域（原 `MV`）。 */
let bareModifiersSuspended = false;

/** helper 二进制定位（原 `VV`/`kze`）：resourcesPath 优先，dev 构建目录兜底。 */
function bareModifierHelperPath(): string | null {
  for (const candidate of bareModifierHelperCandidates())
    if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
  return null;
}

function bareModifierHelperCandidates(): string[] {
  if (typeof app.getAppPath != "function") return [];
  const devPath = join(app.getAppPath(), "native", BARE_MODIFIER_HELPER_NAME, "build", `Release-${process.arch}`, BARE_MODIFIER_HELPER_NAME);
  return process.resourcesPath == null
    ? [devPath]
    : [join(process.resourcesPath, "native", BARE_MODIFIER_HELPER_NAME), devPath];
}

/** stdout 行协议分发（原 `BV`）。 */
function dispatchHelperLines(child: ReturnType<typeof spawn>, onLine: (line: string) => void): void {
  let buffer = "";
  child.stdout?.on("data", (chunk) => {
    buffer += (chunk as Buffer).toString("utf8");
    let newlineIndex = buffer.indexOf("\n");
    for (; newlineIndex !== -1; ) {
      onLine(buffer.slice(0, newlineIndex).trim());
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
    }
  });
}

/** helper 事件语义（原 `Tze`）。 */
function handleHelperEvent(event: string, handlers: { onPressed(): void; onReleased?(): void; onCancelled?(): void }): void {
  switch (event) {
    case "ready":
      return;
    case "down":
      handlers.onPressed();
      return;
    case "up":
      handlers.onReleased?.();
      return;
    case "cancel":
      handlers.onCancelled?.();
      return;
    case "permission-denied":
      getLogger().warning("Bare modifier hotkey monitor needs input monitoring access");
      return;
    case "":
      return;
    default:
      return;
  }
}

/** spawn 参数（原 `Eze`）：trigger 决定 --immediate/--cancellable/--trigger-on-release。 */
function spawnBareModifierMonitor(helperPath: string, key: string, options: { immediate?: boolean; trigger?: string }): ReturnType<typeof spawn> {
  const args = ["--key", key];
  if (options?.immediate === true || options?.trigger === "immediatePress") args.push("--immediate");
  else if (options?.trigger === "cancellablePress") args.push("--cancellable");
  else if (options?.trigger === "release") args.push("--trigger-on-release");
  return spawn(helperPath, args, { stdio: ["pipe", "pipe", "ignore"] });
}

/** 注册 bare 修饰键（原 `Sze`/`wze`）：挂起域下延迟 spawn + onCancelled。 */
function registerBareModifier(
  accelerator: string,
  handlers: { onPressed(): void; onReleased?(): void; onCancelled?(): void },
  trigger: "press" | "immediatePress" | "cancellablePress" | "release" = "press",
): { handlesRelease: boolean; unregister(): void } | null {
  if (process.platform !== "darwin") return null;
  const key = bareModifierName(accelerator);
  if (key == null) return null;
  const helperPath = bareModifierHelperPath();
  if (helperPath == null || registeredBareModifiers.has(key)) return null;
  registeredBareModifiers.add(key);
  return watchBareModifier(helperPath, key, handlers, trigger);
}

function watchBareModifier(
  helperPath: string,
  key: string,
  handlers: { onPressed(): void; onReleased?(): void; onCancelled?(): void },
  trigger: string,
): { handlesRelease: boolean; unregister(): void } {
  let disposed = false;
  let child: ReturnType<typeof spawn> | null = null;
  let pressed = false;
  const killChild = () => {
    const current = child;
    child = null;
    current?.kill();
  };
  const unregister = () => {
    if (disposed) return;
    disposed = true;
    bareModifierListeners.delete(ensureSpawned);
    registeredBareModifiers.delete(key);
    killChild();
  };
  const ensureSpawned = () => {
    if (disposed) return;
    if (bareModifiersSuspended) {
      if (!pressed) {
        handlers.onCancelled?.();
        killChild();
      }
      return;
    }
    if (child != null) return;
    const spawned = spawnBareModifierMonitor(helperPath, key, { trigger });
    child = spawned;
    dispatchHelperLines(spawned, (event) => {
      if (disposed || child !== spawned) return;
      if (event === "down") {
        if (bareModifiersSuspended) return;
        // cancellable 触发时 down 仅置位（up 才回调）；release 触发时 down 即完成。
        pressed = trigger !== "release";
      } else if (event === "up" || event === "cancel") {
        pressed = false;
      }
      handleHelperEvent(event, handlers);
      if (bareModifiersSuspended && !pressed) killChild();
    });
    spawned.once("error", (error) => {
      if (!disposed && child === spawned)
        getLogger().warning("Bare modifier hotkey monitor failed", {
          safe: {},
          sensitive: { error },
        });
    });
    spawned.once("exit", () => {
      if (!disposed && child === spawned) {
        unregister();
        getLogger().warning("Bare modifier hotkey monitor exited");
      }
    });
  };
  bareModifierListeners.add(ensureSpawned);
  ensureSpawned();
  return { handlesRelease: true, unregister };
}

/** 设置挂起域（原 `NV`）。 */
function setBareModifiersSuspended(suspended: boolean): void {
  bareModifiersSuspended = suspended;
  for (const listener of bareModifierListeners) listener();
}

/** raw 权限请求（原 `PV`）：无条件 spawn --request-permission。 */
function requestInputMonitoringPermission(): void {
  if (process.platform !== "darwin") return;
  const helperPath = bareModifierHelperPath();
  if (helperPath == null) return;
  try {
    spawnSync(helperPath, ["--request-permission"], { stdio: "ignore", timeout: 1e4 });
  } catch (error) {
    getLogger().warning("Failed to request input monitoring access", {
      safe: {},
      sensitive: { error },
    });
  }
}

/** 带检查的权限请求（原 `Cze`）：immediatePress 触发与双修饰键形态不需要。 */
function requestBareModifierPermission(accelerator: string, trigger = "press"): void {
  const key = bareModifierName(accelerator);
  if (process.platform !== "darwin" || key == null || trigger === "immediatePress" || DOUBLE_MODIFIERS.has(key)) return;
  requestInputMonitoringPermission();
}

/** release 监视（原 `FV`/`Dze`/`Oze`）：--release-modifiers + --persistent。 */
function watchMacModifierRelease(
  modifiers: string[],
  onRelease: () => void,
  persistent = false,
): { isActive: boolean; dispose(): void } | null {
  if (process.platform !== "darwin" || modifiers.length === 0) return null;
  const helperPath = bareModifierHelperPath();
  if (helperPath == null) return null;
  const child = spawn(helperPath, ["--release-modifiers", modifiers.join(","), ...(persistent ? ["--persistent"] : [])], {
    stdio: ["pipe", "pipe", "ignore"],
  });
  return watchReleaseProcess(child, onRelease, persistent);
}

function watchReleaseProcess(child: ReturnType<typeof spawn>, onRelease: () => void, persistent: boolean): { isActive: boolean; dispose(): void } {
  let done = false;
  const finish = (error?: unknown) => {
    if (done) return;
    done = true;
    child.kill();
    if (error != null)
      getLogger().warning("Mac hotkey release monitor failed", { safe: {}, sensitive: { error } });
    onRelease();
  };
  dispatchHelperLines(child, (event) => {
    switch (event) {
      case "up":
        if (persistent) {
          if (!done) onRelease();
          return;
        }
        finish();
        return;
      case "permission-denied":
        finish(new Error("permission-denied"));
        return;
      case "ready":
      case "down":
      case "":
        return;
      default:
        return;
    }
  });
  child.once("error", (error) => finish(error));
  child.once("exit", () => finish());
  return {
    get isActive() {
      return !done;
    },
    dispose: () => {
      done = true;
      child.kill();
    },
  };
}

/** 是否 bare 修饰键形态（原 `IV`）。 */
function isBareModifierAccelerator(accelerator: string, platform = process.platform): boolean {
  return platform === "darwin" && bareModifierName(accelerator) != null;
}

/** 是否走 bare/不支持路径（原 `LV`）。 */
function isBareOrUnsupported(accelerator: string): boolean {
  const normalized = normalizeAccelerator(accelerator);
  return bareModifierName(accelerator) != null || UNSUPPORTED_BARE_ALIASES.has(normalized);
}

// ---------------------------------------------------------------------------
// global-shortcut（原 `HV`~`Fze`）
// ---------------------------------------------------------------------------

const MODIFIER_TOKENS = new Set(["cmdorctrl", "command", "cmd", "control", "ctrl", "alt", "option", "super"]);
const MODIFIER_OR_SHIFT_TOKENS = new Set([...MODIFIER_TOKENS, "shift"]);
/** 已注册的快捷键（原 `UV`）。 */
const registeredHotkeys = new Set<{
  onCancelled?: () => void;
  hotkey: string;
  onPressed(): void;
  registrationHotkey: string;
  generation: number;
  registered: boolean;
}>();
/** mac 键盘布局表（原 `GV`）。 */
let macLayoutMap: Record<string, string> | null = null;
/** 挂起引用计数（原 `KV`）。 */
let suspendCount = 0;

/** 挂起全部全局快捷键（原 `jze`）：引用计数；恢复时全部重注册。 */
function suspendGlobalHotkeys(): () => void {
  suspendCount += 1;
  if (suspendCount === 1) {
    setBareModifiersSuspended(true);
    for (const hotkey of registeredHotkeys) {
      hotkey.onCancelled?.();
      hotkey.registered = false;
      globalShortcut.unregister(hotkey.registrationHotkey);
    }
  }
  let released = false;
  return () => {
    if (!released && ((released = true), --suspendCount, suspendCount === 0)) {
      setBareModifiersSuspended(false);
      for (const hotkey of registeredHotkeys) registerHotkeyEntry(hotkey);
    }
  };
}

/** 注册（原 `qV`）：ownership 门面包装 + bare 修饰键分流 + 不可重入。 */
function registerGlobalHotkey(
  accelerator: string,
  handlers: { onPressed(): void; onReleased?(): void; onCancelled?(): void },
  options?: { ownership?: { isOwner(): boolean }; bareModifierTrigger?: "press" | "immediatePress" | "cancellablePress" | "release" },
): { handlesRelease: boolean; unregister(): void } | null {
  const ownership = options?.ownership;
  const onReleased = handlers.onReleased;
  const onCancelled = handlers.onCancelled;
  const wrapped =
    ownership == null
      ? handlers
      : {
          onPressed: () => {
            if (ownership.isOwner()) handlers.onPressed();
          },
          onReleased:
            onReleased == null
              ? undefined
              : () => {
                  if (ownership.isOwner()) onReleased();
                },
          onCancelled:
            onCancelled == null
              ? undefined
              : () => {
                  if (ownership.isOwner()) onCancelled();
                },
        };
  if (isBareOrUnsupported(accelerator))
    return isBareModifierAccelerator(accelerator)
      ? registerBareModifier(accelerator, wrapped, options?.bareModifierTrigger)
      : null;
  const registrationHotkey = registrationAcceleratorFor(accelerator);
  const onPressed = () => {
    hotkeyLogger().debug("global_hotkey_pressed", { safe: { hotkey: accelerator }, sensitive: {} });
    wrapped.onPressed();
  };
  if ([...registeredHotkeys].some((hotkey) => hotkey.registrationHotkey === registrationHotkey)) return null;
  const entry = {
    onCancelled: wrapped.onCancelled,
    hotkey: accelerator,
    onPressed,
    registrationHotkey,
    generation: 0,
    registered: false,
  };
  const registered = registerHotkeyEntry(entry);
  hotkeyLogger().debug("register_global_hotkey", {
    safe: { hotkey: accelerator, registrationHotkey, platform: process.platform, registered },
    sensitive: {},
  });
  return registered
    ? (registeredHotkeys.add(entry),
        suspendCount > 0 && ((entry.registered = false), globalShortcut.unregister(registrationHotkey)),
        {
          handlesRelease: false,
          unregister: () => {
            if (registeredHotkeys.delete(entry)) {
              entry.registered = false;
              globalShortcut.unregister(entry.registrationHotkey);
            }
          },
        })
    : null;
}

/** mac 布局更新（原 `Mze`）：触发全部注册项重映射。 */
function updateMacKeyboardLayout(layoutMap: Record<string, string>): void {
  if (process.platform !== "darwin") return;
  macLayoutMap = layoutMap;
  hotkeyLogger().debug("updated_mac_keyboard_layout_map", {
    safe: { entryCount: Object.keys(layoutMap).length },
    sensitive: {},
  });
  refreshMacLayoutHotkeys();
}

/** 校验（原 `JV`）：5 种错误文案。 */
function validateHotkey(accelerator: string, platform = process.platform): string | null {
  return validateGlobalShortcut(accelerator, platform, { isBareModifierAccelerator, isBareOrUnsupported });
}

/** 触发权限/请求（原 `YV`/`XV`）。 */
function ensureHotkeyPermissions(accelerator: string, trigger?: string): void {
  requestBareModifierPermission(accelerator, trigger);
}

function ensureGlobalDictationPermissions(accelerator: string): void {
  if (process.platform === "darwin") {
    requestInputMonitoringPermission();
    return;
  }
  ensureHotkeyPermissions(accelerator);
}

function splitAccelerator(accelerator: string): string[] {
  return accelerator
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** 注册用 accelerator（原 `Pze`）：mac 布局重映射。 */
function registrationAcceleratorFor(accelerator: string): string {
  return process.platform !== "darwin" || macLayoutMap == null ? accelerator : remapForLayout(accelerator, macLayoutMap);
}

/** 单键注册（原 `ZV`）：generation 防陈旧回调。 */
function registerHotkeyEntry(entry: { registrationHotkey: string; generation: number; registered: boolean; onPressed(): void }): boolean {
  const generation = ++entry.generation;
  entry.registered = globalShortcut.register(entry.registrationHotkey, () => {
    if (suspendCount === 0 && entry.registered && entry.generation === generation) entry.onPressed();
  });
  return entry.registered;
}

/** 布局重映射（原 `OV`/`gze`/`_ze`）：单字符键按 layout 表换算。 */
function remapForLayout(accelerator: string, layoutMap: Record<string, string>): string {
  return remapGlobalShortcutForLayout(accelerator, layoutMap);
}

/** 布局变化后的全部重注册（原 `Fze`）：失败回滚到旧 accelerator。 */
function refreshMacLayoutHotkeys(): void {
  if (macLayoutMap == null) return;
  for (const entry of registeredHotkeys) {
    const remapped = remapForLayout(entry.hotkey, macLayoutMap);
    if (remapped === entry.registrationHotkey) continue;
    if (suspendCount > 0) {
      entry.registrationHotkey = remapped;
      continue;
    }
    const previousHotkey = entry.registrationHotkey;
    const previousGeneration = entry.generation;
    const previousRegistered = entry.registered;
    entry.registrationHotkey = remapped;
    const registered = registerHotkeyEntry(entry);
    hotkeyLogger().debug("refresh_mac_global_hotkey", {
      safe: {
        hotkey: entry.hotkey,
        previousRegistrationHotkey: previousHotkey,
        registrationHotkey: remapped,
        registered,
      },
      sensitive: {},
    });
    if (!registered) {
      entry.registrationHotkey = previousHotkey;
      entry.generation = previousGeneration;
      entry.registered = previousRegistered;
      continue;
    }
    globalShortcut.unregister(previousHotkey);
  }
}

// ---------------------------------------------------------------------------
// dictation-release-watcher（原 `Ize`~`Uze`）
// ---------------------------------------------------------------------------

/** PowerShell 轮询脚本模板（原 `Ize`）：GetAsyncKeyState 10ms。 */
const POWERSHELL_RELEASE_SCRIPT = `
$ErrorActionPreference = "Stop"

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class CodexKeyboardState {
  [DllImport("user32.dll")]
  private static extern short GetAsyncKeyState(int key);

  public static bool IsDown(int key) {
    return (GetAsyncKeyState(key) & 0x8000) != 0;
  }
}
"@

$keyGroupSpec = __KEY_GROUP_SPEC__
if ([string]::IsNullOrWhiteSpace($keyGroupSpec)) {
  throw "Missing hotkey release key groups."
}

$keyGroups = $keyGroupSpec.Split(";") | ForEach-Object {
  ,($_.Split(",") | ForEach-Object { [int]$_ })
}

$wasDown = $true
while ($true) {
  $isDown = $true
  foreach ($group in $keyGroups) {
    $groupDown = $false
    foreach ($key in $group) {
      if ([CodexKeyboardState]::IsDown($key)) {
        $groupDown = $true
        break
      }
    }
    if (-not $groupDown) {
      $isDown = $false
      break
    }
  }
  if ($wasDown -and -not $isDown) {
    [Console]::WriteLine("up")
  }
  $wasDown = $isDown
  Start-Sleep -Milliseconds 10
}
`;

/** mac 修饰键 → helper 名（原 `Lze`）。 */
const MAC_MODIFIER_NAMES = new Map<string, string>([
  ["cmdorctrl", "command"],
  ["command", "command"],
  ["cmd", "command"],
  ["control", "control"],
  ["ctrl", "control"],
  ["alt", "alternate"],
  ["option", "alternate"],
  ["shift", "shift"],
]);

/** win32 修饰键 → VK 码（原 `Rze`）。 */
const WIN32_MODIFIER_VK = new Map<string, number[]>([
  ["cmdorctrl", [17]],
  ["command", [91, 92]],
  ["cmd", [91, 92]],
  ["control", [17]],
  ["ctrl", [17]],
  ["alt", [18]],
  ["option", [18]],
  ["shift", [16]],
]);

/** 听写快捷键校验（原 `QV`）。 */
function validateGlobalDictationHotkey(accelerator: string): string | null {
  return (
    validateHotkey(accelerator) ??
    (isBareModifierAccelerator(accelerator) || isDictationWatchable(accelerator, process.platform)
      ? null
      : "Shortcut key is not supported for global dictation.")
  );
}

/** 释放监视（原 `$V`）：darwin 走 helper release 模式；win32 走 PowerShell。 */
function watchGlobalDictationRelease(accelerator: string, onRelease: () => void): { isActive: boolean; dispose(): void } {
  switch (process.platform) {
    case "darwin": {
      const watcher = watchMacModifierRelease(macModifierNames(accelerator), onRelease, true);
      if (watcher == null) throw new Error("Global dictation hotkey release watching is not supported.");
      return watcher;
    }
    case "win32": {
      const keyGroups = win32KeyGroups(accelerator, process.platform);
      if (keyGroups == null) throw new Error("Global dictation hotkey release watching is not supported.");
      return watchPowerShellRelease(
        spawn(
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            buildPowerShellScript(keyGroups.map((group) => group.join(",")).join(";")),
          ],
          { stdio: ["ignore", "pipe", "ignore"], windowsHide: true },
        ),
        onRelease,
      );
    }
    default:
      throw new Error("Global dictation hotkey release watching is not supported.");
  }
}

/** mac 修饰键名列表（原 `eH`）。 */
function macModifierNames(accelerator: string): string[] {
  const names: string[] = [];
  for (const part of accelerator.split("+")) {
    const name = MAC_MODIFIER_NAMES.get(part.trim().toLowerCase());
    if (name != null && !names.includes(name)) names.push(name);
  }
  return names;
}

/** PowerShell 脚本实例化（原 `zze`/`Hze`：单引号转义）。 */
function buildPowerShellScript(keyGroupSpec: string): string {
  return POWERSHELL_RELEASE_SCRIPT.replace("__KEY_GROUP_SPEC__", `'${keyGroupSpec.replace(/'/g, "''")}'`);
}

/** win32 的 VK 码分组（原 `tH`/`Vze`）。 */
function win32KeyGroups(accelerator: string, platform: string): number[][] | null {
  const groups: number[][] = [];
  for (const part of accelerator.split("+")) {
    const codes = win32VkForModifier(part, platform);
    if (codes != null) groups.push(codes);
  }
  return groups.length === 0 ? null : groups;
}

function win32VkForModifier(part: string, platform: string): number[] | null {
  const lowered = part.trim().toLowerCase();
  switch (platform) {
    case "darwin":
      return null;
    case "win32":
      return WIN32_MODIFIER_VK.get(lowered) ?? null;
    default:
      return null;
  }
}

/** PowerShell 释放监视（原 `Bze`）：up 行回调 + error/exit 兜底。 */
function watchPowerShellRelease(child: ReturnType<typeof spawn>, onRelease: () => void): { isActive: boolean; dispose(): void } {
  let done = false;
  const finish = (error?: unknown) => {
    if (done) return;
    done = true;
    if (error != null)
      getLogger().warning("Global dictation hotkey release watching failed", {
        safe: {},
        sensitive: { error },
      });
    onRelease();
  };
  let buffer = "";
  child.stdout?.on("data", (chunk) => {
    buffer += (chunk as Buffer).toString("utf8");
    let newlineIndex = buffer.indexOf("\n");
    for (; newlineIndex !== -1; ) {
      if (!done && buffer.slice(0, newlineIndex).trim() === "up") onRelease();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
    }
  });
  child.once("error", (error) => finish(error));
  child.once("exit", () => finish());
  return {
    get isActive() {
      return !done;
    },
    dispose: () => {
      done = true;
      child.kill();
    },
  };
}

/** 是否可释放监视（原 `Uze`）。 */
function isDictationWatchable(accelerator: string, platform: string): boolean {
  return isGlobalDictationWatchable(accelerator, platform, { macModifierNames, win32KeyGroups });
}

export {
  normalizeAccelerator,
  bareModifierName,
  registerBareModifier,
  setBareModifiersSuspended,
  requestInputMonitoringPermission,
  requestBareModifierPermission,
  watchMacModifierRelease,
  isBareModifierAccelerator,
  isBareOrUnsupported,
  suspendGlobalHotkeys,
  registerGlobalHotkey,
  updateMacKeyboardLayout,
  validateHotkey,
  ensureHotkeyPermissions,
  ensureGlobalDictationPermissions,
  validateGlobalDictationHotkey,
  watchGlobalDictationRelease,
  isDictationWatchable,
};
