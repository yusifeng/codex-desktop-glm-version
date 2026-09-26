// portable-attachment-thumbnail —— Composer 附件缩略图调度器。
//
// 原版：app/webview/assets/portable-attachment-thumbnail-a0a0861523f3.js。
// 这里只负责校验、限流、取消、超时、worker 装配和 Blob → data URL；PDF、
// Office 与表格的实际首屏渲染仍在独立 worker chunk 中完成。

import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export type PortableAttachmentImportKind =
  | "csv"
  | "docx"
  | "ipynb"
  | "pdf"
  | "pptx"
  | "tex"
  | "tsv"
  | "xlsx";

export interface PortableAttachmentThumbnailRequest {
  importKind: PortableAttachmentImportKind | null;
  readBytes(signal: AbortSignal): Promise<Uint8Array>;
  signal: AbortSignal;
  size?: number;
}

export type PortableAttachmentThumbnailFailureReason =
  | "overloaded"
  | "timeout"
  | "unsupported";

export interface PortableAttachmentThumbnailResult {
  byteLength?: number;
  dataUrl: string | null;
  reason?: PortableAttachmentThumbnailFailureReason;
}

interface PendingThumbnailJob extends Required<Pick<PortableAttachmentThumbnailRequest, "readBytes" | "signal">> {
  cancel(): void;
  importKind: Exclude<PortableAttachmentImportKind, "ipynb" | "tex">;
  resolve(result: PortableAttachmentThumbnailResult): void;
  size: number;
}

interface PdfRuntimeModule {
  getPdfjs(): Promise<{
    GlobalWorkerOptions: { workerSrc?: string };
  }>;
}

interface SpreadsheetFontsModule {
  ensurePopcornSpreadsheetFontsLoaded(): Promise<void>;
}

interface FontFaceSourcesModule {
  getPopcornCarlitoFontFaceSourcesFromDocument(): unknown[];
}

interface ThumbnailWorkerRequest {
  bytes: Uint8Array;
  fonts: unknown[];
  importKind: PendingThumbnailJob["importKind"];
  pdfWorkerSrc?: string;
  resourceBaseUrl: string;
  size: number;
}

const MAX_PENDING_JOBS = 16;
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const RENDER_TIMEOUT_MS = 15_000;
const MAX_THUMBNAIL_SIZE = 352;

const pendingJobs: PendingThumbnailJob[] = [];
let processingJob = false;

function supportsThumbnailRendering(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.convertToBlob === "function"
  );
}

function byteLengthFromError(error: unknown): number | undefined {
  if (typeof error !== "object" || error == null || !("byteLength" in error)) return undefined;
  const byteLength = (error as { byteLength?: unknown }).byteLength;
  return typeof byteLength === "number" && Number.isFinite(byteLength) ? byteLength : undefined;
}

async function loadWorkerDependencies(
  importKind: PendingThumbnailJob["importKind"],
): Promise<{ fonts: unknown[]; pdfWorkerSrc?: string }> {
  if (importKind === "pdf") {
    const pdfRuntime = await import("@rchunk/portable-thumbnail-pdf-runtime") as PdfRuntimeModule;
    const pdfjs = await pdfRuntime.getPdfjs();
    return { fonts: [], pdfWorkerSrc: pdfjs.GlobalWorkerOptions.workerSrc };
  }

  const [fontsRuntime, fontFaceSources] = await Promise.all([
    import("@rchunk/portable-thumbnail-fonts") as Promise<SpreadsheetFontsModule>,
    import("@rchunk/portable-thumbnail-font-face-sources") as Promise<FontFaceSourcesModule>,
  ]);
  await fontsRuntime.ensurePopcornSpreadsheetFontsLoaded();
  return { fonts: fontFaceSources.getPopcornCarlitoFontFaceSourcesFromDocument() };
}

