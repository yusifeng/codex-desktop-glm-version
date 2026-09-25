// first-party plugin 认证 ChatGPT webview：partition 加固 + 认证 handoff +
// 导航白名单锁 + cookies 清理。
//
// 对应 main-C-Mhak1n.ts 99,777-100,157：
//   - $He~yW/tUe/nUe/rUe/iUe：auth 路径常量 + planType/accounts-check schema
//   - bW/xW/SW/aUe/CW/oUe/sUe/wW/TW/cUe：认证 handoff（清 _account* cookies →
//     link-session（页面内 fetch 或 POST extraHeaders）→ 写路由 cookies；
//     accounts-check v4 查询 residency/fedramp；planType 轮询；JWT exp 解析）
//   - lUe：will-attach-webview 钩子工厂（partition 前缀匹配 → 强制 sandbox/
//     contextIsolation 等加固 + 独立 session）
//   - uUe：webContents 装配（导航白名单锁（chatgpt.com origin + about:）+
//     setWindowOpenHandler deny + destroyed 时清 cookies（OW promise 链）+
//     about:blank?toUrl=&accountId= bootstrap 解析 dUe）
//   - MW：origin 守卫
//
// 消费者：R12（173,316）。
// 模块加载期副作用：仅 logger 与常量。

import { Buffer } from "node:buffer";
import { session as electronSession } from "electron";
import {
  wf as objectSchema,
  Of as stringSchema,
  gf as booleanSchema,
  Ef as recordSchema,
  vi as parseJwtClaims,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";

const logger = memoizedTaggedLogger("first-party-plugin-authenticated-chatgpt-webview");

// ---------------------------------------------------------------------------
// 常量与 schema
// ---------------------------------------------------------------------------

const CHATGPT_CODEX_URL = "https://chatgpt.com/codex";
const LINK_SESSION_PATH = "/api/auth/link-session";
const SESSION_PATH = "/api/auth/session";
const ACCOUNTS_CHECK_PATH = "/backend-api/accounts/check/v4-2023-04-27";
const ADMIN_PATH = "/admin";
const ACCOUNT_COOKIE = "_account";
const RESIDENCY_COOKIE = "_account_residency_region";
const FEDRAMP_COOKIE = "_account_is_fedramp";
const ROUTING_OVERRIDE_COOKIE = "_account_routing_override";
const ACCOUNTS_CHECK_TIMEOUT_MS = 1e4;
const TOKEN_NEAR_EXPIRY_MS = 3e5;
const PARTITION_PREFIX = "codex-first-party-plugin-authenticated-chatgpt-";

const planTypeSchema = objectSchema({ account: objectSchema({ planType: stringSchema() }) });
const accountsCheckSchema = objectSchema({
  accounts: recordSchema(
    stringSchema(),
    objectSchema({
      account: objectSchema({
        account_id: stringSchema().nullable().optional(),
        account_residency_region: stringSchema().nullable().optional(),
        is_fedramp_compliant_workspace: booleanSchema().optional(),
      }),
      can_access_with_session: booleanSchema().optional(),
    }),
  ),
});

/** ChatGPT origin（原 `bW`/`kW`）。 */
function chatgptOrigin(): string {
  return new URL(CHATGPT_CODEX_URL).origin;
}

// ---------------------------------------------------------------------------
// JWT 工具（原 `oUe`/`wW`/`TW`）
// ---------------------------------------------------------------------------

/** auth token 提供器。 */
export type AuthTokenProvider = (request: { refreshToken: boolean }) => Promise<string | null>;

/** JWT exp（原 `TW`）：毫秒时间戳；无 exp/解析失败 → null。 */
function tokenExpiryMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (payload == null) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof claims != "object" || !claims || !("exp" in claims)
      ? null
      : typeof claims.exp == "number"
        ? claims.exp * 1e3
        : null;
  } catch {
    return null;
  }
}

/** token 缺失/过期/临期（原 `wW`，5 分钟内视为临期）。 */
function isTokenUnusable(token: string | null): boolean {
  const expiry = tokenExpiryMs(token ?? "");
  return expiry == null || expiry <= Date.now() + TOKEN_NEAR_EXPIRY_MS;
}

/** 获取可用 token（原 `oUe`）：先不刷新，失败/临期再刷新。 */
async function requireUsableAuthToken(getAuthToken: AuthTokenProvider): Promise<string> {
  if (getAuthToken == null) throw new Error("Missing ChatGPT webview auth token provider");
  let token = await getAuthToken({ refreshToken: false });
  if (token == null || isTokenUnusable(token)) token = await getAuthToken({ refreshToken: true });
  if (token == null || isTokenUnusable(token)) throw new Error("Missing, expired, or near-expiry Codex access token");
  return token;
}

