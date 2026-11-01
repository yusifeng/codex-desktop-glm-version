import "@rchunk/rolldown-runtime";
import {
  lY as getConversationId,
  wL as initializeAutomationRuntime,
  zY as isAutomationDefinition,
} from "@rchunk/app-shared";
import { formatErrorMessage as getErrorMessage } from "../app-shared/runtime/format-error-message";
import {
  FCt as initializeAutomationModel,
  GYt as initializeAutomationSchedule,
  ICt as isHeartbeatAutomation,
  LYt as buildRecurrenceRule,
  PCt as heartbeatPromptPrefix,
  Qln as automationRequest,
  nun as initializeQueryKeys,
  zYt as getDefaultRecurrence,
} from "@rchunk/app-initial";

export interface PullRequestFixItem {
  baseBranch: string;
  headBranch: string;
  number: number;
  repo?: string | null;
  url: string;
}

export interface PullRequestFixPreferences {
  autoMerge: boolean;
  instructions: string;
}

export interface PullRequestFixAutomation {
  id: string;
  kind: "heartbeat" | string;
  model: string | null;
  name: string;
  prompt: string;
  reasoningEffort: string | null;
  rrule: unknown;
  status: "ACTIVE" | "DELETED" | "PAUSED" | string;
  targetThreadId: string;
  [key: string]: unknown;
}

export interface PullRequestFixThreadResult {
  conversationId: string;
  synchronization:
    | { status: "complete" | "pending" }
    | { message: string; status: "failed" };
}

export type FinishThreadSetupResult =
  | PullRequestFixThreadResult
  | { status: "refused" }
  | { reason: string; status: "not-ready" };

export interface RunPullRequestFixInput {
  automation: PullRequestFixAutomation | null;
  createThread(): Promise<PullRequestFixThreadResult>;
  finishThreadSetup(conversationId: string): Promise<FinishThreadSetupResult>;
  item: PullRequestFixItem;
  preferences: PullRequestFixPreferences;
  repo?: string | null;
  sendMessage(threadId: string, prompt: string): Promise<void>;
}

const HEARTBEAT_INTERVAL_MINUTES = 10;
const PULL_REQUEST_URL_PREFIX = "Pull request URL: ";
const HEARTBEAT_TURN_MARKER =
  "This is a heartbeat turn. Continue automatically fixing this pull request.";

function pullRequestLines({
  item,
  repo,
}: {
  item: PullRequestFixItem;
  repo?: string | null;
}): string[] {
  return [
    `Repository: ${repo ?? item.repo ?? "the current repository"}`,
    `Pull request: #${item.number}`,
    `${PULL_REQUEST_URL_PREFIX}${item.url}`,
    `Branch: ${item.headBranch} -> ${item.baseBranch}`,
  ];
}

function preferenceInstructions({
  autoMerge,
  instructions,
}: PullRequestFixPreferences): string[] {
  const customInstructions = instructions.trim();
  return [
    "The following behavior is the default. Explicit custom user instructions below override conflicting defaults, but never bypass safety, permissions, or access restrictions.",
    "Inspect the latest PR state with `gh`, including mergeability and all current checks.",
    "By default, fix only failing checks caused by this PR and merge conflicts with its base branch. Do not change code for unrelated failures, infrastructure outages, or flakes unless the custom user instructions explicitly authorize broader remediation.",
    "Start from logs and annotations before changing code. Use installed CI skills or tools for external providers such as Buildkite, and report the exact missing credential or access if blocked.",
    "Do not modify the configured checkout, switch its branch, clean it, reset it, or commit from it.",
    "Inspect from the configured checkout, then create an isolated git worktree only when a code change or conflict resolution is required. Make every mutation in that isolated worktree so the user's active checkout is not disturbed.",
    "Keep changes minimal and relevant to the authorized task. Run the narrowest useful verification, commit, and push only to the PR branch unless custom instructions explicitly authorize a separate fix PR.",
    autoMerge
      ? "Once all required checks pass and the PR is mergeable, merge it using the user's custom instructions or the repository's merge workflow. If merging fails, diagnose the failure, update the branch when needed, retry the merge workflow, and continue until the PR is merged or closed."
      : "Do not merge the pull request unless the custom user instructions explicitly request it; otherwise, the user controls merging separately.",
    "Clean up a temporary worktree when it is safe. Never remove a worktree that contains uncommitted work or that you did not create for this task.",
    "Re-check live GitHub state instead of trusting prior turns.",
    `If checks are still pending, finish the useful work for this turn without sleeping; the heartbeat will check again in ${HEARTBEAT_INTERVAL_MINUTES} minutes.`,
    autoMerge
      ? "When the PR is merged or closed, pause this heartbeat automation with the automation update tool before your final response. Do not stop merely because the checks pass."
      : "When the PR is green and conflict-free, merged, or closed, pause this heartbeat automation with the automation update tool before your final response, unless the custom user instructions explicitly require continuing until it merges.",
    "If progress requires user input or unavailable credentials, ask one concise question in this thread, report the exact blocker, and pause this heartbeat automation. The user can reply here and resume it when ready.",
    "Do not create or suggest another automation.",
    ...(customInstructions.length > 0
      ? [
          "",
          "Custom user instructions (these override conflicting defaults):",
          customInstructions,
        ]
      : []),
  ];
}