function renderJob(job: PendingThumbnailJob): Promise<PortableAttachmentThumbnailResult> {
  return new Promise((resolve) => {
    const readController = new AbortController();
    let worker: Worker | undefined;
    let fileReader: FileReader | undefined;
    let byteLength: number | undefined;
    let finished = false;

    const finish = (result: PortableAttachmentThumbnailResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      job.signal.removeEventListener("abort", abort);
      readController.abort();
      worker?.terminate();
      fileReader?.abort();
      resolve(result);
    };
    const abort = () => finish({ byteLength, dataUrl: null });
    const fail = () => finish({ byteLength, dataUrl: null });
    const timeout = setTimeout(
      () => finish({ byteLength, dataUrl: null, reason: "timeout" }),
      RENDER_TIMEOUT_MS,
    );

    job.signal.addEventListener("abort", abort, { once: true });
    if (job.signal.aborted) {
      abort();
      return;
    }

    void (async () => {
      try {
        const bytes = await job.readBytes(readController.signal);
        if (finished) return;
        byteLength = bytes.byteLength;
        if (byteLength === 0 || byteLength > MAX_SOURCE_BYTES) {
          finish({ byteLength, dataUrl: null });
          return;
        }

        const dependencies = await loadWorkerDependencies(job.importKind);
        if (finished) return;
        const transferableBytes = bytes.slice();
        const workerRequest: ThumbnailWorkerRequest = {
          bytes: transferableBytes,
          fonts: dependencies.fonts,
          importKind: job.importKind,
          pdfWorkerSrc: dependencies.pdfWorkerSrc,
          resourceBaseUrl: location.href,
          size: job.size,
        };
        worker = new Worker(
          new URL("./portable-attachment-thumbnail.worker-239d300eaa56.js", import.meta.url),
          { name: "composer-attachment-thumbnail", type: "module" },
        );
        worker.onerror = fail;
        worker.onmessageerror = fail;
        worker.onmessage = ({ data }: MessageEvent<Blob | null>) => {
          if (data == null) {
            fail();
            return;
          }
          fileReader = new FileReader();
          fileReader.onerror = fail;
          const activeReader = fileReader;
          activeReader.onload = () => {
            if (typeof activeReader.result === "string") {
              finish({ byteLength, dataUrl: activeReader.result });
            } else {
              fail();
            }
          };
          activeReader.readAsDataURL(data);
        };
        worker.postMessage(workerRequest, [transferableBytes.buffer as ArrayBuffer]);
      } catch (error) {
        const rejectedByteLength = byteLengthFromError(error);
        finish({ byteLength: rejectedByteLength ?? byteLength, dataUrl: null });
      }
    })();
  });
}

function processNextJob(): void {
  if (processingJob) return;
  const job = pendingJobs.shift();
  if (job == null) return;
  processingJob = true;
  job.signal.removeEventListener("abort", job.cancel);
  void renderJob(job).then((result) => {
    job.resolve(result);
    processingJob = false;
    processNextJob();
  });
}

/** 原 `a`：串行生成附件缩略图，并在队列拥塞时快速降级。 */
export function renderPortableAttachmentThumbnail({
  importKind,
  readBytes,
  signal,
  size = MAX_THUMBNAIL_SIZE,
}: PortableAttachmentThumbnailRequest): Promise<PortableAttachmentThumbnailResult> {
  if (
    signal.aborted ||
    importKind == null ||
    importKind === "ipynb" ||
    importKind === "tex" ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > MAX_THUMBNAIL_SIZE
  ) {
    return Promise.resolve({ dataUrl: null });
  }
  if (!supportsThumbnailRendering()) {
    return Promise.resolve({ dataUrl: null, reason: "unsupported" });
  }
  if (pendingJobs.length >= MAX_PENDING_JOBS) {
    return Promise.resolve({ dataUrl: null, reason: "overloaded" });
  }

  return new Promise((resolve) => {
    const job: PendingThumbnailJob = {
      cancel: () => {
        const index = pendingJobs.indexOf(job);
        if (index === -1) return;
        pendingJobs.splice(index, 1);
        signal.removeEventListener("abort", job.cancel);
        resolve({ dataUrl: null });
      },
      importKind,
      readBytes,
      resolve,
      signal,
      size: Math.max(1, Math.round(size)),
    };
    signal.addEventListener("abort", job.cancel, { once: true });
    pendingJobs.push(job);
    processNextJob();
  });
}
