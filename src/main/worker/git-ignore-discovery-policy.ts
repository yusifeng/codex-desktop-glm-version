/** Pure parsing and ordering policy for Git ignore discovery. */
function parseGitConfigurationPathOutput(output: string): string {
  if (!output.endsWith(`\n`) || output.length === 1) throw Error(`Invalid Git configuration path output`);
  return output.slice(0, -1);
}
function sortedIndex(values: string[], target: string): number {
  let low = 0; let high = values.length;
  while (low < high) { const middle = (low + high) >>> 1; if (values[middle] < target) low = middle + 1; else high = middle; }
  return high;
}
export { parseGitConfigurationPathOutput, sortedIndex };
if (typeof module !== `undefined`) module.exports = { parseGitConfigurationPathOutput, sortedIndex };
