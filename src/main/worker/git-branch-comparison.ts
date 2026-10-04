type BranchComparisonDependencies = {
  getQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

function parseLeftRightCommitCounts(output: string) {
  const value = output.trim();
  if (!value) return null;
  const fields = value.split(/\s+/);
  if (fields.length < 2) return null;
  const leftAhead = Number.parseInt(fields[0] ?? ``, 10);
  const rightAhead = Number.parseInt(fields[1] ?? ``, 10);
  return !Number.isFinite(leftAhead) || !Number.isFinite(rightAhead)
    ? null
    : { leftAhead, rightAhead };
}

function compareGitBranches(
  repository: any,
  left: string,
  right: string,
  signal: AbortSignal | undefined,
  dependencies: BranchComparisonDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `left-right-commit-counts`,
      left,
      right,
    ),
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-list`, `--left-right`, `--count`, `${left}...${right}`],
        repository.host,
        { allowedNonZeroExitCodes: [128, 1], signal },
      );
      if (!result.success || !result.stdout) return null;
      const counts = parseLeftRightCommitCounts(result.stdout);
      if (!counts) return null;
      let state = `equal`;
      if (counts.leftAhead > 0 && counts.rightAhead > 0) state = `diverged`;
      else if (counts.leftAhead > 0) state = `left-ahead`;
      else if (counts.rightAhead > 0) state = `right-ahead`;
      return { ...counts, state };
    },
    staleTime: dependencies.staleTime,
  });
}

export { compareGitBranches, parseLeftRightCommitCounts };
if (typeof module !== `undefined`)
  module.exports = { compareGitBranches, parseLeftRightCommitCounts };
