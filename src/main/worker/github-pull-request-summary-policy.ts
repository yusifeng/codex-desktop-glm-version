type PullRequestIdentity = { owner: string; repository: string; number: number };

type PullRequestReader = { host: any; signal?: AbortSignal };

/** Builds the paginated GraphQL query used by the summary batcher. */
function buildPullRequestSummaryQuery(
  pages: Array<{ pullRequest: PullRequestIdentity; index: number; cursor: string | null }>,
): string {
  return `query { viewer { login } ${pages
    .map(
      ({ pullRequest, index, cursor }) =>
        `p${index}: repository(owner:${JSON.stringify(pullRequest.owner)},name:${JSON.stringify(pullRequest.repository)}) { pullRequest(number:${pullRequest.number}) { number url title baseRefName headRefName state isDraft mergeable mergeStateStatus headRefOid headRepository { url } commits(last:1) { nodes { commit { oid statusCheckRollup { contexts(first:100,after:${JSON.stringify(cursor)}) { nodes { __typename ... on CheckRun { name status conclusion startedAt completedAt detailsUrl checkSuite { workflowRun { event workflow { name } } } } ... on StatusContext { context state createdAt description targetUrl } } pageInfo { hasNextPage endCursor } } } } } } } }`,
    )
    .join(` `)} }`;
}

function getPullRequestSummaryKey(pullRequest: PullRequestIdentity): string {
  return JSON.stringify([
    pullRequest.owner.toLowerCase(),
    pullRequest.repository.toLowerCase(),
    pullRequest.number,
  ]);
}

function getActivePullRequestReaders(readers: PullRequestReader[]) {
  return readers.filter(({ signal }) => !signal?.aborted);
}

function getPullRequestSummaryState(state: string): "open" | "merged" | "closed" | undefined {
  if (state === `OPEN`) return `open`;
  if (state === `MERGED`) return `merged`;
  if (state === `CLOSED`) return `closed`;
  return undefined;
}

function hasPendingPullRequestChecks(summary: { ciStatus: string; checks: Array<{ status?: string }> }) {
  return (
    summary.ciStatus === `pending` ||
    summary.checks.some((check) => check.status === `pending`)
  );
}

export {
  buildPullRequestSummaryQuery,
  getActivePullRequestReaders,
  getPullRequestSummaryKey,
  getPullRequestSummaryState,
  hasPendingPullRequestChecks,
};

if (typeof module !== `undefined`)
  module.exports = {
    buildPullRequestSummaryQuery,
    getActivePullRequestReaders,
    getPullRequestSummaryKey,
    getPullRequestSummaryState,
    hasPendingPullRequestChecks,
  };
