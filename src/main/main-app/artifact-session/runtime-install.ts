// artifact-session 运行时安装 —— 原 main-C-Mhak1n.ts 4,182-4,357 行
// （`Xr/Ute/Zr/Wte/Qr/$r/Gte/ei/ti/ni/Kte/qte`，即合同模块表的
// 「Xr/Ute..Kte runtime-generations 安装」）。
//
// 职责：为 artifact session 宿主守护进程钉住一份私有 runtime 快照：
//   - 在 `<root>/runtime-generations/` 下建 `generation-<random>` 目录（0700），
//     把当前 node 可执行文件与 `@oai/artifact-tool` 包复制进 `runtime-N`
//     （最多 3 次尝试；复制前后比对 dev/ino 防止 Primary Runtime 在钉住期间被替换），
//     原子改名为 `runtime` 并递归规范权限（目录 0500、文件按 owner-exec 位 0400/0500）。
//   - 清理陈旧 generation（名字合法、私有、属主为本用户校验后整树删除）。
//   - `Kte`：动态 import 宿主 client（host-client.mjs），包装成 admission
//     RPC 客户端（activate / status / close）——是 `Hte.start` 的默认
//     createAdmissionClient。
//
// 注意：目录权限位（448=0700、320=0500、256=0400）与「generation 名必须匹配
// /^generation-[A-Za-z0-9_-]+$/」是安全边界，重写保持逐字等价。

import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  isNodeErrorCode,
  ARTIFACT_TOOL_PACKAGE_NAME,
  ARTIFACT_TOOL_HOST_DAEMON_PATH,
  ARTIFACT_TOOL_HOST_CLIENT_PATH,
  RUNTIME_SNAPSHOT_MAX_ATTEMPTS,
  admissionStatusSchema,
} from "./host-lifecycle";

// ---- 类型 -------------------------------------------------------------------

/** 钉住后的 runtime 路径集（在源路径基础上覆写 bin/node_modules 路径）。 */
export interface PinnedRuntimePaths {
  binPath: string;
  nodeModulesPath: string;
  nodePath: string;
  [key: string]: unknown;
}

/** 源 runtime 路径集（来自 primary runtime 解析）。 */
export interface SourceRuntimePaths {
  nodeModulesPath: string;
  nodePath: string;
  [key: string]: unknown;
}

/** 钉住结果。 */
export interface PinnedRuntime {
  pinnedRuntimeDirectory: string;
  runtimePaths: PinnedRuntimePaths;
}

/** 守护进程运行环境描述（`Hte.#w` 的产物）。 */
export interface ArtifactSessionHostEnvironment {
  adminConnectionInfo: { hostClientModulePath: string; socketPath: string; token: string };
  daemonEnv: Record<string, string>;
  daemonPath: string;
  pinnedRuntimeDirectory: string;
  readyFile: string;
  runtimeDirectory: string;
  runtimePaths: PinnedRuntimePaths;
  trustedServiceEnv: Record<string, string>;
  viewerConnectionInfo: { hostClientModulePath: string; socketPath: string; token: string };
}

/** admission 状态（host.admissionStatus 的解析结果）。 */
export interface AdmissionStatus {
  epoch: number;
  instanceId: string;
  open: boolean;
}

/** admission RPC 客户端（`Kte` 的返回）。 */
export interface AdmissionClient {
  activate(status: AdmissionStatus): Promise<void>;
  close(): Promise<unknown>;
  status(): Promise<AdmissionStatus>;
}

/** 宿主连接信息（admin / viewer 各一份）。 */
export interface HostConnectionInfo {
  hostClientModulePath: string;
  socketPath: string;
  token: string;
}

// ---- Xr：删除钉住的 runtime（4,182-4,187）-------------------------------------

/** 删除守护进程临时目录与钉住的 runtime generation（原 `Xr`）。 */
export async function removeArtifactSessionRuntime(
  environment: Pick<ArtifactSessionHostEnvironment, "runtimeDirectory" | "pinnedRuntimeDirectory">,
): Promise<void> {
  await Promise.all([
    fs.rm(environment.runtimeDirectory, { recursive: !0, force: !0 }),
    removeRuntimeDirectory(environment.pinnedRuntimeDirectory),
  ]);
}

