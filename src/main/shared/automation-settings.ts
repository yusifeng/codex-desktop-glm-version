// shared chunk：自动化设置与模型路由（automation-settings 分区，
// settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L15,310（ef）、L16,534-16,691 区段：
//   - ef=Lh：默认打开目标偏好 `in-app-browser`
//   - Td=Rte：agent-mode-by-host-id 存储 key
//   - M_（wd）：ambient suggestions 空表（projectRoot/generatedAtMs/
//     currentSuggestionIds/suggestions）+ N_ 文件名 + Bte 建议 schema
//     （id/title/description/prompt/appIds/pluginMention/status/
//     createdAtMs/updatedAtMs）+ Vte 状态文件 schema
//   - P_（Sd）：默认模型表（automationModel=gpt-5.6-terra、
//     ephemeralGenerationModel/ambientSuggestionsModel/
//     ambientSuggestionsSafetyModel=gpt-5.6-luna）
//   - Ute（Cd）：远端模型配置解析（codex_*_model_slug 四字段，
//     .catch 回退默认表——statsig 动态配置消费方 model-routing.ts）
//   - I_（pd）：无未来运行的错误文案；Wte：自动化不存在文案
//   - Gte/Kte/qte/Jte/L_（gd）/R_（_d）：自动化 schema 族——
//     status（ACTIVE/PAUSED/DELETED）、kind（cron/heartbeat）、
//     execution_environment（worktree/local）、target
//     （project/projectless）、notification_policy（failed_runs_only）、
//     reasoning_effort（none…ultra 九档）
//   - Yte：自动化记录 schema（version/id/kind/name/prompt/status/
//     rrule/model/reasoning_effort/plugin_template_id/target/
//     notification_policy/cwds/target_thread_id/时间戳）
//   - Xte：默认 RRULE（FREQ=HOURLY;INTERVAL=24;BYMINUTE=0）
//   - H_/U_：cron/heartbeat 判定；W_：rrule 缺省；G_：执行环境归一
//   - K_/q_/J_/Y_：模型选择（列表查找 → 默认标记 → z_ 兜底 → 首项；
//     推理档支持性校验；gpt-5.3-codex 优先缺省）
//   - X_/Z_/Q_/$_：heartbeat XML 解析（<heartbeat> 包裹的
//     automation_id/current_time_iso/instructions 提取）+
//     automation_update 工具输出识别
//
// 消费方：automations/habitat.ts、automation-update-tool.ts（gd/_d）、
// misc/model-routing.ts（Cd/Sd）、browser/link-opening.ts（ef）、
// automations/index.ts（Td）。
//
// 兼容导出：gd=L_、_d=R_、pd=I_、Sd=P_、Cd=Ute、wd=M_、Td=Rte、ef=Lh。

import { z } from "zod";

// ---------------------------------------------------------------------------
// 偏好与存储 key（原 `Lh`/`Rte`）
// ---------------------------------------------------------------------------

/** 默认打开目标（原 `Lh`，导出 `ef`）。 */
export const DEFAULT_OPEN_TARGET_PREFERENCE = "in-app-browser";

/** agent 模式按 host 存储的 key（原 `Rte`，导出 `Td`）。 */
export const AGENT_MODE_BY_HOST_ID_KEY = "agent-mode-by-host-id";

// ---------------------------------------------------------------------------
// 默认模型表（原 `P_`，导出 `Sd`）与远端解析（原 `Ute`，导出 `Cd`）
// ---------------------------------------------------------------------------

/** 默认模型表（原 `P_`）。 */
export const DEFAULT_MODELS = {
  automationModel: "gpt-5.6-terra",
  ephemeralGenerationModel: "gpt-5.6-luna",
  ambientSuggestionsModel: "gpt-5.6-luna",
  ambientSuggestionsSafetyModel: "gpt-5.6-luna",
} as const;

/** 远端模型配置形态。 */
export interface RemoteModelSlugs {
  automationModel: string;
  ephemeralGenerationModel: string;
  ambientSuggestionsModel: string;
  ambientSuggestionsSafetyModel: string;
}