// ---------------------------------------------------------------------------
// 认证 handoff（原 `xW`/`SW`/`aUe`/`CW`/`sUe`）
// ---------------------------------------------------------------------------

/** session 面（结构化子集）。 */
export interface AuthSessionLike {
  cookies: {
    remove(url: string, name: string): Promise<unknown>;
    set(details: { name: string; path: string; sameSite: string; secure: boolean; url: string; value: string }): Promise<void>;
  };
  fetch(url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }): Promise<Response>;
}

/** webContents 面（结构化子集）。 */
export interface AuthWebContentsLike {
  isDestroyed(): boolean;
  getURL(): string;
  loadURL(url: string, options?: { extraHeaders?: string; postData?: Array<{ bytes: Buffer; type: string }> }): Promise<void>;
  executeJavaScript(code: string, userGesture?: boolean): Promise<unknown>;
}

/** 写路由 cookie（原 `SW`）。 */
async function setSessionCookie(session: AuthSessionLike, name: string, value: string): Promise<void> {
  await session.cookies.set({ name, path: "/", sameSite: "lax", secure: true, url: chatgptOrigin(), value });
}

/** accounts-check v4 查询（原 `aUe`）：residency/fedramp 路由元数据。 */
async function fetchAccountRoutingMetadata(session: AuthSessionLike, token: string, accountId: string, isFedramp: boolean): Promise<{ isFedramp: boolean | undefined; residencyRegion: string | null } | null> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "ChatGPT-Account-Id": accountId };
    if (isFedramp) headers["X-OpenAI-Fedramp"] = "true";
    const response = await session.fetch(new URL(ACCOUNTS_CHECK_PATH, chatgptOrigin()).toString(), {
      headers,
      signal: AbortSignal.timeout(ACCOUNTS_CHECK_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const parsed = (accountsCheckSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { accounts: Record<string, { account?: { account_id?: string | null; account_residency_region?: string | null; is_fedramp_compliant_workspace?: boolean }; can_access_with_session?: boolean }> } } }).safeParse(await response.json());
    const entry = parsed.success ? parsed.data!.accounts[accountId] : null;
    const account = entry?.account;
    return account?.account_id !== accountId ||
      account.account_residency_region == null ||
      entry?.can_access_with_session === false
      ? null
      : { isFedramp: account.is_fedramp_compliant_workspace, residencyRegion: account.account_residency_region };
  } catch {
    return null;
  }
}

/** planType 轮询（原 `CW`）：/api/auth/session?refresh_account=true。 */
export async function pollSessionPlanType(session: AuthSessionLike): Promise<string | null> {
  const endpoint = new URL(SESSION_PATH, chatgptOrigin());
  endpoint.searchParams.set("refresh_account", "true");
  const response = await session.fetch(endpoint.toString());
  if (!response.ok) return null;
  const parsed = (planTypeSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { account: { planType: string } } } }).safeParse(await response.json());
  return parsed.success ? parsed.data!.account.planType : null;
}

/**
 * 认证 handoff（原 `xW`）：
 * 清 _account* cookies → link-session → 写路由 cookies（accountId/residency/
 * fedramp/override）→ loadURL。
 * accountId 与 token claims 不匹配（含 fedramp/admin 场景）抛错。
 */
