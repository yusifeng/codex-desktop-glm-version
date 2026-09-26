export interface PathValue {
  path: string;
}

export interface PreviewablePathValue extends PathValue {
  fsPath?: string;
  startLine?: number | null;
}

const missingFileErrorCodes = new Set(["ENOENT", "ENOTDIR"]);
const richFileExtension = /\.(csv|docx|ipynb|pdf|pptx|tex|tsv|xlsm|xlsx)$/i;

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