const modelSlugSchema = z.string().trim().min(1);

const remoteModelsSchema = z.object({
  codex_automation_model_slug: modelSlugSchema.catch(DEFAULT_MODELS.automationModel),
  codex_ephemeral_generation_model_slug: modelSlugSchema.catch(DEFAULT_MODELS.ephemeralGenerationModel),
  codex_ambient_suggestions_model_slug: modelSlugSchema.catch(DEFAULT_MODELS.ambientSuggestionsModel),
  codex_ambient_suggestions_safety_model_slug: modelSlugSchema.catch(DEFAULT_MODELS.ambientSuggestionsSafetyModel),
});

/**
 * 解析远端动态配置的模型 slug（原 `Ute`，导出 `Cd`）。
 * 字段缺失/非法时逐项回退默认表。
 */
export function remoteModelSlugs(input: unknown): RemoteModelSlugs {
  const parsed = remoteModelsSchema.safeParse(input);
  if (!parsed.success) return { ...DEFAULT_MODELS };
  return {
    automationModel: parsed.data.codex_automation_model_slug,
    ephemeralGenerationModel: parsed.data.codex_ephemeral_generation_model_slug,
    ambientSuggestionsModel: parsed.data.codex_ambient_suggestions_model_slug,
    ambientSuggestionsSafetyModel: parsed.data.codex_ambient_suggestions_safety_model_slug,
  };
}

// ---------------------------------------------------------------------------
// ambient suggestions（原 `Bte`/`Vte`/`M_`/`N_`）
// ---------------------------------------------------------------------------

const suggestionStatusSchema = z.enum(["pending", "accepted", "dismissed"]);

const ambientSuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  appIds: z.array(z.string()),
  pluginMention: z.object({ id: z.string().min(1), label: z.string().min(1) }).optional(),
  status: suggestionStatusSchema,
  createdAtMs: z.number(),
  updatedAtMs: z.number(),
});

const ambientSuggestionsStateSchema = z.object({
  projectRoot: z.string().default(""),
  generatedAtMs: z.number().nullable(),
  currentSuggestionIds: z.array(z.string()),
  suggestions: z.array(ambientSuggestionSchema),
});

/** ambient suggestions 状态。 */
export type AmbientSuggestionsState = z.infer<typeof ambientSuggestionsStateSchema>;

/** 状态文件名（原 `N_`）。 */
export const AMBIENT_SUGGESTIONS_FILENAME = "ambient-suggestions.json";

/** 空状态（原 `M_`，导出 `wd`）。 */
export const EMPTY_AMBIENT_SUGGESTIONS: AmbientSuggestionsState = {
  projectRoot: "",
  generatedAtMs: null,
  currentSuggestionIds: [],
  suggestions: [],
};

// ---------------------------------------------------------------------------
// 自动化 schema 族（原 `Gte`..`R_`）
// ---------------------------------------------------------------------------

/** 自动化状态。 */
export const automationStatusSchema = z.enum(["ACTIVE", "PAUSED", "DELETED"]);

/** 自动化类别。 */
export const automationKindSchema = z.enum(["cron", "heartbeat"]);

/** 执行环境。 */
export const executionEnvironmentSchema = z.enum(["worktree", "local"]);

/** 目标（项目/无项目）。 */
export const automationTargetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project"), project_id: z.string() }),
  z.object({ type: z.literal("projectless") }),
]);

/** 通知策略（原 `L_`，导出 `gd`）。 */
export const notificationPolicySchema = z.enum(["failed_runs_only"]);

/** 推理档（原 `R_`，导出 `_d`）。 */
export const reasoningEffortSchema = z.enum(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]);

