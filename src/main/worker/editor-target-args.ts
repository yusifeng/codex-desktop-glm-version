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
export function buildTextMateOpenArgs(path: string, location?: EditorLocation | null): string[] {
  if (!location) return [`-a`, `TextMate`, path];
  const uri = new URL(`txmt://open/`);
  uri.searchParams.set(`url`, `file://${encodeURI(path)}`);
  uri.searchParams.set(`line`, String(location.line));
  uri.searchParams.set(`column`, String(location.column));
  return [`-a`, `TextMate`, uri.toString()];
}
if (typeof module !== `undefined`) module.exports = { buildJetBrainsOpenArgs, buildZedRemoteUri, appendEditorLocation, buildTextMateOpenArgs };
