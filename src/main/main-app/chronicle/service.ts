// Chronicle（skysight 历史记录）服务。
//
// 对应 main-C-Mhak1n.ts 71,844-71,980：
//   - IO ChronicleService：getState / retryActivation / setEnabled（启用失败
//     的权限 pending 与拒绝回滚两分支）/ pause / resume / getSettings /
//     updateSettings / listApplications / resolveApplications / listHistory
//     / listHistorySuggestions / listHistorySummaryIntervals / clearHistory
//   - LO throwAfterRollback / RO rollbackWithErrors（AggregateError）
import { Uf as EventEmitterBase, gr as classifyErrorSource, oc as configKeyPath } from "@chunk/shared";

interface ChronicleController {
  status(): Promise<{ state: string }>;
  disable(): Promise<{ state: string }>;
  pause(): Promise<{ state: string }>;
  reconcileEnabled(): Promise<void>;
  getSettings(): Promise<unknown>;
  updateSettings(settings: unknown): Promise<unknown>;
  clearHistory(from: unknown, to: unknown): Promise<void>;
}

interface ChronicleAppServerConnection {
  isChronicleFeatureConfigured(): Promise<boolean>;
  reconcileSkysightChronicle(): Promise<void>;
  enableSkysightChronicle(): Promise<{ state: string }>;
  resumeChronicle(): Promise<{ enabled: boolean; running: boolean }>;
  getSkysightChronicleActivationState(): string;
  sendAppServerRequest(method: string, params: unknown): Promise<unknown>;
}

interface ChronicleHistory {
  list(): Promise<unknown>;
  listSuggestions(): Promise<unknown>;
  listSummaryIntervals(sinceMs: number): Promise<unknown>;
}

interface ChronicleState {
  enabled: boolean;
  recorderState: string;
  activationState: string;
}

/** 回滚并聚合错误（原 `RO`）。 */
async function rollbackWithErrors(error: unknown, message: string, rollbacks: Array<() => Promise<unknown>>): Promise<void> {
  const errors: unknown[] = [error];
  for (const rollback of rollbacks) {
    try {
      await rollback();
    } catch (rollbackError) {
      errors.push(rollbackError);
    }
  }
  if (errors.length > 1) throw new AggregateError(errors as never[], message);
}

/** 回滚后重抛原错误（原 `LO`）。 */
async function throwAfterRollback(error: unknown, message: string, rollbacks: Array<() => Promise<unknown>>): Promise<never> {
  await rollbackWithErrors(error, message, rollbacks);
  throw error;
}

/** Chronicle 服务（原 `IO`）。 */
class ChronicleService extends (EventEmitterBase as new () => {}) {
  appServerConnection: ChronicleAppServerConnection;
  getController: () => ChronicleController | null;
  isEligible: () => boolean;
  loadApplications: () => Promise<unknown>;
  loadApplicationsByBundleIdentifier: (bundleIdentifiers: string[]) => Promise<unknown>;
  history: ChronicleHistory;

  constructor(
    appServerConnection: ChronicleAppServerConnection,
    getController: ChronicleService["getController"],
    isEligible: ChronicleService["isEligible"],
    loadApplications: ChronicleService["loadApplications"],
    loadApplicationsByBundleIdentifier: ChronicleService["loadApplicationsByBundleIdentifier"],
    history: ChronicleHistory,
  ) {
    super();
    this.appServerConnection = appServerConnection;
    this.getController = getController;
    this.isEligible = isEligible;
    this.loadApplications = loadApplications;
    this.loadApplicationsByBundleIdentifier = loadApplicationsByBundleIdentifier;
    this.history = history;
  }

  async getState(): Promise<ChronicleState> {
    const controller = this.#requireController();
    const [configured, status] = await Promise.all([
      this.appServerConnection.isChronicleFeatureConfigured(),
      controller.status(),
    ]);
    return this.#buildState(configured, status.state);
  }

  async retryActivation(): Promise<ChronicleState> {
    this.#assertEligible();
    try {
      await this.appServerConnection.reconcileSkysightChronicle();
    } catch {
      // 重试失败时仍返回当前状态（原 catch {}）。
    }
    return this.getState();
  }

