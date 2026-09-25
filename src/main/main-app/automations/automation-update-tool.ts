// automation_update 工具：artifact-template-picker 配置注入 + 工具参数 schema
// 群 + create/update/delete 执行器 + automations 服务门面。
//
// 对应 main-C-Mhak1n.ts 82,022-82,508：
//   - JN/iMe/YN：artifact-template-picker 的 mcp_servers 覆写（打包资源内的
//     server.mjs + CODEX_ARTIFACT_TEMPLATE_SKILLS 环境变量，限额 100 条 /
//     24,000 字节 / 描述 600 字符；技能名优先级 openai-templates: > 其他
//     命名空间 > 裸名）
//   - aMe~hMe/_Me/lP：automation_update 的完整参数 schema 群（view/create/
//     suggested_create/update/suggested_update/delete 五模式 × cron/heartbeat
//     两形态；RRULE 文案、DTSTART 防护、targetThreadId 校验）
//   - yMe/bMe：create/update 输入构造（heartbeat → targetThreadId 回退当前
//     线程；cron → local 执行环境）
//   - uP/dP/fP/pP/mP/SMe：工具回执、模式归一（suggested_* → 连字符）、
//     heartbeat 目标校验、失败文案
//   - xMe：执行器主体（worktree 更新安全封锁 + 三分支 mutation 记账）
//   - CMe：automations 服务门面（shared 登记表或 habitat 服务双路径 +
//     迁移期封锁 + 仅本地线程）
//
// 模块加载期副作用：仅常量、schema 构建与一次 schema→JSON Schema 的自检
// （原 82,195 顶层语句），无 I/O、无监听。

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  bf as literalSchema,
  df as enumSchema,
  gd as notificationPolicySchema,
  _d as reasoningEffortSchema,
  Df as strictObjectSchema,
  vf as discriminatedUnionSchema,
  Pf as uuidSchema,
  yf as zAny,
  Rf as toJsonSchema,
  Uf as EventEmitterBase,
  Ln as executionHostNodePath,
  yr as createLocalAutomationRecord,
  Vr as updateCanonicalRecord,
  xr as getCanonicalAutomation,
  br as removeAutomationWithStatus,
  ei as removeAutomationRegistryEntry,
  md as missingAutomationMessage,
} from "@chunk/shared";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { resolveCompatibilityCwds, assertWorktreeTargetRequirements } from "./index";
import type { LocalAutomation } from "./habitat";

// ---------------------------------------------------------------------------
// artifact-template-picker 配置（原 `JN`/`iMe`/`YN` + `tMe`/`nMe`/`rMe`）
// ---------------------------------------------------------------------------

const ARTIFACT_TEMPLATE_SKILL_LIMIT = 100;
const ARTIFACT_TEMPLATE_ENV_BYTE_LIMIT = 24_000;
const ARTIFACT_TEMPLATE_DESCRIPTION_CHAR_LIMIT = 600;
const ARTIFACT_TEMPLATE_SKILL_NAME_PATTERN = /^(?:[^:]+:)?artifact-template-[a-z0-9][a-z0-9._-]*$/u;

/** 技能名优先级（原 `YN`）：openai-templates: > 其他命名空间 > 裸名。 */
function artifactTemplateSkillPriority(name: string): number {
  return name.includes(":") ? (name.startsWith("openai-templates:") ? 2 : 1) : 0;
}