// ---- Ute：钉住 runtime（4,188-4,243）------------------------------------------

/**
 * 把 node 可执行文件 + `@oai/artifact-tool` 复制进新的 runtime generation
 * （原 `Ute`）。复制后校验源身份未变，否则视为失败重试（最多
 * RUNTIME_SNAPSHOT_MAX_ATTEMPTS 次）。
 */
export async function pinArtifactToolRuntime({
  rootDirectory,
  sourceRuntimePaths,
}: {
  rootDirectory: string;
  sourceRuntimePaths: SourceRuntimePaths;
}): Promise<PinnedRuntime> {
  let packagePath = path.join(sourceRuntimePaths.nodeModulesPath, ARTIFACT_TOOL_PACKAGE_NAME);
  await assertArtifactSessionRuntimeComplete(sourceRuntimePaths.nodeModulesPath);
  let generationsRoot = path.join(rootDirectory, `runtime-generations`);
  await ensureRuntimeGenerationsRoot(generationsRoot);
  let generationDirectory = await fs.mkdtemp(path.join(generationsRoot, `generation-`));
  await fs.chmod(generationDirectory, 448);
  let runtimeDirectory = path.join(generationDirectory, `runtime`);
  try {
    for (let attempt = 0; attempt < RUNTIME_SNAPSHOT_MAX_ATTEMPTS; attempt += 1) {
      let candidateRoot = path.join(generationDirectory, `runtime-${attempt}`),
        nodePath = path.join(candidateRoot, `bin`, `node`),
        nodeModulesPath = path.join(candidateRoot, `node_modules`),
        packageCopyPath = path.join(nodeModulesPath, ARTIFACT_TOOL_PACKAGE_NAME);
      try {
        let identities = await statArtifactRuntimeIdentities(
          sourceRuntimePaths.nodePath,
          packagePath,
        );
        if (
          (await Promise.all([
            fs.mkdir(path.dirname(nodePath), { recursive: !0 }),
            fs.mkdir(path.dirname(packageCopyPath), { recursive: !0 }),
          ]),
          await Promise.all([
            fs.copyFile(sourceRuntimePaths.nodePath, nodePath, fsConstants.COPYFILE_FICLONE),
            fs.cp(packagePath, packageCopyPath, {
              dereference: !0,
              mode: fsConstants.COPYFILE_FICLONE,
              recursive: !0,
            }),
          ]),
          await fs.chmod(nodePath, identities.nodeMode),
          !isSameRuntimeIdentities(
            identities,
            await statArtifactRuntimeIdentities(sourceRuntimePaths.nodePath, packagePath),
          ))
        )
          throw Error(`Primary Runtime changed while pinning Artifact Tool.`);
        return (
          await assertArtifactSessionRuntimeComplete(nodeModulesPath),
          await fs.rename(candidateRoot, runtimeDirectory),
          await normalizeRuntimeEntryPermissions(generationDirectory),
          {
            pinnedRuntimeDirectory: generationDirectory,
            runtimePaths: {
              ...sourceRuntimePaths,
              binPath: path.dirname(path.join(runtimeDirectory, `bin`, `node`)),
              nodeModulesPath: path.join(runtimeDirectory, `node_modules`),
              nodePath: path.join(runtimeDirectory, `bin`, `node`),
            },
          }
        );
      } catch (error) {
        if ((await fs.rm(candidateRoot, { recursive: !0, force: !0 }), attempt === 2)) throw error;
      }
    }
    throw Error(`Artifact Session runtime snapshot could not be created.`);
  } catch (error) {
    throw (await removeRuntimeDirectory(generationDirectory), error);
  }
}

// ---- Zr/Wte：runtime 身份（4,244-4,266）----------------------------------------

