// 跨平台应用图标提取（util/app-icons）+ keymap 查询 + win32 路径工具。
//
// 对应 main-C-Mhak1n.ts 93,516-93,645：
//   - oH appIconDataUrl：darwin（plutil 读 CFBundleIconFile + qlmanage icns→png）、
//     win32（windows addon）、linux（nativeImage 直读）
//   - cH/lH lookupCommandHotkey、Yze setCommandHotkey、uH setIfUnbound、
//     dH preferKeymap（shared 的 keymap 读写 Tt/Ct）
//   - Xze analyzeWin32Path（网络盘/云盘判定 + ACL 支持）、fH isPathInside、
//     pH relocateToWsl（/a/、/b/ 前缀剥除 + 尾段匹配）
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, mkdtemp, rm, access } from "node:fs/promises";
import { join, basename, relative, isAbsolute, normalize, sep, win32 } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { nativeImage } from "electron";
import {
  Dl as toPosixPath,
  xl as isUncPath,
  Ui as isWslPath,
  bl as isWindowsPath,
  f as isPathlike,
  El as stripCygdrivePrefix,
  Ct as currentKeymap,
  Tt as updateKeymapBinding,
  Bi as sanitizedProcessEnv,
} from "@chunk/shared";
import { getWindowsAppIconSmall } from "../windows/native-app-icons";
import { isNetworkDrive, supportsPersistentAcls } from "../platform/windows-account";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// 应用图标（原 `oH`/`Gze`/`sH`/`Kze`/`qze`/`Jze`）
// ---------------------------------------------------------------------------

/** 图标文件 → dataURL（原 `sH`）。 */
function imageFileToDataUrl(path: string): string | null {
  try {
    const image = nativeImage.createFromPath(path);
    return image.isEmpty() ? null : image.toDataURL();
  } catch {
    return null;
  }
}

