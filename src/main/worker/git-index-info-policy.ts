/** Pure projection policy for repository index stat results. */
function projectGitIndexLastModified(mtimeMs: unknown): { lastModified: number } {
  return { lastModified: typeof mtimeMs === `number` && Number.isFinite(mtimeMs) ? mtimeMs : 0 };
}
export { projectGitIndexLastModified };
if (typeof module !== `undefined`) module.exports = { projectGitIndexLastModified };
