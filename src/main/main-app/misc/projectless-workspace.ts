// projectless 工作区目录创建（原版 603-621 vt 文案、622-731 日期目录/目录名/
// 唯一目录创建、8586-8635 的 app-server 包装 ds/us/$ie）。
//
// 职责：
//   - projectless 线程的目录族（workspace root → 日期目录 → 线程目录，可选
//     outputs/work 分裂目录），最多 100 次序号重试 + 5 次随机后缀重试；
//   - 「对话内文案」指令段（原 vt）；
//   - createProjectlessThreadPathsViaAppServer（原 ds）：经 app-server 的
//     platformPath/Di 文件系统代理创建（不触碰本地磁盘）；
//   - validateProjectlessDirectory（原 us/Qie）：WSL 归属校验。
//
// 依赖约束：@chunk/shared 的文件系统代理（Di）与 WSL 工具（zi/xl/Hi/Mi）；
// 无模块加载期副作用。

import {
  Di as appServerFileSystem,
  zi as shouldUseWslPaths,
  Hi as wslHostPath,
  Mi as wslDistroName,
  xl as isAccessibleFromWsl,
  Es as isRemoteHostConfig,
} from "@chunk/shared";

/** 随机后缀重试次数（原 yt = 5）。 */
const RANDOM_SUFFIX_RETRIES = 5;

/** 序号后缀重试次数上限（原文硬编码 100）。 */
const SEQUENTIAL_RETRIES = 100;

// ---------------------------------------------------------------------------
// 文案（原 vt，603-621）
// ---------------------------------------------------------------------------

/**
 * projectless 线程的对话内指令段（原 vt）。
 * t（输出目录）与 n（浏览器根）都缺省时以 cwd 为根。
 */
export function projectlessWorkspaceInstructions({
  cwd,
  projectlessOutputDirectory,
  projectlessWorkspaceBrowserRoot,
}: {
  cwd: string;
  projectlessOutputDirectory: string | null;
  projectlessWorkspaceBrowserRoot: string | null;
}): string {
  let deliverablesRoot = projectlessOutputDirectory ?? projectlessWorkspaceBrowserRoot ?? cwd;
  return [
    `### Projectless Chat`,
    `This projectless thread starts in a generated directory under the user's Documents/Codex folder.`,
    `The generated directory name is only a filesystem identifier. Do not infer the user's language, locale, or preferences from its name or path, even if it resembles a language code such as 'ru'.`,
    `Prefer answering inline in chat unless using local files would make the result more useful.`,
    ...(projectlessOutputDirectory != null && projectlessOutputDirectory !== cwd
      ? [
          `Use work/ for intermediate files, scratch analysis, scripts, drafts, and temporary assets. Use ${deliverablesRoot} only for user-facing deliverables that should appear in outputs.`,
          `When referring to saved deliverables in the final response, link only files from ${deliverablesRoot}.`,
        ]
      : [
          `When using local files for this projectless thread, write scratch files, drafts, generated assets, and other outputs under ${deliverablesRoot}.`,
        ]),
    `Do not write directly in the home directory unless the user explicitly asks.`,
  ].join(`
`);
}

// ---------------------------------------------------------------------------
// 目录创建（原 St/Ct/wt/Tt/Et/Dt/Ot/kt/At，630-731）
// ---------------------------------------------------------------------------

/** 文件系统代理（app-server 远端 fs 的最小面）。 */
export interface ProjectlessFileSystem {
  createDirectory(input: { path: string; recursive: boolean }): Promise<unknown>;
  getMetadata(path: string): Promise<{ isDirectory: boolean; isSymlink: boolean }>;
}

/** 创建结果。 */
export interface ProjectlessThreadPaths {
  cwd: string;
  outputDirectory: string;
  workspaceRoot: string;
}

