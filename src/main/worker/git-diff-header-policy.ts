function classifyGitDiffHeader(header: string): `combined` | `git` | null {
  if (header.startsWith(`diff --cc `) || header.startsWith(`diff --combined `)) return `combined`;
  return header.startsWith(`diff --git `) ? `git` : null;
}
export { classifyGitDiffHeader };
if (typeof module !== `undefined`) module.exports = { classifyGitDiffHeader };
