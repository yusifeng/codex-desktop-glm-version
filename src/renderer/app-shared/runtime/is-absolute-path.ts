/** Recognizes drive-letter and UNC absolute paths across platforms. */
export function isAbsolutePath(value: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith("\\\\") || value.startsWith("//");
}
