// 桌面认证 fetch 层（R5 认证核心）。
//
// 对应 main-C-Mhak1n.ts 62,041-63,404：
//   - 请求 profile / workspace 设置 / 账号列表的 zod schema（sT/OTe/kTe/ATe）
//   - 从 JWT 提取账号信息（cT）
//   - fetch 错误类型（lT ApiFetchError、hT AuthenticatedDesktopFetchError、WTe FileDownloadError）
//   - auth 状态机（MTe/NTe/PTe/FTe：attachAuth 判定 → token 获取 → 账号变更 409 → 401 重试）
//   - OIS（OpenAI Integrity State）令牌族（uT~BTe）
//   - URL 脱敏（VTe/fT/HTe/pT，日志安全）
//   - ZTe DesktopFetchService：面向 renderer 的 HTTP 代理 + 认证 JSON API +
//     trace 导出 + 下载流 + vscode/dictation 特判（~760 行单体类）
//   - 服务桥（tEe 退订句柄 / nEe composer items / rEe 主窗口动作）
//   - iEe browser-auth 提交（与 bootstrap state/browser-auth-operations 同键的另一端）
//
// 与 bootstrap api/authed-fetch 的关系（分层，勿合并）：header 附加 / workspace
// 路由 / token 解析等语义函数单点在 bootstrap；本模块是更重的全功能 fetch 管道
// （abortControllers / metrics / progress / observer 语义 bootstrap 管道没有）。
import { setTimeout as timersSetTimeout } from "node:timers/promises";
import {
  wf as objectSchema,
  hf as arraySchema,
  Of as stringSchema,
  df as enumSchema,
  gf as booleanSchema,
  Ef as recordSchema,
  xf as looseObjectSchema,
  vf as discriminatedUnionSchema,
  jf as unionSchema,
  Uf as EventEmitterBase,
  Wr as disposableBag,
  kc as raceWithAbortSignal,
  Gs as shouldAttachAuthHeaders,
  Ys as expectedAccountIdOf,
  Zs as hasHeader,
  Ks as wantsDesktopSurface,
  qs as wantsDeviceCheckToken,
  Js as wantsIntegrityState,
  Xs as errorKindOf,
  $s as errorCodeFromBody,
  t as workspaceAuthErrorOf,
  _i as principalOfToken,
  Is as isGitSource,
  fi as getGenerationStatuses,
  li as getChatGptComposerItems,
  mi as recordComposerItemInteraction,
  di as getAccessibleApps,
  ui as isEnabledApp,
  Bs as HEADER_DESKTOP_SURFACE,
  Hs as HEADER_SURFACE_MODE,
  Ws as HEADER_SURFACE,
  Vs as HEADER_NATIVE_APP,
  js as GIT_SOURCE_HEADER_KEY,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  yt as getAccountId,
  mt as applyAuthHeaders,
  ht as applyWorkspaceRouting,
  _t as assertSameAuthIdentity,
  xt as resolveBackendApiUrl,
  gt as applyOriginatorHeaders,
  U as INTEGRITY_STATE_ENVELOPE_KEY,
  I as BROWSER_AUTH_OPERATIONS_KEY,
  At as MESSAGE_FOR_VIEW,
  dt as BrowserAuthOperationsStore,
} from "@chunk/bootstrap";
import { LOCAL_HOST_ID } from "../host-id";

// ---------------------------------------------------------------------------
// zod schema（原 sT/OTe/kTe/ATe，62,046-62,087）
// ---------------------------------------------------------------------------

/** 请求方 profile（原 `sT`）：codex 桌面 / ChatGPT 原生 / ChatGPT 浏览器三种形态。 */
const requestProfileSchema = discriminatedUnionSchema("kind", [
  objectSchema({ kind: enumSchema(["codex"]), language: stringSchema() }),
  objectSchema({
    kind: enumSchema(["chatgpt-native"]),
    language: stringSchema(),
    deviceId: stringSchema().min(1),
    accountId: stringSchema().optional(),
  }),
  objectSchema({
    kind: enumSchema(["chatgpt-browser"]),
    language: stringSchema(),
    deviceId: stringSchema().min(1),
    accountId: stringSchema().optional(),
    userAgent: stringSchema(),
    userAgentClientHints: stringSchema(),
    platformClientHint: stringSchema(),
  }),
]);

/** workspace 设置响应（原 `OTe`）。 */
const workspaceSettingsSchema = looseObjectSchema({
  beta_settings: recordSchema(stringSchema(), booleanSchema()),
  beta_settings_str: recordSchema(stringSchema(), stringSchema()).optional(),
  permissions: arraySchema(stringSchema()).nullable().optional(),
  admin_work_mode_enabled: booleanSchema().optional(),
  admin_work_local_enabled: booleanSchema().optional(),
  desktop_app_beta_policy: enumSchema([
    "blocked",
    "optional_default_off",
    "optional_default_on",
    "required",
  ]).optional(),
  allow_third_party_gpts: enumSchema(["allow_all", "allow_none", "allow_specific"]).optional(),
  usage_limit_increase_request: discriminatedUnionSchema("kind", [
    looseObjectSchema({ kind: enumSchema(["openai_native"]) }),
    looseObjectSchema({ kind: enumSchema(["disabled"]) }),
    looseObjectSchema({
      kind: enumSchema(["custom"]),
      instructions: stringSchema().nullable().optional(),
      request_url: stringSchema().nullable().optional(),
    }),
  ])
    .nullable()
    .optional(),
  member_profiles_enabled: booleanSchema().optional(),
});

/** ChatGPT 形态的请求 profile（原 `kTe`，sT 的后两个分支）。 */
const chatgptRequestProfileSchema = unionSchema([requestProfileSchema.options[1], requestProfileSchema.options[2]]);

/** 发布 ChatGPT 请求 profile 的入参（原 `ATe`）。 */
const publishChatGptProfileSchema = objectSchema({
  accountId: stringSchema().min(1),
  userId: stringSchema().min(1),
  profile: chatgptRequestProfileSchema,
});

const fetchHandlerLogger = memoizedTaggedLogger("electron-fetch-handler");
const fetchWrapperLogger = memoizedTaggedLogger("electron-fetch-wrapper");

// ---------------------------------------------------------------------------
// 从 JWT 提取账号信息（原 `cT`，62,089）
// ---------------------------------------------------------------------------

interface AccountInfo {
  accountId: string | null;
  userId: string | null;
  authenticatedUserId: string | null;
  plan: string | null;
  email: string | null;
  computeResidency: string | null;
  hasChatGptToken: boolean;
}

const EMPTY_ACCOUNT_INFO: Omit<AccountInfo, "hasChatGptToken"> = {
  accountId: null,
  userId: null,
  authenticatedUserId: null,
  plan: null,
  email: null,
  computeResidency: null,
};

