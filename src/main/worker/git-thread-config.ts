type ThreadConfigDependencies = {
  configFileName: string;
  findConfigFile: (repository: any, fileName: string, signal?: AbortSignal) => Promise<string | null>;
  parseSchema: (value: unknown) => { success: boolean; data?: any; error?: { message?: string } };
  isMissingError: (error: unknown) => boolean;
  warn: (message: string, error: unknown) => void;
};

import { parseThreadConfigValue } from './git-thread-config-policy';

async function findThreadConfig(repository: any, signal: AbortSignal | undefined, deps: ThreadConfigDependencies) {
  return deps.findConfigFile(repository, deps.configFileName, signal);
}

function parseThreadConfig(value: string, deps: ThreadConfigDependencies) {
  const parsed = parseThreadConfigValue(value, deps.parseSchema);
  if (parsed.success) return parsed.data;
  if (parsed.error instanceof Error) {
    deps.warn(`Failed to parse thread config`, parsed.error);
    return null;
  }
  if (parsed.error != null) {
    deps.warn(`Invalid thread config}`, parsed.error);
    return null;
  }
  deps.warn(`Invalid thread config}`, parsed.error);
  return null;
}

async function readThreadConfig(repository: any, signal: AbortSignal | undefined, deps: ThreadConfigDependencies) {
  const path = await findThreadConfig(repository, signal, deps);
  if (path == null) return null;
  try {
    const body = await repository.host.readFile(path);
    return parseThreadConfig(await new Response(body).text(), deps);
  } catch (error) {
    if (!deps.isMissingError(error)) deps.warn(`Failed to read thread config`, error);
    return null;
  }
}

async function writeThreadConfig(repository: any, value: any, signal: AbortSignal | undefined, deps: ThreadConfigDependencies) {
  const path = await findThreadConfig(repository, signal, deps);
  if (path == null) throw new Error(`No git repository found for thread config`);
  await repository.host.writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function setWorktreeOwnerThread(repository: any, ownerThreadId: string, signal: AbortSignal | undefined, deps: ThreadConfigDependencies) {
  await writeThreadConfig(repository, { version: 1, ownerThreadId }, signal, deps);
}

export { findThreadConfig, parseThreadConfig, readThreadConfig, setWorktreeOwnerThread, writeThreadConfig };
if (typeof module !== `undefined`) module.exports = { findThreadConfig, parseThreadConfig, readThreadConfig, setWorktreeOwnerThread, writeThreadConfig };
