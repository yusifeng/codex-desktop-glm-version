// Windows 主运行时框架（PrimaryRuntime MSIX）的下载/安装/激活
// （原 bootstrap-C4dRql4x.ts 24951-25323 行的 `nj/rj/ij/aj` 常量、
// `oj/sj/cj` 模块级可变状态、`lj/uj/dj/fj/pj/mj/hj/gj/_j/vj/yj/bj/xj/Sj/Cj`）。
//
// 背景：distributed Windows 构建把 codex 运行时放在独立的
// OpenAI.CodexPrimaryRuntime MSIX 框架包里（而非 app.asar）。启用
// （`uj`，主流程在 gate 水化时按 global-state 开关调用）后：
//   - `mj`（installPrimaryRuntimeFramework）：按 bundle 配置构造包标识，
//     走 `hj` 的「查询 → 校验 → （需要时）下载安装 → 再查询 → 校验 → pin」
//     流程，返回框架根目录（写入 shared chunk，runtime 从框架目录解析）；
//   - `pj`（activatePrimaryRuntimeFramework）：启动时读取上次 pin 的包，
//     校验身份后重新 pin 并请求延迟系统清理，把 installPath 注册到
//     shared chunk；
//   - 下载（`bj`）带 120s 无进度看门狗、sha256/长度校验、staging 目录
//     清理，全部走 HTTPS（`Cj`）。
//
// 模块级状态（原 oj/sj/cj）：pinned 包缓存 Map、enabled 标志（默认 false）、
// enabled 变更监听器集合——必须保持模块顶层。

import { createHash } from "node:crypto";
import { join } from "node:path";
import { release as osRelease, tmpdir } from "node:os";
import { mkdtemp, open as openFile, rm } from "node:fs/promises";

