function basename(path: string): string {
  const normalized = path.replace(/[\\/]+$/u, "");
  const separator = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}

/** Resolve the deepest matching skill root to a display label. */
export function resolveSkillRepoLabel(input: { skillPath: string; roots: string[]; fallbackLabel?: string }): string | undefined {
  const root = input.roots.reduce<string | null>((match, candidate) => input.skillPath.startsWith(candidate) && (!match || candidate.length > match.length) ? candidate : match, null);
  if (!root) return input.fallbackLabel;
  return basename(root) || input.fallbackLabel;
}
