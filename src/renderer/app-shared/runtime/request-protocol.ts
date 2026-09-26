/** 原 `Fze` / 压缩导出 `gW`。 */
export const BROWSER_FORM_FILL_PATH = "/flora/browser/form-fill";

/** 原 `Ize` / 压缩导出 `_W`。 */
export const CODEX_SURFACE_HEADER = "X-Codex-Surface";

/** 原 `Lze` / 压缩导出 `fW`。 */
export const ATTACH_AUTH_HEADER = "X-OpenAI-Attach-Auth";

/** 原 `Rze` / 压缩导出 `pW`。 */
export const ATTACH_DESKTOP_SURFACE_HEADER =
  "X-OpenAI-Attach-Desktop-Surface";

/** 原 `zze` / 压缩导出 `mW`。 */
export const ATTACH_DEVICE_CHECK_TOKEN_HEADER =
  "X-OpenAI-Attach-DeviceCheck-Token";

/** 原 `Bze` / 压缩导出 `hW`。 */
export const ATTACH_INTEGRITY_STATE_HEADER =
  "X-OpenAI-Attach-Integrity-State";

/** 原 `Vze` / 压缩导出 `vW`。 */
export const EXPECTED_ACCOUNT_ID_HEADER = "X-OpenAI-Expected-Account-Id";

/** 原 `Hze`，用于采集响应链路性能信息。 */
export const SERVER_TIMING_HEADERS = [
  "s-cf-origin-ttfb-msec",
  "s-cf-quic-rtt-msec",
  "s-cf-tcp-rtt-msec",
  "s-sa-server-ttfb-msec",
  "x-oai-request-id",
] as const;

/** 原 `iV` / 压缩导出 `CW`。 */
export function initializeRequestProtocol(): void {}
