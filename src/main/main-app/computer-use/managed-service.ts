// 托管 Computer Use 服务（SkyComputerUseService）生命周期（原 main-C-Mhak1n.ts
// 12,377-12,523 行的 `Eoe` 类 + `Doe` 进程存活判定）。
//
// 职责：按特性开关（appshots/computerUse/skysight）确保
// `<serviceAppPath>/Contents/MacOS/SkyComputerUseService` 进程存活：
//   - setEnabledFeatures/setAppshotsEnabled：开关变化时串行 ensure；
//   - ensureServicePid：显式 ensure（未启用时抛错）；
//   - invalidateServicePid：外部报告 pid 失效时校验（进程仍存活且可执行文件
//     匹配则保留，否则清空，待下次 ensure 重生）；
//   - 重生（respawn）通过 onServiceRespawned 回调上报，首次 spawn 走
//     onServiceAvailable。
//
// 全部操作经 pendingOperation 链串行化（runSerialized：then(op, op)——前一
// 操作无论成败都会执行当前操作）。
//
// 依赖注入（便于测试）：isExpectedServiceProcess（默认 sky addon 的
// computerUseServiceProcessMatchesExecutablePath）、isProcessRunning（默认
// 本模块的 isProcessAlive）、spawnService（默认 sky addon 的
// spawnComputerUseService）——后两者来自 windows/native-app-icons.ts。
//
// 本模块无模块加载期副作用。

import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { memoizedTaggedLogger } from "@chunk/logger";
// windows/native-app-icons（sky addon 族）的默认依赖。
import {
  spawnComputerUseService,
  computerUseServiceProcessMatchesExecutablePath,
} from "../windows/native-app-icons";

/** 托管服务的依赖注入面。 */
export interface ManagedComputerUseServiceOptions {
  /** 判定 pid 是否本服务进程（默认 sky addon 匹配可执行文件路径）。 */
  isExpectedServiceProcess?: (pid: number, executablePath: string) => boolean;
  /** 判定 pid 是否存活（默认本模块 isProcessAlive）。 */
  isProcessRunning?: (pid: number, platform?: string) => boolean;
  /** 服务可用（首次或重生后 pid 就绪）回调。 */
  onServiceAvailable?: (pid: number) => void;
  /** 服务重生（非首次 spawn）回调。 */
  onServiceRespawned?: () => void;
  /** spawn 服务进程，返回 pid（默认 sky addon）。 */
  spawnService?: (executablePath: string) => Promise<number | null>;
}

/**
 * 托管 Computer Use 服务管理器（原 `Eoe`）。
 * serviceAppPath 为 `Codex Computer Use.app` 的路径（构造时拼
 * Contents/MacOS/SkyComputerUseService）。
 */
export class ManagedComputerUseService {
  private logger = memoizedTaggedLogger(`managed-computer-use-service`);
  private appshotsEnabled = false;
  private computerUseEnabled = false;
  private skysightEnabled = false;
  private disposed = false;
  private hasSpawnedService = false;
  private servicePid: number | null = null;
  private pendingOperation: Promise<unknown> = Promise.resolve();
  private isExpectedServiceProcess: (pid: number, executablePath: string) => boolean;
  private isProcessRunning: (pid: number, platform?: string) => boolean;
  private onServiceAvailable: (pid: number) => void;
  private onServiceRespawned: () => void;
  private serviceExecutablePath: string;
  private spawnService: (executablePath: string) => Promise<number | null>;

  constructor(serviceAppPath: string, options: ManagedComputerUseServiceOptions = {}) {
    this.isExpectedServiceProcess =
      options.isExpectedServiceProcess ?? computerUseServiceProcessMatchesExecutablePath;
    this.isProcessRunning = options.isProcessRunning ?? isProcessAlive;
    this.onServiceAvailable = options.onServiceAvailable ?? (() => {});
    this.onServiceRespawned = options.onServiceRespawned ?? (() => {});
    this.serviceExecutablePath = joinServiceExecutablePath(serviceAppPath);
    this.spawnService = options.spawnService ?? spawnComputerUseService;
  }

  /** 更新 appshots 开关（其余保持）。 */
  setAppshotsEnabled(enabled: boolean): Promise<void> {
    return this.setEnabledFeatures({
      appshotsEnabled: enabled,
      computerUseEnabled: this.computerUseEnabled,
      skysightEnabled: this.skysightEnabled,
    });
  }

  /** 更新特性开关；无变化直接 resolve，否则串行 ensure 服务。 */
  setEnabledFeatures({
    appshotsEnabled,
    computerUseEnabled,
    skysightEnabled,
  }: {
    appshotsEnabled: boolean;
    computerUseEnabled: boolean;
    skysightEnabled: boolean;
  }): Promise<void> {
    if (
      this.appshotsEnabled === appshotsEnabled &&
      this.computerUseEnabled === computerUseEnabled &&
      this.skysightEnabled === skysightEnabled
    )
      return Promise.resolve();
    this.appshotsEnabled = appshotsEnabled;
    this.computerUseEnabled = computerUseEnabled;
    this.skysightEnabled = skysightEnabled;
    return this.runSerialized(async () => {
      if (!this.disposed && this.enabled) await this.ensureServicePidForEnabledFeatures();
    });
  }

