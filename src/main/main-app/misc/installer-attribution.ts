// installer 归因（原版 14,019-14,120 区段）。
//
// 职责：
//   - 读取 `~/Library/Application Support/com.openai.codex.installer` 下的
//     attribution.json / attribution-acknowledgment.json（原 $se 类）；
//   - 安全校验：目录属主 uid、权限位（group/other 位必须为 0）、文件大小
//     上限、O_NOFOLLOW 打开（防符号链接劫持）、installed_version 与当前
//     appVersion 一致、created_at 在 [-5min, +7day] 窗口内；
//   - acknowledge(installId)：写 `.attribution-ack-<uuid>.json`（wx 独占创建，
//     权限 0o600）后 rename 覆盖正式文件，失败也要 unlink 临时文件；
//   - 单例 + 懒加载工厂（原 iu / au()）：仅 darwin + isPackaged + Prod flavor
//     时创建——**不可提前求值**（首次调用时才触碰文件系统）。
//
// 同名异义陷阱（深析 §4/§7）：本模块的 `iu` 是 installer 归因单例；
// `n.iu`（@chunk/shared 的 global-state 键对象）是完全不同的对象，勿混淆。
// 消费方：175,957 附近 `new Foe(...readPending())`（激活归因管理器，区间外）。
//
// 依赖约束：node:fs/promises、node:path、node:fs（O_* 常量）、electron、
// @chunk/shared（EventEmitter 基类 + zod schema）、@chunk/bootstrap（BuildFlavor）。

import { open as fsOpen, lstat, rename, unlink } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { app } from "electron";
import {
  Uf as EventEmitterBase,
  Of as zString,
  bf as zLiteral,
  Pf as zUuid,
  Cf as zNumber,
  Df as zStrictObject,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";

/** 单个归因 JSON 文件的大小上限（字节，原 nu = 4096）。 */
const ATTRIBUTION_FILE_MAX_BYTES = 4096;

/** attribution 创建时间有效窗口上限（ms，原 Xse = 604,800,000 = 7 天）。 */
const ATTRIBUTION_MAX_AGE_MS = 604_800_000;

/** attribution 创建时间的允许回拨（未来）窗口（ms，原文 -3e5 = 5 分钟）。 */
const ATTRIBUTION_FUTURE_TOLERANCE_MS = 300_000;

/** install_id 等 id 字段 schema（原 ru）：1-128 字符、字母数字与 ._-+ 。 */
const idSchema = zString().min(1).max(128).regex(/^[a-zA-Z0-9._+-]+$/);

/** attribution.json schema（原 Zse）。 */
const attributionSchema = zStrictObject({
  schema_version: zLiteral(1),
  install_id: zUuid(),
  installer_stable_id: zUuid(),
  installer_session_id: zUuid(),
  installer_version: idSchema,
  installed_version: idSchema,
  created_at_ms: zNumber().int().nonnegative(),
});

/** attribution-acknowledgment.json schema（原 Qse）。 */
const acknowledgmentSchema = zStrictObject({
  schema_version: zLiteral(1),
  install_id: zUuid(),
  app_version: idSchema,
  acknowledged_at_ms: zNumber().int().nonnegative(),
});

/**
 * installer 归因读取/确认（原 $se，14,041-14,104；继承 shared 的 EventEmitter）。
 * 所有 I/O 失败一律静默（返回 undefined / false），不向上抛。
 */
export class InstallerAttribution extends EventEmitterBase {
  private directory: string;
  private appVersion: string;
  private now: () => number;

  constructor(directory: string, appVersion: string, now: () => number = Date.now) {
    super();
    this.directory = directory;
    this.appVersion = appVersion;
    this.now = now;
  }

  /** 读取待确认的 install_id（原 readPending，14,048-14,061）。 */
  async readPending(): Promise<string | undefined> {
    try {
      let dirStat = await lstat(this.directory);
      if (!dirStat.isDirectory() || dirStat.uid !== process.getuid?.() || dirStat.mode & 63)
        return;
      let attribution = attributionSchema.safeParse(
        await this.readPrivateJSON(`attribution.json`),
      );
      if (!attribution.success || attribution.data.installed_version !== this.appVersion) return;
      let age = this.now() - attribution.data.created_at_ms;
      if (age < -ATTRIBUTION_FUTURE_TOLERANCE_MS || age > ATTRIBUTION_MAX_AGE_MS) return;
      let acknowledged = acknowledgmentSchema.safeParse(
        await this.readPrivateJSON(`attribution-acknowledgment.json`),
      );
      return acknowledged.success && acknowledged.data.install_id === attribution.data.install_id
        ? undefined
        : attribution.data.install_id;
    } catch {
      return;
    }
  }

  /** 确认归因（原 acknowledge，14,062-14,084）：先复核 readPending 再原子落盘。 */
  async acknowledge(installId: string): Promise<void> {
    if ((await this.readPending()) !== installId) return;
    let tempPath = join(this.directory, `.attribution-ack-${randomUUID()}.json`);
    try {
      let handle = await fsOpen(tempPath, `wx`, 384); // 0o600
      try {
        await handle.writeFile(
          JSON.stringify({
            schema_version: 1,
            install_id: installId,
            app_version: this.appVersion,
            acknowledged_at_ms: this.now(),
          }),
        );
      } finally {
        await handle.close();
      }
      await rename(tempPath, join(this.directory, `attribution-acknowledgment.json`));
    } catch {
      // 落盘失败静默：下次启动会再次读到 pending。
    } finally {
      await unlink(tempPath).catch(() => {});
    }
  }

  /**
   * 私有 JSON 安全读取（原 readPrivateJSON，14,085-14,103）：
   * O_NOFOLLOW 防符号链接；属主 uid 校验；group/other 权限位必须为 0；
   * 4097 字节缓冲读入后按 4096 截断判定。
   */
  private async readPrivateJSON(fileName: string): Promise<unknown> {
    try {
      let handle = await fsOpen(
        join(this.directory, fileName),
        fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
      );
      try {
        let stat = await handle.stat();
        if (
          !stat.isFile() ||
          stat.uid !== process.getuid?.() ||
          stat.mode & 63 ||
          stat.size > ATTRIBUTION_FILE_MAX_BYTES
        )
          return;
        let buffer = Buffer.alloc(ATTRIBUTION_FILE_MAX_BYTES + 1);
        let { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        return bytesRead > ATTRIBUTION_FILE_MAX_BYTES
          ? undefined
          : JSON.parse(buffer.toString(`utf8`, 0, bytesRead));
      } finally {
        await handle.close();
      }
    } catch {
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// 单例（原 iu，14,105 + au()，14,106-14,120）
// ---------------------------------------------------------------------------

/** installer 归因单例（原 iu；仅 darwin + 打包态 + Prod 下存在）。 */
let installerAttributionSingleton: InstallerAttribution | null | undefined;

/**
 * 懒加载获取 installer 归因单例（原 au()，14,106-14,120）。
 * **必须保持懒求值**（深析 §7）：非 darwin / 未打包 / 非 Prod 时永远返回
 * undefined，且首次调用才构造实例（读文件系统的失败时机不可提前）。
 */
export function getInstallerAttribution(): InstallerAttribution | null | undefined {
  if (process.platform === `darwin` && app.isPackaged && BuildFlavor.resolve() === BuildFlavor.Prod)
    return (
      (installerAttributionSingleton ??= new InstallerAttribution(
        join(app.getPath(`home`), `Library`, `Application Support`, `com.openai.codex.installer`),
        app.getVersion(),
      )),
      installerAttributionSingleton
    );
}