export async function authenticateChatGptWebview({
  accountId,
  getAuthToken,
  linkSessionInPage = false,
  loadTarget = true,
  session,
  targetUrl,
  webContents,
  workspaceRoutingOverride,
}: {
  accountId: string | null;
  getAuthToken: AuthTokenProvider;
  linkSessionInPage?: boolean;
  loadTarget?: boolean;
  session: AuthSessionLike;
  targetUrl: string;
  webContents: AuthWebContentsLike;
  workspaceRoutingOverride?: string | null;
}): Promise<void> {
  if (!isChatGptOrigin(targetUrl)) throw new Error("Authenticated ChatGPT webview target must be ChatGPT");
  if (webContents.isDestroyed()) return;
  const targetPath = new URL(targetUrl, chatgptOrigin()).pathname;
  const isAdminTarget = targetPath === ADMIN_PATH || targetPath.startsWith(`${ADMIN_PATH}/`);
  const token = await requireUsableAuthToken(getAuthToken);
  const claims = parseJwtClaims(token) as { accountId?: string; isFedramp?: boolean } | null;
  const tokenAccountId = claims?.accountId;
  const tokenIsFedramp = claims?.isFedramp === true;
  if (accountId != null && (accountId !== "personal" || tokenIsFedramp || isAdminTarget) && tokenAccountId !== accountId && (tokenAccountId != null || tokenIsFedramp))
    throw new Error("ChatGPT webview account does not match access token");
  if (isAdminTarget && accountId == null) throw new Error("Missing workspace settings account ID");
  const tokenMatchesAccount = tokenAccountId === accountId ? claims?.isFedramp : undefined;
  await Promise.all([
    session.cookies.remove(chatgptOrigin(), ACCOUNT_COOKIE),
    session.cookies.remove(chatgptOrigin(), RESIDENCY_COOKIE),
    session.cookies.remove(chatgptOrigin(), FEDRAMP_COOKIE),
    session.cookies.remove(chatgptOrigin(), ROUTING_OVERRIDE_COOKIE),
  ]);
  const routingMetadata = accountId == null || !isAdminTarget ? null : fetchAccountRoutingMetadata(session, token, accountId, tokenMatchesAccount === true);
  await linkSession(webContents, token, linkSessionInPage, tokenIsFedramp);
  if (accountId != null) {
    const metadata = await routingMetadata;
    const isFedramp = isAdminTarget || tokenMatchesAccount === true ? (metadata?.isFedramp ?? tokenMatchesAccount) : undefined;
    if (isAdminTarget && (metadata == null || isFedramp == null)) throw new Error("Missing workspace settings routing metadata");
    await Promise.all([
      setSessionCookie(session, ACCOUNT_COOKIE, accountId),
      ...(metadata?.residencyRegion == null ? [] : [setSessionCookie(session, RESIDENCY_COOKIE, metadata.residencyRegion)]),
      ...(isFedramp == null ? [] : [setSessionCookie(session, FEDRAMP_COOKIE, String(isFedramp))]),
      ...(!isAdminTarget || workspaceRoutingOverride == null ? [] : [setSessionCookie(session, ROUTING_OVERRIDE_COOKIE, workspaceRoutingOverride)]),
    ]);
  } else if (tokenIsFedramp) {
    await setSessionCookie(session, FEDRAMP_COOKIE, "true");
  }
  if (!webContents.isDestroyed() && loadTarget) await webContents.loadURL(targetUrl);
}

/**
 * link-session（原 `sUe`）：
 * 页面内 fetch（credentials: include）或 POST extraHeaders 双路径；
 * fedramp 时附加 X-OpenAI-Fedramp。
 */
async function linkSession(webContents: AuthWebContentsLike, token: string, inPage: boolean, isFedramp: boolean): Promise<void> {
  const expiryMs = tokenExpiryMs(token);
  if (expiryMs == null || expiryMs <= Date.now()) throw new Error("Missing or expired Codex access token");
  const expiresIn = Math.max(1, Math.floor((expiryMs - Date.now()) / 1e3));
  const linkSessionUrl = new URL(LINK_SESSION_PATH, chatgptOrigin()).toString();
  const sessionUrl = new URL(SESSION_PATH, chatgptOrigin()).toString();
  if (isFedramp) await webContents.loadURL(sessionUrl, { extraHeaders: "X-OpenAI-Fedramp: true" });
  else await webContents.loadURL(sessionUrl);
  if (inPage) {
    const linked = await webContents.executeJavaScript(
      `fetch(${JSON.stringify(linkSessionUrl)}, {
        method: "POST",
        credentials: "include",
        headers: ${JSON.stringify({ "Content-Type": "application/json", "x-i-am-a-browser": "true", "X-OpenAI-Fedramp": isFedramp ? "true" : undefined })},
        body: ${JSON.stringify(JSON.stringify({ auth_token: token, expires_in: expiresIn }))},
      }).then((response) => response.ok)`,
      true,
    );
    if (linked !== true) throw new Error("Failed to link ChatGPT webview session");
    return;
  }
  await webContents.loadURL(linkSessionUrl, {
    extraHeaders: [
      "Content-Type: application/json",
      "x-i-am-a-browser: true",
      ...(isFedramp ? ["X-OpenAI-Fedramp: true"] : []),
    ].join("\n"),
    postData: [{ bytes: Buffer.from(JSON.stringify({ auth_token: token, expires_in: expiresIn })), type: "rawData" }],
  });
}

