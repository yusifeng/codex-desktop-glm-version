// 后端 API 端点与 User-Agent 常量。
// 对应 bootstrap-C4dRql4x.ts 19760-19790 行（Kw/qw/Jw/Yw/Qw/$w/eT/nT）：
//   - `Kw`（prod API base）、`qw`（dev API base）、`Jw`（desktop originator）、
//     `Yw`（originator 前缀）
//   - `Qw`（UA 平台串表）、`$w`（构建 User-Agent）、`eT`（解析 app 版本）
//   - `nT`（resolveApiBaseUrl：CODEX_API_BASE_URL / CODEX_API_ENDPOINT=localhost 覆盖）
//   - `rT`（resolveBackendApiUrl：base + path 的拼接，含 public-api 适配）

import { app } from "electron";
import { Qs as joinBackendApiPath } from "@chunk/shared";

/** 生产 API base URL（原 `Kw`）。 */
export const PROD_API_BASE_URL = "https://chatgpt.com/backend-api";

/** 开发 API base URL（原 `qw`）。 */
export const DEV_API_BASE_URL = "http://localhost:8000/api";

/** desktop 请求的 originator 标识（原 `Jw`）。 */
export const DESKTOP_ORIGINATOR = "Codex Desktop";

/** IPC / 事件来源前缀（原 `Yw`）。 */
export const ORIGINATOR_PREFIX = "codex_desktop";

/** User-Agent 的平台串（原 `Qw`）。 */
const USER_AGENT_PLATFORM_STRINGS: Record<string, string> = {
  darwin: "Mac OS",
  linux: "X11; Linux",
  win32: "Windows NT 10.0",
};

/** 构建 desktop User-Agent（原 `$w`）。 */
export function buildDesktopUserAgent({
  appVersion,
  platform = process.platform,
  arch = process.arch,
}: {
  appVersion: string;
  platform?: string;
  arch?: string;
}): string {
  return `Codex Desktop/${appVersion} (${USER_AGENT_PLATFORM_STRINGS[platform] ?? platform}; ${arch})`;
}

/**
 * 解析当前 app 版本（原 `eT`）：非打包构建允许 CODEX_APP_VERSION 覆盖
 * （resources 恢复流程用它伪造版本）。
 */
export function resolveAppVersion(): string {
  const override = process.env.CODEX_APP_VERSION?.trim();
  return !app.isPackaged && override ? override : app.getVersion();
}

/** desktop API 选项（路由判定 + originator；authedFetch / appcast 构造共用）。 */
export interface DesktopApiOptions {
  desktopOriginator: string;
  devApiBaseUrl: string;
  prodApiBaseUrl: string;
}

/**
 * 解析 API base URL（原 `nT`）：
 * 1. `CODEX_API_BASE_URL` 设置且非空 → 去尾部斜杠
 * 2. `CODEX_API_ENDPOINT`（不区分大小写）= `localhost` → dev base
 * 3. 否则按打包形态选 prod / dev base
 */
export function resolveApiBaseUrl(desktopApiOptions: DesktopApiOptions): string {
  const baseUrlOverride = process.env.CODEX_API_BASE_URL;
  return baseUrlOverride && baseUrlOverride.trim().length > 0
    ? baseUrlOverride.replace(/\/+$/, "")
    : (process.env.CODEX_API_ENDPOINT ?? "").toLowerCase() === "localhost"
      ? desktopApiOptions.devApiBaseUrl
      : desktopApiOptions.prodApiBaseUrl;
}

/**
 * 解析后端 API 完整 URL（原 `rT`）：base 与 path 的拼接
 * （shared chunk 的 joinBackendApiPath 处理 `public-api/` 前缀适配）。
 */
export function resolveBackendApiUrl(desktopApiOptions: DesktopApiOptions, path: string): string {
  return joinBackendApiPath(resolveApiBaseUrl(desktopApiOptions), path);
}
