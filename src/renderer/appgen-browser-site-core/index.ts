// appgen-browser-site-core —— 按当前 URL 选择最具体的 Site 浏览器条目。
// 原版：app/webview/assets/appgen-browser-site-e3ffe94b8e86.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appPrimaryChunk from "@rchunk/app-primary";

void runtimeChunk;
const {
  Sf: initializeSiteUrlMatcher,
  yf: isSiteUrlMatch,
} = appPrimaryChunk;

export interface BrowserSiteEntry extends Record<string, unknown> {
  alternateUrls?: Array<string | null | undefined> | null;
  type: string;
  url?: string | null;
}

function matchingSpecificity(
  currentUrl: string,
  siteUrl: string,
): number | null {
  return isSiteUrlMatch(currentUrl, siteUrl)
    ? new URL(siteUrl).pathname.replace(/\/+$/u, "").length
    : null;
}

function getAppgenBrowserSiteForUrl<Site extends BrowserSiteEntry>(
  sites: readonly Site[],
  currentUrl: string,
): Site | null {
  let bestMatch: { site: Site; specificity: number } | null = null;
  for (const site of sites) {
    if (site.type !== "appgen-app") continue;
    for (const siteUrl of [site.url, ...(site.alternateUrls ?? [])]) {
      if (siteUrl == null) continue;
      const specificity = matchingSpecificity(currentUrl, siteUrl);
      if (specificity != null && specificity > (bestMatch?.specificity ?? -1)) {
        bestMatch = { site, specificity };
      }
    }
  }
  return bestMatch?.site ?? null;
}

function initializeAppgenBrowserSite(): void {
  initializeSiteUrlMatcher();
}

export { initializeAppgenBrowserSite as n, getAppgenBrowserSiteForUrl as t };