/** 从 app-server 的 auth token（JWT）解析账号/套餐/邮箱等信息（原 `cT`）。 */
async function readAccountInfoFromToken(connection: {
  getConnection(hostId: string): { getAuthToken(opts: { refreshToken: boolean }): Promise<string | null> };
}): Promise<AccountInfo> {
  let hasChatGptToken = false;
  try {
    const token = await connection.getConnection(LOCAL_HOST_ID).getAuthToken({ refreshToken: false });
    if (!token) return { ...EMPTY_ACCOUNT_INFO, hasChatGptToken };
    hasChatGptToken = true;
    const [, payload] = token.split(".");
    if (!payload) throw new Error("Missing token payload");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const auth = claims["https://api.openai.com/auth"];
    const profile = claims["https://api.openai.com/profile"];
    const accountId =
      auth && typeof auth == "object" && auth ? auth.chatgpt_account_id : null;
    const userId = auth && typeof auth == "object" && auth ? auth.chatgpt_user_id : null;
    const authenticatedUserId =
      auth && typeof auth == "object" && "user_id" in auth ? (auth.user_id ?? userId) : userId;
    const plan = auth && typeof auth == "object" && auth ? auth.chatgpt_plan_type : null;
    const computeResidency =
      auth && typeof auth == "object" && auth ? auth.chatgpt_compute_residency : null;
    const email = profile && typeof profile == "object" && profile ? profile.email : null;
    if (typeof accountId == "string" && typeof userId == "string") {
      return {
        accountId,
        userId,
        authenticatedUserId: typeof authenticatedUserId == "string" && authenticatedUserId.length > 0 ? authenticatedUserId : null,
        plan: typeof plan == "string" ? plan : null,
        email: typeof email == "string" ? email : null,
        computeResidency: typeof computeResidency == "string" ? computeResidency : null,
        hasChatGptToken,
      };
    }
  } catch (error) {
    fetchHandlerLogger().error("Unable to extract account id and plan from auth token", {
      safe: {},
      sensitive: { error },
    });
  }
  return { ...EMPTY_ACCOUNT_INFO, hasChatGptToken };
}

// ---------------------------------------------------------------------------
// 错误类型（原 `lT`/`hT`/`WTe`）
// ---------------------------------------------------------------------------

/** 带 HTTP 状态与错误码的 fetch 失败（原 `lT`）。 */
class ApiFetchError extends Error {
  status: number | null;
  cause: unknown;
  errorCode: string | undefined;
  constructor(message: string, status: number | null, cause: unknown, errorCode?: string) {
    super(message);
    this.status = status;
    this.cause = cause;
    this.errorCode = errorCode;
  }
}

/** 认证桌面 fetch 失败（原 `hT`）。 */
class AuthenticatedDesktopFetchError extends Error {
  status: number;
  errorCode: string | undefined;
  constructor(status: number, errorCode?: string) {
    super(`Authenticated desktop fetch failed (${status})`);
    this.status = status;
    this.errorCode = errorCode;
  }
}

