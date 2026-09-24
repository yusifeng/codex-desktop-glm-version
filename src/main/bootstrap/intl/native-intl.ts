// 原生菜单文案（NativeIntl）：从打包的 native-menu-locales 目录（开发时为
// webview/src/locales）加载 locale → {messageId → message} 的 JSON，支持
// 热替换（replaceMessagesFrom）与 {var} 插值。
// 模块级状态（原 A/He，310-311 行）：当前缓存与配置调用代数，并发配置以
// 最后一次调用为准。
// 对应 bootstrap-C4dRql4x.ts 77 行（oe）、309-369 行（Ve/A/He/Ue/We/Ge）。
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { app } from "electron";
import { Ef as recordSchema, Of as stringSchema } from "@chunk/shared";

/** 语言 → 具体区域文案的回退表（原 oe）。 */
const LOCALE_FALLBACKS: Record<string, string> = {
  es: "es-419",
  fr: "fr-FR",
  pt: "pt-BR",
  zh: "zh-CN",
};

/** messages JSON 的 schema：messageId → message（原 Ve）。 */
export const nativeIntlMessagesSchema: any = recordSchema(stringSchema(), stringSchema());

interface NativeIntlState {
  /** 配置成功时为 repoRoot，失败回退时为 null（原 A.repoRoot）。 */
  repoRoot: string | null;
  locale: string;
  nativeIntl: NativeIntl;
}

let nativeIntlState: NativeIntlState | null = null; // 原 A
let configureGeneration = 0; // 原 He

/**
 * 配置 NativeIntl（原 Ue）：加载 locale 并缓存；并发调用以最后一次为准
 * （旧代数的结果直接丢弃）。加载失败时回退到空文案（保留已替换的实例）。
 */
export async function configureNativeIntl(repoRoot: string, locale?: string): Promise<void> {
  const generation = ++configureGeneration;
  let resolvedLocale = locale;
  try {
    resolvedLocale ??= app.getLocale();
    if (nativeIntlState?.repoRoot === repoRoot && nativeIntlState.locale === resolvedLocale)
      return;
    const loaded = await NativeIntl.load(repoRoot, resolvedLocale);
    if (generation !== configureGeneration) return;
    const existing = nativeIntlState?.nativeIntl;
    existing?.replaceMessagesFrom(loaded);
    nativeIntlState = { repoRoot, locale: resolvedLocale, nativeIntl: existing ?? loaded };
  } catch {
    if (generation !== configureGeneration) return;
    const fallback = NativeIntl.createDefault();
    const existing = nativeIntlState?.nativeIntl;
    existing?.replaceMessagesFrom(fallback);
    nativeIntlState = { repoRoot: null, locale: resolvedLocale ?? "en", nativeIntl: existing ?? fallback };
  }
}

/** 取已配置的 NativeIntl；尚未配置时抛错（原 We）。 */
export function requireNativeIntl(): NativeIntl {
  if (nativeIntlState == null) throw Error("NativeIntl has not been configured.");
  return nativeIntlState.nativeIntl;
}

export interface NativeIntlMessageValues {
  [name: string]: string;
}

export interface NativeIntlMessageDescriptor {
  messageId: string;
  defaultMessage: string;
  values?: NativeIntlMessageValues;
}

export class NativeIntl {
  messages: Record<string, string> | null;

  constructor(messages: Record<string, string> | null) {
    this.messages = messages;
  }

  /** 按候选顺序加载 locale JSON（语言 → 区域 → 回退表 → 最大化区域 → 语言），取第一个命中的。 */
  static async load(repoRoot: string, locale: string = app.getLocale()): Promise<NativeIntl> {
    const normalized = locale.trim().replace(/_/g, "-");
    const [language, region] = normalized.toLowerCase().split("-");
    const withRegion = region == null ? language : `${language}-${region.toUpperCase()}`;
    const maximizedRegion = language
      ? new Intl.Locale(language).maximize().region
      : undefined;
    const baseDir = app.isPackaged
      ? join(app.getAppPath(), "native-menu-locales")
      : join(repoRoot, "webview", "src", "locales");
    const candidates = Array.from(
      new Set([
        normalized,
        withRegion,
        LOCALE_FALLBACKS[language],
        maximizedRegion == null ? undefined : `${language}-${maximizedRegion}`,
        language,
      ]),
    )
      .filter((candidate) => candidate != null)
      .map((candidate) => join(baseDir, `${candidate}.json`));
    const loaded = await Promise.all(
      candidates.map(async (path) => {
        try {
          return nativeIntlMessagesSchema.parse(JSON.parse(await readFile(path, "utf-8")));
        } catch (error) {
          if (
            error instanceof Error &&
            "code" in error &&
            (error as NodeJS.ErrnoException).code === "ENOENT"
          )
            return null;
          throw error;
        }
      }),
    );
    return new NativeIntl(loaded.find((result) => result != null) ?? null);
  }

  static createDefault(): NativeIntl {
    return new NativeIntl(null);
  }

  /** 用另一份加载结果热替换当前文案（保留实例身份）。 */
  replaceMessagesFrom(other: NativeIntl): void {
    this.messages = other.messages;
  }

  /** 取 messageId 对应文案（缺失用 defaultMessage），并做 {name} 插值。 */
  formatMessage({ messageId, defaultMessage, values }: NativeIntlMessageDescriptor): string {
    return (this.messages?.[messageId] ?? defaultMessage).replace(
      /\{(\w+)\}/g,
      (match, name: string) => values?.[name] ?? match,
    );
  }
}
