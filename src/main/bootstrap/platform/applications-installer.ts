// macOS Applications 安装 gate（原 bootstrap-C4dRql4x.ts 24092-24590 行的
// `Pk/Fk/Ik/Lk/Rk/zk`、`Bk/Vk/Hk/Uk/Wk/Gk/Kk/qk/Jk/Yk/Xk/Zk/Qk/$k/eA/tA/nA/rA/iA/aA/oA/sA`、`lA`）。
//
// 这是 macOS 启动路径的关键 gate（主流程 `Bk()` 调用）：
//   - 非 darwin 或未打包：直接返回 false（不拦截启动）。
//   - 已在 /Applications：尝试清理上次安装遗留的源 DMG（detach + 移到废纸篓），
//     返回 false。
//   - 从 /Volumes 下的 DMG 运行（首次安装）：弹出安装窗口，依次
//     ① 记住源 DMG 路径（userData 下的 pending-source-dmg-cleanup.json），
//     ② 迁移旧版 ChatGPT.app（legacy-chatgpt-relocation，失败则窗口置 failed），
//     ③ 优先 Electron 原生 moveToApplicationsFolder（会弹系统对话框），
//     ④ 原生不可用时降级 ditto 复制到 /Applications（先 rm 旧 staging、
//        已存在同名 app 移废纸篓、rename staging → 目标），
//     ⑤ open -n 启动新装 app 并 quit 当前实例。
//     任一步失败都返回 true（当前实例终止启动，窗口指示用户手动处理）。
// 全部依赖（hdiutil/plutil/ditto/open、窗口、trash）以默认参数注入，便于测试。
//
// `lA`（isPathInside）是纯粹的路径包含判断，无 symlink 归一化。

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

import { app, BrowserWindow, screen, shell } from "electron";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   wf → zod object 构造器、Of → zod string 构造器、hf → zod array 构造器
import { hf as arraySchema_, Of as stringSchema_, wf as objectSchema_ } from "@chunk/shared";

// 压缩名导入后重绑为 any：d.ts 的 Schema 接口未声明 zod 的链式方法
//（.optional()/.loose() 等），与 production-appcast-state 的处理方式一致。
const objectSchema: any = objectSchema_;
const stringSchema: any = stringSchema_;
const arraySchema: any = arraySchema_;
import { getLogger } from "@chunk/logger";
import { appBundlePath } from "../startup/user-data";
import {
  relocateLegacyChatGptApp,
  type RelocateLegacyChatGptAppResult,
} from "./legacy-chatgpt-relocation";
import { installerWindowHtml, type InstallerStatus } from "./installer-window-html";

// ---- 常量与 schema（原 Pk/Fk/Ik/Rk/zk）-------------------------------------

/** 源 DMG 待清理记录文件名（原 `Pk`，位于 userData 下）。 */
const PENDING_SOURCE_DMG_CLEANUP_FILENAME = `pending-source-dmg-cleanup.json`;
/** 源 DMG detach 的最大重试次数（原 `Fk`）。 */
const DMG_DETACH_MAX_ATTEMPTS = 25;
/** 源 DMG detach 重试间隔毫秒（原 `Ik`）。 */
const DMG_DETACH_RETRY_DELAY_MS = 250;

/** promisify 的 execFile（原 `Lk`，用于 ditto / open）。 */
const execFileAsync = promisify(execFile);

/** `hdiutil info -plist` 输出的 zod schema（原 `Rk`）。 */
const hdiutilInfoSchema: any = objectSchema({
  images: arraySchema(
    objectSchema({
      "image-path": stringSchema().optional(),
      "system-entities": arraySchema(
        objectSchema({ "mount-point": stringSchema().optional() }).loose(),
      ).optional(),
    }).loose(),
  ).optional(),
}).loose();

/** 待清理记录文件的 zod schema（原 `zk`）。 */
const pendingSourceDmgSchema: any = objectSchema({ sourceDmgPath: stringSchema() }).loose();

// ---- 类型 -------------------------------------------------------------------

