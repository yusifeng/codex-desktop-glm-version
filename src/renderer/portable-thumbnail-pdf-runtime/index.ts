import "@rchunk/app-shared";
import {
  n as initializePortableThumbnailPdf,
  t as getPdfjsExport,
} from "@rchunk/portable-thumbnail-pdf-document";

initializePortableThumbnailPdf();
const getPdfjs = getPdfjsExport;
export { getPdfjs };
