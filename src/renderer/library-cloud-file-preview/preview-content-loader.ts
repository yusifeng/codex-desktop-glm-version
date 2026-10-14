import type { LibraryPreviewKind } from "./preview-state";

export type LibraryPreviewContentState =
  | { key: string; status: "loading" }
  | { content: unknown; key: string; status: "ready" }
  | { error: string; key: string; status: "error" };

type PreviewFile = {
  downloadUrl?: string;
  fileId: string;
  fileName: string;
  requestHeaders?: Record<string, string>;
};

type LibraryPreviewContentLoaderDependencies = {
  readBytes: (file: PreviewFile, signal: AbortSignal) => Promise<Uint8Array>;
  readText: (file: PreviewFile, signal: AbortSignal) => Promise<string>;
};

const BINARY_PREVIEW_KINDS = new Set<LibraryPreviewKind>(["artifact", "pdf"]);
const TEXT_PREVIEW_KINDS = new Set<LibraryPreviewKind>(["html", "markdown", "text"]);

export function libraryPreviewContentKey(file: PreviewFile, kind: LibraryPreviewKind): string {
  return `${file.fileId}:${kind}:${file.downloadUrl ?? ""}`;
}

/** Loads preview content with abort and generation guards so stale files cannot replace the active preview. */
export function createLibraryPreviewContentLoader(
  dependencies: LibraryPreviewContentLoaderDependencies,
) {
  let generation = 0;
  let activeController: AbortController | null = null;

  const cancel = () => {
    generation += 1;
    activeController?.abort();
    activeController = null;
  };

  const load = (
    file: PreviewFile,
    kind: LibraryPreviewKind,
    update: (state: LibraryPreviewContentState) => void,
  ) => {
    cancel();
    const key = libraryPreviewContentKey(file, kind);
    if (!BINARY_PREVIEW_KINDS.has(kind) && !TEXT_PREVIEW_KINDS.has(kind)) return () => {};
    if (file.downloadUrl == null || file.downloadUrl === "") {
      update({ error: "File preview URL unavailable", key, status: "error" });
      return () => {};
    }

    const controller = new AbortController();
    activeController = controller;
    const currentGeneration = generation;
    update({ key, status: "loading" });
    const operation = BINARY_PREVIEW_KINDS.has(kind)
      ? dependencies.readBytes(file, controller.signal)
      : dependencies.readText(file, controller.signal);
    void operation.then(
      (content) => {
        if (generation !== currentGeneration || controller.signal.aborted) return;
        activeController = null;
        update({ content, key, status: "ready" });
      },
      (error) => {
        if (generation !== currentGeneration || controller.signal.aborted) return;
        activeController = null;
        update({
          error: error instanceof Error && error.message !== "" ? error.message : "Unable to load preview",
          key,
          status: "error",
        });
      },
    );

    let cleanedUp = false;
    return () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (generation === currentGeneration) cancel();
    };
  };

  return { cancel, load };
}
