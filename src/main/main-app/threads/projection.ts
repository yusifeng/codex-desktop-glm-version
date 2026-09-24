// 线程摘要投影（部分）—— V_/Cv/Tv/Ev/Dv。
//
// 原版 main-C-Mhak1n.ts 32,988-33,030（V_）、33,898-33,954（Cv/Tv/Ev/y_e/Dv）。
// 注：投影簇（32,988-33,603）的其余部分（G_ 摘要投影、Nv transcript 序列化、
// heartbeat/automation 判定已独立成 automation-detector.ts、turn 参数推断、
// collab/父链等）尚未重写；本文件先落地 maybe-resume 与 catalog 侧需要的
// 这组无状态助手。

import {
  $u as normalizeThreadId,
  Cf as zNumber,
  Of as zString,
  wf as zObject,
} from "@chunk/shared";
import { plainTextFromMarkdown } from "../markdown/plain-text";
import { ae as parseCodexDelegation } from "../misc/delegation";
import { takeLastRequestSection } from "../prompts/section-markers";

/**
 * 线程摘要 → conversation 骨架（原版 V_）：catalog/摘要侧只有元数据，
 * turns/requests 为空、resumeState = needs_resume，由 resume 流程填充实体。
 */
export function conversationFromThreadSummary(summary: {
  conversationId: string;
  forkedFromId?: string | null;
  hostId: string;
  createdAt: number;
  updatedAt: number;
  recencyAt?: number | null;
  title: string | null;
  originator?: string | null;
  source?: any;
  agentNickname?: string | null;
  threadSource?: string | null;
  historyMode?: string;
  canonicalVoiceHistory?: boolean;
  parentThreadId?: string | null;
  mode?: string;
  threadStartKind?: string;
  modelProvider?: string | null;
  daybreakEnabled?: boolean;
  hasUnreadTurn?: boolean;
  threadRuntimeStatus?: any;
  workspaceKind?: string;
  cwd?: string | null;
  environments?: any;
  environmentConfigId?: string | null;
  environmentSelectionEvidence?: any;
}): any {
  return {
    id: summary.conversationId,
    forkedFromId: summary.forkedFromId ?? null,
    hostId: summary.hostId,
    turns: [],
    requests: [],
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    recencyAt: summary.recencyAt ?? summary.updatedAt,
    title: summary.title,
    originator: summary.originator,
    source: summary.source ?? void 0,
    agentNickname: summary.agentNickname,
    threadSource: summary.threadSource,
    historyMode: summary.historyMode,
    canonicalVoiceHistory: summary.canonicalVoiceHistory,
    parentThreadId: summary.parentThreadId == null ? null : normalizeThreadId(summary.parentThreadId),
    mode: summary.mode ?? `default`,
    threadStartKind: summary.threadStartKind ?? `default`,
    modelProvider: summary.modelProvider,
    daybreakEnabled: summary.daybreakEnabled,
    latestModel: ``,
    latestReasoningEffort: null,
    previousTurnModel: null,
    latestCollaborationMode: {
      mode: `default`,
      settings: { developer_instructions: null, model: ``, reasoning_effort: null },
    },
    hasUnreadTurn: summary.hasUnreadTurn,
    threadGoal: null,
    threadRuntimeStatus: summary.threadRuntimeStatus,
    rolloutPath: ``,
    gitInfo: summary.gitInfo,
    resumeState: `needs_resume`,
    latestTokenUsageInfo: null,
    workspaceKind: summary.workspaceKind,
    cwd: summary.cwd ?? void 0,
    environments: summary.environments,
    environmentConfigId: summary.environmentConfigId,
    environmentSelectionEvidence: summary.environmentSelectionEvidence,
  };
}

/** 标题文本清洗（原版 Cv）：markdown 纯文本化，结果为空时回退原文。 */
export function cleanThreadTitle(title: string | null | undefined): string | null {
  let trimmed = title?.trim() ?? ``;
  return plainTextFromMarkdown(trimmed) || trimmed || null;
}

/** 截断到 limit 字符（原版 wv）：超长截 limit-1 + 省略号。 */
export function truncateText(text: string, limit: number): string | null {
  let collapsed = text.trim().replace(/\s+/g, ` `);
  return collapsed.length === 0
    ? null
    : collapsed.length <= limit
      ? collapsed
      : `${collapsed.slice(0, limit - 1).trimEnd()}…`;
}

/**
 * 线程预览标题（原版 v_e）：name 优先；preview 是 delegation 块时取其
 * input（残块返回 null），取请求段后截断到 60 字符。
 */
export function threadPreviewTitle(
  thread: { name?: string | null; preview?: string | null },
  clean: (title: string) => string | null,
): string | null {
  let name = clean(thread.name ?? ``);
  if (name != null) return name;
  let preview = thread.preview;
  let delegation = parseCodexDelegation(preview ?? ``);
  if (delegation == null && preview?.trimStart().startsWith(`<codex_delegation>`)) return null;
  let inputTitle = clean(takeLastRequestSection(delegation?.input ?? preview ?? ``));
  return inputTitle == null ? null : truncateText(inputTitle, 60);
}

