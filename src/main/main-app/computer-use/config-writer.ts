// CUA（Computer Use App）config.json 写入器（原 main-C-Mhak1n.ts 8,334-8,453 行的
// `Die/Oie/kie/Aie/jie/es/Mie/Nie/ts/Pie/Fie/Iie/ns/Lie/Rie/zie/Bie/Vie/Hie/Uie/Wie/Gie/rs/Kie/qie/is`）。
//
// 职责：把 CUA overlay 需要的本地化/主题配置写入
// `<codexHome>/computer-use/config.json`（原子写：tmp 文件 + rename）。
// 内容：accentColor（跟随系统主题的 chrome 主题 accent，缺省 #339cff）、
// locale（设置覆盖 → app.getLocale() → en）、direction（Intl 判定 rtl/ltr）、
// strings（usingComputer / escToCancel，按 locales 目录的 JSON 本地化）。
//
// 写入经模块顶层串行队列 `configWriteQueuesByPath`（原 `ts`，8,342 行：
// Map<configPath, Promise>）逐次排队，失败不阻塞下一次写入。
//
// 对外入口 `scheduleComputerUseConfigWrite`（原 `ns`）：fire-and-forget，
// 失败仅告警——设置变更（appearance*/localeOverride，原 `Fie` 判定）与
// 线程启动路径都走它。
//
// 本模块无模块加载期副作用（空 Map + logger 构造）。

import { readFileSync } from "node:fs";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { app, nativeTheme } from "electron";
// @chunk/shared 的压缩名导出，按语义重命名导入：
//   Oi → resolveCodexHome（codex home 路径）
//   Fa → SETTINGS（设置描述符分组，localeOverride）
//   Ha → APPEARANCE_SETTINGS（外观设置分组，theme/light/darkChromeTheme）
import { Fa as SETTINGS, Ha as APPEARANCE_SETTINGS, Oi as resolveCodexHome } from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";

// 线程启动的 browser-use/node-repl 配置覆盖（原 `$o`，8,322-8,333）由
// misc/automation-thread-config.ts 实现；automations 按本模块路径导入，此处转发。
export { buildThreadStartConfigOverrides } from "../misc/automation-thread-config";

// ---- 常量（原 Die/Oie/kie/Aie/jie/es/Mie/Nie）------------------------------

/** overlay 主文案的 config 键（原 `Die`）。 */
const USING_COMPUTER_KEY = `computerUseOverlay.usingComputer`;
/** overlay 主文案默认值（原 `Oie`）。 */
const USING_COMPUTER_DEFAULT = `ChatGPT is using your computer`;
/** overlay 取消提示的 config 键（原 `kie`）。 */
const ESC_TO_CANCEL_KEY = `computerUseOverlay.escToCancel`;
/** overlay 取消提示默认值（原 `Aie`）。 */
const ESC_TO_CANCEL_DEFAULT = `Esc to cancel`;
/** CUA home 下的子目录名（原 `jie`）。 */
const COMPUTER_USE_DIR_NAME = `computer-use`;
/** 配置文件名（原 `es`）。 */
const CONFIG_FILE_NAME = `config.json`;
/** 默认 accent 颜色（原 `Mie`）。 */
const DEFAULT_ACCENT_COLOR = `#339cff`;
/** 默认 locale（原 `Nie`）。 */
const DEFAULT_LOCALE = `en`;

/**
 * config.json 写入串行队列（原 `ts`，模块顶层可变状态）：
 * configPath → 最近一次写入 promise。写前接续、写后清理。
 */
const configWriteQueuesByPath = new Map<string, Promise<unknown>>();

/** 具名 logger（原 `Pie`）。 */
const configLogger = memoizedTaggedLogger(`computer-use-config`);

/** 设置存储的最小面（bootstrap settings-store 的 getEffective）。 */
interface SettingsStoreLike {
  getEffective(key: string): unknown;
}

/** CUA overlay 配置内容。 */
export interface ComputerUseConfig {
  accentColor: string;
  direction: string;
  locale: string;
  strings: { usingComputer: string; escToCancel: string };
}

/**
 * 判定设置键是否触发 CUA 配置重写（原 `Fie`）：
 * appearance 主题/Chrome 主题与 localeOverride。
 */
