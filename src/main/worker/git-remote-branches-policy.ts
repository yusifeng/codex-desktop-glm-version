/** Pure parsing and ordering policy for Git remote branch discovery. */

export function parseRemoteHeadBranch(stdout: unknown, remote: string): string | null {
  if (typeof stdout !== "string" || stdout.length === 0) return null;
  const prefix = `refs/remotes/${remote}/`;
  return stdout.startsWith(prefix) ? stdout.slice(prefix.length) || null : null;
}

export function parseRemoteShowDefaultBranch(stdout: unknown): string | null {
  if (typeof stdout !== "string" || stdout.length === 0) return null;
  const branch = /HEAD branch:\s*(.+)/.exec(stdout)?.[1]?.trim() ?? null;
  return branch && branch !== `(unknown)` ? branch : null;
}

export function parseRemoteNames(stdout: unknown, defaultRemote = `origin`): string[] {
  if (typeof stdout !== "string" || stdout.length === 0) return [];
  const remotes = stdout
    .split(`\n`)
    .map((remote) => remote.trim())
    .filter((remote) => remote.length > 0);
  return remotes.includes(defaultRemote) && remotes.length > 1
    ? [defaultRemote, ...remotes.filter((remote) => remote !== defaultRemote)]
    : remotes;
}

export function selectConventionalBranch(mainAvailable: boolean, masterAvailable: boolean): string | null {
  if (mainAvailable) return `main`;
  if (masterAvailable) return `master`;
  return null;
}

if (typeof module !== `undefined`)
  module.exports = {
    parseRemoteHeadBranch,
    parseRemoteShowDefaultBranch,
    parseRemoteNames,
    selectConventionalBranch,
  };
