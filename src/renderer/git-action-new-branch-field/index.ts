import {
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  ZI as appScope,
  pZ as createScopedSignal,
  type JsxRuntime,
  type ScopedSignal,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-analytics-attribution";
import "@rchunk/git-action-review-state";

export type CommitBlockedReason = "changes-loading" | "changes-unavailable" | "no-changes";
export type PushBlockedReason = "branch-missing" | "nothing-to-push" | "push-status-loading";
export type PullRequestBlockedReason =
  | "branch-missing" | "checking-existing-pr" | "default-branch-checked-out"
  | "default-branch-missing" | "gh-auth-required" | "gh-cli-missing"
  | "no-git-repository" | "pull-request-exists" | "pull-request-source-loading"
  | "pull-request-source-unavailable" | "push-status-loading" | "upstream-missing";
export type GitNextStep = "commit-push-and-create-pr" | "push-and-create-pr" | "create-pr";
export type WorkflowPhase = "committing" | "generating-commit-message" | "generating-pr-message" | "creating-branch" | "creating-pr" | "pushing";
export interface GitTarget { cwd: string; hostConfig: { id: string; [key: string]: unknown }; hostId: string; root?: string; conversationId?: string | null; codexWorktree?: boolean; operationSource?: string }
export interface PushStatus { branch?: string | null; commitsAhead: number; defaultBranch?: string | null; gitRoot?: string | null; upstreamRef?: string | null }
export interface DiffFile { additions?: number | null; deletions?: number | null; path: string; previousPath?: string | null }
export interface DiffResult { files: DiffFile[]; type: "success" | "error" }
export interface SelectionSummary { files: Array<{ additions: number; deletions: number; path: string }>; totalAdditions: number; totalDeletions: number }
export interface WorkflowScope {
  get<T>(signal: unknown, params?: unknown): T;
  set<T>(signal: unknown, valueOrParams: T | unknown, value?: T): void;
}

let jsx: JsxRuntime;
let workflowStateSignal: ScopedSignal<Record<string, unknown>, { phase: WorkflowPhase; workflow: "commit" | "create-pr" } | null>;
let commitMessageSignal: ScopedSignal<Record<string, unknown>, string>;
let pullRequestTitleSignal: ScopedSignal<Record<string, unknown>, string>;
let pullRequestBodySignal: ScopedSignal<Record<string, unknown>, string>;
let includeUnstagedSignal: ScopedSignal<Record<string, unknown>, boolean>;
let branchNameSignal: ScopedSignal<Record<string, unknown>, string>;
let branchValidSignal: ScopedSignal<Record<string, unknown>, boolean>;
let localGitActionsScope: { key: (value: { target: { cwd: string; hostId: string } }) => string };
const activeOperations = new Map<string, AbortController>();

function initializeSignals(): void {
  initializeSignalRuntime();
  workflowStateSignal = createScopedSignal(appScope, null);
  commitMessageSignal = createScopedSignal(appScope, "");
  pullRequestTitleSignal = createScopedSignal(appScope, "");
  pullRequestBodySignal = createScopedSignal(appScope, "");
  includeUnstagedSignal = createScopedSignal(appScope, true);
  branchNameSignal = createScopedSignal(appScope, "");
  branchValidSignal = createScopedSignal(appScope, true);
}

function initializeLocalGitActionsScope(): void {
  localGitActionsScope = { key: ({ target }) => JSON.stringify([target.hostId, target.cwd]) };
}

function initializeGitStatusModels(): void { initializeSignalRuntime(); }
function initializePushStatusModel(): void { initializeSignalRuntime(); }
function initializeToastMessages(): void { jsx = getJsxRuntime(); }
function initializeWorkflowModels(): void {
  initializeSignals();
  initializeLocalGitActionsScope();
  initializeGitStatusModels();
  initializePushStatusModel();
  initializeToastMessages();
}
function initializeWorkflowMutation(): void { initializeWorkflowModels(); }
function initializeBranchField(): void { jsx = getJsxRuntime(); }
function initializeNoop(): void {}

function isMainWorktree(input: { commonDir: string; root: string }): boolean {
  const root = input.root.replace(/\/+$/, "");
  const commonDir = input.commonDir.replace(/\/+$/, "");
  return commonDir === root || commonDir === `${root}/.git`;
}

function gitTargetKey(target: { cwd: string; hostId: string }): { cwd: string; hostId: string } {
  return { cwd: target.cwd, hostId: target.hostId };
}

function operationKey(target: { cwd: string; hostId: string }): string {
  return JSON.stringify([target.hostId, target.cwd]);
}

function beginOperation(target: { cwd: string; hostId: string }): AbortSignal {
  cancelOperation(target);
  const controller = new AbortController();
  activeOperations.set(operationKey(target), controller);
  return controller.signal;
}

function cancelOperation(target: { cwd: string; hostId: string }): void {
  activeOperations.get(operationKey(target))?.abort();
}

function finishOperation(target: { cwd: string; hostId: string }, signal: AbortSignal): void {
  if (activeOperations.get(operationKey(target))?.signal === signal) activeOperations.delete(operationKey(target));
}

function resetDrafts(scope: WorkflowScope, target: unknown): void {
  scope.set(pullRequestTitleSignal, target, "");
  scope.set(pullRequestBodySignal, target, "");
  scope.set(branchValidSignal, target, true);
}

function selectCommitWorkflow(scope: WorkflowScope): void {
  scope.set(workflowStateSignal, { workflow: "commit", phase: "committing" });
}

function selectCreatePullRequestWorkflow(scope: WorkflowScope, options: { defaultToDraft?: boolean } = {}): void {
  scope.set(workflowStateSignal, { workflow: "create-pr", phase: options.defaultToDraft ? "generating-pr-message" : "creating-pr" });
}

function pauseForBranchSetup(scope: WorkflowScope): void { scope.set(workflowStateSignal, null); }
function resumeWorkflow(scope: WorkflowScope): void { scope.set(workflowStateSignal, null); }

function commitBlockedReason(input: { hasSomeUncommittedChanges: boolean; isChangesLoading: boolean; isChangesUnavailable: boolean }): CommitBlockedReason | null {
  if (input.isChangesLoading) return "changes-loading";
  if (input.isChangesUnavailable) return "changes-unavailable";
  return input.hasSomeUncommittedChanges ? null : "no-changes";
}

function pushBlockedReason(input: { ignoreNothingToPush?: boolean; pushStatus?: PushStatus }): PushBlockedReason | null {
  if (input.pushStatus == null) return "push-status-loading";
  if (input.pushStatus.branch == null || input.pushStatus.branch === "") return "branch-missing";
  if (input.ignoreNothingToPush !== true && input.pushStatus.commitsAhead === 0) return "nothing-to-push";
  return null;
}

function pullRequestBlockedReason(input: {
  allowMissingUpstream?: boolean; hasOpenPr: boolean; isLoadingPRStatus: boolean;
  pushStatus?: PushStatus; source: "available" | "loading" | "unavailable";
  unavailableReason?: PullRequestBlockedReason | null;
}): PullRequestBlockedReason | null {
  if (input.hasOpenPr) return "pull-request-exists";
  if (input.isLoadingPRStatus) return "checking-existing-pr";
  if (input.source === "loading") return "pull-request-source-loading";
  if (input.source === "unavailable") return input.unavailableReason ?? "pull-request-source-unavailable";
  const status = input.pushStatus;
  if (status == null) return "push-status-loading";
  if (status.gitRoot == null) return "no-git-repository";
  if (status.defaultBranch == null) return "default-branch-missing";
  if (status.branch == null) return "branch-missing";
  if (status.branch === status.defaultBranch) return "default-branch-checked-out";
  if (input.allowMissingUpstream !== true && status.upstreamRef == null) return "upstream-missing";
  return null;
}

function canProceedThroughTransientReason(reason: PushBlockedReason | PullRequestBlockedReason | null): boolean {
  return reason == null || reason === "branch-missing" || reason === "checking-existing-pr"
    || reason === "default-branch-checked-out" || reason === "push-status-loading";
}

function workflowCapabilities(input: {
  commitsAhead: number; commitBlockedReason: CommitBlockedReason | null; createsBranch: boolean;
  createPullRequestAfterPushBlockedReason: PullRequestBlockedReason | null;
  createPullRequestBlockedReason: PullRequestBlockedReason | null;
  pushAfterCommitBlockedReason: PushBlockedReason | null; pushBlockedReason: PushBlockedReason | null;
}): { canCommitPushAndCreatePullRequest: boolean; canCreatePullRequest: boolean; canPushAndCreatePullRequest: boolean } {
  if (input.createsBranch) return {
    canCommitPushAndCreatePullRequest: input.commitBlockedReason == null
      && canProceedThroughTransientReason(input.pushAfterCommitBlockedReason)
      && canProceedThroughTransientReason(input.createPullRequestAfterPushBlockedReason),
    canCreatePullRequest: false,
    canPushAndCreatePullRequest: input.commitsAhead > 0
      && canProceedThroughTransientReason(input.pushBlockedReason)
      && canProceedThroughTransientReason(input.createPullRequestAfterPushBlockedReason),
  };
  return {
    canCommitPushAndCreatePullRequest: input.commitBlockedReason == null
      && input.pushAfterCommitBlockedReason == null && input.createPullRequestAfterPushBlockedReason == null,
    canCreatePullRequest: input.createPullRequestBlockedReason == null,
    canPushAndCreatePullRequest: (input.pushBlockedReason == null
      || (input.pushBlockedReason === "nothing-to-push" && input.createPullRequestBlockedReason === "upstream-missing"))
      && input.createPullRequestAfterPushBlockedReason == null,
  };
}

function chooseNextStep(input: {
  canCommitPushAndCreatePullRequest: boolean; canCreatePullRequest: boolean;
  canPushAndCreatePullRequest: boolean; createsBranch: boolean; includeLocalChanges: boolean;
}): GitNextStep {
  if (input.includeLocalChanges) {
    if (input.canCommitPushAndCreatePullRequest) return "commit-push-and-create-pr";
    if (input.canPushAndCreatePullRequest) return "push-and-create-pr";
    if (input.canCreatePullRequest) return "create-pr";
    return "commit-push-and-create-pr";
  }
  return input.createsBranch ? "push-and-create-pr" : "create-pr";
}

function blockedWorkflowStep(input: {
  canCommitPushAndCreatePullRequest: boolean; canCreatePullRequest: boolean; canPushAndCreatePullRequest: boolean;
  commitBlockedReason: CommitBlockedReason | null; createPullRequestAfterPushBlockedReason: PullRequestBlockedReason | null;
  createPullRequestBlockedReason: PullRequestBlockedReason | null; nextStep: GitNextStep;
  pushAfterCommitBlockedReason: PushBlockedReason | null; pushBlockedReason: PushBlockedReason | null;
}): { kind: "commit" | "create-pr" | "push"; reason: string } | null {
  const providerReason = input.createPullRequestAfterPushBlockedReason;
  if (providerReason === "pull-request-source-loading" || providerReason === "pull-request-source-unavailable"
    || providerReason === "gh-auth-required" || providerReason === "gh-cli-missing") return { kind: "create-pr", reason: providerReason };
  if (input.nextStep === "create-pr") return !input.canCreatePullRequest && input.createPullRequestBlockedReason != null
    ? { kind: "create-pr", reason: input.createPullRequestBlockedReason } : null;
  if (input.nextStep === "push-and-create-pr") return input.canPushAndCreatePullRequest ? null
    : input.pushBlockedReason != null ? { kind: "push", reason: input.pushBlockedReason }
      : providerReason == null ? null : { kind: "create-pr", reason: providerReason };
  return input.canCommitPushAndCreatePullRequest ? null
    : input.commitBlockedReason != null ? { kind: "commit", reason: input.commitBlockedReason }
      : input.pushAfterCommitBlockedReason != null ? { kind: "push", reason: input.pushAfterCommitBlockedReason }
        : providerReason == null ? null : { kind: "create-pr", reason: providerReason };
}

function normalizeDiffPath(value: string): string {
  let normalized = value.trim();
  if ((normalized.startsWith("\"") && normalized.endsWith("\"")) || (normalized.startsWith("'") && normalized.endsWith("'"))) normalized = normalized.slice(1, -1);
  if (normalized.startsWith("./")) normalized = normalized.slice(2);
  return normalized.startsWith("a/") || normalized.startsWith("b/") ? normalized.slice(2) : normalized;
}

function combineDiffSummaries(results: Array<DiffResult | null | undefined>): SelectionSummary | null {
  const files = results.flatMap((result) => result?.type === "success" ? result.files : []);
  if (files.length === 0) return null;
  return {
    files: files.map((file) => ({ path: file.path, additions: file.additions ?? 0, deletions: file.deletions ?? 0 })),
    totalAdditions: files.reduce((sum, file) => sum + (file.additions ?? 0), 0),
    totalDeletions: files.reduce((sum, file) => sum + (file.deletions ?? 0), 0),
  };
}

function fileLineStats(path: string, results: Array<DiffResult | null | undefined>): { linesAdded: number; linesRemoved: number } | null {
  const target = normalizeDiffPath(path);
  const files = results.flatMap((result) => result?.type === "success"
    ? result.files.filter((file) => [file.path, file.previousPath].some((candidate) => candidate != null && normalizeDiffPath(candidate) === target)) : []);
  return files.length === 0 ? null : {
    linesAdded: files.reduce((sum, file) => sum + (file.additions ?? 0), 0),
    linesRemoved: files.reduce((sum, file) => sum + (file.deletions ?? 0), 0),
  };
}

function summarizeUnifiedDiff(diff: string | null | undefined): { filesChanged: number; linesAdded: number; linesRemoved: number } | null {
  if (diff == null || diff.trim() === "") return null;
  let filesChanged = 0; let linesAdded = 0; let linesRemoved = 0; let inHunk = false;
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) { filesChanged += 1; inHunk = false; continue; }
    if (line.startsWith("@@")) { inHunk = true; continue; }
    if (inHunk && line.startsWith("+")) linesAdded += 1;
    else if (inHunk && line.startsWith("-")) linesRemoved += 1;
  }
  return { filesChanged, linesAdded, linesRemoved };
}

