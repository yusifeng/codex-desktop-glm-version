// shared chunk：deferred、abort 竞速与请求头协议（http-headers 分区，
// settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L19,233-19,247 + L19,918-19,983 区段：
//   - _C（Ac）：createDeferred——外部化 resolve/reject 的 Promise
//   - vC（kc）：raceWithAbortSignal——signal 已中止则立即拒绝
//     （吞源 promise rejection），否则挂一次性 abort 监听
//   - yC：中止原因归一（非 Error reason → AbortError）
//   - Pw（Ws）= X-Codex-Surface、Fw（Bs）= X-OpenAI-Attach-Auth、
//     Iw（Vs）= X-OpenAI-Attach-Desktop-Surface、
//     Lw = X-OpenAI-Attach-DeviceCheck-Token、
//     Hs（Rw）= X-OpenAI-Attach-Integrity-State、
//     zw = X-OpenAI-Expected-Account-Id
//   - Bw（Qs）：joinBackendApiPath——base 剥尾斜杠 + path 剥前导；
//     public-api/ 前缀在 backend-api/api 基座上重写
//   - Jw：大小写不敏感的 header key 查找；Kw：取布尔值并删除
//     （'0'/'false' 为假）；qw（Zs）：存在判定；Gw（Ys）：取值并删除
//   - Vw（Gs）/Hw（Ks）/Uw（qs）/Ww（Js）：四个布尔 header 的
//     shouldAttachAuthHeaders/wantsDesktopSurface/
//     wantsDeviceCheckToken/wantsIntegrityState
//   - Yw + Xw（Xs）：网络错误分类（net:: 前缀、NetworkError、
//     fetch TypeError 消息形态、12 个 errno code）
//
// 兼容导出：Ws/Bs/Vs/Hs/Qs/Gs/Ks/qs/Js/Ys/Zs/Xs/Ac/kc。

import { z } from "zod";

// ---------------------------------------------------------------------------
// deferred 与 abort（原 `_C`/`vC`/`yC`）
// ---------------------------------------------------------------------------

