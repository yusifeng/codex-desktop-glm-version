import {
  By as getPullRequestQueryIdentity,
  Hy as initializePullRequestQueryKey,
  Vy as getPullRequestQueryKey,
} from "@rchunk/app-initial";

initializePullRequestQueryKey();

export { getPullRequestQueryIdentity, getPullRequestQueryKey };