/** hdiutil 挂载镜像（image-path + 全部 mount-point）。 */
interface MountedDiskImage {
  imagePath: string;
  mountPoints: string[];
}

/** 安装器窗口句柄（原 `Kk` 的返回值）。 */
export interface InstallerWindow {
  /** 解锁窗口关闭按钮（进入终态后允许用户关窗并退出 app）。 */
  allowClose(): void;
  /** 更新窗口状态文案（渲染侧 window.setInstallerStatus）。 */
  setStatus(status: InstallerStatus): Promise<void>;
}

/** moveToApplicationsFolder 的结果（原 `Hk` 返回值）。 */
export type MoveToApplicationsFolderResult = `unavailable` | `moved` | `canceled`;

/** `Bk` 的可注入依赖（全部可选，默认为本模块实现）。 */
export interface EnsureInstalledInApplicationsOptions {
  clearPendingSourceDmgPath?: () => void;
  copyAppBundleToApplicationsFolder?: (sourceBundlePath: string) => Promise<string | null>;
  detachSourceDmg?: (imagePath: string) => boolean;
  getCurrentAppBundlePath?: () => string;
  getPendingSourceDmgPath?: () => string | null;
  getSourceDmgPath?: () => string | null;
  isApplicationsFolderWritable?: () => boolean;
  isPackaged?: boolean;
  openInstalledAppBundle?: (bundlePath: string) => Promise<boolean>;
  platform?: string;
  quitCurrentApp?: () => void;
  relocateLegacyChatGptApp?: (bundlePath: string) => RelocateLegacyChatGptAppResult;
  setPendingSourceDmgPath?: (sourceDmgPath: string) => void;
  showInstallerWindow?: () => Promise<InstallerWindow>;
  sourceDmgExists?: (path: string) => boolean;
  trashItem?: (path: string) => Promise<void>;
  isInApplicationsFolder?: () => boolean;
  moveAppBundleToApplicationsFolder?: (allowClose: () => void) => MoveToApplicationsFolderResult;
}

// ---- 主 gate ----------------------------------------------------------------

/**
 * macOS Applications 安装 gate（原 `Bk`）。返回 true 表示当前实例应终止启动
 * （已交给新装实例 / 安装失败等待用户处理）；false 表示正常继续启动。
 */
