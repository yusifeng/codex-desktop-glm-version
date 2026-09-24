// Windows MSIX 更新器（Windows 专属，macOS 上静态重写 + 类型检查）。
//
// 对应 bootstrap-C4dRql4x.ts 19938-20423 行：
//   - `ST`（61s uptime 下限）、`CT`（waitForMinimumUptime：安装器可能在
//     Windows 安装会话里刚装完本包，立即操作 MSIX 会失败，等 uptime 过阈值）
//   - `wT`（logger）、`TT`（createRequire(__filename)）、`ET`（"installing" 目录）
//   - `DT` class MsixUpdater：manifest 校验（packageIdentity/publisher/arch）、
//     MSIX 下载（sha256/长度校验）、stage（native addon）、安装
//     （activateStagedPackage，正常路径是系统直接重启应用）
//   - `OT`（loadWindowsUpdaterAddon：createRequire 加载
//     process.resourcesPath/native/windows-updater.node，失败返回 null）
//
// 关键语义（逐字保持）：
//   - 安装成功路径 = activateStagedPackage 不返回（系统重启应用）；
//     若返回了，视为「Windows 完成更新但没有重启应用」→ 抛错。
//   - 安装被用户取消（hresult 0x800704C7 = 2147943623）静默返回。
//   - stage 遇 0x80073D08（2147958056）且允许服务提权安装（allowServiceInstallElevation）
//     时吞掉（服务稍后完成 stage）。
//   - manifest/package URL 强制 https；下载后用 native addon 复核 MSIX 身份。

import { createHash } from "node:crypto";
import { mkdir, open, readdir, readFile, realpath, rename, rm, writeFile, link } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { createRequire } from "node:module";
import { basename, join } from "node:path";
import { Readable } from "node:stream";
import { app, dialog, net } from "electron";
import { memoizedTaggedLogger } from "@chunk/logger";
import { compareBuildVersions } from "./backend-appcast";

// 同源引用：windows-runtime-framework 等模块经本模块取 build 版本比较工具
// （原 yT/bT 定义在 backend-appcast 区间）。
export { compareBuildVersions, isDottedNumericBuildVersion } from "./backend-appcast";

/** 日志（原 `wT`）。 */
const logger = memoizedTaggedLogger("windows-updater");

/** 原生 addon 的 require（原 `TT`）。 */
const requireNative = createRequire(__filename);

/** 安装中转目录名（原 `ET`）。 */
const INSTALLING_DIRECTORY_NAME = "installing";

/** uptime 阈值（原 `ST`，61 秒）。 */
const MIN_UPTIME_MS = 61_000;

/**
 * 等待进程 uptime 超过阈值（原 `CT`）。
 * 应用可能是刚被安装器拉起的（uptime 很短），此时立即安装更新可能失败。
 */
export async function waitForMinimumUptime(): Promise<void> {
  const remainingMs = MIN_UPTIME_MS - process.uptime() * 1e3;
  if (remainingMs > 0) await sleep(remainingMs);
}

// ---- native addon 面 ---------------------------------------------------------

/** windows-updater.node 的导出面（从 DT/IT 类的调用点反推）。 */
export interface WindowsUpdaterAddon {
  /** 当前包的 package family name（如 OpenAI.ChatGPT-xxxxxxx）。 */
  getCurrentPackageFamily(): string;
  /** 清理 ARM64 进程树（更新安装前调用）。 */
  armProcessTreeCleanup(): void;
  /** 激活已 stage 的 MSIX 包；正常不返回（系统重启应用）。 */
  activateStagedPackage(
    packagePath: string,
    onProgress: (percent: number) => void,
    allowServiceInstallElevation: boolean,
  ): Promise<void>;
  /** stage MSIX 包（拷到系统位置并注册）。 */
  stagePackage(packagePath: string): Promise<void>;
  /** 读取 MSIX 元数据（身份/发布者/架构）。 */
  readPackageMetadata(packagePath: string): Promise<{
    packageIdentity: string;
    packagePublisher: string;
    architecture: string;
  }>;
  /** Windows Store 静默下载检查（Store 更新器用）。 */
  trySilentDownloadStoreUpdates(onProgress: (percent: number) => void): Promise<{
    canSilentlyDownload: boolean;
    completed: boolean;
    hasUpdate: boolean;
    overallState: string;
  }>;
  /** Windows Store 静默下载并安装（Store 更新器用；进度回调含部署阶段）。 */
  trySilentDownloadAndInstallStoreUpdates(
    onProgress: (percent: number, state?: string) => void,
  ): Promise<{
    canSilentlyDownload: boolean;
    completed: boolean;
    hasUpdate: boolean;
    overallState: string;
  }>;
}