function buildCommitPrompt(input: { commitInstructions?: string | null; diffError?: { type: string } | null; draftMessage: string; oversizedDiffSummary?: { filesChanged: number; linesAdded: number; linesRemoved: number } | null; uncommittedDiff?: string | null }): string {
  const sections: string[] = [];
  const instructions = input.commitInstructions?.trim();
  if (instructions) sections.push(`Custom commit instructions (follow these for commit message content and formatting):\n${instructions}`);
  if (input.draftMessage.trim()) sections.push(`Draft message:\n${input.draftMessage.trim()}`);
  if (input.oversizedDiffSummary != null) sections.push(`Changes:\nDiff too large to include inline.\nSummary: ${input.oversizedDiffSummary.filesChanged} changed files, +${input.oversizedDiffSummary.linesAdded}/-${input.oversizedDiffSummary.linesRemoved} lines.\n\nUntracked changes are not included.`);
  else if (input.diffError?.type === "diff-too-large") sections.push("Changes:\nDiff too large to include inline.\n\nUntracked changes are not included.");
  else if (input.uncommittedDiff?.trim()) sections.push(`Changes:\n${input.uncommittedDiff.trim()}\nUntracked changes are not included.`);
  if (input.draftMessage.trim() || sections.some((section) => section.startsWith("Changes:"))) sections.push("Testing note: If you mention tests, include unit tests or UI testing frameworks only. Skip lint/tsc since CI runs those.");
  return sections.join("\n\n");
}

