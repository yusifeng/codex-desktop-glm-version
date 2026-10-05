type BranchComparisonDependencies = {
  getQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

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
      return { ...counts, state: classifyBranchComparison(counts) };
    },
    staleTime: dependencies.staleTime,
  });
}

export { compareGitBranches, parseLeftRightCommitCounts };
if (typeof module !== `undefined`)
  module.exports = { compareGitBranches, parseLeftRightCommitCounts };
import { classifyBranchComparison, parseLeftRightCommitCounts } from "./git-branch-comparison-policy";
