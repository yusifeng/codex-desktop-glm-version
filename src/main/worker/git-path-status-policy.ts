/** Pure projection of Git porcelain path status output. */

export function parsePathStatusOutput(output: string) {
  const trackedPaths: string[] = [];
  const untrackedPaths: string[] = [];
  const ignoredPaths: string[] = [];
  output.split(`\0`).forEach((entry) => {
    if (entry.length < 4) return;
    if (entry.startsWith(`?? `)) untrackedPaths.push(entry.slice(3));
    else if (entry.startsWith(`!! `)) ignoredPaths.push(entry.slice(3));
    else trackedPaths.push(entry.slice(3));
  });
  return { trackedPaths, untrackedPaths, ignoredPaths };
}

if (typeof module !== `undefined`) module.exports = { parsePathStatusOutput };
