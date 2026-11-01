// native-pipe 管道对端鉴权（原 main-C-Mhak1n.ts 13,799-13,846 行的
// `Fse/Ise/Lse/Zl/Rse/Ql/zse`）。
//
// macOS 上通过原生 addon `browser-use-peer-authorization.node` 校验连接到
// native pipe 的对端进程身份（SO_PEERCRED 风格，基于 socket fd）。
//
// `createSocketPeerAuthorizer`（原 `Ql`）是惰性工厂：每次调用时才读取
// 包元数据 / 加载原生 addon（深析 §7.4：任何 import 期求值都会把
// missing-package-build-flavor 警告的触发时机提前，必须保持懒）。
//
// 鉴权策略：
//   - 非 darwin：一律放行。
//   - 打包态且读不到 build flavor：一律拒绝（reason: missing-package-build-flavor）。
//   - flavor 声明需要 peer authorization（打包态）或设置了
//     CODEX_BROWSER_USE_PEER_AUTHORIZATION=1（dev 覆盖）：加载 addon 逐 socket 鉴权。
//   - 其余：放行。

import { createRequire } from "node:module";
import { join } from "node:path";

import { app } from "electron";
// @chunk/bootstrap 的兼容导出（单字母名）：`in` → BuildFlavor 模型。
import { "in" as BuildFlavor } from "@chunk/bootstrap";
// @chunk/electron-resources-path（已重写 chunk）。
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { memoizedTaggedLogger } from "@chunk/logger";

/** dev 覆盖开关环境变量（原 `Fse`）。 */
const PEER_AUTHORIZATION_ENV_KEY = `CODEX_BROWSER_USE_PEER_AUTHORIZATION`;
/** 原生 addon 文件名（位于 <resourcesPath>/native/ 下，原 `Ise`）。 */
const PEER_AUTHORIZATION_ADDON_NAME = `browser-use-peer-authorization.node`;

/** 鉴权结果：authorized 为假时携带 reason。 */
export interface SocketPeerAuthorization {
  authorized: boolean;
  reason?: string;
}

/** socket 鉴权器（输入 socket，输出鉴权结果；抛错由服务端按鉴权失败处理）。 */
export type SocketPeerAuthorizer = (socket: unknown) => SocketPeerAuthorization;

/** 原生 addon 的 require（原 `Rse`，模块加载期 createRequire，纯调用无 I/O）。 */
const requireNative = createRequire(import.meta.url);

/** 具名 logger（原 `Zl`，r.i 记忆化 tag logger）。 */
const peerAuthorizerLogger = memoizedTaggedLogger(`browser-use-native-pipe-peer-authorizer`);

/** 读取 dev 覆盖开关（原 `Lse`）。 */
function isPeerAuthorizationDevOverride(env: Record<string, string | undefined>): boolean {
  return env[PEER_AUTHORIZATION_ENV_KEY] === `1`;
}

/**
 * 创建管道对端鉴权器（原 `Ql`）。
 *
 * 惰性：每次调用重新读取包元数据并（按需）加载 addon。
 * 打包态缺 build flavor 时返回「全拒」鉴权器并告警；
 * 需要 resourcesPath 而拿不到时抛错。
 */
export function createSocketPeerAuthorizer(): SocketPeerAuthorizer {
  if (process.platform !== `darwin`) return () => ({ authorized: true });

  const flavor = BuildFlavor.readFromPackageMetadata();
  const shouldInclude =
    flavor != null && BuildFlavor.shouldIncludeBrowserUsePeerAuthorization(flavor, process.platform);
  const devOverride = !shouldInclude && isPeerAuthorizationDevOverride(process.env);

  if (app?.isPackaged === true && flavor == null) {
    peerAuthorizerLogger().warning(`browser-use native pipe peer authorization disabled`, {
      safe: { reason: `missing-package-build-flavor` },
      sensitive: {},
    });
    return () => ({ authorized: false, reason: `missing-package-build-flavor` });
  }
  if (!shouldInclude && !devOverride) return () => ({ authorized: true });

  // dev 覆盖时经 electron-resources-path 解析（支持 CODEX_ELECTRON_RESOURCES_PATH），
  // 打包态直接用 process.resourcesPath。
  const resourcesPath = devOverride
    ? resolveElectronResourcesPath({ env: process.env, resourcesPath: process.resourcesPath })
    : process.resourcesPath;
  if (resourcesPath == null)
    throw new Error(`Browser-use peer authorization requires resourcesPath`);

  let addon: {
    /** 原生鉴权入口：校验 socket fd 的对端进程。 */
    authorizeSocketPeer(fd: number, devMode: boolean): SocketPeerAuthorization;
  };
  try {
    addon = requireNative(join(resourcesPath, `native`, PEER_AUTHORIZATION_ADDON_NAME));
  } catch (error) {
    throw new Error(`Failed to load browser-use peer authorization addon`, { cause: error });
  }

  peerAuthorizerLogger().info(`browser-use native pipe peer authorization enabled`, {
    safe: { mode: devOverride ? `dev` : `packaged` },
    sensitive: {},
  });
  return (socket: unknown) => {
    const fd = extractSocketFd(socket);
    return fd == null
      ? { authorized: false, reason: `missing-socket-file-descriptor` }
      : addon.authorizeSocketPeer(fd, devOverride);
  };
}

/**
 * 从 socket 提取文件描述符（原 `zse`）。
 * `_handle.fd` 非负整数才有效，否则返回 null。
 */
export function extractSocketFd(socket: any): number | null {
  const fd = socket?._handle?.fd;
  return typeof fd === `number` && Number.isInteger(fd) && fd >= 0 ? fd : null;
}
