// production appcast URL 构造与 Windows build 版本比较。
//
// 对应 bootstrap-C4dRql4x.ts 19886-19937 行：
//   - `mT`（codex appcast path）、`hT`（wham appcast path）、`gT`（logger）
//   - `_T`（buildProductionAppcastUrl：arch/app 版本校验 + 查询参数）
//   - `vT`（buildAppcastEndpointUrl：dev localhost 时改写 path）
//   - `yT`（compareBuildVersions）、`bT`（isDottedNumericBuildVersion）、
//     `xT`（parseBuildVersion）
//
// `yT/bT/xT` 同时被 Windows MSIX / Store 更新器与 Windows runtime framework
// 模块使用（定义在本区间，导出供跨模块引用）。

import { app } from "electron";
import { memoizedTaggedLogger } from "@chunk/logger";
import { Ru as formatSemanticVersion, Uu as parseSemanticVersion } from "@chunk/shared";
import {
  DESKTOP_ORIGINATOR,
  DEV_API_BASE_URL,
  PROD_API_BASE_URL,
  resolveBackendApiUrl,
} from "../api/endpoints";

/** appcast 在 prod backend 的路径（原 `mT`）。 */
const CODEX_APPCAST_PATH = "codex/app/appcast";

/** appcast 在 backend 网关的路径（原 `hT`）。 */
const WHAM_APPCAST_PATH = "wham/app/appcast";

/** 日志（原 `gT`）。 */
const logger = memoizedTaggedLogger("production-appcast");

/**
 * 构造 production appcast feed URL（原 `_T`）。
 * - 仅支持 arm64 / x64，其他架构返回 null。
 * - app 版本必须是可无损 round-trip 的语义化版本，否则返回 null。
 * - URL 携带 installation_id / arch / app_version / beta / os-version / plan_type。
 */
export function buildProductionAppcastUrl({
  beta,
  installationId,
  planType,
}: {
  beta: boolean;
  installationId: string;
  planType: string;
}): string | null {
  const arch = process.arch;
  if (arch !== "arm64" && arch !== "x64") {
    logger().warning("Unsupported production appcast architecture");
    return null;
  }
  const appVersion = app.getVersion();
  try {
    if (formatSemanticVersion(parseSemanticVersion(appVersion)) !== appVersion) {
      logger().warning("Invalid production appcast app version");
      return null;
    }
  } catch {
    logger().warning("Invalid production appcast app version");
    return null;
  }
  const url = buildAppcastEndpointUrl();
  url.searchParams.set("installation_id", installationId);
  url.searchParams.set("arch", arch);
  url.searchParams.set("app_version", appVersion);
  url.searchParams.set("beta", String(beta));
  url.searchParams.set("os-version", getSystemVersion());
  url.searchParams.set("plan_type", planType);
  return url.toString();
}

/**
 * 构造 appcast endpoint URL（原 `vT`）：backend appcast 端点；
 * dev base（localhost）时把 path 改写为本地 API 的 codex appcast 路径。
 */
function buildAppcastEndpointUrl(): URL {
  const url = new URL(
    resolveBackendApiUrl(
      {
        desktopOriginator: DESKTOP_ORIGINATOR,
        devApiBaseUrl: DEV_API_BASE_URL,
        prodApiBaseUrl: PROD_API_BASE_URL,
      },
      WHAM_APPCAST_PATH,
    ),
  );
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname.toLowerCase()))
    url.pathname = `/api/${CODEX_APPCAST_PATH}`;
  return url;
}

/** Electron 的 process.getSystemVersion（Node 类型上没有）。 */
function getSystemVersion(): string {
  return (process as unknown as { getSystemVersion(): string }).getSystemVersion();
}

/**
 * 比较两段点分数字 build 版本（原 `yT`）：逐段数值比较，缺段补 0。
 * 返回 正/负/0（a > b / a < b / 相等）。
 */
export function compareBuildVersions(a: string, b: string): number {
  const aParts = parseBuildVersion(a);
  const bParts = parseBuildVersion(b);
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    const aPart = aParts[index] ?? 0;
    const bPart = bParts[index] ?? 0;
    if (aPart !== bPart) return aPart - bPart;
  }
  return 0;
}

/** 是否为多段纯数字 build 版本（原 `bT`）。 */
export function isDottedNumericBuildVersion(version: string): boolean {
  const parts = version.trim().split(".");
  return parts.length > 1 && parts.every((part) => /^\d+$/.test(part));
}

/** 解析点分数字 build 版本（原 `xT`）：含非数字段时抛错。 */
function parseBuildVersion(version: string): number[] {
  const parts = version.trim().split(".");
  if (parts.some((part) => !/^\d+$/.test(part)))
    throw Error(`Invalid build version '${version}'.`);
  return parts.map((part) => Number.parseInt(part, 10));
}