/** artifact-template-picker 的 mcp_servers 覆写（原 `JN`）。 */
function artifactTemplatePickerOverrides({
  artifactTemplateSkills,
  isPackaged,
  resourcesPath,
  shouldUseWslPaths,
}: {
  artifactTemplateSkills?: Array<{
    description: string;
    enabled: boolean;
    interface?: { shortDescription?: string; displayName?: string };
    name: string;
    path: string;
  }>;
  isPackaged: boolean;
  resourcesPath: string;
  shouldUseWslPaths: boolean;
}): Record<string, { args: string[]; command: string; env: Record<string, string> }> | null {
  if (shouldUseWslPaths) return null;
  const root = isPackaged ? resourcesPath : resolveElectronResourcesPath({ env: process.env, resourcesPath });
  if (root == null) return null;
  const command = executionHostNodePath(root);
  const serverEntry = join(root, "artifact-template-picker", "server.mjs");
  if (command == null || !existsSync(serverEntry)) return null;
  const server: { args: string[]; command: string; env: Record<string, string> } = { command, args: [serverEntry], env: {} };
  if (artifactTemplateSkills != null) {
    const candidates = artifactTemplateSkills
      .filter((skill) => skill.enabled && ARTIFACT_TEMPLATE_SKILL_NAME_PATTERN.test(skill.name))
      .sort((a, b) => artifactTemplateSkillPriority(a.name) - artifactTemplateSkillPriority(b.name));
    const selected: Array<{ description: string; skillName: string; skillPath: string }> = [];
    const seenNames = new Set<string>();
    const seenPaths = new Set<string>();
    let envBytes = 2;
    for (const skill of candidates) {
      const pathKey = process.platform === "win32" ? skill.path.toLowerCase() : skill.path;
      if (seenNames.has(skill.name) || seenPaths.has(pathKey) || selected.length === ARTIFACT_TEMPLATE_SKILL_LIMIT) continue;
      const entry = {
        skillName: skill.name,
        skillPath: skill.path,
        description: Array.from(
          skill.description.trim() ||
            skill.interface?.shortDescription?.trim() ||
            skill.interface?.displayName?.trim() ||
            skill.name,
        )
          .slice(0, ARTIFACT_TEMPLATE_DESCRIPTION_CHAR_LIMIT)
          .join(""),
      };
      const entryBytes = Buffer.byteLength(JSON.stringify(entry), "utf8") + Number(selected.length > 0);
      if (envBytes + entryBytes > ARTIFACT_TEMPLATE_ENV_BYTE_LIMIT) continue;
      selected.push(entry);
      seenNames.add(skill.name);
      seenPaths.add(pathKey);
      envBytes += entryBytes;
    }
    if (selected.length > 0) server.env.CODEX_ARTIFACT_TEMPLATE_SKILLS = JSON.stringify(selected);
  }
  return { "mcp_servers.openai_artifact_template_picker": server };
}

/** 解析 artifact-template-picker 配置（原 `iMe`）：可用性开关 + 技能清单合并。 */
export async function resolveArtifactTemplatePickerConfig({
  appServerConnection,
  cwd,
  desktopFeatureAvailability,
  isPackaged,
  resourcesPath,
  shouldUseWslPaths,
}: {
  appServerConnection: { listSkills(request: { cwds?: string[] }): Promise<{ data: Array<{ skills: Array<{ description: string; enabled: boolean; interface?: { shortDescription?: string; displayName?: string }; name: string; path: string }> }> }> };
  cwd: string | null;
  desktopFeatureAvailability: { artifactTemplatePicker: boolean };
  isPackaged: boolean;
  resourcesPath: string;
  shouldUseWslPaths: boolean;
}): Promise<Record<string, { args: string[]; command: string; env: Record<string, string> }> | null> {
  if (!desktopFeatureAvailability.artifactTemplatePicker) return null;
  const base = { isPackaged, resourcesPath, shouldUseWslPaths };
  const overrides = artifactTemplatePickerOverrides(base);
  if (overrides == null) return null;
  const skills = await appServerConnection
    .listSkills(cwd == null ? {} : { cwds: [cwd] })
    .then((response) => response.data.flatMap((entry) => entry.skills))
    .catch(() => null);
  return skills == null ? overrides : artifactTemplatePickerOverrides({ ...base, artifactTemplateSkills: skills });
}

// ---------------------------------------------------------------------------
// automation_update 参数 schema 群（原 `aMe`~`lP`）
// ---------------------------------------------------------------------------

export const AUTOMATION_UPDATE_TOOL_NAME = "automation_update";

