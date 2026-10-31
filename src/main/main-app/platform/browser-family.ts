// 浏览器族服务（安装检测/扩展状态/安装横幅/扩展设置页/URL 打开）。
//
// 对应 main-C-Mhak1n.ts 71,762-71,843：
//   - MO BrowserFamilyService：getInstalledBrowserFamilies（shared 的
//     浏览器族配置逐个探测）、getExtensionStatus（chrome 扩展集解析 +
//     已安装 id）、getExtensionInstallBanner（默认浏览器探测 + 横幅）、
//     openExtensionSettings / openUrl
//   - NO defaultBrowserInfo：linux 走 XDG 枚举、win32 走 HKCU UserChoice
//     注册表 ProgId、darwin 走 app.getApplicationInfoForProtocol
//   - PO win32DefaultBrowser：ProgId → 浏览器族映射
//   - FO getCompatibleExtensionIds：仅 Dev flavor 读 bundled 插件目录
import { join } from "node:path";
import { app } from "electron";
import {
  Pc as BROWSER_FAMILY_CONFIGS,
  Bc as isKnownBrowserFamily,
  Ic as browserFamilyForProgId,
  Ul as marketplaceNameForFlavor,
  Al as devChromeHostPath,
  on as listDirectory,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";
import {
  isChromiumBrowserInstalled,
  resolveChromeExtensionSet,
  findInstalledExtensionId,
  getMissingChromeExtensionInstallInfo,
  openBrowserExtensionSettings,
  openChromiumUrl,
  getBundledPluginsResourcesPath,
} from "../plugins/browser-runtime-resolution";
import { listWebUrlHandlers } from "../mac/launch-services";
import { readRegistryValue } from "../platform/windows-account";

const USER_CHOICE_REGISTRY_KEY = "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice";

interface DefaultBrowserInfo {
  defaultBrowserName: string;
  defaultBrowserPath: string;
}

/** 默认浏览器探测（原 `NO`）：linux XDG / win32 注册表 / darwin 系统 API。 */
async function defaultBrowserInfo(): Promise<DefaultBrowserInfo | null> {
  if (process.platform === "linux") {
    const handlers = await (listWebUrlHandlers as () => Promise<{ applications: Array<{ appPath: string; displayName: string }>; defaultApplicationPath: string | null } | null>)();
    const applications = handlers?.applications ?? [];
    const defaultApplicationPath = handlers?.defaultApplicationPath ?? null;
    const defaultBrowser = applications.find((application) => application.appPath === defaultApplicationPath);
    return defaultBrowser == null
      ? null
      : { defaultBrowserName: defaultBrowser.displayName, defaultBrowserPath: defaultBrowser.appPath };
  }
  if (process.platform !== "darwin" && process.platform !== "win32") return null;
  if (process.platform === "win32") {
    const resolved = await win32DefaultBrowser();
    if (resolved.status === "resolved") return resolved.browser;
    if (resolved.status === "unsupported") return null;
  }
  const { name, path } = await (app as unknown as {
    getApplicationInfoForProtocol(protocol: string): Promise<{ name: string; path: string }>;
  }).getApplicationInfoForProtocol("https://");
  return { defaultBrowserName: name, defaultBrowserPath: path };
}

/** win32 的 UserChoice ProgId 解析（原 `PO`）。 */
async function win32DefaultBrowser(): Promise<
  { status: "resolved"; browser: DefaultBrowserInfo } | { status: "unsupported" } | { status: "unavailable" }
> {
  try {
    const progId = readRegistryValue({ key: USER_CHOICE_REGISTRY_KEY, name: "ProgId" });
    if (progId == null || progId.length === 0) return { status: "unavailable" };
    const browserFamily = (browserFamilyForProgId as (progId: string) => string | null)(progId);
    if (browserFamily == null) return { status: "unsupported" };
    const config = (BROWSER_FAMILY_CONFIGS as Record<string, { displayName: string; windows: { commandNames: string[] } }>)[browserFamily];
    const commandName = config?.windows.commandNames[0];
    return commandName == null
      ? { status: "unavailable" }
      : {
          browser: { defaultBrowserName: config.displayName, defaultBrowserPath: commandName },
          status: "resolved",
        };
  } catch {
    return { status: "unavailable" };
  }
}

/** 兼容扩展 id 列表（原 `FO`）：仅 Dev flavor 读 bundled 插件目录。 */
async function getCompatibleExtensionIds(flavor: string): Promise<string[] | undefined> {
  if (flavor !== (BuildFlavor as { Dev: string }).Dev) return undefined;
  const marketplaceName = (marketplaceNameForFlavor as (flavor: string) => string)(flavor);
  try {
    return (await (listDirectory as (path: string) => Promise<string[]>)(join(getBundledPluginsResourcesPath(), "plugins", marketplaceName, "plugins", devChromeHostPath as string))) ?? [];
  } catch {
    return [];
  }
}

/** 浏览器族服务（原 `MO`）。 */
class BrowserFamilyService {
  getCompatibleExtensionIds: (flavor: string) => Promise<string[] | undefined>;

  constructor({ getCompatibleExtensionIds: resolver = getCompatibleExtensionIds } = {}) {
    this.getCompatibleExtensionIds = resolver;
  }

  /** 已安装的浏览器族（原 `getInstalledBrowserFamilies`）。 */
  async getInstalledBrowserFamilies(): Promise<string[]> {
    const families = Object.keys(BROWSER_FAMILY_CONFIGS).filter((family) =>
      (isKnownBrowserFamily as (family: string) => boolean)(family),
    );
    return (
      await Promise.all(
        families.map(async (family) => ({
          browserFamily: family,
          installed: await isChromiumBrowserInstalled({ browserFamily: family }),
        })),
      )
    ).flatMap(({ browserFamily, installed }) => (installed ? [browserFamily] : []));
  }

  /** 扩展状态（原 `getExtensionStatus`）：安装 URL + 已安装 id。 */
  async getExtensionStatus({ browserFamily }: { browserFamily: string }): Promise<{ installUrl: string; installedExtensionId: string | null }> {
    const flavor = (BuildFlavor as { resolve(): string }).resolve();
    const extensionSet = resolveChromeExtensionSet({
      browserFamily,
      buildFlavor: flavor,
      compatibleExtensionIds: await this.getCompatibleExtensionIds(flavor),
    });
    const installedExtensionId = findInstalledExtensionId({
      extensionIds: extensionSet.extensionIds,
      browserFamily,
    });
    return { installUrl: extensionSet.installUrl, installedExtensionId };
  }

  /** 安装横幅（原 `getExtensionInstallBanner`）：默认浏览器受支持且缺扩展时。 */
  async getExtensionInstallBanner(): Promise<{ browserFamily: string; displayName: string; installUrl: string } | null> {
    try {
      const flavor = (BuildFlavor as { resolve(): string }).resolve();
      const [compatibleExtensionIds, defaultBrowser] = await Promise.all([
        this.getCompatibleExtensionIds(flavor),
        defaultBrowserInfo(),
      ]);
      if (defaultBrowser == null) return null;
      return getMissingChromeExtensionInstallInfo({
        buildFlavor: flavor,
        compatibleExtensionIds,
        defaultBrowserName: defaultBrowser.defaultBrowserName,
        defaultBrowserPath: defaultBrowser.defaultBrowserPath,
      });
    } catch {
      return null;
    }
  }

  async openExtensionSettings({ browserFamily, extensionId }: { browserFamily: string; extensionId: string }): Promise<void> {
    await openBrowserExtensionSettings({ browserFamily, extensionId });
  }

  async openUrl({ browserFamily, url }: { browserFamily: string; url: string }): Promise<void> {
    await openChromiumUrl({ browserFamily, url });
  }
}

export {
  BrowserFamilyService,
  defaultBrowserInfo,
  getCompatibleExtensionIds,
  USER_CHOICE_REGISTRY_KEY,
};
