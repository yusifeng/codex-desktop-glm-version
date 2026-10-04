/** Pure command-line argument builders for open-in targets. */

export interface SourceLocation { line: number; column: number }

export function buildEditorGotoArgs(pathname: string, location: SourceLocation | null, platform: string): string[] {
  return location
    ? [`--goto`, `${pathname}:${location.line}:${location.column}`]
    : platform === `win32` ? [pathname] : [`--goto`, pathname];
}

export function buildVscodeRemoteUri(remoteAuthority: string, pathname: string): string {
  return `vscode-remote://${remoteAuthority}${(pathname.startsWith(`/`) ? pathname : `/${pathname}`).split(`/`).map(encodeURIComponent).join(`/`)}`;
}

export function buildVscodeRemoteArgs({
  remoteAuthority,
  remoteWorkspaceRoot,
  path,
  location,
}: {
  remoteAuthority: string;
  remoteWorkspaceRoot?: string;
  path: string;
  location: SourceLocation;
}): string[] {
  const args: string[] = [];
  if (remoteWorkspaceRoot != null) args.push(`--folder-uri`, buildVscodeRemoteUri(remoteAuthority, remoteWorkspaceRoot));
  args.push(`--remote`, remoteAuthority, `--goto`, `${path}:${location.line}:${location.column}`);
  return args;
}

if (typeof module !== "undefined") module.exports = { buildEditorGotoArgs, buildVscodeRemoteUri, buildVscodeRemoteArgs };
