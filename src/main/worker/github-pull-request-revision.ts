type RevisionDependencies = {
  parseSha: (value: unknown) => string;
  parsePath: (value: unknown) => string | null;
  assertAccount: (request: any, host: any) => Promise<void>;
  requestApi: (request: any, host: any, path: string, args: string[], signal?: AbortSignal) => Promise<string>;
};

import { decodeGithubFileContent, encodeGithubContentPath } from "./github-pull-request-revision-policy";

const MAX_FILE_BYTES = 1048576;

class Semaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];
  private readonly limit: number;
  constructor(limit: number) { this.limit = limit; }
  get idle() { return this.active === 0 && this.waiters.length === 0; }
  async acquire() {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active += 1;
    return () => {
      this.active -= 1;
      this.waiters.shift()?.();
    };
  }
}

function createGithubPullRequestRevisionHandlers(deps: RevisionDependencies) {
  const semaphores = new Map<string, Semaphore>();
  const semaphoreFor = (id: string) => {
    let semaphore = semaphores.get(id);
    if (semaphore == null) { semaphore = new Semaphore(2); semaphores.set(id, semaphore); }
    return semaphore;
  };
  const readFile = async (request: any, host: any, path: string | null, revision: string, signal?: AbortSignal) => {
    if (path == null) return ``;
    const encodedPath = encodeGithubContentPath(path);
    const parsed = JSON.parse(await deps.requestApi(request, host, `contents/${encodedPath}?ref=${revision}`, [`-H`, `Accept: application/vnd.github.object+json`], signal));
    return decodeGithubFileContent(parsed);
  };
  return {
    diff: async (request: any, host: any, signal?: AbortSignal) => {
      try {
        const base = deps.parseSha(request.comparison.baseRevision);
        const head = deps.parseSha(request.comparison.headRevision);
        await deps.assertAccount(request, host);
        return { status: `success`, headRevision: head, unifiedDiff: await deps.requestApi(request, host, `compare/${base}...${head}`, [`-H`, `Accept: application/vnd.github.diff`], signal) };
      } catch (error) { return { status: `error`, error: error instanceof Error ? error.message : String(error) }; }
    },
    file: async (request: any, host: any, signal?: AbortSignal) => {
      const semaphore = semaphoreFor(host.id);
      let release: (() => void) | undefined;
      try {
        release = await semaphore.acquire();
        signal?.throwIfAborted();
        const base = deps.parseSha(request.comparison.baseRevision);
        const head = deps.parseSha(request.comparison.headRevision);
        const basePath = deps.parsePath(request.basePath);
        const headPath = deps.parsePath(request.headPath);
        await deps.assertAccount(request, host);
        signal?.throwIfAborted();
        const [baseContent, headContent] = await Promise.all([readFile(request, host, basePath, base, signal), readFile(request, host, headPath, head, signal)]);
        return baseContent == null || headContent == null ? { status: `unavailable` } : { status: `success`, baseContent, headContent };
      } catch (error) { return { status: `error`, error: error instanceof Error ? error.message : String(error) }; }
      finally { release?.(); if (semaphore.idle) semaphores.delete(host.id); }
    },
  };
}

export { MAX_FILE_BYTES, createGithubPullRequestRevisionHandlers };
if (typeof module !== `undefined`) module.exports = { MAX_FILE_BYTES, createGithubPullRequestRevisionHandlers };
