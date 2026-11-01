import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { $3: getCompilerRuntime, I3: getJsxRuntime } = appSharedChunk;
const {
  D3t: initializeDocumentIcon,
  E3t: SpreadsheetIcon,
  O3t: DocumentIcon,
  T3t: initializePresentationIcon,
  f3t: DriveIcon,
  k3t: initializeSpreadsheetIcon,
  p3t: initializeDriveIcon,
  w3t: PresentationIcon,
} = appInitialChunk;
let jsx: JsxRuntime;
interface CompilerRuntime {
  c(size: number): unknown[];
}
let compilerRuntime: CompilerRuntime;

function GoogleDriveResourceIcon({
  className,
  resourceKind,
}: {
  className?: string;
  resourceKind: "document" | "drive" | "presentation" | "spreadsheet";
}): unknown {
  initializeGoogleDriveResourceIcon();
  const cache = compilerRuntime.c(8);
  const renderCached = (
    offset: number,
    component: unknown,
  ): unknown => {
    if (cache[offset] !== className) {
      cache[offset] = className;
      cache[offset + 1] = jsx.jsx(component, { className });
    }
    return cache[offset + 1];
  };
  switch (resourceKind) {
    case "document":
      return renderCached(0, DocumentIcon);
    case "spreadsheet":
      return renderCached(2, SpreadsheetIcon);
    case "presentation":
      return renderCached(4, PresentationIcon);
    case "drive":
      return renderCached(6, DriveIcon);
  }
}

let initialized = false;
function initializeGoogleDriveResourceIcon(): void {
  if (initialized) return;
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSpreadsheetIcon();
  initializeDocumentIcon();
  initializePresentationIcon();
  initializeDriveIcon();
  jsx = getJsxRuntime();
  initialized = true;
}
export { initializeGoogleDriveResourceIcon as n, GoogleDriveResourceIcon as t };
