import { execFile as execFileCallback } from "node:child_process";
import {
  accessSync,
  constants,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { extname, isAbsolute, join, normalize, relative, sep } from "node:path";
import { promisify } from "node:util";

interface DesktopEntry {
  desktopId: string;
  desktopPath: string;
  displayName: string;
  executableIdentity: string | null;
  icon: string | null;
}

interface ApplicationDescriptor {
  appPath: string;
  bundleId: string;
  displayName: string;
  isDefault?: true;
}

interface LinuxApplicationsDependencies {
  findExecutable(command: string): string | null;
  mimeLookup(path: string): string | false | null;
  execFile?: typeof execFileCallback;
}

const DESKTOP_ENTRY_PATTERN = /^[A-Za-z0-9_.+-]+\.desktop$/u;
const SAFE_ICON_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/u;
const ICON_DIRECTORIES = ["32x32", "48x48", "64x64", "24x24", "22x22", "16x16", "scalable"];
const ICON_EXTENSIONS = [".png", ".svg", ".xpm"];
const DESKTOP_ENTRY_CACHE_TTL_MS = 1_000;

let desktopEntryCache:
  | { entries: Map<string, DesktopEntry | null>; expiresAt: number; key: string }
  | null = null;

function isInsidePath(path: string, parent: string): boolean {
  const child = normalize(path);
  const root = normalize(parent);
  const rel = relative(root, child);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveSafeFile(path: string, parent: string): string | null {
  if (!isInsidePath(path, parent)) return null;
  try {
    const realParent = realpathSync(parent);
    const realPath = realpathSync(path);
    return isInsidePath(realPath, realParent) && statSync(realPath).isFile() ? realPath : null;
  } catch {
    return null;
  }
}

function dataDirectories(): string[] {
  const configuredHome = process.env.XDG_DATA_HOME;
  const dataHome = configuredHome != null && isAbsolute(configuredHome)
    ? configuredHome
    : join(homedir(), ".local", "share");
  const configuredDirectories = process.env.XDG_DATA_DIRS;
  return [
    dataHome,
    ...(configuredDirectories == null || configuredDirectories.length === 0
      ? ["/usr/local/share", "/usr/share"]
      : configuredDirectories.split(":").filter(isAbsolute)),
  ];
}

function executableExists(command: string, findExecutable: (command: string) => string | null): boolean {
  if (!isAbsolute(command)) return findExecutable(command) != null;
  try {
    accessSync(command, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findExecutableOnPath(command: string): string | null {
  if (isAbsolute(command)) return executableExists(command, () => null) ? command : null;
  for (const directory of (process.env.PATH ?? "").split(":").filter(Boolean)) {
    const candidate = join(directory, command);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  return null;
}

function parseDesktopEntry(
  desktopPath: string,
  desktopId: string,
  currentDesktops: string[],
  findExecutable: (command: string) => string | null,
): DesktopEntry | null {
  let contents: string;
  try {
    contents = readFileSync(desktopPath, "utf8");
  } catch {
    return null;
  }

  const values = new Map<string, string>();
  let inDesktopEntry = false;
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.startsWith("[") && line.endsWith("]")) {
      inDesktopEntry = line === "[Desktop Entry]";
      continue;
    }
    if (!inDesktopEntry || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator > 0) values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  const exec = values.get("Exec");
  if (
    values.get("Hidden") === "true" ||
    values.get("Type") !== "Application" ||
    (!exec && values.get("DBusActivatable") !== "true")
  ) return null;

  const onlyShowIn = values.get("OnlyShowIn")?.split(";").filter(Boolean);
  const notShowIn = values.get("NotShowIn")?.split(";").filter(Boolean);
  let visible = onlyShowIn == null;
  for (const desktop of currentDesktops) {
    if (onlyShowIn?.includes(desktop)) {
      visible = true;
      break;
    }
    if (notShowIn?.includes(desktop)) {
      visible = false;
      break;
    }
  }
  if (!visible) return null;

  const tryExec = values.get("TryExec");
  if (tryExec && !executableExists(tryExec, findExecutable)) return null;
  return {
    desktopId,
    desktopPath,
    displayName: values.get("Name") ?? desktopId.slice(0, -8),
    executableIdentity: exec ?? null,
    icon: values.get("Icon") ?? null,
  };
}

function scanDesktopEntries(
  entries: Map<string, DesktopEntry | null>,
  root: string,
  directory: string,
  currentDesktops: string[],
  findExecutable: (command: string) => string | null,
): void {
  let children;
  try {
    children = readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const child of children) {
    const path = join(directory, child.name);
    if (child.isDirectory()) {
      scanDesktopEntries(entries, root, path, currentDesktops, findExecutable);
      continue;
    }
    if (extname(child.name) !== ".desktop") continue;
    if (child.isSymbolicLink()) {
      if (!isFile(path)) continue;
    } else if (!child.isFile()) continue;
    const desktopId = relative(root, path).split(sep).join("-");
    if (!entries.has(desktopId)) {
      entries.set(desktopId, parseDesktopEntry(path, desktopId, currentDesktops, findExecutable));
    }
  }
}

function desktopEntries(findExecutable: (command: string) => string | null): Map<string, DesktopEntry | null> {
  const [userDataDirectory, ...systemDataDirectories] = dataDirectories();
  const applicationDirectories = Array.from(new Set([
    userDataDirectory,
    join(homedir(), ".local", "share", "flatpak", "exports", "share"),
    ...systemDataDirectories,
    "/var/lib/flatpak/exports/share",
    "/var/lib/snapd/desktop",
  ].map((directory) => join(directory, "applications"))));
  const currentDesktops = (process.env.XDG_CURRENT_DESKTOP ?? "").split(":").filter(Boolean);
  const key = JSON.stringify([applicationDirectories, currentDesktops]);
  if (desktopEntryCache?.key === key && desktopEntryCache.expiresAt > Date.now()) {
    return desktopEntryCache.entries;
  }
  const entries = new Map<string, DesktopEntry | null>();
  for (const directory of applicationDirectories) {
    scanDesktopEntries(entries, directory, directory, currentDesktops, findExecutable);
  }
  desktopEntryCache = { entries, expiresAt: Date.now() + DESKTOP_ENTRY_CACHE_TTL_MS, key };
  return entries;
}

function iconThemeDirectories(dataDirs: string[]): Array<{ directory: string; directories: string[] }> {
  const configuredConfigHome = process.env.XDG_CONFIG_HOME;
  const configHome = configuredConfigHome != null && isAbsolute(configuredConfigHome)
    ? configuredConfigHome
    : join(homedir(), ".config");
  let theme = process.env.XDG_ICON_THEME;
  for (const settingsPath of [
    join(configHome, "gtk-4.0", "settings.ini"),
    join(configHome, "gtk-3.0", "settings.ini"),
    join(configHome, "kdeglobals"),
  ]) {
    if (theme != null) break;
    try {
      theme = /^\s*(?:gtk-icon-theme-name|Theme)\s*=\s*([^\r\n#;]+)/mu.exec(readFileSync(settingsPath, "utf8"))?.[1]?.trim();
    } catch {}
  }

  const desktop = process.env.XDG_CURRENT_DESKTOP ?? "";
  const themes = [theme ?? (desktop.split(":").includes("KDE") ? "breeze" : "Adwaita"), "hicolor"];
  const visited = new Set<string>();
  const result: Array<{ directory: string; directories: string[] }> = [];
  for (let index = 0; index < themes.length; index += 1) {
    const name = themes[index];
    if (name == null || !SAFE_ICON_NAME_PATTERN.test(name) || visited.has(name)) continue;
    visited.add(name);
    for (const dataDirectory of dataDirs) {
      const iconsRoot = join(dataDirectory, "icons");
      const themeDirectory = join(iconsRoot, name);
      try {
        if (!isInsidePath(realpathSync(themeDirectory), realpathSync(iconsRoot))) continue;
      } catch {
        continue;
      }
      const indexPath = resolveSafeFile(join(themeDirectory, "index.theme"), iconsRoot);
      const directories = ICON_DIRECTORIES.map((size) => join(size, "apps"));
      if (indexPath != null) {
        let inIconTheme = false;
        for (const rawLine of readFileSync(indexPath, "utf8").split(/\r?\n/u)) {
          const line = rawLine.trim();
          if (line.startsWith("[") && line.endsWith("]")) {
            inIconTheme = line === "[Icon Theme]";
            continue;
          }
          if (!inIconTheme) continue;
          const separator = line.indexOf("=");
          if (separator < 0) continue;
          const key = line.slice(0, separator).trim();
          const values = line.slice(separator + 1).split(",").map((value) => value.trim());
          if (key === "Inherits") {
            themes.splice(index + 1, 0, ...values.filter((value) => value !== "hicolor" && SAFE_ICON_NAME_PATTERN.test(value) && !visited.has(value)));
          }
          if (key === "Directories" || key === "ScaledDirectories") {
            directories.push(...values.filter((value) =>
              (value.startsWith("apps/") || value.endsWith("/apps")) && isInsidePath(join(themeDirectory, value), themeDirectory),
            ));
          }
        }
      }
      result.push({ directory: themeDirectory, directories: Array.from(new Set(directories)) });
    }
  }
  return result;
}

function resolveLinuxDesktopEntryIcon(
  appPath: string,
  findExecutable: (command: string) => string | null = findExecutableOnPath,
): string | null {
  const entry = [...desktopEntries(findExecutable).values()].find((candidate) => candidate?.desktopPath === appPath);
  if (entry?.icon == null || entry.icon === "") return null;
  if (isAbsolute(entry.icon)) return isFile(entry.icon) ? entry.icon : null;
  if (!SAFE_ICON_NAME_PATTERN.test(entry.icon)) return null;
  const candidates = ICON_EXTENSIONS.includes(extname(entry.icon))
    ? [entry.icon]
    : ICON_EXTENSIONS.map((extension) => `${entry.icon}${extension}`);
  const dataDirs = dataDirectories();
  for (const theme of iconThemeDirectories(dataDirs)) {
    for (const directory of theme.directories) {
      for (const candidate of candidates) {
        const path = resolveSafeFile(join(theme.directory, directory, candidate), theme.directory);
        if (path != null) return path;
      }
    }
  }
  for (const dataDirectory of dataDirs) {
    for (const candidate of candidates) {
      const pixmapsDirectory = join(dataDirectory, "pixmaps");
      const path = resolveSafeFile(join(pixmapsDirectory, candidate), pixmapsDirectory);
      if (path != null) return path;
    }
  }
  return null;
}

function parseGioMimeOutput(output: string): { defaultDesktopId: string | null; desktopIds: string[] } {
  let defaultDesktopId: string | null = null;
  let section: "registered" | "recommended" | null = null;
  const recommended: string[] = [];
  const registered: string[] = [];
  for (const rawLine of output.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const defaultMatch = /^Default application for .*?:\s*(\S+)$/u.exec(line);
    if (defaultMatch != null) {
      const id = defaultMatch[1];
      if (id != null && DESKTOP_ENTRY_PATTERN.test(id)) defaultDesktopId = id;
      section = null;
      continue;
    }
    if (line === "Registered applications:") {
      section = "registered";
      continue;
    }
    if (line === "Recommended applications:") {
      section = "recommended";
      continue;
    }
    if (DESKTOP_ENTRY_PATTERN.test(line)) {
      if (section === "recommended") recommended.push(line);
      else if (section === "registered") registered.push(line);
    }
  }
  return {
    defaultDesktopId,
    desktopIds: Array.from(new Set([...(defaultDesktopId == null ? [] : [defaultDesktopId]), ...recommended, ...registered])),
  };
}

function createLinuxApplicationsRuntime(dependencies: LinuxApplicationsDependencies) {
  const execFile = promisify(dependencies.execFile ?? execFileCallback);

  function projectApplications(desktopIds: string[], defaultDesktopId: string | null): ApplicationDescriptor[] {
    const entries = desktopEntries(dependencies.findExecutable);
    const identities = new Set<string>();
    return desktopIds.flatMap((desktopId) => {
      const entry = entries.get(desktopId);
      if (entry == null) return [];
      const identity = entry.executableIdentity == null
        ? entry.desktopId
        : `${entry.displayName}\0${entry.executableIdentity}`;
      if (identities.has(identity)) return [];
      identities.add(identity);
      return [{
        appPath: entry.desktopPath,
        bundleId: entry.desktopId,
        displayName: entry.displayName,
        ...(desktopId === defaultDesktopId ? { isDefault: true as const } : {}),
      }];
    });
  }

  async function queryMimeApplications(gioPath: string, mimeType: string) {
    try {
      const { stdout } = await execFile(gioPath, ["mime", mimeType], {
        encoding: "utf8",
        env: { ...process.env, LC_ALL: "C" },
        maxBuffer: 1_048_576,
        timeout: 5_000,
      });
      return parseGioMimeOutput(stdout);
    } catch {
      return { defaultDesktopId: null, desktopIds: [] };
    }
  }

  async function detectContentType(gioPath: string, path: string): Promise<string | null> {
    try {
      const { stdout } = await execFile(gioPath, ["info", "--attributes=standard::content-type", "--", path], {
        encoding: "utf8",
        env: { ...process.env, LC_ALL: "C" },
        maxBuffer: 1_048_576,
        timeout: 5_000,
      });
      const contentType = /^\s*standard::content-type:\s*(\S+)\s*$/mu.exec(stdout)?.[1];
      if (contentType != null && contentType !== "application/x-zerosize") return contentType;
    } catch {}
    return dependencies.mimeLookup(path) || null;
  }

  function findDesktopApplicationPathByIds(desktopIds: string[]): string | null {
    if (dependencies.findExecutable("gio") == null) return null;
    const entries = desktopEntries(dependencies.findExecutable);
    for (const id of desktopIds) {
      const entry = entries.get(id);
      if (entry != null) return entry.desktopPath;
    }
    return null;
  }

  async function findApplicationsForPath(path: string): Promise<ApplicationDescriptor[]> {
    const gioPath = dependencies.findExecutable("gio");
    if (gioPath == null) return [];
    const contentType = await detectContentType(gioPath, path);
    if (!contentType) return [];
    const result = await queryMimeApplications(gioPath, contentType);
    return projectApplications(result.desktopIds, result.defaultDesktopId);
  }

  async function findDefaultBrowserApplications(): Promise<{
    applications: ApplicationDescriptor[];
    defaultApplicationPath: string | null;
  }> {
    const gioPath = dependencies.findExecutable("gio");
    if (gioPath == null) return { applications: [], defaultApplicationPath: null };
    const [https, http] = await Promise.all([
      queryMimeApplications(gioPath, "x-scheme-handler/https"),
      queryMimeApplications(gioPath, "x-scheme-handler/http"),
    ]);
    const applications = projectApplications(Array.from(new Set([...https.desktopIds, ...http.desktopIds])), null);
    const defaultDesktopId = https.defaultDesktopId ?? http.defaultDesktopId;
    return {
      applications,
      defaultApplicationPath: applications.find((application) => application.bundleId === defaultDesktopId)?.appPath ?? null,
    };
  }

  return {
    findDesktopApplicationPathByIds,
    findApplicationsForPath,
    findDefaultBrowserApplications,
    resolveLinuxDesktopEntryIcon: (path: string) => resolveLinuxDesktopEntryIcon(path, dependencies.findExecutable),
  };
}

export {
  createLinuxApplicationsRuntime,
  parseGioMimeOutput,
  resolveLinuxDesktopEntryIcon,
};
