/** Pure parsing policy for Git porcelain status summaries. */

export function parseTrackedStatus(output: string) {
  let stagedCount = 0;
  let unstagedCount = 0;
  const stagedRenames: Array<{ path: string; previousPath: string }> = [];
  const trackedPaths: string[] = [];
  let offset = 0;
  while (offset < output.length && offset + 1 < output.length) {
    const staged = output[offset];
    const unstaged = output[offset + 1];
    const end = output.indexOf(`\0`, offset);
    if (end === -1) break;
    const path = output.slice(offset + 3, end);
    offset = end + 1;
    if (staged === `?` && unstaged === `?`) continue;
    if (staged !== ` `) stagedCount += 1;
    if (unstaged !== ` `) unstagedCount += 1;
    trackedPaths.push(path);
    if (
      staged === `R` ||
      staged === `C` ||
      unstaged === `R` ||
      unstaged === `C`
    ) {
      const renameEnd = output.indexOf(`\0`, offset);
      if (renameEnd === -1) break;
      const previousPath = output.slice(offset, renameEnd);
      if (staged === `R`) stagedRenames.push({ path, previousPath });
      trackedPaths.push(previousPath);
      offset = renameEnd + 1;
    }
  }
  return {
    type: `success`,
    stagedCount,
    stagedRenames,
    trackedPaths,
    unstagedCount,
    untrackedCount: null,
  };
}

if (typeof module !== `undefined`) module.exports = { parseTrackedStatus };
