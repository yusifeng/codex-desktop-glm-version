type NetworkDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  app: {
    getLocale(): string;
    getName(): string;
    getPreferredSystemLanguages(): string[];
  };
  buildSharedUrl(input: { locale: string; subdomain: string }): string;
  consumeUserGesture(owner: any, sandboxId: string, initId?: string | null): boolean;
  defaultSession: any | null;
  developmentBaseUrl?: string;
  fsPromises: { readdir(path: string, options: any): Promise<any[]> };
  isSandboxHostname(hostname: string): boolean;
  logger: () => { info(message: string, tags: any): void };
  markTrustedSession(session: any): void;
  netFetch(url: string, init: any): Promise<Response>;
  parseOrigin(url: string, options?: { requireSkybridge?: boolean }): string | null;
  path: any;
  persistentPartition: string;
  protocolScheme: string;
  sanitizeUrl(url: string): string;
  sessionFromPartition(partition: string): any;
  toPersistentPartition(connectionId: string): string;
  userGestureSchema: { safeParse(value: unknown): any };
};

const SANDBOX_HOST = "web-sandbox.oaiusercontent.com";
const SANDBOX_SHELL_PATH = "/mcp-app.html";
const MAX_PREWARM_ASSETS = 8;
const ASSET_PATH = /^\/assets\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\.(?:css|js)$/u;
const ASSET_PATHS = /\/assets\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\.(?:css|js)/gu;
const CHROME_VERSION = /\b(?:Chrome|Chromium)\/(\d+)\./u;

