import {
  I3 as getJsxRuntime,
  m4 as classNames,
  type IntlShape,
  type JsxRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { t as ExecShellContainer } from "@rchunk/exec-shell-container";

type WorktreePhase = "queued" | "creating" | "setting-up" | "worktree-ready" | "failed";
type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";
interface StartingState { type: string; remoteRef?: string | null; [key: string]: unknown }
interface StartConversationParams extends Record<string, unknown> { workspaceRoots: string[] }
export interface PendingWorktree {
  attempt: number;
  errorMessage?: string | null;
  hostId: string;
  id: string;
  launchMode: "fork-conversation" | "start-conversation";
  localEnvironmentConfigPath?: string | null;
  phase: WorktreePhase;
  setupOutputText: string;
  sourceCollaborationMode?: unknown;
  sourceConversationId?: string | null;
  sourceWorkspaceRoot: string;
  sourceWorkspaceRoots: string[];
  startConversationParamsInput: StartConversationParams;
  startingState: StartingState;
  worktreeGitRoot?: string | null;
  worktreeOutputText: string;
  worktreeWorkspaceRoot?: string | null;
}
interface ProgressStep { kind: "fetch" | "workspace" | "checkout" | "setup"; progressPercentage: number | null; status: StepStatus }
export interface WorktreeSetupProgressProps {
  children?: unknown;
  isConversationStartFailed?: boolean;
  isConversationStarting?: boolean;
  onContinueWithoutUpdating?: () => void;
  pendingWorktree: PendingWorktree;
  upstreamRefreshMode?: "best-effort" | "never" | "required";
}
interface AutoFixInput {
  createPendingWorktree(options: Record<string, unknown>): unknown;
  intl: IntlShape;
  pendingWorktree: PendingWorktree;
  scope: unknown;
  serviceTier: unknown;
}

const checkoutProgressPattern = /(?:^|[\r\n])Updating files:\s+(\d{1,3})%\s+\(\d+\/\d+\)/g;
const fetchProgressPattern = /(?:^|[\r\n])Receiving objects:\s+(\d{1,3})%\s+\(\d+\/\d+\)/g;
let jsx: JsxRuntime;

function lastProgress(output: string, pattern: RegExp): number | null {
  let progress: number | null = null;
  for (const match of output.matchAll(pattern)) {
    const candidate = Number(match[1]);
    if (candidate >= 0 && candidate <= 100) progress = candidate;
  }
  return progress;
}

function workspaceStatus(phase: WorktreePhase, hasWorkspace: boolean): StepStatus {
  if (phase === "queued" || phase === "creating") return "running";
  if (phase === "setting-up" || phase === "worktree-ready") return "completed";
  return hasWorkspace ? "completed" : "failed";
}

function setupStatus(worktree: PendingWorktree, hasWorkspace: boolean): StepStatus | null {
  switch (worktree.phase) {
    case "queued":
    case "creating": return null;
    case "setting-up": return "running";
    case "worktree-ready": return worktree.localEnvironmentConfigPath == null
      ? null : worktree.errorMessage == null ? "completed" : "skipped";
    case "failed": return hasWorkspace ? "failed" : null;
  }
}

function deriveProgressSteps(
  worktree: PendingWorktree,
  upstreamRefreshMode: WorktreeSetupProgressProps["upstreamRefreshMode"] = "best-effort",
): ProgressStep[] {
  const hasWorkspace = worktree.worktreeGitRoot != null && worktree.worktreeWorkspaceRoot != null;
  const workspace = workspaceStatus(worktree.phase, hasWorkspace);
  const checkoutProgress = lastProgress(worktree.worktreeOutputText, checkoutProgressPattern);
  const checkoutStarted = checkoutProgress != null
    || /(?:^|[\r\n])(?:Preparing worktree|Updating index flags:)/.test(worktree.worktreeOutputText);
  const completed = workspace === "completed";
  const refreshStarted = worktree.worktreeOutputText.includes("[info] Refreshing upstream before creating worktree");
  const continued = worktree.worktreeOutputText.includes("[info] Continuing without updating");
  const refreshFailed = worktree.worktreeOutputText.includes("[warning] Could not refresh upstream; using cached Git state");
  const shouldRefresh = refreshStarted || (upstreamRefreshMode === "best-effort"
    && worktree.startingState.type === "branch" && worktree.startingState.remoteRef == null
    && !checkoutStarted && !completed && workspace !== "failed");
  const refreshFinished = refreshStarted && (continued || refreshFailed
    || worktree.worktreeOutputText.includes("[info] Upstream refreshed") || checkoutStarted || completed);
  const refreshPending = shouldRefresh && !refreshFinished;
  let workspaceStep: StepStatus = refreshPending ? "pending" : "running";
  if (completed || checkoutStarted) workspaceStep = "completed";
  else if (workspace === "failed" && !refreshPending) workspaceStep = "failed";
  let checkout: StepStatus = "pending";
  if (completed) checkout = "completed";
  else if (checkoutStarted) checkout = workspace === "failed" ? "failed" : "running";
  const steps: ProgressStep[] = [];
  if (shouldRefresh) {
    let status = workspace;
    if (refreshFailed) status = "failed";
    else if (continued) status = "skipped";
    else if (refreshFinished) status = "completed";
    steps.push({ kind: "fetch", status, progressPercentage: refreshPending && workspace !== "failed"
      ? lastProgress(worktree.worktreeOutputText, fetchProgressPattern) : null });
  }
  steps.push(
    { kind: "workspace", status: workspaceStep, progressPercentage: null },
    { kind: "checkout", status: checkout, progressPercentage: checkout === "running" ? checkoutProgress : null },
  );
  const setup = setupStatus(worktree, hasWorkspace);
  if (worktree.localEnvironmentConfigPath != null) {
    steps.push({ kind: "setup", status: setup ?? "pending", progressPercentage: null });
  }
  return steps;
}

function WorktreeSetupProgress({
  children,
  isConversationStartFailed = false,
  isConversationStarting = false,
  onContinueWithoutUpdating,
  pendingWorktree,
  upstreamRefreshMode = "best-effort",
}: WorktreeSetupProgressProps): unknown {
  const runtime = ensureJsx();
  const steps = deriveProgressSteps(pendingWorktree, upstreamRefreshMode);
  const output = [pendingWorktree.worktreeOutputText, pendingWorktree.setupOutputText].filter(Boolean).join("\n");
  return runtime.jsxs("section", {
    className: "flex flex-col gap-3",
    "data-worktree-id": pendingWorktree.id,
    children: [
      runtime.jsx("ol", { className: "flex flex-col gap-2", children: steps.map((step) => runtime.jsx("li", {
        className: classNames("worktree-progress-step", `status-${step.status}`),
        "data-kind": step.kind,
        "data-progress": step.progressPercentage,
        "data-status": step.status,
        children: step.kind,
      }, step.kind)) }),
      output === "" ? null : runtime.jsx(ExecShellContainer, {
        command: pendingWorktree.localEnvironmentConfigPath ?? "git worktree add",
        isInProgress: steps.some((step) => step.status === "running"),
        output,
        surface: "plain",
      }),
      onContinueWithoutUpdating == null ? null : runtime.jsx("button", {
        type: "button", onClick: onContinueWithoutUpdating, children: "Continue without updating",
      }),
      isConversationStarting ? runtime.jsx("span", { children: "Starting repair task" }) : null,
      isConversationStartFailed ? runtime.jsx("span", { role: "alert", children: "Repair task failed to start" }) : null,
      children,
    ],
  });
}

function buildRepairPrompt(worktree: PendingWorktree, intl: IntlShape): string {
  const message = intl.formatMessage({
    id: "worktreeInitV2.autoFix.prompt",
    defaultMessage: "Fix this project's local environment setup.{paragraphBreak}The original worktree setup failed before its thread could start. Do not continue the original user request. Start a one-off repair task in this new worktree without running the broken setup automatically. Paths in the failure output refer to the original source or failed worktree, so edit the corresponding files in this current repair worktree. Inspect the selected local environment config and related setup files, reproduce the failure manually if useful, make the smallest source-controlled fix, verify the setup succeeds, and leave the proposed fix here for user review before they retry the original task. If the fix should not be made automatically, explain exactly what the user should change.{paragraphBreak}Selected local environment config: {configPath}{lineBreak}Original setup error: {errorMessage}{paragraphBreak}Original setup output:{lineBreak}```text{lineBreak}{outputText}{lineBreak}```",
  }, {
    configPath: worktree.localEnvironmentConfigPath ?? "",
    errorMessage: worktree.errorMessage ?? "",
    lineBreak: "\n",
    outputText: worktree.setupOutputText,
    paragraphBreak: "\n\n",
  });
  return typeof message === "string" ? message : Array.from(message).join("");
}

function buildRepairConversationParams(worktree: PendingWorktree, prompt: string, serviceTier: unknown): Record<string, unknown> {
  const input = [{ type: "text", text: prompt, text_elements: [] }];
  const workspaceRoots = [...new Set([
    worktree.sourceWorkspaceRoot,
    ...(worktree.launchMode === "start-conversation"
      ? worktree.startConversationParamsInput.workspaceRoots : worktree.sourceWorkspaceRoots),
  ])];
  const common = {
    input, commentAttachments: [], workspaceRoots, cwd: worktree.sourceWorkspaceRoot,
    fileAttachments: [], addedFiles: [], threadSource: "worktree_setup_auto_fix", serviceTier,
  };
  return worktree.launchMode === "start-conversation"
    ? { ...worktree.startConversationParamsInput, ...common }
    : { ...common, agentMode: "auto", shouldSendPermissionOverrides: true, model: null,
      reasoningEffort: null, collaborationMode: worktree.sourceCollaborationMode ?? null,
      config: {}, workspaceKind: "project" };
}

async function createWorktreeSetupRepair({ createPendingWorktree, intl, pendingWorktree, serviceTier }: AutoFixInput): Promise<unknown> {
  const prompt = buildRepairPrompt(pendingWorktree, intl);
  const label = intl.formatMessage({ id: "worktreeInitV2.autoFix.label", defaultMessage: "Fix worktree setup" });
  return createPendingWorktree({
    hostId: pendingWorktree.hostId,
    label,
    initialThreadTitle: label,
    sourceWorkspaceRoot: pendingWorktree.sourceWorkspaceRoot,
    startingState: pendingWorktree.startingState,
    localEnvironmentConfigPath: null,
    launchMode: "start-conversation",
    prompt,
    startConversationParamsInput: buildRepairConversationParams(pendingWorktree, prompt, serviceTier),
    sourceConversationId: null,
    sourceCollaborationMode: null,
  });
}

function initializeWorktreeProgress(): void { jsx = getJsxRuntime(); }
function initializeWorktreeSetupAutoFix(): void {}
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export {
  initializeWorktreeProgress as i,
  initializeWorktreeSetupAutoFix as n,
  WorktreeSetupProgress as r,
  createWorktreeSetupRepair as t,
};
