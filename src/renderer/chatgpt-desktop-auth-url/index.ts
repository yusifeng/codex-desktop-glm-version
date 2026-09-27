// chatgpt-desktop-auth-url —— 桌面登录会话启动与授权 URL 参数装配。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const { VJ: readHostCapability, wL: initializeWindowRuntime } = appSharedChunk;
const {
  Bfn: initializeAnalyticsRuntime,
  Bgn: initializeStableIdRuntime,
  Eon: initializeLoginSessionRuntime,
  Ifn: hostCapabilitiesSignal,
  Lfn: initializeHostRuntime,
  Ton: createAbortError,
  Ugn: getHostServices,
  Vgn: getStableIdRegistry,
  Wgn: initializeHostServices,
  c$t: appVersionSignal,
  l$t: initializeAppVersion,
  ugn: defaultHostId,
  zgn: originStableIdKey,
} = appInitialChunk;

interface StartDesktopLoginOptions {
  hostId?: string;
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>;
  signal?: AbortSignal;
  useHostedLoginSuccessPage?: boolean;
  useStreamlinedLogin?: boolean;
}

interface BuildDesktopAuthUrlOptions {
  allowedWorkspaceId?: string | null;
  authUrl: string;
  codexAppVersion?: string | null;
  currentWorkspaceId?: string | null;
  desktopAuthOrigin?: string | null;
  includeCodexOriginStableId?: boolean;
  loginHint?: string | null;
  sourceSurfaceStableId?: string | null;
  useDesktopAuth: boolean;
  useStreamlinedLoginUx: boolean;
}

async function startDesktopLogin({
  scope,
  hostId = defaultHostId,
  signal,
  useHostedLoginSuccessPage,
  useStreamlinedLogin,
}: StartDesktopLoginOptions): Promise<
  import("@rchunk/app-initial").DesktopLoginStartResult
> {
  const hostedSuccess =
    useHostedLoginSuccessPage === true &&
    readHostCapability(
      scope.get(hostCapabilitiesSignal, hostId),
      "hostedLoginSuccess",
    );
  return startCancelableLogin(
    getHostServices(scope, hostId).createChatGptLoginSession({
      ...(hostedSuccess ? { appBrand: "chatgpt" as const } : {}),
      useHostedLoginSuccessPage: hostedSuccess,
      useStreamlinedLogin,
    }),
    signal,
  );
}

async function startCancelableLogin(
  session: import("@rchunk/app-initial").DesktopLoginSession,
  signal?: AbortSignal,
): Promise<import("@rchunk/app-initial").DesktopLoginStartResult> {
  const cancel = (): void => {
    void session.cancel().catch(() => undefined);
  };
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  try {
    const startResult = await session.getStartResult();
    return {
      ...startResult,
      completion: session
        .waitForCompletion()
        .catch((error: unknown) => {
          throw signal?.aborted ? createAbortError() : error;
        })
        .finally(() => {
          signal?.removeEventListener("abort", cancel);
          session[Symbol.dispose]();
        }),
    };
  } catch (error) {
    signal?.removeEventListener("abort", cancel);
    session[Symbol.dispose]();
    throw signal?.aborted ? createAbortError() : error;
  }
}

function initializeDesktopLoginRuntime(): void {
  initializeWindowRuntime();
  initializeHostServices();
  initializeHostRuntime();
  initializeAnalyticsRuntime();
  initializeLoginSessionRuntime();
}

function buildDesktopAuthUrl(options: BuildDesktopAuthUrlOptions): string {
  const {
    allowedWorkspaceId,
    authUrl,
    codexAppVersion,
    currentWorkspaceId,
    desktopAuthOrigin,
    loginHint,
    sourceSurfaceStableId = getStableIdRegistry().StableID.get(
      originStableIdKey,
    ),
    includeCodexOriginStableId = false,
    useDesktopAuth,
    useStreamlinedLoginUx,
  } = options;
  const hasContext = Boolean(
    allowedWorkspaceId ||
    codexAppVersion ||
    currentWorkspaceId ||
    loginHint ||
    sourceSurfaceStableId,
  );
  if (!hasContext && !useDesktopAuth && !useStreamlinedLoginUx) return authUrl;
  try {
    const url = new URL(authUrl);
    if (url.pathname === "/codex/desktop-auth") {
      const authorizeUrl = url.searchParams.get("authorize_url");
      if (hasContext && authorizeUrl) {
        const nested = new URL(authorizeUrl);
        appendAuthContext(nested, options, sourceSurfaceStableId);
        url.searchParams.set("authorize_url", nested.toString());
      }
      if (useStreamlinedLoginUx)
        url.searchParams.set("codex_streamlined_login", "true");
      return url.toString();
    }
    if (hasContext) appendAuthContext(url, options, sourceSurfaceStableId);
    if (useStreamlinedLoginUx)
      url.searchParams.set("codex_streamlined_login", "true");
    if (!useDesktopAuth) return url.toString();
    const wrapper = new URL(
      "/codex/desktop-auth",
      desktopAuthOrigin?.trim() || "https://chatgpt.com",
    );
    wrapper.searchParams.set("authorize_url", url.toString());
    if (useStreamlinedLoginUx)
      wrapper.searchParams.set("codex_streamlined_login", "true");
    return wrapper.toString();
  } catch {
    return authUrl;
  }
}

function getCodexAppVersion(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
): string | undefined {
  const appVersion = scope.get(appVersionSignal) as {
    data?: { version?: string };
  };
  return appVersion.data?.version;
}

function appendAuthContext(
  url: URL,
  options: BuildDesktopAuthUrlOptions,
  sourceSurfaceStableId: string | null | undefined,
): void {
  if (options.allowedWorkspaceId)
    url.searchParams.set("allowed_workspace_id", options.allowedWorkspaceId);
  if (options.codexAppVersion)
    url.searchParams.set("codex_app_version", options.codexAppVersion);
  if (options.currentWorkspaceId)
    url.searchParams.set("current_workspace_id", options.currentWorkspaceId);
  if (options.loginHint) url.searchParams.set("login_hint", options.loginHint);
  if (sourceSurfaceStableId) {
    url.searchParams.set("source_surface_stable_id", sourceSurfaceStableId);
    if (options.includeCodexOriginStableId)
      url.searchParams.set("codex_origin_stable_id", sourceSurfaceStableId);
  }
}

function initializeDesktopAuthUrl(): void {
  getStableIdRegistry();
  initializeAppVersion();
  initializeStableIdRuntime();
}

export {
  startDesktopLogin as a,
  initializeDesktopLoginRuntime as i,
  getCodexAppVersion as n,
  initializeDesktopAuthUrl as r,
  buildDesktopAuthUrl as t,
};
