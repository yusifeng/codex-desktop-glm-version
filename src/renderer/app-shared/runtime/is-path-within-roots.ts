const CODEX_WORKTREE_ROOT_RE =
  /^(.*\/(?:\.codex|\.codex-workspaces(?:\/instances\/[^/]+)?|OpenAI\/Codex\/workspaces(?:\/instances\/[^/]+)?)\/worktrees)(?:\/|$)/u;
const WINDOWS_CODEX_WORKTREE_ROOT_RE = new RegExp(CODEX_WORKTREE_ROOT_RE.source, "iu");

function isWindowsLikePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/u.test(path) || path.startsWith("//") || path.startsWith("\\\\");
}

function normalizePosixPath(path: string): string {
  const value = path.replaceAll("\\", "/");
  const absolute = value.startsWith("/");
  const segments: string[] = [];
  for (const segment of value.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (segments.length > 0 && segments.at(-1) !== "..") segments.pop();
      else if (!absolute) segments.push(segment);
    } else {
      segments.push(segment);
    }
  }
  const normalized = `${absolute ? "/" : ""}${segments.join("/")}`;
  return normalized || (absolute ? "/" : ".");
}

function normalizeForComparison(path: string): string {
  const normalized = normalizePosixPath(path);
  return isWindowsLikePath(path) ? normalized.toLowerCase() : normalized;
}

function inferredWorktreesRoot(path: string): string | null {
  const normalized = normalizePosixPath(path);
  const pattern = isWindowsLikePath(normalized)
    ? WINDOWS_CODEX_WORKTREE_ROOT_RE
    : CODEX_WORKTREE_ROOT_RE;
  return pattern.exec(normalized)?.[1] ?? null;
}

/**
 * Return whether a path belongs to a Codex-managed worktree root.
 *
 * This preserves the release contract: the second argument is CODEX_HOME, not
 * an array of roots; the optional third argument is a host-provided worktrees
 * directory.
 */
export function isPathWithinRoots(
  path: string | null | undefined,
  codexHome?: string | null,
  worktreesRoot?: string | null,
): boolean {
  if (!path) return false;
  const normalizedPath = normalizeForComparison(path);
  const defaultWorktreesRoot = `${normalizePosixPath(codexHome ?? "/.codex").replace(/\/+$/u, "")}/worktrees`;
  return [worktreesRoot?.trim(), defaultWorktreesRoot, inferredWorktreesRoot(path)].some((root) => {
    if (!root) return false;
    const normalizedRoot = normalizeForComparison(root).replace(/\/+$/u, "");
    return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
  });
}