/** origin 守卫（原 `cUe`）。 */
function isChatGptOrigin(url: string): boolean {
  try {
    return new URL(url).origin === chatgptOrigin();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// will-attach-webview 钩子工厂（原 `lUe`）
// ---------------------------------------------------------------------------

/** owner webContents 面（结构化子集）。 */
export interface OwnerWebContentsLike {
  on(event: string, listener: (...args: never[]) => void): void;
  removeListener(event: string, listener: (...args: never[]) => void): void;
}

/** will-attach 参数（Electron 结构）。 */
interface WillAttachDetails {
  partition?: string;
  disablewebsecurity?: string;
  webpreferences?: string;
  allowpopups?: string;
  src?: string;
}

/**
 * webview attach 钩子工厂（原 `lUe`）：
 * partition 前缀匹配时强制加固（sandbox/contextIsolation/webSecurity、剥
 * preload/webpreferences、禁弹窗）+ 独立 session；did-attach 后按队列装配。
 */
export function createFirstPartyWebviewAttachHook({ getAuthToken, owner }: { getAuthToken: AuthTokenProvider; owner: OwnerWebContentsLike }): () => void {
  const pendingBootstrapUrls: string[] = [];
  const authenticatedSessions = new WeakSet<object>();
  const onWillAttach = (details: { session?: unknown }, preferences: Record<string, unknown>, params: WillAttachDetails) => {
    if (params.partition?.startsWith(PARTITION_PREFIX) !== true) return;
    const session = electronSession.fromPartition(params.partition);
    authenticatedSessions.add(session);
    (details as { session?: unknown }).session = session;
    delete preferences.preload;
    delete params.disablewebsecurity;
    delete params.webpreferences;
    params.allowpopups = "";
    Object.assign(preferences, {
      sandbox: true,
      devTools: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      plugins: false,
      disablePopups: false,
    });
    pendingBootstrapUrls.push(params.src ?? "");
  };
  const onDidAttach = (_event: unknown, webContents: { getURL(): string; session: object }) => {
    if (pendingBootstrapUrls.length === 0 || !authenticatedSessions.has(webContents.session)) return;
    const bootstrapUrl = pendingBootstrapUrls.shift();
    if (bootstrapUrl != null) {
      mountAuthenticatedChatGptWebview({ bootstrapUrl: bootstrapUrl || webContents.getURL(), getAuthToken, webContents: webContents as never });
    }
  };
  const dispose = () => {
    owner.removeListener("will-attach-webview", onWillAttach as never);
    owner.removeListener("did-attach-webview", onDidAttach as never);
    owner.removeListener("destroyed", dispose as never);
  };
  owner.on("will-attach-webview", onWillAttach as never);
  owner.on("did-attach-webview", onDidAttach as never);
  owner.on("destroyed", dispose as never);
  return dispose;
}

// ---------------------------------------------------------------------------
// webContents 装配（原 `uUe`/`dUe`/`MW`）
// ---------------------------------------------------------------------------

const cookieClearTails = new WeakMap<object, Promise<void>>();

/** about: 守卫（原 `MW`）：about: 协议或 ChatGPT origin。 */
function isAllowedNavigationTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "about:" || parsed.origin === chatgptOrigin();
  } catch {
    return false;
  }
}

/** bootstrap URL 解析（原 `dUe`）：about:blank?toUrl=&accountId=。 */
function parseBootstrapTarget(bootstrapUrl: string): { accountId: string; url: string } | null {
  try {
    const parsed = new URL(bootstrapUrl);
    const toUrl = parsed.searchParams.get("toUrl");
    const accountId = parsed.searchParams.get("accountId");
    if (parsed.protocol !== "about:" || parsed.pathname !== "blank" || toUrl == null || accountId == null) return null;
    const target = new URL(toUrl, chatgptOrigin());
    return target.origin === chatgptOrigin() ? { accountId, url: target.toString() } : null;
  } catch {
    return null;
  }
}

/**
 * 认证 webContents 装配（原 `uUe`）：
 * 导航白名单锁（will-navigate/will-redirect/will-frame-navigate/did-navigate
 * 全套 preventDefault + 回退 loadURL）；setWindowOpenHandler deny（白名单内
 * 改为内部 loadURL）；destroyed 时清 cookies（promise 链串行化）。
 */
