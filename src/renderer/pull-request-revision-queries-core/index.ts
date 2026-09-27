import {
  FX as initializeSignalRuntime,
  QI as initializeScopeRuntime,
  QX as createQueryFamily,
  ZI as appScope,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  $ln as buildQueryKey,
  Gy as gitHubCliAvailability,
  Xy as requestGitHubCli,
  Yy as initializeGitHubCliQueries,
  gy as currentGitHubUserQuery,
  i5t as initializeGitHubAccountIdentity,
  nrn as initializeGitHost,
  nun as initializeQueryKeys,
  qy as initializePullRequestQueryModel,
  t5t as getGitHubAccountIdentity,
  yy as initializePullRequestQueries,
} from "@rchunk/app-initial";
import {
  r as initializeFullContentMetadata,
  t as createFullContentMetadata,
} from "@rchunk/full-content-metadata";

export interface PullRequestRevisionAccount {
  hostId: string;
  [key: string]: unknown;
}

export interface PullRequestRevisionReference {
  hostname: string;
  [key: string]: unknown;
}

export interface PullRequestRevisionRequest {
  account: PullRequestRevisionAccount;
  pullRequest: PullRequestRevisionReference;
  [key: string]: unknown;
}

export type PullRequestRevisionCapability =
  | "account-mismatch"
  | "available"
  | "cli-required"
  | "loading";

export interface RevisionFileDescriptor {
  metadata: import("@rchunk/full-content-metadata").PartialDiffMetadata;
  newPath: string;
  oldPath: string;
}

interface RevisionFileResponse {
  baseContent: string;
  headContent: string;
  status: string;
}

interface QuerySnapshotResult {
  data?: RevisionFileResponse;
  refetch(): Promise<{ data?: RevisionFileResponse }>;
}

export interface RevisionFileScope {
  get(
    signal: unknown,
    parameter: Record<string, unknown>,
  ): QuerySnapshotResult;
  query: {
    getData(
      signal: unknown,
      parameter: Record<string, unknown>,
    ): RevisionFileResponse | undefined;
  };
}

let pullRequestRevisionCapability$: unknown;
let pullRequestReviewSnapshotQuery$: unknown;
let pullRequestRevisionDiffQuery$: unknown;
let pullRequestRevisionFileQuery$: unknown;

function createPullRequestRevisionFileLoader(
  scope: RevisionFileScope,
  request: PullRequestRevisionRequest & Record<string, unknown>,
  file: RevisionFileDescriptor,
) {
  const parameters = {
    ...request,
    basePath: file.oldPath === "/dev/null" ? null : file.oldPath,
    headPath: file.newPath === "/dev/null" ? null : file.newPath,
  };
  return {
    key: JSON.stringify(buildQueryKey("gh-pr-revision-file", parameters)),
    load: async () => {
      const cached = scope.query.getData(pullRequestRevisionFileQuery$, parameters);
      const response =
        cached != null && cached.status !== "error"
          ? cached
          : (await scope.get(pullRequestRevisionFileQuery$, parameters).refetch()).data;
      if (response?.status !== "success") {
        return { type: response?.status ?? "error" };
      }
      const metadata = createFullContentMetadata(
        file.metadata,
        response.baseContent.match(/[^\n]*\n|[^\n]+$/g) ?? [],
        response.headContent.match(/[^\n]*\n|[^\n]+$/g) ?? [],
      );
      return metadata == null
        ? { type: "unavailable" }
        : { metadata, type: "success" };
    },
  };
}

function initializePullRequestRevisionQueries(): void {
  initializeSignalRuntime();
  initializeGitHost();
  initializeFullContentMetadata();
  initializePullRequestQueryModel();
  initializeGitHubCliQueries();
  initializeScopeRuntime();
  initializeQueryKeys();
  initializeGitHubAccountIdentity();
  initializePullRequestQueries();

  pullRequestRevisionCapability$ = createDerivedFamily(
    appScope,
    (
      request: PullRequestRevisionRequest,
      { get },
    ): PullRequestRevisionCapability => {
      const availability = get(gitHubCliAvailability, {
        cwd: null,
        hostId: request.account.hostId,
        hostname: request.pullRequest.hostname,
        operationSource: "pull_requests_page",
      });
      if (availability === "loading") return "loading";
      if (availability !== "available") return "cli-required";
      const currentAccount = get(currentGitHubUserQuery, {
        hostId: request.account.hostId,
        hostname: request.pullRequest.hostname,
        provider: "github-cli",
      }) as {
        data?: { account?: unknown; status?: string };
        isPending?: boolean;
      };
      if (currentAccount.isPending) return "loading";
      return currentAccount.data?.status === "success" &&
        getGitHubAccountIdentity(currentAccount.data.account) ===
          getGitHubAccountIdentity(request.account)
        ? "available"
        : "account-mismatch";
    },
  );

  pullRequestReviewSnapshotQuery$ = createQueryFamily(
    appScope,
    (request: PullRequestRevisionRequest, { get }) => ({
      enabled: get(pullRequestRevisionCapability$, request) === "available",
      queryKey: buildQueryKey("gh-pr-review-snapshot", request),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      queryFn: ({ signal }) =>
        requestGitHubCli("gh-pr-review-snapshot", request, {
          signal,
          source: "pull_requests_page",
        }),
      staleTime: Infinity,
    }),
  );

  pullRequestRevisionDiffQuery$ = createQueryFamily(
    appScope,
    (request: PullRequestRevisionRequest, { get }) => ({
      enabled: get(pullRequestRevisionCapability$, request) === "available",
      queryKey: buildQueryKey("gh-pr-revision-diff", request),
      queryFn: ({ signal }) =>
        requestGitHubCli("gh-pr-revision-diff", request, {
          signal,
          source: "pull_requests_page",
        }),
      staleTime: Infinity,
    }),
  );

  pullRequestRevisionFileQuery$ = createQueryFamily(
    appScope,
    (request: PullRequestRevisionRequest) => ({
      enabled: false,
      queryKey: buildQueryKey("gh-pr-revision-file", request),
      queryFn: ({ signal }) =>
        requestGitHubCli("gh-pr-revision-file", request, {
          signal,
          source: "pull_requests_page",
        }),
      staleTime: Infinity,
    }),
  );
}

export {
  pullRequestRevisionDiffQuery$ as a,
  pullRequestRevisionCapability$ as i,
  initializePullRequestRevisionQueries as n,
  pullRequestReviewSnapshotQuery$ as r,
  createPullRequestRevisionFileLoader as t,
};
