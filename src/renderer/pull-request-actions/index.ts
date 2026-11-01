import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

type Callable = (...args: unknown[]) => unknown;
type QueryKey = readonly unknown[];
interface ReviewComment {
  authorLogin?: string;
  content: Array<{ content_type?: string; text?: string }>;
  id?: string;
  position: { line: number; path: string; side: string; start_line?: number; start_side?: string };
  replyToReviewThreadId?: string | null;
  reviewThreadId?: string | null;
  [key: string]: unknown;
}
interface PullRequestIdentity { hostname: string; number: number; owner: string; repository: string }
interface PullRequestRequest {
  account: { hostId: string; hostname: string; login: string };
  pullRequest: PullRequestIdentity;
  [key: string]: unknown;
}
interface PullRequestDetail {
  authorLogin?: string | null;
  baseBranch: string;
  headBranch: string;
  headRevision: string;
  isAuthor?: boolean;
  pullRequest: PullRequestIdentity;
  unifiedDiff?: string;
}
interface QueryClient {
  cancelQueries(filter: Record<string, unknown>): Promise<unknown>;
  getMutationCache(): { build(client: QueryClient, options: Record<string, unknown>): { execute(value: unknown): Promise<unknown> } };
  getQueryData(key: QueryKey): unknown;
  invalidateQueries(filter: Record<string, unknown>): Promise<unknown>;
  isFetching(filter: Record<string, unknown>): number;
  isMutating(filter: Record<string, unknown>): number;
  setQueriesData(filter: Record<string, unknown>, updater: (value: unknown) => unknown): void;
  setQueryData(key: QueryKey, updater: unknown): void;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
function invoke<T>(value: unknown, ...args: unknown[]): T { return (value as Callable)(...args) as T; }
function maybeInitialize(...values: unknown[]): void { for (const value of values) if (typeof value === "function") invoke(value); }

function commentKey(comment: ReviewComment): string {
  if (typeof initial.Znn === "function") return invoke<string>(initial.Znn, comment);
  return String(comment.id ?? JSON.stringify([comment.position.path, comment.position.side, comment.position.line, comment.replyToReviewThreadId]));
}
function submissionKey(revision: string, comment: ReviewComment): { commentKey: string; revision: string } { return { commentKey: commentKey(comment), revision }; }
function commentText(comment: ReviewComment): string {
  return comment.content.flatMap((item) => item.content_type === "text" ? [item.text ?? ""] : []).join("\n\n").trim();
}
function changedComments({ currentComments, nextComments }: { currentComments: ReviewComment[]; nextComments: ReviewComment[] }): ReviewComment[] {
  const existing = new Set(currentComments.map(commentKey));
  const changedReplies = nextComments.filter((next) => currentComments.some((current) =>
    current.replyToReviewThreadId != null && current.replyToReviewThreadId === next.replyToReviewThreadId &&
    commentText(current).length === 0 && commentText(next).length > 0 &&
    current.position.path === next.position.path && current.position.side === next.position.side && current.position.line === next.position.line));
  const added = nextComments.filter((comment) => commentText(comment).length > 0 && !existing.has(commentKey(comment)));
  return [...new Map([...changedReplies, ...added].map((comment) => [commentKey(comment), comment])).values()];
}
function countCommentsByFile({ comments, filePaths, workspaceRoot }: { comments: ReviewComment[]; filePaths: string[]; workspaceRoot?: string }): Map<string, number> {
  const counts = new Map<string, number>();
  for (const comment of comments) {
    const file = filePaths.find((candidate) => typeof initial.rrn === "function"
      ? invoke<boolean>(initial.rrn, comment.position.path, candidate, workspaceRoot)
      : candidate === comment.position.path || `${workspaceRoot ?? ""}/${comment.position.path}`.endsWith(candidate));
    if (file != null) counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  return counts;
}

class PullRequestDescriptionGenerationError extends Error {
  reason: string;
  constructor(reason: string, cause?: unknown) { super(reason, { cause }); this.reason = reason; this.name = "PullRequestDescriptionGenerationError"; }
}

function bounded(value: string | null | undefined, limit: number, fenced = false): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) return "-";
  const result = trimmed.length <= limit ? trimmed : `${trimmed.slice(0, limit - 1)}…`;
  return !fenced || (result.match(/```/gu)?.length ?? 0) % 2 === 0 ? result : `${result}\n\`\`\``;
}
function descriptionPrompt(input: { baseBranch?: string; body?: string; headBranch?: string; pullRequestInstructions?: string; title?: string; unifiedDiff?: string }): string {
  return [
    input.body?.trim() ? "Update the existing pull request description. Preserve accurate existing description and testing notes while incorporating the current diff." : "Write a pull request description from the current diff. Preserve any accurate context and testing notes supplied below.",
    "", "Pull request context:", `- Head: ${bounded(input.headBranch, 256)}`, `- Base: ${bounded(input.baseBranch, 256)}`, `- Current title: ${bounded(input.title, 512)}`,
    "", "Current description:", bounded(input.body, 6_000, true), "", "Pull request instructions (apply these to the title/body content only):", bounded(input.pullRequestInstructions, 4_000, true),
    "", "Canonical pull request diff:", bounded(input.unifiedDiff, 18_000, true),
  ].join("\n");
}
function pullRequestKey(value: PullRequestIdentity): string {
  return typeof initial.n5t === "function" ? invoke<string>(initial.n5t, value) : `${value.hostname}/${value.owner}/${value.repository}/${value.number}`.toLowerCase();
}
function validateTarget(detail: PullRequestDetail, request: PullRequestRequest): void {
  const normalizeHost = (value: string) => typeof initial.Z8t === "function" ? invoke<string>(initial.Z8t, value) : value.toLowerCase();
  if (pullRequestKey(detail.pullRequest) !== pullRequestKey(request.pullRequest) ||
    normalizeHost(request.account.hostname) !== normalizeHost(request.pullRequest.hostname) ||
    (detail.isAuthor && detail.authorLogin != null && detail.authorLogin.toLowerCase() !== request.account.login.toLowerCase())) {
    throw new PullRequestDescriptionGenerationError("target_changed");
  }
}
async function loadPullRequestResource(resource: string, request: PullRequestRequest, signal?: AbortSignal): Promise<Record<string, unknown>> {
  try { return await invoke<Promise<Record<string, unknown>>>(initial.Xy, resource, request, { signal, source: "pull_requests_page" }); }
  catch (error) { signal?.throwIfAborted(); throw new PullRequestDescriptionGenerationError(resource === "gh-pr-diff" ? "diff_failed" : "status_failed", error); }
}
async function generatePullRequestDescription(input: {
  appServerVersion?: string; body?: string; detail: PullRequestDetail; pullRequestInstructions?: string;
  request?: PullRequestRequest; signal?: AbortSignal; title?: string; unifiedDiff?: string;
}): Promise<string> {
  const services = initialChunk.pnt as unknown as { pullRequestMessageGeneration?: { generate(input: Record<string, unknown>): Promise<{ body?: string } | null> } };
  if (input.request == null || services.pullRequestMessageGeneration == null) {
    if (input.unifiedDiff != null || input.detail.headRevision == null) return descriptionPrompt({ ...input.detail, ...input, unifiedDiff: input.unifiedDiff ?? input.detail.unifiedDiff });
    throw new PullRequestDescriptionGenerationError("unsupported");
  }
  validateTarget(input.detail, input.request);
  const diff = await loadPullRequestResource("gh-pr-diff", input.request, input.signal);
  if (diff.status === "error") throw new PullRequestDescriptionGenerationError("diff_failed", diff.error);
  if (diff.headRevision !== input.detail.headRevision) throw new PullRequestDescriptionGenerationError("head_changed");
  input.signal?.throwIfAborted();
  let generated: { body?: string } | null;
  try {
    const generation = services.pullRequestMessageGeneration.generate({ appServerVersion: input.appServerVersion, hostId: input.request.account.hostId,
      prompt: descriptionPrompt({ ...input.detail, ...input, unifiedDiff: String(diff.unifiedDiff ?? "") }) });
    generated = typeof initial.Zy === "function" ? await invoke<Promise<{ body?: string } | null>>(initial.Zy, generation, input.signal) : await generation;
  } catch (error) { input.signal?.throwIfAborted(); throw new PullRequestDescriptionGenerationError("generation_failed", error); }
  const body = generated?.body?.trim();
  if (!body) throw new PullRequestDescriptionGenerationError("empty_result");
  const status = await loadPullRequestResource("gh-pr-summary", input.request, input.signal);
  if (status.status !== "success") throw new PullRequestDescriptionGenerationError("status_failed");
  const parsed = status.url == null ? null : (typeof initial.s5t === "function" ? invoke<PullRequestIdentity | null>(initial.s5t, status.url) : null);
  if (parsed == null || pullRequestKey(parsed) !== pullRequestKey(input.request.pullRequest) || status.baseBranch !== input.detail.baseBranch) throw new PullRequestDescriptionGenerationError("target_changed");
  if (status.headRevision !== diff.headRevision) throw new PullRequestDescriptionGenerationError("head_changed");
  return body;
}

const RESOURCE_MAP: Record<string, string[]> = {
  "update-body": ["gh-pr-body"], "update-title": ["gh-pr-summary"],
  "request-reviewers": ["gh-pr-reviews", "gh-pr-summary"], "remove-reviewers": ["gh-pr-reviews", "gh-pr-summary"],
  "toggle-auto-merge": ["gh-pr-metadata", "gh-pr-summary"], "mark-draft": ["gh-pr-summary"], "mark-ready": ["gh-pr-summary"],
  close: ["gh-pr-summary", "gh-pr-metadata", "gh-pr-discussion"], reopen: ["gh-pr-summary", "gh-pr-metadata", "gh-pr-discussion"],
  "reopen-ready": ["gh-pr-summary", "gh-pr-metadata", "gh-pr-discussion"],
};
function resourceQueries(request: PullRequestRequest, resource: string): Array<{ exact: true; queryKey: QueryKey }> {
  return ["github-cli", "github-connector"].map((provider) => ({ exact: true,
    queryKey: typeof initial.Vy === "function" ? invoke<QueryKey>(initial.Vy, request, provider, resource) : [provider, resource, request.pullRequest] }));
}
function projectPullRequestStatus(client: QueryClient, request: PullRequestRequest, action: Record<string, unknown>): void {
  const summaryKey = typeof initial.Dy === "function" ? invoke<QueryKey>(initial.Dy, request) : ["pull-request-summary", request.pullRequest];
  client.setQueriesData({ queryKey: summaryKey }, (value) => {
    const status = value as Record<string, unknown> | undefined;
    if (status?.status !== "success") return value;
    switch (action.action) {
      case "merge": case "close": return { ...status, canMerge: false, checks: [], checksComplete: true, ciStatus: "none", hasPendingChecks: false, hasOpenPr: false, mergeBlocker: null, state: action.action === "merge" ? "merged" : "closed" };
      case "mark-draft": return { ...status, isDraft: true, canMerge: false };
      case "mark-ready": return { ...status, isDraft: false };
      case "reopen": case "reopen-ready": return { ...status, hasOpenPr: true, isDraft: false, state: "open", checksComplete: false, ciStatus: "pending", hasPendingChecks: true, mergeBlocker: "unknown", canMerge: false };
      case "update-title": return { ...status, title: action.title };
      default: return value;
    }
  });
  if (action.action === "update-body") {
    client.setQueriesData({ queryKey: resourceQueries(request, "gh-pr-body")[0].queryKey }, (value) => {
      const status = value as Record<string, unknown> | undefined; return status?.status === "success" ? { ...status, body: action.body } : value;
    });
  } else if (action.action === "toggle-auto-merge") {
    client.setQueriesData({ queryKey: resourceQueries(request, "gh-pr-metadata")[0].queryKey }, (value) => {
      const status = value as Record<string, unknown> | undefined; return status?.status === "success" ? { ...status, isAutoMergeEnabled: action.enabled } : value;
    });
  } else if (action.action === "request-reviewers" || action.action === "remove-reviewers") {
    client.setQueriesData({ queryKey: resourceQueries(request, "gh-pr-reviews")[0].queryKey }, (value) => {
      const status = value as Record<string, unknown> | undefined;
      const reviewers = status?.reviewers as { requested?: string[]; requestedTeams?: string[]; requestedTeamSlugs?: Record<string, string> } | undefined;
      if (status?.status !== "success" || reviewers == null) return value;
      const requested = (action.reviewers as string[] | undefined) ?? [];
      const teams = (action.teamReviewers as string[] | undefined) ?? [];
      return { ...status, reviewers: { ...reviewers,
        requested: action.action === "request-reviewers" ? Array.from(new Set([...(reviewers.requested ?? []), ...requested])) : (reviewers.requested ?? []).filter((login) => !requested.includes(login)),
        requestedTeams: action.action === "remove-reviewers" ? (reviewers.requestedTeams ?? []).filter((team) => !teams.includes(reviewers.requestedTeamSlugs?.[team] ?? team)) : reviewers.requestedTeams,
      } };
    });
  }
}
async function runMutation(client: QueryClient, request: PullRequestRequest, operation: () => Promise<Record<string, unknown>>, options: {
  awaitRefresh?: boolean; onSuccess?(): void; resources?: string[]; updatedBody?: string; workspaceRequest?: unknown;
} = {}): Promise<void> {
  const mutationKey = ["github", "pull-request", request.account.hostId, request.pullRequest.hostname, request.pullRequest.owner, request.pullRequest.repository, request.pullRequest.number];
  let succeeded = false;
  try {
    await client.getMutationCache().build(client, { mutationKey, retry: false, networkMode: "always", scope: { id: mutationKey.slice(2).join("/").toLowerCase() },
      mutationFn: async () => { const result = await operation(); if (result.status === "error") throw new Error(String(result.error)); } }).execute(undefined);
    succeeded = true; options.onSuccess?.();
    if (options.updatedBody != null) client.setQueriesData({ queryKey: resourceQueries(request, "gh-pr-body")[0].queryKey }, (value) => {
      const record = value as Record<string, unknown> | undefined; return record?.status === "success" ? { ...record, body: options.updatedBody } : value;
    });
  } finally {
    const resources = options.resources ?? ["gh-pr-summary", "gh-pr-metadata", "gh-pr-reviews", "gh-pr-discussion"];
    const filters = resources.flatMap((resource) => resourceQueries(request, resource));
    await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
    const invalidations = filters.map((filter) => client.invalidateQueries(filter));
    if (options.workspaceRequest != null && typeof initial.$ln === "function") invalidations.push(client.invalidateQueries({ queryKey: invoke(initial.$ln, "gh-pr-board") }));
    const settled = Promise.allSettled(invalidations);
    if (options.awaitRefresh !== false && options.updatedBody == null && succeeded) await settled;
  }
}
async function request(operation: string, payload: Record<string, unknown>, source = "pull_requests_page"): Promise<Record<string, unknown>> {
  return invoke<Promise<Record<string, unknown>>>(initial.Xy, operation, payload, { source });
}

let addCommentMutation: unknown;
let updateCommentMutation: unknown;
let reviewThreadMutation: unknown;
let submitInlineCommentMutation: unknown;
let updateTitleMutation: unknown;
let updateBodyMutation: unknown;
let updatePullRequestMutation: unknown;
let mergePullRequestMutation: unknown;
let submitReviewMutation: unknown;
let mutationResources: unknown;
let actionsInitialized = false;
function initializeCommentActions(): void { maybeInitialize(initial.gmn, initial.nrn); }
function initializeDescriptionGeneration(): void { maybeInitialize(initial.mnt, initial.Yy, initial.i5t); }
function initializePullRequestActions(): void {
  if (actionsInitialized) return; actionsInitialized = true;
  maybeInitialize(shared.FX, initial.Y6, initial.nrn, initial.Ry, initial.Hy, initial.Oy, initial.Yy, shared.QI, initial.itn, initial.$fn, initial.nun);
  initializeCommentActions(); initializeDescriptionGeneration();
  const family = shared.JX as Callable | undefined;
  if (family == null) return;
  addCommentMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) =>
    runMutation(context.client, pr, () => request("gh-pr-comment", { ...pr, body: value.body, ...(value.replyToReviewThreadId == null ? {} : { replyToReviewThreadId: value.replyToReviewThreadId }) }, String(value.source ?? "pull_requests_page")), { awaitRefresh: false, onSuccess: value.onSuccess as (() => void) | undefined, workspaceRequest: value.workspaceRequest }) }));
  updateCommentMutation = family(shared.ZI, ({ request: pr }: { request: PullRequestRequest }) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) =>
    runMutation(context.client, pr, () => request("gh-pr-comment-update", { ...pr, ...value }, String(value.source ?? "pull_requests_page")), { awaitRefresh: false, workspaceRequest: value.workspaceRequest }) }));
  reviewThreadMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) =>
    runMutation(context.client, pr, () => request("gh-pr-review-thread-update", { ...pr, action: value.action, reviewThreadId: value.reviewThreadId }, String(value.source ?? "pull_requests_page")), { onSuccess: value.onResolved as (() => void) | undefined, workspaceRequest: value.workspaceRequest }) }));
  submitInlineCommentMutation = family(initial.$en, ({ request: pr, submissionKey: key }: { request: PullRequestRequest; submissionKey: { revision: string } }) => ({ mutationFn: (value: { comment: ReviewComment; onSuccess(): void }, context: { client: QueryClient }) =>
    runMutation(context.client, pr, () => request("gh-pr-comment", { ...pr, body: commentText(value.comment), expectedHeadRevision: key.revision,
      ...(value.comment.replyToReviewThreadId == null ? { inlineComment: { line: value.comment.position.line, path: value.comment.position.path, side: value.comment.position.side, startLine: value.comment.position.start_line, startSide: value.comment.position.start_side } } : { replyToReviewThreadId: value.comment.replyToReviewThreadId }) }), { awaitRefresh: false, onSuccess: value.onSuccess }) }));
  updateTitleMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) => runMutation(context.client, pr, () => request("gh-pr-update", { ...pr, action: "update-title", title: value.title }, String(value.source ?? "pull_requests_page")), { resources: RESOURCE_MAP["update-title"], onSuccess: () => projectPullRequestStatus(context.client, pr, { action: "update-title", title: value.title }), workspaceRequest: value.workspaceRequest }) }));
  updateBodyMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) => runMutation(context.client, pr, () => request("gh-pr-update", { ...pr, action: "update-body", body: value.body }, String(value.source ?? "pull_requests_page")), { resources: RESOURCE_MAP["update-body"], updatedBody: String(value.body ?? ""), onSuccess: () => projectPullRequestStatus(context.client, pr, { action: "update-body", body: value.body }), workspaceRequest: value.workspaceRequest }) }));
  updatePullRequestMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ networkMode: "always", mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) => runMutation(context.client, pr, () => request("gh-pr-update", { ...pr, ...value }, String(value.source ?? "pull_requests_page")), { resources: RESOURCE_MAP[String(value.action)] ?? [], onSuccess: () => projectPullRequestStatus(context.client, pr, value), workspaceRequest: value.workspaceRequest }) }));
  mergePullRequestMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ networkMode: "always", mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) => runMutation(context.client, pr, () => request("gh-pr-merge", { ...pr, expectedHeadRevision: value.expectedHeadRevision, mergeMethod: value.mergeMethod }, String(value.source ?? "pull_requests_page")), { onSuccess: () => projectPullRequestStatus(context.client, pr, { action: "merge" }), workspaceRequest: value.workspaceRequest }) }));
  submitReviewMutation = family(shared.ZI, (pr: PullRequestRequest) => ({ mutationFn: (value: Record<string, unknown>, context: { client: QueryClient }) => runMutation(context.client, pr, () => request("gh-pr-submit-review", { ...pr, body: value.body, event: value.event, expectedHeadRevision: value.expectedHeadRevision }), { awaitRefresh: false }) }));
  mutationResources = typeof shared.rZ === "function" ? invoke(shared.rZ, shared.ZI, (pr: PullRequestRequest, context: { get(signal: unknown, parameter: unknown): { isPending?: boolean } }) =>
    [updateTitleMutation, updateBodyMutation, updatePullRequestMutation, mergePullRequestMutation].some((signal) => context.get(signal, pr).isPending === true)) : { resources: RESOURCE_MAP };
}

export { changedComments as _, mutationResources as a, submitReviewMutation as c, updateTitleMutation as d,
  PullRequestDescriptionGenerationError as f, countCommentsByFile as g, submissionKey as h, updateCommentMutation as i,
  updateBodyMutation as l, initializeDescriptionGeneration as m, submitInlineCommentMutation as n,
  mergePullRequestMutation as o, generatePullRequestDescription as p, addCommentMutation as r,
  reviewThreadMutation as s, initializePullRequestActions as t, updatePullRequestMutation as u, initializeCommentActions as v };
