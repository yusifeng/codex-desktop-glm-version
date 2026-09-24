// 旧版 ChatGPT.app 迁移（原 bootstrap-C4dRql4x.ts 24001-24091 行的
// `Dk/Ok/kk/Ak/jk/Mk/Nk`）。
//
// macOS 上 Codex 前身是 ChatGPT.app；用户把新 app 装到 /Applications 时，
// DMG 安装 gate（applications-installer）会先把旧版 ChatGPT.app 改名为
// ChatGPT Classic.app 腾出位置。迁移前必须满足：
//   - 新 bundle 本身名字是 ChatGPT.app（从 DMG 里跑出来的安装场景）；
//   - /Applications/ChatGPT.app 存在且是目录；
//   - 新 bundle 通过 OpenAI 签名校验（identifier com.openai.codex）；
//   - /Applications 里的旧版未通过新签名（说明是旧 app）、且不是新版已就位；
//   - 旧版通过 com.openai.chat 签名（防止把无关同名 app 改名）；
//   - /Applications/ChatGPT Classic.app 不存在；
//   - 旧版 Sparkle 更新器的 launchd 服务已停止（bootout）。
// 任一条件不满足返回 blocked（安装流程放弃移动），全部满足则 rename 并返回
// restore 回调（安装失败时把名字改回去）。

import { lstatSync, renameSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { getLogger } from "@chunk/logger";

/** 旧版 bundle 名（原 `Dk`）。 */
const LEGACY_BUNDLE_NAME = `ChatGPT.app`;
/** 迁移后的 bundle 名（原 `Ok`）。 */
const RELOCATED_BUNDLE_NAME = `ChatGPT Classic.app`;
/** 旧版 Sparkle 更新器注册在 launchd gui domain 的服务名（原 `kk`）。 */
const LEGACY_UPDATER_LAUNCHD_SERVICES = [
  `com.openai.chat-sparkle-updater`,
  `com.openai.chat-sparkle-progress`,
];
/** OpenAI 签名的 Team ID（原 `Ak`）。 */
const OPENAI_TEAM_ID = `2DC432GLL2`;

/** 迁移结果（原 `jk` 的返回值）。 */
export type RelocateLegacyChatGptAppResult =
  | { status: `not-needed` }
  | { status: `blocked` }
  | { status: `relocated`; restore: () => void };

/** `jk` 的可注入依赖（默认值为本模块实现）。 */
export interface RelocateLegacyChatGptAppOptions {
  /** Applications 目录，默认 `/Applications`。 */
  applicationsDirectory?: string;
  /** codesign 校验（默认 `Nk`）。 */
  hasExpectedOpenAISignature?: (bundlePath: string, identifier: string) => boolean;
  /** 停止旧版更新器服务（默认 `Mk`）。 */
  stopLegacyUpdater?: () => boolean;
}

/**
 * 迁移旧版 ChatGPT.app → ChatGPT Classic.app（原 `jk`）。
 * 任何一步抛错都记 warning 并返回 blocked（不中断安装主流程）。
 */
export function relocateLegacyChatGptApp(
  bundlePath: string,
  {
    applicationsDirectory = `/Applications`,
    hasExpectedOpenAISignature = verifyOpenAISignature,
    stopLegacyUpdater = stopLegacySparkleUpdaterServices,
  }: RelocateLegacyChatGptAppOptions = {},
): RelocateLegacyChatGptAppResult {
  if (basename(bundlePath) !== LEGACY_BUNDLE_NAME) return { status: `not-needed` };
  const legacyPath = join(applicationsDirectory, LEGACY_BUNDLE_NAME);
  const relocatedPath = join(applicationsDirectory, RELOCATED_BUNDLE_NAME);
  try {
    const legacyStat = lstatSync(legacyPath, { throwIfNoEntry: false });
    if (legacyStat == null) return { status: `not-needed` };
    if (!legacyStat.isDirectory() || !hasExpectedOpenAISignature(bundlePath, `com.openai.codex`))
      return { status: `blocked` };
    // /Applications 里已经是有新签名的 app：无需迁移。
    if (hasExpectedOpenAISignature(legacyPath, `com.openai.codex`)) return { status: `not-needed` };
    if (
      !hasExpectedOpenAISignature(legacyPath, `com.openai.chat`) ||
      lstatSync(relocatedPath, { throwIfNoEntry: false }) != null ||
      !stopLegacyUpdater() ||
      !hasExpectedOpenAISignature(legacyPath, `com.openai.chat`)
    )
      return { status: `blocked` };
    renameSync(legacyPath, relocatedPath);
  } catch (error) {
    return (
      getLogger().warning(`Failed to relocate legacy ChatGPT app`, {
        safe: { errorType: error instanceof Error ? error.name : typeof error },
        sensitive: {},
      }),
      { status: `blocked` }
    );
  }
  return {
    status: `relocated`,
    restore: () => {
      try {
        if (
          lstatSync(legacyPath, { throwIfNoEntry: false }) != null ||
          lstatSync(relocatedPath, { throwIfNoEntry: false }) == null
        )
          return;
        renameSync(relocatedPath, legacyPath);
      } catch (error) {
        getLogger().warning(`Failed to restore legacy ChatGPT app`, {
          safe: { errorType: error instanceof Error ? error.name : typeof error },
          sensitive: {},
        });
      }
    },
  };
}

/**
 * 停止旧版 Sparkle 更新器的 launchd 服务（原 `Mk`）：
 * 对 gui/<uid> 下每个旧服务先 `print` 探测（不存在则跳过），存在则 `bootout`。
 * 任一 launchctl 调用失败返回 false（迁移放弃）。
 */
export function stopLegacySparkleUpdaterServices(): boolean {
  if (typeof process.getuid != `function`) return false;
  const guiDomain = `gui/${process.getuid()}`;
  const domainStatus = spawnSync(`/bin/launchctl`, [`print`, guiDomain], { stdio: `ignore` });
  if (domainStatus.error != null || domainStatus.status !== 0) return false;
  for (const serviceName of LEGACY_UPDATER_LAUNCHD_SERVICES) {
    const serviceTarget = `${guiDomain}/${serviceName}`;
    const printStatus = spawnSync(`/bin/launchctl`, [`print`, serviceTarget], {
      stdio: `ignore`,
    });
    if (printStatus.error != null || printStatus.status == null) return false;
    if (printStatus.status !== 0) continue;
    const bootoutStatus = spawnSync(`/bin/launchctl`, [`bootout`, serviceTarget], {
      stdio: `ignore`,
    });
    if (bootoutStatus.error != null || bootoutStatus.status !== 0) return false;
  }
  return true;
}

/**
 * codesign 深度校验（原 `Nk`）：验证 bundle 由指定 identifier + OpenAI Team ID
 * 的证书签名（anchor apple generic）。校验失败（或 codesign 不存在）返回 false。
 */
export function verifyOpenAISignature(bundlePath: string, identifier: string): boolean {
  try {
    return (
      execFileSync(
        `/usr/bin/codesign`,
        [
          `--verify`,
          `--deep`,
          `--strict`,
          `-R=identifier "${identifier}" and anchor apple generic and certificate leaf[subject.OU] = "${OPENAI_TEAM_ID}"`,
          bundlePath,
        ],
        { stdio: `ignore` },
      ),
      true
    );
  } catch {
    return false;
  }
}