/** Owns MCP sandbox shell caching, request policy, session hardening, and data clearing. */
export function createMcpSandboxNetworkRuntime(dependencies: NetworkDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const prewarmByUrl = new Map<string, {
    promise: Promise<void>;
    refreshing?: boolean;
    state: "warming" | "warm";
  }>();
  const configuredSessions = new WeakSet<object>();
  let defaultHeadersInstalled = false;

  function getCacheState(url: string) {
    const target = normalizeSandboxRequest(new Request(url));
    return target == null ? "cold" : (prewarmByUrl.get(target)?.state ?? "cold");
  }

  async function fetchSandboxRequest(request: Request) {
    const target = normalizeSandboxRequest(request);
    return target == null ? null : fetchWithCacheFallback(target, "force-cache");
  }

  function prewarmSandbox(locale: string) {
    const shellUrl = new URL(dependencies.buildSharedUrl({ locale, subdomain: "shared" }));
    shellUrl.hostname = SANDBOX_HOST;
    shellUrl.pathname = SANDBOX_SHELL_PATH;
    const key = shellUrl.toString();
    const existing = prewarmByUrl.get(key);
    if (existing != null) {
      if (existing.state === "warm") refreshPrewarm(key, existing);
      return existing.promise;
    }
    const promise = (async () => {
      const response = await fetchWithCacheFallback(key, "force-cache");
      if (!response.ok) throw Error("MCP app sandbox shell failed to prewarm.");
      await prewarmAssets(response);
    })();
    const entry = { promise, state: "warming" as const };
    prewarmByUrl.set(key, entry);
    promise.then(
      () => {
        (entry as any).state = "warm";
        refreshPrewarm(key, entry as any);
      },
      () => prewarmByUrl.delete(key),
    );
    return promise;
  }

  function refreshPrewarm(key: string, entry: any) {
    if (entry.refreshing) return;
    entry.refreshing = true;
    fetchWithCacheFallback(key, "default")
      .then((response) => response.ok ? prewarmAssets(response) : undefined)
      .catch(() => {})
      .finally(() => { entry.refreshing = false; });
  }

  async function prewarmAssets(response: Response) {
    const assetPaths = [...new Set((await response.text()).match(ASSET_PATHS) ?? [])]
      .slice(0, MAX_PREWARM_ASSETS);
    const responses = await Promise.all(
      assetPaths.map((assetPath) =>
        fetchWithCacheFallback(`https://${SANDBOX_HOST}${assetPath}`, "force-cache"),
      ),
    );
    if (responses.some((assetResponse) => !assetResponse.ok))
      throw Error("MCP app sandbox startup asset failed to prewarm.");
  }

  function normalizeSandboxRequest(request: Request) {
    if (request.method !== "GET") return null;
    const url = new URL(request.url);
    if (
      (url.protocol !== "https:" && url.protocol !== "codex-sandbox:") ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      !dependencies.isSandboxHostname(url.hostname)
    ) return null;
    const isSkybridge = dependencies.parseOrigin(request.url, { requireSkybridge: true }) != null;
    const isAsset = url.search === "" && ASSET_PATH.test(url.pathname);
    if (!isSkybridge && !isAsset && dependencies.developmentBaseUrl == null) return null;
    return `https://${SANDBOX_HOST}${isSkybridge ? SANDBOX_SHELL_PATH : url.pathname}${url.search}`;
  }

  async function fetchWithCacheFallback(url: string, cache: RequestCache): Promise<Response> {
    const parsed = new URL(url);
    const requestUrl = dependencies.developmentBaseUrl == null
      ? url
      : new URL(`${parsed.pathname}${parsed.search}`, dependencies.developmentBaseUrl).toString();
    const response = await dependencies.netFetch(requestUrl, {
      cache,
      credentials: "omit",
      headers:
        dependencies.developmentBaseUrl != null &&
        parsed.pathname === "/index.css" &&
        parsed.search === ""
          ? { Accept: "text/css,*/*;q=0.1" }
          : undefined,
      redirect: "error",
    });
    return cache === "force-cache" && !response.ok
      ? fetchWithCacheFallback(url, "reload")
      : response;
  }

  function initializeDefaultSessionHeaders() {
    if (defaultHeadersInstalled || dependencies.defaultSession?.webRequest == null) return;
    defaultHeadersInstalled = true;
    const session = dependencies.defaultSession;
    session.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
      const headers = details.requestHeaders;
      callback({
        requestHeaders: isSandboxRequest({
          frame: details.frame,
          requestHeaders: headers,
          url: details.url,
        })
          ? rewriteRequestHeaders(headers, {
              acceptLanguage: preferredLanguages(),
              excludedUserAgentProducts: ["Electron", dependencies.app.getName()],
              userAgent: session.getUserAgent(),
            })
          : headers,
      });
    });
  }

  function configureSession(
    session: any,
    options: {
      applicationNetwork: any;
      consumeUserGestureForGuest(guest: object): boolean;
      getSandboxState(guestId: number): any | null;
    },
  ) {
    dependencies.markTrustedSession(session);
    if (configuredSessions.has(session)) return;
    configuredSessions.add(session);
    session.protocol.handle(dependencies.protocolScheme, async (request: Request) => {
      const response = await fetchSandboxRequest(request);
      return response == null
        ? new Response(null, { status: 404 })
        : new Response(await response.arrayBuffer(), {
            headers: {
              "Content-Security-Policy": response.headers.get("Content-Security-Policy") ?? "",
              "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
              "Permissions-Policy": response.headers.get("Permissions-Policy") ?? "",
              "X-Content-Type-Options": "nosniff",
            },
            status: response.status,
          });
    });
    session.setPermissionRequestHandler((guest: any, permission: string, callback: any, details: any) => {
      const state = options.getSandboxState(guest.id);
      if (
        (state != null && allowsLocalNetwork(permission, details.requestingUrl, state)) ||
        (
          permission === "clipboard-sanitized-write" &&
          state != null &&
          dependencies.parseOrigin(guest.getURL()) === state.origin &&
          options.consumeUserGestureForGuest(guest)
        )
      ) {
        callback(true);
        return;
      }
      dependencies.logger().info("mcp_app_sandbox.permission_blocked", {
        safe: { permission },
        sensitive: { guestWebContentsId: guest.id, sandboxId: state?.sandboxId },
      });
      callback(false);
    });
    session.setPermissionCheckHandler((guest: any, permission: string, requestingUrl: string) => {
      const state = guest == null ? null : options.getSandboxState(guest.id);
      return state != null && allowsLocalNetwork(permission, requestingUrl, state);
    });
    session.on("will-download", (event: any, item: any) => {
      dependencies.logger().info("mcp_app_sandbox.download_blocked", {
        safe: { urlProtocol: urlProtocol(item.getURL()) },
        sensitive: { url: dependencies.sanitizeUrl(item.getURL()) },
      });
      event.preventDefault();
      item.cancel();
    });
    options.applicationNetwork.addSessionRestriction(session, (request: any) => {
      const state = request.webContentsId == null
        ? null
        : options.getSandboxState(request.webContentsId);
      const allowed = isAllowedRequest(request.url, {
        allowLocalDevelopment: state?.allowLocalDevelopment === true,
      });
      if (!allowed) {
        dependencies.logger().info("mcp_app_sandbox.request_blocked", {
          safe: { resourceType: request.resourceType, urlProtocol: urlProtocol(request.url) },
          sensitive: {
            guestWebContentsId: request.webContentsId,
            sandboxId: state?.sandboxId,
            url: dependencies.sanitizeUrl(request.url),
          },
        });
      }
      return { cancel: !allowed };
    });
    session.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
      callback({
        requestHeaders: rewriteRequestHeaders(details.requestHeaders, {
          acceptLanguage: preferredLanguages(),
          excludedUserAgentProducts: ["Electron", dependencies.app.getName()],
          userAgent: session.getUserAgent(),
        }),
      });
    });
  }

  function rewriteRequestHeaders(
    headers: Record<string, string>,
    options: {
      acceptLanguage: string;
      excludedUserAgentProducts: Array<string | null | undefined>;
      userAgent: string;
    },
  ) {
    const rewritten = { ...headers };
    const userAgent = options.excludedUserAgentProducts
      .filter((value): value is string => Boolean(value))
      .reduce(
        (value, product) =>
          value.replace(RegExp(`\\s${escapeRegex(product)}/[^\\s]+`, "g"), ""),
        options.userAgent,
      );
    const chromeVersion = CHROME_VERSION.exec(userAgent)?.[1];
    setCanonicalHeader(rewritten, "User-Agent", userAgent);
    setCanonicalHeader(rewritten, "Accept-Language", options.acceptLanguage);
    if (chromeVersion != null) {
      setCanonicalHeader(
        rewritten,
        "sec-ch-ua",
        `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not=A?Brand";v="24"`,
      );
    }
    setCanonicalHeader(rewritten, "sec-ch-ua-mobile", "?0");
    setCanonicalHeader(
      rewritten,
      "sec-ch-ua-platform",
      process.platform === "darwin"
        ? '"macOS"'
        : process.platform === "win32"
          ? '"Windows"'
          : '"Linux"',
    );
    return rewritten;
  }

  function setCanonicalHeader(headers: Record<string, string>, name: string, value: string) {
    const existing = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
    if (existing != null && existing !== name) delete headers[existing];
    headers[name] = value;
  }

  function isSandboxRequest(request: any) {
    return isSandboxFrame(request.frame) ||
      isSandboxUrl(request.url) ||
      isSandboxUrl(readHeader(request.requestHeaders, "Origin")) ||
      isSandboxUrl(readHeader(request.requestHeaders, "Referer"));
  }

  function isSandboxFrame(frame: any) {
    return frame != null && (isSandboxUrl(frame.origin) || isSandboxUrl(frame.url));
  }

  function readHeader(headers: Record<string, string>, name: string) {
    const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    return key == null ? undefined : headers[key];
  }

  function isSandboxUrl(value: string | null | undefined) {
    const parsed = parseUrl(value);
    return parsed != null && dependencies.isSandboxHostname(parsed.hostname);
  }

  function isAllowedRequest(url: string, { allowLocalDevelopment }: { allowLocalDevelopment: boolean }) {
    const parsed = parseUrl(url);
    const localDevelopment = allowLocalDevelopment &&
      parsed?.hostname === "localhost" &&
      ["http:", "ws:"].includes(parsed.protocol);
    const sandboxProtocol = parsed?.protocol === "codex-sandbox:" &&
      dependencies.isSandboxHostname(parsed.hostname);
    return parsed != null && (
      ["about:", "blob:", "data:", "https:", "wss:"].includes(parsed.protocol) ||
      parsed.protocol === "devtools:" ||
      localDevelopment ||
      sandboxProtocol
    );
  }

  function allowsLocalNetwork(permission: string, requestingUrl: string, state: any) {
    return permission === "local-network" &&
      state.sandboxId.startsWith("local-network-") &&
      dependencies.parseOrigin(requestingUrl) === state.origin;
  }

  function preferredLanguages() {
    const languages = dependencies.app.getPreferredSystemLanguages();
    return (languages.length > 0 ? languages : [dependencies.app.getLocale()])
      .map((language, index) =>
        index === 0 ? language : `${language};q=${Math.max(1 - index * 0.1, 0.1).toFixed(1)}`,
      )
      .join(",");
  }

  class McpSandboxDataHandler extends dependencies.RpcHandlerBase {
    constructor(readonly origin: any) {
      super();
    }

    async clearData() {
      const persistentSession = dependencies.sessionFromPartition(dependencies.persistentPartition);
      const storagePath = persistentSession.storagePath;
      if (storagePath == null)
        throw Error("The persistent MCP app session has no storage path.");
      const prefix = path.basename(storagePath).slice(0, -6);
      const entries = await dependencies.fsPromises
        .readdir(path.dirname(storagePath), { withFileTypes: true })
        .catch((error: unknown) => {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
          throw error;
        });
      const sessions = [persistentSession];
      for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith(prefix)) continue;
        const connectionId = entry.name.slice(prefix.length);
        if (/^connection-[a-f0-9]{48}$/u.test(connectionId)) {
          sessions.push(
            dependencies.sessionFromPartition(dependencies.toPersistentPartition(connectionId)),
          );
        }
      }
      await Promise.all(sessions.map((session) => session.clearData()));
    }

    async consumeUserGesture(value: unknown) {
      const parsed = dependencies.userGestureSchema.safeParse(value);
      if (!parsed.success) return false;
      return dependencies.consumeUserGesture(
        this.origin,
        parsed.data.sandboxId,
        parsed.data.initId,
      );
    }
  }

  function parseUrl(value: string | null | undefined) {
    if (value == null || value.length === 0) return null;
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  function urlProtocol(value: string) {
    return parseUrl(value)?.protocol ?? "invalid";
  }

  function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  }

  return {
    McpSandboxDataHandler,
    configureSession,
    fetchSandboxRequest,
    getCacheState,
    initializeDefaultSessionHeaders,
    isAllowedRequest,
    isSandboxRequest,
    normalizeSandboxRequest,
    preferredLanguages,
    prewarmSandbox,
    rewriteRequestHeaders,
  };
}