/** 日期目录名（原 wt，641-645）：YYYY-MM-DD。 */
function dateDirectoryName(date: Date): string {
  let month = String(date.getMonth() + 1).padStart(2, `0`);
  let day = String(date.getDate()).padStart(2, `0`);
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 日期目录（原 St，630-632）。 */
function dateDirectory({
  date = new Date(),
  path,
  workspaceRoot,
}: {
  date?: Date;
  path: { join(...parts: string[]): string };
  workspaceRoot: string;
}): string {
  return path.join(workspaceRoot, dateDirectoryName(date));
}

/** 线程目录名（原 Ct，633-640）：directoryName 优先，否则从 prompt 取词干。 */
function threadDirectoryName(input: { directoryName?: string; prompt?: string } | string | null): string {
  let explicit = typeof input == `object` && input != null ? input.directoryName : null;
  let prompt =
    typeof input == `object` && input != null ? input.prompt : (input as string | null);
  let words = (explicit ?? prompt)?.toLowerCase().match(/[a-z0-9]+/g);
  return words == null || words.length === 0
    ? `new-chat`
    : (explicit == null ? words.slice(0, 6) : words).join(`-`).slice(0, 80);
}

/** 随机后缀（原 At，727-731）。 */
function randomSuffix(): string {
  return typeof crypto < `u` && typeof crypto.randomUUID == `function`
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 创建唯一的 projectless 线程目录族（原 Tt，646-683）。
 * 先 100 次序号（`<name>`、`<name>-2` …），再 5 次随机后缀；全部失败抛错。
 */
export async function createProjectlessThreadDirectory({
  configuredWorkspaceRoot,
  createSplitDirectories,
  directoryName,
  fileSystem,
  homeDirectory,
  path,
  prompt,
  uniqueDirectoryNameSuffix = randomSuffix,
}: {
  configuredWorkspaceRoot: string | null;
  createSplitDirectories: boolean;
  directoryName?: string;
  fileSystem: ProjectlessFileSystem;
  homeDirectory: string;
  path: { join(...parts: string[]): string; basename(p: string): string; dirname(p: string): string };
  prompt: string;
  uniqueDirectoryNameSuffix?: () => string;
}): Promise<ProjectlessThreadPaths> {
  let workspaceRoot = await ensureWorkspaceRoot({
    configuredWorkspaceRoot,
    fileSystem,
    homeDirectory,
    path,
  });
  let datedDirectory = dateDirectory({ path, workspaceRoot });
  let baseName = threadDirectoryName({ directoryName, prompt });
  await fileSystem.createDirectory({ path: datedDirectory, recursive: true });
  await assertRealDirectory(fileSystem, datedDirectory);
  for (let attempt = 0; attempt < SEQUENTIAL_RETRIES; attempt += 1) {
    let created = await tryCreateThreadDirectory({
      createSplitDirectories,
      dateDirectory: datedDirectory,
      fileSystem,
      path,
      threadDirectoryName: attempt === 0 ? baseName : `${baseName}-${attempt + 1}`,
      workspaceRoot,
    });
    if (created != null) return created;
  }
  for (let attempt = 0; attempt < RANDOM_SUFFIX_RETRIES; attempt += 1) {
    let created = await tryCreateThreadDirectory({
      createSplitDirectories,
      dateDirectory: datedDirectory,
      fileSystem,
      path,
      threadDirectoryName: `${baseName}-${uniqueDirectoryNameSuffix()}`,
      workspaceRoot,
    });
    if (created != null) return created;
  }
  throw Error(`Unable to create a unique projectless thread directory`);
}

/** workspace root（原 Et，684-687）：根目录不存在时创建并校验。 */
async function ensureWorkspaceRoot({
  configuredWorkspaceRoot,
  fileSystem,
  homeDirectory,
  path,
}: {
  configuredWorkspaceRoot: string | null;
  fileSystem: ProjectlessFileSystem;
  homeDirectory: string;
  path: { join(...parts: string[]): string };
}): Promise<string> {
  let root = defaultWorkspaceRoot({ configuredWorkspaceRoot, homeDirectory, path });
  await fileSystem.createDirectory({ path: root, recursive: true });
  await assertRealDirectory(fileSystem, root);
  return root;
}

/** 校验目标为真实目录（原 Dt，688-692）。 */
async function assertRealDirectory(
  fileSystem: ProjectlessFileSystem,
  path: string,
): Promise<void> {
  let metadata = await fileSystem.getMetadata(path);
  if (metadata.isDirectory !== true || metadata.isSymlink === true)
    throw Error(`Projectless thread directory must be a real directory`);
}

/**
 * 单次线程目录创建尝试（原 Ot，693-719）：
 * 已存在 → null（继续重试）；分裂目录创建失败 → 退化为不分裂。
 */
async function tryCreateThreadDirectory({
  createSplitDirectories,
  dateDirectory,
  fileSystem,
  path,
  threadDirectoryName,
  workspaceRoot,
}: {
  createSplitDirectories: boolean;
  dateDirectory: string;
  fileSystem: ProjectlessFileSystem;
  path: { join(...parts: string[]): string };
  threadDirectoryName: string;
  workspaceRoot: string;
}): Promise<ProjectlessThreadPaths | null> {
  let cwd = path.join(dateDirectory, threadDirectoryName);
  let outputDirectory = createSplitDirectories ? path.join(cwd, `outputs`) : cwd;
  try {
    await fileSystem.createDirectory({ path: cwd, recursive: false });
  } catch (error) {
    if (!(await isExistingRealDirectory(fileSystem, cwd))) throw error;
    return null;
  }
  if (createSplitDirectories) {
    try {
      await Promise.all([
        fileSystem.createDirectory({ path: outputDirectory, recursive: false }),
        fileSystem.createDirectory({ path: path.join(cwd, `work`), recursive: false }),
      ]);
    } catch {
      return { cwd, outputDirectory: cwd, workspaceRoot };
    }
  }
  return { cwd, outputDirectory, workspaceRoot };
}

/** 目录已存在且为真实目录（原 kt，720-726）。 */
async function isExistingRealDirectory(
  fileSystem: ProjectlessFileSystem,
  path: string,
): Promise<boolean> {
  try {
    await assertRealDirectory(fileSystem, path);
    return true;
  } catch {
    return false;
  }
}

/** workspace root 缺省值（原 xt，627-629）：`<home>/Documents/Codex`。 */
export function defaultWorkspaceRoot({
  configuredWorkspaceRoot,
  homeDirectory,
  path,
}: {
  configuredWorkspaceRoot: string | null;
  homeDirectory: string;
  path: { join(...parts: string[]): string };
}): string {
  return configuredWorkspaceRoot ?? path.join(homeDirectory, `Documents`, `Codex`);
}

// ---------------------------------------------------------------------------
// app-server 包装（原 ds/us/$ie，8586-8635）
// ---------------------------------------------------------------------------

/**
 * 经 app-server 远端 fs 创建 projectless 目录（原 ds，8586-8607）。
 * configuredWorkspaceRoot 需在执行主机上为绝对路径，且 WSL 下须属于当前
 * 发行版（us 校验）。
 */
export async function createProjectlessThreadPathsViaAppServer({
  appServerClient,
  configuredWorkspaceRoot,
  createSplitDirectories,
  directoryName,
  homeDirectory,
  prompt,
}: {
  appServerClient: {
    hostConfig: unknown;
    platformPath(): Promise<{
      join(...parts: string[]): string;
      isAbsolute(p: string): boolean;
      basename(p: string): string;
      dirname(p: string): string;
    }>;
  };
  configuredWorkspaceRoot: string | null;
  createSplitDirectories: boolean;
  directoryName?: string;
  homeDirectory: string;
  prompt: string;
}): Promise<ProjectlessThreadPaths> {
  let path = await appServerClient.platformPath();
  let validatedRoot =
    configuredWorkspaceRoot == null
      ? null
      : validateProjectlessDirectory(
          configuredWorkspaceRoot,
          shouldUseWslPaths(appServerClient.hostConfig),
        );
  if (validatedRoot != null && !path.isAbsolute(validatedRoot))
    throw Error(`Projectless chat folder must be absolute on the execution host`);
  return createProjectlessThreadDirectory({
    configuredWorkspaceRoot: validatedRoot,
    createSplitDirectories,
    directoryName,
    fileSystem: appServerFileSystemAdapter(appServerClient),
    homeDirectory,
    path,
    prompt,
  });
}

/**
 * WSL 归属校验（原 us，8576-8585）：WSL host 上目录必须已转换且属于当前
 * 发行版、可从 WSL 访问。
 */
export function validateProjectlessDirectory(directory: string, useWslPaths: boolean): string {
  let converted = useWslPaths ? wslHostPath(directory) : directory;
  if (useWslPaths) {
    let distroPrefix = wslHostPath(directory);
    if (
      distroPrefix != null &&
      distroPrefix.toLowerCase() !== (wslDistroName()?.toLowerCase() ?? ``)
    )
      throw Error(`Projectless chat folder must belong to the active WSL distribution`);
    if (isAccessibleFromWsl(converted)) throw Error(`Projectless chat folder must be accessible from WSL`);
  }
  return converted;
}

/** app-server 文件系统代理（原 $ie，8625-8634）。 */
function appServerFileSystemAdapter(appServerClient: unknown): ProjectlessFileSystem {
  return {
    createDirectory: async ({ path, recursive }) => {
      await appServerFileSystem.mkdir(path, { recursive }, appServerClient);
    },
    getMetadata: async (path) => {
      let stat = await appServerFileSystem.stat(path, appServerClient, { followSymlinks: false });
      return { isDirectory: stat.isDirectory(), isSymlink: stat.isSymbolicLink() };
    },
  };
}

/** 兼容 re-export（供消费方判定 remote host）。 */
export { isRemoteHostConfig };