/** 文件下载失败（原 `WTe`）。 */
class FileDownloadError extends Error {
  status: number;
  constructor(status: number) {
    super(`File download failed with status ${status}`);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// auth 状态机（原 `MTe`/`NTe`/`PTe`/`FTe`，62,149-62,192）
// ---------------------------------------------------------------------------

interface AuthState {
  attachAuth: boolean;
  expectedAccountId: string | null;
  tokenSource: "pending" | "not-required" | "cached" | "loaded" | "refreshed";
  token: string | null;
}

/** 判定请求是否需要附加认证（原 `MTe`）。 */
function resolveAuthState(headers: Record<string, unknown>, { inferAuth = false } = {}): AuthState {
  const wantsAuth = shouldAttachAuthHeaders(headers);
  const expectedAccountId = expectedAccountIdOf(headers);
  const attachAuth = (wantsAuth || inferAuth) && !hasHeader(headers, "authorization");
  return {
    attachAuth,
    expectedAccountId,
    tokenSource: attachAuth ? "pending" : "not-required",
    token: null,
  };
}

interface AppServerClientLike {
  getCachedAuthToken?(): string | null | undefined;
  getAuthToken(opts: { refreshToken: boolean }): Promise<string | null>;
}

/** 获取 token（原 `NTe`）：优先缓存，失败抛 ApiFetchError。 */
async function loadAuthToken({
  appServerClient,
  errorStatus,
  failureMessage,
  refreshToken,
  state,
}: {
  appServerClient: AppServerClientLike;
  errorStatus: number;
  failureMessage: string;
  refreshToken: boolean;
  state: AuthState;
}): Promise<AuthState> {
  if (!state.attachAuth) return state;
  if (!refreshToken) {
    const cached = appServerClient.getCachedAuthToken?.();
    if (cached !== undefined) return { ...state, tokenSource: "cached", token: cached };
  }
  try {
    const token = await appServerClient.getAuthToken({ refreshToken });
    return { ...state, tokenSource: refreshToken ? "refreshed" : "loaded", token };
  } catch (error) {
    throw new ApiFetchError(failureMessage, errorStatus, error);
  }
}

/** 附加认证头（原 `PTe`）：token 的账号与期望不符时以 409 account_changed 中止。 */
function attachAuthToHeaders({
  desktopOriginator,
  headers,
  state,
}: {
  desktopOriginator?: string;
  headers: Record<string, unknown>;
  state: AuthState;
}) {
  if (state.attachAuth && state.token != null) {
    if (state.expectedAccountId != null && getAccountId(state.token) !== state.expectedAccountId)
      throw new ApiFetchError(
        "The authenticated account changed before the request could be sent.",
        409,
        null,
        "account_changed",
      );
    applyAuthHeaders(headers, state.token, { desktopOriginator, includeSurfaceHeaders: false });
  }
}

/** 是否应在 401 后刷新 token 重试（原 `FTe`）。 */
function shouldRetryAfter401(state: AuthState, response: Response): boolean {
  return state.attachAuth && state.token != null && response.status === 401;
}

// ---------------------------------------------------------------------------
// OIS（OpenAI Integrity State）令牌族（原 `uT`~`BTe`，62,194-62,254）
// ---------------------------------------------------------------------------

const INTEGRITY_STATE_HEADER = "X-OAI-IS";
const INTEGRITY_STATE_UPDATE_HEADER = "X-OAI-IS-Update";
const INTEGRITY_STATE_PATTERN = /^ois1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function isValidIntegrityState(value: unknown): value is string {
  return (
    typeof value != "string" ||
    value.length === 0 ||
    value.length > 2048 ||
    value.trim() !== value
      ? false
      : INTEGRITY_STATE_PATTERN.test(value)
  );
}

/** 从响应头读 integrity state 更新（原 `RTe`）。 */
function readResponseUpdate(headers: Headers): string | null {
  const update = headers.get(INTEGRITY_STATE_UPDATE_HEADER);
  return isValidIntegrityState(update) ? update : null;
}

/** 校验状态迁移：currentState 有效时须等于 expected，next 才被接受（原 `zTe`）。 */
function isExpectedIntegrityTransition({
  currentState,
  expectedState,
  nextState,
}: {
  currentState: unknown;
  expectedState: string | null;
  nextState: string | null;
}): boolean {
  return isValidIntegrityState(nextState)
    ? (isValidIntegrityState(currentState) ? currentState : null) === expectedState
    : false;
}

/** integrity state 的持久化存取（原 `BTe`，经 bootstrap globalState 键）。 */
class IntegrityStateStore {
  #globalState: { get(key: unknown): unknown; delete(key: unknown): void; update(key: unknown, fn: (v: unknown) => unknown): void };
  constructor(globalState: InstanceType<typeof Object> & { get(k: unknown): unknown; delete(k: unknown): void; update(k: unknown, f: (v: unknown) => unknown): void }) {
    this.#globalState = globalState;
  }
  getRequestState(): string | null {
    const value = this.#globalState.get(INTEGRITY_STATE_ENVELOPE_KEY);
    return isValidIntegrityState(value) ? value : null;
  }
  clear() {
    this.#globalState.delete(INTEGRITY_STATE_ENVELOPE_KEY);
  }
  /** 响应携带合法更新且与请求状态衔接时写入；返回是否接受。 */
  storeResponseUpdate(headers: Headers, expectedState: string | null): boolean {
    const next = readResponseUpdate(headers);
    if (!isValidIntegrityState(next)) return false;
    let accepted = false;
    this.#globalState.update(INTEGRITY_STATE_ENVELOPE_KEY, (current) =>
      isExpectedIntegrityTransition({ currentState: current, expectedState, nextState: next })
        ? ((accepted = true), next)
        : (current ?? undefined),
    );
    return accepted;
  }
}

// ---------------------------------------------------------------------------
// URL 脱敏（原 `VTe`/`fT`/`HTe`/`pT`，62,233-62,281，日志安全）
// ---------------------------------------------------------------------------

const NON_SENSITIVE_PATH_SEGMENTS = new Set([
  "accounts",
  "backend-api",
  "by-repo",
  "conversation",
  "environments",
  "account",
  "announcement",
  "data-controls",
  "first-run",
  "general-settings",
  "git-settings",
  "local-environments",
  "mcp-settings",
  "open-source-licenses",
  "personalization",
  "plan-summary",
  "select-workspace",
  "settings",
  "usage-analytics",
  "worktrees",
]);

/** URL → 脱敏形式：路径参数归一为 :param，短段与白名单段保留（原 `fT`）。 */
function redactUrl(url: string): string | undefined {
  if (!URL.canParse(url)) return;
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return parsed.protocol;
  const origin = parsed.hostname.endsWith(".chatgpt-staging.com")
    ? `${parsed.protocol}//chatgpt-staging.com`
    : parsed.origin;
  return `${origin}/${redactWsUser(parsed.pathname, ":param")
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {}
      const lowered = decoded.toLowerCase();
      return lowered.length <= 6 || NON_SENSITIVE_PATH_SEGMENTS.has(lowered) ? lowered : ":param";
    })
    .join("/")}`;
}

/** /ws/user/<id> 段脱敏（原 `HTe`）。 */
function redactWsUser(pathname: string, replacement: string): string {
  return pathname.replace(/(\/ws\/user\/)[^/?#\s"'<>`]+/gi, `$1${replacement}`);
}

/** 日志里的 fetch 目标（原 `pT`）。 */
function formatFetchTarget(method: string, url: string): string {
  return `${method} ${redactUrl(url) ?? "<invalid-url>"}`;
}

/** include_checkpoint_cdn=true 的 pages/spaces 路径（原 `UTe`）。 */
function isCheckpointCdnEligiblePath(url: string): boolean {
  const parsed = new URL(url);
  return parsed.searchParams.get("include_checkpoint_cdn") === "true"
    ? /^\/(?:backend-api|api)\/pages$/u.test(parsed.pathname) ||
        /^\/(?:backend-api|api)\/spaces\/v2$/u.test(parsed.pathname) ||
        /^\/(?:backend-api|api)\/spaces\/[A-Za-z0-9._~-]{1,200}\/pages$/u.test(parsed.pathname)
    : false;
}

// ---------------------------------------------------------------------------
// 常量（原 `GTe`~`XTe`）
// ---------------------------------------------------------------------------

const VSCODE_REQUEST_PREFIX = "vscode://codex/";
const DICTATION_STREAM_CONNECT_INFO_PATH = "/codex/dictation-stream-connect-info";
const DICTATION_WEBSOCKET_PROTOCOL = "chatgpt-dictation";
const DICTATION_CLIENT_PROTOCOL = "codex-desktop";
const DICTATION_BEARER_PREFIX = "openai-bearer.";
const DOWNLOAD_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// DesktopFetchService（原 `ZTe`，62,310-63,068）
// ---------------------------------------------------------------------------

interface DesktopFetchOptions {
  appServerConnectionRegistry: {
    getConnection(hostId: string): {
      getAuthToken(opts: { refreshToken: boolean }): Promise<string | null>;
      getCachedAuthenticatedPrincipal(): { accountId: string; userId: string } | null;
      getBackendRequestAuth(opts: { refreshToken: boolean }): Promise<{
        token: string;
        signal: AbortSignal;
        routing: { kind: string };
      } | null>;
      getUserSavedConfiguration(): Promise<unknown>;
      registerInternalAuthenticatedPrincipalChangeHandler(cb: () => void): () => void;
    };
    getMaybeConnection(hostId: string): unknown;
  };
  applicationNetwork: {
    assertAllowed(url: string): void;
    fetch(url: string, init: unknown): Promise<Response>;
    whenReady(): Promise<void>;
    request(opts: unknown): {
      getUploadProgress(): { started: boolean; current: number; total: number };
      abort(): void;
      on(event: string, cb: (arg?: unknown) => void): void;
      end(body?: unknown): void;
    };
  };
  desktopOriginator?: string;
  integrityStateStore: IntegrityStateStore;
  deviceCheckCookieManager: { ensureCookie(headers: unknown): Promise<void>; attachToken(headers: unknown): Promise<void> };
  chunkedMessageSender: {
    send(view: unknown, channel: string, message: unknown): void;
    sendCritical(view: unknown, channel: string, message: unknown): void;
    sendInlineMessageForView(view: unknown, message: unknown): void;
  };
}

interface HostFetchHandler {
  handleVSCodeRequest(
    view: unknown,
    path: string,
    body: unknown,
    gitSource: string | null,
    signal: AbortSignal,
  ): Promise<unknown>;
}

interface FetchMetrics {
  attachAuth: boolean;
  attachDesktopSurface: boolean;
  attachDeviceCheckToken: boolean;
  attachIntegrityState: boolean;
  hasToken: boolean;
  retriedAfter401: boolean;
  timings: {
    authMs?: number;
    fetchMs?: number;
    retryAuthMs?: number;
    retryFetchMs?: number;
    bodyReadMs?: number;
  };
  tokenSource: string;
}

/** 桌面 fetch 服务（原 `ZTe`）：renderer HTTP 代理 + 认证 JSON API 核心。 */
class DesktopFetchService {
  fetchHandler: HostFetchHandler;
  options: DesktopFetchOptions;
  abortControllers = new Map<string, AbortController>();
  traceExportEnabled: Promise<boolean> | null = null;

  constructor(fetchHandler: HostFetchHandler, options: DesktopFetchOptions) {
    this.fetchHandler = fetchHandler;
    this.options = options;
  }

  /** 认证 JSON API（原 `fetchAuthenticatedJson`）。 */
  async fetchAuthenticatedJson(
    url: string,
    opts: {
      body?: unknown;
      method?: string;
      signal?: AbortSignal;
      surface?: string;
      requestProfile?: { kind: string; language: string; deviceId?: string; accountId?: string | null; userAgent?: string; userAgentClientHints?: string; platformClientHint?: string };
      expectedPrincipal?: { accountId: string; userId: string } | null;
    },
  ): Promise<unknown> {
    const headers: Record<string, unknown> = {
      [HEADER_DESKTOP_SURFACE]: "1",
      [HEADER_SURFACE_MODE]: "1",
      "Content-Type": "application/json",
    };
    if (opts.surface != null) headers[HEADER_SURFACE] = opts.surface;
    const profile = opts.requestProfile;
    if (profile != null) {
      headers["OAI-Language"] = profile.language;
      if (profile.kind === "codex") {
        headers.originator = "Codex Desktop";
      } else {
        headers["oai-did"] = profile.deviceId;
        if (profile.accountId != null) headers["ChatGPT-Account-ID"] = profile.accountId;
        if (profile.kind === "chatgpt-native") {
          headers[HEADER_NATIVE_APP] = "1";
        } else {
          headers.originator = "Codex Browser";
          headers["User-Agent"] = profile.userAgent;
          headers["sec-ch-ua"] = profile.userAgentClientHints;
          headers["sec-ch-ua-mobile"] = "?0";
          headers["sec-ch-ua-platform"] = profile.platformClientHint;
        }
      }
    }
    if ((opts.method ?? "GET") === "GET" && opts.body == null) this.deleteHeader(headers, "Content-Type");
    const {
      response,
      signal,
      workspaceIpAuthorizationError,
    } = await this.performDesktopFetch({
      body: opts.body == null ? undefined : JSON.stringify(opts.body),
      expectedPrincipal: opts.expectedPrincipal,
      headers,
      method: opts.method ?? "GET",
      resolvedUrl: this.ensureAbsoluteUrl(url),
      signal: opts.signal,
    });
    if (!response.ok) {
      const bodyText = await response.text().catch(() => null);
      signal.throwIfAborted();
      throw new AuthenticatedDesktopFetchError(response.status, workspaceIpAuthorizationError?.errorCode ?? errorCodeFromBody(bodyText));
    }
    const json = await response.json();
    signal.throwIfAborted();
    return json;
  }

  /** 导出 OTel trace 批次（原 `exportTraceBatch`）。 */
  async exportTraceBatch(body: string): Promise<void> {
    // trace 导出开关懒缓存：首用时读 app-server 用户配置。
    this.traceExportEnabled ??= this.getAppServerConnection(LOCAL_HOST_ID)
      .getUserSavedConfiguration()
      .then((config) => lodashGet(config, "otel.trace_exporter") !== "none")
      .catch(() => false);
    if (!(await this.traceExportEnabled)) return;
    const endpointOverride = process.env.CODEX_OTEL_TRACES_ENDPOINT;
    if (endpointOverride != null && !["127.0.0.1", "[::1]", "localhost"].includes(new URL(endpointOverride).hostname))
      throw new Error("Desktop trace endpoint override must be loopback");
    const target = endpointOverride ?? resolveBackendApiUrl(this.options, "/o11y/v1/traces");
    const headers: Record<string, unknown> = { "Content-Type": "application/json" };
    if (endpointOverride == null) {
      headers[HEADER_DESKTOP_SURFACE] = "1";
      applyOriginatorHeaders(headers, { desktopOriginator: this.options.desktopOriginator });
    }
    await this.options.applicationNetwork.whenReady();
    const timeoutSignal = AbortSignal.timeout(9e3);
    const backendAuth = endpointOverride == null
      ? await raceWithAbortSignal(
          this.getAppServerConnection(LOCAL_HOST_ID).getBackendRequestAuth({ refreshToken: false }),
          timeoutSignal,
        )
      : null;
    const signal = backendAuth == null ? timeoutSignal : AbortSignal.any([timeoutSignal, backendAuth.signal]);
    const send = async () => {
      const { response } = await this.performDesktopFetch({
        body,
        headers: { ...headers },
        method: "POST",
        redirect: "error",
        resolvedUrl: target,
        signal,
      });
      return response;
    };
    let response: Response;
    try {
      response = await send();
    } catch (error) {
      if (signal.aborted) throw error;
      await timersSetTimeout(250, undefined, { signal });
      response = await send();
    }
    if (response.ok) {
      await response.body?.cancel();
      return;
    }
    if ([429, 502, 503, 504].includes(response.status)) {
      const retryAfter = response.headers.get("retry-after");
      const parsed = retryAfter == null ? NaN : Number(retryAfter);
      const delay = Number.isFinite(parsed) ? Math.min(2e3, Math.max(0, parsed * 1e3)) : 250;
      await response.body?.cancel();
      await timersSetTimeout(delay, undefined, { signal });
      response = await send();
    }
    if (!response.ok) throw (await response.body?.cancel(), new Error(`Desktop trace export failed (${response.status})`));
    await response.body?.cancel();
  }

  /** 获取下载流（原 `getDownloadStream`）。 */
  async getDownloadStream({ downloadUrl, requestHeaders }: { downloadUrl: string; requestHeaders?: Record<string, unknown> }): Promise<ReadableStream<Uint8Array>> {
    const resolvedUrl = this.ensureAbsoluteUrl(downloadUrl);
    const { headers, body } = this.prepareFetchInit({
      type: "fetch",
      requestId: "host-download",
      url: downloadUrl,
      method: "GET",
      headers: requestHeaders,
    });
    const { response } = await this.performDesktopFetch({
      body,
      headers,
      method: "GET",
      resolvedUrl,
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) throw (await response.body?.cancel(), new FileDownloadError(response.status));
    if (response.body == null) throw new Error("File download returned no response body");
    return response.body;
  }

  getAppServerConnection(hostId: string) {
    return this.options.appServerConnectionRegistry.getConnection(hostId);
  }

  getAbortControllerKey(view: { id: number | string }, requestId: string): string {
    return `${view.id}:${requestId}`;
  }

  /** renderer fetch 请求入口（原 `handleRequest`）。 */
  async handleRequest(view: { id: number | string }, request: { url: string; requestId: string }): Promise<void> {
    if (request.url === DICTATION_STREAM_CONNECT_INFO_PATH) {
      await this.handleDictationStreamConnectInfoRequest(view, request);
      return;
    }
    const controller = new AbortController();
    const key = this.getAbortControllerKey(view, request.requestId);
    this.abortControllers.set(key, controller);
    if (this.isVsCodeFetchRequest(request.url)) {
      try {
        await this.handleVsCodeFetchRequest(view, request, controller.signal);
      } finally {
        this.abortControllers.delete(key);
      }
      return;
    }
    throw (
      this.abortControllers.delete(key),
      new Error("HTTP requests must use the HTTP fetch service.")
    );
  }

  /** renderer HTTP 代理（原 `fetchHttp`）。 */
  async fetchHttp(
    viewId: string,
    request: {
      url: string;
      method: string;
      body?: string | ArrayBuffer | Uint8Array;
      headers?: Record<string, unknown>;
      requestId: string;
      expectedIdentity?: { accountId: string; userId: string } | null;
      responsePriority?: string;
    },
    signal: AbortSignal,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void,
    responseObserver?: (url: string, response: Response) => Promise<void>,
  ): Promise<
    | { type: "fetch-response"; responseType: "success"; requestId: string; response: { status: number; statusText: string; headers: Record<string, string> } }
    | { type: "fetch-response"; responseType: "error"; requestId: string; status: number; error: string; responseStatus: number | null; errorCode?: string; errorKind?: unknown }
  > {
    const resolvedUrl = this.ensureAbsoluteUrl(request.url);
    const target = formatFetchTarget(request.method, resolvedUrl);
    const startedAt = performance.now();
    let metrics: FetchMetrics | null = null;
    try {
      const { headers, body } = this.prepareFetchInit(request);
      fetchWrapperLogger().debug("Fetch", {
        safe: { requestId: viewId, target, body: request.body == null ? "<no-body>" : "<body-redacted>" },
        sensitive: {},
      });
      const result = await this.performDesktopFetch({
        body,
        expectedPrincipal: request.expectedIdentity,
        headers,
        method: request.method,
        onUploadProgress,
        resolvedUrl,
        signal,
        messagingTrace: undefined,
      });
      metrics = result.metrics;
      const rawResponse = result.response;
      const responseHeaders = headersToRecord(rawResponse);
      if (rawResponse.ok) {
        // 认证 GET 响应的观察器：checkpoint CDN 路径 fire-and-forget，其余 await。
        if (request.method === "GET" && metrics.attachAuth && metrics.hasToken && responseObserver != null) {
          if (isCheckpointCdnEligiblePath(resolvedUrl)) {
            try {
              responseObserver(resolvedUrl, rawResponse).catch(() => {
                fetchWrapperLogger().warning("Authenticated response observer failed", {
                  safe: { target },
                  sensitive: {},
                });
              });
            } catch {
              fetchWrapperLogger().warning("Authenticated response observer failed", {
                safe: { target },
                sensitive: {},
              });
            }
          } else {
            await responseObserver(resolvedUrl, rawResponse);
          }
        }
        result.signal.throwIfAborted();
        this.logFetchTiming({
          bodyBytes: 0,
          metrics,
          requestId: viewId,
          responseType: "stream-open",
          status: rawResponse.status,
          target,
          totalMs: elapsedMs(startedAt),
        });
        return {
          type: "fetch-response",
          responseType: "success",
          requestId: viewId,
          response: new Response(rawResponse.body, {
            status: rawResponse.status,
            statusText: rawResponse.statusText,
            headers: responseHeaders,
          }) as never,
        };
      }
      {
        let errorText: string;
        let bodyBytes = 0;
        const bodyReadStart = performance.now();
        try {
          const text = await rawResponse.text();
          bodyBytes = Buffer.byteLength(text);
          errorText = text || rawResponse.statusText || `Request failed with status ${rawResponse.status}`;
        } catch {
          errorText = rawResponse.statusText || `Request failed with status ${rawResponse.status}`;
        }
        metrics.timings.bodyReadMs = elapsedMs(bodyReadStart);
        result.signal.throwIfAborted();
        const error = {
          type: "fetch-response" as const,
          responseType: "error" as const,
          requestId: viewId,
          status: rawResponse.status,
          error: result.workspaceIpAuthorizationError?.message ?? errorText,
          responseStatus: rawResponse.status,
          errorCode: result.workspaceIpAuthorizationError?.errorCode ?? errorCodeFromBody(errorText),
        };
        this.logFetchTiming({
          bodyBytes,
          metrics,
          requestId: viewId,
          responseType: "error",
          status: rawResponse.status,
          target,
          totalMs: elapsedMs(startedAt),
        });
        return error;
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      const errorCode = extractErrorCode(error);
      const apiError = error instanceof ApiFetchError ? error : null;
      const status = apiError?.status ?? (aborted ? 499 : 500);
      const result = {
        type: "fetch-response" as const,
        responseType: "error" as const,
        requestId: viewId,
        status,
        error: apiError?.message ?? (error instanceof Error ? error.message : "Unknown error"),
        errorCode,
        responseStatus: null,
        errorKind: errorKindOf(error),
      };
      this.logFetchTiming({
        bodyBytes: 0,
        metrics,
        requestId: viewId,
        responseType: "exception",
        status,
        target,
        totalMs: elapsedMs(startedAt),
      });
      return result;
    }
  }

  cancelRequest(view: { id: number | string }, request: { requestId: string }) {
    const key = this.getAbortControllerKey(view, request.requestId);
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * 认证 fetch 管道（原 `performDesktopFetch`）。
   *
   * 状态机：attachAuth 判定 → token 获取（432 失败码）→ workspace 路由（432）→
   * 请求执行 → 401 刷新重试一次。三个失败短路：账号变更 409 account_changed、
   * workspace 不可用 432、401 重试。
   */
  async performDesktopFetch({
    body,
    expectedPrincipal,
    headers,
    method,
    onUploadProgress,
    redirect,
    resolvedUrl,
    signal,
    messagingTrace,
  }: {
    body?: string | ArrayBuffer | Uint8Array;
    expectedPrincipal?: { accountId: string; userId: string } | null;
    headers: Record<string, unknown>;
    method: string;
    onUploadProgress?: (progress: { loaded: number; total: number }) => void;
    redirect?: RequestRedirect;
    resolvedUrl: string;
    signal: AbortSignal;
    messagingTrace?: unknown;
  }): Promise<{
    metrics: FetchMetrics;
    response: Response;
    signal: AbortSignal;
    workspaceIpAuthorizationError: { errorCode?: string; message: string } | null;
  }> {
    let abortSignal = signal;
    // 认证子步骤的失败包装：默认透传（原 f = (e, t) => t()）。
    const guarded = (_step: string, run: () => Promise<unknown> | unknown) => run();
    abortSignal.throwIfAborted();
    this.options.applicationNetwork.assertAllowed(resolvedUrl);
    this.deleteHeader(headers, "X-OpenAI-Account-Routing-Override");

    const attachDesktopSurface = wantsDesktopSurface(headers);
    const attachDeviceCheckToken = wantsDeviceCheckToken(headers);
    const attachIntegrityState = wantsIntegrityState(headers);
    let authState = resolveAuthState(headers, { inferAuth: this.shouldInferCodexApiAuth(resolvedUrl) });
    const useRestrictedAuth = authState.attachAuth && this.shouldUseRestrictedFetchAuth(resolvedUrl);
    const loadAuth = async ({
      errorStatus,
      failureMessage,
      refreshToken,
      state,
    }: {
      errorStatus: number;
      failureMessage: string;
      refreshToken: boolean;
      state: AuthState;
    }) => (
      abortSignal.throwIfAborted(),
      this.options.applicationNetwork.assertAllowed(resolvedUrl),
      loadAuthToken({
        appServerClient: this.getAppServerConnection(LOCAL_HOST_ID),
        errorStatus,
        failureMessage,
        refreshToken,
        state,
      })
    );
    const timings: FetchMetrics["timings"] = {};
    let metrics: FetchMetrics = {
      attachAuth: authState.attachAuth,
      attachDesktopSurface,
      attachDeviceCheckToken,
      attachIntegrityState,
      hasToken: authState.token != null,
      retriedAfter401: false,
      timings,
      tokenSource: authState.tokenSource,
    };

    // —— 附加认证的 URL/组合守卫（原 62,631-62,646 的四个 Refusing 分支）——
    if (authState.attachAuth && !this.isDesktopAuthAllowedUrl(resolvedUrl))
      throw new ApiFetchError("Refusing to attach authentication to non-OpenAI URL", 400, null);
    if (attachDesktopSurface && !this.isDesktopAuthAllowedUrl(resolvedUrl))
      throw new ApiFetchError("Refusing to attach desktop surface to non-OpenAI URL", 400, null);
    if (attachDeviceCheckToken && !attachDesktopSurface)
      throw new ApiFetchError("Refusing to attach DeviceCheck token without desktop surface", 400, null);
    if (attachDeviceCheckToken && !this.isDesktopAuthAllowedUrl(resolvedUrl))
      throw new ApiFetchError("Refusing to attach DeviceCheck token to non-OpenAI URL", 400, null);
    if (attachDeviceCheckToken) {
      const pathname = new URL(resolvedUrl).pathname;
      const isMessagingPost =
        method === "POST" && /^\/(?:backend-api|api)\/messaging\/rooms\/[^/]+\/messages$/.test(pathname);
      if (!pathname.endsWith("/ios/attestation_challenge") && !isMessagingPost)
        throw new ApiFetchError("Refusing to attach DeviceCheck token to unexpected URL", 400, null);
    }
    if (attachIntegrityState && !this.isDesktopAuthAllowedUrl(resolvedUrl))
      throw new ApiFetchError("Refusing to attach integrity state to non-OpenAI URL", 400, null);

    const serializeBody = () => {
      if (typeof body == "string") return body;
      if (body == null) return undefined;
      const copy = new Uint8Array(body.byteLength);
      copy.set(body as Uint8Array);
      return copy.buffer;
    };

    const sendRequest = async (state: AuthState): Promise<Response> => {
      abortSignal.throwIfAborted();
      this.options.applicationNetwork.assertAllowed(resolvedUrl);
      const requestHeaders = this.cloneHeaders(headers);
      const url = workspaceAuth == null ? resolvedUrl : applyWorkspaceRouting(resolvedUrl, requestHeaders, workspaceAuth);
      this.deleteHeader(requestHeaders, INTEGRITY_STATE_HEADER);
      const requestIntegrityState = attachIntegrityState ? this.options.integrityStateStore.getRequestState() : null;
      attachAuthToHeaders({ desktopOriginator: this.options.desktopOriginator, headers: requestHeaders, state });
      await this.maybeApplyPluginServicePreviewCookie(requestHeaders, resolvedUrl, state);
      if (attachDesktopSurface) applyOriginatorHeaders(requestHeaders, { desktopOriginator: this.options.desktopOriginator });
      if (attachIntegrityState && requestIntegrityState != null) this.setHeader(requestHeaders, INTEGRITY_STATE_HEADER, requestIntegrityState);
      if (attachDesktopSurface) {
        this.options.applicationNetwork.assertAllowed(resolvedUrl);
        await guarded("host.device_cookie", () => this.options.deviceCheckCookieManager.ensureCookie(requestHeaders));
      }
      if (attachDeviceCheckToken) {
        this.options.applicationNetwork.assertAllowed(resolvedUrl);
        await guarded("host.device_token", () => this.options.deviceCheckCookieManager.attachToken(requestHeaders));
      }
      abortSignal.throwIfAborted();
      // TOCTOU 防护：发送前再校验一次认证身份（原 62,675-62,686）。
      if (expectedPrincipal != null) {
        const principal = principalOfToken(state.token);
        const cachedPrincipal =
          expectedPrincipal == null ? null : this.getAppServerConnection(LOCAL_HOST_ID).getCachedAuthenticatedPrincipal();
        if (
          principal?.accountId !== expectedPrincipal.accountId ||
          principal.userId !== expectedPrincipal.userId ||
          (expectedPrincipal != null && (cachedPrincipal?.accountId !== expectedPrincipal.accountId || cachedPrincipal.userId !== expectedPrincipal.userId))
        )
          throw new DOMException("Authenticated principal changed", "AbortError");
      }
      const response = (await guarded("host.network", async () => {
        let result: Response;
        if (onUploadProgress == null) {
          const init = {
            method,
            headers: requestHeaders,
            body: serializeBody(),
            redirect: workspaceAuth == null ? redirect : "error",
            signal: abortSignal,
            credentials: attachDesktopSurface ? "include" : "same-origin",
          };
          result = (await this.options.applicationNetwork.fetch(url, init)) as Response;
        } else {
          result = (await this.performProgressRequest({
            body: serializeBody(),
            headers: requestHeaders,
            method,
            onUploadProgress,
            resolvedUrl: url,
            redirect: workspaceAuth == null ? undefined : "error",
            signal: abortSignal,
            useSessionCookies: attachDesktopSurface,
          })) as Response;
        }
        return (abortSignal.throwIfAborted(), result);
      })) as Response;
      if (attachIntegrityState) this.options.integrityStateStore.storeResponseUpdate(response.headers, requestIntegrityState);
      return response;
    };

    // —— auth 获取（432 失败码）——
    const authStart = performance.now();
    authState = (await guarded("host.auth", () =>
      loadAuth({
        errorStatus: 432,
        failureMessage: useRestrictedAuth
          ? "Failed to retrieve restricted authentication token"
          : "Failed to retrieve authentication token",
        refreshToken: false,
        state: authState,
      }),
    )) as AuthState;

    // —— workspace 路由（432 失败码；workspace 模式下 body 经 TransformStream 挂 abort）——
    let workspaceAuth: { token: string; signal: AbortSignal } | null = null;
    if (!useRestrictedAuth && this.isWorkspaceBackendUrl(resolvedUrl) && (authState.attachAuth || hasHeader(headers, "authorization"))) {
      try {
        workspaceAuth = await raceWithAbortSignal(
          this.getAppServerConnection(LOCAL_HOST_ID).getBackendRequestAuth({ refreshToken: false }),
          abortSignal,
        );
        if (workspaceAuth == null)
          throw expectedPrincipal == null
            ? new Error("No authenticated workspace is available")
            : new DOMException("Authenticated principal changed", "AbortError");
        const authHeaderKey = this.findHeaderKey(headers, "authorization");
        const explicitToken = authHeaderKey == null ? null : (headers[authHeaderKey] as string)?.replace(/^Bearer /i, "");
        const token = authState.attachAuth ? authState.token : explicitToken;
        assertSameAuthIdentity(token, workspaceAuth);
        abortSignal = AbortSignal.any([abortSignal, workspaceAuth.signal]);
        abortSignal.throwIfAborted();
      } catch (error) {
        throw error instanceof Error && error.name === "AbortError"
          ? error
          : new ApiFetchError("Workspace routing is unavailable", 432, error);
      }
    }

    const principal = expectedPrincipal ?? (useRestrictedAuth ? null : principalOfToken(authState.token));
    timings.authMs = elapsedMs(authStart);
    metrics.hasToken = authState.token != null;
    metrics.tokenSource = authState.tokenSource;

    // —— 首次请求 ——
    const fetchStart = performance.now();
    let response = await sendRequest(authState);
    timings.fetchMs = elapsedMs(fetchStart);
    let workspaceIpAuthorizationError = (authState.attachAuth || hasHeader(headers, "authorization"))
      ? await workspaceAuthErrorOf(response)
      : null;
    // 401 重试判定：排除 form-fill POST；无 token 附加时不重试。
    const willRetry =
      !(method === "POST" && new URL(resolvedUrl).pathname.endsWith("/flora/browser/form-fill")) &&
      workspaceIpAuthorizationError == null &&
      shouldRetryAfter401(authState, response);
    if (
      response.status === 401 &&
      authState.attachAuth
    ) {
      fetchWrapperLogger().warning("desktop_fetch_auth_401", {
        safe: {
          hadToken: authState.token != null,
          skipRetryReason: workspaceIpAuthorizationError?.errorCode ?? (willRetry ? null : "no_token_attached"),
          target: formatFetchTarget(method, resolvedUrl),
          tokenSource: authState.tokenSource,
          willRetry,
        },
        sensitive: {},
      });
    }
    if (willRetry) {
      metrics.retriedAfter401 = true;
      await response.body?.cancel();
      const retryAuthStart = performance.now();
      authState = (await guarded("host.auth_refresh", () =>
        loadAuth({
          errorStatus: 401,
          failureMessage: useRestrictedAuth
            ? "Failed to refresh restricted authentication token"
            : "Failed to refresh authentication token",
          refreshToken: true,
          state: authState,
        }),
      )) as AuthState;
      timings.retryAuthMs = elapsedMs(retryAuthStart);
      metrics.hasToken = authState.token != null;
      metrics.tokenSource = authState.tokenSource;
      const retryFetchStart = performance.now();
      response = await sendRequest(authState);
      timings.retryFetchMs = elapsedMs(retryFetchStart);
      workspaceIpAuthorizationError = await workspaceAuthErrorOf(response);
    }

    abortSignal.throwIfAborted();
    if (workspaceAuth != null && response.body != null) {
      response = new Response(response.body.pipeThrough(new TransformStream(), { signal: abortSignal }), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    return { metrics, response, signal: abortSignal, workspaceIpAuthorizationError };
  }

  /** 带上传进度的请求（走 Electron net 模块，原 `performProgressRequest`）。 */
  performProgressRequest({
    body,
    headers,
    method,
    onUploadProgress,
    resolvedUrl,
    redirect,
    signal,
    useSessionCookies,
  }: {
    body?: ArrayBuffer | string;
    headers: Record<string, unknown>;
    method: string;
    onUploadProgress: (progress: { loaded: number; total: number }) => void;
    resolvedUrl: string;
    redirect?: RequestRedirect;
    signal: AbortSignal;
    useSessionCookies?: boolean;
  }): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request = this.options.applicationNetwork.request({
        method,
        url: resolvedUrl,
        redirect,
        headers,
        useSessionCookies,
      });
      let lastLoaded = -1;
      const poll = () => {
        const progress = request.getUploadProgress();
        if (progress.started && progress.current !== lastLoaded) {
          lastLoaded = progress.current;
          onUploadProgress({ loaded: progress.current, total: progress.total });
        }
      };
      const progressTimer = setInterval(poll, 50);
      const stopPolling = () => clearInterval(progressTimer);
      const cleanup = () => {
        stopPolling();
        signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        cleanup();
        request.abort();
        reject(new DOMException("The operation was aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
        return;
      }
      request.on("error", (error) => {
        cleanup();
        reject(error);
      });
      request.on("response", (incoming: { statusCode: number; statusMessage: string; headers: Record<string, string | string[]>; on(event: string, cb: (chunk?: unknown) => void): void }) => {
        poll();
        stopPolling();
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk) => {
          chunks.push(chunk as Buffer);
        });
        incoming.on("error", (error) => {
          cleanup();
          reject(error);
        });
        incoming.on("end", () => {
          cleanup();
          const buffer = Buffer.concat(chunks);
          const headers = new Headers();
          for (const [name, value] of Object.entries(incoming.headers))
            for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item);
          resolve(
            new Response(buffer.length === 0 ? null : buffer, {
              status: incoming.statusCode,
              statusText: incoming.statusMessage,
              headers,
            }),
          );
        });
      });
      const payload = body instanceof ArrayBuffer ? Buffer.from(body) : body;
      request.end(payload);
    });
  }

  logFetchTiming({
    bodyBytes,
    metrics,
    requestId,
    responseType,
    status,
    target,
    totalMs,
  }: {
    bodyBytes: number;
    metrics: FetchMetrics | null;
    requestId: string;
    responseType: string;
    status: number;
    target: string;
    totalMs: number;
  }) {
    fetchWrapperLogger().debug("Fetch timing", {
      safe: {
        requestId,
        target,
        responseType,
        status,
        totalMs,
        bodyBytes,
        attachAuth: metrics?.attachAuth ?? false,
        attachDesktopSurface: metrics?.attachDesktopSurface ?? false,
        attachDeviceCheckToken: metrics?.attachDeviceCheckToken ?? false,
        attachIntegrityState: metrics?.attachIntegrityState ?? false,
        hasToken: metrics?.hasToken ?? false,
        retriedAfter401: metrics?.retriedAfter401 ?? false,
        tokenSource: metrics?.tokenSource ?? "unknown",
        authMs: metrics?.timings.authMs,
        fetchMs: metrics?.timings.fetchMs,
        retryAuthMs: metrics?.timings.retryAuthMs,
        retryFetchMs: metrics?.timings.retryFetchMs,
        bodyReadMs: metrics?.timings.bodyReadMs,
      },
      sensitive: {},
    });
  }

  prepareFetchInit(request: {
    body?: string | ArrayBuffer | Uint8Array;
    headers?: Record<string, unknown>;
    type?: string;
    requestId?: string;
    url?: string;
    method?: string;
  }) {
    const headers = { ...request.headers };
    const body = request.body;
    if (typeof body == "string" && !this.hasHeader(headers, "Content-Type")) {
      const trimmed = body.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          JSON.parse(body);
          this.setHeader(headers, "Content-Type", "application/json");
        } catch {}
      }
    }
    return { headers, body };
  }

  ensureAbsoluteUrl(url: string): string {
    return /^https?:\/\//i.test(url) || url.startsWith("data:")
      ? url
      : resolveBackendApiUrl(this.options, url);
  }

  cloneHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(headers)) copy[name] = value;
    return copy;
  }

