// portable-attachment-thumbnail.worker —— Composer 附件首屏缩略图渲染 worker。
//
// 原版：app/webview/assets/portable-attachment-thumbnail.worker-239d300eaa56.js。
// 支持 PDF、PPTX、DOCX、XLSX、CSV 与 TSV；所有格式最终都在
// OffscreenCanvas 上渲染并返回 PNG Blob。

export type ThumbnailImportKind =
  | "csv"
  | "docx"
  | "ipynb"
  | "pdf"
  | "pptx"
  | "tex"
  | "tsv"
  | "xlsx";

export interface AttachmentThumbnailWorkerRequest {
  bytes: Uint8Array;
  fonts: readonly unknown[];
  importKind: ThumbnailImportKind;
  pdfWorkerSrc?: string;
  resourceBaseUrl: string;
  size: number;
}

interface ThumbnailWorkerScope {
  onmessage: ((event: MessageEvent<AttachmentThumbnailWorkerRequest>) => void) | null;
  postMessage(message: Blob | null): void;
}

interface FrameLike {
  height: number;
  width: number;
}

interface PresentationSlideLike {
  frame: FrameLike;
}

interface PresentationLike {
  slides: { items: PresentationSlideLike[] };
}

interface PresentationProtoRuntime {
  Presentation: { decode(bytes: Uint8Array): unknown };
}

interface PresentationModelRuntime {
  Presentation: { load(value: unknown): PresentationLike };
  Workbook: {
    fromCSV(text: string, options?: { separator: string }): Promise<unknown> | unknown;
    load(value: unknown): unknown;
  };
  drawSlideToCtx(
    slide: PresentationSlideLike,
    presentation: PresentationLike,
    context: OffscreenCanvasRenderingContext2D,
    resources: readonly unknown[],
  ): Promise<void> | void;
}

interface WorkbookRendererRuntime {
  renderWorkbook(
    workbook: unknown,
    options: {
      center: "A1";
      headers: false;
      height: number;
      scale: 1;
      sheetIndex: 0;
      width: number;
    },
  ): Promise<Blob> | Blob;
}

interface WalnutReaderExports {
  DocxReader: { ExtractDocxProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
  PptxReader: { ExtractSlidesProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
  XlsxReader: { ExtractXlsxProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
}

interface WalnutReaderRuntime {
  getPopcornWalnutReaderExports(resourceBaseUrl: URL): Promise<WalnutReaderExports>;
}

interface DocumentProtoRuntime {
  Document: { decode(bytes: Uint8Array): unknown };
}

interface DocumentPageLike {
  heightPx: number;
  widthPx: number;
}

interface DocumentModelLike {
  pagePaintContext: {
    chartsById: unknown;
    pageBackgroundFill: unknown;
    themeMap: unknown;
  };
}

interface DocumentModelRuntime {
  DocumentModel: { load(value: unknown): DocumentModelLike };
}

interface DocumentRendererRuntime {
  layoutDocumentPages(
    document: DocumentModelLike,
    context: OffscreenCanvasRenderingContext2D,
  ): DocumentPageLike[];
  paintRenderedDocumentPage(
    context: OffscreenCanvasRenderingContext2D,
    page: DocumentPageLike,
    themeMap: unknown,
    chartsById: unknown,
    pageBackgroundFill: unknown,
    images: ReadonlyMap<unknown, ImageBitmap>,
    selection: undefined,
    options: { drawPageOutline: false },
  ): void;
  preloadDocumentImageBitmaps(
    document: DocumentModelLike,
    pages: readonly DocumentPageLike[],
  ): Promise<ReadonlyMap<unknown, ImageBitmap>>;
}

interface SpreadsheetProtoRuntime {
  Workbook: { decode(bytes: Uint8Array): unknown };
}

interface PdfViewport {
  height: number;
  width: number;
}

interface PdfPage {
  getViewport(options: { scale: number }): PdfViewport;
  render(options: {
    canvas: null;
    canvasContext: OffscreenCanvasRenderingContext2D;
    viewport: PdfViewport;
  }): { promise: Promise<void> };
}

interface PdfLoadingTask {
  destroy(): Promise<void>;
  promise: Promise<{ getPage(pageNumber: 1): Promise<PdfPage> }>;
}

interface PdfRuntime {
  GlobalWorkerOptions: { workerPort?: Worker };
  getDocument(options: {
    CanvasFactory: typeof ThumbnailCanvasFactory;
    data: Uint8Array;
    disableFontFace: true;
    isEvalSupported: false;
  }): PdfLoadingTask;
}

interface CanvasAndContext {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
}

function createThumbnailCanvas(width: number, height: number, maxSize: number): CanvasAndContext {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Thumbnail page dimensions invalid");
  }
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  );
  const context = canvas.getContext("2d");
  if (context == null) throw new Error("Thumbnail canvas unavailable");
  context.scale(scale, scale);
  return { canvas, context };
}

class ThumbnailCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    if (width <= 0 || height <= 0 || width * height > 16_777_216) {
      throw new Error("Thumbnail intermediate canvas too large");
    }
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (context == null) throw new Error("Thumbnail canvas unavailable");
    return { canvas, context };
  }

  reset(target: CanvasAndContext, width: number, height: number): void {
    if (width <= 0 || height <= 0 || width * height > 16_777_216) {
      throw new Error("Thumbnail intermediate canvas too large");
    }
    target.canvas.width = width;
    target.canvas.height = height;
  }

  destroy(target: CanvasAndContext): void {
    target.canvas.width = 0;
    target.canvas.height = 0;
  }
}