export function mountAuthenticatedChatGptWebview({ bootstrapUrl, getAuthToken, webContents }: { bootstrapUrl: string; getAuthToken: AuthTokenProvider; webContents: AuthWebContentsLike & { on(event: string, listener: (...args: never[]) => void): void; removeListener(event: string, listener: (...args: never[]) => void): void; setWindowOpenHandler(handler: (details: { url: string }) => { action: "deny" }): void; session: AuthSessionLike & { clearStorageData(options: { storages: string[] }): Promise<void> } } }): void {
  const session = webContents.session;
  let lastAllowedUrl = webContents.getURL();
  const reportBlocked = (kind: string, url: string) => {
    logger().warning("Blocked external navigation from first-party plugin authenticated ChatGPT webview", {
      safe: { kind },
      sensitive: { url },
    });
  };
  const guardNavigation = (event: { isMainFrame?: boolean; preventDefault(): void }, url: string) => {
    if ((event as { isMainFrame?: boolean }).isMainFrame === true && !isAllowedNavigationTarget(url)) {
      event.preventDefault();
      reportBlocked("main-frame", url);
    }
  };
  const onWillFrameNavigate = (event: { isMainFrame?: boolean; preventDefault(): void; url: string }) => guardNavigation(event, event.url);
  const onWillNavigate = (event: { isMainFrame?: boolean; preventDefault(): void; url: string }, targetUrl?: string) => guardNavigation(event, event.url ?? (targetUrl as string));
  const onWillRedirect = (event: { isMainFrame?: boolean; preventDefault(): void; url: string }, targetUrl?: string) => guardNavigation(event, event.url ?? (targetUrl as string));
  const onDidNavigate = (event: unknown, url: string) => onCommittedNavigation(url);
  const onDidNavigateInPage = (event: unknown, url: string, isMainFrame: boolean) => {
    if (isMainFrame) onCommittedNavigation(url);
  };
  const onCommittedNavigation = (url: string) => {
    if (isAllowedNavigationTarget(url)) {
      lastAllowedUrl = url;
      return;
    }
    reportBlocked("committed", url);
    if (isAllowedNavigationTarget(lastAllowedUrl)) {
      (webContents as unknown as { loadURL(url: string): Promise<void> }).loadURL(lastAllowedUrl).catch((error) => {
        logger().warning("Failed to restore first-party plugin authenticated ChatGPT webview", {
          safe: {},
          sensitive: { error },
        });
      });
    }
  };
  const onDestroyed = () => {
    webContents.removeListener("will-frame-navigate", onWillFrameNavigate as never);
    webContents.removeListener("will-navigate", onWillNavigate as never);
    webContents.removeListener("will-redirect", onWillRedirect as never);
    webContents.removeListener("did-navigate", onDidNavigate as never);
    webContents.removeListener("did-navigate-in-page", onDidNavigateInPage as never);
    webContents.removeListener("destroyed", onDestroyed as never);
    const clear = (cookieClearTails.get(session) ?? Promise.resolve()).then(() =>
      session.clearStorageData({ storages: ["cookies"] }),
    );
    const tail = clear.catch(() => undefined);
    cookieClearTails.set(session, tail);
    clear
      .catch((error) => {
        logger().warning("Failed to clear first-party plugin authenticated ChatGPT cookies", {
          safe: {},
          sensitive: { error },
        });
      })
      .then(() => {
        if (cookieClearTails.get(session) === tail) cookieClearTails.delete(session);
      });
  };
  webContents.on("will-frame-navigate", onWillFrameNavigate as never);
  webContents.on("will-navigate", onWillNavigate as never);
  webContents.on("will-redirect", onWillRedirect as never);
  webContents.on("did-navigate", onDidNavigate as never);
  webContents.on("did-navigate-in-page", onDidNavigateInPage as never);
  webContents.on("destroyed", onDestroyed as never);
  webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigationTarget(url)) {
      (webContents as unknown as { loadURL(url: string): Promise<void> }).loadURL(url).catch((error) => {
        logger().warning("Failed to navigate first-party plugin authenticated ChatGPT webview", {
          safe: {},
          sensitive: { error },
        });
      });
    } else {
      reportBlocked("new-window", url);
    }
    return { action: "deny" };
  });
  const bootstrap = parseBootstrapTarget(bootstrapUrl);
  if (bootstrap == null) {
    logger().warning("Invalid first-party plugin authenticated ChatGPT bootstrap target", {
      safe: {},
      sensitive: {},
    });
    return;
  }
  const handoff = (cookieClearTails.get(session) ?? Promise.resolve()).then(async () => {
    if (webContents.isDestroyed()) return;
    await session.clearStorageData({ storages: ["cookies"] });
    if (!webContents.isDestroyed()) {
      await authenticateChatGptWebview({
        accountId: bootstrap.accountId,
        getAuthToken,
        linkSessionInPage: true,
        session,
        targetUrl: bootstrap.url,
        webContents,
      });
    }
  });
  cookieClearTails.set(session, handoff.catch(() => undefined));
  handoff.catch((error) => {
    logger().warning("Failed to load first-party plugin authenticated ChatGPT handoff", {
      safe: {},
      sensitive: { error },
    });
  });
}
