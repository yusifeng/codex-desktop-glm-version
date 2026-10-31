import {
  isBrowserNavigationResourceType,
  shouldBlockLocalSubframeNavigation,
} from "../browser-use/navigation-restriction";

const CHATGPT_DEEP_LINK_ORIGIN_PREFIX = `https://chatgpt.com/`;
const CHATGPT_DEEP_LINK_PATH = `/codex/deeplink`;
const FORBIDDEN_DEEP_LINK_PARAMETERS = [`originUrl`, `path`, `prompt`] as const;

export interface BrowserSessionLike {
  on(
    event: `web-notification-clicked`,
    listener: (event: unknown, notification: unknown) => void,
  ): void;
  setPermissionCheckHandler(handler: () => boolean): void;
  setPermissionPromptHandler(handler: (...args: any[]) => unknown): void;
  setPermissionRequestHandler(
    handler: (
      webContents: unknown,
      permission: unknown,
      callback: (allowed: boolean) => void,
    ) => void,
  ): void;
}

export interface BrowserSessionRequest {
  resourceType: string;
  url: string;
  webContentsId?: number | null;
}

export interface BrowserSessionServiceDependencies {
  decodeRedirectTarget(value: string): string | null;
  fromPartition(
    partition: string,
    options: { permissionHandling: `browser` },
  ): BrowserSessionLike;
  getPartitionName(): string;
  isBrowserSettingsNavigationBlocked(options: {
    webContentsId?: number | null;
    windows: Iterable<any>;
    url: string;
  }): boolean;
  isRouteNavigationDisabled(): boolean;
  routePathForUrl(url: string): unknown | null;
}

export interface BrowserSessionServiceOptions {
  applicationNetwork: {
    addSessionRestriction(
      session: BrowserSessionLike,
      restriction: (
        request: BrowserSessionRequest,
      ) => { cancel: boolean } | { redirectURL: string },
    ): unknown;
  };
  browserSessionRegistry: unknown;
  downloadStore: {
    registerSession(options: {
      browserSession: BrowserSessionLike;
      browserSessionRegistry: unknown;
      findPageStateForWebContentsId(webContentsId: number): any | null;
    }): unknown;
  };
  findPageStateForWebContentsId(webContentsId: number): any | null;
  getWindows(): Iterable<any>;
  isRestrictedBrowserNavigation(
    webContentsId: number | null | undefined,
    url: string,
    resourceType: string,
  ): boolean;
  onPermissionPrompt(...args: any[]): unknown;
  onWebNotificationClicked(notification: unknown): unknown;
}

/**
 * Accepts the narrowly-scoped ChatGPT redirect used by Browser Use and rejects
 * lookalike URLs, duplicate targets, fragments, credentials, and prompt-bearing links.
 * This preserves the original `VWe` policy while making the trust boundary explicit.
 */
export function parseBrowserUseChatGptRedirect(
  value: string,
  decodeRedirectTarget: (value: string) => string | null,
): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const redirectTarget = url.searchParams.get(`url`);
  return value.slice(0, 20).toLowerCase() !== CHATGPT_DEEP_LINK_ORIGIN_PREFIX ||
    url.protocol !== `https:` ||
    url.hostname !== `chatgpt.com` ||
    url.pathname !== CHATGPT_DEEP_LINK_PATH ||
    url.username !== `` ||
    url.password !== `` ||
    url.port !== `` ||
    url.hash !== `` ||
    value.includes(`#`) ||
    url.searchParams.getAll(`url`).length !== 1 ||
    redirectTarget == null ||
    FORBIDDEN_DEEP_LINK_PARAMETERS.some((parameter) =>
      url.searchParams.has(parameter),
    )
    ? null
    : decodeRedirectTarget(redirectTarget);
}

/** Owns the shared Browser partition's permission, download, notification, and request policies. */
export function createBrowserSessionServiceClass(
  dependencies: BrowserSessionServiceDependencies,
) {
  return class BrowserSessionService {
    private configured = false;

    constructor(private readonly options: BrowserSessionServiceOptions) {}

    configure(): BrowserSessionLike {
      // Preserve the original behavior: resolve the shared session on every call,
      // while installing handlers and restrictions only once per service instance.
      const browserSession = dependencies.fromPartition(
        dependencies.getPartitionName(),
        {
          permissionHandling: `browser`,
        },
      );
      if (this.configured) return browserSession;

      browserSession.setPermissionPromptHandler(
        this.options.onPermissionPrompt,
      );
      browserSession.setPermissionRequestHandler(
        (_webContents, _permission, callback) => {
          callback(false);
        },
      );
      browserSession.setPermissionCheckHandler(() => false);
      browserSession.on(`web-notification-clicked`, (_event, notification) =>
        this.options.onWebNotificationClicked(notification),
      );
      this.options.downloadStore.registerSession({
        browserSession,
        browserSessionRegistry: this.options.browserSessionRegistry,
        findPageStateForWebContentsId:
          this.options.findPageStateForWebContentsId,
      });
      this.options.applicationNetwork.addSessionRestriction(
        browserSession,
        (request) => {
          const pageState =
            request.webContentsId == null
              ? null
              : this.options.findPageStateForWebContentsId(
                  request.webContentsId,
                );
          const redirectURL =
            pageState == null || request.resourceType !== `mainFrame`
              ? null
              : parseBrowserUseChatGptRedirect(
                  request.url,
                  dependencies.decodeRedirectTarget,
                );

          if (redirectURL != null) return { redirectURL };
          return {
            cancel:
              (request.resourceType === `mainFrame` &&
                ((dependencies.routePathForUrl(request.url) != null &&
                  !dependencies.isRouteNavigationDisabled()) ||
                  dependencies.isBrowserSettingsNavigationBlocked({
                    webContentsId: request.webContentsId,
                    windows: this.options.getWindows(),
                    url: request.url,
                  }))) ||
              (pageState?.threadState.isAgentControllingBrowser !== true &&
                shouldBlockLocalSubframeNavigation({
                  currentUrl: pageState == null ? null : pageState.page.url,
                  resourceType: request.resourceType,
                  requestUrl: request.url,
                })) ||
              (isBrowserNavigationResourceType(request.resourceType) &&
                this.options.isRestrictedBrowserNavigation(
                  request.webContentsId,
                  request.url,
                  request.resourceType,
                )),
          };
        },
      );
      this.configured = true;
      return browserSession;
    }
  };
}
