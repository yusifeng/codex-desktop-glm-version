import {
  a as pullRequestRevisionDiffQuery,
  i as pullRequestRevisionCapability,
  n as initializePullRequestRevisionQueries,
  r as pullRequestReviewSnapshotQuery,
  t as createPullRequestRevisionFileLoader,
} from "@rchunk/pull-request-revision-queries-core";

initializePullRequestRevisionQueries();

export {
  createPullRequestRevisionFileLoader,
  pullRequestReviewSnapshotQuery as pullRequestReviewSnapshotQuery$,
  pullRequestRevisionCapability as pullRequestRevisionCapability$,
  pullRequestRevisionDiffQuery as pullRequestRevisionDiffQuery$,
};
