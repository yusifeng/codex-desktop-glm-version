import { createHash } from "node:crypto";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";

type PathApi = {
  basename(path: string): string;
  dirname(path: string): string;
  join(...parts: string[]): string;
  normalize(path: string): string;
  relative(from: string, to: string): string;
  resolve(path: string): string;
  sep: string;
};

type DirectoryEntry = { name: string };
type Stat = { isDirectory(): boolean; isFile(): boolean };

export interface LocalEnvironmentHost {
  id: string;
  hostConfig?: { kind?: string };
  platformPath(): Promise<PathApi>;
  readDirectory(path: string): Promise<DirectoryEntry[]>;
  readFile(path: string): Promise<BodyInit | ReadableStream<Uint8Array>>;
  stat(path: string): Promise<Stat>;
  createDirectory(path: string, options?: { recursive?: boolean }): Promise<unknown>;
  writeFile(path: string, contents: string): Promise<unknown>;
}

const DEFAULT_CONFIG_NAME = "environment.toml";
const actionSchema = z.object({
  name: z.string(),
  icon: z.enum(["tool", "run", "debug", "test"]).nullable().catch(null),
  command: z.string(),
  platform: z.enum(["darwin", "linux", "win32"]).optional(),
});
const platformScriptSchema = z.object({ script: z.string() });
const scriptSchema = z.object({
  script: z.string(),
  darwin: platformScriptSchema.optional(),
  linux: platformScriptSchema.optional(),
  win32: platformScriptSchema.optional(),
});
const environmentSchema = z.object({
  version: z.number().int().min(1).default(1),
  name: z.string(),
  setup: scriptSchema,
  cleanup: scriptSchema.optional(),
  actions: z.array(actionSchema).optional(),
});

function errorResult(configPath: string, message: string) {
  return { configPath, cwdRelativeToGitRoot: configPath, type: "error" as const, error: { message } };
}

function trimScript(script: z.infer<typeof scriptSchema>) {
  return {
    ...script,
    script: script.script.trim(),
    darwin: script.darwin ? { script: script.darwin.script.trim() } : undefined,
    linux: script.linux ? { script: script.linux.script.trim() } : undefined,
    win32: script.win32 ? { script: script.win32.script.trim() } : undefined,
  };
}

function normalizeParsedToml(value: unknown): unknown {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.actions)) return record;
  return {
    ...record,
    actions: record.actions.filter((action) => {
      if (typeof action !== "object" || action == null || Array.isArray(action)) return false;
      const candidate = action as Record<string, unknown>;
      return typeof candidate.name === "string" && candidate.name.trim().length > 0 &&
        typeof candidate.command === "string" && candidate.command.trim().length > 0;
    }),
  };
}

function normalizeEnvironment(environment: z.infer<typeof environmentSchema>) {
  return {
    ...environment,
    name: environment.name.trim(),
    setup: trimScript(environment.setup),
    cleanup: environment.cleanup ? trimScript(environment.cleanup) : undefined,
    actions: environment.actions?.map((action) => ({
      ...action,
      name: action.name.trim(),
      command: action.command.trim(),
    })),
  };
}

async function existsAsGitRoot(path: string, host: LocalEnvironmentHost, pathApi: PathApi): Promise<boolean> {
  try {
    const stat = await host.stat(pathApi.join(path, ".git"));
    return stat.isDirectory() || stat.isFile();
  } catch {
    return false;
  }
}

async function containsCodexDirectory(path: string, host: LocalEnvironmentHost, pathApi: PathApi): Promise<boolean> {
  try {
    const stat = await host.stat(pathApi.join(path, ".codex"));
    return stat.isDirectory() || stat.isFile();
  } catch {
    return false;
  }
}

async function workspaceRootForConfig(configPath: string, host: LocalEnvironmentHost, pathApi: PathApi): Promise<string> {
  const environmentsDirectory = pathApi.dirname(configPath);
  const codexDirectory = pathApi.dirname(environmentsDirectory);
  let start = pathApi.basename(environmentsDirectory) === "environments" && pathApi.basename(codexDirectory) === ".codex"
    ? pathApi.dirname(codexDirectory)
    : pathApi.dirname(configPath);
  while (start !== pathApi.dirname(start)) {
    if (await containsCodexDirectory(start, host, pathApi) || await existsAsGitRoot(start, host, pathApi)) return start;
    start = pathApi.dirname(start);
  }
  return configPath;
}

async function cwdRelativeToGitRoot(configPath: string, host: LocalEnvironmentHost, pathApi: PathApi): Promise<string> {
  const workspaceRoot = await workspaceRootForConfig(configPath, host, pathApi);
  let gitRoot = workspaceRoot;
  while (gitRoot !== pathApi.dirname(gitRoot) && !(await existsAsGitRoot(gitRoot, host, pathApi)))
    gitRoot = pathApi.dirname(gitRoot);
  const relative = pathApi.relative(gitRoot, workspaceRoot);
  return relative === "" ? "." : relative;
}

