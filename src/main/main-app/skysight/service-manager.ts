// Skysight（Chronicle 录制）服务管理器 + 录音技能注入
// （原 main-C-Mhak1n.ts 12,549-12,724 行的 `joe/Moe`（SkysightServiceManager）
// 与 5,402-5,452 行的 `$ne/ere/Ca/tre`（computer-use 录音技能变体注入））。
//
// SkysightServiceManager（原 `Moe`）：
//   - desiredState 记录期望状态（running/stopped/paused）；全部操作经
//     pendingOperation 链串行化（runSerialized：then(op, op)）。
//   - enable/reconcileEnabled：归档旧 chronicle skill → reconcile computer
//     history 插件安装 → skysightStart；失败回滚（先 skysightStop，回滚也
//     失败则 AggregateError）并复位 desiredState。
//   - status()：pendingStatus 去重缓存；stopped 状态会触发挂起的
//     pause/resolve 完成（finishPendingPauseResume）。
//   - pause/resume/disable/stop/clearHistory/getSettings/updateSettings 经
//     dependencies.request 与 SkyComputerUseService 通信；每个响应都刷新
//     cachedStatus。
//   - stopRecorder 严格校验 stopped 且无未关闭 segment。
//
// 录音技能注入（原 `tre`）：computer-use 插件且两个音频开关都开时，把
// SKILL.md 的 description 前插录音说明并追加录音代码示例片段（原 `$ne`），
// plugin.json 的 bundledContentVariant 标记为 audio；visualize 插件按
// liveVisualizationSkillVariant 标记（live-disabled 时删除 live 目录）。
//
// 本模块无模块加载期副作用（常量/schema/logger 构造）。

import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

// @chunk/shared 的压缩名导出，按语义重命名导入：
//   xf → zod record 构造器
import { xf as recordSchema_ } from "@chunk/shared";
const recordSchema: any = recordSchema_;

// ---- Skysight 状态与依赖面 -------------------------------------------------

/** skysight 状态（原 `joe` 的形状 + request 响应）。 */
export interface SkysightStatus {
  state: string;
  eventStreamRootPath: string | null;
  currentSegmentEventsPath: string | null;
  currentSegmentMetadataPath: string | null;
  suppressedEventsPath?: string | null;
  startedAtMs?: number | null;
  endedAtMs?: number | null;
}

/** 停止态的初始缓存（原 `joe`，模块级常量）。 */
const STOPPED_STATUS: SkysightStatus & Record<string, unknown> = {
  state: `stopped`,
  eventStreamRootPath: null,
  currentSegmentEventsPath: null,
  currentSegmentMetadataPath: null,
  suppressedEventsPath: null,
  startedAtMs: null,
  endedAtMs: null,
};

/** 管理器依赖注入面（request 与 SkyComputerUseService 通信；两个 reconcile 钩子）。 */
export interface SkysightServiceManagerDependencies {
  /** 发 JSON-RPC 请求给 SkyComputerUseService（skysight* 方法）。 */
  request(input: { method: string; params: unknown }): Promise<SkysightStatus & Record<string, unknown>>;
  /** 归档旧 chronicle skill（enable 前置）。 */
  archiveLegacyChronicleSkill(): Promise<unknown>;
  /** reconcile computer history 插件安装（enable 传 true / disable 传 false）。 */
  reconcileComputerHistoryPluginInstallation(enabled: boolean): unknown;
}

/**
 * Skysight 录制服务管理器（原 `Moe`）。
 *
 * 期望状态（desiredState）与实际状态（cachedStatus）分离；服务重生后可用
 * shouldReconcileAfterServiceRespawn() 判定是否需要 reconcileEnabled。
 */
export class SkysightServiceManager {
  private dependencies: SkysightServiceManagerDependencies;
  private cachedStatus: SkysightStatus & Record<string, unknown> = STOPPED_STATUS;
  private desiredState: string = `stopped`;
  private pendingOperation: Promise<unknown> = Promise.resolve();
  private finishPendingPauseResume: ((status: SkysightStatus & Record<string, unknown>) => void) | null = null;
  private pendingStatus: Promise<SkysightStatus & Record<string, unknown>> | null = null;

  constructor(dependencies: SkysightServiceManagerDependencies) {
    this.dependencies = dependencies;
  }

  /** 最近一次已知的录制状态缓存。 */
  getCachedStatus(): SkysightStatus {
    return this.cachedStatus;
  }

  /** 服务重生后是否需要 reconcile（期望仍为 running）。 */
  shouldReconcileAfterServiceRespawn(): boolean {
    return this.desiredState === `running`;
  }

