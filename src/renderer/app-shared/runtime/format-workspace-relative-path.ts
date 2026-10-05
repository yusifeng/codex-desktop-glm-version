/** Format a relative path with an optional workspace-root label. */
export function formatWorkspaceRelativePath(input: { root: string; relativePath: string; includeWorkspaceRootLabel: boolean; normalize: (value: string) => string; rootLabel: (root: string) => string | null }): string {
  const relativePath = input.normalize(input.relativePath);
  if (!input.includeWorkspaceRootLabel) return relativePath;
  const label = input.rootLabel(input.root);
  return label ? (relativePath ? `${label}/${relativePath}` : label) : relativePath;
}
