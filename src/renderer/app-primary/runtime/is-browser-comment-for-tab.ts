/** Match a browser comment to a tab after validating its metadata shape. */
export function isBrowserCommentForTab<T>(comment: T, tabId: string, isBrowserComment: (value: T) => boolean, getTabId: (value: T) => string | null | undefined): boolean {
  return isBrowserComment(comment) && getTabId(comment) === tabId;
}
