function parseTurnDiffStatus(output: string) {
  let hasTrackedChanges = false; const untrackedPaths: string[] = []; let offset = 0;
  while (offset < output.length) {
    const end = output.indexOf(`\0`, offset);
    if (end === -1 || end < offset + 3) throw Error(`Malformed turn diff status output`);
    const indexStatus = output[offset]; const worktreeStatus = output[offset + 1];
    if (indexStatus === `?` && worktreeStatus === `?`) untrackedPaths.push(output.slice(offset + 3, end));
    else hasTrackedChanges = true;
    offset = end + 1;
  }
  return { hasTrackedChanges, untrackedPaths };
}
export { parseTurnDiffStatus };
if (typeof module !== `undefined`) module.exports = { parseTurnDiffStatus };