/** 自动化记录（原 `Yte`）。 */
export const automationRecordSchema = z.object({
  version: z.number().optional(),
  id: z.string(),
  kind: automationKindSchema.optional(),
  name: z.string(),
  prompt: z.string(),
  status: automationStatusSchema,
  rrule: z.string().optional(),
  execution_environment: executionEnvironmentSchema.optional(),
  local_environment_config_path: z.string().optional(),
  model: z.string().optional(),
  reasoning_effort: reasoningEffortSchema.optional(),
  plugin_template_id: z.string().optional(),
  target: automationTargetSchema.optional(),
  notification_policy: notificationPolicySchema.optional(),
  cwds: z.array(z.string()).optional(),
  target_thread_id: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type AutomationRecord = z.infer<typeof automationRecordSchema>;

// ---------------------------------------------------------------------------
// 错误文案（原 `I_`/`Wte`）
// ---------------------------------------------------------------------------

/** 无未来运行文案（原 `I_`，导出 `pd`）。 */
export const NO_FUTURE_RUNS_ERROR =
  "Automation schedule has no future runs. Check that its start time, interval, and BYHOUR/BYMINUTE/BYSECOND values can reach a future occurrence.";

/** 自动化不存在文案（原 `Wte`）。 */
export const AUTOMATION_MISSING_ERROR =
  "Automation does not exist in the app and could not be updated. It may have been deleted manually by the user.";

// ---------------------------------------------------------------------------
// 常量与判定（原 `Xte`/`Zte`/`z_`/`B_`/`V_`/`H_`/`U_`/`W_`/`G_`）
// ---------------------------------------------------------------------------

/** 默认 RRULE（原 `Xte`）。 */
export const DEFAULT_AUTOMATION_RRULE = "FREQ=HOURLY;INTERVAL=24;BYMINUTE=0";

/** 默认执行环境（原 `Zte`）。 */
const DEFAULT_EXECUTION_ENVIRONMENT = "worktree";

/** 自动化默认模型（原 `z_`）。 */
export const AUTOMATION_DEFAULT_MODEL = DEFAULT_MODELS.automationModel;

/** 默认推理档（原 `B_`）。 */
export const DEFAULT_REASONING_EFFORT = "medium";

/** codex 优先模型（原 `V_`）。 */
export const CODEX_PREFERRED_MODEL = "gpt-5.3-codex";

/** cron 判定（原 `H_`）。 */
export function isCronAutomation(record: Pick<AutomationRecord, "kind">): boolean {
  return record.kind === "cron";
}

/** heartbeat 判定（原 `U_`）。 */
export function isHeartbeatAutomation(record: Pick<AutomationRecord, "kind">): boolean {
  return record.kind === "heartbeat";
}

/** rrule 缺省（原 `W_`）。 */
export function effectiveRrule(rrule: string | null | undefined): string {
  return rrule?.trim() || DEFAULT_AUTOMATION_RRULE;
}

/** 执行环境归一（原 `G_`）。 */
export function effectiveExecutionEnvironment(environment: string | null | undefined): "worktree" | "local" {
  return environment === "worktree" || environment === "local" ? environment : DEFAULT_EXECUTION_ENVIRONMENT;
}

// ---------------------------------------------------------------------------
// 模型选择（原 `K_`/`q_`/`J_`/`Y_`）
// ---------------------------------------------------------------------------

/** 可选模型形态。 */
export interface SelectableModel {
  model: string;
  isDefault?: boolean;
  supportedReasoningEfforts?: { reasoningEffort: string }[];
  defaultReasoningEffort?: string | null;
}

/** 按 slug 查找（原 `K_`）。 */
export function findModel(models: SelectableModel[], slug: string | null | undefined): SelectableModel | null {
  return slug == null ? null : (models.find((entry) => entry.model === slug) ?? null);
}

/** 推理档校验（原 `q_`：支持性 → 默认档 → 首个支持档）。 */
export function effectiveReasoningEffort({ model, reasoningEffort }: { model: SelectableModel | null; reasoningEffort: string | null }): string | null {
  const supported = model?.supportedReasoningEfforts ?? [];
  return reasoningEffort != null && supported.some((entry) => entry.reasoningEffort === reasoningEffort)
    ? reasoningEffort
    : (model?.defaultReasoningEffort ?? supported[0]?.reasoningEffort ?? null);
}

/** 默认模型选择（原 `J_`：slug → isDefault → 自动化默认 → 首项）。 */
export function pickDefaultModel(models: SelectableModel[], defaultModel: string | null | undefined): SelectableModel | null {
  return (
    models.find((entry) => entry.model === defaultModel) ??
    models.find((entry) => entry.isDefault) ??
    models.find((entry) => entry.model === AUTOMATION_DEFAULT_MODEL) ??
    models[0] ??
    null
  );
}

/** 自动化的生效模型（原 `Y_`）。 */
export function effectiveModelForAutomation({
  automation,
  models,
  defaultModel,
}: {
  automation: Pick<AutomationRecord, "model" | "reasoning_effort">;
  models: SelectableModel[];
  defaultModel?: string | null;
}): { model: string; reasoningEffort: string } {
  const bySlug = findModel(models, automation.model);
  if (bySlug != null)
    return {
      model: bySlug.model,
      reasoningEffort: effectiveReasoningEffort({ model: bySlug, reasoningEffort: automation.reasoning_effort ?? null }),
    };
  if (automation.model == null) {
    const codex = findModel(models, CODEX_PREFERRED_MODEL);
    if (codex != null)
      return {
        model: codex.model,
        reasoningEffort: effectiveReasoningEffort({ model: codex, reasoningEffort: automation.reasoning_effort ?? DEFAULT_REASONING_EFFORT }),
      };
  }
  const fallback = pickDefaultModel(models, defaultModel);
  return fallback == null
    ? { model: automation.model ?? CODEX_PREFERRED_MODEL, reasoningEffort: automation.reasoning_effort ?? DEFAULT_REASONING_EFFORT }
    : { model: fallback.model, reasoningEffort: effectiveReasoningEffort({ model: fallback, reasoningEffort: null }) };
}

// ---------------------------------------------------------------------------
// heartbeat XML 解析（原 `X_`/`Z_`/`Q_`/`$_`）
// ---------------------------------------------------------------------------

/** heartbeat 触发内容。 */
export interface HeartbeatTrigger {
  automationId: string | null;
  currentTimeIso: string;
  instructions: string;
}

/** XML 字段提取（原 `Q_`）。 */
function heartbeatField(text: string, tag: string): string | null {
  return new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i").exec(text)?.[1].trim() ?? null;
}

/** heartbeat 文本解析（原 `X_`）。 */
export function parseHeartbeatText(text: string): HeartbeatTrigger | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("<heartbeat>") || !trimmed.endsWith("</heartbeat>")) return null;
  const currentTimeIso = heartbeatField(trimmed, "current_time_iso");
  const instructions = heartbeatField(trimmed, "instructions");
  if (currentTimeIso == null || instructions == null) return null;
  return { automationId: heartbeatField(trimmed, "automation_id"), currentTimeIso, instructions };
}

