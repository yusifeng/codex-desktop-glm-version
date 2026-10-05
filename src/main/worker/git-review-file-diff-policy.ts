/** Pure unified-diff formatting for untracked symlinks and submodules. */

export function buildUntrackedSymlinkDiff(
  path: string,
  target: string,
  oid: string,
  quotePath: (path: string) => string,
) {
  const oldPath = quotePath(`a/${path}`);
  const newPath = quotePath(`b/${path}`);
  const noNewline = target.endsWith(`\n`) ? `` : `\\ No newline at end of file\n`;
  return `diff --git ${oldPath} ${newPath}\nnew file mode 120000\nindex 0000000..${oid.slice(0, 7)}\n--- /dev/null\n+++ ${newPath}\n@@ -0,0 +1 @@\n+${target}${target.endsWith(`\n`) ? `` : `\n`}${noNewline}`;
}

export function buildUntrackedSubmoduleDiff(
  path: string,
  sha: string,
  quotePath: (path: string) => string,
) {
  const oldPath = quotePath(`a/${path}`);
  const newPath = quotePath(`b/${path}`);
  return `diff --git ${oldPath} ${newPath}\nnew file mode 160000\nindex 0000000..${sha.slice(0, 7)}\n--- /dev/null\n+++ ${newPath}\n@@ -0,0 +1 @@\n+Subproject commit ${sha}\n`;
}

if (typeof module !== `undefined`)
  module.exports = { buildUntrackedSubmoduleDiff, buildUntrackedSymlinkDiff };
