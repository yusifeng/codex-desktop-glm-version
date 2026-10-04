import { fileURLToPath } from "node:url";
import path from "node:path";

export type OpenableFileType = {
  displayName: string;
  extension: string;
  mimeType: string;
  advertiseOnLinux?: boolean;
  macOSContentType?: string;
  macOSHandlerRank?: string;
  windowsAssociation?: string;
};

export const OPENABLE_FILE_TYPES: OpenableFileType[] = [
  { displayName: "CSV", extension: "csv", mimeType: "text/csv", macOSContentType: "public.comma-separated-values-text", windowsAssociation: "open-with-only" },
  { displayName: "DOCX", extension: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", windowsAssociation: "open-with-only" },
  { displayName: "PPTX", extension: "pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", windowsAssociation: "open-with-only" },
  { displayName: "TSV", extension: "tsv", mimeType: "text/tab-separated-values", macOSContentType: "public.tab-separated-values-text", windowsAssociation: "open-with-only" },
  { displayName: "XLS", extension: "xls", mimeType: "application/vnd.ms-excel", windowsAssociation: "open-with-only" },
  { displayName: "XLSM", extension: "xlsm", mimeType: "application/vnd.ms-excel.sheet.macroEnabled.12", windowsAssociation: "open-with-only" },
  { displayName: "XLSX", extension: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", windowsAssociation: "open-with-only" },
  { displayName: "Codex Skill", extension: "skill", mimeType: "application/vnd.openai.codex.skill", advertiseOnLinux: false, macOSContentType: "com.openai.codex.skill", macOSHandlerRank: "Owner", windowsAssociation: "default-eligible" },
];

const OPENABLE_EXTENSIONS = new Set(OPENABLE_FILE_TYPES.map(({ extension }) => `.${extension}`));

export function isCodexDeepLink(value: string): boolean {
  return value.toLowerCase().startsWith("codex://");
}

export function normalizeFileArgument(value: string): string | null {
  if (!value.toLowerCase().startsWith("file://")) return value;
  try { return fileURLToPath(value); } catch { return null; }
}

export function isAbsoluteForPlatform(value: string, platform = process.platform): boolean {
  return platform === "win32" ? path.win32.isAbsolute(value) : path.posix.isAbsolute(value);
}

export function isOpenableFilePath(value: string): boolean {
  return OPENABLE_EXTENSIONS.has(path.extname(value).toLowerCase());
}

export function collectOpenableFileArguments(argv: string[], platform = process.platform): string[] {
  const paths: string[] = [];
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value == null || value.length === 0) continue;
    if (value === "--open-project") { index += 1; continue; }
    if (value.startsWith("--open-project=") || value.startsWith("-") || isCodexDeepLink(value)) continue;
    const normalized = normalizeFileArgument(value);
    if (normalized != null && isAbsoluteForPlatform(normalized, platform) && isOpenableFilePath(normalized)) paths.push(normalized);
  }
  return paths;
}

export function createOpenFileDescriptors(paths: string[]): Array<{ label: string; path: string; fsPath: string }> {
  const seen = new Set<string>();
  const result: Array<{ label: string; path: string; fsPath: string }> = [];
  for (const value of paths) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push({ label: path.basename(value), path: value, fsPath: value });
  }
  return result;
}

export function collectFileExtensions(paths: Array<{ path: string }>): string[] {
  return [...new Set(paths.map(({ path: value }) => path.extname(value).slice(1).toLowerCase()))].sort();
}

export {
  OPENABLE_EXTENSIONS,
};

if (typeof module !== "undefined") module.exports = {
  OPENABLE_EXTENSIONS,
  OPENABLE_FILE_TYPES,
  collectFileExtensions,
  collectOpenableFileArguments,
  createOpenFileDescriptors,
  isAbsoluteForPlatform,
  isCodexDeepLink,
  isOpenableFilePath,
  normalizeFileArgument,
};