/** node 可执行文件与 artifact-tool 包的 dev/ino/mode 身份（原 `Zr`）。 */
async function statArtifactRuntimeIdentities(nodePath: string, packagePath: string) {
  let [nodeStat, packageStat] = await Promise.all([
    fs.stat(nodePath, { bigint: !0 }),
    fs.stat(packagePath, { bigint: !0 }),
  ]);
  if (!nodeStat.isFile() || !packageStat.isDirectory())
    throw Error(`Installed Artifact Session runtime is incomplete.`);
  return {
    nodeDevice: nodeStat.dev,
    nodeInode: nodeStat.ino,
    nodeMode: Number(nodeStat.mode % 512n),
    packageDevice: packageStat.dev,
    packageInode: packageStat.ino,
  };
}

/** 两次身份快照是否一致（dev/ino 四元组；原 `Wte`）。 */
function isSameRuntimeIdentities(
  a: Awaited<ReturnType<typeof statArtifactRuntimeIdentities>>,
  b: Awaited<ReturnType<typeof statArtifactRuntimeIdentities>>,
) {
  return (
    a.nodeDevice === b.nodeDevice &&
    a.nodeInode === b.nodeInode &&
    a.packageDevice === b.packageDevice &&
    a.packageInode === b.packageInode
  );
}

// ---- Qr：runtime 完整性（4,267-4,280）------------------------------------------

/** 校验 node_modules 中 artifact-tool 的四个入口 mjs 均存在且为文件（原 `Qr`）。 */
async function assertArtifactSessionRuntimeComplete(nodeModulesPath: string) {
  let requiredEntries = [
    ARTIFACT_TOOL_HOST_DAEMON_PATH,
    ARTIFACT_TOOL_HOST_CLIENT_PATH,
    path.join(ARTIFACT_TOOL_PACKAGE_NAME, `dist`, `artifact-session`, `index.mjs`),
    path.join(ARTIFACT_TOOL_PACKAGE_NAME, `dist`, `artifact-session`, `service.mjs`),
  ];
  if (
    (
      await Promise.all(
        requiredEntries.map((entry) =>
          fs.stat(path.join(nodeModulesPath, entry)).catch(() => null),
        ),
      )
    ).some((stat) => stat?.isFile() !== !0)
  )
    throw Error(`Installed Artifact Session runtime is incomplete.`);
}

// ---- $r：runtime-generations 根目录（4,281-4,288）-------------------------------

/** 确保 runtime-generations 根目录存在、为目录、属主为本用户，并 chmod 0700（原 `$r`）。 */
async function ensureRuntimeGenerationsRoot(directory: string) {
  await fs.mkdir(directory, { recursive: !0, mode: 448 });
  let stat = await fs.lstat(directory, { bigint: !0 });
  if (!stat.isDirectory()) throw Error(`Artifact Session runtime root must be a directory.`);
  if (typeof process.getuid == `function` && stat.uid !== BigInt(process.getuid()))
    throw Error(`Artifact Session runtime root must be owned by this user.`);
  await fs.chmod(directory, 448);
}

// ---- Gte：清理陈旧 generation（4,289-4,308）-------------------------------------

/**
 * 校验并清空 root 下的全部 runtime generation（原 `Gte`，`Hte.start` 前置步骤）：
 * 名字必须匹配 `/^generation-[A-Za-z0-9_-]+$/`，必须是组外无权限的私有目录且
 * 属主为本用户，随后整树删除。
 */
export async function cleanStaleRuntimeGenerations(rootDirectory: string) {
  let generationsRoot = path.join(rootDirectory, `runtime-generations`);
  await ensureRuntimeGenerationsRoot(generationsRoot);
  let staleDirectories = await Promise.all(
    (await fs.readdir(generationsRoot))
      .filter((name) => name.startsWith(`generation-`))
      .map(async (name) => {
        if (!/^generation-[A-Za-z0-9_-]+$/.test(name))
          throw Error(`Artifact Session runtime generation name is invalid.`);
        let directory = path.join(generationsRoot, name),
          stat = await fs.lstat(directory, { bigint: !0 });
        if (!stat.isDirectory() || (stat.mode & 63n) != 0n)
          throw Error(`Artifact Session runtime generation must be a private directory.`);
        if (typeof process.getuid == `function` && stat.uid !== BigInt(process.getuid()))
          throw Error(`Artifact Session runtime generation must be owned by this user.`);
        return directory;
      }),
  );
  await Promise.all(staleDirectories.map((directory) => removeRuntimeDirectory(directory)));
}