import { net } from "electron";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   Hu → 语义版本 → Windows Store 四段式 build 版本规范化（内部符号 my）
//   Vu → 构造 MSIX 包标识 `<name>.v<version 点转横线>`（内部符号 hy）
//   jn → 设置 primary runtime framework 根目录（内部符号 gX，写 tX；
//        runtime 来源判定 framework/archive 用）
import {
  Hu as normalizeWindowsStoreBuildVersion,
  jn as setPrimaryRuntimeFrameworkRoot,
  Vu as buildMsixPackageIdentity,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { BuildFlavor } from "../build-info/build-flavor";
// `OT` → loadWindowsUpdaterAddon（windows-msix-updater）；同一 native addon
// 还暴露框架部署方法，这里以本地接口视图使用（`as unknown as` 切换视角）。
// `yT` → compareBuildVersions（backend-appcast，windows-msix-updater 同源引用）。
import { loadWindowsUpdaterAddon } from "../updater/windows-msix-updater";
import { compareBuildVersions } from "../updater/backend-appcast";
// `$` → UpdateError、`tj` → classifyUpdateFailure（update-errors，另一 agent 已重写）。
import { UpdateError, classifyUpdateFailure } from "../updater/update-errors";
import type { InternalUpdateCdnRequestHeaders } from "../updater/sparkle-manager";

/** 记忆化 tag logger（原 `nj`）。 */
const getFrameworkLogger = memoizedTaggedLogger(`restricted-codex-windows-runtime-framework`);
/** 框架包名（原 `rj`）。 */
const PRIMARY_RUNTIME_PACKAGE_NAME = `OpenAI.CodexPrimaryRuntime`;
/** 框架持久化键（原 `ij`）。 */
const PRIMARY_RUNTIME_PERSISTENCE_KEY = `PrimaryRuntime`;
/** 预期发布者 DN（原 `aj`）。 */
const EXPECTED_PACKAGE_PUBLISHER = `CN="OpenAI OpCo, LLC", O="OpenAI OpCo, LLC", L=San Francisco, S=California, C=US`;

// ---- 模块级可变状态（原 oj/sj/cj）-------------------------------------------

/** pinned 的框架包（原 `oj` 的 Map 值）。 */
interface PinnedFrameworkPackage {
  handle: unknown;
  installPath: string;
  nativeAddon: WindowsRuntimeFrameworkNativeAddon | null;
}

/** 已安装框架包（native addon 返回的包信息）。 */
interface InstalledFrameworkPackage {
  packageFullName: string;
  packageIdentity: string;
  packageFamilyName: string;
  packagePublisher: string;
  packageVersion: string;
  installPath: string;
  architecture: string;
}

/** pin 结果（native addon 的 pinFrameworkPackage 返回值）。 */
interface FrameworkPackagePin {
  handle: unknown;
  installPath: string;
  packageFullName: string;
}

/** 持久化的包记录（native addon 的 getPersistedFrameworkPackage 返回值）。 */
interface PersistedFrameworkPackage {
  packageFamilyName: string;
  packageFullName: string;
}

/** Windows 更新 native addon 中框架部署相关的面（全部可选防御式探测）。 */
interface WindowsRuntimeFrameworkNativeAddon {
  findFrameworkPackage?(
    packageFamilyName: string,
    version?: string,
  ): Promise<InstalledFrameworkPackage | null> | InstalledFrameworkPackage | null;
  installFrameworkPackage?(msixPath: string): Promise<void> | void;
  pinFrameworkPackage?(
    packageFamilyName: string,
    packageFullName: string,
    persistenceKey?: string,
  ): FrameworkPackagePin | null;
  unpinFrameworkPackage?(handle: unknown): void;
  getPersistedFrameworkPackage?(persistenceKey: string): PersistedFrameworkPackage | null;
  getPackageLocalCachePath?(): string | null;
  saveFrameworkSelection?(handle: unknown, persist: boolean): void;
  deferFrameworkPackageRemoval?(handle: unknown): Promise<unknown> | unknown;
}

/** pinned 包缓存（原 `oj`）：packageFullName → pin 信息。 */
const pinnedFrameworkPackages = new Map<string, PinnedFrameworkPackage>();
/** primary runtime frameworks 启用标志（原 `sj`，默认关）。 */
let primaryRuntimeFrameworksEnabled = false;
/** enabled 变更监听器（原 `cj`）。 */
const enabledChangeListeners = new Set<() => void>();

// ---- 启用开关（原 lj/uj/dj）--------------------------------------------------

/** 是否启用 primary runtime frameworks（原 `lj`）。 */
export function isPrimaryRuntimeFrameworkEnabled(): boolean {
  return primaryRuntimeFrameworksEnabled;
}

/**
 * 设置启用标志（原 `uj`）：关闭时清空 shared chunk 的框架根目录；
 * 状态实际变化时通知全部监听器。
 */
export function setPrimaryRuntimeFrameworksEnabled(enabled: boolean): void {
  const changed = primaryRuntimeFrameworksEnabled !== enabled;
  primaryRuntimeFrameworksEnabled = enabled;
  enabled || setPrimaryRuntimeFrameworkRoot(null);
  changed && enabledChangeListeners.forEach((listener) => listener());
}

/** 订阅 enabled 变更（原 `dj`），返回反订阅函数。 */
export function onPrimaryRuntimeFrameworksEnabledChanged(listener: () => void): () => void {
  return (
    enabledChangeListeners.add(listener),
    () => {
      enabledChangeListeners.delete(listener);
    }
  );
}

// ---- 平台/版本 gate（原 fj）---------------------------------------------------

/**
 * 当前环境是否支持 primary runtime frameworks（原 `fj`）：win32、arm64/x64、
 * Windows build >= 22621（22H2）、distributed flavor。
 */
export function isPrimaryRuntimeFrameworkSupported(
  buildFlavor: string,
  platform: string = process.platform,
  release: string = osRelease(),
  arch: string = process.arch,
): boolean {
  return (
    platform === `win32` &&
    (arch === `arm64` || arch === `x64`) &&
    Number(release.split(`.`)[2]) >= 22621 &&
    (buildFlavor === BuildFlavor.Nightly ||
      buildFlavor === BuildFlavor.InternalAlpha ||
      buildFlavor === BuildFlavor.PublicBeta ||
      buildFlavor === BuildFlavor.Prod)
  );
}

// ---- 激活（原 pj）-------------------------------------------------------------

/** 激活进度（可变的 step 字段）。 */
export interface ActivationProgress {
  step: string;
}

/** `pj` 的入参。 */
export interface ActivatePrimaryRuntimeFrameworkOptions {
  buildFlavor: string;
  /** 激活步骤追踪（原地更新 step），默认 { step: 'configuration' }。 */
  progress?: ActivationProgress;
  signal?: AbortSignal;
}

/**
 * 激活 primary runtime framework（原 `pj`）：读取上次持久化的包记录，
 * 校验包身份后重新 pin（持久化）并把 installPath 注册到 shared chunk。
 * 未启用/平台不支持时静默返回；native 支持缺失抛 UpdateError。
 */
export async function activatePrimaryRuntimeFramework({
  buildFlavor,
  progress = { step: `configuration` },
  signal,
}: ActivatePrimaryRuntimeFrameworkOptions): Promise<void> {
  if (!primaryRuntimeFrameworksEnabled || !isPrimaryRuntimeFrameworkSupported(buildFlavor)) return;
  const nativeAddon = loadWindowsUpdaterAddon() as unknown as WindowsRuntimeFrameworkNativeAddon | null;
  if (nativeAddon?.findFrameworkPackage == null || nativeAddon.pinFrameworkPackage == null)
    throw new UpdateError(
      `Windows primary runtime framework activation support is unavailable.`,
      `native-support-unavailable`,
    );
  progress.step = `persisted-package-read`;
  const persistedPackage = nativeAddon.getPersistedFrameworkPackage?.(PRIMARY_RUNTIME_PERSISTENCE_KEY) ?? null;
  const packageIdentity =
    persistedPackage == null ? null : parseTrustedPackageIdentity(persistedPackage.packageFamilyName);
  progress.step = `package-query`;
  const installedPackage =
    persistedPackage != null && packageIdentity != null
      ? await nativeAddon.findFrameworkPackage(
          persistedPackage.packageFamilyName,
          persistedPackage.packageFullName,
        )
      : null;
  if (installedPackage != null && persistedPackage != null && packageIdentity != null) {
    progress.step = `package-verify`;
    verifyFrameworkPackageIdentity({
      installedPackage,
      packageFamilyName: persistedPackage.packageFamilyName,
      packageIdentity,
      packagePublisher: EXPECTED_PACKAGE_PUBLISHER,
    });
    progress.step = `activation-pin`;
    signal?.throwIfAborted();
    const installPath = pinFrameworkPackage({
      installedPackage,
      nativeAddon,
      packageFamilyName: persistedPackage.packageFamilyName,
      packageIdentity,
      persistenceKey: PRIMARY_RUNTIME_PERSISTENCE_KEY,
    });
    saveFrameworkSelection(installPath, true);
    setPrimaryRuntimeFrameworkRoot(installPath);
    getFrameworkLogger().info(`windows_primary_runtime_framework_activated`, {
      safe: {
        architecture: process.arch,
        packageIdentity,
        packageVersion: installedPackage.packageVersion,
        activatedRuntimeSource: `primary-framework`,
      },
      sensitive: {},
    });
  } else {
    let reason = `not-installed`;
    persistedPackage == null
      ? (reason = `no-persisted-package`)
      : (packageIdentity ?? (reason = `untrusted-persisted-identity`));
    getFrameworkLogger().info(`windows_primary_runtime_framework_activation_skipped`, {
      safe: { architecture: process.arch, reason },
      sensitive: {},
    });
  }
}

// ---- 安装（原 mj/hj/bj）------------------------------------------------------

/** 框架 bundle 配置（`mj` 的第一个参数）。 */
export interface PrimaryRuntimeFrameworkBundleConfig {
  archiveUrl: string;
  bundleVersion?: string | null;
  archiveSizeBytes?: number | null;
  archiveSha256: string;
  internalCdnUrl?: string | null;
}

/** 下载进度回调参数。 */
export interface FrameworkDownloadProgress {
  downloadedBytes: number;
  totalBytes: number | null;
}

/**
 * 下载并安装 primary runtime framework（原 `mj`）。返回框架根目录。
 * 未启用 / addon 缺失 / bundle 版本缺失均抛 UpdateError。
 */
export async function installPrimaryRuntimeFramework(
  bundleConfig: PrimaryRuntimeFrameworkBundleConfig,
  signal: AbortSignal | undefined,
  getInternalUpdateCdnRequestHeaders:
    | ((feedUrl: string) => Promise<InternalUpdateCdnRequestHeaders | null | undefined>)
    | undefined,
  onTelemetryStageChange: ((stage: string) => void) | undefined,
  onDownloadProgress: ((progress: FrameworkDownloadProgress) => void) | undefined,
): Promise<string> {
  if (!isPrimaryRuntimeFrameworkEnabled())
    throw new UpdateError(
      `Windows primary runtime frameworks are disabled.`,
      `configuration-disabled`,
    );
  assertHttpsUrl(bundleConfig.archiveUrl, `Windows primary runtime framework package`);
  const nativeAddon = loadWindowsUpdaterAddon() as unknown as WindowsRuntimeFrameworkNativeAddon | null;
  if (nativeAddon == null)
    throw new UpdateError(
      `Windows primary runtime framework native addon is unavailable.`,
      `native-support-unavailable`,
    );
  if (bundleConfig.bundleVersion == null)
    throw new UpdateError(
      `Windows primary runtime framework bundle version is missing.`,
      `configuration-missing`,
    );
  const packageVersion = normalizeWindowsStoreBuildVersion(bundleConfig.bundleVersion) as string;
  const packageIdentity = buildMsixPackageIdentity(
    PRIMARY_RUNTIME_PACKAGE_NAME,
    packageVersion,
  ) as string;
  const frameworkRoot = await deployFrameworkPackage({
    nativeAddon,
    packageFamilyName: `${packageIdentity}_3k8sg7r9htsxt`,
    packageIdentity,
    packageLength: bundleConfig.archiveSizeBytes,
    packagePublisher: EXPECTED_PACKAGE_PUBLISHER,
    packageSha256: bundleConfig.archiveSha256,
    packageUrl: bundleConfig.archiveUrl,
    internalCdnUrl: bundleConfig.internalCdnUrl,
    getInternalUpdateCdnRequestHeaders,
    persistenceKey: PRIMARY_RUNTIME_PERSISTENCE_KEY,
    signal,
    packageVersion,
    onTelemetryStageChange,
    onDownloadProgress,
  });
  return (
    getFrameworkLogger().info(`windows_primary_runtime_framework_ready`, {
      safe: {
        bundleVersion: bundleConfig.bundleVersion,
        packageIdentity,
        packageVersion,
        architecture: process.arch,
      },
      sensitive: { frameworkRoot },
    }),
    frameworkRoot
  );
}

/** `hj` 的入参（部署参数）。 */
interface DeployFrameworkPackageOptions {
  nativeAddon: WindowsRuntimeFrameworkNativeAddon;
  packageFamilyName: string;
  packageIdentity: string;
  packageLength?: number | null;
  packagePublisher: string;
  packageSha256: string;
  packageUrl: string;
  internalCdnUrl?: string | null;
  getInternalUpdateCdnRequestHeaders?:
    (feedUrl: string) => Promise<InternalUpdateCdnRequestHeaders | null | undefined>;
  persistenceKey?: string;
  signal?: AbortSignal;
  packageVersion?: string;
  onTelemetryStageChange?: (stage: string) => void;
  onDownloadProgress?: (progress: FrameworkDownloadProgress) => void;
}

/**
 * 部署框架包（原 `hj`）：查询已装包 → 身份校验 → 版本不足时下载安装
 * （`bj`）→ 重新查询校验 → pin。返回 pin 的 installPath。
 */
async function deployFrameworkPackage({
  nativeAddon,
  packageFamilyName,
  packageIdentity,
  packageLength,
  packagePublisher,
  packageSha256,
  packageUrl,
  internalCdnUrl,
  getInternalUpdateCdnRequestHeaders,
  persistenceKey,
  signal,
  packageVersion,
  onTelemetryStageChange,
  onDownloadProgress,
}: DeployFrameworkPackageOptions): Promise<string> {
  const findFrameworkPackage = nativeAddon.findFrameworkPackage;
  const installFrameworkPackage = nativeAddon.installFrameworkPackage;
  const pinFrameworkPackageFn = nativeAddon.pinFrameworkPackage;
  if (findFrameworkPackage == null || installFrameworkPackage == null || pinFrameworkPackageFn == null)
    throw new UpdateError(
      `Windows runtime framework deployment support is unavailable.`,
      `native-support-unavailable`,
    );
  const expectedPackageFullName =
    packageVersion == null
      ? undefined
      : buildPackageFullName({ packageFamilyName, packageIdentity, packageVersion });
  onTelemetryStageChange?.(`query_framework`);
  let installedPackage =
    expectedPackageFullName == null
      ? await findFrameworkPackage(packageFamilyName)
      : await findFrameworkPackage(packageFamilyName, expectedPackageFullName);
  if (installedPackage != null) {
    onTelemetryStageChange?.(`verify_framework`);
    verifyFrameworkPackageIdentity({
      packageFamilyName,
      packageIdentity,
      packagePublisher,
      installedPackage,
    });
  }
  if (
    installedPackage == null ||
    (packageVersion != null && compareBuildVersions(installedPackage.packageVersion, packageVersion) < 0)
  ) {
    await downloadAndInstallFrameworkPackage({
      installPackage: installFrameworkPackage,
      stagingRoot: nativeAddon.getPackageLocalCachePath?.() ?? tmpdir(),
      packageIdentity,
      packageLength,
      packageSha256,
      packageUrl,
      internalCdnUrl,
      getInternalUpdateCdnRequestHeaders,
      signal,
      onTelemetryStageChange,
      onDownloadProgress,
    });
    onTelemetryStageChange?.(`query_framework`);
    installedPackage =
      expectedPackageFullName == null
        ? await findFrameworkPackage(packageFamilyName)
        : await findFrameworkPackage(packageFamilyName, expectedPackageFullName);
    if (installedPackage == null)
      throw new UpdateError(
        `Windows runtime framework ${packageIdentity} was not installed.`,
        `package-not-installed`,
      );
    onTelemetryStageChange?.(`verify_framework`);
    verifyFrameworkPackageIdentity({
      packageFamilyName,
      packageIdentity,
      packagePublisher,
      installedPackage,
    });
  }
  if (packageVersion != null && installedPackage.packageVersion !== packageVersion)
    throw new UpdateError(
      `Windows runtime framework ${packageIdentity} version mismatch.`,
      `version-mismatch`,
    );
  return (
    signal?.throwIfAborted(),
    onTelemetryStageChange?.(`pin_framework`),
    pinFrameworkPackage({
      installedPackage,
      nativeAddon,
      packageFamilyName,
      packageIdentity,
      persistenceKey,
    })
  );
}

/** `bj` 的入参（下载安装参数）。 */
interface DownloadAndInstallFrameworkPackageOptions {
  installPackage: (msixPath: string) => Promise<void> | void;
  stagingRoot: string;
  packageIdentity: string;
  packageLength?: number | null;
  packageSha256: string;
  packageUrl: string;
  internalCdnUrl?: string | null;
  getInternalUpdateCdnRequestHeaders?:
    (feedUrl: string) => Promise<InternalUpdateCdnRequestHeaders | null | undefined>;
  signal?: AbortSignal;
  onTelemetryStageChange?: (stage: string) => void;
  onDownloadProgress?: (progress: FrameworkDownloadProgress) => void;
}

/**
 * 下载并安装框架包 MSIX（原 `bj`）：staging 目录 + 流式下载
 * （120s 无进度看门狗、sha256/长度校验、100ms 节流进度）+ 安装 + 清理。
 *
 * 注意：原代码的下载闭包声明了第二个参数（下载来源标签）但调用时只传了
 * URL，因此失败遥测里的 `source` 恒为 `blob`——此处按原样保留。
 */
async function downloadAndInstallFrameworkPackage({
  installPackage,
  stagingRoot,
  packageIdentity,
  packageLength,
  packageSha256,
  packageUrl,
  internalCdnUrl,
  getInternalUpdateCdnRequestHeaders,
  signal,
  onTelemetryStageChange,
  onDownloadProgress,
}: DownloadAndInstallFrameworkPackageOptions): Promise<void> {
  signal?.throwIfAborted();
  onTelemetryStageChange?.(`create_staging_directory`);
  const stagingDirectory = await mkdtemp(join(stagingRoot, `codex-windows-runtime-framework-`));
  const msixPath = join(stagingDirectory, `${packageIdentity}.msix`);
  try {
    const download = async (url: string, downloadSource?: string | undefined) => {
      onTelemetryStageChange?.(`download_framework`);
      const stallController = new AbortController();
      const stallTimeout = setTimeout(
        () =>
          stallController.abort(
            new DOMException(
              `Windows runtime framework download made no progress for 120 seconds.`,
              `TimeoutError`,
            ),
          ),
        12e4,
      );
      const combinedSignal =
        signal == null ? stallController.signal : AbortSignal.any([signal, stallController.signal]);
      let response: Response | undefined;
      let receivedBytes = 0;
      let lastProgressReportAt = 0;
      try {
        onDownloadProgress?.({ downloadedBytes: 0, totalBytes: packageLength ?? null });
        response = await net.fetch(url, { signal: combinedSignal });
        if (!response.ok || response.body == null)
          throw new UpdateError(
            `Windows runtime framework package download failed with status ${response.status}.`,
            `http-error`,
            response.status,
          );
        response.url && assertHttpsUrl(response.url, `Windows runtime framework package response`);
        const hash = createHash(`sha256`);
        const fileHandle = await openFile(msixPath, `wx`);
        try {
          await response.body.pipeTo(
            new WritableStream({
              async write(chunk) {
                chunk.byteLength > 0 && stallTimeout.refresh();
                receivedBytes += chunk.byteLength;
                hash.update(chunk);
                await fileHandle.write(chunk);
                const now = Date.now();
                now - lastProgressReportAt >= 100 &&
                  (onDownloadProgress?.({
                    downloadedBytes: receivedBytes,
                    totalBytes: packageLength ?? null,
                  }),
                  (lastProgressReportAt = now));
              },
            }),
            { signal: combinedSignal },
          );
        } finally {
          await fileHandle.close();
        }
        onTelemetryStageChange?.(`verify_framework_download`);
        onDownloadProgress?.({ downloadedBytes: receivedBytes, totalBytes: packageLength ?? null });
        if (packageLength != null && receivedBytes !== packageLength)
          throw new UpdateError(
            `Windows runtime framework ${packageIdentity} length mismatch.`,
            `length-mismatch`,
          );
        if (hash.digest(`hex`) !== packageSha256.toLowerCase())
          throw new UpdateError(
            `Windows runtime framework ${packageIdentity} checksum mismatch.`,
            `checksum-mismatch`,
          );
      } catch (error) {
        throw (
          getFrameworkLogger().warning(`Windows runtime framework download failed`, {
            safe: {
              ...classifyUpdateFailure(
                combinedSignal.aborted ? combinedSignal.reason : error,
                signal,
              ),
              source: downloadSource == null ? `blob` : `protected-cdn`,
              expectedBytes: packageLength,
              receivedBytes,
              httpStatus: response?.status,
              responseIsHtml: response?.headers
                .get(`content-type`)
                ?.toLowerCase()
                .startsWith(`text/html`),
            },
            sensitive: { error },
          }),
          combinedSignal.throwIfAborted(),
          error
        );
      } finally {
        clearTimeout(stallTimeout);
        stallController.abort();
      }
    };
    // 原代码只传 URL（downloadSource 恒 undefined → source 恒 'blob'）。
    await download(packageUrl);
    signal?.throwIfAborted();
    onTelemetryStageChange?.(`install_framework`);
    await installPackage(msixPath);
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true }).catch((error) => {
      throw (onTelemetryStageChange?.(`cleanup`), error);
    });
  }
}

