import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { I3: getJsxRuntime } = appSharedChunk;
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

function GoogleDriveResourceIcon({
  className,
  resourceKind,
}: {
  className?: string;
  resourceKind: "document" | "drive" | "presentation" | "spreadsheet";
}): unknown {
  initializeGoogleDriveResourceIcon();
  if (resourceKind === "document") return jsx.jsx(DocumentIcon, { className });
  if (resourceKind === "spreadsheet")
    return jsx.jsx(SpreadsheetIcon, { className });
  if (resourceKind === "presentation")
    return jsx.jsx(PresentationIcon, { className });
  if (resourceKind === "drive") return jsx.jsx(DriveIcon, { className });
  return undefined;
}

let initialized = false;
function initializeGoogleDriveResourceIcon(): void {
  if (initialized) return;
  initializeSpreadsheetIcon();
  initializeDocumentIcon();
  initializePresentationIcon();
  initializeDriveIcon();
  jsx = getJsxRuntime();
  initialized = true;
}
initializeGoogleDriveResourceIcon();
export { initializeGoogleDriveResourceIcon as n, GoogleDriveResourceIcon as t };