const statusSchema = enumSchema(["ACTIVE", "PAUSED"]).describe(
  "One of ACTIVE or PAUSED. Default to ACTIVE unless the user asks to start paused.",
);
const nonEmptyText = stringSchema().trim().min(1);
const updateRrule = nonEmptyText.describe(
  "RRULE schedule string. Preserve the existing value for unrelated updates. When changing the schedule, interpret requested times in the user's locale and do not include DTSTART or convert local wall-clock times to UTC; encode them directly with FREQ, BYDAY, BYHOUR, and BYMINUTE. Cron automations use hourly interval or weekly schedules. Heartbeat automations attached to a thread can use minute-based intervals such as FREQ=MINUTELY;INTERVAL=30 or daily/weekly wall-clock schedules.",
);
const createRrule = nonEmptyText.describe(
  "RRULE schedule string. Interpret requested times in the user's locale. For mode=create, do not include DTSTART or convert local wall-clock times to UTC; encode them directly with FREQ, BYDAY, BYHOUR, and BYMINUTE. When the user intentionally requests a DTSTART-anchored or timezone-specific schedule, use mode=suggested_create so they can review it before saving. Cron automations use hourly interval or weekly schedules. Heartbeat automations attached to a thread can use minute-based intervals such as FREQ=MINUTELY;INTERVAL=30 or daily/weekly wall-clock schedules.",
);
const executionEnvironmentSchema = enumSchema(["worktree", "local"]).describe(
  "Cron automation execution environment. New automations must use local; updates may preserve worktree for existing automations.",
);
const destinationSchema = enumSchema(["local", "thread"]).describe(
  "Optional automation destination. Use thread for heartbeat automations attached to the current local thread.",
);
const projectIdSchema = stringSchema()
  .trim()
  .min(1)
  .nullable()
  .describe("Cron automations only. The target project id, or null for Threads. Use list_projects to find project ids.");