// ---- pin / 选择持久化（原 gj/_j/vj/yj）--------------------------------------

/**
 * 保存框架选择（原 `gj`）：从 pinned 缓存里反查 installPath 对应的 handle，
 * 调 native addon 持久化（或仅本次会话）。
 */
export function saveFrameworkSelection(installPath: string, persist = false): void {
  const nativeAddon = loadWindowsUpdaterAddon() as unknown as WindowsRuntimeFrameworkNativeAddon | null;
  const pinned = [...pinnedFrameworkPackages.values()].find(
    (entry) => entry.installPath === installPath && entry.nativeAddon === nativeAddon,
  );
  if (pinned == null || nativeAddon?.saveFrameworkSelection == null)
    throw new UpdateError(
      `Windows primary runtime framework selection could not be saved.`,
      `pin-unavailable`,
    );
  nativeAddon.saveFrameworkSelection(pinned.handle, persist);
}

/** `_j` 的入参。 */
interface PinFrameworkPackageOptions {
  installedPackage: InstalledFrameworkPackage;
  nativeAddon: WindowsRuntimeFrameworkNativeAddon;
  packageFamilyName: string;
  packageIdentity: string;
  persistenceKey?: string;
}

/**
 * pin 框架包（原 `_j`）：已 pin 过（同 addon）直接复用 installPath；
 * 否则调 native pin，校验返回的包名/路径一致（不一致回滚 unpin），
 * 记入缓存；PrimaryRuntime 键额外请求延迟系统清理。返回 installPath。
 */
