/** Pure Git push status parsing and failure classification policy. */

export function extractPushStatus(line: string): string | null {
  const values: string[] = [];
  const bracketed = line.match(/\[([^\]]+)\]/);
  if (bracketed) values.push(bracketed[1]);
  const parenthesized = line.match(/\(([^)]+)\)\s*$/);
  if (parenthesized) values.push(parenthesized[1]);
  const error = line.match(/^error[: ]+(.+)$/i);
  if (error) values.push(error[1]);
  return values.length === 0 ? null : values.join(` `).toLowerCase();
}

export function isPushStatusLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.startsWith(`ok `) || lower.startsWith(`error`)) return true;
  return [`!`, `=`, `+`, `-`, `*`, `?`].includes(line[0]);
}

export function classifyGitPushFailure(stdout: string, stderr: string) {
  const statuses = stdout.split(`\n`).map((value) => value.trim()).filter((line) => line && isPushStatusLine(line));
  for (const line of statuses) {
    const status = extractPushStatus(line);
    if (!status) continue;
    if (status.includes(`non-fast-forward`) || status.includes(`fetch first`) || status.includes(`stale info`)) return `remote-updated`;
    if (status.includes(`remote rejected`) || status.includes(`remote failure`) || status.includes(`pre-receive hook declined`)) return `remote-rejected`;
  }
  const error = stderr.toLowerCase();
  if (error.includes(`no upstream`) || error.includes(`set the remote as upstream`) || error.includes(`has no upstream branch`)) return `no-upstream`;
  if (error.includes(`authentication failed`) || error.includes(`could not read username`) || error.includes(`permission denied`) || error.includes(`access denied`)) return `auth`;
  return `unknown`;
}

if (typeof module !== `undefined`) module.exports = { classifyGitPushFailure, extractPushStatus, isPushStatusLine };
