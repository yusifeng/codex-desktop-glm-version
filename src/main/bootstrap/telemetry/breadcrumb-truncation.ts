// Sentry breadcrumb 数据截断：把超过 2 KiB 的 breadcrumb.data 裁剪到限额内，
// 超限的值替换为占位文案并记录被丢弃的键名。
// 另含桌面端 Sentry DSN（fe）与 release 名格式化（me），供 telemetry/desktop-sentry 使用。
// 对应 bootstrap-C4dRql4x.ts 77-129 行（pe/he/ge + 常量 ce/le/ue/de/fe + me）。

/** breadcrumb JSON 序列化后的最大长度（字符数与字节数同时限制，原 ce）。 */
const MAX_BREADCRUMB_BYTES = 2048;
/** breadcrumb.data 最多保留的顶层键数（原 le）。 */
const MAX_BREADCRUMB_KEYS = 20;
/** 最多记录的被省略键名数（原 ue）。 */
const MAX_OMITTED_KEY_NAMES = 20;
/** 超限值的占位文案（原 de）。 */
const TRUNCATED_PLACEHOLDER = "[Truncated: breadcrumb data exceeded 2 KiB]";

/** 桌面端 Sentry DSN（原 fe；desktop-sentry 的启动配置 / 初始化使用）。 */
export const SENTRY_DSN =
  "https://6719eaa18601933a26ac21499dcaba2f@o33249.ingest.us.sentry.io/4510999349821440";

interface Breadcrumb {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Sentry release 名：codex@<version>（原 me）。 */
export function sentryReleaseName(version: string): string {
  return `codex@${version}`;
}

/**
 * beforeBreadcrumb 式截断钩子（原 pe）：data 为空原样返回；data.arguments
 * 超限时先尝试替换为占位文案，否则对整个 data 做逐键裁剪。
 */
export function truncateBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const { data } = breadcrumb;
  if (data == null) return breadcrumb;
  if (!("arguments" in data && !fitsInBreadcrumbLimit(data.arguments))) {
    return fitsInBreadcrumbLimit(data)
      ? breadcrumb
      : { ...breadcrumb, data: truncateBreadcrumbData(data) };
  }
  const replaced = {
    ...data,
    arguments: TRUNCATED_PLACEHOLDER,
    codex_truncated_breadcrumb_data: true,
  };
  return fitsInBreadcrumbLimit(replaced)
    ? { ...breadcrumb, data: replaced }
    : { ...breadcrumb, data: truncateBreadcrumbData(data) };
}

/** 值序列化后是否在 2 KiB 限额内（原 he；无法序列化视为超限）。 */
function fitsInBreadcrumbLimit(value: unknown): boolean {
  try {
    const json = JSON.stringify(value);
    if (json == null || json.length > MAX_BREADCRUMB_BYTES) return false;
    return new TextEncoder().encode(json).byteLength <= MAX_BREADCRUMB_BYTES;
  } catch {
    return false;
  }
}

/**
 * 逐键裁剪 breadcrumb.data（原 ge）：按插入顺序保留能装下的键，超限键记入
 * codex_omitted_breadcrumb_data_keys（每键名截断到 128 字符，最多 20 个），
 * 超过 20 个键时追加 "[Additional keys omitted]"。
 */
function truncateBreadcrumbData(data: Record<string, unknown>): Record<string, unknown> {
  let kept: Record<string, unknown> = { codex_truncated_breadcrumb_data: true };
  const omittedKeys: string[] = [];
  let keyCount = 0;
  let hitKeyLimit = false;
  for (const key in data) {
    if (!Object.hasOwn(data, key)) continue;
    if (keyCount === MAX_BREADCRUMB_KEYS) {
      hitKeyLimit = true;
      break;
    }
    keyCount += 1;
    const value = data[key];
    const candidate = {
      ...kept,
      [key]: fitsInBreadcrumbLimit(value) ? value : TRUNCATED_PLACEHOLDER,
      codex_truncated_breadcrumb_data: true,
    };
    if (fitsInBreadcrumbLimit(candidate)) kept = candidate;
    else omittedKeys.push(key);
  }
  if (omittedKeys.length > 0 || hitKeyLimit) {
    const withOmitted = {
      ...kept,
      codex_omitted_breadcrumb_data_keys: [
        ...omittedKeys.slice(0, MAX_OMITTED_KEY_NAMES).map((key) => key.slice(0, 128)),
        ...(hitKeyLimit ? ["[Additional keys omitted]"] : []),
      ],
    };
    if (fitsInBreadcrumbLimit(withOmitted)) return withOmitted;
  }
  return kept;
}