  findHeaderKey(headers: Record<string, unknown>, name: string): string | undefined {
    const lowered = name.toLowerCase();
    return Object.keys(headers).find((key) => key.toLowerCase() === lowered);
  }

  hasHeader(headers: Record<string, unknown>, name: string): boolean {
    return this.findHeaderKey(headers, name) != null;
  }

  setHeader(headers: Record<string, unknown>, name: string, value: unknown) {
    this.deleteHeader(headers, name);
    headers[name] = value;
  }

  deleteHeader(headers: Record<string, unknown>, name: string) {
    for (const key of Object.keys(headers)) key.toLowerCase() === name.toLowerCase() && delete headers[key];
  }

  /** 插件服务预览 cookie 的注入点（原为空实现，保留）。 */
  async maybeApplyPluginServicePreviewCookie(_headers: Record<string, unknown>, _url: string, _state: AuthState): Promise<void> {}

  /** wham/estuary 路径推断需要认证（原 `shouldInferCodexApiAuth`）。 */
  shouldInferCodexApiAuth(url: string): boolean {
    if (!this.isDesktopAuthAllowedUrl(url)) return false;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return (
      pathname === "/wham" ||
      pathname.startsWith("/wham/") ||
      pathname === "/api/wham" ||
      pathname.startsWith("/api/wham/") ||
      pathname === "/backend-api/wham" ||
      pathname.startsWith("/backend-api/wham/") ||
      pathname === "/backend-api/estuary/content" ||
      pathname.startsWith("/backend-api/estuary/content/")
    );
  }

