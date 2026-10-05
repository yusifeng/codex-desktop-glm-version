/** Pure origin discovery directory and platform eligibility policy. */

export function uniqueDiscoveryDirectories(
  directories: string[],
  normalizePath: (path: string) => string,
) {
  const unique = new Map<string, string>();
  for (const directory of directories) {
    const normalized = normalizePath(directory);
    if (!unique.has(normalized)) unique.set(normalized, directory);
  }
  return Array.from(unique.values());
}

export function canUseDiscoveryPathApi(
  isLocal: boolean,
  platform: string,
  environment: Record<string, string | undefined>,
) {
  return isLocal &&
    (platform === `darwin` || platform === `linux`) &&
    environment.GIT_DIR === undefined &&
    environment.GIT_WORK_TREE === undefined;
}

if (typeof module !== `undefined`)
  module.exports = { canUseDiscoveryPathApi, uniqueDiscoveryDirectories };
