/** Pure policy for parsing and recognizing Git partial-clone configuration. */

function parseGitConfigEntries(output: string) {
  const entries = new Map<string, string>();
  for (const line of output.split(`\n`)) {
    const separator = line.indexOf(` `);
    entries.set(
      separator === -1 ? line : line.slice(0, separator),
      separator === -1 ? `` : line.slice(separator + 1),
    );
  }
  return entries;
}

function hasPartialCloneConfiguration(entries: Map<string, string>) {
  return Array.from(entries).some(
    ([key, value]) =>
      key === `extensions.partialclone` ||
      key.endsWith(`.partialclonefilter`) ||
      (key.endsWith(`.promisor`) &&
        [``, `1`, `on`, `true`, `yes`].includes(value.toLowerCase())),
  );
}

export { hasPartialCloneConfiguration, parseGitConfigEntries };
if (typeof module !== `undefined`)
  module.exports = { hasPartialCloneConfiguration, parseGitConfigEntries };