function buildInitialPrompt({
  item,
  preferences,
  repo,
}: {
  item: PullRequestFixItem;
  preferences: PullRequestFixPreferences;
  repo?: string | null;
}): string {
  return [
    `Begin automatically fixing PR #${item.number}.`,
    "A 10-minute heartbeat is attached to this thread and will continue checking the pull request until the task is complete or blocked.",
    "",
    ...pullRequestLines({ item, repo }),
    ...preferenceInstructions(preferences),
  ].join("\n");
}

function buildHeartbeatPrompt({
  item,
  preferences,
  repo,
}: {
  item: PullRequestFixItem;
  preferences: PullRequestFixPreferences;
  repo?: string | null;
}): string {
  return [
    heartbeatPromptPrefix,
    ...pullRequestLines({ item, repo }),
    "",
    HEARTBEAT_TURN_MARKER,
    ...preferenceInstructions(preferences),
  ].join("\n");
}

function createAutomationDefinition({
  item,
  preferences,
  repo,
  targetThreadId,
}: {
  item: PullRequestFixItem;
  preferences: PullRequestFixPreferences;
  repo?: string | null;
  targetThreadId: string;
}) {
  return {
    kind: "heartbeat",
    name: `Auto-fix PR #${item.number}`,
    prompt: buildHeartbeatPrompt({ item, preferences, repo }),
    targetThreadId,
    model: null,
    reasoningEffort: null,
    rrule: buildRecurrenceRule({
      ...getDefaultRecurrence(),
      intervalHours: 1,
      intervalMinutes: HEARTBEAT_INTERVAL_MINUTES,
    }),
  };
}

function findPullRequestFixAutomation(
  automations: readonly PullRequestFixAutomation[] | null | undefined,
  pullRequestUrl: string | null | undefined,
): PullRequestFixAutomation | null {
  if (automations == null || pullRequestUrl == null) return null;
  const expectedLine = `${PULL_REQUEST_URL_PREFIX}${pullRequestUrl}`;
  return (
    automations.find((automation) => {
      if (!isHeartbeatAutomation(automation) || automation.status === "DELETED") {
        return false;
      }
      const lines = automation.prompt.split("\n");
      const heading = lines.indexOf("## Pull request fix automation:");
      const end = lines.indexOf("", heading + 1);
      return heading >= 0 && end > heading && lines.slice(heading + 1, end).includes(expectedLine);
    }) ?? null
  );
}

function isPullRequestFixAutomationActive(
  automation: PullRequestFixAutomation | null | undefined,
): boolean {
  return automation?.status === "ACTIVE";
}

async function updateAutomation(
  automation: PullRequestFixAutomation,
  status: "ACTIVE" | "PAUSED",
  prompt = automation.prompt,
): Promise<PullRequestFixAutomation> {
  const params = {
    id: automation.id,
    kind: "heartbeat",
    name: automation.name,
    prompt,
    status,
    targetThreadId: automation.targetThreadId,
    model: automation.model,
    reasoningEffort: automation.reasoningEffort,
    rrule: automation.rrule,
  };
  const { item } = (await automationRequest("automation-update", {
    params,
  })) as { item: unknown };
  if (!isAutomationDefinition(item)) {
    throw Error("Automatic fix heartbeat could not be updated");
  }
  return item as PullRequestFixAutomation;
}

