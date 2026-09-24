// 外部 URL 门控：deep link / 外部打开的 URL 仅放行 http(s) 与 about:blank。
// 对应 bootstrap-C4dRql4x.ts 23362-23378 行（MO/NO/PO/FO）。

/** 允许在外部打开的协议白名单（原 MO）。 */
const ALLOWED_HTTP_PROTOCOLS: readonly string[] = Object.freeze(["http:", "https:"]);

/** 无条件放行的 URL（原 NO）。 */
const ALWAYS_ALLOWED_URLS = new Set(["about:blank"]);

/** 门控拒绝原因。 */
export type HttpUrlGateReason = "allowed" | "invalid_url" | "unsupported_protocol";

/** 门控判定结果（原 FO 返回结构）。 */
export interface HttpUrlGateResult {
  allowed: boolean;
  reason: HttpUrlGateReason;
}

/** URL 是否被门控放行（原 PO）。 */
export function isHttpUrlAllowed(url: string): boolean {
  return evaluateHttpUrlGate(url).allowed;
}

/** 判定 URL 是否被门控放行并给出原因（原 FO）。 */
export function evaluateHttpUrlGate(url: string): HttpUrlGateResult {
  if (ALWAYS_ALLOWED_URLS.has(url)) return { allowed: true, reason: "allowed" };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: "invalid_url" };
  }
  return ALLOWED_HTTP_PROTOCOLS.includes(parsed.protocol)
    ? { allowed: true, reason: "allowed" }
    : { allowed: false, reason: "unsupported_protocol" };
}