  isWorkspaceBackendUrl(url: string): boolean {
    const parsed = URL.parse(url);
    const backendOrigin = new URL(resolveBackendApiUrl(this.options, ""));
    return (
      parsed != null &&
      parsed.origin === backendOrigin.origin &&
      (parsed.pathname.startsWith(backendOrigin.pathname) || parsed.pathname.startsWith("/public-api/"))
    );
  }

  /** 受限认证（原 `shouldUseRestrictedFetchAuth`）：当前发布版恒 false。 */
  shouldUseRestrictedFetchAuth(_url: string): boolean {
    try {
      new URL(_url);
    } catch {
      return false;
    }
    return false;
  }

  /** 允许附加桌面认证的 URL 域（原 `isDesktopAuthAllowedUrl`）。 */
  isDesktopAuthAllowedUrl(url: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.host.toLowerCase();
    resolveBackendApiUrl(this.options, "");
    return (
      host === "localhost" ||
      host === "localhost:8000" ||
      (host !== "status.openai.com" &&
        !!(
          host === "openai.com" ||
          host.endsWith(".openai.com") ||
          host === "chatgpt.com" ||
          (host.endsWith(".chatgpt.com") && !host.startsWith("ab."))
        ))
    );
  }

  isVsCodeFetchRequest(url: string): boolean {
    return url.startsWith(VSCODE_REQUEST_PREFIX);
  }

