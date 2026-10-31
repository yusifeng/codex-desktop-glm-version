const DEFAULT_OPEN_WAIT_TIMEOUT_MS = 15_000;

export interface BrowserUseOpenRequestOwner {
  id: number;
}

export interface BrowserUseOpenPage {
  browserTabId: string;
  pageKey: unknown;
  webContents: { id: number };
}

export interface BrowserUseOpenRequest {
  browserTabId: string;
  conversationId: string;
  owner: BrowserUseOpenRequestOwner;
}

interface PendingBrowserUseOpenRequest extends BrowserUseOpenRequest {
  reject(error: Error): void;
  resolve(page: BrowserUseOpenPage): void;
  timer: ReturnType<typeof setTimeout>;
}

export interface BrowserUseOpenRequestRegistryOptions {
  clearTimer?(timer: ReturnType<typeof setTimeout>): void;
  logger?: () => {
    info(message: string, context: unknown): void;
    warning(message: string, context: unknown): void;
  };
  recordDebugEvent?(event: Record<string, unknown>): void;
  setTimer?(
    callback: () => void,
    timeoutMs: number,
  ): ReturnType<typeof setTimeout>;
  timeoutMs?: number;
}

const NULL_LOGGER = {
  info() {},
  warning() {},
};

/** Owns pending Browser Use panel-open promises from request through attach, rejection, or timeout. */
export class BrowserUseOpenRequestRegistry {
  private readonly requests = new Set<PendingBrowserUseOpenRequest>();
  private readonly clearTimer: NonNullable<
    BrowserUseOpenRequestRegistryOptions[`clearTimer`]
  >;
  private readonly logger: NonNullable<
    BrowserUseOpenRequestRegistryOptions[`logger`]
  >;
  private readonly recordDebugEvent: NonNullable<
    BrowserUseOpenRequestRegistryOptions[`recordDebugEvent`]
  >;
  private readonly setTimer: NonNullable<
    BrowserUseOpenRequestRegistryOptions[`setTimer`]
  >;
  private readonly timeoutMs: number;

  constructor(options: BrowserUseOpenRequestRegistryOptions = {}) {
    this.clearTimer = options.clearTimer ?? clearTimeout;
    this.logger = options.logger ?? (() => NULL_LOGGER);
    this.recordDebugEvent = options.recordDebugEvent ?? (() => undefined);
    this.setTimer = options.setTimer ?? setTimeout;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_OPEN_WAIT_TIMEOUT_MS;
  }

  getDebugSnapshot(): Array<Record<string, unknown>> {
    return Array.from(this.requests).map((request) => ({
      activeBrowserTabId: null,
      activeConversationId: null,
      browserTabId: request.browserTabId,
      conversationId: request.conversationId,
      guestWebContentsId: null,
      hasPage: null,
      ownerWebContentsId: request.owner.id,
      ownerRoutePath: null,
      pendingAttachCount: null,
      pendingBrowserUsePanelOpen: null,
      routeActive: null,
      windowId: null,
    }));
  }

  waitForOpen(
    owner: BrowserUseOpenRequestOwner,
    conversationId: string,
    browserTabId: string,
  ): Promise<BrowserUseOpenPage> {
    return new Promise((resolve, reject) => {
      const request: PendingBrowserUseOpenRequest = {
        browserTabId,
        conversationId,
        owner,
        reject,
        resolve,
        timer: undefined as unknown as ReturnType<typeof setTimeout>,
      };
      request.timer = this.setTimer(() => {
        const error = Error(
          `Timed out waiting for the Browser webview to attach for this browser-use page`,
        );
        this.recordDebugEvent({
          browserTabId,
          conversationId,
          guestWebContentsId: null,
          kind: `browser-open-wait-timeout`,
          message: `Timed out waiting for Browser webview attach`,
          ownerWebContentsId: owner.id,
          pageKey: null,
          windowId: null,
        });
        this.logger().warning(`IAB_LIFECYCLE browser use open wait timed out`, {
          safe: { conversationId, ownerWebContentsId: owner.id },
          sensitive: {},
        });
        this.reject(request, error);
      }, this.timeoutMs);
      request.timer.unref?.();
      this.requests.add(request);
      this.logger().info(`IAB_LIFECYCLE browser use open wait started`, {
        safe: { browserTabId, conversationId, ownerWebContentsId: owner.id },
        sensitive: {},
      });
      this.recordDebugEvent({
        browserTabId,
        conversationId,
        guestWebContentsId: null,
        kind: `browser-open-wait-started`,
        message: `Waiting for Browser webview attach`,
        ownerWebContentsId: owner.id,
        pageKey: null,
        windowId: null,
      });
    });
  }

  resolveForWindow(
    windowState: { owner: BrowserUseOpenRequestOwner },
    resolvePage: (
      request: BrowserUseOpenRequest,
    ) => BrowserUseOpenPage | null | undefined,
  ): void {
    const matchingRequests = Array.from(this.requests).filter(
      (request) => request.owner.id === windowState.owner.id,
    );
    for (const request of matchingRequests) {
      const page = resolvePage(request);
      if (page != null) this.resolve(request, page);
    }
  }

  rejectForOwner(owner: BrowserUseOpenRequestOwner, error: Error): void {
    for (const request of Array.from(this.requests)) {
      if (request.owner.id === owner.id) this.reject(request, error);
    }
  }

  rejectForRoute({
    browserTabId,
    conversationId,
    error,
    owner,
  }: BrowserUseOpenRequest & { error: Error }): void {
    for (const request of Array.from(this.requests)) {
      if (
        request.owner.id === owner.id &&
        request.conversationId === conversationId &&
        request.browserTabId === browserTabId
      ) {
        this.reject(request, error);
      }
    }
  }

  private resolve(
    request: PendingBrowserUseOpenRequest,
    page: BrowserUseOpenPage,
  ): void {
    this.logger().info(`IAB_LIFECYCLE browser use open wait resolved`, {
      safe: {
        browserTabId: page.browserTabId,
        conversationId: request.conversationId,
        guestWebContentsId: page.webContents.id,
        ownerWebContentsId: request.owner.id,
        pageKey: page.pageKey,
      },
      sensitive: {},
    });
    this.recordDebugEvent({
      browserTabId: page.browserTabId,
      conversationId: request.conversationId,
      guestWebContentsId: page.webContents.id,
      kind: `browser-open-wait-resolved`,
      message: `Resolved Browser webview attach wait`,
      ownerWebContentsId: request.owner.id,
      pageKey: page.pageKey,
      windowId: null,
    });
    this.requests.delete(request);
    this.clearTimer(request.timer);
    request.resolve(page);
  }

  private reject(request: PendingBrowserUseOpenRequest, error: Error): void {
    this.recordDebugEvent({
      browserTabId: request.browserTabId,
      conversationId: request.conversationId,
      details: [{ label: `errorMessage`, value: error.message }],
      guestWebContentsId: null,
      kind: `browser-open-wait-rejected`,
      message: `Rejected Browser webview attach wait`,
      ownerWebContentsId: request.owner.id,
      pageKey: null,
      windowId: null,
    });
    this.logger().warning(`IAB_LIFECYCLE browser use open wait rejected`, {
      safe: {
        conversationId: request.conversationId,
        errorMessage: error.message,
        ownerWebContentsId: request.owner.id,
      },
      sensitive: {},
    });
    this.requests.delete(request);
    this.clearTimer(request.timer);
    request.reject(error);
  }
}