function buildPullRequestPrompt(input: { baseBranch?: string | null; filePaths: string[]; headBranch?: string | null; pullRequestInstructions?: string | null; uncommittedDiff?: string | null }): string {
  const sections: string[] = [];
  if (input.baseBranch || input.headBranch) sections.push(`Branches:\n- Head: ${input.headBranch ?? "-"}\n- Base: ${input.baseBranch ?? "-"}`);
  const instructions = input.pullRequestInstructions?.trim();
  if (instructions) sections.push(`Pull request instructions (apply these to the title/body content only):\n${instructions}`);
  const diff = input.uncommittedDiff?.trim();
  sections.push(diff && diff.split(/\r?\n/).length <= 1000 ? `Changes:\n${diff}`
    : `Changes:\n${input.filePaths.length === 0 ? "- (no files listed)" : input.filePaths.slice(0, 100).map((file) => `- ${file}`).join("\n")}${input.filePaths.length > 100 ? `\n…and ${input.filePaths.length - 100} more` : ""}`);
  return sections.join("\n\n");
}

const activityLabels: Record<WorkflowPhase, string> = {
  committing: "Committing…", "generating-commit-message": "Generating messages…",
  "generating-pr-message": "Generating messages…", "creating-branch": "Creating branch…",
  "creating-pr": "Creating PR…", pushing: "Pushing changes…",
};
function workflowActivityLabel(phase: WorkflowPhase): string { return activityLabels[phase]; }

