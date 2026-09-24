// 尚未逆向重写的 chunk 的类型声明。
//
// 源码里写作 `import ... from "@chunk/<语义名>"` 的导入由 scripts/chunk-manifest.mjs
// 映射为对输出 chunk（app/.vite/build/<文件名>）的运行时 require。已重写的 chunk
// 直接声明其命名导出；未重写的 chunk 仍以发布版的单字母导出名提供（语义见注释），
// 导入时用 `import { t as createDesktopLogArchive } from "@chunk/main"` 的方式重命名。

declare module "@chunk/desktop-open-path-queue" {
  export type OpenFilesHandler = (paths: string[]) => void;

  /** 取走所有排队的 open-url 链接（标记 URL 队列已就绪）。 */
  export function takePendingUrls(): string[];
  /** 设置文件处理器并取走排队文件；handler 为空或已设置时无操作。 */
  export function setOpenFilesHandler(handler: OpenFilesHandler): string[];
  /** 文件路径入队（有 handler 时直接回调）。 */
  export function enqueueOpenFiles(paths: string[]): boolean;
  /** 注册 open-file / open-url 早期监听（返回反注册函数）。 */
  export function installEarlyOpenPathListeners(enabled: boolean): () => void;
  /** 释放文件处理器。 */
  export function releaseOpenFilesHandler(handler: OpenFilesHandler): void;
}

declare module "@chunk/logger" {
  export interface LogTags {
    safe: Record<string, unknown>;
    sensitive: Record<string, unknown>;
  }
  export type LogLevel = "trace" | "debug" | "info" | "warning" | "error";
  export interface Logger {
    trace(message: string, tags?: LogTags): void;
    debug(message: string, tags?: LogTags): void;
    info(message: string, tags?: LogTags): void;
    warning(message: string, tags?: LogTags): void;
    error(message: string, tags?: LogTags): void;
    log(level: LogLevel, message: string, tags?: LogTags): void;
    dispose?(): void;
  }
  export function setLogger(logger: Logger): void;
  export function getLogger(): Logger;
  export function createTaggedLogger(tag: string): Logger;
  export function memoizedTaggedLogger(tag: string): () => Logger;
  export function createElapsedTimestampLogger(tag: string): Logger;
  export function formatLogTags(tags: Record<string, unknown>): string;
}

declare module "@chunk/shared" {
  // src-DldfpmrL.js —— 主进程共享库：内嵌 zod（单字母导出）、PATH 可执行文件
  // 解析器等。schema 构建器对应 zod 的同名 API（object / discriminatedUnion /
  // literal / number / array / string）。
  export interface Schema<T = any> {
    safeParse(input: unknown): { success: boolean; data: T };
  }
  export interface NumberSchema<T = any> extends Schema<T> {
    positive(): NumberSchema<T>;
    min(n: number): NumberSchema<T>;
    max(n: number): NumberSchema<T>;
  }
  export interface ArraySchema<T = any> extends Schema<T> {
    length(n: number): ArraySchema<T>;
  }
  export const wf: (shape: Record<string, Schema>) => Schema;
  export const vf: (discriminator: string, options: Schema[]) => Schema;
  export const bf: (value: unknown) => Schema;
  export const Cf: () => NumberSchema;
  export const hf: (schema: Schema) => ArraySchema;
  export const Of: () => Schema;
  /** 按名字解析 PATH 上的可执行文件（带缓存），找不到返回 undefined。 */
  export const qn: {
    resolve(executable: string, opts?: { cwd?: string; env?: Record<string, string | undefined> }):
      | string
      | undefined;
  };
}

declare module "@chunk/main" {
  // main-C-Mhak1n.js —— 主进程主体。
  /** 创建桌面日志归档（feedback desktop log archive）。 */
  export const t: (
    now?: Date,
    extraPaths?: string[],
    opts?: { includeDesktopLogs?: boolean },
  ) => Promise<{ archiveId: string; filePaths: string[] } | null>;
  /** 删除桌面日志归档。 */
  export const n: (archiveId: string) => Promise<boolean>;
  export const runMainAppStartup: unknown;
}

declare module "@chunk/bootstrap" {
  // bootstrap-C4dRql4x.js —— 主进程引导（Sentry 初始化、自动更新等）。
  // 加载时执行引导逻辑，无有意义的导出。
  export {};
}