/** 含 Windows HRESULT 的错误。 */
interface HResultError extends Error {
  hresult?: number;
}

// ---- MsixUpdater（原 DT）-----------------------------------------------------

/** 更新生命周期状态（原字符串字面量集合；"downloading" 为本更新器新增态）。 */
export type UpdateLifecycleState = "idle" | "checking" | "downloading" | "ready" | "installing";

/** 更新信息检查结果（原 checkForUpdateInformation 的返回形状；status 值逐字保持）。 */
export type UpdateInformationResult =
  | { status: "busy" }
  | { status: "up_to_date" }
  | { status: "available"; availableVersion: null; availableBuildVersion: string };

/** MsixUpdater 构造选项（SparkleManager 的 initializeWindowsUpdater 传入）。 */
export interface MsixUpdaterOptions {
  /** 更新 manifest URL（https）。 */
  manifestUrl: string;
  /** 当前包的 package identity（与 manifest/MSIX 复核）。 */
  packageIdentity: string;
  /** 当前包的 publisher（与 manifest/MSIX 复核）。 */
  packagePublisher: string;
  /** 当前 build 版本（点分数字）。 */
  buildVersion: string;
  /** windows-updater.node addon 实例。 */
  nativeAddon: WindowsUpdaterAddon;
  /** 轮询间隔；0 = 不轮询。 */
  checkIntervalMs: number;
  /** 初始化时是否立即检查一次（默认 true）。 */
  checkForUpdatesOnInitialize?: boolean;
  /** build 版本 → 直连 MSIX package URL（Store 分发用；无则从 manifest 下载）。 */
  getPackageUrlForBuildVersion?(buildVersion: string): string | null;
  /** 是否允许服务级提权安装（stage 0x80073D08 时吞错）。 */
  allowServiceInstallElevation?: boolean;
  onBeforeInstall?(): void | Promise<void>;
  onUpdateReadyChanged?(isReady: boolean): void;
  onUpdateLifecycleStateChanged?(state: UpdateLifecycleState): void;
  onDownloadProgressChanged?(percent: number | null): void;
  onInstallProgressChanged?(percent: number | null): void;
}

/** manifest 的归一化形状。 */
interface ValidatedManifest {
  buildVersion: string;
  packageIdentity: string;
  packagePublisher: string;
  packageUrl: string;
  length: number | null;
  sha256: string | null;
}

/** staged-msix.json 的形状。 */
interface StagedUpdateState {
  buildVersion: string;
  length: number | null;
  packagePath: string;
  sha256: string | null;
}

/**
 * Windows MSIX 更新器（原 `DT`）。
 * 流程：manifest 校验 → 下载（进度/校验）→ addon stage → 写 staged-msix.json；
 * 安装：把 staged 包硬链接到 installing/ 后 activateStagedPackage。
 */
export class MsixUpdater {
  private options: MsixUpdaterOptions;
  private stateRoot = "";
  isUpdateReady = false;
  downloadProgressPercent: number | null = null;
  installProgressPercent: number | null = null;
  private lastUnavailableReason: string | null = null;
  private inFlightCheck: Promise<"up-to-date" | "update-ready"> | null = null;
  private inFlightManualCheck: Promise<void> | null = null;
  private inFlightInstall: Promise<void> | null = null;