  /** 查询状态（去重缓存；stopped 会触发挂起的 pause/resume 完成）。 */
  status(): Promise<SkysightStatus & Record<string, unknown>> {
    this.pendingStatus ??= this.request(`skysightStatus`)
      .then((status) => {
        if (status.state === `stopped`) this.finishPendingPauseResume?.(status);
        return status;
      })
      .finally(() => {
        this.pendingStatus = null;
      });
    return this.pendingStatus;
  }

  /** 启用录制（原 `enable`）：失败回滚并复位期望状态。 */
  enable(): Promise<SkysightStatus & Record<string, unknown>> {
    this.desiredState = `running`;
    return this.runSerialized(() =>
      this.withFailedEnableRollback(async () => {
        await this.dependencies.archiveLegacyChronicleSkill();
        this.dependencies.reconcileComputerHistoryPluginInstallation(true);
        return this.request(`skysightStart`);
      }),
    ).catch((error) => {
      if (this.desiredState === `running`) this.desiredState = `stopped`;
      throw error;
    });
  }

  /** 幂等启用（原 `reconcileEnabled`）：已运行则只对齐期望状态。 */
  reconcileEnabled(): Promise<SkysightStatus & Record<string, unknown>> {
    this.desiredState = `running`;
    return this.runSerialized(() =>
      this.withFailedEnableRollback(async () => {
        await this.dependencies.archiveLegacyChronicleSkill();
        this.dependencies.reconcileComputerHistoryPluginInstallation(true);
        const status = await this.status();
        if (status.state === `stopped`) return this.request(`skysightStart`);
        if (this.desiredState === `running`) this.desiredState = status.state;
        return status;
      }),
    );
  }

  /** 停用录制（原 `disable`）：失败复位期望状态。 */
  disable(): Promise<SkysightStatus & Record<string, unknown>> {
    const previousDesiredState = this.desiredState;
    this.desiredState = `stopped`;
    return this.runSerialized(async () => {
      const status =
        this.cachedStatus.state === `stopped` ? this.cachedStatus : await this.stopRecorder();
      this.dependencies.reconcileComputerHistoryPluginInstallation(false);
      return status;
    }).catch((error) => {
      if (this.desiredState === `stopped`) this.desiredState = previousDesiredState;
      throw error;
    });
  }

  /** 无条件停止（原 `stop`，不 reconcile 插件安装）。 */
  stop(): Promise<SkysightStatus & Record<string, unknown>> {
    this.desiredState = `stopped`;
    return this.runSerialized(() => this.stopRecorder());
  }

  /** 暂停（原 `pause`）：duration 为空 → paused；否则 running（定时恢复由服务端负责）。 */
  pause(duration?: unknown): Promise<SkysightStatus & Record<string, unknown>> {
    const previousDesiredState = this.desiredState;
    const nextDesiredState = duration == null ? `paused` : `running`;
    this.desiredState = nextDesiredState;
    return this.runSerialized(() => this.requestPauseResume(`skysightPause`, duration)).catch(
      (error) => {
        if (this.desiredState === nextDesiredState) this.desiredState = previousDesiredState;
        throw error;
      },
    );
  }

  /** 恢复（原 `resume`）：stopped → start；paused → resume；running 原样。 */
  resume(): Promise<SkysightStatus & Record<string, unknown>> {
    const previousDesiredState = this.desiredState;
    this.desiredState = `running`;
    return this.runSerialized(async () => {
      const status = await this.status();
      if (status.state === `stopped`) return this.request(`skysightStart`);
      if (status.state === `running`) return status;
      return this.requestPauseResume(`skysightResume`);
    }).catch((error) => {
      if (this.desiredState === `running`) this.desiredState = previousDesiredState;
      throw error;
    });
  }

  /** 读取录制设置。 */
  getSettings(): Promise<unknown> {
    return this.dependencies.request({ method: `skysightGetSettings`, params: {} });
  }

  /** 更新录制设置。 */
  updateSettings(settings: unknown): Promise<unknown> {
    return this.dependencies.request({
      method: `skysightUpdateSettings`,
      params: { settings },
    });
  }

  /** 清空历史（原 `clearHistory`；响应刷新缓存）。 */
  clearHistory(scope: unknown, interval: unknown): Promise<SkysightStatus & Record<string, unknown>> {
    return this.dependencies
      .request({ method: `skysightClearHistory`, params: { interval, scope } })
      .then((status) => {
        this.cachedStatus = status;
        return status;
      });
  }

  /**
   * pause/resume 的双完成路径（原 `requestPauseResume`）：外层 promise 由
   * finishPendingPauseResume（status 观察到 stopped 时）或服务端响应先完成者
   * resolve；完成后刷新缓存。
   */
  private requestPauseResume(
    method: `skysightPause` | `skysightResume`,
    duration?: unknown,
  ): Promise<SkysightStatus & Record<string, unknown>> {
    return new Promise<SkysightStatus & Record<string, unknown>>((resolve, reject) => {
      this.finishPendingPauseResume = resolve;
      const request =
        method === `skysightPause`
          ? this.dependencies.request({
              method,
              params: duration == null ? {} : { duration },
            })
          : this.dependencies.request({ method, params: {} });
      request.then(resolve, reject);
    })
      .then((status) => {
        this.cachedStatus = status;
        return status;
      })
      .finally(() => {
        this.finishPendingPauseResume = null;
      });
  }

