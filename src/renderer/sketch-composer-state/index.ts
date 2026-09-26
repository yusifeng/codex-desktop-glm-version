// sketch-composer-state —— Sketch composer 的编辑、上传、撤销保留和关闭确认状态机。
// 原版：app/webview/assets/composer-state-422d489ae887.js。

import "@rchunk/app-shared";
import { n as createSketchEditor, t as initializeSketch } from "@rchunk/sketch";

type UploadStatus = "success" | "canceled" | "blocked" | "error";
interface Environment { composerId: string; canOpenSketch: boolean; canEditSketch: boolean; isDarkMode: boolean }
interface SketchDocument { objects: unknown[]; [key: string]: unknown }
interface Editor {
  pointerCancel(): void; discardPendingTextEdit(): void; commitPendingTextEdit(): void;
  replaceDocument(document: SketchDocument): void;
  getSnapshot(): { document: SketchDocument; effectiveDocument: SketchDocument; hasActiveGesture: boolean };
  export(options: unknown): Promise<{ kind: string; blob: Blob }>;
}
interface UploadService {
  subscribe(listener: (ids: string[]) => void): () => void;
  track(event: string): void;
  createFileName(): string;
  save(file: File, options: {
    id: string; replaceUploadId: string | null; signal: AbortSignal; isAvailable(): boolean;
    onQueued(id: string): void; onComplete(status: UploadStatus): void;
  }): Promise<void>;
}
interface Entry {
  id: string; editor: Editor; uploadId: string | null; fileName: string | null;
  savedDocument: SketchDocument | null; saving: AbortController | null; undoRetentionCount: number;
  onSave?: () => void;
}

const documentsEqual = (left: SketchDocument, right: SketchDocument) => JSON.stringify(left) === JSON.stringify(right);

