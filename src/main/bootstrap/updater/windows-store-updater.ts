// Windows Store 更新器（Windows 专属，macOS 上静态重写 + 类型检查）。
//
// 对应 bootstrap-C4dRql4x.ts 20424-20877 行：
//   - `kT`（manifest 最小 schemaVersion）、`AT`（Store 检测节流，30 分钟）
//   - `jT`（store manifest schema）、`MT`（URL https 校验）、`NT`（拉取 manifest）
//   - `PT`（决策：up-to-date / should-check-store / update-ready / waiting-for-store）
//   - `FT`（logger）、`IT` class WindowsStoreUpdater（trySilentDownloadStoreUpdates 等）
//
// 关键语义（逐字保持）：
//   - Store manifest 404 → null（分发尚未开启）；后续决策全走「本地版本门」。
//   - Store 检测（trySilentDownloadStoreUpdates）有 30 分钟节流，
//     manual 检查绕过节流。
//   - allowFallback（组合更新器用）：Store 操作失败 / 不支持静默下载 /
//     下载失败时返回 { kind: "fallback", reason }，交给 MSIX 回退更新器。
//   - 非 fallback 的失败：manual 时弹错误框，后台静默（外层 catch 吞）。
//   - 决策 PT 的分支保持原始结构（含「manifest 缺失 + 本地版本有效 →
//     up-to-date」的重复条件冗余，语义等价于直接取 up-to-date）。

import { app, dialog, net } from "electron";
import { Cf as ofNumberSchema, Of as ofStringSchema, wf as objectSchema } from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { compareBuildVersions, isDottedNumericBuildVersion } from "./backend-appcast";
import { waitForMinimumUptime, type UpdateLifecycleState, type WindowsUpdaterAddon } from "./windows-msix-updater";

// @chunk/shared 尚未重写，zod 构造器的链式方法（int/trim/min 等）类型不完整——
// 数字与字符串构造器按 any 使用。
const numberSchema = ofNumberSchema as any;
const stringSchema = ofStringSchema as any;

/** manifest schemaVersion 下限（原 `kT`）。 */
const MIN_STORE_MANIFEST_SCHEMA_VERSION = 1;

/** Store 检测节流窗口（原 `AT`，30 分钟）。 */
const STORE_DETECTION_THROTTLE_MS = 1_800_000;

/** 日志（原 `FT`）。 */
const logger = memoizedTaggedLogger("windows-store-updater");

/** store manifest schema（原 `jT`）。 */
const storeUpdateManifestSchema: any = objectSchema({
  schemaVersion: numberSchema().int().min(MIN_STORE_MANIFEST_SCHEMA_VERSION),
  buildVersion: stringSchema().trim().min(1),
  storeProductId: stringSchema().trim().min(1),
  packageIdentity: stringSchema().trim().min(1),
});

/** store manifest（分发门控：storeProductId / packageIdentity / buildVersion）。 */
interface StoreUpdateManifest {
  schemaVersion: number;
  buildVersion: string;
  storeProductId: string;
  packageIdentity: string;
}

/** 组合更新器用的回退决策（原 fallback 分支返回值）。 */
export type StoreCheckDecision =
  | { kind: "handled" }
  | { kind: "fallback"; reason: "store-operation-failed" | "silent-download-unavailable" | "store-download-failed" };

/** 单次检查结果（decision + 面向用户的 outcome）。 */
interface StoreCheckOutcome {
  decision: StoreCheckDecision;
  outcome: "up-to-date" | "update-ready" | "waiting-for-store" | "update-available-in-store" | null;
}

/** Store 静默下载/安装的 addon 结果形状。 */
interface StoreUpdateOperationResult {
  canSilentlyDownload: boolean;
  completed: boolean;
  hasUpdate: boolean;
  overallState: string;
}

/** WindowsStoreUpdater 构造选项（SparkleManager 的 initializeWindowsUpdater 传入）。 */
export interface WindowsStoreUpdaterOptions {
  storeProductId: string;
  storeUpdateManifestUrl: string;
  /** 当前 build 版本（点分数字；无本地版本时走旁路，见 PT）。 */
  buildVersion: string;
  packageIdentity: string;
  nativeAddon: WindowsUpdaterAddon;
  /** 轮询间隔；0 = 不轮询。 */
  checkIntervalMs: number;
  /** 初始化时是否立即检查一次（默认 true）。 */
  checkOnInitialize?: boolean;
  onBeforeInstall?(): void | Promise<void>;
  onInstallUpdatesRequested?(): void;
  onUpdateReadyChanged?(isReady: boolean): void;
  onUpdateLifecycleStateChanged?(state: UpdateLifecycleState): void;
  onDownloadProgressChanged?(percent: number | null): void;
  onInstallProgressChanged?(percent: number | null): void;
}