const automationIdSchema = nonEmptyText.describe(
  "Automation id. Required for mode=view, mode=update, mode=delete, and mode=suggested_update. Omit for mode=create and mode=suggested_create.",
);
const baseFields = strictObjectSchema({
  name: nonEmptyText.describe(
    "Short human-readable automation name. If the user does not provide one, choose a concise name.",
  ),
  prompt: nonEmptyText.describe(
    "The automation prompt. Describe only the task itself; do not include schedule, workspace, or thread details because those are provided separately. Keep it self-contained, include output expectations when useful, and do not ask it to write a file or announce nothing to do unless the user explicitly asked for that.",
  ),
  rrule: updateRrule,
  status: statusSchema,
  notificationPolicy: (notificationPolicySchema as { nullable(): { optional(): { describe(message: string): unknown } } }).nullable().optional().describe(
    "Optional notification policy. Use failed_runs_only when the user asks to mute or suppress completed-run notifications. For updates, omit to preserve the existing value and use null only when the user explicitly asks to unmute. On create, omit for the existing default behavior.",
  ),
});
const cronBase = (baseFields as unknown as { extend(fields: Record<string, unknown>): unknown }).extend({
  kind: literalSchema("cron").describe(
    "Use cron only when the user explicitly wants each run to start a new task or standalone recurring work against a workspace.",
  ),
  projectId: projectIdSchema,
  model: nonEmptyText.describe("Model to use for cron automations."),
  reasoningEffort: reasoningEffortSchema.describe(
    "Reasoning effort to use for cron automations. One of none, minimal, low, medium, high, xhigh, max, or ultra.",
  ),
});
const heartbeatBase = (baseFields as unknown as { extend(fields: Record<string, unknown>): unknown }).extend({
  kind: literalSchema("heartbeat").describe(
    "Default to heartbeat so recurring runs continue in this thread. Use cron only when the user explicitly wants a new task for each run.",
  ),
  destination: (destinationSchema as { optional(): unknown }).optional(),
  targetThreadId: (nonEmptyText as unknown as { meta(options: unknown): { describe(message: string): { optional(): unknown } } })
    .meta({ format: "uuid" })
    .describe(
      "Target thread UUID for heartbeat automations. Prefer destination=thread for the current local thread instead of inventing or copying raw thread ids.",
    )
    .optional(),
});
const viewMode = strictObjectSchema({ mode: literalSchema("view"), id: automationIdSchema });
const deleteMode = strictObjectSchema({ mode: literalSchema("delete"), id: automationIdSchema });
const createModes = enumSchema(["create", "suggested_create"]);
const updateModes = enumSchema(["update", "suggested_update"]);
const environmentOptions = {
  destination: (enumSchema(["local", "worktree"]) as { optional(): unknown }).optional(),
  executionEnvironment: executionEnvironmentSchema,
  localEnvironmentConfigPath: (stringSchema().trim().min(1) as { nullable(): { optional(): unknown } }).nullable().optional(),
};
const immediateCronCreate = (cronBase as unknown as { extend(fields: Record<string, unknown>): unknown }).extend({
  mode: createModes,
  destination: (literalSchema("local") as { optional(): unknown }).optional(),
  executionEnvironment: literalSchema("local"),
  rrule: createRrule,
});
const suggestedCronCreate = (cronBase as unknown as { extend(fields: Record<string, unknown>): unknown }).extend({
  mode: createModes,
  ...environmentOptions,
});
const heartbeatCreate = (heartbeatBase as unknown as { extend(fields: Record<string, unknown>): { superRefine(check: (value: Record<string, unknown>, issues: { addIssue(issue: unknown): void }) => void): unknown } }).extend({
  mode: createModes,
  rrule: createRrule,
}).superRefine(requireHeartbeatTarget);
const cronUpdate = (cronBase as unknown as { extend(fields: Record<string, unknown>): unknown }).extend({
  mode: updateModes,
  id: automationIdSchema,
  ...environmentOptions,
});
const heartbeatUpdate = (heartbeatBase as unknown as { extend(fields: Record<string, unknown>): { superRefine(check: (value: Record<string, unknown>, issues: { addIssue(issue: unknown): void }) => void): unknown } }).extend({
  mode: updateModes,
  id: automationIdSchema,
}).superRefine(requireHeartbeatTarget);
const createUnion = (discriminatedUnionSchema("kind", [immediateCronCreate, heartbeatCreate]) as unknown as {
  refine(predicate: (value: Record<string, unknown>) => boolean, options: { message: string; path: string[] }): unknown;
}).refine(({ mode, rrule }) => mode !== "create" || !/(^|[;\n])\s*DTSTART\b/i.test(rrule as string), {
  message:
    "Immediate automation creates cannot include DTSTART because it may change local wall-clock times to UTC. Omit DTSTART, or retry with mode=suggested_create when the user intentionally requested anchored or timezone-specific RFC semantics.",
  path: ["rrule"],
});
const updateUnion = discriminatedUnionSchema("kind", [cronUpdate, heartbeatUpdate]);
const automationUpdateSchema = (discriminatedUnionSchema("mode", [viewMode, createUnion, updateUnion, deleteMode]) as unknown as {
  refine(predicate: (value: Record<string, unknown>) => boolean, options: { message: string; path: string[] }): unknown;
}).refine(
  (value) =>
    !("targetThreadId" in value) ||
    value.targetThreadId == null ||
    (uuidSchema as { safeParse(input: unknown): { success: boolean } }).safeParse(value.targetThreadId).success,
  { message: "Invalid UUID", path: ["targetThreadId"] },
);
const suggestedCreateUnion = discriminatedUnionSchema("kind", [suggestedCronCreate, heartbeatCreate]);
const suggestedSchema = discriminatedUnionSchema("mode", [viewMode, suggestedCreateUnion, updateUnion, deleteMode]);
/** suggested 模式的原始联合（原 `_Me`）：线上仅用于一次性 transform 自检。 */
export const suggestedAutomationUpdateSchema = suggestedSchema;

/** 工具输入 schema（原 `lP`）：模式归一后的判别联合。 */
export const automationUpdateInput = (automationUpdateSchema as unknown as { transform(fn: (value: Record<string, unknown>) => unknown): unknown }).transform(normalizeMode);
// 原 82,193 有一条被丢弃的 `_Me.transform(dP)` 表达式（求值后即弃），不保留。

// 模块加载自检（原 82,195 顶层语句）：确保 schema 可按 input 形态转 JSON Schema。
(zAny() as { parse(input: unknown): unknown }).parse(
  (toJsonSchema as (schema: unknown, options: { io: string; reused: string }) => unknown)(automationUpdateInput, { io: "input", reused: "ref" }),
);

/** 模式归一（原 `dP`）：suggested_create/update → suggested-create/update。 */
function normalizeMode(value: Record<string, unknown>): Record<string, unknown> {
  let mode: string;
  switch (value.mode) {
    case "suggested_create":
      mode = "suggested-create";
      break;
    case "suggested_update":
      mode = "suggested-update";
      break;
    case "view":
    case "create":
    case "update":
    case "delete":
      mode = value.mode as string;
      break;
  }
  return { ...value, mode };
}