/** thread 的秒级时间戳 → 毫秒（原版 Tv；非法回退 now/createdAt）。 */
export function threadTimestamps(thread: {
  createdAt: number;
  updatedAt: number;
  recencyAt?: number | null;
}): { createdAt: number; updatedAt: number; recencyAt: number | null } {
  let createdAtMs = thread.createdAt * 1e3;
  let createdAt = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
  let updatedAtMs = thread.updatedAt * 1e3;
  let updatedAt = Number.isFinite(updatedAtMs) ? updatedAtMs : createdAt;
  let recencyAtMs = thread.recencyAt == null ? null : thread.recencyAt * 1e3;
  return {
    createdAt,
    updatedAt,
    recencyAt: recencyAtMs != null && Number.isFinite(recencyAtMs) ? recencyAtMs : null,
  };
}

/** recency 合并（原版 Ev）：取现值与 thread recency 的较大者。 */
export function mergedRecencyAt({
  currentRecencyAt,
  threadRecencyAt,
  updatedAt,
}: {
  currentRecencyAt: number | null | undefined;
  threadRecencyAt: number | null;
  updatedAt: number | null;
}): number {
  return threadRecencyAt == null
    ? (currentRecencyAt ?? updatedAt!)
    : Math.max(currentRecencyAt ?? threadRecencyAt, threadRecencyAt);
}

/** environmentConfigId 的形态 schema（原版 y_e）。 */
const environmentConfigIdSchema = zObject({
  environmentConfigId: zString()
    .regex(/^(?:[A-Za-z0-9_-]+~)?asenvcfg_[A-Za-z0-9_-]+(?![\s\S])/)
    .nullish(),
});

/**
 * 环境配置选择（原版 Dv）：stored 快照在本地有更新证据（live 或
 * updatedAt 更新）时不覆盖本地；单环境时解析 environmentConfigId。
 */
export function environmentSelection(
  thread: { environments?: any[] | null; updatedAt: number },
  stored: {
    environments?: any[];
    environmentConfigId?: string | null;
    environmentSelectionEvidence?: any;
  } | null | undefined,
  source: string,
): {
  environmentConfigId: string | null | undefined;
  environments: any[] | undefined;
  environmentSelectionEvidence: any;
} {
  let keepStored =
    thread.environments == null ||
    (source === `stored` &&
      (stored?.environmentSelectionEvidence?.source === `live` ||
        (stored?.environmentSelectionEvidence?.updatedAt ?? -1 / 0) >= thread.updatedAt));
  let environments = keepStored ? stored?.environments : (thread.environments ?? void 0);
  let singleEnvironment = environments?.length === 1 ? environments[0] : void 0;
  let singleEnvironmentParse = environmentConfigIdSchema.safeParse(
    thread.environments?.find((environment) => environment.environmentId === singleEnvironment?.environmentId),
  );
  return {
    environmentConfigId:
      singleEnvironment == null
        ? void 0
        : ((singleEnvironmentParse.success ? singleEnvironmentParse.data.environmentConfigId : void 0) ??
          (stored?.environments?.length === 1 &&
          stored.environments[0]?.environmentId === singleEnvironment.environmentId
            ? stored.environmentConfigId
            : void 0)),
    environments,
    environmentSelectionEvidence: keepStored
      ? stored?.environmentSelectionEvidence
      : { source, updatedAt: thread.updatedAt },
  };
}

// ---------------------------------------------------------------------------
// subagent 元数据（原版 H_/Zge/Qge/U_/$ge/W_，33,031-33,062）
// ---------------------------------------------------------------------------

/** 默认 subagent 元数据（原版 U_）。 */
function defaultSubAgentMetadata() {
  return { parentThreadId: null, agentPath: null, agentNickname: null, agentRole: null };
}

/** subAgent 描述 → 元数据（原版 Qge：字符串形态 → 默认；thread_spawn →
 *  父线程/agent 路径等）。 */
function parseSubAgentDescriptor(descriptor: any): any {
  return typeof descriptor == `string`
    ? defaultSubAgentMetadata()
    : `thread_spawn` in descriptor
      ? {
          parentThreadId: normalizeThreadId(descriptor.thread_spawn.parent_thread_id),
          agentPath: descriptor.thread_spawn.agent_path,
          agentNickname: descriptor.thread_spawn.agent_nickname,
          agentRole: descriptor.thread_spawn.agent_role,
        }
      : defaultSubAgentMetadata();
}

/** 线程 source 的 subagent 元数据（原版 H_）。 */
export function subAgentMetadata(source: any): any {
  if (source == null || typeof source == `string`) return null;
  let descriptor = `subAgent` in source ? source.subAgent : null;
  return descriptor == null ? null : parseSubAgentDescriptor(descriptor);
}

/** nickname 清洗（原版 W_）。 */
function cleanNickname(nickname: string | null | undefined): string | null {
  if (nickname == null) return null;
  let trimmed = nickname.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** subagent 显示昵称（原版 $ge：自身优先，回退 source 的 subagent 昵称）。 */
export function subAgentNickname(thread: {
  agentNickname?: string | null;
  source?: any;
}): string | null {
  return thread == null
    ? null
    : (cleanNickname(thread.agentNickname) ?? cleanNickname(subAgentMetadata(thread.source)?.agentNickname));
}