/** 外部化 Promise（原 `_C`，导出 `Ac`）。 */
export function createDeferred<T = void>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void } {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

/** 中止原因归一（原 `yC`）。 */
function abortErrorOf(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

/**
 * abort 竞速（原 `vC`，导出 `kc`）。
 * signal 已中止立即拒绝（吞源 promise 后续 rejection）。
 */
export function raceWithAbortSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    promise.catch(() => {});
    return Promise.reject(abortErrorOf(signal));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortErrorOf(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    void promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
}

// ---------------------------------------------------------------------------
// 请求头协议（原 `Pw`..`Jw`）
// ---------------------------------------------------------------------------

/** Surface header（原 `Pw`，导出 `Ws`）。 */
export const HEADER_SURFACE = "X-Codex-Surface";

/** Attach-Auth header（原 `Fw`，导出 `Bs`）。 */
export const HEADER_ATTACH_AUTH = "X-OpenAI-Attach-Auth";

/** Desktop-Surface header（原 `Iw`，导出 `Vs`）。 */
export const HEADER_DESKTOP_SURFACE = "X-OpenAI-Attach-Desktop-Surface";

/** DeviceCheck header（原 `Lw`）。 */
const HEADER_DEVICE_CHECK_TOKEN = "X-OpenAI-Attach-DeviceCheck-Token";

/** Integrity-State header（原 `Rw`，导出 `Hs`）。 */
export const HEADER_INTEGRITY_STATE = "X-OpenAI-Attach-Integrity-State";

/** Expected-Account-Id header（原 `zw`）。 */
const HEADER_EXPECTED_ACCOUNT_ID = "X-OpenAI-Expected-Account-Id";

/**
 * 后端 API 路径拼接（原 `Bw`，导出 `Qs`）。
 * public-api/ 前缀在 /backend-api 或 /api 基座上重写。
 */
export function joinBackendApiPath(baseUrl: string, path: string): string {
  let base = baseUrl.replace(/\/+$/, "");
  let suffix = path.replace(/^\/+/, "");
  if (suffix.startsWith("public-api/")) {
    if (base.endsWith("/backend-api")) {
      base = base.slice(0, -12);
    } else if (base.endsWith("/api")) {
      base = base.slice(0, -4);
      suffix = suffix.replace(/^public-api\//, "public/");
    }
  }
  return `${base}/${suffix}`;
}

/** 大小写不敏感 header 查找（原 `Jw`）。 */
function findHeaderKey(headers: Record<string, unknown>, name: string): string | undefined {
  const lowercased = name.toLowerCase();
  return Object.keys(headers).find((key) => key.toLowerCase() === lowercased);
}

/** 取布尔 header 并删除（原 `Kw`：'0'/'false' 为假）。 */
function takeBooleanHeader(headers: Record<string, unknown>, name: string): boolean {
  const key = findHeaderKey(headers, name);
  if (key == null) return false;
  const value = headers[key];
  delete headers[key];
  return value !== "0" && String(value).toLowerCase() !== "false";
}

/** header 存在判定（原 `qw`，导出 `Zs`）。 */
export function hasHeader(headers: Record<string, unknown>, name: string): boolean {
  return findHeaderKey(headers, name) != null;
}

/** 取布尔 header（原 `Vw`，导出 `Gs`）。 */
export function shouldAttachAuthHeaders(headers: Record<string, unknown>): boolean {
  return takeBooleanHeader(headers, HEADER_ATTACH_AUTH);
}

/** 取 desktop surface（原 `Hw`，导出 `Ks`）。 */
export function wantsDesktopSurface(headers: Record<string, unknown>): boolean {
  return takeBooleanHeader(headers, HEADER_DESKTOP_SURFACE);
}

/** 取 device check（原 `Uw`，导出 `qs`）。 */
export function wantsDeviceCheckToken(headers: Record<string, unknown>): boolean {
  return takeBooleanHeader(headers, HEADER_DEVICE_CHECK_TOKEN);
}

/** 取 integrity state（原 `Ww`，导出 `Js`）。 */
export function wantsIntegrityState(headers: Record<string, unknown>): boolean {
  return takeBooleanHeader(headers, HEADER_INTEGRITY_STATE);
}

/** 取期望账号并删除（原 `Gw`，导出 `Ys`）。 */
export function expectedAccountIdOf(headers: Record<string, unknown>): unknown {
  const key = findHeaderKey(headers, HEADER_EXPECTED_ACCOUNT_ID);
  if (key == null) return undefined;
  const value = headers[key];
  delete headers[key];
  return value;
}

// ---------------------------------------------------------------------------
// 网络错误分类（原 `Yw`/`Xw`）
// ---------------------------------------------------------------------------

/** 网络 errno 形态（原 `Yw`：{code: enum}——Error 自身或 cause 带 code）。 */
const NETWORK_ERROR_CODE_SCHEMA = z.object({
  code: z.enum([
    "EAI_AGAIN",
    "EADDRINFO",
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ENOTFOUND",
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
    "UND_ERR_SOCKET",
  ]),
});

const FETCH_FAILED_PATTERN = /^(?:failed to fetch|fetch failed|load failed|networkerror when attempting to fetch resource\.?|network error)$/i;

/**
 * 网络错误分类（原 `Xw`，导出 `Xs`）。
 * net:: 前缀（非 ABORTED）、NetworkError、fetch TypeError 消息形态、
 * errno code（本体或 cause）→ 'network'；否则 undefined。
 */
export function errorKindOf(error: unknown): "network" | undefined {
  if (
    error instanceof Error &&
    error.name !== "AbortError" &&
    !error.message.startsWith("net::ERR_ABORTED") &&
    (error.message.startsWith("net::") ||
      error.name === "NetworkError" ||
      (error instanceof TypeError && FETCH_FAILED_PATTERN.test(error.message)) ||
      NETWORK_ERROR_CODE_SCHEMA.safeParse(error).success ||
      NETWORK_ERROR_CODE_SCHEMA.safeParse((error as Error & { cause?: unknown }).cause).success)
  )
    return "network";
  return undefined;
}

// ---------------------------------------------------------------------------
// 兼容导出（http-headers 分区 14 个压缩名）
// ---------------------------------------------------------------------------

export {
  HEADER_SURFACE as Ws,
  HEADER_ATTACH_AUTH as Bs,
  HEADER_DESKTOP_SURFACE as Vs,
  HEADER_INTEGRITY_STATE as Hs,
  joinBackendApiPath as Qs,
  shouldAttachAuthHeaders as Gs,
  wantsDesktopSurface as Ks,
  wantsDeviceCheckToken as qs,
  wantsIntegrityState as Js,
  expectedAccountIdOf as Ys,
  hasHeader as Zs,
  errorKindOf as Xs,
  createDeferred as Ac,
  raceWithAbortSignal as kc,
};
