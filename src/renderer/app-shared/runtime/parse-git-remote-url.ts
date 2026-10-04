export interface ParsedGitRemote {
  host: string;
  owner: string;
  repo: string;
}

function parseRepositoryPath(pathname: string): { owner: string; repo: string } | null {
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts.length < 2) return null;
  const repo = parts.at(-1);
  const owner = parts.slice(0, -1).join("/");
  return repo && owner ? { owner, repo } : null;
}

/** Parse URL and SCP-style Git remotes (former app-shared `_H`/`rHe`). */
export function parseGitRemoteUrl(value: string): ParsedGitRemote | null {
  const remote = value.trim();
  if (!remote || /^[a-zA-Z]:[\\/]/.test(remote)) return null;
  if (remote.includes("://")) {
    try {
      const url = new URL(remote);
      const repository = parseRepositoryPath(url.pathname.replace(/^\/+/, "").replace(/\.git$/i, ""));
      return url.hostname && repository ? { host: url.hostname, ...repository } : null;
    } catch {
      return null;
    }
  }
  const match = /^(?:[^@]+@)?([^:]+):(.+)$/.exec(remote);
  const host = match?.[1]?.trim();
  const path = match?.[2]?.trim().replace(/^\/+/, "").replace(/\.git$/i, "");
  const repository = path ? parseRepositoryPath(path) : null;
  return host && repository ? { host, ...repository } : null;
}