  /** 启用/停用（原 `setEnabled`）：权限 pending 与拒绝回滚两分支。 */
  async setEnabled(enabled: boolean): Promise<ChronicleState> {
    if (!enabled) return this.#disable();
    const controller = this.#requireController();
    try {
      const result = await this.appServerConnection.enableSkysightChronicle();
      await this.#writeChronicleConfig(true);
      return this.#buildState(true, result.state);
    } catch (error) {
      const permissionState = (classifyErrorSource as (error: unknown) => string | null)(error);
      if (permissionState === "pending")
        return (
          await this.#writeChronicleConfig(true),
          { enabled: true, recorderState: "stopped", activationState: "waiting_for_permissions" }
        );
      const rollbacks: Array<() => Promise<unknown>> = [() => controller.disable(), () => this.#writeChronicleConfig(false)];
      return permissionState === "denied"
        ? (await rollbackWithErrors(error, "Failed to enable Chronicle and roll back", rollbacks),
          { enabled: false, recorderState: "stopped", activationState: "idle" })
        : ((await throwAfterRollback(error, "Failed to enable Chronicle and roll back", rollbacks)) as never);
    }
  }

  async pause(): Promise<ChronicleState> {
    const result = await this.#requireController().pause();
    return this.#buildState(true, result.state);
  }

  async resume(): Promise<ChronicleState> {
    this.#assertEligible();
    const result = await this.appServerConnection.resumeChronicle();
    return this.#buildState(result.enabled, result.running ? "running" : "stopped");
  }

  async getSettings(): Promise<unknown> {
    return this.#requireController().getSettings();
  }

  async updateSettings(settings: unknown): Promise<unknown> {
    return this.#requireController().updateSettings(settings);
  }

  async listApplications(): Promise<unknown> {
    this.#assertEligible();
    return this.loadApplications();
  }

  async resolveApplications(bundleIdentifiers: string[]): Promise<unknown> {
    this.#assertEligible();
    return this.loadApplicationsByBundleIdentifier(bundleIdentifiers);
  }

  async listHistory(): Promise<unknown> {
    this.#assertEligible();
    return this.history.list();
  }

  async listHistorySuggestions(): Promise<unknown> {
    this.#assertEligible();
    return this.history.listSuggestions();
  }

  async listHistorySummaryIntervals({ sinceMs }: { sinceMs: number }): Promise<unknown> {
    this.#assertEligible();
    return this.history.listSummaryIntervals(sinceMs);
  }

  async clearHistory(from: unknown, to: unknown): Promise<void> {
    await this.#requireController().clearHistory(from, to);
  }

  /** 停用（原 `#e`）：停用失败时恢复 recorder。 */
  async #disable(): Promise<ChronicleState> {
    const controller = this.#requireController();
    const result = await controller.disable();
    try {
      await this.#writeChronicleConfig(false);
    } catch (error) {
      return throwAfterRollback(error, "Failed to disable Chronicle and restore the recorder", [
        () => controller.reconcileEnabled(),
      ]);
    }
    return this.#buildState(false, result.state);
  }

  #buildState(enabled: boolean, recorderState: string): ChronicleState {
    return {
      enabled,
      recorderState,
      activationState:
        !enabled || recorderState !== "stopped"
          ? "idle"
          : this.appServerConnection.getSkysightChronicleActivationState(),
    };
  }

  /** chronicle 配置写入（原 `#n`）：config/value/write upsert。 */
  async #writeChronicleConfig(enabled: boolean): Promise<void> {
    await this.appServerConnection.sendAppServerRequest("config/value/write", {
      keyPath: (configKeyPath as (key: string) => unknown)("chronicle"),
      value: enabled,
      mergeStrategy: "upsert",
      expectedVersion: null,
    });
  }

  #assertEligible(): void {
    if (!this.isEligible()) throw new Error("Chronicle is not available");
  }

  #requireController(): ChronicleController {
    this.#assertEligible();
    const controller = this.getController();
    if (controller == null) throw new Error("Chronicle is unavailable");
    return controller;
  }
}

export {
  ChronicleService,
  rollbackWithErrors,
  throwAfterRollback,
  type ChronicleState,
  type ChronicleController,
  type ChronicleAppServerConnection,
  type ChronicleHistory,
};