const commitReasonLabels: Record<CommitBlockedReason, string> = { "changes-loading": "Loading diff…", "changes-unavailable": "Commit is unavailable right now", "no-changes": "No changes to commit" };
const pushReasonLabels: Record<PushBlockedReason, string> = { "branch-missing": "Branch information unavailable", "nothing-to-push": "No new commits to push", "push-status-loading": "Loading push status…" };
function CommitBlockedMessage({ reason }: { reason?: CommitBlockedReason | null }): unknown { return reason == null ? null : ensureJsx().jsx("span", { children: commitReasonLabels[reason] }); }
function PushBlockedMessage({ reason }: { reason?: PushBlockedReason | null }): unknown { return reason == null ? null : ensureJsx().jsx("span", { children: pushReasonLabels[reason] }); }
function PullRequestBlockedMessage({ reason }: { reason?: PullRequestBlockedReason | null }): unknown { return reason == null ? null : ensureJsx().jsx("span", { children: reason.replaceAll("-", " ") }); }
function BlockedStepMessage({ blockedStep }: { blockedStep?: { kind: "commit" | "create-pr" | "push"; reason: string } | null }): unknown {
  if (blockedStep == null) return null;
  if (blockedStep.kind === "commit") return ensureJsx().jsx(CommitBlockedMessage, { reason: blockedStep.reason });
  if (blockedStep.kind === "push") return ensureJsx().jsx(PushBlockedMessage, { reason: blockedStep.reason });
  return ensureJsx().jsx(PullRequestBlockedMessage, { reason: blockedStep.reason });
}

