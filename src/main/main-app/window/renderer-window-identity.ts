const RENDERER_WINDOW_PREFIX = "codex-renderer-window:";

export const BROWSER_COMMENT_POPUP_WINDOW_ID = "browserCommentPopup";

export type BrowserCommentPopupIdentity<TBrowserTabId> = {
  windowId: typeof BROWSER_COMMENT_POPUP_WINDOW_ID;
  browserTabId: TBrowserTabId;
  conversationId: string;
  sessionId: string;
};

export function parseBrowserCommentPopupFrameName<TBrowserTabId>(
  frameName: string,
  parseBrowserTabId: (value: string) => TBrowserTabId,
): BrowserCommentPopupIdentity<TBrowserTabId> | null {
  if (!frameName.startsWith(RENDERER_WINDOW_PREFIX)) return null;
  const payload = frameName.slice(RENDERER_WINDOW_PREFIX.length);
  const windowIdEnd = payload.indexOf(":");
  if (windowIdEnd < 0) return null;
  const windowId = payload.slice(0, windowIdEnd);
  if (windowId !== BROWSER_COMMENT_POPUP_WINDOW_ID) return null;
  const identity = payload.slice(windowIdEnd + 1);
  const sessionSeparator = identity.indexOf(":");
  if (sessionSeparator < 0) return null;
  try {
    const [conversationId, browserTabId] = decodeURIComponent(identity.slice(0, sessionSeparator)).split("\0");
    const sessionId = decodeURIComponent(identity.slice(sessionSeparator + 1));
    return conversationId?.length > 0 && browserTabId?.length > 0 && sessionId.length > 0
      ? {
          windowId: BROWSER_COMMENT_POPUP_WINDOW_ID,
          browserTabId: parseBrowserTabId(browserTabId),
          conversationId,
          sessionId,
        }
      : null;
  } catch {
    return null;
  }
}
