export interface ChangePathEntry { path: string; kind: { type: string; move_path?: string | null } }

/** Uses the destination path for moved updates and the entry path otherwise. */
export function getChangePath(entry: ChangePathEntry): string {
  return entry.kind.type === "update" ? (entry.kind.move_path ?? entry.path) : entry.path;
}