function pinFrameworkPackage({
  installedPackage,
  nativeAddon,
  packageFamilyName,
  packageIdentity,
  persistenceKey,
}: PinFrameworkPackageOptions): string {
  if (pinnedFrameworkPackages.get(installedPackage.packageFullName)?.nativeAddon === nativeAddon)
    return installedPackage.installPath;
  const pin =
    persistenceKey == null
      ? nativeAddon.pinFrameworkPackage?.(packageFamilyName, installedPackage.packageFullName)
      : nativeAddon.pinFrameworkPackage?.(
          packageFamilyName,
          installedPackage.packageFullName,
          persistenceKey,
        );
  if (pin == null)
    throw new UpdateError(
      `Windows runtime framework ${packageIdentity} could not be pinned.`,
      `pin-unavailable`,
    );
  if (pin.packageFullName !== installedPackage.packageFullName || pin.installPath !== installedPackage.installPath)
    throw (
      nativeAddon.unpinFrameworkPackage?.(pin.handle),
      new UpdateError(
        `Windows runtime framework ${packageIdentity} pin did not match.`,
        `pin-mismatch`,
      )
    );
  return (
    pinnedFrameworkPackages.set(installedPackage.packageFullName, {
      handle: pin.handle,
      installPath: pin.installPath,
      nativeAddon,
    }),
    persistenceKey === PRIMARY_RUNTIME_PERSISTENCE_KEY &&
      deferFrameworkPackageRemoval(nativeAddon, pin.handle),
    pin.installPath
  );
}

