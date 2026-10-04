type PullRequest = { owner: string; repository: string; number: number };
type SummaryDeps = {
  runGraphql: (args: string[], options: any) => Promise<any>;
  parseResponse: (text: string) => any;
  normalizeChecks: (checks: any[]) => any[];
  summarizeChecks: (checks: any[]) => { checks: any[]; ciStatus: string };
  canMerge: (value: any) => boolean;
  mergeBlocker: (value: any) => any;
  parseRemoteUrl: (url: string) => any;
  warn: (message: string, error: unknown) => void;
  setTimeout?: typeof setTimeout;
};

const BATCH_SIZE = 60;
const MAX_CHECK_PAGES = 20;
const GRAPHQL_TIMEOUT_MS = 15_000;

class PullRequestSummaryBatcher {
  private readonly account: any;
  private readonly deps: SummaryDeps;
  private readonly pending = new Map<string, { pullRequest: PullRequest; promise: Promise<any>; resolve: (value: any) => void; readers: Array<{ host: any; signal?: AbortSignal }> }>();
  private running = false;
  private readonly onIdle: () => void;

  constructor(account: any, deps: SummaryDeps, onIdle: () => void) {
    this.account = account;
    this.deps = deps;
    this.onIdle = onIdle;
  }

  read(pullRequest: PullRequest, host: any, signal?: AbortSignal): Promise<any> {
    signal?.throwIfAborted();
    const key = JSON.stringify([pullRequest.owner.toLowerCase(), pullRequest.repository.toLowerCase(), pullRequest.number]);
    let entry = this.pending.get(key);
    if (entry == null) {
      let resolve!: (value: any) => void;
      const promise = new Promise<any>((r) => { resolve = r; });
      entry = { pullRequest, promise, resolve, readers: [] };
      this.pending.set(key, entry);
    }
    entry.readers.push({ host, signal });
    if (!this.running) {
      this.running = true;
      (this.deps.setTimeout ?? setTimeout)(() => void this.flush(), 50);
    }
    return entry.promise;
  }

  async flush(): Promise<void> {
    for (; this.pending.size > 0;) {
      const batch = [...this.pending.entries()].slice(0, BATCH_SIZE);
      for (const [key] of batch) this.pending.delete(key);
      const active = batch.filter(([, e]) => e.readers.some(({ signal }) => !signal?.aborted));
      const host = active[0]?.[1].readers.find(({ signal }) => !signal?.aborted)?.host;
      let results: any[] = [];
      try {
        if (host != null) {
          results = await this.fetchBatch(host, active.map(([, e]) => e.pullRequest), () =>
            active.some(([, e]) => e.readers.some(({ signal }) => !signal?.aborted)),
          );
        }
      } catch (error) {
        this.deps.warn(`Pull request summary batch failed`, error);
      }
      const resultByKey = new Map(batch.map(([key], index) => [key, results[index]]));
      for (const [key, entry] of batch) entry.resolve(resultByKey.get(key) ?? { status: `unavailable` });
    }
    this.running = false;
    this.onIdle();
  }

  private async fetchBatch(host: any, requests: PullRequest[], shouldContinue: () => boolean): Promise<any[]> {
    const output: any[] = requests.map(() => ({ status: `unavailable` }));
    let pages = requests.map((pullRequest, index) => ({ pullRequest, index, cursor: null as string | null, headRevision: null as string | null, checks: [] as any[] }));
    for (let page = 0; pages.length > 0 && page < MAX_CHECK_PAGES && shouldContinue(); page++) {
      const query = `query { viewer { login } ${pages.map(({ pullRequest, index, cursor }) => `p${index}: repository(owner:${JSON.stringify(pullRequest.owner)},name:${JSON.stringify(pullRequest.repository)}) { pullRequest(number:${pullRequest.number}) { number url title baseRefName headRefName state isDraft mergeable mergeStateStatus headRefOid headRepository { url } commits(last:1) { nodes { commit { oid statusCheckRollup { contexts(first:100,after:${JSON.stringify(cursor)}) { nodes { __typename ... on CheckRun { name status conclusion startedAt completedAt detailsUrl checkSuite { workflowRun { event workflow { name } } } } ... on StatusContext { context state createdAt description targetUrl } } pageInfo { hasNextPage endCursor } } } } } } } }`).join(` `)} }`;
      const response = await this.deps.runGraphql([`api`, `graphql`, `--hostname`, host.hostname, `-f`, `query=${query}`], { appServerClient: host, timeoutMs: GRAPHQL_TIMEOUT_MS });
      let parsed: any;
      try { parsed = this.deps.parseResponse(response.stdout || `{}`); } catch { return output; }
      const viewer = parsed?.data?.viewer;
      if (viewer?.login == null || viewer.login.toLowerCase() !== this.account.login.toLowerCase()) return output;
      const errors = parsed.errors;
      const next: typeof pages = [];
      for (const state of pages) {
        if (errors?.some((error: any) => error.path == null || error.path[0] === `p${state.index}`)) continue;
        const pr = parsed.data?.[`p${state.index}`]?.pullRequest;
        if (pr == null) { output[state.index] = { status: `not-found` }; continue; }
        const commit = pr.commits?.nodes?.[0]?.commit;
        if (pr.number !== state.pullRequest.number || commit?.oid !== pr.headRefOid || (state.headRevision != null && state.headRevision !== pr.headRefOid)) continue;
        const contexts = commit.statusCheckRollup?.contexts;
        const checks = [...state.checks, ...(contexts?.nodes ?? [])];
        if (pr.state === `OPEN` && contexts?.pageInfo?.hasNextPage) {
          if (contexts.pageInfo.endCursor != null && contexts.pageInfo.endCursor !== state.cursor) next.push({ ...state, checks, cursor: contexts.pageInfo.endCursor, headRevision: pr.headRefOid });
          continue;
        }
        const open = pr.state === `OPEN`;
        const summary = this.deps.summarizeChecks(this.deps.normalizeChecks(open ? checks : []));
        output[state.index] = { status: `success`, baseBranch: pr.baseRefName, canMerge: this.deps.canMerge({ ...pr, hasOpenPr: open }), checks: summary.checks, checksComplete: true, ciStatus: summary.ciStatus, headBranch: pr.headRefName, hasOpenPr: open, hasPendingChecks: summary.ciStatus === `pending` || summary.checks.some((check: any) => check.status === `pending`), headRepository: pr.headRepository == null ? null : this.deps.parseRemoteUrl(pr.headRepository.url), headRevision: pr.headRefOid, isDraft: pr.isDraft, mergeBlocker: open ? this.deps.mergeBlocker(pr) : null, state: ({ OPEN: `open`, MERGED: `merged`, CLOSED: `closed` } as any)[pr.state], title: pr.title, url: pr.url };
      }
      pages = next;
    }
    return output;
  }
}

function createGitHubPullRequestSummaryHandler(deps: SummaryDeps) {
  const cache = new Map<string, PullRequestSummaryBatcher>();
  return (request: any, host: any, signal?: AbortSignal) => {
    const key = JSON.stringify([host.id, request.account.hostname.toLowerCase(), request.account.login.toLowerCase()]);
    let batcher = cache.get(key);
    batcher ??= new PullRequestSummaryBatcher(request.account, deps, () => cache.delete(key));
    cache.set(key, batcher);
    return batcher.read(request.pullRequest, host, signal);
  };
}

export { PullRequestSummaryBatcher, createGitHubPullRequestSummaryHandler };
if (typeof module !== `undefined`) module.exports = { PullRequestSummaryBatcher, createGitHubPullRequestSummaryHandler };
