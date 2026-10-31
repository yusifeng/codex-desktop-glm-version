// 桌面元信息：应用图标族（按 build flavor 与平台）+ DesktopEnvironment。
//
// 对应 main-C-Mhak1n.ts 543-551（OS 名表 lt/ut）+ 63,405-63,541：
//   - aEe BrowserAuthServices（63,405）：把 browserAuthOperations 注入 services 包
//   - bT/xT/ST/CT/wT/TT 图标名与路径解析（63,414-63,476）
//   - oEe DesktopEnvironment（63,477-63,494）：版本/构建/flavor/OS/图标快照
//   - sEe/ET/cEe/DT 图标 dataURL（63,496-63,541，nativeImage resize 128）
import { existsSync } from "node:fs";
import { join } from "node:path";
import { app, nativeImage } from "electron";
import { Uf as EventEmitterBase, Bu as parseSemanticVersion } from "@chunk/shared";
import {
  in as BuildFlavor,
  nn as BuildNumber,
  l as readWindowsOemCustomData,
  m as getMacAppIconPath,
} from "@chunk/bootstrap";
import { getAppIconMedium } from "../windows/native-app-icons";
import { createBrowserAuthOperations } from "../api/browser-auth-operations";

// ---------------------------------------------------------------------------
// OS 名表（原 543-551 的 `lt`/`ut`）
// ---------------------------------------------------------------------------

const OS_NAMES: Record<string, string> = { darwin: "macOS", linux: "Linux", win32: "Windows" };

/** platform → 展示名（原 `ut`）。 */
function osNameOf(platform: string): string | undefined {
  if (platform === "darwin") return OS_NAMES.darwin;
  if (platform === "linux") return OS_NAMES.linux;
  if (platform === "win32") return OS_NAMES.win32;
}

// ---------------------------------------------------------------------------
// BrowserAuthServices（原 `aEe`）
// ---------------------------------------------------------------------------

/** 把 browserAuthOperations（renderer 表单填充记账）注入服务包（原 `aEe`）。 */
class BrowserAuthServices extends EventEmitterBase {
  #services: Record<string, unknown>;

  get services() {
    return this.#services;
  }

  constructor({ globalState, ...rest }: { globalState: { updateAndPersist(key: unknown, fn: (value: unknown) => unknown): Promise<void> } } & Record<string, unknown>) {
    super();
    this.#services = { ...rest, browserAuthOperations: createBrowserAuthOperations(globalState) };
  }
}

// ---------------------------------------------------------------------------
// 图标族（原 `bT`~`TT`）
// ---------------------------------------------------------------------------

/** Windows 托盘图标名（原 `bT`）。 */
function windowsTrayIconNames(flavor: string): { dark: string; light: string } {
  return flavor === (BuildFlavor as { Agent: string }).Agent
    ? { dark: "icon-agent.ico", light: "icon-agent.ico" }
    : { dark: "chatgpt-tray-dark.ico", light: "chatgpt-tray-light.ico" };
}

/** macOS 模板图标（原 `xT`）。 */
function macOSTemplateIconNames(): string[] {
  return ["chatgptTemplate.png", "chatgptTemplate@2x.png"];
}

/** flavor → 图标基名（原 `ST`）。 */
function iconBaseName(flavor: string): string {
  switch (flavor) {
    case (BuildFlavor as { Agent: string }).Agent:
      return "icon-agent";
    case (BuildFlavor as { Nightly: string }).Nightly:
      return "icon-chatgpt-nightly";
    case (BuildFlavor as { InternalAlpha: string }).InternalAlpha:
      return "icon-chatgpt-alpha";
    case (BuildFlavor as { PublicBeta: string }).PublicBeta:
      return "icon-chatgpt-beta";
    case (BuildFlavor as { Dev: string }).Dev:
    case (BuildFlavor as { Prod: string }).Prod:
      return "icon-chatgpt";
  }
}

/** flavor → codex 深浅色图标名（原 `CT`）。 */
function codexIconNames(flavor: string): { dark: string; light: string } {
  let suffix: string;
  switch (flavor) {
    case (BuildFlavor as { Dev: string }).Dev:
    case (BuildFlavor as { Prod: string }).Prod:
    case (BuildFlavor as { Agent: string }).Agent:
      suffix = "";
      break;
    case (BuildFlavor as { Nightly: string }).Nightly:
      suffix = "-nightly";
      break;
    case (BuildFlavor as { InternalAlpha: string }).InternalAlpha:
      suffix = "-alpha";
      break;
    case (BuildFlavor as { PublicBeta: string }).PublicBeta:
      suffix = "-beta";
      break;
    default:
      suffix = "";
  }
  return { dark: `icon-codex-dark-color${suffix}.png`, light: `icon-codex-light${suffix}.png` };
}

