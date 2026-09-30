import { accessSync, constants, existsSync, statSync } from "node:fs";
import path from "node:path";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { Bn as resolveWslDistro, In as resolveCodexPath, Ln as resolveNodePath, Mn as resolveNodeModuleDirs, On as resolvePrimaryRuntimePath, Rn as resolveNodeReplPath, Vn as recordExecutableResolution } from "@chunk/shared";

export interface RuntimePathsOptions {
  env?: NodeJS.ProcessEnv;
  isPackaged?: boolean;
  platform?: NodeJS.Platform;
  repoRoot?: string;
  resolveCodexPath?: (root: string) => string | null;
  resolveNodePath?: (root: string) => string | null;
  resolveNodeReplPath?: (root: string) => string | null;
  resolvePrimaryRuntimeNodePath?: (platform: NodeJS.Platform) => string | null;
  resourcesPath?: string;
}

type PathSource = `missing` | `bundled-or-dev` | `env-override` | `env-override-relocated` | `primary-runtime`;
type ResolvedPath = { path: string | null; source: PathSource };

function isExecutable(file: string): boolean {
  if (!existsSync(file)) return false;
  try {
    if (!statSync(file).isFile()) return false;
    if (process.platform !== `win32`) accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function primaryRuntimeNode(platform: NodeJS.Platform): string | null {
  if (platform !== `win32`) return null;
  const executable = path.join(path.dirname(resolvePrimaryRuntimePath()), `node`, `bin`, `node.exe`);
  return isExecutable(executable) ? executable : null;
}

function bundledOrDev(options: {
  devRelativePathSegments: string[] | null; isPackaged: boolean; platform: NodeJS.Platform;
  repoRoot: string; resolver: (root: string) => string | null; resourcesPath: string;
}): ResolvedPath {
  let value = options.resolver(options.resourcesPath);
  if (!options.isPackaged && options.platform !== `win32` && value == null && options.devRelativePathSegments != null) {
    const candidate = path.join(options.repoRoot, ...options.devRelativePathSegments);
    value = isExecutable(candidate) ? candidate : null;
  }
  return { path: value, source: value == null ? `missing` : `bundled-or-dev` };
}

function envOverride(raw: string | undefined, relocate: boolean, resolver: (root: string) => string | null): ResolvedPath | null {
  const value = raw?.trim();
  if (!value) return null;
  if (relocate && value.replaceAll(`/`, `\\`).toLowerCase().includes(`\\program files\\windowsapps\\`)) {
    const relocated = resolver(path.dirname(value));
    return relocated == null ? null : { path: relocated, source: `env-override-relocated` };
  }
  return { path: value, source: `env-override` };
}

export function resolveRuntimePaths(options: RuntimePathsOptions = {}) {
  const env = options.env ?? process.env;
  const isPackaged = options.isPackaged ?? true;
  const platform = options.platform ?? process.platform;
  const repoRoot = options.repoRoot ?? process.cwd();
  const resourcesPath = options.resourcesPath ?? resolveElectronResourcesPath({ env, resourcesPath: process.resourcesPath });
  const codexResolver = options.resolveCodexPath ?? resolveCodexPath;
  const nodeResolver = options.resolveNodePath ?? resolveNodePath;
  const replResolver = options.resolveNodeReplPath ?? resolveNodeReplPath;
  const wsl = platform === `win32` && resolveWslDistro() != null;
  const relocate = platform === `win32` && !wsl;
  const common = { isPackaged, platform, repoRoot, resourcesPath };
  const codex = envOverride(env.CODEX_CLI_PATH, relocate, codexResolver) ?? bundledOrDev({ ...common, devRelativePathSegments: [`extension`, `bin`, `codex`], resolver: codexResolver });
  let node = envOverride(env.CODEX_BROWSER_USE_NODE_PATH, relocate, nodeResolver) ?? bundledOrDev({ ...common, devRelativePathSegments: null, resolver: nodeResolver });
  if (node.path == null && !wsl) {
    const fallback = (options.resolvePrimaryRuntimeNodePath ?? primaryRuntimeNode)(platform);
    if (fallback != null) node = { path: fallback, source: `primary-runtime` };
  }
  const nodeRepl = envOverride(env.CODEX_NODE_REPL_PATH, relocate, replResolver) ?? bundledOrDev({ ...common, devRelativePathSegments: null, resolver: replResolver });
  if (platform === `win32`) {
    for (const [component, value] of [[`codex`, codex], [`node`, node], [`node-repl`, nodeRepl]] as const) {
      const source = value.source.startsWith(`env-override`) ? `override` : value.source === `primary-runtime` ? `primary-runtime` : undefined;
      recordExecutableResolution({ component, consumer: `browser-use`, executablePath: value.path, source });
    }
  }
  return { codexCliPath: codex.path, codexCliPathSource: codex.source, nodeModuleDirs: resolveNodeModuleDirs(resourcesPath), nodePath: node.path, nodePathSource: node.source, nodeReplPath: nodeRepl.path, nodeReplPathSource: nodeRepl.source, platform };
}
