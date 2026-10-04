export interface EditorLocation { line: number; column: number }
export function buildJetBrainsOpenArgs(path: string, location?: EditorLocation | null): string[] {
  return location ? [`--line`, String(location.line), `--column`, String(location.column), path] : [path];
}
export function buildZedRemoteUri(host: string, remotePath: string): string | null {
  const authority = host.trim(), path = remotePath?.trim();
  if (!authority || !path) return null;
  return `ssh://${authority}${(path.startsWith(`/`) ? path : `/${path}`).split(`/`).map(encodeURIComponent).join(`/`)}`;
}
export function appendEditorLocation(path: string, location?: EditorLocation | null): string {
  return location ? `${path}:${location.line}:${location.column}` : path;
}
if (typeof module !== `undefined`) module.exports = { buildJetBrainsOpenArgs, buildZedRemoteUri, appendEditorLocation };
