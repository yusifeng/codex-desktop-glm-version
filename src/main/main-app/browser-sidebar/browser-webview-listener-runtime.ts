type BrowserRoute = {
  browserTabId: string;
  conversationId: string;
};

type Logger = {
  info(message: string, fields: unknown): void;
  warning(message: string, fields: unknown): void;
};

export const WEB_MCP_LIMITS = Object.freeze({
  maxTools: 100,
  maxTotalDescriptorBytes: 65_536,
  maxRegistrationChanges: 10,
});

type BrowserWebviewListenerDependencies = {
  adoptionLeaseAttribute: string;
  attachPendingAdoptedWebview(options: Record<string, unknown>): void;
  basePartition(partition: string | undefined): string | null;
  bindBrowserSettingsWebview(options: Record<string, unknown>): void;
  configureBrowserPageWebviewPreferences(options: Record<string, unknown>): void;
  configureBrowserSettingsWebviewPreferences(options: Record<string, unknown>): void;
  createLogger(name: string): Logger;
  effectivePageUrl(page: unknown): string;
  findBrowserSettingsWebviewDefinition(params: Record<string, unknown>): unknown;
  getAdoptedWebContentsId(params: Record<string, unknown>): number | null;
  getDesktopFeatureAvailability(): Record<string, any>;
  getWebviewInstanceId(params: Record<string, unknown>): string | null;
  hasWebviewAdoptionLease(params: Record<string, unknown>): boolean;
  hostIdentityFromWebviewParams(params: Record<string, unknown>): any;
  isBrowserRoutePartition(partition: string | undefined): boolean;
  isCheckoutAttachParams(params: Record<string, unknown>): boolean;
  isCheckoutWebContents(webContents: any): boolean;
  isFirstPartyAuthenticatedPartition(params: Record<string, unknown>): boolean;
  isFirstPartyAuthenticatedSession(session: unknown): boolean;
  isLocalUrl(url: string): boolean;
  isTrustedSession(session: unknown): boolean;
  isWebMcpEnabled(environment: string, enabled: boolean): boolean;
  isWorkspaceSettingsAttachParams(params: Record<string, unknown>): boolean;
  isWorkspaceSettingsWebContents(webContents: any): boolean;
  makeBrowserStorageId(route: BrowserRoute): string;
  pageRestoreAttribute: string;
  resolveSynchronousAnnotationPolicy(...args: any[]): void;
  routeFromWebviewParams(params: Record<string, unknown>): BrowserRoute | null;
  routeKey(route: BrowserRoute): string;
  screen: { getCursorScreenPoint(): { x: number; y: number } };
  takePendingBrowserSettingsWebview(webContents: any, state: any): any;
  takePendingWebviewRoute(webContents: any, state: any): any;
  threadBrowserTabKey(value: string): string;
  webMcpLimits: typeof WEB_MCP_LIMITS;
};

type BrowserWebviewListenerOptions = {
  admitBrowserTab(): boolean;
  cancelPendingWebviewAttaches(): void;
  reconcileBrowserStorageId(thread: any, persistence: any): boolean;
  attachWebview(webContents: any, pendingRoute: any): void;
  attachedWebviewHosts: Map<any, any>;
  configureBrowserSession(): any;
  getAnnotationApiPolicy(webContents: any, route: string): any;
  subscribeAnnotationApiAvailability(listener: () => void): () => void;
  ensureThreadStateForWindow(conversationId: string, browserTabId: string): any;
  handleWebviewDestroyedBeforeAttach(route: BrowserRoute): void;
  isPagePersistenceAllowed(): boolean;
  openBrowserSettingsUrlInTab(url: string): void;
  owner: any;
  prepareWebviewAttach(thread: any, input: any, persistence: any): any;
  preloadPath: string;
  recordDebugEvent(event: Record<string, unknown>): void;
  state: any;
  windowId: number;
};