  /** 发 skysight 请求并刷新缓存（原 `request`）。 */
  private request(method: string): Promise<SkysightStatus & Record<string, unknown>> {
    return this.dependencies
      .request({ method, params: {} })
      .then((status) => {
        this.cachedStatus = status;
        return status;
      });
  }

  /** enable 失败回滚：先停录制；回滚也失败则 AggregateError（原 `withFailedEnableRollback`）。 */
  private async withFailedEnableRollback(
    operation: () => Promise<SkysightStatus & Record<string, unknown>>,
  ): Promise<SkysightStatus & Record<string, unknown>> {
    try {
      return await operation();
    } catch (error) {
      try {
        await this.stopRecorder();
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          `Failed to enable Chronicle and stop the recorder during rollback`,
        );
      }
      throw error;
    }
  }

  /** 停止并严格校验 segment 已关闭（原 `stopRecorder`）。 */
  private async stopRecorder(): Promise<SkysightStatus & Record<string, unknown>> {
    const status = await this.request(`skysightStop`);
    if (
      status.state !== `stopped` ||
      status.currentSegmentEventsPath != null ||
      status.currentSegmentMetadataPath != null
    )
      throw new Error(`Chronicle stopped but did not close its current segment`);
    return status;
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
}

// ---- 录音技能注入（原 $ne/ere/Ca/tre，5,402-5,452）--------------------------

/** 追加到 computer-use SKILL.md 的录音代码示例片段（原 `$ne`）。 */
const COMPUTER_AUDIO_SKILL_SNIPPET = `

## Computer audio

\`\`\`js
await sky.start_audio_recording({ max_duration_ms: 5000 });
// Perform desktop actions while recording.
var audio = await sky.stop_audio_recording();
await nodeRepl.emitAudio(audio.data_url);
\`\`\`

\`max_duration_ms\` defaults to 60000 and supports up to 300000.
`;

/** plugin.json 的宽松 schema（原 `ere`）。 */
const pluginJsonSchema: any = recordSchema({});

/** 两个音频环境开关是否都打开（原 `Ca`）。 */
export function isComputerAudioEnabled(): boolean {
  return process.env.SKY_ENABLE_AUDIO === `1` && process.env.NODE_REPL_ENABLE_AUDIO === `1`;
}

/** 技能变体注入的输入。 */
export interface SkillVariantInjectionInput {
  /** 插件根目录（bundled 资源内）。 */
  pluginRoot: string;
  /** 插件名（computer-use / visualize / …）。 */
  pluginName: string;
  /** visualize 的 live 技能变体。 */
  liveVisualizationSkillVariant?: string;
}

/**
 * 按插件注入 bundledContentVariant（原 `tre`）：
 *   - computer-use 且音频开关打开：SKILL.md description 前插录音说明 +
 *     追加录音示例，plugin.json 标 bundledContentVariant=audio。
 *   - visualize：标 liveVisualizationSkillVariant；live-disabled 时删除
 *     skills/live 目录。
 *   - 其余：无操作。
 */
export async function injectBundledContentVariant(input: SkillVariantInjectionInput): Promise<void> {
  const isAudioVariant = input.pluginName === `computer-use` && isComputerAudioEnabled();
  let variant: string | undefined;
  if (isAudioVariant) variant = `audio`;
  else if (input.pluginName === `visualize`) {
    variant = input.liveVisualizationSkillVariant;
    if (input.liveVisualizationSkillVariant === `live-disabled`)
      await rm(join(input.pluginRoot, `skills`, `live`), { force: true, recursive: true });
  }
  if (variant == null) return;
  if (isAudioVariant) {
    const skillPath = join(input.pluginRoot, `skills`, `computer-use`, `SKILL.md`);
    const skillContent = await readFile(skillPath, `utf8`);
    await writeFile(
      skillPath,
      skillContent.replace(/^(description: )(["']?)/m, `$1$2Record computer audio. `) +
        COMPUTER_AUDIO_SKILL_SNIPPET,
      `utf8`,
    );
  }
  const pluginJsonPath = join(input.pluginRoot, `.codex-plugin`, `plugin.json`);
  const parsed = await pluginJsonSchema.parseAsync(
    JSON.parse(await readFile(pluginJsonPath, `utf8`)),
  );
  await writeFile(
    pluginJsonPath,
    `${JSON.stringify({ ...parsed, bundledContentVariant: variant }, null, 2)}\n`,
    `utf8`,
  );
}
