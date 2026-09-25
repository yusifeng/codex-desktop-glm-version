// Windows 账户/注册表/系统诊断：windows-account.node addon 的加载与门面。
//
// 对应 main-C-Mhak1n.ts 71,700-71,761：
//   - kO loadWindowsAccountAddon：createRequire + resourcesPath/native/
//     windows-account.node，模块级缓存（xO）
//   - SO isAdminCapable、CO getSystemPerformanceSnapshot、wO supportsPersistentAcls、
//     TO isNetworkDrive、EO readRegistryValue（HKCU 前缀校验 OO）、
//     DO registerProcessListProvider（注入 shared 的进程表）
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { in as registerProcessListProvider } from "@chunk/shared";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";

const HKCU_PREFIX = "HKCU\\";
const requireAddon = createRequire(__filename);
/** addon 模块缓存（原 `xO`）。 */
let addonModule: WindowsAccountAddon | null = null;

interface WindowsAccountAddon {
  isCurrentAccountAdministratorCapable(): boolean;
  getSystemPerformanceSnapshot?(): unknown;
  supportsPersistentAcls?(path: string): Promise<boolean> | boolean;
  isNetworkDrive?(root: string): boolean;
  readCurrentUserRegistryStringValue?(key: string, name: string): string | null;
  listProcesses?(opts: unknown): Array<Record<string, unknown>>;
}

/** 加载 addon（原 `kO`）：仅 win32 的 resourcesPath 下存在时。 */
function loadWindowsAccountAddon(): WindowsAccountAddon | null {
  if (addonModule != null) return addonModule;
  const resourcesPath = resolveElectronResourcesPath({
    env: process.env,
    resourcesPath: process.resourcesPath,
  });
  if (resourcesPath == null) return null;
  const addonPath = join(resourcesPath, "native", "windows-account.node");
  return existsSync(addonPath) ? ((addonModule = requireAddon(addonPath)), addonModule) : null;
}

/** 当前账户是否可提权为管理员（原 `SO`）。 */
function isAdministratorCapable({
  loadAddon = loadWindowsAccountAddon,
  platform = process.platform,
}: { loadAddon?: () => WindowsAccountAddon | null; platform?: string } = {}): "administrator" | "standard" | "unknown" {
  if (platform !== "win32") return "unknown";
  try {
    const addon = loadAddon();
    return addon == null
      ? "unknown"
      : addon.isCurrentAccountAdministratorCapable()
        ? "administrator"
        : "standard";
  } catch {
    return "unknown";
  }
}

/** Windows 系统性能快照（原 `CO`）。 */
function getWindowsSystemDiagnostics({
  loadAddon = loadWindowsAccountAddon,
  platform = process.platform,
}: { loadAddon?: () => WindowsAccountAddon | null; platform?: string } = {}): unknown | null {
  if (platform !== "win32") return null;
  try {
    return loadAddon()?.getSystemPerformanceSnapshot?.() ?? null;
  } catch {
    return null;
  }
}

/** 持久 ACL 支持（原 `wO`）：非 win32 / 加载失败 / addon 未实现均视为支持。 */
async function supportsPersistentAcls(path: string): Promise<boolean> {
  if (process.platform !== "win32") return true;
  try {
    return (await loadWindowsAccountAddon()?.supportsPersistentAcls?.(path)) ?? true;
  } catch {
    return true;
  }
}

/** 网络盘判定（原 `TO`）。 */
function isNetworkDrive(root: string): boolean {
  return loadWindowsAccountAddon()?.isNetworkDrive?.(root) === true;
}

/** HKCU 注册表读值（原 `EO`/`OO`：必须位于 HKCU 下）。 */
function readRegistryValue({
  key,
  name,
  loadAddon = loadWindowsAccountAddon,
  platform = process.platform,
}: {
  key: string;
  name: string;
  loadAddon?: () => WindowsAccountAddon | null;
  platform?: string;
}): string | null {
  if (platform !== "win32") return null;
  const registryKey = requireHkcuSubkey(key);
  return loadAddon()?.readCurrentUserRegistryStringValue?.(registryKey, name) ?? null;
}

function requireHkcuSubkey(key: string): string {
  if (!key.startsWith(HKCU_PREFIX) || key.length === HKCU_PREFIX.length)
    throw new Error("Registry key must be under HKCU");
  return key.slice(HKCU_PREFIX.length);
}

/** 注入 shared 的进程表提供方（原 `DO`）。 */
function registerWindowsProcessListProvider({
  loadAddon = loadWindowsAccountAddon,
  platform = process.platform,
}: { loadAddon?: () => WindowsAccountAddon | null; platform?: string } = {}): void {
  if (platform !== "win32") return;
  (registerProcessListProvider as unknown as (provider: { listProcesses(opts: unknown): Promise<Array<Record<string, unknown>>> }) => void)({
    async listProcesses(opts) {
      return loadAddon()?.listProcesses?.(opts) ?? [];
    },
  });
}

export {
  loadWindowsAccountAddon,
  isAdministratorCapable,
  getWindowsSystemDiagnostics,
  supportsPersistentAcls,
  isNetworkDrive,
  readRegistryValue,
  registerWindowsProcessListProvider,
  type WindowsAccountAddon,
};
