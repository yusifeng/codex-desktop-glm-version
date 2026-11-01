import { realpath } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import {
  Ri as desktopPathNormalizationEnabled,
  Vi as normalizeDesktopPathValue,
  Mi as storagePathContext,
  ji as normalizeStoragePathValue,
  zi as hostAllowsDesktopPathNormalization,
  Es as isRemoteHostConfig,
  Wi as isNativePlatformPath,
  Ui as isWindowsDrivePath,
  bl as shouldResolveWindowsRealpath,
} from "@chunk/shared";

export type HostConfig = { home_dir?: string | null; [key: string]: unknown };

export interface ProjectPathPolicyAdapters {
  platform: string;
  homedir(): string;
  realpath(path: string): Promise<string>;
  realpathSync(path: string): string;
}

export function createProjectPathPolicy(adapters: ProjectPathPolicyAdapters) {
  function normalizeDesktopPathWithFlag(path: string, enabled: boolean): string {
    return enabled ? normalizeDesktopPathValue(path) : path;
  }

  function normalizeDesktopPath(path: string): string {
    return normalizeDesktopPathWithFlag(path, desktopPathNormalizationEnabled());
  }

  function normalizeStoragePathWithFlag(path: string, enabled: boolean): string {
    return enabled ? normalizeStoragePathValue(path, storagePathContext()) : path;
  }

  function normalizeStoragePath(path: string): string {
    return normalizeStoragePathWithFlag(path, desktopPathNormalizationEnabled());
  }

  function normalizeDesktopRootPaths(paths: string[], enabled: boolean): string[] {
    return paths.map((path) => normalizeStoragePathWithFlag(path, enabled));
  }

  function mapRemoteHomePathToLocal(path: string | null | undefined, hostConfig: HostConfig): string | null {
    if (!path) return path ?? null;
    if (!isRemoteHostConfig(hostConfig)) return path;
    const remoteHome = hostConfig.home_dir;
    if (!remoteHome) return path;
    const localHome = adapters.homedir();
    return path === remoteHome
      ? localHome
      : path.startsWith(`${remoteHome}/`)
        ? `${localHome}${path.slice(remoteHome.length)}`
        : path;
  }

  function isPosixOrWindowsDrivePath(path: string): boolean {
    return isWindowsDrivePath(path) || path === "/" || /^\/(?!\/)/.test(path);
  }

  function normalizeProjectPathForHost(path: string, hostConfig: HostConfig, allowWslPaths: boolean): string {
    if (isRemoteHostConfig(hostConfig) || (adapters.platform !== "win32" && isNativePlatformPath(path)))
      return path;
    if (allowWslPaths) return normalizeDesktopPathWithFlag(path, true);
    if (isPosixOrWindowsDrivePath(path)) return normalizeStoragePathWithFlag(path, true);
    return path;
  }

  function uniqueMapped<T>(values: T[], map: (value: T) => T): T[] {
    const seen = new Set<T>();
    return values.map(map).filter((value) => !seen.has(value) && (seen.add(value), true));
  }

  function normalizeProjectRoots(paths: string[], hostConfig: HostConfig, allowWslPaths: boolean): string[] {
    return uniqueMapped(paths, (path) => normalizeProjectPathForHost(path, hostConfig, allowWslPaths));
  }

  function sourcePathMap(paths: string[], hostConfig: HostConfig, allowWslPaths: boolean): Map<string, string> {
    const result = new Map<string, string>();
    for (const source of paths) {
      const normalized = normalizeProjectPathForHost(source, hostConfig, allowWslPaths);
      if (!result.has(normalized)) result.set(normalized, source);
    }
    return result;
  }

  function pathForRealpath(path: string, hostConfig: HostConfig): string {
    return adapters.platform !== "win32" || isRemoteHostConfig(hostConfig) || !isPosixOrWindowsDrivePath(path)
      ? path
      : normalizeStoragePathWithFlag(path, true);
  }

  async function canonicalizeRoots(
    paths: string[],
    hostConfig: HostConfig,
    allowWslPaths: boolean,
  ): Promise<Record<string, string>> {
    const sources = sourcePathMap(paths, hostConfig, allowWslPaths);
    const entries = await Promise.all(Array.from(sources, async ([normalized, source]) => {
      try {
        return [normalized, normalizeProjectPathForHost(
          await adapters.realpath(pathForRealpath(source, hostConfig)),
          hostConfig,
          allowWslPaths,
        )] as const;
      } catch {
        return null;
      }
    }));
    return Object.fromEntries(entries.filter((entry) => entry != null));
  }

  function getCanonicalPathMapSync(
    paths: string[],
    hostConfig: HostConfig,
    allowWslPaths: boolean,
  ): Record<string, string> {
    const entries = Array.from(sourcePathMap(paths, hostConfig, allowWslPaths), ([normalized, source]) => {
      try {
        return [normalized, normalizeProjectPathForHost(
          adapters.realpathSync(pathForRealpath(source, hostConfig)),
          hostConfig,
          allowWslPaths,
        )] as const;
      } catch {
        return null;
      }
    });
    return Object.fromEntries(entries.filter((entry) => entry != null));
  }

  function mapRecordKeys<T>(record: Record<string, T>, map: (key: string) => string): Record<string, T> {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(record)) result[map(key)] ??= value;
    return result;
  }

  function normalizeLabels(
    labels: Record<string, string>,
    hostConfig: HostConfig,
    allowWslPaths: boolean,
  ): Record<string, string> {
    return mapRecordKeys(labels, (path) => normalizeProjectPathForHost(path, hostConfig, allowWslPaths));
  }

  async function normalizeProjectRoot(path: string, hostConfig: HostConfig): Promise<string> {
    const normalized = pathForRealpath(path, hostConfig);
    if (adapters.platform !== "win32" || isRemoteHostConfig(hostConfig) || !shouldResolveWindowsRealpath(normalized))
      return normalized;
    try {
      const resolved = await adapters.realpath(normalized);
      return isWindowsDrivePath(resolved) ? resolved : normalized;
    } catch {
      return normalized;
    }
  }

  async function normalizeProjectRootsAsync(paths: string[], hostConfig: HostConfig): Promise<string[]> {
    return [...new Set(await Promise.all(paths.map((path) => normalizeProjectRoot(path, hostConfig))))];
  }

  function resolveHomeMappedStoragePath(path: string | null | undefined, hostConfig: HostConfig): string | null {
    const mapped = mapRemoteHomePathToLocal(path, hostConfig);
    return mapped && normalizeStoragePathWithFlag(mapped, hostAllowsDesktopPathNormalization(hostConfig));
  }

  return {
    canonicalizeRoots,
    getCanonicalPathMapSync,
    mapRecordKeys,
    mapRemoteHomePathToLocal,
    normalizeDesktopPath,
    normalizeDesktopPathWithFlag,
    normalizeDesktopRootPaths,
    normalizeLabels,
    normalizeProjectPathForHost,
    normalizeProjectRoot,
    normalizeProjectRoots,
    normalizeProjectRootsAsync,
    normalizeStoragePath,
    normalizeStoragePathWithFlag,
    resolveHomeMappedStoragePath,
  };
}

export const projectPathPolicy = createProjectPathPolicy({
  platform: process.platform,
  homedir,
  realpath,
  realpathSync,
});
