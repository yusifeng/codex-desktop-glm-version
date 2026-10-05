/** Pure validation policy for copied host-handoff rollout paths. */

export function isValidCopiedRolloutPath(
  rolloutPath: string,
  handoffsRoot: string,
  pathApi: { basename: (path: string) => string; dirname: (path: string) => string; relative: (from: string, to: string) => string; isAbsolute: (path: string) => boolean; sep: string },
) {
  const relativeDirectory = pathApi.relative(handoffsRoot, pathApi.dirname(rolloutPath));
  return pathApi.basename(rolloutPath) === `rollout.jsonl` &&
    relativeDirectory.length > 0 && relativeDirectory !== `..` &&
    !relativeDirectory.startsWith(`..${pathApi.sep}`) &&
    !pathApi.isAbsolute(relativeDirectory) && !relativeDirectory.includes(pathApi.sep);
}

if (typeof module !== `undefined`) module.exports = { isValidCopiedRolloutPath };
