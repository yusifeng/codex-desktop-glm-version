import { $3 as reactCompilerRuntime } from "@rchunk/app-shared";
import {
  Kan as initializeLiveGitQuery,
  Yan as useLiveGitQuery,
} from "@rchunk/app-initial";

void reactCompilerRuntime;

export interface GitRootInput {
  root: string;
}

export interface BaseBranchQueryParameters {
  operationSource: string;
  root: string;
}

export interface RecentBranchesQueryParameters extends BaseBranchQueryParameters {
  limit: number;
}

export interface RecentBranchesResult {
  branches: unknown[];
}

type LiveQueryOptions = Record<string, unknown>;

function baseBranchLiveQuery(parameters: BaseBranchQueryParameters) {
  return { method: "base-branch", params: parameters };
}

function useGitBaseBranch(
  host: unknown,
  roots: readonly GitRootInput[],
  operationSource: string,
  options?: LiveQueryOptions,
): unknown {
  return useLiveGitQuery(
    host,
    roots,
    "base-branch",
    ({ root }) => ({ operationSource, root }),
    operationSource,
    { liveQuery: baseBranchLiveQuery, staleTime: Infinity, ...options },
  );
}

function recentBranchesLiveQuery(parameters: RecentBranchesQueryParameters) {
  return { method: "recent-branches", params: parameters };
}

function selectRecentBranches(result: RecentBranchesResult): unknown[] {
  return result.branches;
}

function useGitRecentBranches(
  host: unknown,
  roots: readonly GitRootInput[],
  operationSource: string,
  options?: LiveQueryOptions & { limit?: number },
): unknown {
  const { limit = 100, ...queryOptions } = options ?? {};
  return useLiveGitQuery(
    host,
    roots,
    "recent-branches",
    ({ root }) => ({ limit, operationSource, root }),
    operationSource,
    {
      liveQuery: recentBranchesLiveQuery,
      select: selectRecentBranches,
      staleTime: Infinity,
      ...queryOptions,
    },
  );
}

function initializeUseGitBaseBranch(): void {
  initializeLiveGitQuery();
}

function initializeUseGitRecentBranches(): void {
  initializeLiveGitQuery();
}

export {
  useGitBaseBranch as i,
  useGitRecentBranches as n,
  initializeUseGitBaseBranch as r,
  initializeUseGitRecentBranches as t,
};