/** heartbeat 目标校验（原 `fP`）：targetThreadId 与 destination=thread 二选一。 */
function requireHeartbeatTarget(value: Record<string, unknown>, issues: { addIssue(issue: unknown): void }): void {
  if (value.targetThreadId == null && value.destination !== "thread") {
    issues.addIssue({
      code: "custom",
      message: "Missing targetThreadId or destination=thread",
      path: ["targetThreadId"],
    });
  }
}

// ---------------------------------------------------------------------------
// 执行器（原 `yMe`/`bMe`/`uP`/`pP`/`mP`/`SMe`/`xMe`）
// ---------------------------------------------------------------------------

/** 工具可见的 automation 记录（结构化子集）。 */
export interface ToolAutomationItem {
  id: string;
  kind: "cron" | "heartbeat";
  name: string;
  rrule: string;
  status: string;
}

/** create 输入（原 `yMe` 输出）。 */
export interface CreateAutomationInput {
  kind: "cron" | "heartbeat";
  name: string;
  prompt: string;
  status: string;
  rrule: string;
  notificationPolicy?: unknown;
  targetThreadId?: string;
  model: string | null;
  reasoningEffort: unknown;
  projectId?: string | null;
  executionEnvironment?: string;
  localEnvironmentConfigPath?: string | null;
}

/** update 输入（原 `bMe` 输出）。 */
export interface UpdateAutomationInput extends CreateAutomationInput {
  id: string;
}

/** 变更操作面（门面或其 native 变体）。 */
export interface AutomationMutationOps {
  create(input: CreateAutomationInput): Promise<{ item: ToolAutomationItem & Record<string, unknown> }>;
  update(input: UpdateAutomationInput): Promise<{ item: ToolAutomationItem & Record<string, unknown> }>;
  delete(id: { id: string }): Promise<{ item: (ToolAutomationItem & Record<string, unknown>) | null; status: string; success: boolean }>;
}

/** 工具回执（原 `uP`）。 */
interface ToolResponse {
  contentItems: Array<{ type: string; text: string }>;
  success: boolean;
}

interface ToolResult {
  response: ToolResponse;
  mutation?: {
    mode: string;
    input?: unknown;
    id?: string;
    item?: unknown;
    status?: string;
    failureReason?: string;
  };
}

/** create 输入构造（原 `yMe`）：heartbeat 回退当前线程。 */
function buildCreateInput(request: Record<string, unknown>, threadId: string): CreateAutomationInput {
  if (request.kind === "heartbeat") {
    return {
      kind: "heartbeat",
      name: (request.name as string) ?? "",
      prompt: (request.prompt as string) ?? "",
      status: request.status as string,
      targetThreadId: (request.targetThreadId as string) ?? threadId,
      model: null,
      reasoningEffort: null,
      ...(request.notificationPolicy == null ? {} : { notificationPolicy: request.notificationPolicy }),
      rrule: (request.rrule as string) ?? "",
    };
  }
  return {
    kind: "cron",
    name: (request.name as string) ?? "",
    prompt: (request.prompt as string) ?? "",
    status: request.status as string,
    projectId: (request.projectId as string) ?? null,
    executionEnvironment: "local",
    localEnvironmentConfigPath: null,
    model: (request.model as string) ?? null,
    reasoningEffort: (request.reasoningEffort as string) ?? null,
    ...(request.notificationPolicy == null ? {} : { notificationPolicy: request.notificationPolicy }),
    rrule: (request.rrule as string) ?? "",
  };
}

