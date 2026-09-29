import "@rchunk/rolldown-runtime";

interface FileEntry { path: string; [key: string]: unknown }
export type FileTreeRow<T extends FileEntry> =
  | { depth: number; kind: "file"; file: T }
  | { depth: number; kind: "folder"; name: string; path: string };

function buildFileTreeRows<T extends FileEntry>(
  files: readonly T[],
  collapsedFolders: ReadonlySet<string>,
): FileTreeRow<T>[] {
  const children = new Map<string, FileTreeRow<T>[]>([["", []]]);
  for (const file of files) {
    const parts = file.path.split("/");
    let parent = "";
    for (let depth = 0; depth < parts.length - 1; depth += 1) {
      const name = parts[depth];
      const path = parent ? `${parent}/${name}` : name;
      if (!children.has(path)) {
        children.set(path, []);
        children.get(parent)?.push({ depth, kind: "folder", name, path });
      }
      parent = path;
    }
    children.get(parent)?.push({ depth: parts.length - 1, file, kind: "file" });
  }

  const rows: FileTreeRow<T>[] = [];
  const append = (parent: string): void => {
    const siblings = children.get(parent);
    siblings?.sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;
      const leftName = left.kind === "folder" ? left.name : left.file.path;
      const rightName = right.kind === "folder" ? right.name : right.file.path;
      return leftName.localeCompare(rightName, undefined, { numeric: true, sensitivity: "base" });
    });
    for (const row of siblings ?? []) {
      rows.push(row);
      if (row.kind === "folder" && !collapsedFolders.has(row.path)) append(row.path);
    }
  };
  append("");
  return rows;
}

function initializeFileTreeRows(): void {}

export { initializeFileTreeRows as n, buildFileTreeRows as t };