  constructor(options: MsixUpdaterOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    if (!app.isPackaged) {
      this.lastUnavailableReason = "dev build";
      return;
    }
    if (!this.options.manifestUrl.trim()) {
      this.lastUnavailableReason = "missing packaged windows update url";
      return;
    }
    if (!this.options.packageIdentity.trim()) {
      this.lastUnavailableReason = "missing packaged windows package identity";
      return;
    }
    if (!this.options.packagePublisher.trim()) {
      this.lastUnavailableReason = "missing packaged windows package publisher";
      return;
    }
    const packageFamily = this.options.nativeAddon.getCurrentPackageFamily().trim();
    if (!packageFamily) {
      this.lastUnavailableReason = "missing current windows package family";
      return;
    }
    this.options.nativeAddon.armProcessTreeCleanup();
    this.stateRoot = join(app.getPath("userData"), "windows-msix-updater", packageFamily);
    await mkdir(this.stateRoot, { recursive: true });
    this.stateRoot = await realpath(this.stateRoot);
    // 上次残留的 installing/ 目录清掉。
    await rm(join(this.stateRoot, INSTALLING_DIRECTORY_NAME), { recursive: true, force: true });
    await this.reconcileLocalPreparedState();
    if (this.options.checkIntervalMs > 0) {
      setInterval(() => {
        void this.checkForUpdatesInBackground();
      }, this.options.checkIntervalMs).unref();
    }
    if (this.options.checkForUpdatesOnInitialize !== false)
      void this.checkForUpdatesInBackground();
  }

  hasUpdater(): boolean {
    return this.lastUnavailableReason == null;
  }

  getUnavailableReason(): string | null {
    return this.lastUnavailableReason;
  }

  getIsUpdateReady(): boolean {
    return this.isUpdateReady;
  }

  async checkForUpdates(): Promise<void> {
    const check = this.inFlightManualCheck ?? this.performManualCheck().catch(() => {});
    this.inFlightManualCheck = check;
    try {
      await check;
    } finally {
      if (this.inFlightManualCheck === check) this.inFlightManualCheck = null;
    }
  }

  async checkForUpdatesInBackground(): Promise<void> {
    if (this.inFlightManualCheck) {
      await this.inFlightManualCheck;
      return;
    }
    if (!this.inFlightInstall) await this.runCheck({ manual: false }).catch(() => {});
  }

  async installUpdatesIfAvailable(): Promise<void> {
    if (this.inFlightInstall) {
      await this.inFlightInstall;
      return;
    }
    const install = this.installPreparedUpdate();
    this.inFlightInstall = install;
    try {
      await install;
    } catch (error) {
      this.setInstallProgressPercent(null);
      // 2147943623 = 0x800704C7（ERROR_CANCELLED）：用户取消安装，静默返回。
      if (isHResultError(error, 2147943623)) return;
      logger().error("Failed to install prepared Windows update", {
        safe: {},
        sensitive: { error },
      });
      await this.showActionError({
        message: `Unable to install the ${app.getName()} update.`,
        detail: "Try checking for updates again.",
      });
    } finally {
      if (this.inFlightInstall === install) this.inFlightInstall = null;
    }
  }

  /** 单次检查（去重并共享 in-flight；manual 时弹结果对话框）。 */
  private async runCheck({ manual }: { manual: boolean }): Promise<"up-to-date" | "update-ready"> {
    const check = this.inFlightCheck ?? this.performCheck();
    this.inFlightCheck = check;
    try {
      const outcome = await check;
      if (manual) await this.showManualCheckResult(outcome);
      return outcome;
    } catch (error) {
      this.setUpdateLifecycleState(this.isUpdateReady ? "ready" : "idle");
      logger().error("Failed to check for Windows updates", { safe: {}, sensitive: { error } });
      if (manual)
        await this.showActionError({
          message: `Unable to check for ${app.getName()} updates.`,
          detail: error instanceof Error ? error.message : String(error),
        });
      throw error;
    } finally {
      if (this.inFlightCheck === check) this.inFlightCheck = null;
    }
  }

  /** 手动检查：ready 时直接告知；安装中则跳过；否则前台跑一次检查。 */
  private async performManualCheck(): Promise<void> {
    if (this.inFlightInstall) return;
    if (this.isUpdateReady && this.inFlightCheck == null) {
      await this.showManualCheckResult("update-ready");
      return;
    }
    await this.runCheck({ manual: true });
  }

