export interface PathValue {
  path: string;
}

export interface PreviewablePathValue extends PathValue {
  fsPath?: string;
  startLine?: number | null;
}

const missingFileErrorCodes = new Set(["ENOENT", "ENOTDIR"]);
const richFileExtension = /\.(csv|docx|ipynb|pdf|pptx|tex|tsv|xlsm|xlsx)$/i;
const imageMimeTypes = new Set(["image/gif", "image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-png"]);
const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

/** 原 `GBe` / 压缩导出 `bU`。 */
export function isDirectoryPath(value: PathValue): boolean {
  return /[\\/]$/.test(value.path);
}

/** 原 `KBe` / 压缩导出 `xU`。 */
export function isRichFilePath(value: PreviewablePathValue): boolean {
  return (
    value.startLine == null &&
    richFileExtension.test(value.fsPath || value.path)
  );
}

/** 原 `JBe` / 压缩导出 `_U`。 */
export function isMissingFileError(value: unknown): boolean {
  if (!(value instanceof Error)) return false;
  const errorCode = "code" in value ? value.code : undefined;
  return (
    (typeof errorCode === "string" && missingFileErrorCodes.has(errorCode)) ||
    value.message.includes("ENOENT") ||
    value.message.includes("No such file or directory") ||
    value.message.includes("Not a directory") ||
    /\(os error (?:2|3)\)/.test(value.message)
  );
}

/** 原 `IV` / 压缩导出 `gU`。 */
export function initializeMissingFileError(): void {}

/** 原 `XBe` / 压缩导出 `hU`。 */
export function isLibraryFileId(value: string): boolean {
  return /^libfile[-_][A-Za-z0-9_-]+$/.exec(value)?.[0] === value;
}

/** 原 `ZBe` / 压缩导出 `mU`。 */
export function initializeLibraryFileId(): void {}

/** Recognize supported image uploads by a trusted MIME type or filename extension. */
export function isImageFile(value: { type?: string | null; name?: string | null }): boolean {
  const mimeType = value.type?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/")) return imageMimeTypes.has(mimeType);
  const name = value.name ?? "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 && dot < name.length - 1 && imageExtensions.has(name.slice(dot + 1).toLowerCase());
}

/** Match the release upload boundary for files larger than 256 MiB. */
export function isFileLargerThanUploadLimit(size: number): boolean {
  return size > 268_435_456;
}