/** update 输入构造（原 `bMe`）：保留现有 executionEnvironment。 */
function buildUpdateInput(request: Record<string, unknown>, threadId: string): UpdateAutomationInput {
  if (request.kind === "heartbeat") {
    return {
      id: (request.id as string) ?? "",
      kind: "heartbeat",
      name: (request.name as string) ?? "",
      prompt: (request.prompt as string) ?? "",
      status: (request.status as string) ?? "ACTIVE",
      targetThreadId: (request.targetThreadId as string) ?? threadId,
      model: null,
      reasoningEffort: null,
      ...(request.notificationPolicy === undefined ? {} : { notificationPolicy: request.notificationPolicy }),
      rrule: (request.rrule as string) ?? "",
    };
  }
  return {
    id: (request.id as string) ?? "",
    kind: "cron",
    name: (request.name as string) ?? "",
    prompt: (request.prompt as string) ?? "",
    status: (request.status as string) ?? "ACTIVE",
    projectId: (request.projectId as string) ?? null,
    executionEnvironment: (request.executionEnvironment as string) ?? "local",
    localEnvironmentConfigPath: request.localEnvironmentConfigPath as string | null,
    model: (request.model as string) ?? null,
    reasoningEffort: (request.reasoningEffort as string) ?? null,
    ...(request.notificationPolicy === undefined ? {} : { notificationPolicy: request.notificationPolicy }),
    rrule: (request.rrule as string) ?? "",
  };
}

/** 成功回执（原 `uP`）。 */
function toolSuccessResponse(summary: {
  automationId: string;
  mode: string;
  status: string;
} | null | {
  automationId: string;
  mode: string;
  deleteStatus: string;
  snapshot: { kind: string; name: string; rrule: string } | null;
}): ToolResponse {
  return {
    contentItems: [
      {
        type: "inputText",
        text:
          summary == null
            ? "Rendered automation card in the app."
            : "mode" in summary && summary.mode === "create"
              ? "Created automation in the app."
              : "mode" in summary && summary.mode === "update"
                ? "Updated automation in the app."
                : "deleteStatus" in summary && summary.deleteStatus === "not_found"
                  ? "Automation already does not exist in the app."
                  : "Deleted automation in the app.",
      },
      ...(summary == null ? [] : [{ type: "inputText", text: JSON.stringify(summary) }]),
    ],
    success: true,
  };
}

/** 失败回执（原 `pP`）。 */
function toolFailureResponse(text: string): ToolResult {
  return { response: { contentItems: [{ type: "inputText", text }], success: false } };
}

/** 变更失败文案（原 `mP`）：宿主自定义文案优先，已知错误透传。 */
function mutationFailureMessage(error: unknown, mode: string, customize: (error: unknown) => string | null): string {
  return (
    customize(error) ??
    (error instanceof Error &&
    (error.message ===
      "Automation does not exist in the app and could not be updated. It may have been deleted manually by the user." ||
      error.message ===
        "Automation schedule has no future runs. Check that its start time, interval, and BYHOUR/BYMINUTE/BYSECOND values can reach a future occurrence.")
      ? error.message
      : `Failed to ${mode} automation.`)
  );
}

/** 删除失败文案（原 `SMe`）。 */
function deleteStatusMessage(status: string): string {
  switch (status) {
    case "invalid_id":
      return "Automation id was invalid.";
    case "store_unavailable":
      return "Automation storage is unavailable.";
    case "state_cleanup_failed":
      return "Automation scheduling state could not be updated.";
    case "remove_failed":
      return "Automation still exists after the app tried to delete it.";
    case "deleted":
    case "not_found":
      return "Automation was not deleted.";
  }
  return "Automation was not deleted.";
}