  /** 拉取 manifest 并校验必需字段（不校验身份匹配）。 */
  private async fetchManifest(): Promise<ValidatedManifest> {
    const response = await net.fetch(this.options.manifestUrl);
    if (!response.ok)
      throw Error(`Windows update manifest request failed (${response.status} ${response.statusText})`);
    this.assertFetchedHttpsUrl(response.url, this.options.manifestUrl, "manifest");
    const manifest = JSON.parse(await response.text());
    if (
      typeof manifest.buildVersion != "string" ||
      typeof manifest.packageIdentity != "string" ||
      (typeof manifest.packagePublisher != "string" &&
        this.options.getPackageUrlForBuildVersion == null)
    )
      throw Error("Windows update manifest is missing required fields.");
    const buildVersion = manifest.buildVersion.trim();
    const fallbackPackageUrl =
      this.options.getPackageUrlForBuildVersion?.(buildVersion) ?? null;
    const selectedPackage = this.selectManifestPackage(manifest, fallbackPackageUrl);
    return {
      buildVersion,
      packageIdentity: manifest.packageIdentity.trim(),
      packagePublisher:
        typeof manifest.packagePublisher == "string"
          ? manifest.packagePublisher.trim()
          : this.options.packagePublisher,
      ...selectedPackage,
    };
  }

  /** 从 manifest 选出本架构的 package 条目（packages[] / 单条 / 直连 URL 回退）。 */
  private selectManifestPackage(
    manifest: any,
    fallbackPackageUrl: string | null,
  ): { packageUrl: string; length: number | null; sha256: string | null } {
    if (Array.isArray(manifest.packages)) {
      const packageEntry = manifest.packages.find((entry: any) => entry.arch === process.arch);
      if (packageEntry == null)
        throw Error(`Windows update manifest is missing a package for ${process.arch}.`);
      return this.validateManifestPackage(packageEntry);
    }
    if (typeof manifest.packageUrl != "string" && fallbackPackageUrl != null)
      return { packageUrl: this.validatePackageUrl(fallbackPackageUrl), length: null, sha256: null };
    return this.validateManifestPackage(manifest);
  }

  /** 校验 manifest package 条目（packageUrl/sha256/length）。 */
  private validateManifestPackage(entry: any): {
    packageUrl: string;
    sha256: string;
    length: number;
  } {
    if (typeof entry.packageUrl != "string" || typeof entry.sha256 != "string" || typeof entry.length != "number")
      throw Error("Windows update manifest is missing required fields.");
    return {
      packageUrl: this.validatePackageUrl(entry.packageUrl),
      sha256: entry.sha256.trim().toLowerCase(),
      length: entry.length,
    };
  }

  /** 校验 https 并归一化 package URL。 */
  private validatePackageUrl(packageUrl: string): string {
    const parsed = new URL(packageUrl.trim());
    if (parsed.protocol !== "https:")
      throw Error("Windows update package URL must use https transport.");
    return parsed.toString();
  }

  /** 下载 MSIX 到 stateRoot，校验长度与 sha256（进度/校验逐字节流式）。 */
  private async downloadUpdatePackage(manifest: ValidatedManifest): Promise<{
    length: number;
    packagePath: string;
    sha256: string;
  }> {
    const packageUrl = manifest.packageUrl;
    const fileName = decodeURIComponent(basename(new URL(packageUrl).pathname)).trim();
    if (fileName === "" || !fileName.toLowerCase().endsWith(".msix"))
      throw Error(`Invalid Windows update package URL '${packageUrl}'.`);
    const packagePath = join(this.stateRoot, fileName);
    const downloadPath = `${packagePath}.download`;
    await this.cleanupDownloadedPackages(downloadPath);

    const response = await net.fetch(packageUrl);
    if (!response.ok || response.body == null)
      throw Error(`Windows update download failed (${response.status} ${response.statusText})`);
    this.assertFetchedHttpsUrl(response.url, packageUrl, "package");

    const hash = createHash("sha256");
    let receivedBytes = 0;
    const contentLength = Number(response.headers.get("content-length"));
    const expectedLength =
      manifest.length ?? (Number.isFinite(contentLength) && contentLength > 0 ? contentLength : null);
    this.setDownloadProgressPercent(0);

    const bodyStream = Readable.fromWeb(response.body as any);
    const file = await open(downloadPath, "w");
    try {
      for await (const chunk of bodyStream) {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any);
        receivedBytes += data.length;
        if (expectedLength != null && expectedLength > 0)
          this.setDownloadProgressPercent((receivedBytes / expectedLength) * 100);
        hash.update(data);
        await file.write(data);
      }
    } finally {
      await file.close();
    }
    this.setDownloadProgressPercent(100);