export async function ensureInstalledInApplications(
  {
    clearPendingSourceDmgPath = clearPendingSourceDmgRecord,
    copyAppBundleToApplicationsFolder = copyAppBundleToApplicationsFolderWithDitto,
    detachSourceDmg = detachSourceDmgImage,
    getCurrentAppBundlePath = appBundlePath,
    getPendingSourceDmgPath = getPendingSourceDmgRecord,
    getSourceDmgPath = findSourceDmgPath,
    isApplicationsFolderWritable = isApplicationsFolderWritableByCurrentUser,
    isPackaged = app.isPackaged,
    openInstalledAppBundle = openInstalledAppBundleWithOpen,
    platform = process.platform,
    quitCurrentApp = () => app.quit(),
    relocateLegacyChatGptApp: relocateLegacy = relocateLegacyChatGptApp,
    setPendingSourceDmgPath = setPendingSourceDmgRecord,
    showInstallerWindow = createInstallerWindow,
    sourceDmgExists = existsSync,
    trashItem = (path) => shell.trashItem(path),
    isInApplicationsFolder = () => isAppBundleInApplicationsFolder({ getCurrentAppBundlePath }),
    moveAppBundleToApplicationsFolder = moveAppBundleWithElectron,
  }: EnsureInstalledInApplicationsOptions = {},
): Promise<boolean> {
  if (platform !== `darwin` || !isPackaged) return false;
  // 已安装：只需清理上次安装可能遗留的源 DMG。
  if (isInApplicationsFolder())
    return (
      await cleanupPendingSourceDmg({
        clearPendingSourceDmgPath,
        detachSourceDmg,
        getPendingSourceDmgPath,
        sourceDmgExists,
        trashItem,
      }),
      false
    );
  const sourceDmgPath = tryFindSourceDmgPath(getSourceDmgPath);
  if (sourceDmgPath == null) return false;
  const installerWindow = await showInstallerWindow();
  tryRememberSourceDmgPath({ setPendingSourceDmgPath, sourceDmgPath });
  let restoreLegacyApp: (() => void) | null = null;
  try {
    const currentBundlePath = getCurrentAppBundlePath();
    const relocation = relocateLegacy(currentBundlePath);
    switch (relocation.status) {
      case `blocked`:
        return (clearPendingSourceDmgPath(), await installerWindow.setStatus(`failed`), true);
      case `not-needed`:
        break;
      case `relocated`:
        restoreLegacyApp = relocation.restore;
    }
    switch (moveAppBundleToApplicationsFolder(installerWindow.allowClose)) {
      case `moved`:
        return ((restoreLegacyApp = null), true);
      case `canceled`:
        return (clearPendingSourceDmgPath(), await installerWindow.setStatus(`failed`), true);
    }
    if (!isApplicationsFolderWritable())
      return (clearPendingSourceDmgPath(), await installerWindow.setStatus(`failed`), true);
    const installedPath = await copyAppBundleToApplicationsFolder(currentBundlePath);
    return installedPath == null
      ? (clearPendingSourceDmgPath(), await installerWindow.setStatus(`failed`), true)
      : ((restoreLegacyApp = null),
        await installerWindow.setStatus(`opening`),
        (await openInstalledAppBundle(installedPath))
          ? (quitCurrentApp(), true)
          : (await installerWindow.setStatus(`openFailed`), true));
  } catch (error) {
    return (
      clearPendingSourceDmgPath(),
      getLogger().warning(`Failed to install app in Applications folder`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      await installerWindow.setStatus(`failed`),
      true
    );
  } finally {
    restoreLegacyApp?.();
  }
}

// ---- Applications 目录探测（原 Vk/Uk/lA）------------------------------------

/**
 * 判断当前 app 是否已在 /Applications（原 `Vk`）：优先 Electron 原生
 * `app.isInApplicationsFolder`，异常或不存在时回退到路径包含判断。
 */
export function isAppBundleInApplicationsFolder({
  getCurrentAppBundlePath,
}: {
  getCurrentAppBundlePath: () => string;
}): boolean {
  try {
    if (`isInApplicationsFolder` in app) return app.isInApplicationsFolder();
  } catch (error) {
    getLogger().warning(`Failed to check app Applications folder status`, {
      safe: { errorType: error instanceof Error ? error.name : typeof error },
      sensitive: {},
    });
  }
  try {
    return isPathInside(getCurrentAppBundlePath(), `/Applications`);
  } catch {
    return false;
  }
}

/**
 * Electron 原生移动到 /Applications（原 `Hk`）：移动前先释放单实例锁并解锁
 * 安装窗口关闭（系统对话框期间用户可能关掉旧实例）；取消/失败后重新抢锁。
 */
export function moveAppBundleWithElectron(
  allowClose: () => void,
): MoveToApplicationsFolderResult {
  if (!(`moveToApplicationsFolder` in app)) return `unavailable`;
  app.releaseSingleInstanceLock();
  allowClose();
  try {
    const moved = app.moveToApplicationsFolder();
    return (moved || app.requestSingleInstanceLock(), moved ? `moved` : `canceled`);
  } catch (error) {
    throw (app.requestSingleInstanceLock(), error);
  }
}

/** /Applications 是否可写（原 `Uk`）。 */
export function isApplicationsFolderWritableByCurrentUser(): boolean {
  try {
    return (accessSync(`/Applications`, fsConstants.W_OK), true);
  } catch {
    return false;
  }
}

// ---- ditto 复制 / open 启动（原 Wk/Gk/Jk）-----------------------------------

/**
 * ditto 复制 bundle 到 /Applications（原 `Wk`）：先清掉历史 staging 目录，
 * 复制到隐藏的 `.…codex-installing-<pid>` staging，已有同名目标先移废纸篓，
 * 最后 rename staging → 目标。失败时清理 staging 并返回 null。
 * 仅当当前 execPath 就在源 bundle 内时才执行（否则返回 null）。
 */
export async function copyAppBundleToApplicationsFolderWithDitto(
  sourceBundlePath: string,
): Promise<string | null> {
  if (!isPathInside(process.execPath, sourceBundlePath)) return null;
  const targetPath = join(`/Applications`, basename(sourceBundlePath));
  const stagingPath = join(
    `/Applications`,
    `.${basename(sourceBundlePath)}.codex-installing-${process.pid}`,
  );
  try {
    return (
      rmSync(stagingPath, { force: true, recursive: true }),
      await execFileAsync(`/usr/bin/ditto`, [sourceBundlePath, stagingPath]),
      existsSync(targetPath) && (await shell.trashItem(targetPath)),
      renameSync(stagingPath, targetPath),
      targetPath
    );
  } catch (error) {
    return (
      removeStagingAppBundle(stagingPath),
      getLogger().warning(`Failed to copy app bundle to Applications folder`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      null
    );
  }
}

/** `open -n` 启动新装的 bundle（原 `Gk`）；启动前释放单实例锁。 */
export async function openInstalledAppBundleWithOpen(bundlePath: string): Promise<boolean> {
  try {
    return (app.releaseSingleInstanceLock(), await execFileAsync(`/usr/bin/open`, [`-n`, bundlePath]), true);
  } catch (error) {
    return (
      getLogger().warning(`Failed to launch installed app bundle`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      false
    );
  }
}

/** 删除复制失败遗留的 staging 目录（原 `Jk`）。 */
function removeStagingAppBundle(stagingPath: string): void {
  try {
    rmSync(stagingPath, { force: true, recursive: true });
  } catch (error) {
    getLogger().warning(`Failed to remove staging app bundle`, {
      safe: { errorType: error instanceof Error ? error.name : typeof error },
      sensitive: {},
    });
  }
}

// ---- 安装器窗口（原 Kk/qk）---------------------------------------------------

/**
 * 创建安装器窗口（原 `Kk`）：420x176 不可调整的小窗，data: URL 加载内嵌 HTML；
 * 未进入终态前禁止关闭；窗口销毁时（已允许关闭）退出 app。
 */
export async function createInstallerWindow(): Promise<InstallerWindow> {
  let allowCloseRequested = false;
  const window = new BrowserWindow({
    width: 420,
    height: 176,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    closable: false,
    show: false,
    title: `Installing ${app.getName()}`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: false,
    },
  });
  const allowClose = () => {
    allowCloseRequested = true;
    window.setClosable(true);
  };
  window.setMenuBarVisibility(false);
  window.on(`close`, (event) => {
    allowCloseRequested || event.preventDefault();
  });
  window.on(`closed`, () => {
    allowCloseRequested && app.quit();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: `deny` }));
  window.webContents.on(`will-navigate`, (event) => {
    event.preventDefault();
  });
  await window.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(installerWindowHtml(app.getName()))}`,
  );
  window.isDestroyed() || (positionInstallerWindowAtCursor(window), window.show(), window.focus());
  return {
    allowClose,
    setStatus: async (status) => {
      window.isDestroyed() ||
        (allowClose(),
        await window.webContents.executeJavaScript(
          `window.setInstallerStatus(${JSON.stringify(status)})`,
        ));
    },
  };
}

/** 把窗口挪到光标所在工作区中心（贴右下边界钳制，原 `qk`）。 */
function positionInstallerWindowAtCursor(window: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(cursorPoint);
  const { width, height } = window.getBounds();
  const maxX = workArea.x + Math.max(0, workArea.width - width);
  const maxY = workArea.y + Math.max(0, workArea.height - height);
  const x = Math.min(maxX, Math.max(workArea.x, Math.round(cursorPoint.x - width / 2)));
  const y = Math.min(maxY, Math.max(workArea.y, Math.round(cursorPoint.y - height / 2)));
  window.setPosition(x, y, false);
}

// ---- 源 DMG 定位与清理（原 Yk/Xk/Zk/Qk）--------------------------------------

/** 清理上次安装遗留的源 DMG（原 `Yk`）：记录存在且清理成功时删除记录。 */
async function cleanupPendingSourceDmg({
  clearPendingSourceDmgPath,
  detachSourceDmg,
  getPendingSourceDmgPath,
  sourceDmgExists,
  trashItem,
}: {
  clearPendingSourceDmgPath: () => void;
  detachSourceDmg: (imagePath: string) => boolean;
  getPendingSourceDmgPath: () => string | null;
  sourceDmgExists: (path: string) => boolean;
  trashItem: (path: string) => Promise<void>;
}): Promise<void> {
  const pendingPath = getPendingSourceDmgPath();
  pendingPath != null &&
    (await detachAndTrashSourceDmg({
      detachSourceDmg,
      sourceDmgExists,
      sourceDmgPath: pendingPath,
      trashItem,
    })) &&
    clearPendingSourceDmgPath();
}

/** 定位源 DMG，失败只记 warning（原 `Xk`）。 */
function tryFindSourceDmgPath(getSourceDmgPath: () => string | null): string | null {
  try {
    return getSourceDmgPath();
  } catch (error) {
    return (
      getLogger().warning(`Failed to find app source DMG`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      null
    );
  }
}

/** 持久化源 DMG 路径，失败只记 warning（原 `Zk`）。 */
function tryRememberSourceDmgPath({
  setPendingSourceDmgPath,
  sourceDmgPath,
}: {
  setPendingSourceDmgPath: (sourceDmgPath: string) => void;
  sourceDmgPath: string;
}): void {
  try {
    setPendingSourceDmgPath(sourceDmgPath);
  } catch (error) {
    getLogger().warning(`Failed to remember app source DMG for cleanup`, {
      safe: { errorType: error instanceof Error ? error.name : typeof error },
      sensitive: {},
    });
  }
}

/**
 * detach 源 DMG 并移到废纸篓（原 `Qk`）：detach 最多重试 25 次
 * （间隔 250ms）；文件已不存在视为成功。
 */
async function detachAndTrashSourceDmg({
  detachSourceDmg,
  sourceDmgExists,
  sourceDmgPath,
  trashItem,
}: {
  detachSourceDmg: (imagePath: string) => boolean;
  sourceDmgExists: (path: string) => boolean;
  sourceDmgPath: string;
  trashItem: (path: string) => Promise<void>;
}): Promise<boolean> {
  if (!sourceDmgExists(sourceDmgPath)) return true;
  let detached = false;
  for (let attempt = 1; attempt <= DMG_DETACH_MAX_ATTEMPTS; attempt += 1) {
    try {
      if (detachSourceDmg(sourceDmgPath)) {
        detached = true;
        break;
      }
    } catch {}
    attempt < DMG_DETACH_MAX_ATTEMPTS && (await sleep(DMG_DETACH_RETRY_DELAY_MS));
  }
  if (!detached)
    return (getLogger().warning(`Failed to detach app source DMG after retries`), false);
  try {
    return (await trashItem(sourceDmgPath), true);
  } catch (error) {
    return (
      getLogger().warning(`Failed to move app source DMG to Trash`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      false
    );
  }
}

// ---- 待清理记录文件（原 $k/eA/tA/nA）-----------------------------------------

/** 读取待清理记录（原 `$k`）：文件不存在 / 解析失败返回 null。 */
function getPendingSourceDmgRecord(): string | null {
  const filePath = pendingSourceDmgCleanupFilePath();
  if (!existsSync(filePath)) return null;
  try {
    return pendingSourceDmgSchema.parse(JSON.parse(readFileSync(filePath, `utf8`))).sourceDmgPath;
  } catch (error) {
    return (
      getLogger().warning(`Failed to read pending app source DMG cleanup`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      null
    );
  }
}

/** 写入待清理记录（原 `eA`）。 */
function setPendingSourceDmgRecord(sourceDmgPath: string): void {
  const filePath = pendingSourceDmgCleanupFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify({ sourceDmgPath })}\n`, `utf8`);
}

