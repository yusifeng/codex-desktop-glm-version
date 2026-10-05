function stripGitDiffPrefixes(oldPath: string, newPath: string) { return !oldPath.startsWith(`a/`) || !newPath.startsWith(`b/`) ? null : { oldPath: oldPath.slice(2), newPath: newPath.slice(2) }; }
export { stripGitDiffPrefixes };
if (typeof module !== `undefined`) module.exports = { stripGitDiffPrefixes };
