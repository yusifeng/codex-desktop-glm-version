type GitIndexInfoDependencies = {
  getGitDir: (repository: any, signal: AbortSignal) => Promise<string | null>;
  logger: { error: (message: string, detail: any) => void };
};

async function getGitIndexInfo(
  repository: any,
  signal: AbortSignal,
  dependencies: GitIndexInfoDependencies,
) {
  const gitDir = await dependencies.getGitDir(repository, signal);
  if (!gitDir) return { lastModified: 0 };
  const indexPath = (await repository.host.platformPath()).join(gitDir, `index`);
  try {
    return projectGitIndexLastModified((await repository.host.stat(indexPath)).mtimeMs);
  } catch (error: any) {
    if (error.code !== `ENOENT`)
      dependencies.logger.error(`Failed to read index info`, {
        safe: { indexPath },
        sensitive: { error },
      });
    return projectGitIndexLastModified(null);
  }
}

export { getGitIndexInfo };
if (typeof module !== `undefined`) module.exports = { getGitIndexInfo };
import { projectGitIndexLastModified } from "./git-index-info-policy";
