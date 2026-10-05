/** Pure review commit output parsing and query limits. */

export const MAX_REVIEW_COMMITS = 100;
export const MAX_REVIEW_COMMIT_OUTPUT_BYTES = 2_097_152;

export function parseReviewCommitLineCounts(output: string, normalizeCommitSha: ((sha: string) => string) | { normalizeCommitSha: (sha: string) => string }) {
  const normalize = typeof normalizeCommitSha === `function` ? normalizeCommitSha : normalizeCommitSha.normalizeCommitSha;
  return output.split(`\x1e`).flatMap((record) => {
    const [sha, ...lines] = record.trim().split(/\r?\n/);
    if (!sha) return [];
    let additions: number | null = 0;
    let deletions: number | null = 0;
    for (const line of lines) {
      if (line.length === 0) continue;
      const [added, deleted, path] = line.split(`\t`);
      const addedCount = Number(added), deletedCount = Number(deleted);
      if (added == null || deleted == null || path == null || added === `-` || deleted === `-` || !Number.isSafeInteger(addedCount) || !Number.isSafeInteger(deletedCount)) {
        additions = null; deletions = null; break;
      }
      additions += addedCount; deletions += deletedCount;
    }
    return [{ additions, deletions, sha: normalize(sha) }];
  });
}

export function parseBranchCommits(output: string, normalizeCommitSha: ((sha: string) => string) | { normalizeCommitSha: (sha: string) => string }) {
  const normalize = typeof normalizeCommitSha === `function` ? normalizeCommitSha : normalizeCommitSha.normalizeCommitSha;
  return output.split(`\x1e`).map((record) => {
    const [sha, committedAt, subject, message] = record.trim().split(`\0`);
    return !sha || !committedAt || subject == null || message == null ? null : { committedAt, message, sha: normalize(sha), subject };
  }).filter((commit) => commit != null);
}

if (typeof module !== `undefined`) module.exports = { MAX_REVIEW_COMMITS, MAX_REVIEW_COMMIT_OUTPUT_BYTES, parseBranchCommits, parseReviewCommitLineCounts };
