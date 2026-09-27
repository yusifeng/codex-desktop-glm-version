import "@rchunk/rolldown-runtime";

export type PermissionPath =
  | { type: "path"; path: string }
  | { type: "glob_pattern"; pattern: string }
  | { type: "special"; value: { kind: "root" | "minimal" | "tmpdir" | "slash_tmp" } | { kind: "project_roots"; subpath?: string | null } | { kind: "unknown"; path: string; subpath?: string | null } };
export interface PermissionRequest {
  network?: unknown;
  fileSystem?: { entries?: Array<{ access: "read" | "write"; path: PermissionPath }> } | null;
}
export type PermissionGroup =
  | { kind: "network" }
  | { kind: "fileSystem"; access: "read" | "write" | "readWrite"; paths: string[] };

function permissionPathLabel(path: PermissionPath): string {
  if (path.type === "path") return path.path;
  if (path.type === "glob_pattern") return path.pattern;
  const value = path.value;
  switch (value.kind) {
    case "root": return "/";
    case "minimal": return ":minimal";
    case "project_roots": return value.subpath == null ? ":project_roots" : `:project_roots/${value.subpath}`;
    case "tmpdir": return ":tmpdir";
    case "slash_tmp": return "/tmp";
    case "unknown": return value.subpath == null ? value.path : `${value.path}/${value.subpath}`;
  }
}

function groupPermissionRequest(request: PermissionRequest): PermissionGroup[] {
  const groups: PermissionGroup[] = [];
  if (request.network != null) groups.push({ kind: "network" });
  if (request.fileSystem == null) return groups;
  const read = new Set<string>();
  const write = new Set<string>();
  for (const entry of request.fileSystem.entries ?? []) {
    const label = permissionPathLabel(entry.path);
    if (entry.access === "read") read.add(label);
    else write.add(label);
  }
  const readWrite = [...read].filter((path) => write.has(path));
  const readOnly = [...read].filter((path) => !write.has(path));
  const writeOnly = [...write].filter((path) => !read.has(path));
  if (readWrite.length) groups.push({ kind: "fileSystem", access: "readWrite", paths: readWrite });
  if (readOnly.length) groups.push({ kind: "fileSystem", access: "read", paths: readOnly });
  if (writeOnly.length) groups.push({ kind: "fileSystem", access: "write", paths: writeOnly });
  return groups;
}

function initializePermissionRequestModel(): void {}
export { initializePermissionRequestModel as n, groupPermissionRequest as t };
