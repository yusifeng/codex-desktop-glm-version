// appgen-browser-site-core —— 按当前 URL 选择最具体的 Site 浏览器条目。
// 原版：app/webview/assets/appgen-browser-site-e3ffe94b8e86.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appPrimaryChunk from "@rchunk/app-primary";

void runtimeChunk;
const appPrimary = appPrimaryChunk as Record<string, any>;

function matchingSpecificity(currentUrl: string, siteUrl: string) {
  return appPrimary.yf(currentUrl, siteUrl)
    ? new URL(siteUrl).pathname.replace(/\/+$/u, "").length
    : null;
}

function getAppgenBrowserSiteForUrl(sites: any[], currentUrl: string) {
  let bestMatch: { site: any; specificity: number } | null = null;
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
  appPrimary.Sf?.();
}

export { initializeAppgenBrowserSite as n, getAppgenBrowserSiteForUrl as t };
