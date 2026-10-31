import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const REACT_DEVTOOLS_EXTENSION_ID = `fmkadmapgofadopljbjfkapdkoienihi`;

interface Logger {
  trace(message: string, details: unknown): void;
  info(message: string, details: unknown): void;
  error(message: string, details: unknown): void;
}

export interface ReactDevToolsSearchOptions {
  platform?: NodeJS.Platform;
  homeDirectory?: string;
  localAppData?: string;
  userDataDirectory: string;
}

/** Chrome profile roots that may contain a locally installed extension (original `Jce`). */
export function chromeUserDataRoots({
  platform = process.platform,
  homeDirectory = homedir(),
  localAppData = process.env.LOCALAPPDATA,
}: Omit<ReactDevToolsSearchOptions, "userDataDirectory"> = {}): string[] {
  if (platform === `darwin`)
    return [join(homeDirectory, `Library`, `Application Support`, `Google`, `Chrome`)];
  if (platform === `win32`)
    return localAppData == null ? [] : [join(localAppData, `Google`, `Chrome`, `User Data`)];
  if (platform === `linux`)
    return [
      join(homeDirectory, `.config`, `google-chrome`),
      join(homeDirectory, `.config`, `google-chrome-beta`),
      join(homeDirectory, `.config`, `google-chrome-canary`),
      join(homeDirectory, `.config`, `chromium`),
    ];
  return [];
}

/** Enumerate each Chrome profile's Extensions directory (original `Yce`). */
export function chromeProfileExtensionDirectories(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name, `Extensions`));
}

export function reactDevToolsSearchDirectories(options: ReactDevToolsSearchOptions): string[] {
  return [
    join(options.userDataDirectory, `extensions`),
    ...chromeUserDataRoots(options).flatMap(chromeProfileExtensionDirectories),
  ];
}

/** Select the highest numerically sorted installed extension version (original `Xce`). */
export function latestExtensionVersionDirectory(extensionRoot: string): string | null {
  if (!existsSync(extensionRoot)) return null;
  let version = readdirSync(extensionRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: `base` }))
    .at(-1);
  return version == null ? null : join(extensionRoot, version);
}

export function findReactDevToolsExtension(options: ReactDevToolsSearchOptions): string | null {
  for (let directory of reactDevToolsSearchDirectories(options)) {
    let installed = latestExtensionVersionDirectory(join(directory, REACT_DEVTOOLS_EXTENSION_ID));
    if (installed != null) return installed;
  }
  return null;
}

/** Discover and load React DevTools for unpackaged desktop launches (original `Gce`). */
export async function loadReactDevToolsExtension({
  loadExtension,
  logger,
  platform = process.platform,
  homeDirectory = homedir(),
  localAppData = process.env.LOCALAPPDATA,
  userDataDirectory,
}: ReactDevToolsSearchOptions & {
  loadExtension(path: string): Promise<{ id: string; name: string; version: string }>;
  logger: () => Logger;
}): Promise<boolean> {
  let extensionPath = findReactDevToolsExtension({
    platform,
    homeDirectory,
    localAppData,
    userDataDirectory,
  });
  if (extensionPath == null) {
    logger().trace(`React DevTools extension not found`, {
      safe: { extensionId: REACT_DEVTOOLS_EXTENSION_ID, platform },
    });
    return false;
  }
  try {
    let extension = await loadExtension(extensionPath);
    logger().info(`Loaded React DevTools extension`, {
      safe: { extensionId: extension.id, name: extension.name, version: extension.version },
    });
    return true;
  } catch (error) {
    logger().error(`Failed to load React DevTools extension`, {
      safe: {},
      sensitive: { error: String(error) },
    });
    return false;
  }
}