// ---- ei/ti/ni：权限规范化与删除（4,309-4,337）----------------------------------

/**
 * 递归规范 runtime 条目权限（原 `ei`）：目录 → 0500；普通文件按 owner-exec 位
 * → 0400/0500；非目录非文件报错；属主必须为本用户。
 */
async function normalizeRuntimeEntryPermissions(entryPath: string) {
  let stat = await fs.lstat(entryPath, { bigint: !0 });
  if (typeof process.getuid == `function` && stat.uid !== BigInt(process.getuid()))
    throw Error(`Artifact Session runtime entry has an unexpected owner.`);
  if (stat.isDirectory()) {
    let children = await fs.readdir(entryPath);
    for (let index = 0; index < children.length; index += 32)
      await Promise.all(
        children.slice(index, index + 32).map((child) =>
          normalizeRuntimeEntryPermissions(path.join(entryPath, child)),
        ),
      );
    await fs.chmod(entryPath, 320);
    return;
  }
  if (!stat.isFile()) throw Error(`Artifact Session runtime contains an unsupported entry.`);
  let mode = (stat.mode & 73n) == 0n ? 256 : 320;
  await fs.chmod(entryPath, mode);
}

/** 删除 runtime 目录：先递归 chmod 0700 再整树 rm（原 `ti`）。 */
export async function removeRuntimeDirectory(directory: string) {
  await makeTreePrivateWritable(directory);
  await fs.rm(directory, { recursive: !0, force: !0 });
}

/** 递归 chmod 0700（ENOENT 静默；原 `ni`）。 */
async function makeTreePrivateWritable(directory: string) {
  let stat = await fs.lstat(directory).catch((error) => {
    if (isNodeErrorCode(error, `ENOENT`)) return null;
    throw error;
  });
  if (stat == null || !stat.isDirectory()) return;
  await fs.chmod(directory, 448);
  let children = await fs.readdir(directory);
  for (let index = 0; index < children.length; index += 32)
    await Promise.all(
      children.slice(index, index + 32).map((child) =>
        makeTreePrivateWritable(path.join(directory, child)),
      ),
    );
}

// ---- Kte/qte：admission 客户端（4,338-4,357）------------------------------------

/**
 * 动态 import 宿主 client 模块并构造 admission RPC 客户端（原 `Kte`）。
 * `Hte.start` 的默认 createAdmissionClient。
 */
export async function createAdmissionClient(connectionInfo: HostConnectionInfo): Promise<AdmissionClient> {
  let module = (await import(pathToFileURL(connectionInfo.hostClientModulePath).href)) as any;
  if (typeof module.ArtifactSessionHostRpcClient != `function`)
    throw Error(`Installed Artifact Session host client is invalid.`);
  let client = new module.ArtifactSessionHostRpcClient({
    role: `admin`,
    socketPath: connectionInfo.socketPath,
    token: connectionInfo.token,
  });
  return {
    activate: async ({ epoch, instanceId }: AdmissionStatus) => {
      await client.call(`host.activate`, { expectedEpoch: epoch, instanceId });
    },
    close: () => client.close(),
    status: async () => parseAdmissionStatus(await client.call(`host.admissionStatus`)),
  };
}

/** 解析并冻结 admission 状态（原 `qte`；schema `Vte` 在 host-lifecycle 定义）。 */
function parseAdmissionStatus(value: unknown): AdmissionStatus {
  return Object.freeze(admissionStatusSchema.parse(value)) as AdmissionStatus;
}
