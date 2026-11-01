// Semantic automation_update input boundary and mutation executor.

export const AUTOMATION_UPDATE_TOOL_NAME = "automation_update";

export function createAutomationUpdateSchemas({
  schema,
  notificationPolicySchema,
  reasoningEffortSchema,
}: {
  schema: any;
  notificationPolicySchema: any;
  reasoningEffortSchema: any;
}) {
  const status = schema
    .df(["ACTIVE", "PAUSED"])
    .describe("One of ACTIVE or PAUSED. Default to ACTIVE unless the user asks to start paused.");
  const requiredText = schema.Of().trim().min(1);
  const existingRrule = requiredText.describe(
    "RRULE schedule string. Preserve the existing value for unrelated updates. When changing the schedule, interpret requested times in the user's locale and do not include DTSTART or convert local wall-clock times to UTC; encode them directly with FREQ, BYDAY, BYHOUR, and BYMINUTE. Cron automations use hourly interval or weekly schedules. Heartbeat automations attached to a thread can use minute-based intervals such as FREQ=MINUTELY;INTERVAL=30 or daily/weekly wall-clock schedules.",
  );
  const createRrule = requiredText.describe(
    "RRULE schedule string. Interpret requested times in the user's locale. For mode=create, do not include DTSTART or convert local wall-clock times to UTC; encode them directly with FREQ, BYDAY, BYHOUR, and BYMINUTE. When the user intentionally requests a DTSTART-anchored or timezone-specific schedule, use mode=suggested_create so they can review it before saving. Cron automations use hourly interval or weekly schedules. Heartbeat automations attached to a thread can use minute-based intervals such as FREQ=MINUTELY;INTERVAL=30 or daily/weekly wall-clock schedules.",
  );
  const executionEnvironment = schema
    .df(["worktree", "local"])
    .describe("Cron automation execution environment. New automations must use local; updates may preserve worktree for existing automations.");
  const heartbeatDestination = schema
    .df(["local", "thread"])
    .describe("Optional automation destination. Use thread for heartbeat automations attached to the current local thread.");
  const projectId = schema
    .Of()
    .trim()
    .min(1)
    .nullable()
    .describe("Cron automations only. The target project id, or null for Threads. Use list_projects to find project ids.");
  const automationId = requiredText.describe(
    "Automation id. Required for mode=view, mode=update, mode=delete, and mode=suggested_update. Omit for mode=create and mode=suggested_create.",
  );
  const common = schema.Df({
    name: requiredText.describe("Short human-readable automation name. If the user does not provide one, choose a concise name."),
    prompt: requiredText.describe(
      "The automation prompt. Describe only the task itself; do not include schedule, workspace, or thread details because those are provided separately. Keep it self-sufficient, include output expectations when useful, and do not ask it to write a file or announce nothing to do unless the user explicitly asked for that.",
    ),
    rrule: existingRrule,
    status,
    notificationPolicy: notificationPolicySchema
      .nullable()
      .optional()
      .describe(
        "Optional notification policy. Use failed_runs_only when the user asks to mute or suppress completed-run notifications. For updates, omit to preserve the existing value and use null only when the user explicitly asks to unmute. On create, omit for the existing default behavior.",
      ),
  });
  const cron = common.extend({
    kind: schema
      .bf("cron")
      .describe("Use cron only when the user explicitly wants each run to start a new task or standalone recurring work against a workspace."),
    projectId,
    model: requiredText.describe("Model to use for cron automations."),
    reasoningEffort: reasoningEffortSchema.describe(
      "Reasoning effort to use for cron automations. One of none, minimal, low, medium, high, xhigh, max, or ultra.",
    ),
  });
  const heartbeat = common.extend({
    kind: schema
      .bf("heartbeat")
      .describe("Default to heartbeat so recurring runs continue in this thread. Use cron only when the user explicitly wants a new task for each run."),
    destination: heartbeatDestination.optional(),
    targetThreadId: requiredText
      .meta({ format: "uuid" })
      .describe(
        "Target thread UUID for heartbeat automations. Prefer destination=thread for the current local thread instead of inventing or copying raw thread ids.",
      )
      .optional(),
  });
  const view = schema.Df({ mode: schema.bf("view"), id: automationId });
  const remove = schema.Df({ mode: schema.bf("delete"), id: automationId });
  const createMode = schema.df(["create", "suggested_create"]);
  const updateMode = schema.df(["update", "suggested_update"]);
  const legacyCronFields = {
    destination: schema.df(["local", "worktree"]).optional(),
    executionEnvironment,
    localEnvironmentConfigPath: schema.Of().trim().min(1).nullable().optional(),
  };
  const immediateCronCreate = cron.extend({
    mode: createMode,
    destination: schema.bf("local").optional(),
    executionEnvironment: schema.bf("local"),
    rrule: createRrule,
  });
  const legacyCronCreate = cron.extend({ mode: createMode, ...legacyCronFields });
  const heartbeatCreate = heartbeat
    .extend({ mode: createMode, rrule: createRrule })
    .superRefine(validateHeartbeatTarget);
  const cronUpdate = cron.extend({ mode: updateMode, id: automationId, ...legacyCronFields });
  const heartbeatUpdate = heartbeat
    .extend({ mode: updateMode, id: automationId })
    .superRefine(validateHeartbeatTarget);
  const immediateCreate = schema
    .vf("kind", [immediateCronCreate, heartbeatCreate])
    .refine(
      ({ mode, rrule }: any) => mode !== "create" || !/(^|[;\n])\s*DTSTART\b/i.test(rrule),
      {
        message: "Immediate automation creates cannot include DTSTART because it may change local wall-clock times to UTC. Omit DTSTART, or retry with mode=suggested_create when the user intentionally requested anchored or timezone-specific RFC semantics.",
        path: ["rrule"],
      },
    );
  const update = schema.vf("kind", [cronUpdate, heartbeatUpdate]);
  const inputSchema = schema
    .vf("mode", [view, immediateCreate, update, remove])
    .refine(
      (input: any) =>
        !("targetThreadId" in input) ||
        input.targetThreadId == null ||
        schema.Pf().safeParse(input.targetThreadId).success,
      { message: "Invalid UUID", path: ["targetThreadId"] },
    )
    .transform(normalizeAutomationToolInputMode);

  // Preserve construction of the compatibility create schema used by older
  // worktree callers even though the immediate tool surface consumes inputSchema.
  schema
    .vf("mode", [view, schema.vf("kind", [legacyCronCreate, heartbeatCreate]), update, remove])
    .transform(normalizeAutomationToolInputMode);

  return { inputSchema, toolName: AUTOMATION_UPDATE_TOOL_NAME };
}

