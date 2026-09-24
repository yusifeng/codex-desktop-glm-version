// 后端认证请求：Bearer/Account-Id/Fedramp 请求头注入、401 刷新重试、
// workspace 路由（URL 改写 + X-OpenAI-Account-Routing-Override 头）。
//
// 对应 bootstrap-C4dRql4x.ts 19778-19885 行：
//   - `tT`（SignInRequiredError）、`iT`（getAuthHeaders）、`aT`（authedFetch）
//   - `oT`（applyWorkspaceRouting）、`sT`（assertSameAuthIdentity）
//   - `cT`（applyAuthHeaders）、`lT`（applyOriginatorHeaders）、`uT`（getAccountId）
//   - `dT/fT/pT`（头表小工具）
//
// 关键语义（必须逐字保持）：
//   - 首次请求用不刷新的 token；收到 401 时取消 body、刷新 token 重发一次。
//   - 两次请求之间如果 token 换了账号（accountId/userId 变化），以 AbortError
//     中止——「认证的 workspace 变了」。
//   - legacy routing 不改 URL；workspace routing 把请求改写到 workspace 的
//     backendOrigin，且非 NO_CONSTRAINT 时加路由头。
//   - 响应 body 经 pipeThrough(TransformStream) 复制，避免 401 重试后 body 被
//     锁定；redirect: error 禁止跟随重定向。

import { net } from "electron";
import {
  _i as parseAuthTokenIdentity,
  kc as raceWithAbortSignal,
  vi as parseAuthTokenClaims,
} from "@chunk/shared";
import { buildDesktopUserAgent, resolveAppVersion, resolveBackendApiUrl } from "./endpoints";
import type { DesktopApiOptions } from "./endpoints";

/** 触发认证后端请求的动作描述（用于错误文案，如 "connect remote control environments"）。 */
export type AuthedAction = string;

/** 需要登录才能完成请求时抛出（原 `tT`）。 */
export class SignInRequiredError extends Error {
  constructor(action: AuthedAction) {
    super(`Sign in to ChatGPT to ${action}.`);
  }
}

/** app-server 客户端上被本模块消费的面。 */
export interface AppServerAuthClient {
  /** 取后端请求认证材料（token + workspace 路由信息）；refreshToken 时刷新凭据。 */
  getBackendRequestAuth(options: { refreshToken: boolean }): Promise<BackendRequestAuth | null>;
}

/** getBackendRequestAuth 的返回形状（shared chunk 定义的认证上下文）。 */
export interface BackendRequestAuth {
  token: string;
  signal?: AbortSignal;
  routing:
    | { kind: "legacy" }
    | {
        kind: "workspace";
        workspace: { backendOrigin: string; accountRoutingOverride: string };
      };
}

/** desktop API 选项（routing 判定 + originator；见 api/endpoints）。 */
export type { DesktopApiOptions };

/**
 * 取认证请求头（原 `iT`）：拿（可选刷新的）auth token 并注入头集合。
 * 无 token 时抛普通 Error（注意：不是 SignInRequiredError）。
 */
export async function getAuthHeaders({
  action,
  appServerClient,
  desktopOriginator,
  headers = {},
  refreshToken = false,
}: {
  action: AuthedAction;
  appServerClient: { getAuthToken(options?: { refreshToken?: boolean }): Promise<string | null> };
  desktopOriginator: string;
  headers?: Record<string, string>;
  refreshToken?: boolean;
}): Promise<Record<string, string>> {
  const token = await appServerClient.getAuthToken({ refreshToken });
  if (!token) throw Error(`Sign in to ChatGPT to ${action}.`);
  const result = { ...headers };
  applyAuthHeaders(result, token, { desktopOriginator });
  return result;
}

/**
 * 认证后的后端 fetch（原 `aT`）。
 *
 * 1. 取（不刷新的）认证材料；无 → SignInRequiredError。
 * 2. 组装头（清掉旧 Authorization，校验身份一致，注入 auth + originator 头，
 *    workspace 路由改写 URL），beforeSend 钩子，redirect: error 发出。
 * 3. 401 → 取消 body、刷新认证材料，再发一次。
 * 4. 返回 body 复制过的 Response（不透传原始 body 锁）。
 */
export async function authedFetch(
  {
    action,
    appServerClient,
    desktopApiOptions,
    path,
    request = {},
    beforeSend,
  }: {
    action: AuthedAction;
    appServerClient: AppServerAuthClient;
    desktopApiOptions: DesktopApiOptions;
    path: string;
    request?: RequestInit & { headers?: Record<string, string> };
    beforeSend?(): void | Promise<void>;
  },
  fetchImpl: (input: RequestInfo, init?: RequestInit) => Promise<Response> = net.fetch.bind(net),
): Promise<Response> {
  request.signal?.throwIfAborted();

  const initialAuth = appServerClient.getBackendRequestAuth({ refreshToken: false });
  const initialAuthRaced =
    request.signal == null ? initialAuth : raceWithAbortSignal(initialAuth, request.signal);
  let auth = (await initialAuthRaced) as BackendRequestAuth | null;
  if (auth == null) throw new SignInRequiredError(action);

  const combinedSignal =
    request.signal == null ? auth.signal : AbortSignal.any([auth.signal, request.signal]);

  const performRequest = async (authContext: BackendRequestAuth): Promise<Response> => {
    const headers = Object.fromEntries(new Headers(request.headers));
    assertSameAuthIdentity(headers.authorization?.replace(/^Bearer /i, ""), authContext);
    applyAuthHeaders(headers, authContext.token, desktopApiOptions);

    const url = applyWorkspaceRouting(
      resolveBackendApiUrl(desktopApiOptions, path),
      headers,
      authContext,
    );
    await beforeSend?.();
    combinedSignal.throwIfAborted();
    const response = await fetchImpl(url, {
      ...request,
      headers,
      signal: combinedSignal,
      redirect: "error",
    });
    combinedSignal.throwIfAborted();
    return response;
  };

  let response = await performRequest(auth);

  if (response.status === 401) {
    // 刷新凭据后重试一次。
    await response.body?.cancel();
    combinedSignal.throwIfAborted();
    const refreshedAuth = await raceWithAbortSignal(
      appServerClient.getBackendRequestAuth({ refreshToken: true }),
      combinedSignal,
    );
    combinedSignal.throwIfAborted();
    if (refreshedAuth == null) throw new SignInRequiredError(action);
    auth = refreshedAuth as BackendRequestAuth;
    response = await performRequest(auth);
  }

  return new Response(
    response.body?.pipeThrough(new TransformStream(), { signal: combinedSignal }) ?? null,
    {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    },
  );
}

