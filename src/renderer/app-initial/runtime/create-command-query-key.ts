/** Build the app-server command query-key prefix (former app-initial `$ln`). */
export function createCommandQueryKey(
  command: string,
  params?: unknown,
  cacheKey?: unknown,
): unknown[] {
  return [
    "vscode",
    command,
    ...(cacheKey == null ? [] : Array.isArray(cacheKey) ? cacheKey : [cacheKey]),
    params ? JSON.stringify(params) : undefined,
  ].filter((value) => value !== undefined);
}