/** 删除待清理记录（原 `tA`）。 */
function clearPendingSourceDmgRecord(): void {
  rmSync(pendingSourceDmgCleanupFilePath(), { force: true });
}

/** 记录文件路径（原 `nA`）：userData/pending-source-dmg-cleanup.json。 */
function pendingSourceDmgCleanupFilePath(): string {
  return join(app.getPath(`userData`), PENDING_SOURCE_DMG_CLEANUP_FILENAME);
}

// ---- hdiutil 挂载查询（原 rA/iA/aA/oA/sA）-----------------------------------

/**
 * 定位当前 bundle 所属的源 DMG（原 `rA`）：bundle 在 /Volumes 下时，
 * 在 hdiutil 挂载表中查找包含该 bundle 的 .dmg 镜像，否则 null。
 */
function findSourceDmgPath(): string | null {
  const bundlePath = appBundlePath();
  return bundlePath.startsWith(`/Volumes/`)
    ? findMountedDmgImagePath(bundlePath, listMountedDiskImages())
    : null;
}

/**
 * 在挂载表中找包含 bundlePath 的 .dmg（原 `iA`）：多个挂载点命中时取
 * 最长挂载点（最具体的镜像）。
 */
function findMountedDmgImagePath(
  bundlePath: string,
  mountedImages: MountedDiskImage[],
): string | null {
  let matchingImage: MountedDiskImage | null = null;
  let longestMountPoint = ``;
  for (const image of mountedImages)
    if (extname(image.imagePath).toLowerCase() === `.dmg`)
      for (const mountPoint of image.mountPoints)
        isPathInside(bundlePath, mountPoint) &&
          mountPoint.length > longestMountPoint.length &&
          ((matchingImage = image), (longestMountPoint = mountPoint));
  return matchingImage?.imagePath ?? null;
}

