// @ts-nocheck

export function openBrowserForDeepLink(options: Record<string, any>) {
  const {
    browserActive,
    browserTabId,
    browserUrl,
    conversationId,
    initiator = `open_in_browser_bridge`,
    window,
    windowManager,
  } = options;
  if (browserUrl == null) return;

  if (browserActive === false && browserTabId != null) {
    windowManager.sendMessageToWindow(window, {
      type: `open-browser-tab`,
      active: false,
      browserTabId,
      conversationId,
      initialUrl: browserUrl,
      source: `manual`,
      initiator,
    });
    return;
  }

  windowManager.sendMessageToWindow(window, {
    type: `toggle-browser-panel`,
    ...(browserTabId == null ? {} : { browserTabId }),
    conversationId,
    open: true,
    url: browserUrl,
    source: `manual`,
    initiator,
  });
}

export async function findPluginMarketplacePath(options: Record<string, any>) {
  const { listPlugins, marketplaceName, pluginName, localMarketplacesOnly } = options;
  if (listPlugins == null) return null;
  const { marketplaces } = await listPlugins(
    localMarketplacesOnly ? { marketplaceKinds: [`local`] } : {},
  );
  return (
    marketplaces.find(
      (marketplace: Record<string, any>) =>
        marketplace.path != null &&
        marketplace.name === marketplaceName &&
        marketplace.plugins.some((plugin: Record<string, any>) => plugin.name === pluginName),
    )?.path ?? null
  );
}

if (typeof module !== "undefined") {
  module.exports = { findPluginMarketplacePath, openBrowserForDeepLink };
}