/** 执行器主体（原 `xMe`）：schema 校验 → worktree 安全封锁 → 三分支。 */
async function executeAutomationUpdateTool(
  ops: AutomationMutationOps,
  { threadId, argumentsValue }: { threadId: string; argumentsValue: unknown },
  customizeFailureMessage: (error: unknown) => string | null,
): Promise<ToolResult> {
  const parsed = (automationUpdateInput as unknown as {
    safeParse(input: unknown): { success: boolean; data?: Record<string, unknown>; error?: { issues: Array<{ path: Array<string | number>; message: string }> } };
  }).safeParse(argumentsValue);
  if (!parsed.success) {
    return toolFailureResponse(
      `${AUTOMATION_UPDATE_TOOL_NAME} received invalid arguments: ${parsed.error!.issues
        .map((issue) => `${issue.path.join(".") || "arguments"}: ${issue.message}`)
        .join("; ")}.`,
    );
  }
  const request = parsed.data!;
  if (
    request.kind === "cron" &&
    request.mode === "update" &&
    request.executionEnvironment === "worktree" &&
    (request.localEnvironmentConfigPath === undefined || request.localEnvironmentConfigPath != null)
  ) {
    return toolFailureResponse(
      "For safety, the model cannot immediately update a worktree automation that may run a local environment setup script. Use suggested_update so the user can review it, or set localEnvironmentConfigPath to null.",
    );
  }
  if (request.mode === "create") {
    const input = buildCreateInput(request, threadId);
    try {
      const { item } = await ops.create(input);
      return {
        response: toolSuccessResponse({ automationId: item.id, mode: "create", status: item.status }),
        mutation: { mode: "create", input, item },
      };
    } catch (error) {
      return {
        ...toolFailureResponse(mutationFailureMessage(error, request.mode as string, customizeFailureMessage)),
        mutation: { mode: "create", input, item: null, failureReason: "host_error" },
      };
    }
  }
  if (request.mode === "update") {
    const input = buildUpdateInput(request, threadId);
    try {
      const { item } = await ops.update(input);
      return {
        response: toolSuccessResponse({ automationId: item.id, mode: "update", status: item.status }),
        mutation: { mode: "update", input, item },
      };
    } catch (error) {
      return {
        ...toolFailureResponse(mutationFailureMessage(error, request.mode as string, customizeFailureMessage)),
        mutation: {
          mode: "update",
          input,
          item: null,
          failureReason:
            error instanceof Error &&
            error.message ===
              "Automation does not exist in the app and could not be updated. It may have been deleted manually by the user."
              ? "missing_automation"
              : "host_error",
        },
      };
    }
  }
  if (request.mode === "delete") {
    const id = (request.id as string) ?? "";
    try {
      const { item, status, success } = await ops.delete({ id });
      return {
        response: success
          ? toolSuccessResponse({
              automationId: id,
              mode: "delete",
              deleteStatus: status === "not_found" ? "not_found" : "deleted",
              snapshot: item == null ? null : { kind: item.kind, name: item.name, rrule: item.rrule },
            })
          : toolFailureResponse(deleteStatusMessage(status)).response,
        mutation: { mode: "delete", id, item, status },
      };
    } catch (error) {
      return {
        ...toolFailureResponse(mutationFailureMessage(error, request.mode as string, customizeFailureMessage)),
        mutation: { mode: "delete", id, item: null, status: "host_error" },
      };
    }
  }
  return { response: toolSuccessResponse(null) };
}

// ---------------------------------------------------------------------------
// automations 服务门面（原 `CMe`）
// ---------------------------------------------------------------------------

/** habitat 服务面（结构化子集）。 */
export interface HabitatAutomationsServiceLike {
  create(automation: LocalAutomation, cwds: string[]): Promise<(ToolAutomationItem & Record<string, unknown>) | null>;
  update(automation: LocalAutomation, cwds: string[]): Promise<(ToolAutomationItem & Record<string, unknown>) | null>;
  delete(id: string): Promise<{ item: (ToolAutomationItem & Record<string, unknown>) | null; status: string }>;
  isLocalMigrationActive(): boolean;
}

/** app-server 连接注册表面（结构化子集）。 */
export interface AppServerConnectionRegistryLike {
  getConnection(hostId: string): { notifyAutomationRunsUpdated(): void };
}

/** 变更执行句柄（native 变体用，assertCurrent 后绑定连接）。 */
export interface MutationExecutionContext {
  assertCurrent(): void;
  connection?: { notifyAutomationRunsUpdated(): void };
}

/** 工具请求（hostId + 线程 + 参数）。 */
export interface AutomationToolRequest {
  argumentsValue: unknown;
  hostId: string;
  threadId: string;
}

/** automations 服务门面（原 `CMe`）：shared 登记表或 habitat 服务双路径。 */
export class AutomationsToolService extends (EventEmitterBase as new () => {}) {
  constructor(
    private globalState: { get(key: unknown): unknown },
    private appServerConnectionRegistry: AppServerConnectionRegistryLike,
    private habitatAutomationsService: HabitatAutomationsServiceLike | null,
  ) {
    super();
  }

  async create(input: CreateAutomationInput): Promise<{ item: ToolAutomationItem & Record<string, unknown> }> {
    return this.#create(input, null);
  }