export interface NewBranchFieldProps { branchAlreadyExists?: boolean; disabled?: boolean; placeholder?: string; value: string; onChange(value: string): void }
function NewBranchField(props: NewBranchFieldProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", { className: "flex flex-col gap-1 px-3 pt-2", children: [
    runtime.jsx("input", { autoFocus: true, "aria-label": "Branch name", disabled: props.disabled, placeholder: props.placeholder, value: props.value,
      onKeyDown: stopPlainEnter, onChange: (event: { target: { value: string } }) => props.onChange(event.target.value) }),
    props.branchAlreadyExists ? runtime.jsx("p", { className: "text-xs text-danger", children: "Branch already exists" }) : null,
  ] });
}
function stopPlainEnter(event: { ctrlKey?: boolean; key: string; metaKey?: boolean; stopPropagation(): void }): void {
  if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) event.stopPropagation();
}

function ToastContent(props: Record<string, unknown>): unknown { return ensureJsx().jsx("div", { role: "alert", ...props }); }
function getCurrentBranch(input: { currentBranch?: string | null; storedThreadBranch?: string | null }): string {
  return input.currentBranch ?? input.storedThreadBranch ?? "";
}
function mapTargetToGitInput(target: GitTarget): { cwd: string; hostConfig: GitTarget["hostConfig"]; operationSource: string } {
  return { cwd: target.cwd, hostConfig: target.hostConfig, operationSource: "local_conversation_git_actions" };
}
function workflowTarget(scopeValue: { target: GitTarget }): GitTarget { return scopeValue.target; }
function refreshGitQueries(): Promise<void> { return Promise.resolve(); }
function unavailableSelectionSignal(): null { return null; }
function createWorkflowRunner(): { run(kind: "commit" | "create-pr"): Promise<boolean> } { return { run: async () => true }; }
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export {
  BlockedStepMessage as $,
  initializeLocalGitActionsScope as A,
  initializeSignals as B,
  unavailableSelectionSignal as C,
  selectCreatePullRequestWorkflow as D,
  pauseForBranchSetup as E,
  pullRequestBodySignal as F,
  pushBlockedReason as G,
  workflowCapabilities as H,
  pullRequestTitleSignal as I,
  combineDiffSummaries as J,
  initializeGitStatusModels as K,
  workflowStateSignal as L,
  resetDrafts as M,
  gitTargetKey as N,
  selectCommitWorkflow as O,
  commitBlockedReason as P,
  CommitBlockedMessage as Q,
  branchValidSignal as R,
  refreshGitQueries as S,
  includeUnstagedSignal as T,
  blockedWorkflowStep as U,
  unavailableSelectionSignal as V,
  pushBlockedReason as W,
  chooseNextStep as X,
  initializeNoop as Y,
  initializeNoop as Z,
  unavailableSelectionSignal as _,
  createWorkflowRunner as a,
  initializePushStatusModel as at,
  unavailableSelectionSignal as b,
  workflowTarget as c,
  ToastContent as d,
  PushBlockedMessage as et,
  initializeToastMessages as f,
  unavailableSelectionSignal as g,
  getCurrentBranch as h,
  createWorkflowRunner as i,
  unavailableSelectionSignal as it,
  cancelOperation as j,
  localGitActionsScope as k,
  workflowActivityLabel as l,
  resumeWorkflow as m,
  initializeBranchField as n,
  mapTargetToGitInput as nt,
  initializeWorkflowModels as o,
  workflowStateSignal as p,
  fileLineStats as q,
  initializeWorkflowMutation as r,
  initializePushStatusModel as rt,
  buildPullRequestPrompt as s,
  NewBranchField as t,
  initializeNoop as tt,
  initializeToastMessages as u,
  initializeWorkflowModels as v,
  workflowTarget as w,
  blockedWorkflowStep as x,
  unavailableSelectionSignal as y,
  includeUnstagedSignal as z,
};
