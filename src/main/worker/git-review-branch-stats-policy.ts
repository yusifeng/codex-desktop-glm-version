/** Pure repository-operation marker and path construction policy. */

export const REPOSITORY_OPERATION_MARKERS = [
  `MERGE_HEAD`,
  `CHERRY_PICK_HEAD`,
  `REVERT_HEAD`,
  `REBASE_HEAD`,
  `rebase-merge`,
  `rebase-apply`,
  `sequencer`,
];

export function buildRepositoryOperationPaths(
  gitDir: string | null | undefined,
  pathApi: { join: (...parts: string[]) => string },
) {
  if (gitDir == null) return [];
  return [
    pathApi.join(gitDir, `index.lock`),
    ...REPOSITORY_OPERATION_MARKERS.map((marker) => pathApi.join(gitDir, marker)),
  ];
}

if (typeof module !== `undefined`)
  module.exports = { buildRepositoryOperationPaths, REPOSITORY_OPERATION_MARKERS };
