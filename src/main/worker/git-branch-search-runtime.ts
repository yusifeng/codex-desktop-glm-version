import {
  buildGitBranchSearchRefPatterns,
  gitBranchNameFromRef,
  normalizeGitBranchSearchText,
  parseGitBranchSearchRef,
  stripGitRemoteRefPrefix,
} from "./git-branch-search";

type BranchSearchDependencies = {
  queryKey: (...parts: any[]) => any;
  queryMeta: () => any;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
};

async function scanGitBranchRefs(params: any, deps: BranchSearchDependencies) {
  const seen = new Set<string>();
  const branches: string[] = [];
  const patterns = buildGitBranchSearchRefPatterns(
    params.refPattern,
    params.terms,
  );
  const controller = new AbortController();
  let abortSource: `parent` | `limit` | null = null;
  let remainder = ``;
  const decoder = new TextDecoder();
  const abortFromParent = () => {
    if (!controller.signal.aborted) {
      abortSource = `parent`;
      controller.abort();
    }
  };
  if (params.signal?.aborted) abortFromParent();
  else params.signal?.addEventListener(`abort`, abortFromParent);

  const accept = (line: string) => {
    if (branches.length >= params.boundedLimit) return;
    const branch = parseGitBranchSearchRef(
      line.trim(),
      params.preserveRemoteRefs,
    );
    if (
      branch == null ||
      seen.has(branch) ||
      params.excludedBranchNames?.has(gitBranchNameFromRef(branch))
    ) {
      return;
    }
    const searchable = normalizeGitBranchSearchText(
      stripGitRemoteRefPrefix(branch),
    );
    if (params.terms.every((term: string) => searchable.includes(term))) {
      seen.add(branch);
      branches.push(branch);
      if (branches.length >= params.boundedLimit) {
        abortSource = `limit`;
        controller.abort();
      }
    }
  };

  let success = false;
  try {
    ({ success } = await deps.runGit(
      params.worktreeRepo.root,
      [
        `for-each-ref`,
        `--sort=-committerdate`,
        ...patterns,
        `--format=%(refname)`,
      ],
      params.worktreeRepo.host,
      {
        signal: controller.signal,
        collectOutput: false,
        onStdoutRaw: (chunk: Uint8Array) => {
          const lines =
            `${remainder}${decoder.decode(chunk, { stream: true })}`.split(
              `\n`,
            );
          remainder = lines.pop() ?? ``;
          for (const line of lines) accept(line);
        },
      },
    ));
  } finally {
    params.signal?.removeEventListener(`abort`, abortFromParent);
  }
  remainder += decoder.decode();
  if (abortSource === `parent`) {
    const error = Error(`The operation was aborted`);
    error.name = `AbortError`;
    throw params.signal?.reason ?? error;
  }
  if (!success && abortSource !== `limit`) return [];
  if (remainder.length > 0) accept(remainder);
  return branches;
}

function queryGitBranchRefs(params: any, deps: BranchSearchDependencies) {
  return params.worktreeRepo.queryClient.fetchQuery({
    queryKey: deps.queryKey(
      params.worktreeRepo.root,
      params.worktreeRepo.host,
      `branch-search`,
      params.refPattern,
      params.terms,
      String(params.boundedLimit),
      String(params.preserveRemoteRefs),
    ),
    gcTime: 250,
    meta: deps.queryMeta(),
    queryFn: () => scanGitBranchRefs(params, deps),
    staleTime: 250,
  });
}

async function searchGitBranches(params: any, deps: BranchSearchDependencies) {
  const boundedLimit = Math.max(1, Math.min(params.limit, 20));
  const terms = normalizeGitBranchSearchText(params.query)
    .split(` `)
    .filter((term) => term.length > 0);
  if (terms.length === 0) return { branches: [], remoteBranchRefs: [] };
  const branches = await queryGitBranchRefs(
    {
      boundedLimit,
      preserveRemoteRefs: false,
      refPattern: `refs/heads`,
      signal: params.signal,
      terms,
      worktreeRepo: params.worktreeRepo,
    },
    deps,
  );
  if (branches.length >= boundedLimit || params.signal?.aborted) {
    return { branches, remoteBranchRefs: [] };
  }
  const remoteBranches = await queryGitBranchRefs(
    {
      boundedLimit: boundedLimit - branches.length,
      excludedBranchNames: new Set(branches),
      preserveRemoteRefs: params.preserveRemoteRefs ?? false,
      refPattern: `refs/remotes`,
      signal: params.signal,
      terms,
      worktreeRepo: params.worktreeRepo,
    },
    deps,
  );
  return params.preserveRemoteRefs
    ? { branches, remoteBranchRefs: remoteBranches }
    : { branches: [...branches, ...remoteBranches], remoteBranchRefs: [] };
}

export { queryGitBranchRefs, scanGitBranchRefs, searchGitBranches };
if (typeof module !== `undefined`)
  module.exports = {
    queryGitBranchRefs,
    scanGitBranchRefs,
    searchGitBranches,
  };
