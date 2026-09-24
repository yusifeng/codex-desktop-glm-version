// Windows 组合更新器：Windows Store 优先 + MSIX 回退。
//
// 对应 bootstrap-C4dRql4x.ts 20878-20990 行（`LT` class）。
//
// 关键语义（逐字保持）：
//   - Store 更新器不可用时，所有检查直接走 MSIX 回退。
//   - Store 检查返回 fallback 决策（操作失败/静默下载不可用/下载失败）时，
//     后续检查也走 MSIX 回退（shouldCheckMsixFallback 置位）。
//   - Store 检查拿到 ready 则停止回退（shouldCheckMsixFallback 复位）。
//   - activeUpdater 记录最近一次拿到 ready 的更新器，安装时优先选它。
//   - 初始化时若 MSIX 回退已有 staged 更新 ready，直接选它为 activeUpdater。
//   - MSIX 回退初始化失败（异常）不阻塞组合更新器（标记未初始化即可）。

import type { UpdateInformationResult } from "./windows-msix-updater";
import type { StoreCheckDecision, WindowsStoreUpdater } from "./windows-store-updater";
import type { MsixUpdater } from "./windows-msix-updater";

/** 组合更新器构造选项（SparkleManager 的 initializeWindowsUpdater 传入）。 */
export interface WindowsCombinedUpdaterOptions {
  /** 轮询间隔（组合层自己的 interval，驱动双更新器）。 */
  checkIntervalMs: number;
  storeUpdater: WindowsStoreUpdater;
  msixFallbackUpdater: MsixUpdater;
}

/**
 * Windows 组合更新器（原 `LT`）。
 * 包装 Store 更新器与 MSIX 回退更新器，对外提供统一更新器面。
 */
export class WindowsCombinedUpdater {
  private options: WindowsCombinedUpdaterOptions;
  /** 最近拿到 ready 的更新器（安装优先选它）。 */
  private activeUpdater: WindowsStoreUpdater | MsixUpdater | null = null;
  private installPromise: Promise<void> | null = null;
  private isMsixFallbackUpdaterInitialized = false;
  private shouldCheckMsixFallback = false;

  constructor(options: WindowsCombinedUpdaterOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    await this.options.storeUpdater.initialize();
    try {
      await this.options.msixFallbackUpdater.initialize();
      this.isMsixFallbackUpdaterInitialized = true;
    } catch {
      // MSIX 回退初始化失败：保持未初始化状态即可（安装时忽略它）。
    }
    // 初始化时 MSIX 回退已有 ready 的 staged 更新 → 直接选它。
    if (
      this.hasMsixFallbackUpdater() &&
      this.options.msixFallbackUpdater.getIsUpdateReady()
    ) {
      this.activeUpdater = this.options.msixFallbackUpdater;
      this.shouldCheckMsixFallback = true;
    }
    if (this.options.checkIntervalMs > 0) {
      setInterval(() => {
        void this.checkForUpdatesInBackground();
      }, this.options.checkIntervalMs).unref();
    }
    void this.checkForUpdatesInBackground();
  }

  hasUpdater(): boolean {
    return this.options.storeUpdater.hasUpdater() || this.hasMsixFallbackUpdater();
  }

  getUnavailableReason(): string | null {
    if (this.hasUpdater()) return null;
    // 两者都不可用：优先报 Store 的原因；MSIX 未初始化（初始化抛错）时不报它。
    return (
      this.options.storeUpdater.getUnavailableReason() ??
      (this.isMsixFallbackUpdaterInitialized
        ? this.options.msixFallbackUpdater.getUnavailableReason()
        : null)
    );
  }

  getIsUpdateReady(): boolean {
    return (
      this.options.storeUpdater.getIsUpdateReady() ||
      (this.hasMsixFallbackUpdater() && this.options.msixFallbackUpdater.getIsUpdateReady())
    );
  }

  async checkForUpdateInformation(): Promise<
    | { status: "busy" }
    | { status: "restart_required" }
    | UpdateInformationResult
    | { status: "unavailable"; reason: string }
  > {
    if (this.installPromise != null) return { status: "busy" };
    return this.getIsUpdateReady()
      ? { status: "restart_required" }
      : this.options.storeUpdater.hasUpdater()
        ? this.options.storeUpdater.checkForUpdateInformation()
        : this.options.msixFallbackUpdater.checkForUpdateInformation();
  }

  async checkForUpdates(): Promise<void> {
    await this.runCheck("manual");
  }

  async checkForUpdatesInBackground(): Promise<void> {
    await this.runCheck("background");
  }

  async installUpdatesIfAvailable(): Promise<void> {
    if (this.installPromise != null) return this.installPromise;
    let target: WindowsStoreUpdater | MsixUpdater | null = null;
    if (this.activeUpdater?.getIsUpdateReady()) {
      target = this.activeUpdater;
    } else if (
      this.hasMsixFallbackUpdater() &&
      this.options.msixFallbackUpdater.getIsUpdateReady()
    ) {
      target = this.options.msixFallbackUpdater;
    } else if (
      this.options.storeUpdater.hasUpdater() &&
      this.options.storeUpdater.getIsUpdateReady()
    ) {
      target = this.options.storeUpdater;
    }
    if (target == null) return;
    try {
      this.installPromise = target.installUpdatesIfAvailable();
      await this.installPromise;
    } finally {
      this.installPromise = null;
      // activeUpdater 安装完不再 ready 时清空选择。
      if (this.activeUpdater != null && !this.activeUpdater.getIsUpdateReady())
        this.activeUpdater = null;
    }
  }

  /** 单次检查路由（原 runCheck）。 */
  private async runCheck(kind: "manual" | "background"): Promise<void> {
    if (!this.options.storeUpdater.hasUpdater()) {
      this.shouldCheckMsixFallback = true;
      await this.checkMsixFallback(kind);
      return;
    }
    const decision: StoreCheckDecision =
      await this.options.storeUpdater.checkForUpdatesWithFallbackDecision({
        manual: kind === "manual",
      });
    if (decision.kind === "fallback") {
      this.shouldCheckMsixFallback = true;
      await this.checkMsixFallback(kind);
      return;
    }
    if (this.options.storeUpdater.getIsUpdateReady()) {
      this.shouldCheckMsixFallback = false;
      this.activeUpdater = this.options.storeUpdater;
      return;
    }
    if (this.shouldCheckMsixFallback) await this.checkMsixFallback(kind);
  }

  /** MSIX 回退检查（原 checkMsixFallback）：ready 则选为 activeUpdater。 */
  private async checkMsixFallback(kind: "manual" | "background"): Promise<void> {
    if (!this.hasMsixFallbackUpdater()) return;
    if (kind === "manual") await this.options.msixFallbackUpdater.checkForUpdates();
    else await this.options.msixFallbackUpdater.checkForUpdatesInBackground();
    if (this.options.msixFallbackUpdater.getIsUpdateReady()) {
      this.activeUpdater = this.options.msixFallbackUpdater;
    } else if (this.activeUpdater === this.options.msixFallbackUpdater) {
      this.activeUpdater = null;
    }
  }

  private hasMsixFallbackUpdater(): boolean {
    return this.isMsixFallbackUpdaterInitialized && this.options.msixFallbackUpdater.hasUpdater();
  }
}