async function renderPdfThumbnail({
  bytes,
  pdfWorkerSrc,
  size,
}: AttachmentThumbnailWorkerRequest): Promise<Blob> {
  if (pdfWorkerSrc == null) throw new Error("PDF thumbnail worker source unavailable");
  const pdfRuntime = await import("@rchunk/thumbnail-worker-pdf-runtime") as PdfRuntime;
  const pdfWorker = new Worker(pdfWorkerSrc, { type: "module" });
  try {
    pdfRuntime.GlobalWorkerOptions.workerPort = pdfWorker;
    const loadingTask = pdfRuntime.getDocument({
      CanvasFactory: ThumbnailCanvasFactory,
      data: bytes,
      disableFontFace: true,
      isEvalSupported: false,
    });
    try {
      const page = await (await loadingTask.promise).getPage(1);
      const naturalViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1, size / Math.max(naturalViewport.width, naturalViewport.height));
      const canvas = new OffscreenCanvas(
        Math.max(1, Math.round(naturalViewport.width * scale)),
        Math.max(1, Math.round(naturalViewport.height * scale)),
      );
      const context = canvas.getContext("2d");
      if (context == null) throw new Error("Thumbnail canvas unavailable");
      await page.render({
        canvas: null,
        canvasContext: context,
        viewport: page.getViewport({ scale }),
      }).promise;
      return await canvas.convertToBlob({ type: "image/png" });
    } finally {
      await loadingTask.destroy();
    }
  } finally {
    pdfWorker.terminate();
  }
}

async function renderWorkbookThumbnail(
  workbook: unknown,
  size: number,
  workbookRenderer: WorkbookRendererRuntime,
): Promise<Blob> {
  return await workbookRenderer.renderWorkbook(workbook, {
    center: "A1",
    headers: false,
    height: Math.round(size * 9 / 16),
    scale: 1,
    sheetIndex: 0,
    width: size,
  });
}