/** 从文本块聚合解析（原 `Z_`）。 */
export function parseHeartbeatFromBlocks(blocks: { type: string; text: string }[] | null | undefined): HeartbeatTrigger | null {
  return blocks == null
    ? null
    : parseHeartbeatText(
        blocks
          .flatMap((block) => (block.type === "text" ? [block.text] : []))
          .join("\n"),
      );
}

/** automation_update 工具输出识别（原 `$_`）。 */
export function parseAutomationUpdateOutput(call: { namespace?: string; name?: string; output?: unknown } | null | undefined): { matched: boolean } | null {
  if (call?.namespace !== "codex_app" || call.name !== "automation_update" || typeof call.output != "string") return null;
  const output = call.output;
  return (output.startsWith("Automation: ") && output.includes("\nAutomation ID: ")) || parseHeartbeatText(output) != null
    ? { matched: true }
    : null;
}

// ---------------------------------------------------------------------------
// 兼容导出（automation-settings 分区 8 个压缩名）
// ---------------------------------------------------------------------------

export {
  notificationPolicySchema as gd,
  reasoningEffortSchema as _d,
  NO_FUTURE_RUNS_ERROR as pd,
  DEFAULT_MODELS as Sd,
  remoteModelSlugs as Cd,
  EMPTY_AMBIENT_SUGGESTIONS as wd,
  AGENT_MODE_BY_HOST_ID_KEY as Td,
  DEFAULT_OPEN_TARGET_PREFERENCE as ef,
};
