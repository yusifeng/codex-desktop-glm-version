/** Pure policy for recent branch limits and Git output projection. */

export const MAX_RECENT_BRANCHES = 100;

export function normalizeRecentBranchLimit(limit: number) {
  return Math.max(1, Math.min(limit, MAX_RECENT_BRANCHES));
}

export function parseRecentBranchOutput(stdout: string) {
  return stdout
    .split(`\n`)
    .map((branch) => branch.trim())
    .filter((branch) => branch.length > 0);
}

export function buildRecentBranchArgs() {
  return [
    `for-each-ref`,
    `--count=${MAX_RECENT_BRANCHES}`,
    `--sort=-committerdate`,
    `refs/heads`,
    `--format=%(refname:short)`,
  ];
}

if (typeof module !== `undefined`)
  module.exports = {
    buildRecentBranchArgs,
    MAX_RECENT_BRANCHES,
    normalizeRecentBranchLimit,
    parseRecentBranchOutput,
  };
