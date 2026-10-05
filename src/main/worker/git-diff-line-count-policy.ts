function countGitDiffLines(diff: string) {
  if (diff.includes(`GIT binary patch`) || diff.includes(`Binary files `)) return null;
  let additions = 0; let deletions = 0; let inHunk = false;
  for (const line of diff.split(`\n`)) {
    if (line.startsWith(`diff --git `)) inHunk = false;
    else if (line.startsWith(`@@`)) inHunk = true;
    else if (inHunk && line.startsWith(`+`)) additions += 1;
    else if (inHunk && line.startsWith(`-`)) deletions += 1;
  }
  return { additions, deletions };
}
export { countGitDiffLines };
if (typeof module !== `undefined`) module.exports = { countGitDiffLines };
