/** Pure policy helpers for GitHub pull-request board requests and state. */

const LIST_LIMIT = 10;
const SUMMARY_FIELDS = [`additions`, `baseRefName`, `createdAt`, `deletions`, `headRefName`, `isDraft`, `number`, `state`, `title`, `updatedAt`, `url`];
const STATUS_FIELDS = [`mergeStateStatus`, `mergeable`, `statusCheckRollup`];

function buildPullRequestListArgs({ includePullRequestStatusFields = true, repoArg, searchQuery, state = `all` }: any = {}) {
  const trimmed = searchQuery?.trim() ?? ``;
  const args = [`pr`, `list`, `--state`, state, `--limit`, String(LIST_LIMIT), `--json`, [...SUMMARY_FIELDS, ...(includePullRequestStatusFields ? STATUS_FIELDS : [])].join(`,`)];
  if (searchQuery == null) args.push(`--author`, `@me`);
  else if (trimmed.length > 0) args.push(`--search`, trimmed);
  if (repoArg != null) args.push(`--repo`, repoArg);
  return args;
}

function resolveRepositoryCandidates({ originUrl, upstreamUrl, parseRemoteUrl }: any) {
  const repoArg = (url: string | null | undefined) => {
    if (url == null) return null;
    const parsed = parseRemoteUrl(url);
    return parsed == null ? null : parsed.host === `github.com` ? `${parsed.owner}/${parsed.repo}` : `${parsed.host}/${parsed.owner}/${parsed.repo}`;
  };
  return Array.from(new Set([repoArg(upstreamUrl), repoArg(originUrl)].filter((value) => value != null)));
}

function getBoardState({ canMerge, ciStatus, isDraft }: any) {
  if (isDraft) return `draft`;
  switch (ciStatus) {
    case `failing`: return `failing`;
    case `none`:
    case `passing`:
    case `pending`: return canMerge ? `ready` : `in_progress`;
    default: return `in_progress`;
  }
}

export { LIST_LIMIT, SUMMARY_FIELDS, STATUS_FIELDS, buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState };
if (typeof module !== `undefined`) module.exports = { LIST_LIMIT, SUMMARY_FIELDS, STATUS_FIELDS, buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState };
