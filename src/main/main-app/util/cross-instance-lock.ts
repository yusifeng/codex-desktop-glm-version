// 跨实例互斥锁（claim 目录协议）。
//
// 对应 main-C-Mhak1n.ts 80,642-80,759：
//   - 锁名枚举（AN）：custom-runtime / global-dictation / hotkey-window
//   - jN acquireCrossInstanceLock：claim 目录 + owner.json + 1s 心跳 + pid 存活
//   - 优先级抢占（priority）：高优先级可夺走陈旧/死进程的锁
//   - 锁路径（mje）：global-dictation 在 tmpdir，其余在 ~/.codex/cross-instance-locks
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir, homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { wf as objectSchema, Cf as numberSchema, Of as stringSchema } from "@chunk/shared";

// ---------------------------------------------------------------------------
// 常量（原 `AN`/`cje`~`fje`）
// ---------------------------------------------------------------------------

/** 锁名枚举（原 `AN`）。 */
export const CROSS_INSTANCE_LOCKS = {
  customRuntime: "custom-runtime",
  globalDictation: "global-dictation",
  hotkeyWindow: "hotkey-window",
} as const;

const HEARTBEAT_INTERVAL_MS = 1e3;
const CLAIM_SUFFIX = ".claim";
const OWNER_FILENAME = "owner.json";
/** 无 owner 的锁视为活跃的窗口（原 `dje`）。 */
const FRESH_WINDOW_MS = 5e3;
const GLOBAL_DICTATION_LOCK_FILENAME = "codex-global-dictation-window.lock";

const ownerSchema = objectSchema({
  pid: (numberSchema() as unknown as { int(): { positive(): unknown } }).int().positive(),
  priority: (numberSchema() as unknown as { default(value: number): unknown }).default(0),
  token: (stringSchema() as unknown as { min(n: number): unknown }).min(1),
});

interface LockOwner {
  pid: number;
  priority: number;
  token: string;
}

export interface CrossInstanceLock {
  dispose(): void;
  isOwner(): boolean;
}

// ---------------------------------------------------------------------------
// 工具（原 `LN`/`xje`/`RN`/`bje`/`yje`）
// ---------------------------------------------------------------------------

function errorCodeOf(error: unknown): string | null {
  return typeof error == "object" && error && "code" in error ? ((error as { code?: string }).code ?? null) : null;
}

function isDirectoryExistsError(error: unknown): boolean {
  return errorCodeOf(error) === "EEXIST";
}

function isNoSuchProcessError(error: unknown): boolean {
  return errorCodeOf(error) === "ESRCH";
}