/** 请求延迟系统清理 pinned 包（原 `vj`，尽力而为）。 */
async function deferFrameworkPackageRemoval(
  nativeAddon: WindowsRuntimeFrameworkNativeAddon,
  handle: unknown,
): Promise<void> {
  try {
    const status = await nativeAddon.deferFrameworkPackageRemoval?.(handle);
    getFrameworkLogger().info(`windows_primary_runtime_framework_removal_deferred`, {
      safe: { status: status ? `requested` : `unsupported` },
      sensitive: {},
    });
  } catch (error) {
    getFrameworkLogger().warning(`windows_primary_runtime_framework_deferred_removal_failed`, {
      safe: { status: `failed` },
      sensitive: { error },
    });
  }
}

/**
 * 解析持久化的包 family name（原 `yj`）：必须是
 * `OpenAI.CodexPrimaryRuntime.v<四段横线版本>_3k8sg7r9htsxt`，返回身份部分。
 */
function parseTrustedPackageIdentity(packageFamilyName: string): string | null {
  if (!packageFamilyName.endsWith(`_3k8sg7r9htsxt`)) return null;
  const identity = packageFamilyName.slice(0, -14);
  return /^OpenAI\.CodexPrimaryRuntime\.v\d+-\d+-\d+-\d+$/.test(identity) ? identity : null;
}