export function isComputerUseOverlaySettingKey(key: string): boolean {
  return (
    key === `appearanceTheme` ||
    key === `appearanceLightChromeTheme` ||
    key === `appearanceDarkChromeTheme` ||
    key === `localeOverride`
  );
}

/**
 * 组装并写入 CUA 配置（原 `Iie`）。
 * isPackaged 缺省取 app.isPackaged；repoRoot 为 dev 模式的 locales 目录根。
 */
export async function writeComputerUseConfig({
  settingsStore,
  isPackaged = app.isPackaged,
  repoRoot,
}: {
  settingsStore: SettingsStoreLike;
  isPackaged?: boolean;
  repoRoot: string;
}): Promise<void> {
  await writeConfigSerialized({
    codexHome: resolveCodexHome(),
    config: buildComputerUseConfig({
      settingsStore,
      locale: getAppLocale(),
      localesDir: resolveLocalesDirectory({ isPackaged, repoRoot }),
      shouldUseDarkColors: shouldUseDarkColors(),
    }),
  });
}

/**
 * fire-and-forget 写入（原 `ns`）：失败仅告警。
 * 供设置变更通知与线程启动路径消费。
 */
export function scheduleComputerUseConfigWrite({
  settingsStore,
  isPackaged,
  repoRoot,
}: {
  settingsStore: SettingsStoreLike;
  isPackaged?: boolean;
  repoRoot: string;
}): void {
  writeComputerUseConfig({ settingsStore, isPackaged, repoRoot }).catch((error) => {
    configLogger().warning(`Failed to write Computer Use config`, {
      safe: {},
      sensitive: { error },
    });
  });
}

/** `ns` 的别名导出（automations 线程启动路径按此名消费）。 */
export const writeComputerUseConfigSafe = scheduleComputerUseConfigWrite;

/** 组装配置内容（原 `Lie`）。 */
function buildComputerUseConfig({
  settingsStore,
  locale,
  localesDir,
  shouldUseDarkColors,
}: {
  settingsStore: SettingsStoreLike;
  locale: string;
  localesDir: string;
  shouldUseDarkColors: boolean;
}): ComputerUseConfig {
  const resolvedLocale =
    nonEmptyString(settingsStore.getEffective(SETTINGS.localeOverride.key)) ??
    nonEmptyString(locale) ??
    DEFAULT_LOCALE;
  const localeData = loadLocaleData(localesDir, resolvedLocale);
  return {
    accentColor: resolveAccentColor({ settingsStore, shouldUseDarkColors }),
    direction: localeDirection(resolvedLocale),
    locale: resolvedLocale,
    strings: {
      usingComputer: localizedString(localeData, USING_COMPUTER_KEY, USING_COMPUTER_DEFAULT),
      escToCancel: localizedString(localeData, ESC_TO_CANCEL_KEY, ESC_TO_CANCEL_DEFAULT),
    },
  };
}

/** app locale（无 getLocale 时回退 en）（原 `Rie`）。 */
function getAppLocale(): string {
  return typeof app.getLocale === `function` ? app.getLocale() : `en`;
}

/** 系统暗色判定（原 `zie`）。 */
function shouldUseDarkColors(): boolean {
  return nativeTheme?.shouldUseDarkColors === true;
}

/** locales 目录（打包态在 app 内，dev 在 repoRoot webview）（原 `Bie`）。 */
function resolveLocalesDirectory({ isPackaged, repoRoot }: { isPackaged: boolean; repoRoot: string }): string {
  return isPackaged
    ? join(app.getAppPath(), `native-menu-locales`)
    : join(repoRoot, `webview`, `src`, `locales`);
}

/**
 * 串行写入 config.json（原 `Vie`）：
 * 接续该路径上一次写入（失败吞掉）→ 执行写入 → 完成后清理队列项。
 * 返回 configPath。
 */
async function writeConfigSerialized({
  codexHome,
  config,
}: {
  codexHome: string;
  config: ComputerUseConfig;
}): Promise<string> {
  const dir = join(codexHome, COMPUTER_USE_DIR_NAME);
  const configPath = join(dir, CONFIG_FILE_NAME);
  const write = (configWriteQueuesByPath.get(configPath) ?? Promise.resolve())
    .catch(() => {})
    .then(() => writeConfigFileAtomic({ dir, configPath, config }));
  configWriteQueuesByPath.set(configPath, write);
  try {
    await write;
  } finally {
    if (configWriteQueuesByPath.get(configPath) === write) configWriteQueuesByPath.delete(configPath);
  }
  return configPath;
}