/** pid 存活探测（原 `bje`）。 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !isNoSuchProcessError(error);
  }
}

/** 无 owner 时锁目录的新鲜度窗口（原 `yje`）。 */
function isLockFresh(lockPath: string): boolean {
  try {
    const stats = statSync(lockPath);
    return Date.now() - stats.mtimeMs < FRESH_WINDOW_MS;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// owner.json 读写（原 `FN`/`IN`/`_je`/`NN`/`vje`）
// ---------------------------------------------------------------------------

function ownerFilePath(lockPath: string): string {
  return join(lockPath, OWNER_FILENAME);
}

/** 读 owner（损坏视为无主，原 `FN`）。 */
function readLockOwner(lockPath: string): LockOwner | null {
  try {
    const content = readFileSync(ownerFilePath(lockPath), "utf8");
    return (ownerSchema as unknown as { parse(input: unknown): LockOwner }).parse(JSON.parse(content));
  } catch {
    return null;
  }
}

/** 写 owner（原 `_je`）。 */
function writeLockOwner(lockPath: string, owner: LockOwner): void {
  writeFileSync(ownerFilePath(lockPath), `${JSON.stringify(owner, null, 2)}\n`);
}

/** token 匹配判定（原 `NN`）。 */
function ownsLock(lockPath: string, token: string): boolean {
  return readLockOwner(lockPath)?.token === token;
}

/** 释放（仅 token 匹配时，原 `vje`）。 */
function releaseLock(lockPath: string, token: string): void {
  if (ownsLock(lockPath, token)) rmSync(lockPath, { force: true, recursive: true });
}

// ---------------------------------------------------------------------------
// 获取（原 `jN`/`hje`/`MN`/`gje`/`PN`/`mje`）
// ---------------------------------------------------------------------------

/** 锁路径（原 `mje`）：global-dictation 在 tmpdir，其余在 ~/.codex。 */
function lockPathFor(name: string): string {
  return name === CROSS_INSTANCE_LOCKS.globalDictation
    ? join(tmpdir(), GLOBAL_DICTATION_LOCK_FILENAME)
    : join(homedir(), ".codex", "cross-instance-locks", `${name}.lock`);
}

/** 锁是否可被抢占（原 `PN`）：无 owner 看 fresh 窗口，有 owner 看 pid 存活。 */
function isLockStale(lockPath: string, owner: LockOwner | null): boolean {
  return owner == null ? !isLockFresh(lockPath) : !isProcessAlive(owner.pid);
}

/** 直接建锁目录 + 写 owner（原 `MN`）。 */
function createLockDirectory(lockPath: string, owner: LockOwner): boolean {
  try {
    mkdirSync(lockPath, { mode: 0o700, recursive: false });
  } catch (error) {
    if (isDirectoryExistsError(error)) return false;
    throw error;
  }
  try {
    writeLockOwner(lockPath, owner);
    return true;
  } catch (error) {
    throw (rmSync(lockPath, { force: true, recursive: true }), error);
  }
}

/** 获取尝试（原 `hje`）：claim 目录防并发 + 优先级/陈旧判定。 */
function tryAcquire(lockPath: string, owner: LockOwner, force: boolean): boolean {
  if (ownsLock(lockPath, owner.token)) return true;
  const currentOwner = readLockOwner(lockPath);
  if (!force && !isLockStale(lockPath, currentOwner) && owner.priority <= (currentOwner?.priority ?? 0))
    return false;
  // claim 目录：并发获取的互斥点（原 `${lockPath}.claim`）。
  const claimPath = `${lockPath}${CLAIM_SUFFIX}`;
  try {
    mkdirSync(claimPath, { mode: 0o700, recursive: false });
  } catch (error) {
    if (isDirectoryExistsError(error)) return false;
    throw error;
  }
  try {
    // claim 期间 owner 可能变化：重读复核。
    const ownerAfterClaim = readLockOwner(lockPath);
    return currentOwner?.token === ownerAfterClaim?.token || force || isLockStale(lockPath, ownerAfterClaim)
      ? (rmSync(lockPath, { force: true, recursive: true }), createLockDirectory(lockPath, owner))
      : false;
  } finally {
    rmSync(claimPath, { force: true, recursive: true });
  }
}

/**
 * 获取跨实例锁（原 `jN`）。
 *
 * 心跳每秒检查一次 owner token，丢失（被更高优先级抢占）时回调 onLost。
 * dispose 时仅在本实例仍持有（token 匹配）才删除锁目录。
 */
export function acquireCrossInstanceLock({
  force = false,
  lockPath,
  name,
  onLost,
  priority = 0,
}: {
  force?: boolean;
  lockPath?: string;
  name: string;
  onLost: () => void;
  priority?: number;
}): CrossInstanceLock | null {
  const resolvedLockPath = lockPath ?? lockPathFor(name);
  const owner = { pid: process.pid, priority, token: randomUUID() };
  mkdirSync(dirname(resolvedLockPath), { mode: 0o700, recursive: true });
  if (!tryAcquire(resolvedLockPath, owner, force)) return null;
  const isOwner = () => ownsLock(resolvedLockPath, owner.token);
  const heartbeat = setInterval(() => {
    if (!isOwner()) {
      clearInterval(heartbeat);
      onLost();
    }
  }, HEARTBEAT_INTERVAL_MS);
  (heartbeat as ReturnType<typeof setInterval> & { unref?(): void }).unref?.();
  return {
    dispose: () => {
      clearInterval(heartbeat);
      releaseLock(resolvedLockPath, owner.token);
    },
    isOwner,
  };
}