    const digest = hash.digest("hex").toLowerCase();
    if (manifest.length != null && receivedBytes !== manifest.length) {
      await rm(downloadPath, { force: true });
      throw Error(
        `Downloaded MSIX length mismatch (expected ${manifest.length}, got ${receivedBytes}).`,
      );
    }
    if (manifest.sha256 != null && digest !== manifest.sha256) {
      await rm(downloadPath, { force: true });
      throw Error(`Downloaded MSIX checksum mismatch (expected ${manifest.sha256}, got ${digest}).`);
    }
    await rename(downloadPath, packagePath);
    return { length: receivedBytes, packagePath, sha256: digest };
  }

  /**
   * 安装已 stage 的更新（原 installPreparedUpdate）。
   * 正常路径：activateStagedPackage 不返回（系统重启）；返回了就抛错。
   * staged 的 packagePath 可能是 https 直连 URL（Store 分发）。
   */
  private async installPreparedUpdate(): Promise<void> {
    const staged = await this.readStageState();
    if (staged == null) throw Error("Install requested without a staged Windows update.");
    const installingDirectory = join(this.stateRoot, INSTALLING_DIRECTORY_NAME);
    const isRemotePackagePath = staged.packagePath.startsWith("https:");
    const packagePathForInstall = isRemotePackagePath
      ? staged.packagePath
      : join(installingDirectory, basename(staged.packagePath));
    if (!isRemotePackagePath) {
      await mkdir(installingDirectory, { recursive: true });
      await link(staged.packagePath, packagePathForInstall);
    }
    try {
      this.setUpdateReady(false);
      this.setInstallProgressPercent(0);
      await waitForMinimumUptime();
      await this.options.onBeforeInstall?.();
      await this.options.nativeAddon.activateStagedPackage(
        packagePathForInstall,
        (percent) => {
          this.setInstallProgressPercent(percent);
        },
        this.options.allowServiceInstallElevation === true,
      );
      // activateStagedPackage 正常不返回；能走到这里说明系统没重启应用。
      throw Error("Windows completed the update without restarting the app.");
    } catch (error) {
      await this.reconcileLocalPreparedState();
      this.setInstallProgressPercent(null);
      this.setUpdateLifecycleState(this.isUpdateReady ? "ready" : "idle");
      throw error;
    } finally {
      await rm(installingDirectory, { recursive: true, force: true });
    }
  }

  /** 手动检查结果弹窗（原 showManualCheckResult）。 */
  private async showManualCheckResult(outcome: "up-to-date" | "update-ready"): Promise<void> {
    if (outcome === "update-ready") {
      await dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        defaultId: 0,
        noLink: true,
        message: `${app.getName()} update is ready to install.`,
      });
      return;
    }
    await dialog.showMessageBox({
      type: "info",
      buttons: ["OK"],
      defaultId: 0,
      noLink: true,
      message: `${app.getName()} is up to date.`,
    });
  }

  /** 启动时复核本地 staged 状态：过期/无效则丢弃，有效则置 ready。 */
  private async reconcileLocalPreparedState(): Promise<void> {
    const staged = await this.readStageState();
    if (staged == null) {
      this.setUpdateReady(false);
      return;
    }
    if (compareBuildVersions(staged.buildVersion, this.options.buildVersion) <= 0) {
      await this.discardPreparedUpdate();
      return;
    }
    this.setUpdateReady(true);
    this.setUpdateLifecycleState("ready");
  }

  /** 读取 staged-msix.json；无效时告警并删除。 */
  private async readStageState(): Promise<StagedUpdateState | null> {
    const statePath = this.getStageStatePath();
    try {
      const raw = JSON.parse(await readFile(statePath, "utf8"));
      if (
        typeof raw.buildVersion != "string" ||
        (typeof raw.length != "number" && raw.length != null) ||
        typeof raw.packagePath != "string" ||
        (typeof raw.sha256 != "string" && raw.sha256 != null)
      )
        throw Error("missing required fields");
      const trimmedPackagePath = raw.packagePath.trim();
      if (trimmedPackagePath === "") throw Error("missing required package path");
      const packagePath = trimmedPackagePath.startsWith("https:")
        ? this.validatePackageUrl(trimmedPackagePath)
        : join(this.stateRoot, decodeURIComponent(basename(trimmedPackagePath)));
      return {
        buildVersion: raw.buildVersion.trim(),
        length: raw.length ?? null,
        packagePath,
        sha256: raw.sha256?.trim().toLowerCase() ?? null,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") return null;
      logger().warning("Discarding invalid Windows updater staged state.", {
        safe: {},
        sensitive: { error, statePath },
      });
      await rm(statePath, { force: true });
      return null;
    }
  }

  /** 清掉 stateRoot 下散落的 .msix/.download（keepPath 除外）。 */
  private async cleanupDownloadedPackages(keepPath?: string | null): Promise<void> {
    const entries = await readdir(this.stateRoot, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => {
          if (!entry.isFile()) return false;
          const name = entry.name.toLowerCase();
          return name.endsWith(".msix") || name.endsWith(".download");
        })
        .map((entry) => {
          const entryPath = join(this.stateRoot, entry.name);
          return keepPath != null && entryPath === keepPath
            ? Promise.resolve()
            : rm(entryPath, { force: true });
        }),
    );
  }

  /** 实际响应 URL 必须仍是 https（防重定向降级）。 */
  private assertFetchedHttpsUrl(actualUrl: string, requestedUrl: string, label: string): void {
    const finalUrl = actualUrl.trim() || requestedUrl;
    if (new URL(finalUrl).protocol !== "https:")
      throw Error(`Windows update ${label} URL must use https transport.`);
  }

  /** manifest + 本包身份匹配校验。 */
  private async fetchValidatedManifest(): Promise<ValidatedManifest> {
    const manifest = await this.fetchManifest();
    if (manifest.packageIdentity !== this.options.packageIdentity)
      throw Error(
        `Windows update manifest targets package identity '${manifest.packageIdentity}' instead of '${this.options.packageIdentity}'.`,
      );
    if (manifest.packagePublisher !== this.options.packagePublisher)
      throw Error(
        `Windows update manifest targets package publisher '${manifest.packagePublisher}' instead of '${this.options.packagePublisher}'.`,
      );
    return manifest;
  }

  /** 安静模式的更新信息检查（有 in-flight 时返回 busy）。 */
  async checkForUpdateInformation(): Promise<UpdateInformationResult> {
    if (this.inFlightCheck || this.inFlightManualCheck || this.inFlightInstall)
      return { status: "busy" };
    const manifest = await this.fetchValidatedManifest();
    return compareBuildVersions(manifest.buildVersion, this.options.buildVersion) <= 0
      ? { status: "up_to_date" }
      : {
          status: "available",
          availableVersion: null,
          availableBuildVersion: manifest.buildVersion,
        };
  }

  /** 实际执行一次检查（下载 + stage + 落盘 staged 状态）。 */
  private async performCheck(): Promise<"up-to-date" | "update-ready"> {
    if (!this.isUpdateReady) this.setUpdateLifecycleState("checking");
    const manifest = await this.fetchValidatedManifest();
    if (compareBuildVersions(manifest.buildVersion, this.options.buildVersion) <= 0) {
      await this.discardPreparedUpdate();
      this.setUpdateLifecycleState("idle");
      return "up-to-date";
    }
    const existingStaged = await this.readStageState();
    if (
      existingStaged != null &&
      existingStaged.buildVersion === manifest.buildVersion &&
      (manifest.length == null || existingStaged.length === manifest.length) &&
      (manifest.sha256 == null || existingStaged.sha256 === manifest.sha256)
    ) {
      this.setUpdateReady(true);
      this.setUpdateLifecycleState("ready");
      return "update-ready";
    }
    if (existingStaged != null) await this.discardPreparedUpdate();
    this.setUpdateLifecycleState("downloading");

    let stagedState: StagedUpdateState;
    if (this.options.getPackageUrlForBuildVersion != null) {
      // Store 分发：直连 package URL，交给 addon stage（无本地校验）。
      stagedState = {
        buildVersion: manifest.buildVersion,
        length: null,
        packagePath: manifest.packageUrl,
        sha256: null,
      };
    } else {
      const downloaded = await this.downloadUpdatePackage(manifest);
      await this.assertDownloadedPackageMatchesManifest(downloaded.packagePath);
      stagedState = { buildVersion: manifest.buildVersion, ...downloaded };
    }
    try {
      await this.options.nativeAddon.stagePackage(stagedState.packagePath);
    } catch (error) {
      // 2147958056 = 0x80073D28：服务级 stage 需要提权；允许提权安装时吞掉
      // （稍后由服务完成 stage）。
      if (
        !this.options.allowServiceInstallElevation ||
        !isHResultError(error, 2147958056)
      )
        throw error;
    }
    const statePath = this.getStageStatePath();
    await writeFile(`${statePath}.tmp`, JSON.stringify(stagedState, null, 2));
    await rename(`${statePath}.tmp`, statePath);
    this.setUpdateReady(true);
    this.setUpdateLifecycleState("ready");
    return "update-ready";
  }

  /** 下载后的 MSIX 身份复核（identity/publisher/arch）。 */
  private async assertDownloadedPackageMatchesManifest(packagePath: string): Promise<void> {
    const metadata = await this.options.nativeAddon.readPackageMetadata(packagePath);
    if (metadata.packageIdentity !== this.options.packageIdentity)
      throw Error(
        `Downloaded MSIX has package identity '${metadata.packageIdentity}' instead of '${this.options.packageIdentity}'.`,
      );
    if (metadata.packagePublisher !== this.options.packagePublisher)
      throw Error(
        `Downloaded MSIX has package publisher '${metadata.packagePublisher}' instead of '${this.options.packagePublisher}'.`,
      );
    if (metadata.architecture !== process.arch)
      throw Error(
        `Downloaded MSIX has architecture '${metadata.architecture}' instead of '${process.arch}'.`,
      );
  }

  private getStageStatePath(): string {
    return join(this.stateRoot, "staged-msix.json");
  }

  /** 丢弃已 stage 的更新（状态文件 + 散落下载）。 */
  private async discardPreparedUpdate(): Promise<void> {
    await rm(this.getStageStatePath(), { force: true });
    await this.cleanupDownloadedPackages();
    this.setUpdateReady(false);
  }

  private setUpdateReady(isReady: boolean): void {
    if (this.isUpdateReady !== isReady) {
      this.isUpdateReady = isReady;
      this.options.onUpdateReadyChanged?.(isReady);
    }
  }

  private setUpdateLifecycleState(state: UpdateLifecycleState): void {
    this.options.onUpdateLifecycleStateChanged?.(state);
    if (state !== "downloading") this.setDownloadProgressPercent(null);
  }

  private setDownloadProgressPercent(percent: number | null): void {
    const normalized = percent == null ? null : Math.round(Math.min(100, Math.max(0, percent)));
    if (this.downloadProgressPercent !== normalized) {
      this.downloadProgressPercent = normalized;
      this.options.onDownloadProgressChanged?.(normalized);
    }
  }

  private setInstallProgressPercent(percent: number | null): void {
    if (this.installProgressPercent !== percent) {
      this.installProgressPercent = percent;
      this.options.onInstallProgressChanged?.(percent);
    }
  }

  /** 错误弹窗（原 showActionError）。 */
  private async showActionError({ message, detail }: { message: string; detail: string }): Promise<void> {
    await dialog.showMessageBox({
      type: "error",
      buttons: ["OK"],
      defaultId: 0,
      noLink: true,
      message,
      detail,
    });
  }
}

/** hresult 匹配判定（原 `e instanceof Error && 'hresult' in e && e.hresult === ...`）。 */
function isHResultError(error: unknown, hresult: number): boolean {
  return (
    error instanceof Error && "hresult" in error && (error as HResultError).hresult === hresult
  );
}

// ---- native addon 加载（原 OT，19938-19942 + 20409-20423 行）------------------

/**
 * 加载 windows-updater.node（原 `OT`）。
 * 路径解析保持原样：process.resourcesPath/native/windows-updater.node；
 * 失败记 error 日志并返回 null（调用方把更新器置为不可用）。
 */
export function loadWindowsUpdaterAddon(): WindowsUpdaterAddon | null {
  let loadError: unknown;
  try {
    return requireNative(
      join(process.resourcesPath, "native", "windows-updater.node"),
    ) as WindowsUpdaterAddon;
  } catch (error) {
    loadError = error;
  }
  logger().error("Failed to load native Windows updater addon", {
    safe: {},
    sensitive: { error: loadError },
  });
  return null;
}
