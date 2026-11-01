export const NATIVE_DOCUMENT_EXTENSIONS = [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsm", ".xlsx"];
export const MAX_WORKSPACE_FILE_BYTES = 256 * 1024 * 1024;

export function sanitizeWorkspaceDownloadFileName(value: string): string {
  const fileName = (value.replaceAll("\\", "/").replace(/\/+$/u, "").split("/").at(-1) ?? "")
    .replace(/[<>:"|?*]/gu, "_")
    .replaceAll("\0", "_");
  return fileName === "." || fileName === ".." || fileName === "" ? "download" : fileName;
}

export function isWorkspaceFileTooLarge(byteLength: number): boolean {
  return byteLength > MAX_WORKSPACE_FILE_BYTES;
}