async function renderAttachmentThumbnail(
  request: AttachmentThumbnailWorkerRequest,
): Promise<Blob | null> {
  if (request.importKind === "pdf") return renderPdfThumbnail(request);

  const [fontFaces, shapePresets] = await Promise.all([
    import("@rchunk/thumbnail-worker-font-faces"),
    import("@rchunk/thumbnail-worker-shape-presets"),
  ]);
  await fontFaces.installPopcornFontFaces(request.fonts);
  shapePresets.installPresetShapeDefinitions();

  if (request.importKind === "csv" || request.importKind === "tsv") {
    const [presentationModel, workbookRenderer] = await Promise.all([
      import("@rchunk/thumbnail-worker-presentation-model") as Promise<PresentationModelRuntime>,
      import("@rchunk/thumbnail-worker-workbook-renderer") as Promise<WorkbookRendererRuntime>,
    ]);
    const workbook = await presentationModel.Workbook.fromCSV(
      new TextDecoder().decode(request.bytes),
      request.importKind === "tsv" ? { separator: "\t" } : undefined,
    );
    return renderWorkbookThumbnail(workbook, request.size, workbookRenderer);
  }

  const walnutReader = await import("@rchunk/thumbnail-worker-walnut-reader") as WalnutReaderRuntime;
  const readers = await walnutReader.getPopcornWalnutReaderExports(new URL(request.resourceBaseUrl));

  switch (request.importKind) {
    case "pptx": {
      const [presentationProto, presentationModel] = await Promise.all([
        import("@rchunk/thumbnail-worker-presentation-proto") as Promise<PresentationProtoRuntime>,
        import("@rchunk/thumbnail-worker-presentation-model") as Promise<PresentationModelRuntime>,
      ]);
      const presentation = presentationModel.Presentation.load(
        presentationProto.Presentation.decode(
          readers.PptxReader.ExtractSlidesProto(request.bytes, false),
        ),
      );
      const slide = presentation.slides.items[0];
      if (slide == null) return null;
      const { canvas, context } = createThumbnailCanvas(
        slide.frame.width,
        slide.frame.height,
        request.size,
      );
      await presentationModel.drawSlideToCtx(slide, presentation, context, []);
      return await canvas.convertToBlob({ type: "image/png" });
    }
    case "docx": {
      const [documentProto, documentModel, documentRenderer] = await Promise.all([
        import("@rchunk/thumbnail-worker-document-proto") as Promise<DocumentProtoRuntime>,
        import("@rchunk/thumbnail-worker-document-model") as Promise<DocumentModelRuntime>,
        import("@rchunk/thumbnail-worker-document-renderer") as Promise<DocumentRendererRuntime>,
      ]);
      const document = documentModel.DocumentModel.load(
        documentProto.Document.decode(readers.DocxReader.ExtractDocxProto(request.bytes, false)),
      );
      const measuringContext = new OffscreenCanvas(1, 1).getContext("2d");
      if (measuringContext == null) return null;
      const page = documentRenderer.layoutDocumentPages(document, measuringContext)[0];
      if (page == null) return null;
      const images = await documentRenderer.preloadDocumentImageBitmaps(document, [page]);
      try {
        const { canvas, context } = createThumbnailCanvas(page.widthPx, page.heightPx, request.size);
        const { chartsById, pageBackgroundFill, themeMap } = document.pagePaintContext;
        documentRenderer.paintRenderedDocumentPage(
          context,
          page,
          themeMap,
          chartsById,
          pageBackgroundFill,
          images,
          undefined,
          { drawPageOutline: false },
        );
        return await canvas.convertToBlob({ type: "image/png" });
      } finally {
        for (const image of images.values()) image.close();
      }
    }
    case "xlsx": {
      const [spreadsheetProto, presentationModel, workbookRenderer] = await Promise.all([
        import("@rchunk/thumbnail-worker-spreadsheet-proto") as Promise<SpreadsheetProtoRuntime>,
        import("@rchunk/thumbnail-worker-presentation-model") as Promise<PresentationModelRuntime>,
        import("@rchunk/thumbnail-worker-workbook-renderer") as Promise<WorkbookRendererRuntime>,
      ]);
      const workbook = presentationModel.Workbook.load(
        spreadsheetProto.Workbook.decode(
          readers.XlsxReader.ExtractXlsxProto(request.bytes, false),
        ),
      );
      return renderWorkbookThumbnail(workbook, request.size, workbookRenderer);
    }
    case "ipynb":
    case "tex":
      return null;
  }
}

const workerScope = globalThis as unknown as ThumbnailWorkerScope;
workerScope.onmessage = ({ data }) => {
  void renderAttachmentThumbnail(data)
    .then((thumbnail) => workerScope.postMessage(thumbnail))
    .catch(() => workerScope.postMessage(null));
};
