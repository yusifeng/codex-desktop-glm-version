function shouldInvalidateGitWorktreeForTurn(input: {
  isSelected: boolean;
  hasUnknownSelectedCommonDir: boolean;
  commonDir: string | null;
  selectedCommonDirs: Set<string>;
}): boolean {
  return input.isSelected || input.hasUnknownSelectedCommonDir || input.commonDir == null || input.selectedCommonDirs.has(input.commonDir);
}

export { shouldInvalidateGitWorktreeForTurn };
if (typeof module !== `undefined`) module.exports = { shouldInvalidateGitWorktreeForTurn };
