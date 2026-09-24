// browser-use 站点数据清理 —— 原 main-C-Mhak1n.ts 11,093-11,157 行
// （`Wc`→persist partition 前缀、`Gc`→站点数据类型、`Kc`→SIWC cookie 名集合、
// `qc`→SIWC cookie 前缀、`Jc`→partition 名、`Yc`→首选语言、`Xc`→SIWC cookie
// 清理、`Zc`→浏览数据清理、`el/tl/nl`→IAB chrome: 内部 URL 放行开关）。
//
// 消费方：browser-session / in-app browser 窗口管理（R3+ 区，如 70,593 /
// 119,404 / 120,133 行）。

import { app } from "electron";

/** persist partition 前缀（原 `Wc`）。 */
export const BROWSER_USE_PERSIST_PARTITION_PREFIX = `persist:codex-browser-`;
/** 「siteData」清理时逐项清空的存储类型（原 `Gc`）。 */
const SITE_DATA_TYPES = [`fileSystems`, `indexedDB`, `localStorage`, `webSQL`, `serviceWorkers`];
/** SIWC / 站点会话 cookie 名集合（原 `Kc`）。 */
const SIWC_COOKIE_NAMES = new Set([
  `__Host-chatgpt_sites_session`,
  `appgarden_siwc_login`,
  `appgarden_siwc_session`,
  `appgen_admin_review_token`,
  `chatgpt_sites_siwc_login`,
  `chatgpt_sites_siwc_session`,
  `sites_preview_token`,
]);
/** SIWC cookie 名前缀（原 `qc`）。 */
const SIWC_COOKIE_PREFIX = `chatgpt_sites_siwc_login_`;

/** 由站点 host 构造 persist partition 名（原 `Jc`）。 */
export function browserUsePartitionNameForHost(host: string): string {
  return `${BROWSER_USE_PERSIST_PARTITION_PREFIX}${encodeURIComponent(host)}`;
}

/** 应用首选语言（覆盖语言 + 系统语言去重，空则回落 locale；原 `Yc`）。 */
export function applyPreferredLanguages(
  session: { setPreferredLanguages(languages: string[]): void },
  preferredLanguage?: string,
) {
  let languages = [
    ...new Set([...(preferredLanguage == null ? [] : [preferredLanguage]), ...app.getPreferredSystemLanguages()]),
  ];
  session.setPreferredLanguages(languages.length > 0 ? languages : [app.getLocale()]);
}

/** 清除 SIWC / 站点会话 cookie（有删除时 flushStore；原 `Xc`）。 */
export async function clearSiwcCookies(session: {
  cookies: {
    get(filter: Record<string, never>): Promise<{ name: string; domain?: string; path?: string }[]>;
    remove(url: string, name: string): Promise<void>;
    flushStore(): Promise<void>;
  };
}) {
  let cookies = (await session.cookies.get({})).filter(
    (cookie) => SIWC_COOKIE_NAMES.has(cookie.name) || cookie.name.startsWith(SIWC_COOKIE_PREFIX),
  );
  await Promise.all(
    cookies.map(async (cookie) => {
      cookie.domain != null &&
        (await session.cookies.remove(
          `https://${cookie.domain.replace(/^\./, ``)}${cookie.path ?? `/`}`,
          cookie.name,
        ));
    }),
  ),
    cookies.length > 0 && (await session.cookies.flushStore());
}

/** 按清理请求清理浏览数据（原 `Zc`）。 */
export async function clearBrowserData(
  session: {
    clearData(options: {
      dataTypes: string[];
      timeRange?: unknown;
    }): Promise<void>;
  },
  requested: string[],
  timeRange?: unknown,
) {
  let dataTypes: string[] = [];
  requested.includes(`cookies`) && dataTypes.push(`cookies`),
    requested.includes(`siteData`) &&
      (timeRange == null ? dataTypes.push(...SITE_DATA_TYPES) : dataTypes.push(`siteData`)),
    requested.includes(`cache`) && dataTypes.push(`cache`),
    requested.includes(`downloads`) && dataTypes.push(`downloads`),
    requested.includes(`history`) && dataTypes.push(`history`),
    requested.includes(`formData`) && dataTypes.push(`formData`),
    requested.includes(`siteSettings`) && dataTypes.push(`siteSettings`),
    dataTypes.length !== 0 &&
      (await session.clearData(timeRange == null ? { dataTypes } : { dataTypes, timeRange }));
}

// ---- IAB chrome: 内部 URL 放行开关（原 el/tl/nl，11,151-11,157）----------------

/** IAB（in-app browser）内是否放行 chrome: 内部 URL（模块级可变状态，原 `el`）。 */
let inAppBrowserChromeUrlsAllowed = !1;

/** 设置 IAB chrome: 内部 URL 放行开关（原 `tl`）。 */
export function setInAppBrowserChromeUrlsAllowed(allowed: boolean) {
  inAppBrowserChromeUrlsAllowed = allowed;
}

/** 读取 IAB chrome: 内部 URL 放行开关（原 `nl`）。 */
export function isInAppBrowserChromeUrlsAllowed(): boolean {
  return inAppBrowserChromeUrlsAllowed;
}