  /** vscode://codex/ 协议请求桥（原 `handleVsCodeFetchRequest`）。 */
  async handleVsCodeFetchRequest(view: unknown, request: { url: string; requestId: string; body?: string; headers?: Record<string, unknown>; responsePriority?: string }, signal: AbortSignal): Promise<void> {
    const path = request.url.slice(15);
    try {
      const result = await this.fetchHandler.handleVSCodeRequest(
        view,
        path,
        request.body ? JSON.parse(request.body) : undefined,
        isGitSource(request.headers?.["x-codex-git-source"]) ? (request.headers[GIT_SOURCE_HEADER_KEY] as string) : null,
        signal,
      );
      const message = {
        type: "fetch-response",
        responseType: "success",
        requestId: request.requestId,
        status: 200,
        headers: { "content-type": "application/json" },
        bodyJsonString: JSON.stringify(result ?? null),
      };
      if (request.responsePriority === "critical") this.options.chunkedMessageSender.sendCritical(view, MESSAGE_FOR_VIEW, message);
      else this.options.chunkedMessageSender.send(view, MESSAGE_FOR_VIEW, message);
    } catch (error) {
      const errorCode = extractErrorCode(error);
      const message = {
        type: "fetch-response",
        responseType: "error",
        requestId: request.requestId,
        status: 432,
        error: error instanceof Error ? error.message : "VS Code bridge request failed",
        errorCode,
      };
      if (request.responsePriority === "critical") this.options.chunkedMessageSender.sendCritical(view, MESSAGE_FOR_VIEW, message);
      else this.options.chunkedMessageSender.sendInlineMessageForView(view, message);
    }
  }

