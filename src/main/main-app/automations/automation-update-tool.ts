// Semantic automation_update tool executor. The Zod schema remains in the
// composition root; this module owns validated input projection and mutations.

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
