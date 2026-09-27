import {
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  ZI as appScope,
  pZ as createScopedSignal,
  sZ as createDerivedSignal,
  type IntlShape,
  type JsxRuntime,
  type MaitaiScopeApi,
  type ScopedDerivedSignal,
  type ScopedSignal,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-detail-model";
import "@rchunk/pull-request-status-label";

export interface PullRequestTarget { cwd: string; hostId: string; root: string }
export interface PullRequestCheck { link?: string | null; name: string; status: string; workflow?: string | null; [key: string]: unknown }
export interface ReviewComment {
  authorLogin?: string | null;
  body: string;
  isResolved?: boolean;
  line?: number | null;
  path?: string | null;
  replies?: Array<{ authorLogin?: string | null; body: string }>;
  reviewThreadId?: string;
  side?: string | null;
  startLine?: number | null;
  startSide?: string | null;
}
export interface CommentAttachment {
  content: Array<{ content_type: "text"; text: string }>;
  localPullRequestCommentGuidance?: string;
  localWorkspaceRoot?: string;
  position: { line: number; path: string; side: string; start_line?: number; start_side?: string };
  reviewThreadId?: string;
  type: "comment";
}
export interface MergeConflict {
  baseBranch: string;
  headBranch: string;
  number: number;
  repo?: string | null;
  url: string;
}
export interface PullRequestRepairState {
  pullRequestChecks: PullRequestCheck[];
  pullRequestMergeConflict: MergeConflict | null;
  pullRequestRepair: { pullRequestNumber: number | null; target: PullRequestTarget } | null;
}
export interface RepairScope extends MaitaiScopeApi<unknown> {
  focusComposer?(): void;
}
export interface PullRequestStatus {
  activityItems: ReviewComment[];
  checks: PullRequestCheck[];
  mergeBlocker?: "conflicts" | "unknown" | string | null;
  number?: number | null;
  repo?: string | null;
  url?: string | null;
}

let repairStateSignal: ScopedSignal<Record<string, unknown>, PullRequestRepairState>;
let commentAttachmentsSignal: ScopedSignal<Record<string, unknown>, Record<string, CommentAttachment[]>>;
let composerTextSignal: ScopedSignal<Record<string, unknown>, string>;
let generatedPromptSignal: ScopedSignal<Record<string, unknown>, string | null>;
let repairTargetSignal: ScopedDerivedSignal<Record<string, unknown>, PullRequestTarget | null>;
let jsx: JsxRuntime;

function initializeRepairState(): void {
  initializeSignalRuntime();
  repairStateSignal = createScopedSignal(appScope, {
    pullRequestChecks: [], pullRequestMergeConflict: null, pullRequestRepair: null,
  });
  commentAttachmentsSignal = createScopedSignal(appScope, {});
  composerTextSignal = createScopedSignal(appScope, "");
  generatedPromptSignal = createScopedSignal(appScope, null);
  repairTargetSignal = createDerivedSignal(appScope, ({ get }) => get(repairStateSignal).pullRequestRepair?.target ?? null);
}

function attachmentKey(attachment: CommentAttachment): string {
  return attachment.reviewThreadId
    ?? `${attachment.position.path}:${attachment.position.side}:${attachment.position.line}`;
}

function filterOutstandingComments(comments: ReviewComment[]): ReviewComment[] {
  return comments.filter((comment) => comment.isResolved !== true
    && comment.line != null && comment.path != null && comment.side != null);
}

function toCommentAttachment(comment: ReviewComment): CommentAttachment {
  if (comment.line == null || comment.path == null || comment.side == null) {
    throw new Error("Cannot attach a pull request comment without a file position");
  }
  const messages = [comment, ...(comment.replies ?? [])];
  return {
    content: [{ content_type: "text", text: messages.map((message) =>
      message.authorLogin == null ? message.body : `@${message.authorLogin}:\n${message.body}`).join("\n\n") }],
    position: {
      line: comment.line, path: comment.path, side: comment.side,
      ...(comment.startLine == null ? {} : { start_line: comment.startLine }),
      ...(comment.startSide == null ? {} : { start_side: comment.startSide }),
    },
    reviewThreadId: comment.reviewThreadId,
    type: "comment",
  };
}

function mergeAttachments(existing: CommentAttachment[], additions: CommentAttachment[]): CommentAttachment[] {
  const result = [...existing];
  const keys = new Set(existing.map(attachmentKey));
  for (const attachment of additions) {
    const key = attachmentKey(attachment);
    if (!keys.has(key)) { keys.add(key); result.push(attachment); }
  }
  return result;
}

function sameTarget(left: PullRequestTarget, right: PullRequestTarget): boolean {
  return left.hostId === right.hostId && normalizePath(left.root) === normalizePath(right.root);
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
}

function ensureRepairTarget(scope: RepairScope, target: PullRequestTarget, pullRequestNumber?: number | null): boolean {
  const state = scope.get(repairStateSignal);
  const current = state.pullRequestRepair;
  if (current != null && sameTarget(current.target, target)
    && (pullRequestNumber == null || current.pullRequestNumber == null || current.pullRequestNumber === pullRequestNumber)) {
    if (current.pullRequestNumber == null && pullRequestNumber != null) {
      scope.set(repairStateSignal, { ...state,
        pullRequestRepair: { target: current.target, pullRequestNumber } });
    }
    return false;
  }
  scope.set(repairStateSignal, {
    pullRequestChecks: [], pullRequestMergeConflict: null,
    pullRequestRepair: { target, pullRequestNumber: pullRequestNumber ?? null },
  });
  scope.set(generatedPromptSignal, null);
  return current != null;
}

function localizeAttachment(
  _scope: RepairScope,
  { comment, target }: { comment: CommentAttachment; conversationId?: string | null; target: PullRequestTarget; workspaceRoots?: string[] },
): CommentAttachment {
  return comment.localWorkspaceRoot === target.root ? comment : { ...comment, localWorkspaceRoot: target.root };
}

function updateConversationAttachments(
  scope: RepairScope,
  conversationId: string,
  update: (attachments: CommentAttachment[]) => CommentAttachment[],
): void {
  const all = scope.get(commentAttachmentsSignal);
  const current = all[conversationId] ?? [];
  const next = update(current);
  if (next !== current) scope.set(commentAttachmentsSignal, { ...all, [conversationId]: next });
}

function setAttachments(scope: RepairScope, input: {
  attached: boolean;
  commentAttachments: CommentAttachment[];
  conversationId: string | null;
  target: PullRequestTarget;
}): boolean {
  if (input.conversationId == null || input.commentAttachments.length === 0) return false;
  updateConversationAttachments(scope, input.conversationId, (existing) => {
    const localized = input.commentAttachments.map((comment) => localizeAttachment(scope, { comment, target: input.target }));
    if (input.attached) return mergeAttachments(existing, localized);
    const removed = new Set(localized.map(attachmentKey));
    const next = existing.filter((attachment) => !removed.has(attachmentKey(attachment)));
    return next.length === existing.length ? existing : next;
  });
  return true;
}

function updateCommentGuidance(scope: RepairScope, input: {
  commentAttachment: CommentAttachment; conversationId: string | null; guidance: string;
}): boolean {
  if (input.conversationId == null) return false;
  const key = attachmentKey(input.commentAttachment);
  const guidance = input.guidance.trim();
  let changed = false;
  updateConversationAttachments(scope, input.conversationId, (attachments) => {
    const next = attachments.map((attachment) => {
      if (attachmentKey(attachment) !== key
        || (attachment.localPullRequestCommentGuidance ?? "") === guidance) return attachment;
      changed = true;
      const copy = { ...attachment };
      if (guidance === "") delete copy.localPullRequestCommentGuidance;
      else copy.localPullRequestCommentGuidance = guidance;
      return copy;
    });
    return changed ? next : attachments;
  });
  return changed;
}

function workspaceInstruction(repo: string | null | undefined, target: PullRequestTarget): string {
  const repository = repo == null
    ? "Run GitHub CLI commands from that directory."
    : `Pass \`--repo ${repo}\` to GitHub CLI commands.`;
  return `The task workspace is at \`${target.cwd}\`. Locate the repository and checkout for the selected pull request before making changes. ${repository}`;
}

function commentsPrompt(input: { baseBranch: string; headBranch: string; number: number; repo?: string | null; target: PullRequestTarget }): string {
  const label = input.repo == null ? `PR ${input.number}` : `${input.repo} PR ${input.number}`;
  return ["## Pull request comments:",
    `Review ${label} (${input.headBranch} -> ${input.baseBranch}) and address the attached outstanding PR comments with the smallest safe changes.`,
    workspaceInstruction(input.repo, input.target),
    "Start from the attached unresolved review threads and comments.",
    "Address every actionable comment without asking the user which ones to handle.",
    "If a comment needs clarification, is already outdated, or should not be changed, explain that clearly instead of guessing.",
    "Address all actionable attached PR feedback.",
  ].join("\n");
}

function validateCommentsInput(input: { baseBranch?: string | null; conversationId?: string | null; headBranch?: string | null; prNumber?: number | null }): string | null {
  if (input.conversationId == null) return "missing-conversation";
  if (input.baseBranch == null || input.headBranch == null || input.prNumber == null) return "missing-pr-info";
  return null;
}

function attachReviewComments(scope: RepairScope, input: {
  baseBranch: string | null; comments: ReviewComment[]; conversationId: string | null;
  focusComposer: boolean; headBranch: string | null; number: number | null; repo?: string | null; target: PullRequestTarget;
}): boolean {
  const comments = filterOutstandingComments(input.comments);
  if (input.baseBranch == null || input.conversationId == null || input.headBranch == null
    || input.number == null || comments.length === 0) return false;
  ensureRepairTarget(scope, input.target, input.number);
  const attachments = comments.map(toCommentAttachment);
  setAttachments(scope, { attached: true, commentAttachments: attachments,
    conversationId: input.conversationId, target: input.target });
  const prompt = commentsPrompt({ baseBranch: input.baseBranch, headBranch: input.headBranch,
    number: input.number, repo: input.repo, target: input.target });
  setPromptUnlessUserEdited(scope, prompt);
  if (input.focusComposer) scope.focusComposer?.();
  return true;
}

function detachReviewComments(scope: RepairScope, input: {
  baseBranch: string | null; commentAttachments: CommentAttachment[]; conversationId: string | null;
  headBranch: string | null; number: number | null; repo?: string | null; target: PullRequestTarget;
}): boolean {
  if (!setAttachments(scope, { attached: false, commentAttachments: input.commentAttachments,
    conversationId: input.conversationId, target: input.target })) return false;
  const conversationId = input.conversationId;
  if (conversationId != null && (scope.get(commentAttachmentsSignal)[conversationId] ?? []).length === 0
    && input.baseBranch != null && input.headBranch != null && input.number != null) {
    const prompt = commentsPrompt({ baseBranch: input.baseBranch, headBranch: input.headBranch,
      number: input.number, repo: input.repo, target: input.target });
    if (scope.get(composerTextSignal) === prompt) scope.set(composerTextSignal, "");
  }
  return true;
}

function checkKey(check: PullRequestCheck): string { return check.link ?? `${check.workflow ?? ""}:${check.name}`; }

function ciPrompt(input: { baseBranch: string; headBranch: string; number: number; repo?: string | null; target: PullRequestTarget }): string {
  const label = input.repo == null ? `PR ${input.number}` : `${input.repo} PR ${input.number}`;
  return ["## Pull request CI repair:",
    `Review ${label} (${input.headBranch} -> ${input.baseBranch}) and make the smallest safe fix for the attached failing CI.`,
    workspaceInstruction(input.repo, input.target),
    "Start from the attached failing-check context. Then use `gh` to inspect the latest runs, annotations, and logs for those failures before changing code.",
    "Do not guess without logs. Do not do unrelated refactors. Be explicit if blocked.",
    "Use gh to inspect the failing CI and make the smallest safe fix. Once everything is fixed, commit and push it.",
  ].join("\n");
}

function setChecks(scope: RepairScope, input: {
  attached: boolean; checks: PullRequestCheck[]; pullRequestNumber: number; target: PullRequestTarget;
}): boolean {
  const failing = input.checks.filter((check) => check.status === "failing");
  if (failing.length === 0) return false;
  if (input.attached) ensureRepairTarget(scope, input.target, input.pullRequestNumber);
  else {
    const currentTarget = scope.get(repairTargetSignal);
    if (currentTarget == null || !sameTarget(currentTarget, input.target)) return false;
  }
  const state = scope.get(repairStateSignal);
  const keys = new Set(failing.map(checkKey));
  const checks = input.attached
    ? [...state.pullRequestChecks, ...failing.filter((check) => !new Set(state.pullRequestChecks.map(checkKey)).has(checkKey(check)))]
    : state.pullRequestChecks.filter((check) => !keys.has(checkKey(check)));
  scope.set(repairStateSignal, { ...state, pullRequestChecks: checks });
  return true;
}

function attachFailingChecks(scope: RepairScope, input: {
  baseBranch: string | null; checks: PullRequestCheck[]; headBranch: string | null;
  number: number | null; repo?: string | null; target: PullRequestTarget;
}): boolean {
  if (input.baseBranch == null || input.headBranch == null || input.number == null
    || !setChecks(scope, { attached: true, checks: input.checks,
      pullRequestNumber: input.number, target: input.target })) return false;
  const prompt = ciPrompt({ baseBranch: input.baseBranch, headBranch: input.headBranch,
    number: input.number, repo: input.repo, target: input.target });
  scope.set(composerTextSignal, prompt);
  scope.set(generatedPromptSignal, prompt);
  scope.focusComposer?.();
  return true;
}

function conflictPrompt(input: MergeConflict & { target: PullRequestTarget }): string {
  const label = input.repo == null ? `PR ${input.number}` : `${input.repo} PR ${input.number}`;
  return ["## Pull request merge conflict:",
    `Review ${label} (${input.headBranch} -> ${input.baseBranch}) and resolve the attached merge conflict blocker with the smallest safe changes.`,
    workspaceInstruction(input.repo, input.target),
    "Fetch the latest base branch, merge or rebase as appropriate for this repository, resolve the conflicts, and avoid unrelated refactors.",
    "Resolve the PR merge conflicts, then commit and push the fix.",
  ].join("\n");
}

function setMergeConflict(scope: RepairScope, conflict: MergeConflict | null): void {
  const state = scope.get(repairStateSignal);
  scope.set(repairStateSignal, { ...state, pullRequestMergeConflict: conflict });
}

function attachMergeConflict(scope: RepairScope, conflict: MergeConflict | null, target: PullRequestTarget): boolean {
  if (conflict == null) return false;
  ensureRepairTarget(scope, target, conflict.number);
  const prompt = conflictPrompt({ ...conflict, target });
  scope.set(composerTextSignal, prompt);
  scope.set(generatedPromptSignal, prompt);
  setMergeConflict(scope, conflict);
  scope.focusComposer?.();
  return true;
}

function attachAllIssues(scope: RepairScope, input: {
  baseBranch: string | null; conversationId: string | null; headBranch: string | null;
  pullRequestStatus: PullRequestStatus; target: PullRequestTarget;
}): boolean {
  const { pullRequestStatus: status } = input;
  if (input.baseBranch == null || input.headBranch == null || status.number == null) return false;
  const failing = status.checks.filter((check) => check.status === "failing");
  const comments = filterOutstandingComments(status.activityItems);
  const conflicts = status.mergeBlocker === "conflicts";
  if ((comments.length > 0 && input.conversationId == null) || (conflicts && status.url == null)) return false;
  if (comments.length > 0) attachReviewComments(scope, { baseBranch: input.baseBranch,
    comments, conversationId: input.conversationId, focusComposer: false,
    headBranch: input.headBranch, number: status.number, repo: status.repo, target: input.target });
  if (failing.length > 0) setChecks(scope, { attached: true, checks: failing,
    pullRequestNumber: status.number, target: input.target });
  if (conflicts && status.url != null) setMergeConflict(scope, {
    baseBranch: input.baseBranch, headBranch: input.headBranch, number: status.number,
    repo: status.repo, url: status.url,
  });
  const label = status.repo == null ? `PR ${status.number}` : `${status.repo} PR ${status.number}`;
  const prompt = ["## Pull request repair:",
    `Review ${label} (${input.headBranch} -> ${input.baseBranch}) and resolve every attached issue.`,
    workspaceInstruction(status.repo, input.target),
    ...(failing.length === 0 ? [] : ["Inspect and fix every attached failing CI check."]),
    ...(conflicts ? ["Resolve the attached pull request merge conflicts."] : []),
    ...(comments.length === 0 ? [] : ["Address every actionable attached pull request review comment."]),
    "Fix all attached pull request issues, run relevant verification, then commit and push the fixes.",
  ].join("\n");
  scope.set(composerTextSignal, prompt);
  scope.set(generatedPromptSignal, prompt);
  return true;
}

function setPromptUnlessUserEdited(scope: RepairScope, prompt: string): void {
  const current = scope.get(composerTextSignal);
  const previousGenerated = scope.get(generatedPromptSignal);
  if (current.trim() === "" || current === previousGenerated) {
    scope.set(composerTextSignal, prompt);
    scope.set(generatedPromptSignal, prompt);
  }
}

function statusAction(action: string): string | undefined {
  switch (action) {
    case "close": return "close";
    case "mark-draft": return "mark_draft";
    case "mark-ready": return "mark_ready";
    case "reopen":
    case "reopen-ready": return "reopen";
  }
}

function MergeActionButton(props: Record<string, unknown>): unknown {
  const runtime = ensureJsx();
  const pending = props.isMergePending || props.isAutoMergeEnabling || props.isAutoMergeDisabling;
  return runtime.jsx("button", {
    type: "button", disabled: Boolean(props.mergeDisabled || pending),
    "aria-busy": Boolean(pending), onClick: props.onMerge,
    children: pending ? "Updating pull request…" : props.isAutoMergeEnabled ? "Disable auto-merge" : "Merge",
  });
}

function PullRequestActions(props: Record<string, unknown>): unknown {
  const detail = props.detail as { isAuthor?: boolean; state?: string } | undefined;
  if (detail?.isAuthor !== true || detail.state === "merged") return null;
  return ensureJsx().jsx(MergeActionButton, props);
}

function initializeAnalytics(): void {}
function initializeMergeUi(): void { jsx = getJsxRuntime(); }
function initializeFixWorkflow(): void { initializeRepairState(); initializeMergeUi(); }
function initializeWorkflowDependencies(): void { initializeRepairState(); }
function trackStatusView(): void {}
function trackAction(): void {}
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export {
  initializeAnalytics as C,
  initializeMergeUi as S,
  trackStatusView as T,
  attachReviewComments as _,
  setMergeConflict as a,
  initializeFixWorkflow as b,
  attachMergeConflict as c,
  filterOutstandingComments as d,
  validateCommentsInput as f,
  updateCommentGuidance as g,
  detachReviewComments as h,
  setChecks as i,
  sameTarget as l,
  repairTargetSignal as m,
  checkKey as n,
  attachFailingChecks as o,
  initializeRepairState as p,
  initializeWorkflowDependencies as r,
  attachAllIssues as s,
  ciPrompt as t,
  attachmentKey as u,
  localizeAttachment as v,
  trackAction as w,
  MergeActionButton as x,
  PullRequestActions as y,
};