  /** 听写流连接信息（原 `handleDictationStreamConnectInfoRequest`）。 */
  async handleDictationStreamConnectInfoRequest(view: unknown, request: { requestId: string }): Promise<void> {
    try {
      const backendAuth = await this.getAppServerConnection(LOCAL_HOST_ID).getBackendRequestAuth({ refreshToken: false });
      if (backendAuth == null) throw new Error("Sign in to ChatGPT to use dictation.");
      if (backendAuth.routing.kind === "workspace") throw new Error("Use HTTP transcription for this workspace.");
      backendAuth.signal.throwIfAborted();
      this.options.chunkedMessageSender.sendInlineMessageForView(view, {
        type: "fetch-response",
        responseType: "success",
        requestId: request.requestId,
        status: 200,
        headers: { "content-type": "application/json" },
        bodyJsonString: JSON.stringify({
          websocketUrl: this.getDictationStreamWebsocketUrl(),
          protocols: [DICTATION_WEBSOCKET_PROTOCOL, `${DICTATION_BEARER_PREFIX}${backendAuth.token}`, DICTATION_CLIENT_PROTOCOL],
        }),
      });
    } catch (error) {
      this.options.chunkedMessageSender.sendInlineMessageForView(view, {
        type: "fetch-response",
        responseType: "error",
        requestId: request.requestId,
        status: 432,
        error: error instanceof Error ? error.message : "Failed to prepare dictation stream connection.",
      });
    }
  }