  /** 显式 ensure（未启用时抛错）。 */
  ensureServicePid(): Promise<number> {
    return this.runSerialized(async () => {
      if (this.disposed || !this.enabled)
        throw new Error(`Managed Computer Use service is not enabled`);
      return this.ensureServicePidForEnabledFeatures();
    });
  }

  /** 当前服务 pid（可能为 null）。 */
  getServiceProcessIdentifier(): number | null {
    return this.servicePid;
  }

  /** 外部报告 pid 失效：存活且匹配则保留，否则清空（原 `invalidateServicePid`）。 */
  invalidateServicePid(pid: number): Promise<void> {
    return this.runSerialized(async () => {
      if (!this.disposed && this.enabled && this.servicePid === pid) {
        if (
          this.isProcessRunning(pid) &&
          this.isExpectedServiceProcess(pid, this.serviceExecutablePath)
        ) {
          this.logger().debug(`Preserving live managed service after invalidation`, {
            safe: { processIdentifier: pid },
            sensitive: {},
          });
          return;
        }
        this.logger().info(`Invalidating stale managed service`, {
          safe: { processIdentifier: pid },
          sensitive: {},
        });
        this.servicePid = null;
      }
    });
  }

  /** 停止管理（不杀进程；开关全部复位）。 */
  dispose(): void {
    this.disposed = true;
    this.appshotsEnabled = false;
    this.computerUseEnabled = false;
    this.skysightEnabled = false;
  }

  /** 串行化：前一操作无论成败都执行当前操作（原 `runSerialized`）。 */
  private runSerialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pendingOperation.then(operation, operation);
    this.pendingOperation = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  /** 任一开关打开即视为启用。 */
  private get enabled(): boolean {
    return this.appshotsEnabled || this.computerUseEnabled || this.skysightEnabled;
  }

  /** ensure：pid 存活且匹配则复用，否则 spawn 新进程（原 `ensureServicePidForEnabledFeatures`）。 */
  private async ensureServicePidForEnabledFeatures(): Promise<number> {
    let pid = this.servicePid;
    const isRunning = pid != null && this.isProcessRunning(pid);
    if (pid != null && isRunning && this.isExpectedServiceProcess(pid, this.serviceExecutablePath))
      return pid;
    if (pid != null)
      this.logger().info(`Replacing stale managed service`, {
        safe: {
          processIdentifier: pid,
          reason: isRunning ? `executable-mismatch` : `process-exited`,
        },
        sensitive: {},
      });
    this.servicePid = null;
    const isRespawn = this.hasSpawnedService;
    const spawnedPid = await this.spawnService(this.serviceExecutablePath);
    if (spawnedPid == null || !Number.isSafeInteger(spawnedPid) || spawnedPid <= 0) {
      this.logger().warning(`Failed to spawn managed service`, {
        safe: { isRespawn },
        sensitive: {},
      });
      throw new Error(`Failed to spawn managed Computer Use service`);
    }
    this.servicePid = spawnedPid;
    this.hasSpawnedService = true;
    this.logger().info(`Managed service available`, {
      safe: { processIdentifier: spawnedPid, isRespawn },
      sensitive: {},
    });
    this.onServiceAvailable(spawnedPid);
    if (isRespawn) this.onServiceRespawned();
    return spawnedPid;
  }
}

/** 服务可执行文件路径（app bundle 内固定布局）。 */
function joinServiceExecutablePath(serviceAppPath: string): string {
  return join(serviceAppPath, `Contents`, `MacOS`, `SkyComputerUseService`);
}

/**
 * 进程存活判定（原 `Doe`）：
 * kill(pid, 0) 探测（ESRCH → 死）；darwin 上再经 /bin/ps 检查 state 列
 * （空或 Z 开头视为僵尸/死亡；ps 失败按存活处理）。
 */
export function isProcessAlive(pid: number, platformName: string = process.platform): boolean {
  try {
    process.kill(pid, 0);
  } catch (error) {
    return !(typeof error === `object` && error && `code` in error && (error as NodeJS.ErrnoException).code === `ESRCH`);
  }
  if (platformName !== `darwin`) return true;
  try {
    const state = execFileSync(`/bin/ps`, [`-o`, `state=`, `-p`, String(pid)], {
      encoding: `utf8`,
      stdio: [`ignore`, `pipe`, `ignore`],
    }).trim();
    return state !== `` && !state.startsWith(`Z`);
  } catch {
    return true;
  }
}
