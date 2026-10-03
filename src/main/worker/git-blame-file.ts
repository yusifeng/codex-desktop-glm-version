const BLAME_TIMEOUT_MS = 30_000;
const BLAME_MAX_OUTPUT_BYTES = 20_971_520;
const BLAME_CACHE_MS = 250;
const NO_LAZY_FETCH_ENV = { GIT_NO_LAZY_FETCH: `1` };

type BlameDependencies = {
  getQueryMeta: () => any;
  parseRemoteUrl: (url: string) => any;
  queryKey: (...parts: any[]) => any;
  resolveGitPath: (platformPath: any, root: string, cwd: string, path: string) => string;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

function parseGitHubAuthorLogin(authorMail: string) {
  const email = authorMail.trim().replace(/^<|>$/g, ``);
  return /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i.exec(email)?.[1] ?? null;
}

function createBlameLine(header: string, metadataByCommit: Map<string, any>) {
  const [commitSha = ``, , finalLine = ``] = header.split(` `);
  const lineNumber = Number.parseInt(finalLine, 10);
  const metadata = metadataByCommit.get(commitSha);
  return {
    author: metadata?.author ?? null,
    authorLogin: metadata?.authorLogin ?? null,
    authorTime: metadata?.authorTime ?? null,
    commitSha,
    lineNumber: Number.isNaN(lineNumber) ? 0 : lineNumber,
    summary: metadata?.summary ?? null,
  };
}

function parseBlamePorcelain(output: string) {
  const lines: any[] = [];
  const metadataByCommit = new Map<string, any>();
  let current: any = null;
  for (const line of output.split(`\n`)) {
    if (line === ``) continue;
    if (line.startsWith(`\t`)) {
      if (current != null) {
        lines.push(current);
        metadataByCommit.set(current.commitSha, {
          author: current.author,
          authorLogin: current.authorLogin,
          authorTime: current.authorTime,
          summary: current.summary,
        });
        current = null;
      }
      continue;
    }
    if (current == null) {
      current = createBlameLine(line, metadataByCommit);
      continue;
    }
    const separator = line.indexOf(` `);
    const key = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? `` : line.slice(separator + 1);
    if (key === `author`) current.author = value || null;
    else if (key === `author-mail`) current.authorLogin = parseGitHubAuthorLogin(value);
    else if (key === `author-time`) {
      const authorTime = Number.parseInt(value, 10);
      current.authorTime = Number.isNaN(authorTime) ? null : authorTime;
    } else if (key === `summary`) current.summary = value || null;
  }
  return lines;
}

function queryBlameFile(
  repository: any,
  path: string,
  signal: AbortSignal,
  dependencies: BlameDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `blame-file`, path),
    gcTime: BLAME_CACHE_MS,
    meta: dependencies.getQueryMeta(),
    queryFn: () => dependencies.runGit(
      repository.root,
      [`blame`, `--porcelain`, `--`, path],
      repository.host,
      {
        env: NO_LAZY_FETCH_ENV,
        maxOutputBytes: BLAME_MAX_OUTPUT_BYTES,
        signal,
        timeoutMs: BLAME_TIMEOUT_MS,
        trim: false,
      },
    ),
    staleTime: BLAME_CACHE_MS,
  });
}

function isGitHubHost(host: string) {
  return host === `github.com` || host.endsWith(`.github.com`);
}

async function getRepositoryWebUrl(
  gitManager: any,
  cwd: string,
  host: any,
  signal: AbortSignal,
  dependencies: BlameDependencies,
) {
  try {
    const origin = await (await gitManager.getRepoRepository(cwd, host))?.getOriginUrl(signal);
    if (origin == null) return null;
    const parsed = dependencies.parseRemoteUrl(origin);
    return parsed == null || !isGitHubHost(parsed.host)
      ? null
      : `https://${parsed.host}/${parsed.owner}/${parsed.repo}`;
  } catch {
    return null;
  }
}

async function blameFile(
  gitManager: any,
  { cwd, path }: { cwd: string; path: string },
  host: any,
  signal: AbortSignal,
  dependencies: BlameDependencies,
) {
  try {
    const metadata = await gitManager.getStableMetadata(cwd, host);
    if (metadata == null) return { type: `error`, error: { type: `unknown` } };
    const platformPath = await host.platformPath();
    const repositoryPath = dependencies.resolveGitPath(
      platformPath,
      metadata.root,
      cwd,
      path,
    );
    if (platformPath.isAbsolute(repositoryPath) ||
        repositoryPath === `..` ||
        repositoryPath.startsWith(`../`) ||
        repositoryPath.startsWith(`..\\`))
      return { type: `error`, error: { type: `not-found` } };
    const [result, repositoryWebUrl] = await Promise.all([
      queryBlameFile(
        gitManager.getWorktreeRepositoryForRoot(metadata.root, host),
        repositoryPath,
        signal,
        dependencies,
      ),
      getRepositoryWebUrl(gitManager, cwd, host, signal, dependencies),
    ]);
    return result.code === 0
      ? result.outputLimitExceeded == null
        ? {
            type: `success`,
            lines: parseBlamePorcelain(result.stdout),
            repositoryWebUrl,
          }
        : { type: `error`, error: { type: `unknown` } }
      : {
          type: `error`,
          error: { type: result.code === 128 ? `not-found` : `unknown` },
        };
  } catch {
    return { type: `error`, error: { type: `unknown` } };
  }
}

export { blameFile, getRepositoryWebUrl, parseBlamePorcelain, parseGitHubAuthorLogin };
if (typeof module !== `undefined`)
  module.exports = { blameFile, getRepositoryWebUrl, parseBlamePorcelain, parseGitHubAuthorLogin };
