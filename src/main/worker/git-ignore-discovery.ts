const MAX_GIT_CONFIG_OUTPUT_BYTES = 1024 * 1024;
const GIT_IGNORE_CONFIG_PATTERN = `^(core\\.excludesfile|include(if\\..*)?\\.path)$`;

type GitCommandResult = {
  success: boolean;
  code: number;
  stdout: string;
};

type GitRepository = {
  root: string;
  host: {
    platformPath: () => Promise<PlatformPath>;
  };
};

type PlatformPath = {
  sep: string;
  dirname: (path: string) => string;
  isAbsolute: (path: string) => boolean;
  join: (...paths: string[]) => string;
};

type RunGit = (
  cwd: string,
  args: string[],
  host: GitRepository[`host`],
  options: Record<string, unknown>,
) => Promise<GitCommandResult>;

type GitIgnoreEnvironment = {
  defaultExcludesFile: string | null;
  globalConfigFiles: string[];
};

type PathStatusResult = {
  success: boolean;
  ignoredPaths: string[];
};

type TrackedPathsResult = {
  success: boolean;
  paths: string[];
};

async function discoverGitIgnoreConfigurationFiles(
  repository: GitRepository,
  { defaultExcludesFile, globalConfigFiles }: GitIgnoreEnvironment,
  { runGit }: { runGit: RunGit },
): Promise<{ ignoreFile: string | null; configFiles: string[] }> {
  const systemConfig = await runGit(repository.root, [`var`, `GIT_CONFIG_SYSTEM`], repository.host, {
    trim: false,
    allowedNonZeroExitCodes: [1, 129],
    maxOutputBytes: MAX_GIT_CONFIG_OUTPUT_BYTES,
    timeoutMs: 60000,
  });
  if (!systemConfig.success) throw Error(`Failed to discover Git ignore configuration files`);

  const [ignoreConfig, localConfig, worktreeConfig, configOrigins, pathApi] = await Promise.all([
    runGit(
      repository.root,
      [`config`, `--includes`, `--null`, `--show-origin`, `--path`, `--get-regexp`, GIT_IGNORE_CONFIG_PATTERN],
      repository.host,
      {
        trim: false,
        allowedNonZeroExitCodes: [1],
        maxOutputBytes: MAX_GIT_CONFIG_OUTPUT_BYTES,
        env: { GIT_CONFIG: undefined },
      },
    ),
    runGit(repository.root, [`rev-parse`, `--git-path`, `config`], repository.host, {
      trim: false,
      maxOutputBytes: MAX_GIT_CONFIG_OUTPUT_BYTES,
    }),
    runGit(repository.root, [`rev-parse`, `--git-path`, `config.worktree`], repository.host, {
      trim: false,
      maxOutputBytes: MAX_GIT_CONFIG_OUTPUT_BYTES,
    }),
    systemConfig.code === 129
      ? runGit(
          repository.root,
          [`config`, `--includes`, `--null`, `--show-origin`, `--name-only`, `--list`],
          repository.host,
          {
            trim: false,
            maxOutputBytes: MAX_GIT_CONFIG_OUTPUT_BYTES,
            env: { GIT_CONFIG: undefined },
          },
        )
      : null,
    repository.host.platformPath(),
  ]);

  if (
    !ignoreConfig.success ||
    !localConfig.success ||
    !worktreeConfig.success ||
    (configOrigins != null && !configOrigins.success)
  ) {
    throw Error(`Failed to discover Git ignore configuration files`);
  }

  const resolvePath = (path: string, base = repository.root) =>
    pathApi.isAbsolute(path) ? path : `${base}${base.endsWith(pathApi.sep) ? `` : pathApi.sep}${path}`;
  const configFiles = new Set(
    [
      ...globalConfigFiles,
      ...(systemConfig.code === 0 && systemConfig.stdout !== `\n`
        ? [parseGitConfigurationPathOutput(systemConfig.stdout)]
        : []),
      parseGitConfigurationPathOutput(localConfig.stdout),
      parseGitConfigurationPathOutput(worktreeConfig.stdout),
    ].map((path) => resolvePath(path)),
  );

  if (configOrigins != null) {
    configFiles.add(`/etc/gitconfig`);
    const fields = configOrigins.stdout.split(`\0`);
    if (fields.pop() !== `` || fields.length % 2 !== 0) {
      throw Error(`Invalid Git configuration origin output`);
    }
    for (let index = 0; index < fields.length; index += 2) {
      const origin = fields[index];
      if (origin?.startsWith(`file:`)) configFiles.add(resolvePath(origin.slice(5)));
    }
  }

  let ignoreFile = defaultExcludesFile == null ? null : resolvePath(defaultExcludesFile);
  const fields = ignoreConfig.stdout.split(`\0`);
  if (fields.pop() !== `` || fields.length % 2 !== 0) {
    throw Error(`Invalid Git ignore configuration output`);
  }
  for (let index = 0; index < fields.length; index += 2) {
    const origin = fields[index];
    const entry = fields[index + 1];
    if (origin == null || entry == null || !entry.includes(`\n`)) {
      throw Error(`Invalid Git ignore configuration output`);
    }
    const separator = entry.indexOf(`\n`);
    const name = entry.slice(0, separator);
    const value = entry.slice(separator + 1);
    const originFile = origin.startsWith(`file:`) ? resolvePath(origin.slice(5)) : null;
    if (originFile != null) configFiles.add(originFile);
    if (name === `core.excludesfile`) {
      ignoreFile = value === `` ? null : resolvePath(value);
    } else if (value !== ``) {
      configFiles.add(resolvePath(value, originFile == null ? repository.root : pathApi.dirname(originFile)));
    }
  }

  return { ignoreFile, configFiles: [...configFiles].sort() };
}

async function readGitWatcherIgnoredDirectories(
  repository: GitRepository,
  {
    readPathStatus,
    readTrackedPaths,
  }: {
    readPathStatus: (repository: GitRepository, paths: string[]) => Promise<PathStatusResult>;
    readTrackedPaths: (repository: GitRepository, paths: string[]) => Promise<TrackedPathsResult>;
  },
): Promise<string[]> {
  const [status, trackedResult, pathApi] = await Promise.all([
    readPathStatus(repository, []),
    readTrackedPaths(repository, []),
    repository.host.platformPath(),
  ]);
  if (!status.success || !trackedResult.success) {
    throw Error(`Failed to read Git watcher ignored directories`);
  }

  const trackedPaths = [...trackedResult.paths].sort();
  return status.ignoredPaths
    .filter((path) => path.endsWith(`/`))
    .map((path) => path.slice(0, -1))
    .filter((path) => {
      const descendantPrefix = `${path}/`;
      if (trackedPaths[sortedIndex(trackedPaths, descendantPrefix)]?.startsWith(descendantPrefix)) {
        return false;
      }
      let ancestor = path;
      while (ancestor !== `.`) {
        if (trackedPaths[sortedIndex(trackedPaths, ancestor)] === ancestor) return false;
        ancestor = pathApi.dirname(ancestor);
      }
      return true;
    })
    .map((path) => pathApi.join(repository.root, path))
    .sort();
}

export {
  discoverGitIgnoreConfigurationFiles,
  parseGitConfigurationPathOutput,
  readGitWatcherIgnoredDirectories,
};
if (typeof module !== `undefined`) {
  module.exports = {
    discoverGitIgnoreConfigurationFiles,
    parseGitConfigurationPathOutput,
    readGitWatcherIgnoredDirectories,
  };
}
import { parseGitConfigurationPathOutput, sortedIndex } from "./git-ignore-discovery-policy";
