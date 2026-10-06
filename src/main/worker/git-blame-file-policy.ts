/** Pure parsing helpers for `git blame --porcelain` output. */

function parseGitHubAuthorLogin(authorMail: string) {
  const email = authorMail.trim().replace(/^<|>$/g, ``);
  return /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i.exec(email)?.[1] ?? null;
}

export function isGitHubHost(host: string) {
  return host === `github.com` || host.endsWith(`.github.com`);
}

function createBlameLine(header: string, metadataByCommit: Map<string, any>) {
  const [commitSha = ``, , finalLine = ``] = header.split(` `);
  const lineNumber = Number.parseInt(finalLine, 10);
  const metadata = metadataByCommit.get(commitSha);
  return {
    author: metadata?.author ?? null,
    authorLogin: metadata?.authorLogin ?? null,
    authorTime: metadata?.authorTime ?? null,
    commitSha,
    lineNumber: Number.isNaN(lineNumber) ? 0 : lineNumber,
    summary: metadata?.summary ?? null,
  };
}

function parseBlamePorcelain(output: string) {
  const lines: any[] = [];
  const metadataByCommit = new Map<string, any>();
  let current: any = null;
  for (const line of output.split(`\n`)) {
    if (line === ``) continue;
    if (line.startsWith(`\t`)) {
      if (current != null) {
        lines.push(current);
        metadataByCommit.set(current.commitSha, {
          author: current.author,
          authorLogin: current.authorLogin,
          authorTime: current.authorTime,
          summary: current.summary,
        });
        current = null;
      }
      continue;
    }
    if (current == null) {
      current = createBlameLine(line, metadataByCommit);
      continue;
    }
    const separator = line.indexOf(` `);
    const key = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? `` : line.slice(separator + 1);
    if (key === `author`) current.author = value || null;
    else if (key === `author-mail`) current.authorLogin = parseGitHubAuthorLogin(value);
    else if (key === `author-time`) {
      const authorTime = Number.parseInt(value, 10);
      current.authorTime = Number.isNaN(authorTime) ? null : authorTime;
    } else if (key === `summary`) current.summary = value || null;
  }
  return lines;
}

export { createBlameLine, parseBlamePorcelain, parseGitHubAuthorLogin };
if (typeof module !== `undefined`)
  module.exports = { createBlameLine, isGitHubHost, parseBlamePorcelain, parseGitHubAuthorLogin };
