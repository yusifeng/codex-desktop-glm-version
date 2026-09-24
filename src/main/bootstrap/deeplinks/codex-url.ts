// codex:/codex-dev: 协议 URL 解析（原 te）。
// 对应 bootstrap-C4dRql4x.ts 41-50 行。

export interface ParsedCodexUrl {
  /**
   * 目标主机。URL 携带用户名/密码/端口等本协议不支持的部分时为 "unsupported"。
   */
  destination: string;
  url: URL;
}

/**
 * 解析 codex: / codex-dev: 协议 URL；入参为 null、无法解析或属于其他协议时
 * 返回 null。
 */
export function parseCodexUrl(input: string | URL | null | undefined): ParsedCodexUrl | null {
  const url = typeof input === "string" ? URL.parse(input) : input;
  if (url == null || (url.protocol !== "codex:" && url.protocol !== "codex-dev:")) return null;
  return {
    destination:
      url.username === "" && url.password === "" && url.port === "" ? url.host : "unsupported",
    url,
  };
}
