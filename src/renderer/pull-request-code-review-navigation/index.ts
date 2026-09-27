import {
  n as initializePullRequestCodeReviewNavigation,
  r as requestPullRequestCodeLocation,
  t as getPullRequestCodeFileId,
} from "@rchunk/pull-request-code-review-navigation-core";

initializePullRequestCodeReviewNavigation();

export { getPullRequestCodeFileId, requestPullRequestCodeLocation };
