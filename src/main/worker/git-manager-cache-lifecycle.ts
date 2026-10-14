type GitManagerCacheLifecycleOptions = {
  clearShortLived: (worktree: any) => void;
  getAllWorktrees: () => Iterable<any>;
  getCommonDir: (worktree: any) => string | undefined;
  getHostId: (worktree: any) => string;
  invalidateAllShortLived: () => void;
  invalidateAllUntracked: () => void;
  invalidateUntracked: (worktree: any) => void;
  selectWorktrees: (cwds: string[] | null | undefined, hostId: string) => any[];
  shouldInvalidate: (input: {
    commonDir: string | undefined;
    hasUnknownSelectedCommonDir: boolean;
    isSelected: boolean;
    selectedCommonDirs: Set<string>;
  }) => boolean;
};

class GitManagerCacheLifecycle {
  private readonly options: GitManagerCacheLifecycleOptions;
  private backgroundedSinceLastForeground = false;

  constructor(options: GitManagerCacheLifecycleOptions) {
    this.options = options;
  }

  get hasBackgroundedSinceLastForeground() {
    return this.backgroundedSinceLastForeground;
  }

  handleAppEvent(event: { type: string }) {
    switch (event.type) {
      case `background`:
        this.backgroundedSinceLastForeground = true;
        break;
      case `foreground`:
        if (this.backgroundedSinceLastForeground) this.invalidateAll();
        this.backgroundedSinceLastForeground = false;
        break;
      case `turnComplete`:
        this.invalidateAll();
        break;
    }
  }

  invalidateTurn(cwds: string[] | null | undefined, hostId: string) {
    const selectedWorktrees = this.options.selectWorktrees(cwds, hostId);
    if (selectedWorktrees.length === 0) return;

    const selectedCommonDirs = new Set<string>();
    let hasUnknownSelectedCommonDir = false;
    for (const worktree of selectedWorktrees) {
      this.options.invalidateUntracked(worktree);
      const commonDir = this.options.getCommonDir(worktree);
      if (commonDir == null) hasUnknownSelectedCommonDir = true;
      else selectedCommonDirs.add(commonDir);
    }

    const selected = new Set(selectedWorktrees);
    for (const worktree of this.options.getAllWorktrees()) {
      if (this.options.getHostId(worktree) !== hostId) continue;
      if (this.options.shouldInvalidate({
        commonDir: this.options.getCommonDir(worktree),
        hasUnknownSelectedCommonDir,
        isSelected: selected.has(worktree),
        selectedCommonDirs,
      })) {
        this.options.clearShortLived(worktree);
      }
    }
  }

  private invalidateAll() {
    this.options.invalidateAllUntracked();
    this.options.invalidateAllShortLived();
  }
}

export { GitManagerCacheLifecycle };
if (typeof module !== `undefined`)
  module.exports = { GitManagerCacheLifecycle };