const MISSING_AUTOMATION = "Automation does not exist in the app and could not be updated. It may have been deleted manually by the user.";
const NO_FUTURE_RUNS = "Automation schedule has no future runs. Check that its start time, interval, and BYHOUR/BYMINUTE/BYSECOND values can reach a future occurrence.";

export function normalizeAutomationToolInputMode(input: Record<string, unknown>) {
  const mode = input.mode === "suggested_create"
    ? "suggested-create"
    : input.mode === "suggested_update"
      ? "suggested-update"
      : input.mode;
  return { ...input, mode };
}

export function validateHeartbeatTarget(input: { destination?: string; targetThreadId?: string | null }, context: { addIssue(issue: unknown): void }) {
  if (input.targetThreadId == null && input.destination !== "thread") {
    context.addIssue({ code: "custom", message: "Missing targetThreadId or destination=thread", path: ["targetThreadId"] });
  }
}

export function createAutomationUpdateTool({ inputSchema, toolName }: {
  inputSchema: { safeParse(value: unknown): { success: true; data: any } | { success: false; error: { issues: Array<{ message: string; path: Array<string | number> }> } } };
  toolName: string;
}) {
  return async function executeAutomationUpdateTool(
    operations: { create(input: any): Promise<{ item: any }>; update(input: any): Promise<{ item: any }>; delete(input: { id: string }): Promise<{ item: any; status: string; success: boolean }> },
    { threadId, argumentsValue }: { threadId: string; argumentsValue: unknown },
    customizeFailure: (error: unknown) => string | null,
  ) {
    const parsed = inputSchema.safeParse(argumentsValue);
    if (parsed.success === false) {
      return failure(`${toolName} received invalid arguments: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "arguments"}: ${issue.message}`).join("; ")}.`);
    }
    const input = parsed.data;
    if (input.kind === "cron" && input.mode === "update" && input.executionEnvironment === "worktree" && (input.localEnvironmentConfigPath === undefined || input.localEnvironmentConfigPath != null)) {
      return failure("For safety, the model cannot immediately update a worktree automation that may run a local environment setup script. Use suggested_update so the user can review it, or set localEnvironmentConfigPath to null.");
    }
    if (input.mode === "create") {
      const mutationInput = createInput(input, threadId);
      try {
        const { item } = await operations.create(mutationInput);
        return { response: success({ automationId: item.id, mode: "create", status: item.status }), mutation: { mode: "create", input: mutationInput, item } };
      } catch (error) {
        return { ...failure(errorMessage(error, input.mode, customizeFailure)), mutation: { mode: "create", input: mutationInput, item: null, failureReason: "host_error" } };
      }
    }
    if (input.mode === "update") {
      const mutationInput = updateInput(input, threadId);
      try {
        const { item } = await operations.update(mutationInput);
        return { response: success({ automationId: item.id, mode: "update", status: item.status }), mutation: { mode: "update", input: mutationInput, item } };
      } catch (error) {
        return { ...failure(errorMessage(error, input.mode, customizeFailure)), mutation: { mode: "update", input: mutationInput, item: null, failureReason: error instanceof Error && error.message === MISSING_AUTOMATION ? "missing_automation" : "host_error" } };
      }
    }
    if (input.mode === "delete") {
      const id = input.id ?? "";
      try {
        const { item, status, success: deleted } = await operations.delete({ id });
        return {
          response: deleted ? success({ automationId: id, mode: "delete", deleteStatus: status === "not_found" ? "not_found" : "deleted", snapshot: item == null ? null : { kind: item.kind, name: item.name, rrule: item.rrule } }) : failure(deleteFailure(status)).response,
          mutation: { mode: "delete", id, item, status },
        };
      } catch (error) {
        return { ...failure(errorMessage(error, input.mode, customizeFailure)), mutation: { mode: "delete", id, item: null, status: "host_error" } };
      }
    }
    return { response: success() };
  };
}

function createInput(input: any, threadId: string) {
  return input.kind === "heartbeat"
    ? { kind: "heartbeat", name: input.name ?? "", prompt: input.prompt ?? "", status: input.status, targetThreadId: input.targetThreadId ?? threadId, model: null, reasoningEffort: null, ...(input.notificationPolicy == null ? {} : { notificationPolicy: input.notificationPolicy }), rrule: input.rrule ?? "" }
    : { kind: "cron", name: input.name ?? "", prompt: input.prompt ?? "", status: input.status, projectId: input.projectId ?? null, executionEnvironment: "local", localEnvironmentConfigPath: null, model: input.model ?? null, reasoningEffort: input.reasoningEffort ?? null, ...(input.notificationPolicy == null ? {} : { notificationPolicy: input.notificationPolicy }), rrule: input.rrule ?? "" };
}

function updateInput(input: any, threadId: string) {
  return input.kind === "heartbeat"
    ? { id: input.id ?? "", kind: "heartbeat", name: input.name ?? "", prompt: input.prompt ?? "", status: input.status ?? "ACTIVE", targetThreadId: input.targetThreadId ?? threadId, model: null, reasoningEffort: null, ...(input.notificationPolicy === undefined ? {} : { notificationPolicy: input.notificationPolicy }), rrule: input.rrule ?? "" }
    : { id: input.id ?? "", kind: "cron", name: input.name ?? "", prompt: input.prompt ?? "", status: input.status ?? "ACTIVE", projectId: input.projectId ?? null, executionEnvironment: input.executionEnvironment ?? "local", localEnvironmentConfigPath: input.localEnvironmentConfigPath, model: input.model ?? null, reasoningEffort: input.reasoningEffort ?? null, ...(input.notificationPolicy === undefined ? {} : { notificationPolicy: input.notificationPolicy }), rrule: input.rrule ?? "" };
}

function success(details?: any) {
  return { contentItems: [{ type: "inputText", text: details == null ? "Rendered automation card in the app." : details.mode === "create" ? "Created automation in the app." : details.mode === "update" ? "Updated automation in the app." : details.deleteStatus === "not_found" ? "Automation already does not exist in the app." : "Deleted automation in the app." }, ...(details == null ? [] : [{ type: "inputText", text: JSON.stringify(details) }])], success: true };
}

function failure(message: unknown) { return { response: { contentItems: [{ type: "inputText", text: message }], success: false } }; }
function errorMessage(error: unknown, mode: string, customize: (error: unknown) => string | null) { return customize(error) ?? (error instanceof Error && (error.message === MISSING_AUTOMATION || error.message === NO_FUTURE_RUNS) ? error.message : `Failed to ${mode} automation.`); }
function deleteFailure(status: string) {
  switch (status) {
    case "invalid_id": return "Automation id was invalid.";
    case "store_unavailable": return "Automation storage is unavailable.";
    case "state_cleanup_failed": return "Automation scheduling state could not be updated.";
    case "remove_failed": return "Automation still exists after the app tried to delete it.";
    case "deleted":
    case "not_found":
      return undefined;
    default: return "Automation was not deleted.";
  }
}
