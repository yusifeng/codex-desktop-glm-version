import {
  FX as initializeSignalRuntime,
  QI as initializeScopeRuntime,
  ZI as appScope,
  sZ as createScopedSignal,
} from "@rchunk/app-shared";
import {
  mnt as initializeAppRuntime,
  pnt as appServices,
  z2t as loadUniqueValues,
} from "@rchunk/app-initial";

export interface PullRequestReference {
  reviewThreadId?: string | null;
  url?: string | null;
}

export interface PullRequestLookupItem extends PullRequestReference {
  [key: string]: unknown;
}

export interface PullRequestLookup {
  byReviewThreadId: Map<string, PullRequestLookupItem>;
  byUrl: Map<string, PullRequestLookupItem>;
}

export interface PullRequestTimelineItem {
  type: string;
  [key: string]: unknown;
}

export interface PullRequestCommentPosition {
  line: number;
  path: string;
  side: string;
  start_line?: number;
  start_side?: string;
}

export interface PullRequestCommentLike {
  line?: number | null;
  path?: string | null;
  side?: string | null;
  startLine?: number | null;
  startSide?: string | null;
}

export interface ExistingPullRequestComment {
  position: PullRequestCommentPosition;
}

export type PullRequestState = "closed" | "draft" | "open";
export type PullRequestStateAction =
  | "close"
  | "mark-draft"
  | "mark-ready"
  | "reopen"
  | "reopen-ready";

export interface PullRequestReviewers {
  approved: string[];
  avatarUrlsByLogin?: Record<string, string>;
  changesRequested: string[];
  commented: string[];
  requested: string[];
  requestedTeams: string[];
}

export interface PullRequestReviewerSummary {
  avatarUrl: string | null;
  kind: "team" | "user";
  label: string;
  status: "approved" | "changes_requested" | "waiting";
}

let githubIntegrationAvailable: ReturnType<typeof createScopedSignal>;
let uniqueValues: <Value>(values: readonly Value[]) => Value[];

function initializePullRequestDetailAvailability(): void {
  initializeSignalRuntime();
  initializeAppRuntime();
  initializeScopeRuntime();
  const services = appServices as typeof appServices & { github?: unknown };
  githubIntegrationAvailable = createScopedSignal(
    appScope,
    () => services == null || services.github != null,
  );
}

function findPullRequest<T extends PullRequestLookupItem>(
  reference: PullRequestReference,
  lookup: {
    byReviewThreadId: Map<string, T>;
    byUrl: Map<string, T>;
  },
): T | null {
  if (reference.reviewThreadId != null) {
    const byThread = lookup.byReviewThreadId.get(reference.reviewThreadId);
    if (byThread != null) return byThread;
  }
  return reference.url == null ? null : (lookup.byUrl.get(reference.url) ?? null);
}

function buildPullRequestLookup<T extends PullRequestLookupItem>(
  items: readonly T[] | null | undefined,
): { byReviewThreadId: Map<string, T>; byUrl: Map<string, T> } {
  const byReviewThreadId = new Map<string, T>();
  const byUrl = new Map<string, T>();
  for (const item of items ?? []) {
    if (item.reviewThreadId != null && !byReviewThreadId.has(item.reviewThreadId)) {
      byReviewThreadId.set(item.reviewThreadId, item);
    }
    if (item.url != null && !byUrl.has(item.url)) byUrl.set(item.url, item);
  }
  return { byReviewThreadId, byUrl };
}

function filterPullRequestTimeline<T extends PullRequestTimelineItem>(
  items: readonly T[],
): T[] {
  return items.filter(
    (item) => item.type !== "event" && item.type !== "commit_group",
  );
}

function resolveCommentPosition(
  comment: PullRequestCommentLike,
  existing: ExistingPullRequestComment | null | undefined,
): PullRequestCommentPosition | null {
  if (existing != null) return existing.position;
  if (comment.line == null || comment.path == null || comment.side == null) {
    return null;
  }
  return {
    line: comment.line,
    path: comment.path,
    side: comment.side,
    start_line: comment.startLine ?? undefined,
    start_side: comment.startSide ?? undefined,
  };
}

function getPullRequestStateAction(
  currentState: PullRequestState,
  targetState: PullRequestState,
  reopenAsReady: boolean,
): PullRequestStateAction {
  switch (targetState) {
    case "closed":
      return "close";
    case "draft":
      return "mark-draft";
    case "open":
      return currentState === "closed"
        ? reopenAsReady
          ? "reopen-ready"
          : "reopen"
        : "mark-ready";
  }
}

function reviewerStatus(
  reviewers: PullRequestReviewers,
  login: string,
): PullRequestReviewerSummary["status"] {
  if (reviewers.changesRequested.includes(login)) return "changes_requested";
  if (reviewers.approved.includes(login)) return "approved";
  return "waiting";
}

function uniqueInOrder(values: readonly string[]): string[] {
  return uniqueValues(values);
}

function summarizeReviewers(
  reviewers: PullRequestReviewers,
): PullRequestReviewerSummary[] {
  return uniqueInOrder([
    ...reviewers.requested,
    ...reviewers.requestedTeams,
    ...reviewers.approved,
    ...reviewers.changesRequested,
    ...reviewers.commented,
  ]).map((login) => ({
    avatarUrl: reviewers.avatarUrlsByLogin?.[login] ?? null,
    kind: reviewers.requestedTeams.includes(login) ? "team" : "user",
    label: login,
    status: reviewerStatus(reviewers, login),
  }));
}

function initializePullRequestReviewerModel(): void {
  const loaded = loadUniqueValues();
  uniqueValues = typeof loaded === "function" ? loaded : loaded.default;
}

export {
  summarizeReviewers as a,
  initializePullRequestDetailAvailability as c,
  resolveCommentPosition as i,
  githubIntegrationAvailable as l,
  findPullRequest as n,
  getPullRequestStateAction as o,
  filterPullRequestTimeline as r,
  initializePullRequestReviewerModel as s,
  buildPullRequestLookup as t,
};