/** 原子写：tmp 文件 → rename；失败清理 tmp（原 `Hie`）。 */
async function writeConfigFileAtomic({
  dir,
  configPath,
  config,
}: {
  dir: string;
  configPath: string;
  config: ComputerUseConfig;
}): Promise<void> {
  const tmpPath = join(
    dir,
    `${CONFIG_FILE_NAME}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`,
  );
  await mkdir(dir, { recursive: true });
  try {
    await writeFile(tmpPath, `${JSON.stringify(config)}\n`, `utf8`);
    await rename(tmpPath, configPath);
  } catch (error) {
    await unlink(tmpPath).catch(() => {});
    throw error;
  }
}

/** 解析 accent 颜色（原 `Uie`）：按生效主题取 chrome 主题 accent，非法回退默认。 */
function resolveAccentColor({
  settingsStore,
  shouldUseDarkColors,
}: {
  settingsStore: SettingsStoreLike;
  shouldUseDarkColors: boolean;
}): string {
  const chromeTheme = (
    effectiveTheme(settingsStore.getEffective(APPEARANCE_SETTINGS.theme.key) ?? `system`, shouldUseDarkColors) === `light`
      ? settingsStore.getEffective(APPEARANCE_SETTINGS.lightChromeTheme.key)
      : settingsStore.getEffective(APPEARANCE_SETTINGS.darkChromeTheme.key)
  ) as { accent?: unknown } | null | undefined;
  const accent = chromeTheme?.accent;
  return isValidAccentColor(accent) ? accent : DEFAULT_ACCENT_COLOR;
}
/** system 主题按系统暗色解析（原 `Wie`）。 */
function effectiveTheme(theme: unknown, shouldUseDarkColors: boolean): string {
  return theme === `system` ? (shouldUseDarkColors ? `dark` : `light`) : (theme as string);
}

/** 加载 locale 的 JSON 数据（原 `Gie`；`xx-YY` 回退 `xx`，失败返回 null）。 */
function loadLocaleData(localesDir: string, locale: string): Record<string, unknown> | null {
  const dir = nonEmptyString(localesDir);
  if (dir == null) return null;
  const normalized = locale.replaceAll(`_`, `-`);
  const language = normalized.split(`-`)[0];
  const candidates = [
    join(dir, `${normalized}.json`),
    language && language !== normalized ? join(dir, `${language}.json`) : null,
  ];
  for (const candidate of candidates) {
    if (candidate == null) continue;
    try {
      const parsed = JSON.parse(readFileSync(candidate, `utf8`));
      if (typeof parsed === `object` && parsed && !Array.isArray(parsed)) return parsed;
    } catch {
      // 单个 locale 文件读失败跳过（原样吞掉）
    }
  }
  return null;
}

/** 取本地化字符串（原 `rs`）。 */
function localizedString(
  localeData: Record<string, unknown> | null,
  key: string,
  fallback: string,
): string {
  const value = localeData?.[key];
  return nonEmptyString(typeof value === `string` ? value : null) ?? fallback;
}

/** Intl 判定文字方向（原 `Kie`）。 */
function localeDirection(locale: string): string {
  try {
    const localeInstance = new Intl.Locale(locale.replaceAll(`_`, `-`));
    const direction =
      (Reflect.get(localeInstance, `textInfo`) as { direction?: string } | undefined)?.direction ??
      (localeInstance as any).getTextInfo?.().direction;
    return direction === `rtl` ? `rtl` : `ltr`;
  } catch {
    return `ltr`;
  }
}

/** #rrggbb 颜色校验（原 `qie`）。 */
function isValidAccentColor(color: unknown): color is string {
  return /^#[0-9a-fA-F]{6}$/.test(typeof color === `string` ? color : ``);
}

/** trim 后非空才保留，否则 null（原 `is`；非字符串值与原版同样抛 TypeError）。 */
function nonEmptyString(value: unknown): string | null {
  const trimmed = (value as string | undefined)?.trim();
  return trimmed || null;
}