/** icns → png（原 `Jze`）：qlmanage -t -s 32。 */
async function icnsThumbnailDataUrl(icnsPath: string): Promise<string | null> {
  const tempDir = await mkdtemp(join(tmpdir(), "codex-app-icon-"));
  const pngPath = join(tempDir, `${basename(icnsPath)}.png`);
  try {
    await execFileAsync("/usr/bin/qlmanage", ["-t", "-s", "32", "-o", tempDir, icnsPath], {
      env: sanitizedProcessEnv(process.env),
    });
    return `data:image/png;base64,${(await readFile(pngPath)).toString("base64")}`;
  } catch {
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

/** Info.plist 的图标路径探测（原 `Kze`/`qze`）：plutil 提取 + 候选探测。 */
async function macAppBundleIconPath(appPath: string): Promise<string | null> {
  if (!appPath.endsWith(".app")) return null;
  const resourcesDir = join(appPath, "Contents", "Resources");
  const plistPath = join(appPath, "Contents", "Info.plist");
  const candidates = new Set<string>();
  let iconName: string | null = null;
  try {
    const { stdout } = await execFileAsync(
      "/usr/bin/plutil",
      ["-extract", "CFBundleIconFile", "raw", "-o", "-", plistPath],
      { encoding: "utf8", env: sanitizedProcessEnv(process.env) },
    );
    iconName = stdout.trim() === "" ? null : stdout.trim();
  } catch {
    iconName = null;
  }
  if (iconName != null && iconName !== "") {
    candidates.add(join(resourcesDir, iconName.endsWith(".icns") ? iconName : `${iconName}.icns`));
    candidates.add(join(resourcesDir, iconName));
  }
  candidates.add(join(resourcesDir, "AppIcon.icns"));
  return (
    (
      await Promise.all(
        [...candidates].map(async (candidate) => {
          try {
            await access(candidate);
            return candidate;
          } catch {
            return null;
          }
        }),
      )
    ).find((candidate) => candidate != null) ?? null
  );
}

/** 应用图标 dataURL（原 `oH`）：darwin qlmanage / win32 addon / linux nativeImage。 */
async function appIconDataUrl(appPath: string): Promise<string | null> {
  if (appPath.trim() === "") return null;
  if (process.platform === "darwin") {
    const iconPath = await macAppBundleIconPath(appPath);
    if (iconPath == null) return null;
    try {
      return iconPath.endsWith(".icns") ? await icnsThumbnailDataUrl(iconPath) : imageFileToDataUrl(iconPath);
    } catch {
      return null;
    }
  }
  if (process.platform === "win32") return getWindowsAppIconSmall(appPath, {});
  if (process.platform === "linux") {
    const iconPath = linuxDesktopEntryIcon(appPath);
    return iconPath == null ? null : imageFileToDataUrl(iconPath);
  }
  return null;
}

/**
 * linux 的 desktop entry 图标（原 PAe，XDG 主题解析）。
 * TODO(R6 后续)：linux-apps 簇（71,366-71,701）落地后接入真实实现；
 * 当前返回 null（无图标），linux 上的图标走 nativeImage 直读兜底。
 */
function linuxDesktopEntryIcon(_appPath: string): string | null {
  return null;
}

// ---------------------------------------------------------------------------
// keymap（原 `cH`/`lH`/`Yze`/`uH`/`dH`）
// ---------------------------------------------------------------------------

interface HotkeyBinding {
  hasBinding: boolean;
  hotkey: string | null;
}

/** 命令快捷键查询（原 `cH`/`lH`）。 */
function lookupCommandHotkey(commandId: string): HotkeyBinding {
  const keymap = (currentKeymap as () => { bindings: Array<{ command: string; key: string }> })();
  const binding = keymap.bindings.find((entry) => entry.command === commandId);
  return binding == null ? { hasBinding: false, hotkey: null } : { hasBinding: true, hotkey: binding.key };
}

/** 设置命令快捷键（原 `Yze`）：null 清除。 */
async function setCommandHotkey(commandId: string, accelerator: string | null): Promise<unknown> {
  return (updateKeymapBinding as (update: Record<string, unknown>) => Promise<unknown>)({
    commandId,
    update: accelerator == null ? { type: "clear" } : { type: "set", accelerator },
  });
}

/** 未绑定才设置（原 `uH`）。 */
async function setCommandHotkeyIfUnbound({ commandId, hotkey }: { commandId: string; hotkey: string | null }): Promise<unknown> {
  return hotkey == null || lookupCommandHotkey(commandId).hasBinding ? null : setCommandHotkey(commandId, hotkey);
}

/** keymap 优先（原 `dH`）。 */
function preferKeymapHotkey({ keymapHotkey, legacyHotkey }: { keymapHotkey: HotkeyBinding; legacyHotkey: string | null }): string | null {
  return keymapHotkey.hasBinding ? keymapHotkey.hotkey : legacyHotkey;
}

// ---------------------------------------------------------------------------
// win32 路径工具（原 `Xze`/`fH`/`pH`）
// ---------------------------------------------------------------------------

/** 网络盘/云盘判定（原 `Xze`）：UNC 一律网络盘（WSL 路径除外）；盘符查 addon。 */
async function analyzeWin32Path(path: string, { allowWslPaths = false } = {}): Promise<{ networkOrCloud: boolean; supportsPersistentAcls?: boolean }> {
  if (process.platform !== "win32") return { networkOrCloud: false };
  const posixPath = (toPosixPath as (path: string) => string)(path);
  if ((isUncPath as (path: string) => boolean)(posixPath))
    return { networkOrCloud: !(allowWslPaths && (isWslPath as (path: string) => boolean)(posixPath)) };
  if (!(isWindowsPath as (path: string) => boolean)(posixPath)) return { networkOrCloud: false };
  try {
    const root = win32.parse(posixPath).root;
    return isNetworkDrive(root)
      ? { networkOrCloud: true }
      : allowWslPaths
        ? { networkOrCloud: false }
        : { networkOrCloud: false, supportsPersistentAcls: await supportsPersistentAcls(path) };
  } catch {
    return { networkOrCloud: false };
  }
}

/** 路径包含判定（原 `fH`）。 */
function isPathInside(path: string, parent: string): boolean {
  const rel = relative(parent, path);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

/** WSL 路径重定位（原 `pH`）：/a/、/b/ 前缀剥除 + 尾段回退匹配。 */
function relocateToWsl(path: string, wslRoot: string | null, pathModule = { normalize, sep, join, basename } as typeof import("node:path")): string {
  const stripped = path.replace(/^([ab])[\\/]/, "");
  const normalized = pathModule.normalize(pathModule.sep === "\\" ? (stripCygdrivePrefix as (path: string) => string)(stripped) : stripped);
  if ((isPathlike as (path: string, pathModule?: unknown) => boolean)(normalized, pathModule) || !wslRoot) return normalized;
  const segments = normalized.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0) return wslRoot;
  const joined = pathModule.join(wslRoot, ...segments);
  if (existsSync(joined)) return joined;
  const rootName = pathModule.basename(wslRoot);
  const matchIndex = segments.indexOf(rootName);
  return matchIndex === -1 ? joined : pathModule.join(wslRoot, ...segments.slice(matchIndex + 1));
}

export {
  appIconDataUrl,
  lookupCommandHotkey,
  setCommandHotkey,
  setCommandHotkeyIfUnbound,
  preferKeymapHotkey,
  analyzeWin32Path,
  isPathInside,
  relocateToWsl,
};
