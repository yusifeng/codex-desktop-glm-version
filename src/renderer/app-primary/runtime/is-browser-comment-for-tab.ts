import { normalizeAnnotationOrigin } from "../../app-shared/runtime/normalize-annotation-origin";

export interface BrowserCommentLike {
  localBrowserAttachedImages?: readonly unknown[] | null;
  localBrowserCommentMetadata?: { browserTabId?: string | null } | null;
  localBrowserContext?: unknown;
  localBrowserDesignChange?: unknown;
  localBrowserScreenshot?: unknown;
  origin?: string | null;
}

/** Match the release browser-content predicate, including legacy local fields. */
export function isBrowserComment(value: BrowserCommentLike): boolean {
  const origin = normalizeAnnotationOrigin(value);
  if (origin != null) return origin === "browser";
  return value.localBrowserContext != null ||
    value.localBrowserCommentMetadata != null ||
    value.localBrowserDesignChange != null ||
    value.localBrowserScreenshot != null ||
    (value.localBrowserAttachedImages?.length ?? 0) > 0;
}

/** Match a browser comment to its associated tab. */
export function isBrowserCommentForTab<T extends BrowserCommentLike>(
  comment: T,
  tabId: string,
  isBrowserCommentValue: (value: T) => boolean = isBrowserComment,
  getTabId: (value: T) => string | null | undefined =
    (value) => value.localBrowserCommentMetadata?.browserTabId,
): boolean {
  return isBrowserCommentValue(comment) && getTabId(comment) === tabId;
}
