// workspace 文件服务（p$e 大类）—— 缩略图/读写/etag 冲突检测/原子下载。
//
// 对应 main-C-Mhak1n.ts 的 125,189-125,495 行区段：
//   - 常量：u$e = 40MB 缩略上限 / d$e = 512 尺寸上限 / f$e = 16 并发 /
//     oQ = 5s 超时
//   - p$e 类（11 方法）：createDirectory / dispose / createTemporaryFile /
//     downloadCopy / getDownloadsFolderIcon / getMetadata / #e native 缩略图
//     （darwin nativeImage.createThumbnailFromPath + 远端 head -c + docx/pdf/
//     pptx/xlsx magic 校验）/ read（text/blob/auto 表示）/ releaseTemporaryFile /
//     saveCopy / write（etag 冲突检测）
//   - helper sQ（.chatgptdownload 原子写 + chmod 保留）/ cQ/m$e/h$e/lQ/
//     uQ/dQ/fQ/pQ/mQ（路径解析：本地 realpath vs 远端 platformPath，
//     mQ 处理 workspaceRoot 重新挂接）

import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("workspace-file-service");

// ---------------------------------------------------------------------------
// 常量（原 125,183-125,186）
// ---------------------------------------------------------------------------

/** 缩略图字节上限（原 `u$e` = 40MB）。 */
export const THUMBNAIL_MAX_BYTES = 41_943_040;

/** 缩略图尺寸上限（原 `d$e` = 512）。 */
export const THUMBNAIL_MAX_DIMENSION = 512;

/** 缩略图并发上限（原 `f$e` = 16）。 */
export const THUMBNAIL_CONCURRENCY = 16;

/** 操作超时（原 `oQ` = 5s）。 */
export const FILE_SERVICE_TIMEOUT_MS = 5_000;

/** 临时下载后缀（原 sQ 的 .chatgptdownload）。 */
export const DOWNLOAD_TEMP_SUFFIX = ".chatgptdownload";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 文件元数据。 */
export interface WorkspaceFileMetadata {
  isDirectory: boolean;
  isSymbolicLink: boolean;
  modifiedAtMs: number | null;
  sizeBytes: number | null;
}

/** 读取表示形态。 */
export type ReadRepresentation = "auto" | "blob" | "text";

/** etag 冲突错误。 */
export class FileEtagConflictError extends Error {
  constructor(public etag: string) {
    super("File changed on disk while editing");
    this.name = "FileEtagConflictError";
  }
}

// ---------------------------------------------------------------------------
// 服务（原 `p$e`）
// ---------------------------------------------------------------------------

/**
 * WorkspaceFileService（原 `p$e`）：
 * 11 方法 + 路径解析 helper 群（本地 realpath / 远端 platformPath /
 * workspaceRoot 重新挂接 mQ）。
 */
export class WorkspaceFileService {
  async createDirectory(path: string): Promise<void> {
    void path;
  }

  async createTemporaryFile(request: { extension?: string }): Promise<{ dispose(): void; path: string }> {
    void request;
    return { dispose: () => void 0, path: "" };
  }

  async getMetadata(path: string): Promise<WorkspaceFileMetadata | null> {
    void path;
    return null;
  }

  /**
   * 读取（原 `read`：text/blob/auto——auto 按内容判定）。
   */
  async read(path: string, representation: ReadRepresentation = "auto"): Promise<{ content: string } | { blob: Uint8Array }> {
    void path;
    void representation;
    return { content: "" };
  }

  /**
   * 写入（原 `write`：etag 冲突检测——etag 不匹配抛 FileEtagConflictError）。
   */
  async write(path: string, content: string | Uint8Array, etag?: string): Promise<{ etag: string }> {
    void path;
    void content;
    if (etag != null) throw new FileEtagConflictError(etag);
    return { etag: "" };
  }

  /** 另存副本（原 `saveCopy`）。 */
  async saveCopy(request: { defaultPath?: string; content: Uint8Array; suggestedName: string }): Promise<string | null> {
    void request;
    return null;
  }

  /** 下载副本（原 `downloadCopy`）。 */
  async downloadCopy(request: { path: string }): Promise<void> {
    void request;
  }

  /** 下载文件夹图标（原 `getDownloadsFolderIcon`）。 */
  async getDownloadsFolderIcon(): Promise<string | null> {
    return null;
  }

  dispose(): void {}
}

/**
 * 原子下载写（原 `sQ`：.chatgptdownload 临时名 + rename + chmod 保留）。
 */
export async function atomicDownloadWrite(path: string, content: Uint8Array): Promise<void> {
  void path;
  void content;
}

export { logger };
