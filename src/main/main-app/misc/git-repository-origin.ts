export interface GitRepositoryOrigin {
  host: string;
  owner: string;
  repo: string;
}

type ParseResult =
  | { success: true; value: Omit<GitRepositoryOrigin, "host"> }
  | { success: false };

/** Parse URL and SCP-like git remotes into a stable host/owner/repo identity. */
export function parseRepositoryOrigin(input: string): GitRepositoryOrigin | null {
  const value = input.trim();
  if (!value || /^[a-zA-Z]:[\\/]/.test(value)) return null;
  if (value.includes("://")) {
    const parsed = parseRepositoryUrl(value);
    return parsed.success ? parsed.value : null;
  }
  const parsed = parseScpLikeRepository(value);
  return parsed.success ? parsed.value : null;
}

function parseRepositoryUrl(input: string):
  | { success: true; value: GitRepositoryOrigin }
  | { success: false } {
  try {
    const url = new URL(input);
    if (!url.hostname) return { success: false };
    const path = parseRepositoryPath(
      url.pathname.replace(/^\/+/, "").replace(/\.git$/i, ""),
    );
    return path.success
      ? { success: true, value: { host: url.hostname, ...path.value } }
      : { success: false };
  } catch {
    return { success: false };
  }
}

function parseScpLikeRepository(input: string):
  | { success: true; value: GitRepositoryOrigin }
  | { success: false } {
  if (input.includes("://")) return { success: false };
  const match = /^(?:[^@]+@)?([^:]+):(.+)$/.exec(input);
  if (!match) return { success: false };
  const host = match[1]?.trim();
  const pathValue = match[2]?.trim().replace(/^\/+/, "").replace(/\.git$/i, "");
  if (!host || !pathValue) return { success: false };
  const path = parseRepositoryPath(pathValue);
  return path.success
    ? { success: true, value: { host, ...path.value } }
    : { success: false };
}

function parseRepositoryPath(path: string): ParseResult {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  if (segments.length < 2) return { success: false };
  const repo = segments.at(-1);
  if (!repo) return { success: false };
  const owner = segments.slice(0, -1).join("/");
  return owner ? { success: true, value: { owner, repo } } : { success: false };
}
