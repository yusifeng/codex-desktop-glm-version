/** Pure destination fetch-target selection policy for host handoff. */

export function buildHandoffFetchTargets(
  destinationDefault: { remote?: string; branch?: string } | null | undefined,
  remotes: string[],
  sourceBranch: string,
) {
  return destinationDefault == null
    ? remotes.map((remote) => ({ remote, branch: sourceBranch }))
    : [destinationDefault];
}

if (typeof module !== `undefined`) module.exports = { buildHandoffFetchTargets };
