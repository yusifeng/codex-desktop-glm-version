export const BROWSER_WEBVIEW_ADOPTION_LEASE = `owl-webcontents-adoption-lease`;
export const BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID = `owl-webcontents-adopted-web-contents-id`;

export function parsePositiveWebviewInstanceId(value: unknown): number | null {
  const instanceId = Number(value);
  return Number.isInteger(instanceId) && instanceId > 0 ? instanceId : null;
}

export function getWebviewInstanceId(params: {
  instanceId?: unknown;
}): number | null {
  return parsePositiveWebviewInstanceId(params.instanceId);
}

export function getAttachedWebviewInstanceId(webContents: {
  viewInstanceId?: unknown;
}): number | null {
  return parsePositiveWebviewInstanceId(webContents.viewInstanceId);
}

export function hasWebviewAdoptionLease(
  params: Record<string, unknown>,
): boolean {
  const lease = params[BROWSER_WEBVIEW_ADOPTION_LEASE];
  return typeof lease === `string` && lease.length > 0;
}

export function getAdoptedWebContentsId(
  params: Record<string, unknown>,
): number | null {
  return parsePositiveWebviewInstanceId(
    params[BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID],
  );
}

export function takePendingWebviewRoute(
  webContents: { viewInstanceId?: unknown },
  state: { pendingWebviewRoutesByInstanceId: Map<number, any> },
): any | null {
  const instanceId = getAttachedWebviewInstanceId(webContents);
  if (instanceId == null) return null;
  const pendingRoute =
    state.pendingWebviewRoutesByInstanceId.get(instanceId) ?? null;
  state.pendingWebviewRoutesByInstanceId.delete(instanceId);
  return pendingRoute;
}

/**
 * Completes a previously prepared WebContents adoption and replays its cloned
 * history action only after the semantic page owner points at the adopted view.
 */
export function attachPendingAdoptedWebview({
  attachWebview,
  routeKey,
  state,
  webContents,
}: {
  attachWebview(webContents: any, identity: Record<string, unknown>): unknown;
  routeKey(route: any): unknown;
  state: {
    pendingAdoptedWebviewsByWebContentsId: Map<number, any>;
    threads: Map<unknown, any>;
  };
  webContents: any;
}): boolean {
  if (webContents.isDestroyed()) return false;
  const pending =
    state.pendingAdoptedWebviewsByWebContentsId.get(webContents.id) ?? null;
  if (pending?.acceptedHostIdentity == null) return false;

  const page = state.threads.get(routeKey(pending.route))?.page;
  const initialHistoryNavigation = pending.initialHistoryNavigation;
  if (page != null && initialHistoryNavigation != null) {
    page.errorPagesByUrl = initialHistoryNavigation.errorPagesByUrl;
  }
  attachWebview(webContents, {
    ...pending.acceptedHostIdentity,
    route: pending.route,
    initialNavigationOwner:
      initialHistoryNavigation == null ? `owl` : `history-clone`,
  });
  pending.stopTracking();

  if (
    page?.view.webContents === webContents &&
    !webContents.isDestroyed() &&
    initialHistoryNavigation != null
  ) {
    if (initialHistoryNavigation.navigation === `back`) webContents.goBack();
    else if (initialHistoryNavigation.navigation === `forward`)
      webContents.goForward();
    else if (initialHistoryNavigation.navigation === `reload`)
      webContents.reload();
  }
  return true;
}
