/**
 * Derive the execution user's home directory from a Codex home. The default
 * `<home>/.codex` form resolves to its parent; custom Codex homes are already
 * rooted at the intended home-like directory.
 */
export function homeDirectoryFromCodexHome({
  codexHome,
  path,
}: {
  codexHome: string;
  path: { basename(value: string): string; dirname(value: string): string };
}): string {
  const normalized = codexHome.replace(/[\\/]+$/, "");
  return path.basename(normalized) === ".codex" ? path.dirname(normalized) : normalized;
}