async function pausePullRequestFixAutomation(
  automation: PullRequestFixAutomation,
): Promise<PullRequestFixAutomation> {
  return updateAutomation(automation, "PAUSED");
}

async function refreshActivePullRequestFixAutomations(
  preferences: PullRequestFixPreferences,
): Promise<PullRequestFixAutomation[]> {
  const { items } = (await automationRequest("list-automations")) as {
    items: PullRequestFixAutomation[];
  };
  const updates = items.flatMap((automation) => {
    if (!isHeartbeatAutomation(automation) || automation.status !== "ACTIVE") return [];
    const lines = automation.prompt.split("\n");
    const marker = lines.indexOf(HEARTBEAT_TURN_MARKER);
    if (marker < 0) return [];
    const prompt = [
      ...lines.slice(0, marker + 1),
      ...preferenceInstructions(preferences),
    ].join("\n");
    return prompt === automation.prompt
      ? []
      : [updateAutomation(automation, "ACTIVE", prompt)];
  });
  return Promise.all(updates);
}

async function ensureAutomation({
  automation,
  createThread,
  finishThreadSetup,
  item,
  preferences,
  repo,
}: Omit<RunPullRequestFixInput, "sendMessage">): Promise<{
  automation: PullRequestFixAutomation;
  setupError: string | null;
}> {
  if (automation == null) {
    const thread = await createThread();
    const { item: created } = (await automationRequest("automation-create", {
      params: {
        ...createAutomationDefinition({
          item,
          preferences,
          repo,
          targetThreadId: thread.conversationId,
        }),
        ...(thread.synchronization.status === "failed"
          ? { status: "PAUSED" }
          : {}),
      },
    })) as { item: unknown };
    if (!isAutomationDefinition(created)) {
      throw Error("Automatic fix heartbeat could not be created");
    }
    return {
      automation: created as PullRequestFixAutomation,
      setupError:
        thread.synchronization.status === "failed"
          ? thread.synchronization.message
          : null,
    };
  }

  if (automation.status === "PAUSED") {
    let thread: FinishThreadSetupResult;
    try {
      thread = await finishThreadSetup(getConversationId(automation.targetThreadId));
    } catch (error) {
      return { automation, setupError: getErrorMessage(error) ?? "Unknown error" };
    }
    if ("status" in thread && thread.status === "refused") {
      return {
        automation,
        setupError: "The retained task is not a supported automatic-fix fork",
      };
    }
    if ("status" in thread && thread.status === "not-ready") {
      return {
        automation,
        setupError: `Task setup is not ready: ${thread.reason}`,
      };
    }
    if (
      "synchronization" in thread &&
      thread.synchronization.status === "failed"
    ) {
      return { automation, setupError: thread.synchronization.message };
    }
  }

  const prompt = buildHeartbeatPrompt({ item, preferences, repo });
  return automation.status === "PAUSED" || automation.prompt !== prompt
    ? {
        automation: await updateAutomation(automation, "ACTIVE", prompt),
        setupError: null,
      }
    : { automation, setupError: null };
}

async function runPullRequestFixAutomation({
  automation,
  createThread,
  finishThreadSetup,
  item,
  preferences,
  repo,
  sendMessage,
}: RunPullRequestFixInput): Promise<{
  automation: PullRequestFixAutomation;
  runError: string | null;
}> {
  const creating = automation == null;
  const setup = await ensureAutomation({
    automation,
    createThread,
    finishThreadSetup,
    item,
    preferences,
    repo,
  });
  if (setup.setupError != null) {
    return { automation: setup.automation, runError: setup.setupError };
  }
  try {
    await sendMessage(
      setup.automation.targetThreadId,
      creating
        ? buildInitialPrompt({ item, preferences, repo })
        : setup.automation.prompt,
    );
    return { automation: setup.automation, runError: null };
  } catch (error) {
    return {
      automation: setup.automation,
      runError: getErrorMessage(error) ?? "Unknown error",
    };
  }
}

function initializePullRequestFixAutomation(): void {
  initializeAutomationRuntime();
  initializeAutomationSchedule();
  initializeQueryKeys();
  initializeAutomationModel();
}

export {
  runPullRequestFixAutomation as a,
  pausePullRequestFixAutomation as i,
  initializePullRequestFixAutomation as n,
  refreshActivePullRequestFixAutomations as o,
  isPullRequestFixAutomationActive as r,
  findPullRequestFixAutomation as t,
};