  getDictationStreamWebsocketUrl(): string {
    const url = new URL(resolveBackendApiUrl(this.options, "/dictation/stream"));
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }
}

// ---------------------------------------------------------------------------
// 工具（原 `gT`/`QTe`/`_T`）
// ---------------------------------------------------------------------------

function elapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function headersToRecord(response: Response): Record<string, string> {
  const record: Record<string, string> = {};
  response.headers.forEach((value, name) => {
    record[name] = value;
  });
  return record;
}

function extractErrorCode(error: unknown): string | undefined {
  if (typeof error == "object" && error && "errorCode" in error && typeof (error as { errorCode: unknown }).errorCode == "string")
    return (error as { errorCode: string }).errorCode;
}

// lodash get interop（原 `Zfe = e.a(n.jo())`，shared chunk 内 vendored lodash）。
import { jo as lodashGetModule } from "@chunk/shared";
const lodashGet = (lodashGetModule() as { default: (obj: unknown, path: string) => unknown }).default;

// ---------------------------------------------------------------------------
// 服务桥（原 `tEe`/`nEe`/`rEe`，63,332-63,383）
// ---------------------------------------------------------------------------

/** 一次性退订句柄（原 `tEe`）。 */
class UnsubscribeHandle extends EventEmitterBase {
  cleanup: (() => void) | null;
  constructor(cleanup: () => void) {
    super();
    this.cleanup = cleanup;
  }
  unsubscribe() {
    const cleanup = this.cleanup;
    this.cleanup = null;
    cleanup?.();
  }
  [Symbol.dispose]() {
    this.unsubscribe();
  }
}

/** composer items 桥（原 `nEe`）。 */
class ComposerItemsBridge extends EventEmitterBase {
  appServerConnectionRegistry: { getConnection(hostId: string): never };
  constructor(appServerConnectionRegistry: { getConnection(hostId: string): never }) {
    super();
    this.appServerConnectionRegistry = appServerConnectionRegistry;
  }
  async getGenerationStatuses() {
    return getGenerationStatuses();
  }
  async getChatGptComposerItems({ entrypoint, hostId }: { entrypoint: unknown; hostId: string }) {
    return getChatGptComposerItems(this.appServerConnectionRegistry.getConnection(hostId), entrypoint);
  }
  async recordChatGptComposerItemInteraction({
    entrypoint,
    hostId,
    interactionType,
    item,
  }: {
    entrypoint: unknown;
    hostId: string;
    interactionType: unknown;
    item: unknown;
  }) {
    return recordComposerItemInteraction(this.appServerConnectionRegistry.getConnection(hostId), item, interactionType, entrypoint);
  }
  async hasAccessibleAndEnabledApp({ hostId }: { hostId: string }) {
    return (await getAccessibleApps(this.appServerConnectionRegistry.getConnection(hostId))).some(isEnabledApp as never);
  }
}

/** 主窗口 appActions 桥（原 `rEe`）。 */
class PrimaryWindowActionsBridge extends EventEmitterBase {
  windowManager: { getPrimaryWindows(): { isFocused(): boolean }[]; getPrimaryWindow(): { webContents: { id: number } } | null };
  appViewsByWebContentsId: Map<number, { services: Promise<{ appActions: { enqueueForThread(x: unknown): Promise<void>; run(x: unknown): Promise<unknown> } }> }>;
  constructor(
    windowManager: { getPrimaryWindows(): { isFocused(): boolean }[]; getPrimaryWindow(): { webContents: { id: number } } | null },
    appViewsByWebContentsId: Map<number, { services: Promise<{ appActions: { enqueueForThread(x: unknown): Promise<void>; run(x: unknown): Promise<unknown> } }> }>,
  ) {
    super();
    this.windowManager = windowManager;
    this.appViewsByWebContentsId = appViewsByWebContentsId;
  }
  isPrimaryWindowFocused() {
    return this.windowManager.getPrimaryWindows().some((window) => window.isFocused());
  }
  async enqueueForThreadInPrimaryWindow(thread: unknown) {
    const services = await (await this.getPrimaryAppView()).services;
    await services.appActions.enqueueForThread(thread);
  }
  async runInPrimaryWindow(command: unknown) {
    const services = await (await this.getPrimaryAppView()).services;
    return services.appActions.run(command);
  }
  getPrimaryAppView() {
    const window = this.windowManager.getPrimaryWindow();
    if (window == null) throw new Error("No primary app window is available");
    const view = this.appViewsByWebContentsId.get(window.webContents.id);
    if (view == null) throw new Error("The primary app window is not ready");
    return view;
  }
}

// ---------------------------------------------------------------------------
// browser-auth 提交（原 `iEe`，63,391-63,404）
// 与 bootstrap state/browser-auth-operations 是同一持久化键（a.I）的两端：
// bootstrap 侧记账（renderer 表单填充遥测），这里提交（browser sign-in recovery）。
// ---------------------------------------------------------------------------

function createBrowserAuthOperations(
  globalState: { updateAndPersist(key: unknown, fn: (value: unknown) => unknown): Promise<void> },
) {
  return new BrowserAuthOperationsStore(async (update) => {
    let committed: unknown;
    await globalState.updateAndPersist(BROWSER_AUTH_OPERATIONS_KEY, (value) => {
      const result = update(value);
      committed = result;
      return result.value;
    });
    if (committed == null) throw new Error("Browser sign-in recovery was not committed");
    return (committed as { result: unknown }).result;
  });
}

export {
  requestProfileSchema,
  workspaceSettingsSchema,
  chatgptRequestProfileSchema,
  publishChatGptProfileSchema,
  readAccountInfoFromToken,
  ApiFetchError,
  AuthenticatedDesktopFetchError,
  FileDownloadError,
  resolveAuthState,
  loadAuthToken,
  attachAuthToHeaders,
  shouldRetryAfter401,
  isValidIntegrityState,
  readResponseUpdate,
  isExpectedIntegrityTransition,
  IntegrityStateStore,
  redactUrl,
  formatFetchTarget,
  isCheckpointCdnEligiblePath,
  DesktopFetchService,
  UnsubscribeHandle,
  ComposerItemsBridge,
  PrimaryWindowActionsBridge,
  createBrowserAuthOperations,
  type AccountInfo,
  type DesktopFetchOptions,
  type HostFetchHandler,
  type FetchMetrics,
};
