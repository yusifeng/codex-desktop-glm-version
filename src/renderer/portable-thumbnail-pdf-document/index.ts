import "@rchunk/rolldown-runtime";
import { $3 as initializeCompilerRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";

interface PdfDocumentProxy {
  destroyed?: boolean;
  numPages: number;
  destroy(): void;
  getPage(pageNumber: number): Promise<{ getViewport(options: { scale: number }): { height: number; width: number } }>;
}
interface PdfJsRuntime {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(options: { data: Uint8Array }): { promise: Promise<PdfDocumentProxy>; destroy?(): void; destroyed?: boolean };
}
interface PdfDocumentState {
  loadedFileDataUrl: string | null;
  loadState: "error" | "loading" | "ready";
  loadStateFileDataUrl: string;
  numPages: number;
  pageViewportSize: { height: number; width: number } | null;
  pdfDocument: PdfDocumentProxy | null;
}

const React = getReactRuntime();
const workerSource = new URL("pdf.worker.min-2ac0aeeaff32.mjs", typeof window === "undefined" ? "https://desktop.invalid/" : import.meta.url).toString();
let pdfRuntimePromise: Promise<PdfJsRuntime> | null = null;
let workerConfigured = false;

async function loadPdfJs(): Promise<PdfJsRuntime> {
  if (typeof window === "undefined") throw new Error("pdf.js can only be loaded in the browser");
  pdfRuntimePromise ??= import("@rchunk/portable-pdfjs-runtime") as Promise<PdfJsRuntime>;
  const runtime = await pdfRuntimePromise;
  if (!workerConfigured || runtime.GlobalWorkerOptions.workerSrc !== workerSource) {
    runtime.GlobalWorkerOptions.workerSrc = workerSource;
    workerConfigured = true;
  }
  return runtime;
}

function decodePdfDataUrl(value: string): Uint8Array | null {
  const marker = value.indexOf("base64,");
  if (!value.startsWith("data:") || marker < 0) return null;
  let decoded: string;
  try { decoded = window.atob(value.slice(marker + 7)); } catch { return null; }
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function usePdfDocument({ fileDataUrl }: { fileDataUrl: string }): PdfDocumentState {
  const [loadedFileDataUrl, setLoadedFileDataUrl] = React.useState<string | null>(null);
  const [loadState, setLoadState] = React.useState<PdfDocumentState["loadState"]>("loading");
  const [loadStateFileDataUrl, setLoadStateFileDataUrl] = React.useState(fileDataUrl);
  const [numPages, setNumPages] = React.useState(0);
  const [pageViewportSize, setPageViewportSize] = React.useState<PdfDocumentState["pageViewportSize"]>(null);
  const [pdfDocument, setPdfDocument] = React.useState<PdfDocumentProxy | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<PdfJsRuntime["getDocument"]> | null = null;
    setLoadedFileDataUrl(null); setLoadStateFileDataUrl(fileDataUrl); setLoadState("loading");
    setNumPages(0); setPageViewportSize(null); setPdfDocument(null);
    void (async () => {
      try {
        const runtime = await loadPdfJs();
        if (cancelled) return;
        const data = decodePdfDataUrl(fileDataUrl);
        if (data == null) { setLoadState("error"); return; }
        loadingTask = runtime.getDocument({ data });
        const document = await loadingTask.promise;
        if (cancelled) { document.destroy(); return; }
        if (!Number.isSafeInteger(document.numPages) || document.numPages <= 0) { document.destroy(); setLoadState("error"); return; }
        const viewport = (await document.getPage(1)).getViewport({ scale: 1 });
        if (cancelled) { document.destroy(); return; }
        setPdfDocument(document); setLoadedFileDataUrl(fileDataUrl); setNumPages(document.numPages);
        setPageViewportSize({ height: viewport.height, width: viewport.width }); setLoadState("ready");
      } catch { if (!cancelled) { setPdfDocument(null); setLoadedFileDataUrl(null); setNumPages(0); setPageViewportSize(null); setLoadState("error"); } }
    })();
    return () => { cancelled = true; if (loadingTask != null && !loadingTask.destroyed) loadingTask.destroy?.(); };
  }, [fileDataUrl]);
  return { loadedFileDataUrl, loadState, loadStateFileDataUrl, numPages, pageViewportSize, pdfDocument };
}

function initializePortablePdfDocument(): void { initializeCompilerRuntime(); }

export { initializePortablePdfDocument as n, usePdfDocument as r, loadPdfJs as t };