  async #create(input: CreateAutomationInput, context: MutationExecutionContext | null): Promise<{ item: ToolAutomationItem & Record<string, unknown> }> {
    const cwds = input.kind === "cron" ? resolveCompatibilityCwds(this.globalState, (input.projectId as string | null) ?? null) : [];
    if (input.kind === "cron") {
      assertWorktreeTargetRequirements({
        compatibilityCwds: cwds,
        executionEnvironment: input.executionEnvironment ?? null,
        projectId: (input.projectId as string | null) ?? null,
      });
    }
    context?.assertCurrent();
    const item = this.habitatAutomationsService
      ? await this.habitatAutomationsService.create(input as never as LocalAutomation, cwds)
      : (createLocalAutomationRecord(input, cwds) as ToolAutomationItem & Record<string, unknown>);
    if (item == null) throw new Error("Automation create failed.");
    return { item };
  }

  async update(input: UpdateAutomationInput): Promise<{ item: ToolAutomationItem & Record<string, unknown> }> {
    return this.#update(input, null);
  }

  async #update(input: UpdateAutomationInput, context: MutationExecutionContext | null): Promise<{ item: ToolAutomationItem & Record<string, unknown> }> {
    const cwds = input.kind === "cron" ? resolveCompatibilityCwds(this.globalState, (input.projectId as string | null) ?? null) : [];
    if (input.kind === "cron") {
      assertWorktreeTargetRequirements({
        compatibilityCwds: cwds,
        executionEnvironment: input.executionEnvironment ?? null,
        projectId: (input.projectId as string | null) ?? null,
      });
    }
    context?.assertCurrent();
    const item = this.habitatAutomationsService
      ? await this.habitatAutomationsService.update(input as never as LocalAutomation, cwds)
      : (updateCanonicalRecord(input, cwds) as ToolAutomationItem & Record<string, unknown>);
    if (item == null) throw new Error(missingAutomationMessage as string);
    return { item };
  }

  async delete(id: { id: string }): Promise<{ item: (ToolAutomationItem & Record<string, unknown>) | null; status: string; success: boolean }> {
    return this.#delete(id.id, null);
  }

  async #delete(id: string, context: MutationExecutionContext | null): Promise<{ item: (ToolAutomationItem & Record<string, unknown>) | null; status: string; success: boolean }> {
    context?.assertCurrent();
    const { item, status } = this.habitatAutomationsService
      ? await this.habitatAutomationsService.delete(id)
      : { item: getCanonicalAutomation(id) as ToolAutomationItem & Record<string, unknown>, status: removeAutomationWithStatus(id) as string };
    const success = status === "deleted" || status === "not_found";
    if (success) {
      try {
        removeAutomationRegistryEntry(id);
        (context?.connection ?? this.appServerConnectionRegistry.getConnection("local")).notifyAutomationRunsUpdated();
      } catch {}
    }
    return { item, success, status };
  }

  /** 工具入口（原 `executeUpdateTool`）：非本地线程 / 迁移期封锁。 */
  executeUpdateTool(request: AutomationToolRequest): Promise<ToolResult> {
    return this.#runTool(request, this);
  }

  /** native 工具入口（原 `executeNativeUpdateTool`）：句柄存活期内绑定连接。 */
  executeNativeUpdateTool = (request: AutomationToolRequest, context: MutationExecutionContext): Promise<ToolResult> => {
    context.assertCurrent();
    return this.#runTool(request, {
      create: (input) => this.#create(input, context),
      update: (input) => this.#update(input, context),
      delete: ({ id }) => this.#delete(id, context),
    });
  };

  #runTool(
    request: AutomationToolRequest,
    ops: AutomationMutationOps,
  ): Promise<ToolResult> {
    if (request.hostId !== "local") {
      return Promise.resolve({
        response: {
          success: false,
          contentItems: [{ type: "inputText", text: "Automations are only supported for local threads." }],
        },
      });
    }
    if (this.habitatAutomationsService?.isLocalMigrationActive()) {
      return Promise.resolve({
        response: {
          success: false,
          contentItems: [
            {
              type: "inputText",
              text: "Local automation changes must use the Automations app after migration consent.",
            },
          ],
        },
      });
    }
    return executeAutomationUpdateTool(ops, request, () => null);
  }
}
