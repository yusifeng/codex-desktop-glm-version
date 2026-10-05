/** Expand file-input accept patterns into normalized extension names. */
export function resolveAcceptedFileExtensions(
  accept: readonly string[] | null | undefined,
  extensionsByMime: Record<string, readonly string[]> = {},
): string[] | undefined {
  if (accept?.some((value) => value.includes("*/*"))) return undefined;
  const extensions = accept?.flatMap((value) => {
    const normalized = value.toLowerCase();
    if (normalized.startsWith(".")) return [normalized.slice(1)];
    if (normalized.endsWith("/*")) {
      const prefix = normalized.slice(0, -1);
      return Object.entries(extensionsByMime).flatMap(([mime, values]) => mime.startsWith(prefix) ? values : []);
    }
    return extensionsByMime[normalized] ?? [];
  });
  return extensions?.length ? extensions : undefined;
}
