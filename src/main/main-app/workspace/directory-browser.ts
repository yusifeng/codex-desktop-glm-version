// @ts-nocheck

function normalizeRelativePath(value) {
  return value.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
}

function normalizeRequestedDirectory(value) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 || trimmed === "." ? "" : normalizeRelativePath(trimmed);
}

function parentDirectory(value) {
  const normalized = normalizeRelativePath(value);
  if (normalized.length === 0) return null;
  const parts = normalized.split("/").filter(Boolean);
  return parts.length === 1 ? "" : parts.slice(0, -1).join("/");
}

function isWithinWorkspace(path, targetPath, workspaceRoot) {
  const relative = path.relative(workspaceRoot, targetPath);
  return !(
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}

export function createWorkspaceDirectoryBrowser({ fileSystem, isRemoteHostConfig, localPath, realpath }) {
  async function resolveDirectory({ appServerClient, directoryPath, path, workspaceRoot }) {
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
    const resolvedDirectoryPath = path.resolve(resolvedWorkspaceRoot, directoryPath);
    if (!isWithinWorkspace(path, resolvedDirectoryPath, resolvedWorkspaceRoot)) {
      throw new Error("directoryPath must stay within workspaceRoot");
    }
    if (isRemoteHostConfig(appServerClient.hostConfig)) {
      return {
        canonicalDirectoryPath: normalizeRelativePath(path.relative(resolvedWorkspaceRoot, resolvedDirectoryPath)),
        realWorkspaceRoot: resolvedWorkspaceRoot,
        resolvedDirectoryPath,
        resolvedWorkspaceRoot,
      };
    }
    const realWorkspaceRoot = await realpath(resolvedWorkspaceRoot);
    if (!isWithinWorkspace(path, await realpath(resolvedDirectoryPath), realWorkspaceRoot)) {
      throw new Error("directoryPath must stay within workspaceRoot");
    }
    return {
      canonicalDirectoryPath: normalizeRelativePath(path.relative(resolvedWorkspaceRoot, resolvedDirectoryPath)),
      realWorkspaceRoot,
      resolvedDirectoryPath,
      resolvedWorkspaceRoot,
    };
  }

  async function projectEntry({
    appServerClient,
    entry,
    path,
    realWorkspaceRoot,
    resolvedDirectoryPath,
    resolvedWorkspaceRoot,
  }) {
    const absolutePath = path.join(resolvedDirectoryPath, entry.name);
    const isSymlink = typeof entry.isSymbolicLink === "function" && entry.isSymbolicLink();
    let type = entry.isDirectory() ? "directory" : "file";
    if (isSymlink) {
      try {
        if ((await fileSystem.stat(absolutePath, appServerClient)).isDirectory()) {
          if (
            isRemoteHostConfig(appServerClient.hostConfig) ||
            !isWithinWorkspace(path, await realpath(absolutePath), realWorkspaceRoot)
          ) return null;
          type = "directory";
        }
      } catch {}
    }
    return {
      isSymlink,
      name: entry.name,
      path: normalizeRelativePath(path.relative(resolvedWorkspaceRoot, absolutePath)),
      type,
    };
  }

  return async function listWorkspaceDirectory({
    appServerClient,
    directoryPath,
    directoriesOnly,
    includeHidden,
    workspaceRoot,
  }) {
    if (workspaceRoot.trim().length === 0) throw new Error("workspaceRoot is required");
    if (!(await fileSystem.stat(workspaceRoot, appServerClient)).isDirectory()) {
      throw new Error("workspaceRoot must be a directory");
    }
    const requestedDirectory = normalizeRequestedDirectory(directoryPath);
    const path = isRemoteHostConfig(appServerClient.hostConfig)
      ? await appServerClient.platformPath()
      : localPath;
    const resolved = await resolveDirectory({
      appServerClient,
      directoryPath: requestedDirectory,
      path,
      workspaceRoot,
    });
    if (!(await fileSystem.stat(resolved.resolvedDirectoryPath, appServerClient)).isDirectory()) {
      throw new Error("directoryPath must point to a directory");
    }
    const directoryEntries = await fileSystem.readdir(
      resolved.resolvedDirectoryPath,
      { withFileTypes: true },
      appServerClient,
    );
    const entries = (await Promise.all(
      directoryEntries
        .filter((entry) => includeHidden || !entry.name.startsWith("."))
        .map((entry) => projectEntry({
          appServerClient,
          entry,
          path,
          ...resolved,
        })),
    ))
      .filter((entry) => entry != null)
      .filter((entry) => !directoriesOnly || entry.type === "directory")
      .sort((left, right) =>
        left.type === right.type
          ? left.name.localeCompare(right.name)
          : left.type === "directory" ? -1 : 1,
      );
    return {
      directoryPath: resolved.canonicalDirectoryPath,
      entries,
      parentPath: resolved.canonicalDirectoryPath.length === 0
        ? null
        : parentDirectory(resolved.canonicalDirectoryPath),
    };
  };
}

if (typeof module !== "undefined") module.exports = { createWorkspaceDirectoryBrowser };
