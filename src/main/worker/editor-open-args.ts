/** Platform-independent argument construction for opening local or remote editors. */

export interface EditorLocation { line: number; column: number }

export function isRemoteHost(host: unknown): boolean {
  const kind = (host as { kind?: unknown } | null | undefined)?.kind;
  return kind === `ssh` || kind === `wsl` || kind === `remote-control`;
}

export function buildEditorOpenArgs(path: string, location?: EditorLocation | null): string[] {
  return location
    ? [`--goto`, `${path}:${location.line}:${location.column}`]
    : process.platform === `win32`
      ? [path]
      : [`--goto`, path];
}

export function buildRemoteUri(remoteAuthority: string, path: string): string {
  const normalized = path.startsWith(`/`) ? path : `/${path}`;
  return `vscode-remote://${remoteAuthority}${normalized.split(`/`).map(encodeURIComponent).join(`/`)}`;
}

export function buildRemoteEditorArgs({
  remoteAuthority,
  remoteWorkspaceRoot,
  path,
  location,
}: {
  remoteAuthority: string;
  remoteWorkspaceRoot?: string;
  path: string;
  location: EditorLocation;
}): string[] {
  const args: string[] = [];
  if (remoteWorkspaceRoot != null) args.push(`--folder-uri`, buildRemoteUri(remoteAuthority, remoteWorkspaceRoot));
  args.push(`--remote`, remoteAuthority, `--goto`, `${path}:${location.line}:${location.column}`);
  return args;
}

export function buildRemoteOpenArgs({
  hostConfig,
  remoteAuthority: providedRemoteAuthority,
  remoteWorkspaceRoot,
  remotePath,
  location,
}: {
  hostConfig: { kind?: unknown };
  remoteWorkspaceRoot?: string;
  remotePath?: string;
  remoteAuthority?: string;
  location?: EditorLocation | null;
}): string[] {
  const remoteAuthority = providedRemoteAuthority ?? `ssh-remote+${String((hostConfig as { name?: unknown }).name ?? ``)}`;
  const root = remoteWorkspaceRoot?.trim() || undefined;
  const path = remotePath?.trim() || undefined;
  if (path != null && location != null) {
    return buildRemoteEditorArgs({ remoteAuthority, remoteWorkspaceRoot: root, path, location });
  }
  const args: string[] = [];
  if (root != null) args.push(`--folder-uri`, buildRemoteUri(remoteAuthority, root));
  if (path != null) args.push(`--file-uri`, buildRemoteUri(remoteAuthority, path));
  return args;
}

if (typeof module !== `undefined`) module.exports = {
  isRemoteHost,
  buildEditorOpenArgs,
  buildRemoteUri,
  buildRemoteEditorArgs,
  buildRemoteOpenArgs,
};