/** Linux/通用 PNG 图标路径（原 `wT`）。 */
function pngIconPath(flavor: string, iconsDirectory = join(app.getAppPath(), "src", "icons")): string | null {
  const name = `${iconBaseName(flavor)}.png`;
  if (app.isPackaged) {
    const packaged = join(process.resourcesPath, name);
    if (existsSync(packaged)) return packaged;
  }
  const dev = join(iconsDirectory, name);
  return existsSync(dev) ? dev : null;
}

/** Windows 应用图标路径（原 `TT`）。 */
function windowsAppIconPath(
  flavor: string,
  {
    isDark = nativeTheme.shouldUseDarkColorsForSystemIntegratedUI,
    localIconsDirectory = join(app.getAppPath(), ".generated", "windows-app-icons"),
  } = {},
): string | null {
  if (flavor === (BuildFlavor as { Agent: string }).Agent) return null;
  const name = isDark ? "chatgpt-app-dark.ico" : "chatgpt-app-light.ico";
  const path = app.isPackaged ? join(process.resourcesPath, name) : join(localIconsDirectory, name);
  return existsSync(path) ? path : null;
}

// nativeTheme 需要 import；放在这里避免顶部命名冲突。
import { nativeTheme } from "electron";

// ---------------------------------------------------------------------------
// 图标 dataURL（原 `sEe`/`ET`/`cEe`/`DT`）
// ---------------------------------------------------------------------------

/** 图标文件 → 128px dataURL（原 `DT`）。 */
function iconToDataUrl(path: string): string | null {
  const image = nativeImage.createFromPath(path);
  return image.isEmpty() ? null : image.resize({ width: 128, height: 128, quality: "best" }).toDataURL();
}

/** 单个图标名 → dataURL（原 `ET`）：打包优先 resourcesPath。 */
function iconDataUrlByName(name: string | null): string | null {
  if (name == null) return null;
  const packaged = app.isPackaged ? join(process.resourcesPath, name) : null;
  return iconToDataUrl(
    packaged != null && existsSync(packaged) ? packaged : join(app.getAppPath(), "src", "icons", name),
  );
}

/** dock 图标预览（原 `sEe`，仅 macOS）。 */
function dockIconPreviews(flavor: string): { appDefault: string; codexDark: string; codexLight: string } | null {
  if (process.platform !== "darwin") return null;
  const codexNames = codexIconNames(flavor);
  const appDefault = iconDataUrlByName(`${iconBaseName(flavor)}.png`);
  const codexDark = iconDataUrlByName(codexNames.dark);
  const codexLight = iconDataUrlByName(codexNames.light);
  return appDefault == null || codexDark == null || codexLight == null
    ? null
    : { appDefault, codexDark, codexLight };
}

/** 中号应用图标（原 `cEe`）：darwin 打包走 native addon，win 走 ico，其余 png。 */
async function appIconMedium(flavor: string): Promise<string | null> {
  let resolved: string | null = null;
  switch (process.platform) {
    case "darwin":
      return flavor === (BuildFlavor as { Dev: string }).Dev
        ? iconToDataUrl(join(app.getAppPath(), "src", "icons", "icon-dev-outline.png"))
        : app.isPackaged
          ? await getAppIconMedium(getMacAppIconPath() as unknown as string)
          : null;
    case "win32":
      resolved = windowsAppIconPath(flavor);
      break;
    case "linux":
    case "aix":
    case "android":
    case "cygwin":
    case "freebsd":
    case "haiku":
    case "netbsd":
    case "openbsd":
    case "sunos":
      resolved = pngIconPath(flavor);
  }
  return resolved == null ? iconDataUrlByName(`${iconBaseName(flavor)}.png`) : iconToDataUrl(resolved);
}

// ---------------------------------------------------------------------------
// DesktopEnvironment（原 `oEe`）
// ---------------------------------------------------------------------------

/** 桌面环境快照（原 `oEe`）。 */
class DesktopEnvironment extends EventEmitterBase {
  async get() {
    const flavor = (BuildFlavor as { resolve(): string }).resolve();
    return {
      version: (parseSemanticVersion(app.getVersion()) as { version: string }).version,
      buildNumber: (BuildNumber as { value: string | null }).value,
      buildFlavor: flavor,
      osName: osNameOf(process.platform) ?? null,
      systemVersion:
        typeof process.getSystemVersion == "function" ? process.getSystemVersion() : null,
      appName: app.getName(),
      chatGptDesktopAuthOrigin: undefined,
      chatGptApiBaseUrl: undefined,
      appIconMedium: await appIconMedium(flavor),
      dockIconPreviews: dockIconPreviews(flavor),
      preloadAttribution: await readWindowsOemCustomData(),
    };
  }
}

export {
  osNameOf,
  BrowserAuthServices,
  windowsTrayIconNames,
  macOSTemplateIconNames,
  iconBaseName,
  codexIconNames,
  pngIconPath,
  windowsAppIconPath,
  iconToDataUrl,
  iconDataUrlByName,
  dockIconPreviews,
  appIconMedium,
  DesktopEnvironment,
};
