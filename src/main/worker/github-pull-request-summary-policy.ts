type PullRequestIdentity = { owner: string; repository: string; number: number };

type PullRequestReader = { host: any; signal?: AbortSignal };

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
  getActivePullRequestReaders,
  getPullRequestSummaryKey,
  getPullRequestSummaryState,
  hasPendingPullRequestChecks,
};

if (typeof module !== `undefined`)
  module.exports = {
    getActivePullRequestReaders,
    getPullRequestSummaryKey,
    getPullRequestSummaryState,
    hasPendingPullRequestChecks,
  };
