import { b as isHttpUrlAllowed } from "@chunk/bootstrap";

import { isLocalUrl } from "../browser/link-opening";
import { isInAppBrowserChromeUrlsAllowed } from "./site-data";

export type BrowserNavigationResourceType = `mainFrame` | `subFrame` | string;

function isBlankLikeUrl(value: string): boolean {
  try {
    let url = new URL(value);
    return (
      url.protocol === `data:` ||
      (url.protocol === `about:` && (url.pathname === `blank` || url.pathname === `srcdoc`))
    );
  } catch {
    return !1;
  }
}

function isChromeUrl(value: string): boolean {
  try {
    return new URL(value).protocol === `chrome:`;
  } catch {
    return !1;
  }
}

/** 从本地页发起的非本地 subframe 导航需要由上层取消（原 `Qc`）。 */
export function shouldBlockLocalSubframeNavigation({
  currentUrl,
  requestUrl,
  resourceType,
}: {
  currentUrl?: string | null;
  requestUrl: string;
  resourceType?: string;
}): boolean {
  return (
    resourceType === `subFrame` &&
    !isBlankLikeUrl(requestUrl) &&
    !isLocalUrl(requestUrl) &&
    currentUrl != null &&
    isLocalUrl(currentUrl)
  );
}

/** Electron 导航事件里受 Browser Use policy 管理的两类 frame（原 `Wae`）。 */
export function isBrowserNavigationResourceType(resourceType: string): boolean {
  return resourceType === `mainFrame` || resourceType === `subFrame`;
}

export interface BrowserUseNavigationRestrictionOptions {
  findPageStateForPageKey(pageKey: unknown): any | null;
  findPageStateForWebContentsId(webContentsId: number): any | null;
  onNavigationBlocked?(
    pageEntry: any,
    error: Error,
    url: string,
    details: { resourceType?: string },
  ): void;
}

/** Browser Use 激活期间的页面导航 policy owner（原 `Vae`）。 */
export class BrowserUseNavigationRestriction {
  constructor(private readonly options: BrowserUseNavigationRestrictionOptions) {}

  activate(pageKey: unknown): void {
    let pageEntry = this.options.findPageStateForPageKey(pageKey);
    if (pageEntry != null) pageEntry.threadState.isBrowserUseNavigationRestrictionActive = !0;
  }

  assertAllowed(pageKey: unknown, url: string): void {
    let pageEntry = this.options.findPageStateForPageKey(pageKey);
    if (pageEntry == null) return;
    let error = this.getRestrictionError(pageEntry.threadState, url);
    if (error != null) {
      this.options.onNavigationBlocked?.(pageEntry, error, url, { resourceType: `mainFrame` });
      throw error;
    }
  }

  isRestrictedForWebContentsId(
    webContentsId: number | null | undefined,
    url: string,
    details: { resourceType?: string } = {},
  ): boolean {
    if (webContentsId == null) return !1;
    let pageEntry = this.options.findPageStateForWebContentsId(webContentsId);
    return pageEntry != null && this.isRestrictedForPageEntry(pageEntry, url, details);
  }

  isRestrictedForPageEntry(
    pageEntry: any,
    url: string,
    details: { resourceType?: string },
  ): boolean {
    if (details.resourceType === `subFrame` && isBlankLikeUrl(url)) return !1;
    let error = this.getRestrictionError(pageEntry.threadState, url);
    if (error == null) return !1;
    this.options.onNavigationBlocked?.(pageEntry, error, url, details);
    return !0;
  }

  getRestrictionError(threadState: any, url: string): Error | null {
    return threadState.isBrowserUseNavigationRestrictionActive &&
      !isHttpUrlAllowed(url) &&
      !(isInAppBrowserChromeUrlsAllowed() && isChromeUrl(url))
      ? Error(`Blocked browser navigation by Browser Use URL policy: ${url}`)
      : null;
  }
}
