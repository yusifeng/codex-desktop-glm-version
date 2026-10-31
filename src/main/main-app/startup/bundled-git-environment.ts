import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const BUNDLED_GIT_SUPPORTED_TARGETS = new Set([`darwin-arm64`, `darwin-x64`]);
export const BUNDLED_GIT_VERSION_TIMEOUT_MS = 500;

const execFileAsync = promisify(execFile);

function defaultPath(env: NodeJS.ProcessEnv): string {
  return env.PATH ?? env.Path ?? ``;
}

function setDefaultPath(env: NodeJS.ProcessEnv, value: string): void {
  if (`Path` in env && !(`PATH` in env)) env.Path = value;
  else env.PATH = value;
}

/** Configure the internal macOS Git bundle while preserving an OpenAI-patched active Git (original `Oue`). */
export async function configureBundledGitEnvironment({
  arch = process.arch,
  env,
  platform = process.platform,
  resourcesPath,
  getPath = defaultPath,
  setPath = setDefaultPath,
  resolveExecutable = () => null,
  readGitVersion = async (executable, executableEnv) => {
    let { stdout } = await execFileAsync(executable, [`--version`], {
      encoding: `utf8`,
      env: executableEnv,
      killSignal: `SIGKILL`,
      maxBuffer: 4096,
      timeout: BUNDLED_GIT_VERSION_TIMEOUT_MS,
      windowsHide: true,
    });
    return stdout;
  },
}: {
  arch?: string;
  env: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  resourcesPath?: string;
  getPath?: (env: NodeJS.ProcessEnv) => string | null | undefined;
  setPath?: (env: NodeJS.ProcessEnv, value: string) => void;
  resolveExecutable?: (command: string, env: NodeJS.ProcessEnv) => string | null;
  readGitVersion?: (executable: string, env: NodeJS.ProcessEnv) => Promise<string>;
}): Promise<string> {
  let target = `${platform}-${arch}`;
  if (!BUNDLED_GIT_SUPPORTED_TARGETS.has(target))
    throw Error(`Bundled Git does not support '${target}'.`);
  if (resourcesPath == null) throw Error(`Bundled Git resources are unavailable for '${target}'.`);

  let gitRoot = path.join(resourcesPath, `git`);
  let bundledExecutable = path.join(gitRoot, `bin`, `git`);
  let missing = [
    bundledExecutable,
    path.join(gitRoot, `etc`, `gitconfig`),
    path.join(gitRoot, `libexec`, `git-core`),
    path.join(gitRoot, `share`, `git-core`, `templates`),
  ].find((candidate) => !existsSync(candidate));
  if (missing != null)
    throw Error(`Bundled Git is incomplete for '${target}': missing '${path.relative(gitRoot, missing)}'.`);

  let currentPath = getPath(env) ?? ``;
  let bundledBin = path.join(gitRoot, `bin`);
  let currentExecutable = currentPath === `` ? null : resolveExecutable(`git`, env);
  let preferredExecutable: string | null = null;
  if (currentExecutable != null && currentExecutable !== bundledExecutable) {
    try {
      let version = await readGitVersion(currentExecutable, env);
      if (/^git version [^\r\n]*[.-]openai(?:[.-][^\r\n]+)?$/i.test(version.trim()))
        preferredExecutable = currentExecutable;
    } catch {}
  }

  let preferredBin = preferredExecutable == null ? null : path.dirname(preferredExecutable);
  delete env.CODEX_PREFERRED_GIT_EXECUTABLE;
  setPath(
    env,
    [
      ...(preferredBin == null ? [] : [preferredBin]),
      bundledBin,
      ...currentPath.split(`:`).filter((entry) => entry !== bundledBin && entry !== preferredBin),
    ]
      .filter((entry) => entry !== ``)
      .join(`:`),
  );
  if (preferredExecutable == null) {
    env.GIT_CONFIG_SYSTEM ||= path.join(gitRoot, `etc`, `gitconfig`);
    env.GIT_EXEC_PATH ||= path.join(gitRoot, `libexec`, `git-core`);
    env.GIT_TEMPLATE_DIR ||= path.join(gitRoot, `share`, `git-core`, `templates`);
  } else {
    env.CODEX_PREFERRED_GIT_EXECUTABLE = preferredExecutable;
  }
  return bundledExecutable;
}