/** manifest URL 的 https 校验（原 `MT`）。 */
function validateStoreManifestUrl(options: { storeUpdateManifestUrl: string }): string {
  const url = new URL(options.storeUpdateManifestUrl.trim());
  if (url.protocol !== "https:")
    throw Error("Windows Store update manifest URL must use https transport.");
  return url.toString();
}

/** 拉取并解析 store manifest（原 `NT`）：404 → null；非 https → 抛错。 */
async function fetchStoreManifest(options: {
  storeUpdateManifestUrl: string;
  fetch(url: string): Promise<Response>;
}): Promise<StoreUpdateManifest | null> {
  const manifestUrl = validateStoreManifestUrl(options);
  const response = await options.fetch(manifestUrl);
  if (response.status === 404) return null;
  if (!response.ok)
    throw Error(
      `Windows Store update manifest request failed (${response.status} ${response.statusText})`,
    );
  if (new URL(response.url.trim() || manifestUrl).protocol !== "https:")
    throw Error("Windows Store update manifest must use https transport.");
  return storeUpdateManifestSchema.parse(JSON.parse(await response.text()));
}

/** Store 决策（原 `PT`）。输入见各字段；manifest 身份不匹配时抛错。 */
function decideStoreCheckOutcome({
  manifest,
  storeProductId,
  packageIdentity,
  buildVersion,
  isUpdateReady,
  lastStoreDetectionAttemptAtMs,
  nowMs,
}: {
  manifest: StoreUpdateManifest | null;
  storeProductId: string;
  packageIdentity: string;
  buildVersion: string;
  isUpdateReady: boolean;
  lastStoreDetectionAttemptAtMs: number | null;
  nowMs: number;
}): "up-to-date" | "should-check-store" | "update-ready" | "waiting-for-store" {
  const hasLocalBuildVersion = isDottedNumericBuildVersion(buildVersion);
  const storeRecentlyChecked =
    lastStoreDetectionAttemptAtMs != null && nowMs - lastStoreDetectionAttemptAtMs < STORE_DETECTION_THROTTLE_MS;
  if (manifest == null)
    // 原始代码此处为 `n ? (n ? "up-to-date" : "should-check-store") : …` 的重复
    // 条件（恒取 up-to-date），保持等价语义。
    return hasLocalBuildVersion
      ? "up-to-date"
      : isUpdateReady
        ? "update-ready"
        : storeRecentlyChecked
          ? "waiting-for-store"
          : "should-check-store";
  if (manifest.storeProductId !== storeProductId)
    throw Error(
      `Windows Store update manifest targets product '${manifest.storeProductId}' instead of '${storeProductId}'.`,
    );
  if (manifest.packageIdentity !== packageIdentity)
    throw Error(
      `Windows Store update manifest targets package identity '${manifest.packageIdentity}' instead of '${packageIdentity}'.`,
    );
  if (!isDottedNumericBuildVersion(manifest.buildVersion))
    throw Error(`Windows Store update manifest has invalid build version '${manifest.buildVersion}'.`);
  return hasLocalBuildVersion && compareBuildVersions(manifest.buildVersion, buildVersion) <= 0
    ? "up-to-date"
    : isUpdateReady
      ? "update-ready"
      : storeRecentlyChecked
        ? "waiting-for-store"
        : "should-check-store";
}

/**
 * Windows Store 更新器（原 `IT`）。
 * Store 是唯一安装通道时使用；与 MSIX 更新器组合时作为首选
 * （WindowsCombinedUpdater 包装 Store + MSIX 回退）。
 */
export class WindowsStoreUpdater {
  private options: WindowsStoreUpdaterOptions;
  isUpdateReady = false;
  downloadProgressPercent: number | null = null;
  installProgressPercent: number | null = null;
  private lastUnavailableReason: string | null = null;
  /** 活跃检查（allowFallback/bypassStoreDetectionThrottle 变化时重建）。 */
  private activeCheck: {
    allowFallback: boolean;
    bypassStoreDetectionThrottle: boolean;
    promise: Promise<StoreCheckOutcome>;
  } | null = null;
  private inFlightManualCheck: {
    allowFallback: boolean;
    promise: Promise<StoreCheckOutcome>;
  } | null = null;
  private inFlightInstall: Promise<void> | null = null;
  /** 上次 Store 实际检测时间（节流）。 */
  private lastStoreDetectionAttemptAtMs: number | null = null;

  constructor(options: WindowsStoreUpdaterOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    if (!app.isPackaged) {
      this.lastUnavailableReason = "dev build";
      return;
    }
    if (!this.options.storeProductId.trim()) {
      this.lastUnavailableReason = "missing windows store product id";
      return;
    }
    if (!this.options.storeUpdateManifestUrl.trim()) {
      this.lastUnavailableReason = "missing windows store update manifest url";
      return;
    }
    if (!this.options.packageIdentity.trim()) {
      this.lastUnavailableReason = "missing packaged windows package identity";
      return;
    }
    try {
      validateStoreManifestUrl(this.options);
    } catch {
      this.lastUnavailableReason = "invalid windows store update manifest url";
      return;
    }
    if (!this.options.nativeAddon.getCurrentPackageFamily().trim()) {
      this.lastUnavailableReason = "missing current windows package family";
      return;
    }
    if (this.options.checkIntervalMs > 0) {
      setInterval(() => {
        void this.checkForUpdatesInBackground();
      }, this.options.checkIntervalMs).unref();
    }
    if (this.options.checkOnInitialize !== false) void this.checkForUpdatesInBackground();
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

  /** 安静模式的更新信息检查（不触发 Store 检测；节流不适用）。 */
  async checkForUpdateInformation(): Promise<
    | { status: "busy" }
    | { status: "up_to_date" }
    | { status: "restart_required" }
    | { status: "unavailable"; reason: string }
  > {
    if (this.activeCheck || this.inFlightManualCheck || this.inFlightInstall)
      return { status: "busy" };
    const decision = decideStoreCheckOutcome({
      manifest: await fetchStoreManifest({
        fetch: (url) => net.fetch(url),
        ...this.options,
      }),
      ...this.options,
      isUpdateReady: this.isUpdateReady,
      lastStoreDetectionAttemptAtMs: null,
      nowMs: Date.now(),
    });
    return decision === "up-to-date"
      ? { status: "up_to_date" }
      : decision === "update-ready"
        ? { status: "restart_required" }
        : {
            status: "unavailable",
            reason:
              "The Windows Store must check installation eligibility. A Store check may download updates; the information-only check did not start it.",
          };
  }

  async checkForUpdates(): Promise<void> {
    await this.runManualCheck({ allowFallback: false }).catch(() => {});
  }

  /**
   * 组合更新器入口（原 checkForUpdatesWithFallbackDecision）：返回回退决策；
   * manual 时展示结果；失败按 { kind: "handled" } 吞掉。
   */
  async checkForUpdatesWithFallbackDecision({
    manual = false,
  }: { manual?: boolean } = {}): Promise<StoreCheckDecision> {
    if (manual)
      return this.runManualCheck({ allowFallback: true })
        .then(({ decision }) => decision)
        .catch(() => ({ kind: "handled" }));
    if (this.inFlightManualCheck) {
      await this.inFlightManualCheck.promise;
      return { kind: "handled" };
    }
    return this.runCheck({ allowFallback: true, manual: false })
      .then(({ decision }) => decision)
      .catch(() => ({ kind: "handled" }));
  }

  async checkForUpdatesInBackground(): Promise<void> {
    if (this.inFlightManualCheck) {
      await this.inFlightManualCheck.promise;
      return;
    }
    await this.runCheck({ allowFallback: false, manual: false }).catch(() => {});
  }

  async installUpdatesIfAvailable(): Promise<void> {
    if (this.inFlightInstall) {
      await this.inFlightInstall;
      return;
    }
    const install = this.performInstall();
    this.inFlightInstall = install;
    try {
      await install;
    } catch (error) {
      this.setInstallProgressPercent(null);
      logger().error("Failed to install Windows Store update", {
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

  /** 单次检查（原 runCheck）：活跃检查复用 + manual 弹窗。 */
  private async runCheck({
    allowFallback,
    manual,
  }: {
    allowFallback: boolean;
    manual: boolean;
  }): Promise<StoreCheckOutcome> {
    let check = this.activeCheck;
    if (
      check == null ||
      check.allowFallback !== allowFallback ||
      (manual && !check.bypassStoreDetectionThrottle)
    ) {
      const previous = check;
      check = {
        allowFallback,
        bypassStoreDetectionThrottle: manual,
        promise: (async () => {
          if (previous != null) await previous.promise.catch(() => {});
          return this.performCheck({ allowFallback, bypassStoreDetectionThrottle: manual });
        })(),
      };
      this.activeCheck = check;
    }
    try {
      const result = await check.promise;
      if (manual && result.decision.kind === "handled" && result.outcome != null)
        await this.showCheckResult(result.outcome);
      return result;
    } catch (error) {
      this.setUpdateLifecycleState(this.isUpdateReady ? "ready" : "idle");
      logger().error("Failed to check for Windows Store updates", {
        safe: {},
        sensitive: { error },
      });
      if (manual)
        await this.showActionError({
          message: `Unable to check for ${app.getName()} updates.`,
          detail: error instanceof Error ? error.message : String(error),
        });
      throw error;
    } finally {
      if (this.activeCheck === check) this.activeCheck = null;
    }
  }

  /** 实际执行检查（原 performCheck）：manifest 决策 → Store 静默检测。 */
  private async performCheck({
    allowFallback,
    bypassStoreDetectionThrottle,
  }: {
    allowFallback: boolean;
    bypassStoreDetectionThrottle: boolean;
  }): Promise<StoreCheckOutcome> {
    if (!this.isUpdateReady) this.setUpdateLifecycleState("checking");

    const manifest = await fetchStoreManifest({
      fetch: (url) => net.fetch(url),
      ...this.options,
    });
    if (!isDottedNumericBuildVersion(this.options.buildVersion))
      logger().warning(
        "Local Windows Store build version is unavailable; bypassing manifest version gate.",
        {
          safe: {
            buildVersion: this.options.buildVersion,
            manifestBuildVersion: manifest?.buildVersion ?? null,
            packageIdentity: this.options.packageIdentity,
          },
          sensitive: {},
        },
      );

    const decision = decideStoreCheckOutcome({
      manifest,
      storeProductId: this.options.storeProductId,
      packageIdentity: this.options.packageIdentity,
      buildVersion: this.options.buildVersion,
      isUpdateReady: this.isUpdateReady,
      lastStoreDetectionAttemptAtMs: bypassStoreDetectionThrottle
        ? null
        : this.lastStoreDetectionAttemptAtMs,
      nowMs: Date.now(),
    });

    if (decision === "up-to-date") {
      this.setUpdateReady(false);
      this.setUpdateLifecycleState("idle");
      return { decision: { kind: "handled" }, outcome: "up-to-date" };
    }
    if (decision !== "should-check-store") {
      this.setUpdateLifecycleState(decision === "update-ready" ? "ready" : "idle");
      return {
        decision: { kind: "handled" },
        outcome: decision === "update-ready" ? "update-ready" : "waiting-for-store",
      };
    }

    // 需要 Store 检测：记录节流时间戳并静默尝试。
    this.lastStoreDetectionAttemptAtMs = Date.now();
    logger().info("Checking Windows Store for package updates", {
      safe: {
        buildVersion: this.options.buildVersion,
        manifestBuildVersion: manifest?.buildVersion ?? null,
        packageIdentity: this.options.packageIdentity,
      },
      sensitive: {},
    });
    this.setUpdateLifecycleState("downloading");
    this.setDownloadProgressPercent(0);

    let storeResult: StoreUpdateOperationResult;
    try {
      storeResult = await this.options.nativeAddon.trySilentDownloadStoreUpdates((percent) => {
        this.setDownloadProgressPercent(percent);
      });
    } catch (error) {
      this.setUpdateReady(false);
      this.setUpdateLifecycleState("idle");
      logger().warning("Windows Store update operation failed", {
        safe: {},
        sensitive: { error },
      });
      if (!allowFallback) throw error;
      return { decision: { kind: "fallback", reason: "store-operation-failed" }, outcome: null };
    }

    logger().info("Windows Store package update check completed", {
      safe: {
        canSilentlyDownload: storeResult.canSilentlyDownload,
        completed: storeResult.completed,
        hasUpdate: storeResult.hasUpdate,
        overallState: storeResult.overallState,
      },
      sensitive: {},
    });

    if (!storeResult.hasUpdate) {
      this.setUpdateReady(false);
      this.setUpdateLifecycleState("idle");
      return { decision: { kind: "handled" }, outcome: "up-to-date" };
    }
    if (!storeResult.canSilentlyDownload) {
      this.setUpdateReady(false);
      this.setUpdateLifecycleState("idle");
      return allowFallback
        ? { decision: { kind: "fallback", reason: "silent-download-unavailable" }, outcome: null }
        : { decision: { kind: "handled" }, outcome: "update-available-in-store" };
    }
    if (!storeResult.completed) {
      this.setUpdateReady(false);
      this.setUpdateLifecycleState("idle");
      if (storeResult.overallState === "OtherError" || storeResult.overallState === "Unknown") {
        if (!allowFallback)
          throw Error(`Windows Store update download failed with state '${storeResult.overallState}'.`);
        return { decision: { kind: "fallback", reason: "store-download-failed" }, outcome: null };
      }
      throw Error(`Windows Store update download failed with state '${storeResult.overallState}'.`);
    }
    this.setDownloadProgressPercent(100);
    this.setUpdateReady(true);
    this.setUpdateLifecycleState("ready");
    return { decision: { kind: "handled" }, outcome: "update-ready" };
  }

  /** 手动检查去重（原 runManualCheck：allowFallback 变化时重建）。 */
  private async runManualCheck({
    allowFallback,
  }: {
    allowFallback: boolean;
  }): Promise<StoreCheckOutcome> {
    let check = this.inFlightManualCheck;
    if (check == null || check.allowFallback !== allowFallback) {
      const previous = check;
      check = {
        allowFallback,
        promise: (async () => {
          if (previous != null) await previous.promise.catch(() => {});
          return this.performManualCheck({ allowFallback });
        })(),
      };
      this.inFlightManualCheck = check;
    }
    try {
      return await check.promise;
    } finally {
      if (this.inFlightManualCheck === check) this.inFlightManualCheck = null;
    }
  }

  /** 手动检查（原 performManualCheck：ready 时直接告知，否则 runCheck manual）。 */
  private async performManualCheck({
    allowFallback,
  }: {
    allowFallback: boolean;
  }): Promise<StoreCheckOutcome> {
    if (this.isUpdateReady && this.activeCheck == null) {
      await this.showCheckResult("update-ready");
      return { decision: { kind: "handled" }, outcome: "update-ready" };
    }
    return this.runCheck({ allowFallback, manual: true });
  }

  /** 实际执行安装（原 performInstall：trySilentDownloadAndInstallStoreUpdates）。 */
  private async performInstall(): Promise<void> {
    if (!this.isUpdateReady) return;
    this.setUpdateReady(false);
    this.setInstallProgressPercent(0);

    let installUpdatesRequested = false;
    const notifyInstallUpdatesRequested = () => {
      if (installUpdatesRequested) return;
      installUpdatesRequested = true;
      this.options.onInstallUpdatesRequested?.();
    };

    await waitForMinimumUptime();
    if (this.options.onBeforeInstall) await this.options.onBeforeInstall();

    const result = await this.options.nativeAddon.trySilentDownloadAndInstallStoreUpdates(
      (percent, state) => {
        this.setInstallProgressPercent(percent);
        // Deploying 阶段向 UI 上报「安装已请求」（Store 由系统接手）。
        if (state === "Deploying") notifyInstallUpdatesRequested();
      },
    );

    if (!result.hasUpdate) {
      this.setInstallProgressPercent(null);
      return;
    }
    if (!result.canSilentlyDownload) {
      this.setInstallProgressPercent(null);
      await this.showCheckResult("update-available-in-store");
      return;
    }
    this.setUpdateReady(true);
    if (result.completed) {
      this.setUpdateReady(false);
      this.setInstallProgressPercent(100);
      notifyInstallUpdatesRequested();
      return;
    }
    this.setInstallProgressPercent(null);
    throw Error(`Windows Store update install failed with state '${result.overallState}'.`);
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

  /** 检查结果弹窗（原 showCheckResult）。 */
  private async showCheckResult(outcome: "up-to-date" | "update-ready" | "update-available-in-store" | "waiting-for-store"): Promise<void> {
    switch (outcome) {
      case "up-to-date":
        await dialog.showMessageBox({
          type: "info",
          buttons: ["OK"],
          defaultId: 0,
          noLink: true,
          message: `${app.getName()} is up to date.`,
        });
        return;
      case "update-ready":
        await dialog.showMessageBox({
          type: "info",
          buttons: ["OK"],
          defaultId: 0,
          noLink: true,
          message: `${app.getName()} update is ready to install.`,
        });
        return;
      case "update-available-in-store":
        await dialog.showMessageBox({
          type: "info",
          buttons: ["OK"],
          defaultId: 0,
          noLink: true,
          message: `${app.getName()} update is available.`,
          detail: "Open Microsoft Store to install the update.",
        });
        return;
      case "waiting-for-store":
        await dialog.showMessageBox({
          type: "info",
          buttons: ["OK"],
          defaultId: 0,
          noLink: true,
          message: "Microsoft Store was checked recently.",
          detail: "Try checking again later.",
        });
        return;
    }
  }
}