/** `hdiutil info` + `plutil` 转 JSON，列出有挂载点的镜像（原 `aA`）。 */
function listMountedDiskImages(): MountedDiskImage[] {
  const plist = execFileSync(`/usr/bin/hdiutil`, [`info`, `-plist`]);
  const json = execFileSync(`/usr/bin/plutil`, [`-convert`, `json`, `-o`, `-`, `-`], {
    encoding: `utf8`,
    input: plist,
  });
  return (hdiutilInfoSchema.parse(JSON.parse(json)).images ?? []).flatMap(
    (image: { "image-path"?: string; "system-entities"?: { "mount-point"?: string }[] }) => {
      if (image[`image-path`] == null) return [];
      const mountPoints = (image[`system-entities`] ?? []).flatMap((entity) =>
        entity[`mount-point`] == null ? [] : [entity[`mount-point`]],
      );
      return mountPoints.length === 0
        ? []
        : [{ imagePath: image[`image-path`] as string, mountPoints }];
    },
  );
}

/**
 * detach 镜像的全部挂载点（原 `oA`）：遍历挂载表，路径与目标一致的镜像
 * 的每个挂载点都 detach 成功才返回 true（目标不在挂载表中也返回 true）。
 */
function detachSourceDmgImage(imagePath: string): boolean {
  for (const image of listMountedDiskImages())
    if (resolve(image.imagePath) === resolve(imagePath)) {
      for (const mountPoint of image.mountPoints) if (!detachMountPoint(mountPoint)) return false;
    }
  return true;
}

/** detach 单个挂载点（原 `sA`）。 */
function detachMountPoint(mountPoint: string): boolean {
  try {
    return (execFileSync(`/usr/bin/hdiutil`, [`detach`, mountPoint]), true);
  } catch {
    return false;
  }
}

// ---- 路径工具（原 lA）--------------------------------------------------------

/** 判断 path 是否位于 directory 内（含相等，原 `lA`）。 */
export function isPathInside(path: string, directory: string): boolean {
  const relativePath = relative(directory, path);
  return (
    relativePath === `` ||
    (!!relativePath && !relativePath.startsWith(`..`) && !isAbsolute(relativePath))
  );
}
