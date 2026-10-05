/** Pure parsing policy for Git numstat diff output. */

export const emptyDiffStats = {
  filesChanged: 0,
  linesAdded: 0,
  linesRemoved: 0,
};

export function parseNumstat(output: string) {
  const trimmed = output.trim();
  if (!trimmed) return emptyDiffStats;
  let filesChanged = 0;
  let linesAdded = 0;
  let linesRemoved = 0;
  const parseCount = (value: string) => {
    if (value === `-`) return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  for (const line of trimmed.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const [added, removed, ...path] = row.split(`\t`);
    if (added && removed && path.length !== 0) {
      filesChanged += 1;
      linesAdded += parseCount(added);
      linesRemoved += parseCount(removed);
    }
  }
  return { filesChanged, linesAdded, linesRemoved };
}

if (typeof module !== `undefined`)
  module.exports = { emptyDiffStats, parseNumstat };
