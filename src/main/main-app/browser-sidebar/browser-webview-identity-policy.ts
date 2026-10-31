// @ts-nocheck

/** Owns trusted-session admission, runtime route identities, and synchronous annotation policy waits. */
export function createBrowserWebviewIdentityPolicy({
  browserRoutePartitionPrefix,
  hashBrowserStorageId,
  isInternalEnvironment,
  parseBrowserTabId,
  webviewPartitionSuffix,
}: Record<string, any>) {
  const trustedSessions = new WeakSet();

  const markTrustedSession = (session: object) => trustedSessions.add(session);
  const isTrustedSession = (session: object) => trustedSessions.has(session);

  function resolveSynchronousAnnotationPolicy(
    event: any,
    senderWebContents: any,
    ownerWebContents: any,
    resolvePolicy: (webContents: any, url: string) => any,
    defer: (callback: () => void) => () => void,
  ) {
    const disabled = {
      enabled: false,
      siteAnnotationFeaturesEnabled: true,
      siteAnnotationPermissionGranted: false,
      canUseTweaks: false,
      isAgentControllingBrowser: false,
      isAnnotationModeActive: false,
    };
    if (
      event.senderFrame == null ||
      event.senderFrame !== senderWebContents.mainFrame
    ) {
      event.returnValue = disabled;
      return;
    }
    const senderUrl = event.senderFrame.url;
    const immediate = resolvePolicy(senderWebContents, senderUrl);
    if (immediate != null) {
      event.returnValue = immediate;
      return;
    }
    const cancelDeferred = defer(() => {
      const policy = resolvePolicy(senderWebContents, senderUrl);
      if (policy != null) {
        dispose();
        event.returnValue = policy;
      }
    });
    const dispose = () => {
      cancelDeferred();
      senderWebContents.removeListener(`destroyed`, dispose);
      senderWebContents.removeListener(`render-process-gone`, dispose);
      senderWebContents.removeListener(
        `did-start-navigation`,
        handleNavigation,
      );
      ownerWebContents.removeListener(`destroyed`, cancel);
      ownerWebContents.removeListener(`render-process-gone`, cancel);
    };
    const cancel = () => {
      dispose();
      event.returnValue = disabled;
    };
    const handleNavigation = (
      _event: any,
      _url: string,
      isInPlace: boolean,
      isMainFrame: boolean,
    ) => {
      if (isMainFrame && !isInPlace) cancel();
    };
    senderWebContents.on(`destroyed`, dispose);
    senderWebContents.on(`render-process-gone`, dispose);
    senderWebContents.on(`did-start-navigation`, handleNavigation);
    ownerWebContents.on(`destroyed`, cancel);
    ownerWebContents.on(`render-process-gone`, cancel);
  }

  const isWebMcpEnabled = (environment: string, enabled: boolean) =>
    isInternalEnvironment(environment) || enabled;

  function basePartition(partition: string | null | undefined): string | null {
    if (partition == null) return null;
    const suffixIndex = partition.lastIndexOf(webviewPartitionSuffix);
    return suffixIndex === -1 ? partition : partition.slice(0, suffixIndex);
  }

  function routeFromWebviewParams(params: any): any | null {
    const conversationId =
      params[`data-browser-sidebar-conversation-id`] ??
      params[`data-conversation-id`] ??
      null;
    const browserTabId = params[`data-browser-sidebar-browser-tab-id`] ?? null;
    if (
      typeof conversationId === `string` &&
      conversationId.length > 0 &&
      typeof browserTabId === `string` &&
      browserTabId.length > 0
    )
      return { browserTabId: parseBrowserTabId(browserTabId), conversationId };
    const partition = basePartition(params.partition);
    if (
      partition == null ||
      !partition.startsWith(`persist:codex-browser-app-route:`)
    )
      return null;
    try {
      const decoded = decodeURIComponent(
        partition.slice(browserRoutePartitionPrefix.length),
      );
      if (decoded.length === 0) return null;
      const [decodedConversationId, decodedBrowserTabId] = decoded.split(`\0`);
      return decodedConversationId == null ||
        decodedConversationId.length === 0 ||
        decodedBrowserTabId == null ||
        decodedBrowserTabId.length === 0
        ? null
        : {
            browserTabId: parseBrowserTabId(decodedBrowserTabId),
            conversationId: decodedConversationId,
          };
    } catch {
      return null;
    }
  }

  function hostIdentityFromWebviewParams(params: any): any | null {
    const partition = params.partition;
    if (typeof partition !== `string`) return null;
    const suffixIndex = partition.lastIndexOf(webviewPartitionSuffix);
    if (suffixIndex === -1) return null;
    const suffix = partition.slice(suffixIndex + webviewPartitionSuffix.length);
    const separator = suffix.lastIndexOf(`:`);
    if (separator === -1) return null;
    const rendererInstanceId = suffix.slice(0, separator);
    const hostGeneration = Number(suffix.slice(separator + 1));
    return rendererInstanceId.length === 0 ||
      !Number.isInteger(hostGeneration) ||
      hostGeneration <= 0
      ? null
      : { hostGeneration, rendererInstanceId };
  }

  const makeBrowserStorageId = ({ browserTabId, conversationId }: any) =>
    hashBrowserStorageId(`${conversationId}\0${browserTabId}`);

  return {
    basePartition,
    hostIdentityFromWebviewParams,
    isTrustedSession,
    isWebMcpEnabled,
    makeBrowserStorageId,
    markTrustedSession,
    resolveSynchronousAnnotationPolicy,
    routeFromWebviewParams,
  };
}