function createSketchComposerState(
  getEnvironment: () => Environment,
  uploads: UploadService,
  options: { createEditor?(options: unknown): Editor; createId?(): string } = {},
) {
  initializeSketch();
  const composerId = getEnvironment().composerId;
  const entries = new Map<string, Entry>();
  const history: Entry[] = [];
  const listeners = new Set<() => void>();
  let uploadIds: string[] = [];
  let disposed = false;
  let keepEditingCallback: (() => void) | undefined;
  let snapshot = { active: null as Entry | null, confirmingDiscard: false, transition: null as any };
  const available = () => !disposed && getEnvironment().composerId === composerId;
  const publish = (patch: Partial<typeof snapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const remove = (entry: Entry) => {
    entry.onSave = undefined;
    entry.editor.pointerCancel();
    entry.editor.discardPendingTextEdit();
    entries.delete(entry.id);
    const index = history.indexOf(entry);
    if (index !== -1) history.splice(index, 1);
  };
  const close = () => {
    keepEditingCallback = undefined;
    publish({ active: history.at(-1) ?? null, confirmingDiscard: false });
  };
  const completeTransition = (transition: any) => {
    if (snapshot.transition !== transition) return;
    if (transition?.imageUrl != null) URL.revokeObjectURL(transition.imageUrl);
    publish({ transition: null });
  };
  const unsubscribe = uploads.subscribe((ids) => {
    uploadIds = ids;
    let closeActive = false;
    if (snapshot.transition != null && !ids.includes(snapshot.transition.targetUploadId)) completeTransition(snapshot.transition);
    for (const entry of entries.values()) {
      if (entry.saving == null && entry.uploadId != null && !ids.includes(entry.uploadId)) {
        closeActive ||= snapshot.active === entry;
        if (entry.undoRetentionCount === 0) remove(entry);
      }
    }
    if (closeActive) close();
  });

  function openNew(onSave?: () => void): boolean {
    const environment = getEnvironment();
    if (!available() || !environment.canOpenSketch || snapshot.active != null) return false;
    let entry = history.at(-1);
    if (entry == null) {
      entry = {
        id: options.createId?.() ?? crypto.randomUUID(),
        editor: (options.createEditor ?? createSketchEditor)({ style: { color: environment.isDarkMode ? "#ffffff" : "#000000" } }),
        uploadId: null, fileName: null, savedDocument: null, saving: null, undoRetentionCount: 0, onSave,
      };
      entries.set(entry.id, entry);
      history.push(entry);
    } else entry.onSave = onSave;
    if (snapshot.transition != null) completeTransition(snapshot.transition);
    publish({ active: entry, confirmingDiscard: false });
    uploads.track("opened");
    return true;
  }

  function openAttachment(uploadId: string): boolean {
    if (!available() || !getEnvironment().canEditSketch || !uploadIds.includes(uploadId)) return false;
    const entry = [...entries.values()].find((item) => item.uploadId === uploadId);
    if (entry == null || entry.saving != null) return false;
    publish({ active: entry, confirmingDiscard: false });
    uploads.track("reopened");
    return true;
  }

  function retainAttachmentForUndo(uploadId: string): (() => void) | undefined {
    const entry = [...entries.values()].find((item) => item.uploadId === uploadId);
    if (entry == null || entry.saving != null || !uploadIds.includes(uploadId)) return;
    entry.undoRetentionCount += 1;
    return () => {
      const current = entries.get(entry.id);
      if (current != null && --current.undoRetentionCount === 0 && !uploadIds.includes(uploadId)) remove(current);
    };
  }

  function discard(): void {
    const entry = snapshot.active;
    if (entry == null || entry.saving != null) return;
    if (entry.savedDocument == null) remove(entry);
    else {
      entry.onSave = undefined;
      entry.editor.replaceDocument(entry.savedDocument);
    }
    close();
  }

  function requestClose(callback?: () => void): void {
    const entry = snapshot.active;
    if (!available() || entry == null || entry.saving != null) return;
    const current = entry.editor.getSnapshot();
    const dirty = current.hasActiveGesture ||
      (entry.savedDocument == null ? current.effectiveDocument.objects.length > 0 : !documentsEqual(current.effectiveDocument, entry.savedDocument));
    if (dirty) {
      keepEditingCallback = callback;
      publish({ confirmingDiscard: true });
    } else discard();
  }

  async function save(): Promise<void> {
    const entry = snapshot.active;
    const environment = getEnvironment();
    if (!available() || entry == null || entry.saving != null || entry.editor.getSnapshot().hasActiveGesture ||
      !environment.canEditSketch || (entry.uploadId == null && !environment.canOpenSketch)) return;
    entry.editor.commitPendingTextEdit();
    const document = entry.editor.getSnapshot().document;
    if (document.objects.length === 0) return;
    if (entry.savedDocument != null && documentsEqual(document, entry.savedDocument)) {
      entry.editor.replaceDocument(document);
      close();
      return;
    }
    const controller = new AbortController();
    entry.saving = controller;
    publish({ confirmingDiscard: false });
    let queuedId: string | null = null;
    let completed = false;
    const finish = (status: UploadStatus) => {
      completed = true;
      if (!available()) return;
      entry.saving = null;
      if (status === "success" && queuedId != null) {
        entry.uploadId = queuedId;
        entry.savedDocument = document;
        uploads.track("saveCompleted");
      } else if (status === "canceled") remove(entry);
      else if (entry.uploadId == null && !history.includes(entry)) history.push(entry);
      if (snapshot.active == null && status !== "canceled" && status !== "success") publish({ active: entry });
      publish({});
    };
    try {
      const result = await entry.editor.export({
        backgroundColor: environment.isDarkMode ? "#212121" : "#ffffff",
        padding: 36, scale: 1, mimeType: "image/png",
      });
      if (!available() || controller.signal.aborted) return;
      if (result.kind !== "success") {
        finish("error");
        return;
      }
      const fileName = entry.fileName ?? uploads.createFileName();
      await uploads.save(new File([result.blob], fileName, { type: "image/png" }), {
        id: entry.id,
        replaceUploadId: entry.uploadId,
        signal: controller.signal,
        isAvailable: () => available() && getEnvironment().canEditSketch &&
          (entry.uploadId != null || queuedId != null || getEnvironment().canOpenSketch),
        onQueued: (id) => {
          queuedId = id;
          entry.fileName = fileName;
          const index = history.indexOf(entry);
          if (index !== -1) history.splice(index, 1);
          if (snapshot.active === entry) close();
          const callback = entry.onSave;
          entry.onSave = undefined;
          callback?.();
        },
        onComplete: finish,
      });
    } catch {
      if (!completed) finish(controller.signal.aborted ? "canceled" : "error");
    } finally {
      entry.saving = null;
      if (available()) publish({});
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    openNew,
    openAttachment,
    retainAttachmentForUndo,
    requestClose,
    discard,
    keepEditing() {
      const callback = keepEditingCallback;
      keepEditingCallback = undefined;
      publish({ confirmingDiscard: false });
      callback?.();
    },
    save,
    completeTransition,
    dispose() {
      disposed = true;
      keepEditingCallback = undefined;
      unsubscribe();
      listeners.clear();
      if (snapshot.transition != null) completeTransition(snapshot.transition);
      for (const entry of [...entries.values()]) {
        entry.saving?.abort();
        remove(entry);
      }
    },
  };
}

export { createSketchComposerState };