// ---- 身份/URL 校验（原 xj/Sj/Cj）---------------------------------------------

/** `xj` 的入参。 */
interface VerifyFrameworkPackageIdentityOptions {
  installedPackage: InstalledFrameworkPackage;
  packageFamilyName: string;
  packageIdentity: string;
  packagePublisher: string;
}

/** 校验已装包与预期身份完全一致（原 `xj`），不一致抛 identity-mismatch。 */
function verifyFrameworkPackageIdentity({
  installedPackage,
  packageFamilyName,
  packageIdentity,
  packagePublisher,
}: VerifyFrameworkPackageIdentityOptions): void {
  if (
    installedPackage.packageIdentity !== packageIdentity ||
    installedPackage.packageFamilyName !== packageFamilyName ||
    installedPackage.packagePublisher !== packagePublisher ||
    installedPackage.architecture !== process.arch
  )
    throw new UpdateError(
      `Windows runtime framework ${packageIdentity} identity mismatch.`,
      `identity-mismatch`,
    );
}

/** 构造带版本/架构的 package full name（原 `Sj`）。 */
function buildPackageFullName({
  packageFamilyName,
  packageIdentity,
  packageVersion,
}: {
  packageFamilyName: string;
  packageIdentity: string;
  packageVersion: string;
}): string {
  return `${packageIdentity}_${packageVersion}_${process.arch}__${packageFamilyName.slice(
    packageFamilyName.lastIndexOf(`_`) + 1,
  )}`;
}

/** 校验 URL 必须 HTTPS（原 `Cj`），否则抛 https-required。 */
function assertHttpsUrl(url: string, label: string): void {
  if (new URL(url).protocol !== `https:`)
    throw new UpdateError(`${label} requires HTTPS.`, `https-required`);
}
