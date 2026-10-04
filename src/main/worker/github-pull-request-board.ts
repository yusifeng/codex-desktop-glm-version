import { LIST_LIMIT, SUMMARY_FIELDS, STATUS_FIELDS, buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState } from "./github-pull-request-board-policy";

type BoardDeps = {
  ensureAuthenticated: (client: any, hostname?: string) => Promise<void>;
  getAppServerClient: (hostId: string) => any;
  getWorktreeRepository: (gitManager: any, cwd: string, client: any) => Promise<any>;
  getRepoRepository: (gitManager: any, cwd: string, client: any) => Promise<any>;
  listPullRequests: (client: any, options: any) => Promise<any[]>;
  parseRemoteUrl: (url: string) => any;
  normalizeChecks: (checks: any[]) => any[];
  summarizeChecks: (checks: any[]) => { checks: any[]; ciStatus: string };
  canMerge: (value: any) => boolean;
  mergeBlocker: (value: any) => any;
  logger?: { warning: (event: string, fields: any) => void };
};

function mapPullRequestBoardItems({ cwd, hostId, items, repo, searchQuery, normalizeChecks, summarizeChecks, canMerge, mergeBlocker }: any) {
  return items.flatMap((item: any) => {
    const isAuthor = searchQuery == null;
    const state = item.state?.toUpperCase();
    if (state !== `OPEN` && state !== `MERGED`) return [];
    if (state === `MERGED`) return [{ additions: item.additions, baseBranch: item.baseRefName, canMerge: false, ciStatus: `none`, createdAt: item.createdAt, cwd, deletions: item.deletions, headBranch: item.headRefName, hostId, isAuthor, mergeBlocker: null, number: item.number, repo: repo ?? undefined, state: `merged`, title: item.title, updatedAt: item.updatedAt, url: item.url }];
    const summary = summarizeChecks(normalizeChecks(item.statusCheckRollup ?? []));
    const mergeable = canMerge({ hasOpenPr: true, isDraft: item.isDraft, mergeStateStatus: item.mergeStateStatus, mergeable: item.mergeable });
    return [{ additions: item.additions, baseBranch: item.baseRefName, canMerge: mergeable, ciStatus: summary.ciStatus, createdAt: item.createdAt, cwd, deletions: item.deletions, headBranch: item.headRefName, hostId, isAuthor, mergeBlocker: mergeBlocker({ mergeStateStatus: item.mergeStateStatus, mergeable: item.mergeable }), number: item.number, repo: repo ?? undefined, state: getBoardState({ canMerge: mergeable, ciStatus: summary.ciStatus, isDraft: item.isDraft }), title: item.title, updatedAt: item.updatedAt, url: item.url }];
  });
}

function createGithubPullRequestBoardHandler(deps: BoardDeps) {
  const list = (client: any, cwd: string, repoArg: string | null, searchQuery: string | null, state = `all`, includePullRequestStatusFields = true) => deps.listPullRequests(client, { args: buildPullRequestListArgs({ includePullRequestStatusFields, repoArg, searchQuery, state }), cwd });
  const loadRepo = async (client: any, cwd: string, repoArg: string | null, searchQuery: string | null) => {
    if (repoArg != null || searchQuery != null) return list(client, cwd, repoArg, searchQuery);
    const [open, merged] = await Promise.all([list(client, cwd, repoArg, null, `open`), list(client, cwd, repoArg, null, `merged`, false)]);
    return [...open, ...merged];
  };
  const one = async (request: any, gitManager: any, client: any) => {
    const { cwd, hostId, repo, searchQuery } = request;
    await deps.ensureAuthenticated(client);
    const repository = await deps.getWorktreeRepository(gitManager, cwd, client);
    if (repository?.root == null) return { error: `No git repository found for pull request board`, status: `error` };
    let items: any[];
    if (repo != null) items = await loadRepo(client, repository.root, repo, searchQuery);
    else {
      const originUrl = await (await deps.getRepoRepository(gitManager, cwd, client))?.getOriginUrl();
      const upstreamUrl = await repository.getConfigValue(`remote.upstream.url`);
      items = [];
      for (const candidate of resolveRepositoryCandidates({ originUrl, upstreamUrl, parseRemoteUrl: deps.parseRemoteUrl })) {
        items = await loadRepo(client, repository.root, candidate, searchQuery);
        if (items.length > 0) break;
      }
    }
    return { items: mapPullRequestBoardItems({ cwd, hostId, items, repo, searchQuery, ...deps }), status: `success` };
  };
  return async (request: any, gitManager: any) => {
    if (Array.isArray(request.repos)) {
      const results = await Promise.all(request.repos.map((repo: any) => one({ ...repo, searchQuery: request.searchQuery }, gitManager, deps.getAppServerClient(repo.hostId))));
      return results.some((result) => result.status === `success`) ? { items: results.flatMap((result) => result.status === `success` ? result.items : []), status: `success` } : (results[0] ?? { items: [], status: `success` });
    }
    try { return await one(request, gitManager, deps.getAppServerClient(request.hostId)); }
    catch (error) { deps.logger?.warning(`gh.pr.board.failed`, { safe: { hasPreferredRepo: request.repo != null }, sensitive: { error } }); return { error: error instanceof Error ? error.message : String(error), status: `error` }; }
  };
}

export { LIST_LIMIT, SUMMARY_FIELDS, STATUS_FIELDS, buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState, mapPullRequestBoardItems, createGithubPullRequestBoardHandler };
if (typeof module !== `undefined`) module.exports = { LIST_LIMIT, SUMMARY_FIELDS, STATUS_FIELDS, buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState, mapPullRequestBoardItems, createGithubPullRequestBoardHandler };