/** Owns BrowserWindow webview admission, attachment, IPC policy, Alt forwarding, and listener cleanup. */
export function createBrowserWebviewListenerRuntime(
  dependencies: BrowserWebviewListenerDependencies,
) {
  const {
    adoptionLeaseAttribute,
    attachPendingAdoptedWebview,
    basePartition,
    bindBrowserSettingsWebview,
    configureBrowserPageWebviewPreferences,
    configureBrowserSettingsWebviewPreferences,
    effectivePageUrl,
    findBrowserSettingsWebviewDefinition,
    getAdoptedWebContentsId,
    getDesktopFeatureAvailability,
    getWebviewInstanceId,
    hasWebviewAdoptionLease,
    hostIdentityFromWebviewParams,
    isBrowserRoutePartition,
    isCheckoutAttachParams,
    isCheckoutWebContents,
    isFirstPartyAuthenticatedPartition,
    isFirstPartyAuthenticatedSession,
    isLocalUrl,
    isTrustedSession,
    isWebMcpEnabled,
    isWorkspaceSettingsAttachParams,
    isWorkspaceSettingsWebContents,
    makeBrowserStorageId,
    pageRestoreAttribute,
    resolveSynchronousAnnotationPolicy,
    routeFromWebviewParams,
    routeKey,
    screen,
    takePendingBrowserSettingsWebview,
    takePendingWebviewRoute,
    threadBrowserTabKey,
    webMcpLimits,
  } = dependencies;
  const logger = dependencies.createLogger(`browser-sidebar-manager`);
  const webContentsWithPolicyListener = new WeakSet<object>();

  return function installBrowserWebviewListeners({
    admitBrowserTab,
    cancelPendingWebviewAttaches,
    reconcileBrowserStorageId,
    attachWebview,
    attachedWebviewHosts,
    configureBrowserSession,
    getAnnotationApiPolicy,
    subscribeAnnotationApiAvailability,
    ensureThreadStateForWindow,
    handleWebviewDestroyedBeforeAttach,
    isPagePersistenceAllowed,
    openBrowserSettingsUrlInTab,
    owner,
    prepareWebviewAttach,
    preloadPath,
    recordDebugEvent,
    state,
    windowId,
  }: BrowserWebviewListenerOptions) {
    const handleWillAttachWebview = (
      event: any,
      webPreferences: Record<string, any>,
      params: Record<string, any>,
      transfer: any,
    ) => {
      if (transfer != null) {
        if (
          state.pendingWindowTransfer?.token !== transfer.token ||
          state.pendingWindowTransfer.webContents !== transfer.webContents
        )
          event.preventDefault();
        return;
      }

      const hasAdoptionLease = hasWebviewAdoptionLease(params);
      const adoptedWebContentsId = getAdoptedWebContentsId(params);
      const hostIdentity = hostIdentityFromWebviewParams(params);
      const pendingAdoption =
        adoptedWebContentsId == null || !hasAdoptionLease
          ? null
          : (state.pendingAdoptedWebviewsByWebContentsId.get(
              adoptedWebContentsId,
            ) ?? null);
      if (hasAdoptionLease) {
        if (
          pendingAdoption == null ||
          pendingAdoption.adoptionLease !== params[adoptionLeaseAttribute] ||
          pendingAdoption.acceptedHostIdentity != null
        ) {
          event.preventDefault();
          return;
        }
        queueMicrotask(() => {
          const thread = state.threads.get(routeKey(pendingAdoption.route));
          if (
            event.defaultPrevented &&
            hostIdentity != null &&
            state.rendererInstanceId === hostIdentity.rendererInstanceId &&
            thread?.hostGeneration === hostIdentity.hostGeneration &&
            state.pendingAdoptedWebviewsByWebContentsId.get(
              pendingAdoption.webContents.id,
            ) === pendingAdoption
          ) {
            pendingAdoption.stopTracking();
            if (!pendingAdoption.webContents.isDestroyed())
              pendingAdoption.webContents.destroy();
          }
        });
      }

      if (
        isBrowserRoutePartition(params.partition) ||
        isCheckoutAttachParams(params) ||
        isFirstPartyAuthenticatedPartition(params) ||
        isWorkspaceSettingsAttachParams(params)
      )
        return;

      const browserSettingsWebview =
        findBrowserSettingsWebviewDefinition(params);
      if (browserSettingsWebview != null) {
        if (state.browserSettingsWebviewMountIds.size === 0) {
          logger.warning(
            `IAB_LIFECYCLE rejected browser settings webview outside settings route`,
            {
              safe: { ownerWebContentsId: owner.id, windowId },
              sensitive: {},
            },
          );
          event.preventDefault();
          return;
        }
        const browserSession = configureBrowserSession();
        if (browserSession == null) {
          event.preventDefault();
          return;
        }
        configureBrowserSettingsWebviewPreferences({
          browserSession,
          params,
          webPreferences,
        });
        const instanceId = getWebviewInstanceId(params);
        if (instanceId == null) {
          logger.warning(
            `IAB_LIFECYCLE rejected browser settings webview attachment without instance id`,
            {
              safe: { ownerWebContentsId: owner.id, windowId },
              sensitive: {},
            },
          );
          event.preventDefault();
          return;
        }
        state.pendingBrowserSettingsWebviewsByInstanceId.set(
          instanceId,
          browserSettingsWebview,
        );
        return;
      }

      if (!admitBrowserTab()) {
        event.preventDefault();
        return;
      }

      const partition = basePartition(params.partition);
      const registeredRoute =
        partition == null
          ? null
          : (state.registeredWebviewHostsByRoutePartition.get(partition) ??
            null);
      const declaredRoute = routeFromWebviewParams(params);
      const candidateRoute = registeredRoute ?? declaredRoute;
      const existingThread =
        candidateRoute == null
          ? null
          : (state.threads.get(routeKey(candidateRoute)) ?? null);
      const hasPersistenceAttributes =
        registeredRoute != null ||
        params[`data-browser-sidebar-page-restore`] != null ||
        params[`data-browser-sidebar-page-storage-id`] != null;
      const hasDefaultStorageMismatch =
        candidateRoute != null &&
        existingThread != null &&
        existingThread.browserStorageId !== makeBrowserStorageId(candidateRoute);
      const canPersist =
        (hasPersistenceAttributes || hasDefaultStorageMismatch) &&
        isPagePersistenceAllowed();
      const canUseRegisteredRoute = hasPersistenceAttributes && canPersist;
      const persistentRoute = canUseRegisteredRoute ? registeredRoute : null;
      const hasRouteMismatch =
        persistentRoute != null &&
        declaredRoute != null &&
        (persistentRoute.browserTabId !== declaredRoute.browserTabId ||
          persistentRoute.conversationId !== declaredRoute.conversationId);
      const route = hasRouteMismatch
        ? null
        : (persistentRoute ?? declaredRoute);
      const rawRestoreIntent = canUseRegisteredRoute
        ? params[pageRestoreAttribute]
        : undefined;
      const restoreIntent =
        rawRestoreIntent === `none` || rawRestoreIntent === `required`
          ? rawRestoreIntent
          : null;
      const hasInvalidRestoreIntent =
        rawRestoreIntent != null && restoreIntent == null;
      const storageId =
        params[`data-browser-sidebar-page-storage-id`] ?? null;
      const restoredStorageId =
        restoreIntent != null && storageId?.length > 0
          ? threadBrowserTabKey(storageId)
          : null;
      const registeredPersistence =
        persistentRoute?.pagePersistence ?? null;
      const hasRegisteredStorageMismatch =
        registeredPersistence != null &&
        restoredStorageId != null &&
        registeredPersistence.browserStorageId !== restoredStorageId;
      const hasRegisteredRestoreMismatch =
        registeredPersistence != null &&
        restoreIntent != null &&
        registeredPersistence.restore !== restoreIntent;
      const hasMissingStorageId =
        registeredPersistence == null &&
        restoreIntent != null &&
        restoredStorageId == null;
      let persistence: any;
      if (!hasRegisteredStorageMismatch && !hasRegisteredRestoreMismatch) {
        if (registeredPersistence == null) {
          if (restoredStorageId != null && restoreIntent != null)
            persistence = {
              browserStorageId: restoredStorageId,
              restore: restoreIntent,
            };
        } else {
          persistence = registeredPersistence;
        }
      }

      const persistenceStorageId = persistence?.browserStorageId ?? null;
      const thread =
        route == null ? null : (state.threads.get(routeKey(route)) ?? null);
      const hasReconciliationFailure =
        thread != null && !reconcileBrowserStorageId(thread, persistence);
      const hasStorageMismatch =
        persistenceStorageId != null &&
        thread != null &&
        thread.browserStorageId !== persistenceStorageId;
      const isTearingDown = thread?.pendingTeardown != null;
      const hasMissingRestoreIntent =
        canPersist &&
        persistence == null &&
        (persistentRoute != null ||
          (route != null &&
            thread != null &&
            thread.browserStorageId !== makeBrowserStorageId(route)));

      if (
        route == null ||
        (pendingAdoption != null &&
          (pendingAdoption.route.browserTabId !== route.browserTabId ||
            pendingAdoption.route.conversationId !== route.conversationId)) ||
        hasReconciliationFailure ||
        hasStorageMismatch ||
        hasInvalidRestoreIntent ||
        hasMissingStorageId ||
        hasMissingRestoreIntent ||
        hasRegisteredStorageMismatch ||
        hasRegisteredRestoreMismatch ||
        isTearingDown
      ) {
        recordDebugEvent({
          browserTabId: route?.browserTabId ?? null,
          conversationId: route?.conversationId ?? null,
          guestWebContentsId: null,
          kind: `browser-webview-attach-rejected`,
          message: `Rejected Browser sidebar webview attachment`,
          ownerWebContentsId: owner.id,
          pageKey: null,
          windowId,
        });
        logger.warning(
          `IAB_LIFECYCLE rejected browser sidebar webview attachment`,
          {
            safe: {
              browserTabId: route?.browserTabId ?? null,
              conversationId: route?.conversationId ?? null,
              hasBrowserStorageReconciliationFailure:
                hasReconciliationFailure,
              hasBrowserStorageMismatch: hasStorageMismatch,
              hasInvalidRestoreIntent,
              hasMissingBrowserStorageId: hasMissingStorageId,
              hasMissingRestoreIntent,
              hasRegisteredBrowserStorageMismatch:
                hasRegisteredStorageMismatch,
              hasRegisteredRestoreIntentMismatch:
                hasRegisteredRestoreMismatch,
              hasRegisteredRouteMismatch: hasRouteMismatch,
              ownerWebContentsId: owner.id,
              threadExists: thread != null,
              teardownReason: thread?.pendingTeardown?.reason ?? null,
              windowId,
            },
            sensitive: {},
          },
        );
        event.preventDefault();
        return;
      }

      const ensuredThread = ensureThreadStateForWindow(
        route.conversationId,
        route.browserTabId,
      );
      if (
        hostIdentity == null ||
        state.rendererInstanceId !== hostIdentity.rendererInstanceId ||
        ensuredThread.hostGeneration !== hostIdentity.hostGeneration
      ) {
        logger.warning(
          `IAB_LIFECYCLE rejected stale browser sidebar host attachment`,
          {
            safe: {
              browserTabId: route.browserTabId,
              conversationId: route.conversationId,
              hostGeneration: hostIdentity?.hostGeneration ?? null,
              threadHostGeneration: ensuredThread.hostGeneration,
              ownerWebContentsId: owner.id,
              windowId,
            },
            sensitive: {},
          },
        );
        event.preventDefault();
        return;
      }
      const { hostGeneration, rendererInstanceId } = hostIdentity;
      if (
        thread == null &&
        !reconcileBrowserStorageId(ensuredThread, persistence)
      ) {
        recordDebugEvent({
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          guestWebContentsId: null,
          kind: `browser-webview-attach-rejected`,
          message: `Rejected Browser sidebar webview storage ownership`,
          ownerWebContentsId: owner.id,
          pageKey: null,
          windowId,
        });
        event.preventDefault();
        return;
      }

      logger.info(`IAB_LIFECYCLE browser sidebar will attach webview`, {
        safe: {
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          ownerWebContentsId: owner.id,
          pendingAdoptedAttachCount:
            state.pendingAdoptedWebviewsByWebContentsId.size,
          pendingAttachCount: state.pendingWebviewRoutesByInstanceId.size,
          windowId,
        },
        sensitive: {},
      });
      const prepared = prepareWebviewAttach(
        ensuredThread,
        {
          title: ensuredThread.snapshot.title,
          url: ensuredThread.snapshot.url,
        },
        persistence,
      );
      if (prepared == null) {
        event.preventDefault();
        return;
      }
      const existingWebContents = prepared.view.webContents;
      const attachedHost =
        existingWebContents == null
          ? null
          : attachedWebviewHosts.get(existingWebContents);
      if (
        existingWebContents != null &&
        !existingWebContents.isDestroyed() &&
        attachedHost?.hostGeneration === hostGeneration &&
        attachedHost.rendererInstanceId === rendererInstanceId
      ) {
        recordDebugEvent({
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          guestWebContentsId: existingWebContents.id,
          kind: `browser-webview-reattach-existing`,
          message: `Reattached existing Browser sidebar webview`,
          ownerWebContentsId: owner.id,
          pageKey: null,
          windowId,
        });
        logger.info(
          `IAB_LIFECYCLE reattaching existing browser sidebar webview`,
          {
            safe: {
              browserTabId: route.browserTabId,
              conversationId: route.conversationId,
              guestWebContentsId: existingWebContents.id,
              ownerWebContentsId: owner.id,
              windowId,
            },
            sensitive: {},
          },
        );
        return;
      }

      recordDebugEvent({
        browserTabId: route.browserTabId,
        conversationId: route.conversationId,
        details: [
          {
            label: `hasPendingUrl`,
            value: String(prepared.pendingUrl.length > 0),
          },
          { label: `hasUrl`, value: String(prepared.url.length > 0) },
        ],
        guestWebContentsId: null,
        kind: `browser-webview-attach-requested`,
        message: `Requested Browser sidebar webview attachment`,
        ownerWebContentsId: owner.id,
        pageKey: null,
        windowId,
      });
      logger.info(`IAB_LIFECYCLE requested browser sidebar webview attachment`, {
        safe: {
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          ownerWebContentsId: owner.id,
          hasPendingUrl: prepared.pendingUrl.length > 0,
          hasUrl: prepared.url.length > 0,
          windowId,
        },
        sensitive: {},
      });

      const browserSession = configureBrowserSession();
      if (browserSession == null) {
        event.preventDefault();
        return;
      }
      configureBrowserPageWebviewPreferences({
        browserSession,
        params,
        preloadPath,
        webPreferences,
      });
      if (pendingAdoption != null) {
        pendingAdoption.acceptedHostIdentity = hostIdentity;
        logger.info(`IAB_ADOPTION queued adopted webview attach`, {
          safe: {
            adoptedWebContentsId,
            browserTabId: route.browserTabId,
            conversationId: route.conversationId,
            windowId,
          },
          sensitive: {},
        });
        return;
      }

      params.src = ``;
      const instanceId = getWebviewInstanceId(params);
      if (instanceId == null) {
        logger.warning(
          `IAB_LIFECYCLE rejected browser sidebar webview attachment without instance id`,
          {
            safe: {
              browserTabId: route.browserTabId,
              conversationId: route.conversationId,
              ownerWebContentsId: owner.id,
              windowId,
            },
            sensitive: {},
          },
        );
        event.preventDefault();
        return;
      }
      if (isLocalUrl(effectivePageUrl(prepared)))
        webPreferences.backgroundThrottling = false;
      state.pendingWebviewRoutesByInstanceId.set(instanceId, {
        hostGeneration,
        initialNavigationOwner: `app`,
        rendererInstanceId,
        route,
      });
      logger.info(`IAB_LIFECYCLE queued browser sidebar webview route`, {
        safe: {
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          instanceId,
          hostGeneration,
          ownerWebContentsId: owner.id,
          pendingAttachCount: state.pendingWebviewRoutesByInstanceId.size,
          windowId,
        },
        sensitive: {},
      });
      recordDebugEvent({
        browserTabId: route.browserTabId,
        conversationId: route.conversationId,
        details: [
          { label: `instanceId`, value: String(instanceId) },
          { label: `hostGeneration`, value: String(hostGeneration) },
        ],
        guestWebContentsId: null,
        kind: `browser-webview-attach-route-queued`,
        message: `Queued Browser sidebar webview route`,
        ownerWebContentsId: owner.id,
        pageKey: null,
        windowId,
      });
    };

    const handleDidAttachWebview = (_event: any, webContents: any) => {
      if (
        state.pendingWindowTransfer?.webContents === webContents ||
        isTrustedSession(webContents.session) ||
        isCheckoutWebContents(webContents) ||
        isFirstPartyAuthenticatedSession(webContents.session) ||
        isWorkspaceSettingsWebContents(webContents)
      )
        return;

      const browserSettingsWebview = takePendingBrowserSettingsWebview(
        webContents,
        state,
      );
      if (browserSettingsWebview != null) {
        bindBrowserSettingsWebview({
          browserSettingsWebview,
          openBrowserSettingsUrlInTab,
          state,
          webContents,
        });
        return;
      }

      if (!webContentsWithPolicyListener.has(webContents)) {
        webContentsWithPolicyListener.add(webContents);
        webContents.on(
          `ipc-message-sync`,
          (event: any, channel: string) => {
            if (
              channel ===
              `codex_desktop:get-browser-annotation-api-policy`
            ) {
              const resolvePolicy = () => {
                if (!webContents.isDestroyed())
                  resolveSynchronousAnnotationPolicy(
                    event,
                    webContents,
                    owner,
                    getAnnotationApiPolicy,
                    subscribeAnnotationApiAvailability,
                  );
              };
              if (
                process.platform === `win32` &&
                process.versions.electron != null
              )
                setImmediate(resolvePolicy);
              else resolvePolicy();
            }
            if (channel === `codex_desktop:get-browser-webmcp-policy`) {
              const availability = getDesktopFeatureAvailability();
              event.returnValue = {
                enabled: isWebMcpEnabled(`prod`, availability.webMcp),
                limits: {
                  maxTools: availability.webMcpMaxTools,
                  maxTotalDescriptorBytes:
                    webMcpLimits.maxTotalDescriptorBytes,
                },
              };
            }
          },
        );
      }
      recordDebugEvent({
        browserTabId: null,
        conversationId: null,
        guestWebContentsId: webContents.id,
        kind: `browser-webview-did-attach`,
        message: `Did attach Browser sidebar webview`,
        ownerWebContentsId: owner.id,
        pageKey: null,
        windowId,
      });
      logger.info(`IAB_LIFECYCLE did attach browser sidebar webview`, {
        safe: {
          guestWebContentsId: webContents.id,
          ownerWebContentsId: owner.id,
          pendingAdoptedAttachCount:
            state.pendingAdoptedWebviewsByWebContentsId.size,
          pendingAttachCount: state.pendingWebviewRoutesByInstanceId.size,
          windowId,
        },
        sensitive: {},
      });

      const attachAfterWin32Turn = (
        route: BrowserRoute,
        attach: () => void,
      ) => {
        if (
          process.platform !== `win32` ||
          process.versions.electron == null
        ) {
          attach();
          return;
        }
        setImmediate(() => {
          if (webContents.isDestroyed()) {
            handleWebviewDestroyedBeforeAttach(route);
            return;
          }
          attach();
        });
      };
      const pendingRoute = takePendingWebviewRoute(webContents, state);
      if (pendingRoute != null) {
        attachAfterWin32Turn(pendingRoute.route, () => {
          attachWebview(webContents, pendingRoute);
        });
        return;
      }
      attachPendingAdoptedWebview({
        attachWebview,
        routeKey,
        state,
        webContents,
      });
    };

    let altTarget: any = null;
    const sendAltInput = (
      webContents: any,
      type: `keyDown` | `keyUp`,
      alt: boolean,
    ) => {
      webContents.sendInputEvent({
        type,
        keyCode: `Alt`,
        modifiers: alt ? [`alt`] : [],
      });
    };
    const handleBeforeInputEvent = (_event: any, input: any) => {
      if (
        (input.type !== `keyDown` && input.type !== `keyUp`) ||
        input.key !== `Alt` ||
        input.isAutoRepeat
      )
        return;
      if (input.type === `keyUp`) {
        const target = altTarget;
        altTarget = null;
        if (target != null && !target.isDestroyed())
          sendAltInput(target, `keyUp`, input.alt === true);
        return;
      }
      if (
        state.activeConversationId == null ||
        state.activeBrowserTabId == null
      )
        return;
      const thread = state.threads.get(
        routeKey({
          browserTabId: state.activeBrowserTabId,
          conversationId: state.activeConversationId,
        }),
      );
      const webContents = thread?.page?.view.webContents;
      if (
        thread?.visible !== true ||
        !thread.presented ||
        thread.snapshot.interactionMode !== `browse` ||
        thread.bounds == null ||
        webContents == null ||
        webContents.isDestroyed()
      )
        return;
      const cursor = screen.getCursorScreenPoint();
      const contentBounds = state.window.getContentBounds();
      const x = cursor.x - contentBounds.x - thread.bounds.x;
      const y = cursor.y - contentBounds.y - thread.bounds.y;
      if (
        x < 0 ||
        y < 0 ||
        x >= thread.bounds.width ||
        y >= thread.bounds.height
      )
        return;
      sendAltInput(webContents, `keyDown`, input.alt === true);
      altTarget = webContents;
    };

    const renderViewOwner = owner;
    renderViewOwner.on(
      `current-render-view-deleted`,
      cancelPendingWebviewAttaches,
    );
    owner.on(`destroyed`, cancelPendingWebviewAttaches);
    owner.on(`did-navigate`, cancelPendingWebviewAttaches);
    owner.on(`render-process-gone`, cancelPendingWebviewAttaches);
    owner.on(`will-attach-webview`, handleWillAttachWebview);
    owner.on(`did-attach-webview`, handleDidAttachWebview);
    owner.on(`before-input-event`, handleBeforeInputEvent);

    return () => {
      cancelPendingWebviewAttaches();
      renderViewOwner.removeListener(
        `current-render-view-deleted`,
        cancelPendingWebviewAttaches,
      );
      owner.removeListener(`destroyed`, cancelPendingWebviewAttaches);
      owner.removeListener(`did-navigate`, cancelPendingWebviewAttaches);
      owner.removeListener(
        `render-process-gone`,
        cancelPendingWebviewAttaches,
      );
      owner.removeListener(`will-attach-webview`, handleWillAttachWebview);
      owner.removeListener(`did-attach-webview`, handleDidAttachWebview);
      owner.removeListener(`before-input-event`, handleBeforeInputEvent);
      state.pendingBrowserSettingsWebviewsByInstanceId.clear();
      for (const dispose of
        state.browserSettingsWebviewNavigationDisposersByWebContentsId.values())
        dispose();
    };
  };
}