async function decodeFile(path: string, host: LocalEnvironmentHost): Promise<string> {
  return new Response(await host.readFile(path)).text();
}

export async function readLocalEnvironment(
  configPath: string,
  host: LocalEnvironmentHost,
  getRelativeCwd?: () => Promise<string>,
) {
  let raw: string;
  try {
    raw = await decodeFile(configPath, host);
  } catch (error) {
    return errorResult(configPath, `Failed to parse environment config at ${configPath}: ${String(error)}`);
  }
  let parsed: unknown;
  try {
    parsed = normalizeParsedToml(parseToml(raw));
  } catch (error) {
    return errorResult(configPath, `Failed to parse environment config at ${configPath}: ${String(error)}`);
  }
  const validated = environmentSchema.safeParse(parsed);
  if (!validated.success)
    return errorResult(configPath, `Invalid environment config at ${configPath}: ${validated.error.message}`);
  const pathApi = await host.platformPath();
  return {
    configPath,
    cwdRelativeToGitRoot: await (getRelativeCwd?.() ?? cwdRelativeToGitRoot(configPath, host, pathApi)),
    type: "success" as const,
    environment: normalizeEnvironment(validated.data),
  };
}

async function environmentFiles(directory: string, host: LocalEnvironmentHost, pathApi: PathApi): Promise<string[]> {
  try {
    if (!(await host.stat(directory)).isDirectory()) return [];
    return (await host.readDirectory(directory)).map((entry) => entry.name)
      .filter((name) => name.endsWith(".toml"))
      .sort((left, right) => left.localeCompare(right))
      .map((name) => pathApi.join(directory, name));
  } catch {
    return [];
  }
}

export async function listLocalEnvironments(workspaceRoot: string, host: LocalEnvironmentHost) {
  const pathApi = await host.platformPath();
  const origin = pathApi.resolve(workspaceRoot);
  const environments: any[] = [];
  const seen = new Set<string>();
  let current = origin;
  for (let depth = 0; depth < 50; depth += 1) {
    const files = await environmentFiles(pathApi.join(current, ".codex", "environments"), host, pathApi);
    if (files.length > 0) {
      let sharedRelativeCwd: Promise<string> | null = null;
      const getRelativeCwd = () => sharedRelativeCwd ??= cwdRelativeToGitRoot(files[0], host, pathApi);
      for (const environment of await Promise.all(files.map((file) => readLocalEnvironment(file, host, getRelativeCwd)))) {
        const normalized = pathApi.resolve(environment.configPath);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          environments.push(environment);
        }
      }
    }
    const parent = pathApi.dirname(current);
    if (await existsAsGitRoot(current, host, pathApi) || parent === current) break;
    current = parent;
  }
  const distance = (configPath: string) => {
    const root = pathApi.dirname(pathApi.dirname(pathApi.dirname(configPath)));
    const relative = pathApi.relative(workspaceRoot, root);
    return relative === "" ? 0 : relative.split(pathApi.sep).length;
  };
  return environments.sort((left, right) => {
    const leftDefault = pathApi.basename(pathApi.normalize(left.configPath)) === DEFAULT_CONFIG_NAME;
    const rightDefault = pathApi.basename(pathApi.normalize(right.configPath)) === DEFAULT_CONFIG_NAME;
    return leftDefault !== rightDefault ? (leftDefault ? -1 : 1)
      : distance(left.configPath) - distance(right.configPath) || left.configPath.localeCompare(right.configPath);
  });
}

const saveQueues = new Map<string, Promise<void>>();
function revision(raw: string): string {
  return `sha256:${createHash("sha256").update(raw).digest("hex")}`;
}
function isMissing(error: unknown): boolean {
  return typeof error === "object" && error != null && "code" in error && (error as { code?: string }).code === "ENOENT" ||
    error instanceof Error && /ENOENT|no such file|does not exist/i.test(error.message);
}

export async function saveLocalEnvironment(
  host: LocalEnvironmentHost,
  { configPath, expectedRevision, raw }: { configPath: string; expectedRevision: string | null; raw: string },
) {
  const key = `${host.id}:${configPath}`;
  const pending = (saveQueues.get(key) ?? Promise.resolve()).then(async () => {
    const pathApi = await host.platformPath();
    await host.createDirectory(pathApi.dirname(configPath), { recursive: true });
    let current: string | null = null;
    try {
      current = await decodeFile(configPath, host);
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    if (current != null) {
      if (current === raw) return { type: "success" as const };
      if (expectedRevision == null || revision(current) !== expectedRevision) return { type: "conflict" as const };
    } else if (expectedRevision != null) {
      return { type: "conflict" as const };
    }
    await host.writeFile(configPath, raw);
    return { type: "success" as const };
  });
  const settled = pending.then(() => undefined, () => undefined);
  saveQueues.set(key, settled);
  try {
    return await pending;
  } finally {
    if (saveQueues.get(key) === settled) saveQueues.delete(key);
  }
}

export { listLocalEnvironments as K, readLocalEnvironment as q, saveLocalEnvironment as R };