/**
 * workspace 路由（原 `oT`）：清掉外部带入的路由覆盖头；
 * legacy 不动 URL；workspace 改写为 `${backendOrigin}${pathname}${search}`
 * 且非 NO_CONSTRAINT 时加 `X-OpenAI-Account-Routing-Override`。
 */
export function applyWorkspaceRouting(
  url: string,
  headers: Record<string, string>,
  authContext: BackendRequestAuth,
): string {
  authContext.signal.throwIfAborted();
  for (const name of Object.keys(headers))
    if (name.toLowerCase() === "x-openai-account-routing-override") delete headers[name];
  if (authContext.routing.kind === "legacy") return url;
  const { workspace } = authContext.routing;
  if (workspace.accountRoutingOverride !== "NO_CONSTRAINT")
    headers["X-OpenAI-Account-Routing-Override"] = workspace.accountRoutingOverride;
  const parsed = new URL(url);
  return `${workspace.backendOrigin}${parsed.pathname}${parsed.search}`;
}

/**
 * 401 重试前校验认证身份一致（原 `sT`）：同一请求内 token 换了账号 → AbortError。
 */
export function assertSameAuthIdentity(previousToken: string | undefined, authContext: BackendRequestAuth): void {
  if (previousToken == null || previousToken === authContext.token) return;
  const previousIdentity = parseAuthTokenIdentity(previousToken);
  const currentIdentity = parseAuthTokenIdentity(authContext.token);
  if (
    previousIdentity == null ||
    currentIdentity == null ||
    previousIdentity.accountId !== currentIdentity.accountId ||
    previousIdentity.userId !== currentIdentity.userId
  )
    throw new DOMException("Authenticated workspace changed", "AbortError");
}

/**
 * 注入认证头（原 `cT`）：Authorization: Bearer、ChatGPT-Account-Id、
 * X-OpenAI-Fedramp（Fedramp 账号加 / 非 Fedramp 账号删），
 * includeSurfaceHeaders（默认开）时再补 originator / User-Agent。
 */
export function applyAuthHeaders(
  headers: Record<string, string>,
  token: string,
  { desktopOriginator, includeSurfaceHeaders = true }: { desktopOriginator?: string; includeSurfaceHeaders?: boolean },
): void {
  const claims = parseAuthTokenClaims(token) as { accountId?: string; isFedramp?: boolean } | null;
  setHeader(headers, "Authorization", `Bearer ${token}`);
  if (claims?.accountId) setHeader(headers, "ChatGPT-Account-Id", claims.accountId);
  if (claims?.isFedramp === true) {
    setHeader(headers, "X-OpenAI-Fedramp", "true");
  } else {
    const existing = findHeader(headers, "X-OpenAI-Fedramp");
    if (existing != null) delete headers[existing];
  }
  if (includeSurfaceHeaders) applyOriginatorHeaders(headers, { desktopOriginator });
}

/** 注入 surface 头（原 `lT`）：originator + User-Agent（已存在则保留）。 */
export function applyOriginatorHeaders(
  headers: Record<string, string>,
  { desktopOriginator }: { desktopOriginator?: string },
): void {
  if (!hasHeader(headers, "originator"))
    setHeader(headers, "originator", desktopOriginator as string);
  if (!hasHeader(headers, "User-Agent"))
    setHeader(headers, "User-Agent", buildDesktopUserAgent({ appVersion: resolveAppVersion() }));
}

/** 从 token 取 accountId（原 `uT`）。 */
export function getAccountId(token: string): string | null {
  return (parseAuthTokenClaims(token) as { accountId?: string } | null)?.accountId ?? null;
}

/** 头是否已存在（原 `dT`）。 */
function hasHeader(headers: Record<string, string>, name: string): boolean {
  return findHeader(headers, name) != null;
}

/** 覆盖式设置头（原 `fT`）。 */
function setHeader(headers: Record<string, string>, name: string, value: string): void {
  const existing = findHeader(headers, name);
  if (existing) delete headers[existing];
  headers[name] = value;
}

/** 大小写不敏感找头名（原 `pT`）。 */
function findHeader(headers: Record<string, string>, name: string): string | undefined {
  const lower = name.toLowerCase();
  return Object.keys(headers).find((key) => key.toLowerCase() === lower);
}
