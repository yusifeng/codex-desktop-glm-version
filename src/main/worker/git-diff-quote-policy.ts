function quoteGitDiffPath(path: string) {
  return /[\\"\n\r\t]/.test(path) ? `"${path.replaceAll(`\\`, `\\\\`).replaceAll(`"`, `\\"`).replaceAll(`\n`, `\\n`).replaceAll(`\r`, `\\r`).replaceAll(`\t`, `\\t`)}"` : path;
}
export { quoteGitDiffPath };
if (typeof module !== `undefined`) module.exports = { quoteGitDiffPath };
